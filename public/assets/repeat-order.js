const CURRENCIES = new Set(['RUB', 'KZT', 'UAH', 'DONUTS']);

function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const platform = typeof raw.platform === 'string' ? raw.platform.trim() : '';
  const amount = Number(raw.amount);
  if (!platform || !Number.isFinite(amount) || amount <= 0) return null;
  const currency = typeof raw.currency === 'string' && CURRENCIES.has(raw.currency.toUpperCase())
    ? raw.currency.toUpperCase()
    : 'RUB';
  const item = {
    platform,
    productName: typeof raw.productName === 'string' ? raw.productName.trim() : '',
    region: typeof raw.region === 'string' ? raw.region.trim() : '',
    login: typeof raw.login === 'string' ? raw.login.trim() : '',
    currency,
    amount: Math.round(amount * 100) / 100
  };
  if (raw.sourceRow != null && Number.isSafeInteger(Number(raw.sourceRow))) {
    item.sourceRow = Number(raw.sourceRow);
  }
  if (raw.paymentMethod === 'donuts' || raw.paymentMethod === 'bonus') {
    const bonusAmount = Number(raw.bonusAmount);
    if (Number.isFinite(bonusAmount) && bonusAmount > 0) {
      item.paymentMethod = 'donuts';
      item.bonusAmount = Math.round(bonusAmount * 100) / 100;
    } else if (raw.paymentMethod === 'bonus' && currency === 'DONUTS') {
      item.paymentMethod = 'bonus';
    }
  }
  if (typeof raw.extraLabel === 'string' && raw.extraLabel.trim() && typeof raw.extraValue === 'string' && raw.extraValue.trim()) {
    item.extraLabel = raw.extraLabel.trim();
    item.extraValue = raw.extraValue.trim();
  }
  if (Number.isSafeInteger(Number(raw.stars)) && Number(raw.stars) > 0) {
    item.stars = Number(raw.stars);
  }
  return item;
}

export function buildRepeatCartItems(order) {
  if (!order || typeof order !== 'object') return [];
  let rawItems = [];
  if (Array.isArray(order.items)) {
    rawItems = order.items;
  } else if (typeof order.items === 'string') {
    try {
      const parsed = JSON.parse(order.items);
      if (Array.isArray(parsed)) rawItems = parsed;
    } catch { /* fallback below */ }
  }
  const structured = rawItems.map(normalizeItem).filter(Boolean);
  if (structured.length) return structured;

  const rub = Math.round(Number(order.rub_amount || 0) * 100) / 100;
  const bonus = Math.round(Number(order.bonus_amount || 0) * 100) / 100;
  if (!(rub > 0) && !(bonus > 0)) return [];

  const desc = typeof order.description === 'string' ? order.description.trim() : '';
  let platform = 'Повтор заказа № ' + String(order.id ?? '').trim();
  let productName = '';
  if (desc) {
    const sep = desc.indexOf(' · ');
    if (sep > 0) {
      platform = desc.slice(0, sep).trim();
      productName = desc.slice(sep + 3).trim();
    } else {
      platform = desc;
    }
  }

  if (rub > 0 && bonus > 0) {
    return [{
      platform,
      productName,
      region: '',
      login: '',
      currency: 'RUB',
      amount: rub,
      paymentMethod: 'donuts',
      bonusAmount: bonus
    }];
  }
  if (rub > 0) {
    return [{
      platform,
      productName,
      region: '',
      login: '',
      currency: 'RUB',
      amount: rub
    }];
  }
  return [{
    platform,
    productName,
    region: '',
    login: '',
    currency: 'DONUTS',
    amount: bonus,
    paymentMethod: 'bonus'
  }];
}
