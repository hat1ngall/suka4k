import {addToCart} from './secondary-header.js?v=1';
import {priceLists} from './price-list.js?v=4';
import {buildDonutProducts} from './donuts-data.js';

const list = document.querySelector('#donut-products');
try {
  // Fail closed: do not offer stale bonus prices when live overrides cannot load.
  const response = await fetch('/api/catalog/item-prices', {cache:'no-store'});
  if (!response.ok) throw Error();
  const {prices} = await response.json();
  for (const row of prices) {
    const item = Object.values(priceLists[row.product_name] || {}).flat().find(item => item.sourceRow === row.source_row);
    if (item) item.priceRub = Number(row.price_rub);
  }
  const products = buildDonutProducts(priceLists);
  const categoryOf = item => item.sourceRow === 84 ? 'PUBG: Battlegrounds' : item.platform;
  const categories = [...new Set(products.map(categoryOf))];
  const navigation = document.createElement('div');
  navigation.className = 'donut-navigation';
  const back = document.createElement('a');
  back.href = '#';
  back.textContent = '← Все игры';
  const heading = document.createElement('h3');
  heading.tabIndex = -1;
  navigation.append(back, heading);
  list.before(navigation);

  function render(focus = false) {
    let selected;
    try { selected = decodeURIComponent(location.hash.slice(1)); } catch { selected = ''; }
    const category = categories.includes(selected) ? selected : '';
    back.hidden = !category;
    heading.textContent = category || 'Выбери игру';
    list.replaceChildren();
    if (!category) {
      for (const name of categories) {
        const card = document.createElement('a');
        card.className = 'product donut-product donut-category';
        card.href = '#' + encodeURIComponent(name);
        const icon = document.createElement('img');
        icon.src = '/assets/category-game.svg';
        icon.alt = '';
        icon.width = 56;
        icon.height = 56;
        const title = document.createElement('h3');
        title.textContent = name;
        const count = document.createElement('p');
        count.textContent = 'Вариантов: ' + products.filter(item => categoryOf(item) === name).length;
        const action = document.createElement('span');
        action.className = 'donut-category-action';
        action.textContent = 'Выбрать →';
        card.append(icon, title, count, action);
        list.append(card);
      }
    }
    for (const item of products.filter(item => categoryOf(item) === category)) {
    const card = document.createElement('article');
    card.className = 'product donut-product';
    const game = document.createElement('small');
    game.textContent = item.sourceRow === 84 ? 'PUBG: Battlegrounds' : item.platform;
    const title = document.createElement('h3');
    title.textContent = item.productName;
    const region = document.createElement('p');
    region.textContent = item.region;
    const price = document.createElement('p');
    price.className = 'donut-price';
    price.textContent = item.bonusAmount.toLocaleString('ru-RU') + ' Donuts + 1 ₽';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'primary';
    button.textContent = 'В корзину';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { await addToCart(item); } finally { button.disabled = false; }
    });
    card.append(game, title, region, price, button);
    list.append(card);
    }
    if (focus) heading.focus({preventScroll:true});
  }
  window.addEventListener('hashchange', () => render(true));
  render();
} catch {
  list.textContent = 'Не удалось загрузить актуальные цены. Обнови страницу, чтобы попробовать снова.';
}
