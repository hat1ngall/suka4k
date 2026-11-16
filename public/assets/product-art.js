// Shared, responsive artwork: the actual denomination and region stay readable.
export function createProductArt(game, name, region) {
  const art = document.createElement('div');
  art.className = 'mupple-product-art';
  art.setAttribute('aria-hidden', 'true');
  const palettes = {'Fortnite':'violet','Valorant':'rose','Roblox':'blue','PUBG Mobile':'gold','PUBG: Battlegrounds':'gold','Free Fire':'gold','Standoff 2':'blue','Apex Legends':'rose'};
  art.dataset.palette = palettes[game] || 'violet';
  const brand = document.createElement('span');
  brand.className = 'art-brand';
  brand.textContent = game;
  const value = document.createElement('strong');
  value.className = 'art-value';
  const match = name.match(/^(\d[\d .,]*(?:\+\s*\d+)?)\s*(.*)$/);
  value.textContent = match ? match[1].trim() : name;
  if (value.textContent.length > 10) value.classList.add('art-value-long');
  const unit = document.createElement('span');
  unit.className = 'art-unit';
  unit.textContent = match ? match[2] || 'Игровой баланс' : 'Цифровой товар';
  const badge = document.createElement('span');
  badge.className = 'art-region';
  badge.textContent = region || 'MUPPLE · DIGITAL STORE';
  const coins = document.createElement('span');
  coins.className = 'art-coins';
  for (let i=0;i<3;i++) {
    const coin = document.createElement('i');
    coin.textContent = game === 'Fortnite' ? 'V' : '✦';
    coins.append(coin);
  }
  art.append(brand, coins, value, unit, badge);
  return art;
}
