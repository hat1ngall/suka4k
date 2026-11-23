import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRepeatCartItems } from '../public/assets/repeat-order.js';

test('buildRepeatCartItems restores structured items and handles legacy orders', () => {
  const structured = buildRepeatCartItems({
    id: 'ord-1',
    rub_amount: 1999,
    bonus_amount: 0,
    items: [
      { platform: 'Steam', productName: '', region: 'Россия · RUB', login: 'mylogin', currency: 'RUB', amount: 1000 },
      { platform: 'Fortnite', productName: '800 В-баксов', region: 'Турция', login: '', currency: 'RUB', amount: 499, sourceRow: 2 }
    ]
  });
  assert.equal(structured.length, 2);
  assert.equal(structured[0].login, 'mylogin');
  assert.equal(structured[1].sourceRow, 2);

  const legacyRub = buildRepeatCartItems({
    id: 'ord-2',
    rub_amount: 1499,
    bonus_amount: 0,
    description: 'Fortnite · 2400 В-баксов'
  });
  assert.deepEqual(legacyRub, [{
    platform: 'Fortnite',
    productName: '2400 В-баксов',
    region: '',
    login: '',
    currency: 'RUB',
    amount: 1499
  }]);

  const legacyDonuts = buildRepeatCartItems({
    id: 'ord-3',
    rub_amount: 1,
    bonus_amount: 498,
    description: 'Магазин Donuts · Valorant 475 VP'
  });
  assert.deepEqual(legacyDonuts, [{
    platform: 'Магазин Donuts',
    productName: 'Valorant 475 VP',
    region: '',
    login: '',
    currency: 'RUB',
    amount: 1,
    paymentMethod: 'donuts',
    bonusAmount: 498
  }]);

  const legacyBonusOnly = buildRepeatCartItems({
    id: 'ord-4',
    rub_amount: 0,
    bonus_amount: 300,
    description: null
  });
  assert.deepEqual(legacyBonusOnly, [{
    platform: 'Повтор заказа № ord-4',
    productName: '',
    region: '',
    login: '',
    currency: 'DONUTS',
    amount: 300,
    paymentMethod: 'bonus'
  }]);
});
