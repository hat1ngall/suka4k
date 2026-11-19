// Original publisher artwork and brand assets. No generated currency illustrations.
const base = '/assets/game-art/';
const logos = {
 'Roblox':'roblox','Steam':'steam','Steam Gifts':'steam','PlayStation Store':'playstation',
 'Xbox':'xbox','Apple':'apple','Google Play':'googleplay','Riot Games':'riotgames',
 'Amazon':'amazon','Netflix':'netflix','Electronic Arts':'ea','Battle.net':'battledotnet',
 'Nintendo':'nintendo','Spotify':'spotify','Minecraft':'minecraft','League of Legends':'leagueoflegends',
 'Rockstar Games':'rockstargames','Razer Gold':'razer','Telegram Stars':'telegram','ChatGPT / OpenAI':'openai'
};
export function productArtwork(game, name, region = '') {
 const amount = Number((name.match(/^\d+/) || [])[0]);
 if (game === 'Fortnite' && /в-баксов|v-bucks/i.test(name)) return {image:base + (amount >= 10000 ? 'fortnite-gold.jpg' : amount >= 4000 ? 'fortnite-purple.jpg' : amount >= 2000 ? 'fortnite-blue.jpg' : 'fortnite-1000.jpg'), style:'fortnite'};
 if (game === 'Fortnite') return {logo:base+'epicgames-logo.svg',style:'service'};
 if (game === 'Valorant') return {image:base+'valorant-jett.jpg',logo:base+'valorant-logo.png',style:'valorant'};
 if (game === 'PUBG: Battlegrounds' || /Battlegrounds/.test(region)) return {image:base+'pubg-battlegrounds.jpg',style:'poster'};
 if (game === 'PUBG' || game === 'PUBG Mobile') return {image:base+'pubg-mobile.jpg',style:'pubg'};
 if (game === 'Free Fire') return {image:base+'free-fire-characters.jpg',logo:'/assets/platforms/freefire-logo.png',style:'poster'};
 if (game === 'Apex Legends') return amount === 1000 ? {image:base+'apex-coins.png',style:'printed',printed:true} : {image:base+'apex-keyart.png',style:'poster'};
 if (game === 'Standoff 2') {
  const image = {100:'standoff-100.webp',500:'standoff-gold.webp',1000:'standoff-1000.webp',3000:'standoff-3000.webp'}[amount];
  return image ? {image:base+image,style:'printed',printed:true} : {image:base+'standoff-background.webp',style:'poster'};
 }
 if (game === 'Marvel Rivals') return {image:'/assets/platforms/marvel.jpg',logo:'/assets/platforms/marvel-mark.png',style:'poster'};
 if (game === 'Honkai: Star Rail') return {image:'/assets/platforms/honkai.jpg',logo:'/assets/platforms/honkai-mark.png',style:'poster'};
 return {logo:logos[game] ? base+logos[game]+'-logo.svg' : null, style:game === 'Roblox' ? 'roblox' : 'service'};
}

export function createProductArt(game, name, region) {
 const asset = productArtwork(game, name, region);
 const art = document.createElement('div');
 art.className = 'mupple-product-art game-art-' + asset.style;
 art.setAttribute('aria-hidden','true');
 if (asset.image) {
  const image = document.createElement('img');
  image.className = 'game-art-image';
  image.src = asset.image;
  image.alt = '';
  image.loading = 'lazy';
  image.decoding = 'async';
  art.append(image);
 }
 if (asset.logo) {
  const logo = document.createElement('img');
  logo.className = 'game-art-logo';
  logo.src = asset.logo;
  logo.alt = '';
  art.append(logo);
 } else if (!asset.printed && asset.style !== 'fortnite' && asset.style !== 'pubg') {
  const brand = document.createElement('span');
  brand.className = 'game-art-brand';
  brand.textContent = game;
  art.append(brand);
 }
 if (!asset.printed) {
  const caption = document.createElement('div');
  caption.className = 'game-art-caption';
  const value = document.createElement('strong');
  value.textContent = name;
  if (name.length > 24) value.className = 'game-art-long';
  caption.append(value);
  art.append(caption);
 }
 if (region) {
  const badge = document.createElement('span');
  badge.className = 'game-art-region';
  badge.textContent = region;
  art.append(badge);
 }
 return art;
}
