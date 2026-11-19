// Prices are resolved from the same source rows as the regular catalog.
export const donutSelections = [
  ['Fortnite',2,'800 В-баксов','Турция'],
  ['Fortnite',6,'800 В-баксов','Украина'],
  ['Roblox',691,'300 Robux','Global'],
  ['Valorant',32,'1000 VP','Украина'],
  ['Valorant',55,'1000 VP','Беларусь'],
  ['Valorant',43,'1000 VP','Европа'],
  ['Valorant',14,'1000 VP','Россия'],
  ['Valorant',24,'825 VP','Турция'],
  ['PUBG Mobile',66,'325 UC','Global · Код'],
  ['PUBG Mobile',84,'510 G-Coins','PUBG: Battlegrounds'],
  ['Free Fire',996,'530+53 Diamonds','Global · Код'],
  ['Standoff 2',541,'500 голды','Глобал'],
  ['Apex Legends',886,'1000 Apex Coins','Xbox'],
  ['Apex Legends',881,'1000 Apex Coins','PC'],
];

export function buildDonutProducts(lists) {
  return donutSelections.map(([platform, sourceRow, productName, region]) => {
    const source = Object.values(lists[platform] || {}).flat().find(item => item.sourceRow === sourceRow);
    if (!source || !Number.isFinite(source.priceRub) || source.priceRub <= 1) return null;
    return {platform, sourceRow, productName, region, login:'', currency:'RUB',
      paymentMethod:'donuts', amount:1, bonusAmount:Math.round((source.priceRub - 1) * 100) / 100};
  }).filter(Boolean);
}
