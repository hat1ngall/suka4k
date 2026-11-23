import { addToCart } from './secondary-header.js?v=3';
import { buildRepeatCartItems } from './repeat-order.js?v=1';

const list = document.querySelector('#orders-list');
const summary = document.querySelector('#orders-summary');
const PAGE_SIZE = 50;
const STATUS_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'В обработке',
  fulfilling: 'Выполняется',
  completed: 'Выполнен',
  cancelled: 'Отменён',
  refunded: 'Возврат'
};
const formatAmount = value => Number(value || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const formatStatus = value => STATUS_LABELS[String(value || 'paid').toLowerCase()] || String(value);

function renderOrder(order) {
  const row = document.createElement('article');
  row.className = 'order-row';
  const head = document.createElement('div');
  head.className = 'order-row-head';
  const title = document.createElement('strong');
  title.textContent = 'Заказ № ' + order.id;
  const status = document.createElement('span');
  status.className = 'order-badge';
  status.textContent = formatStatus(order.status);
  head.append(title, status);
  row.append(head);

  const repeatItems = buildRepeatCartItems(order);
  if (order.description) {
    const desc = document.createElement('p');
    desc.className = 'order-desc';
    desc.textContent = order.description;
    row.append(desc);
  } else if (Array.isArray(order.items) && order.items.length) {
    const desc = document.createElement('p');
    desc.className = 'order-desc';
    desc.textContent = repeatItems.map(item => item.productName ? item.platform + ' · ' + item.productName : item.platform).join(', ');
    if (desc.textContent) row.append(desc);
  }

  const foot = document.createElement('div');
  foot.className = 'order-row-foot';
  const meta = document.createElement('div');
  meta.className = 'order-meta';
  const date = document.createElement('p');
  const parsed = new Date(order.paid_at);
  date.textContent = Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  const total = document.createElement('p');
  total.className = 'order-total';
  total.textContent = [
    Number(order.rub_amount) > 0 ? formatAmount(order.rub_amount) + ' ₽' : null,
    Number(order.bonus_amount) > 0 ? formatAmount(order.bonus_amount) + ' Donuts' : null
  ].filter(Boolean).join(' + ');
  if (date.textContent) meta.append(date);
  if (total.textContent) meta.append(total);
  foot.append(meta);

  if (repeatItems.length) {
    const repeat = document.createElement('button');
    repeat.type = 'button';
    repeat.className = 'order-repeat';
    repeat.textContent = 'Повторить заказ';
    repeat.addEventListener('click', async () => {
      repeat.disabled = true;
      try {
        const notice = repeatItems.length > 1
          ? 'Заказ добавлен в корзину (' + repeatItems.length + ')'
          : 'Заказ добавлен в корзину';
        const ok = await addToCart(repeatItems, notice);
        if (ok) {
          repeat.textContent = 'В корзине ✓';
          clearTimeout(repeat._timer);
          repeat._timer = setTimeout(() => { repeat.textContent = 'Повторить заказ'; }, 1600);
        }
      } finally {
        repeat.disabled = false;
      }
    });
    foot.append(repeat);
  }

  row.append(foot);
  return row;
}

let offset = 0;
let moreButton = null;

async function loadOrders(append = false) {
  if (moreButton) moreButton.disabled = true;
  try {
    const response = await fetch(`/api/orders?offset=${offset}&limit=${PAGE_SIZE}`, { credentials: 'same-origin' });
    if (response.status === 401) {
      if (summary) summary.hidden = true;
      list.replaceChildren(
        'Чтобы посмотреть историю заказов, ',
        Object.assign(document.createElement('a'), { href: '/home?account=1', textContent: 'войдите в аккаунт' }),
        '.'
      );
      return;
    }
    if (!response.ok) throw Error();
    const data = await response.json();
    const orders = Array.isArray(data.orders) ? data.orders : [];
    const total = Number.isFinite(Number(data.total)) ? Number(data.total) : orders.length;
    if (summary) {
      summary.replaceChildren('История заказов · Всего: ', Object.assign(document.createElement('strong'), { textContent: total.toLocaleString('ru-RU') }));
      summary.hidden = false;
    }
    if (!append) list.replaceChildren();
    if (moreButton) {
      moreButton.remove();
      moreButton = null;
    }
    if (!append && !orders.length) {
      list.textContent = 'История заказов пока пуста. Здесь будут отображаться все ваши прошлые и текущие заказы.';
      return;
    }
    for (const order of orders) list.append(renderOrder(order));
    offset += orders.length;
    if (data.has_more) {
      moreButton = document.createElement('button');
      moreButton.type = 'button';
      moreButton.className = 'orders-more';
      moreButton.textContent = 'Показать более старые заказы';
      moreButton.addEventListener('click', () => loadOrders(true));
      list.append(moreButton);
    }
  } catch {
    if (moreButton) {
      moreButton.disabled = false;
      return;
    }
    list.textContent = 'Не удалось загрузить заказы. Попробуйте позже.';
  }
}

if (list) loadOrders(false);
