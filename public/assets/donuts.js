import {createProductArt} from './product-art.js?v=2';
import {addToCart} from './secondary-header.js?v=1';
import {priceLists} from './price-list.js?v=6';
import {buildDonutProducts} from './donuts-data.js?v=2';

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
  const account = await fetch('/api/auth/me', {credentials:'same-origin'}).then(r => r.ok ? r.json() : null).catch(() => null);
  const balance = account?.user ? Number(account.user.bonus_balance || 0) : null;
  list.replaceChildren();
  for (const item of buildDonutProducts(priceLists)) {
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
    const bonus = document.createElement('span');
    bonus.className = 'donut-price-bonus';
    const icon = document.createElement('img');
    icon.src = '/assets/donut-cartoon.png';
    icon.alt = 'Donuts';
    icon.width = 26;
    icon.height = 26;
    bonus.append(item.bonusAmount.toLocaleString('ru-RU') + ' ', icon);
    const rubles = document.createElement('span');
    rubles.textContent = '+ 1 ₽';
    price.append(bonus, rubles);
    if (balance !== null && balance < item.bonusAmount) {
      const missing = document.createElement('small');
      missing.className = 'donut-missing';
      missing.textContent = 'Не хватает ' + Math.ceil(item.bonusAmount - balance).toLocaleString('ru-RU') + ' 🍩';
      price.append(missing);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'primary';
    button.textContent = 'В корзину';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { await addToCart(item); } finally { button.disabled = false; }
    });
    const content = document.createElement('div');
    content.className = 'donut-product-content';
    content.append(game, title, region, price, button);
    card.append(createProductArt(game.textContent, item.productName, item.region), content);
    list.append(card);
  }
} catch {
  list.textContent = 'Не удалось загрузить актуальные цены. Обнови страницу, чтобы попробовать снова.';
}
