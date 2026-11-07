// Selection trees transcribed from the supplied catalog specification.
const branch=(label,children)=>({label,children});
const item=label=>({label});
const pending=label=>({label,pending:true});
const items=(values,suffix='')=>values.map(value=>item(String(value)+suffix));
const regions=(names,children)=>names.map(name=>branch(name,children));
const incompleteRegions=names=>names.map(pending);
const fortnite=items(['800 В-баксов','2400 В-баксов','4500 В-баксов','13500 В-баксов','Набор «Час расплаты»','Набор «Идеальная стратегия»','Набор «Бинты и уши»','Набор «Искусный взлом»','Набор «Легенды аниме»','Набор «Отряд Fortnite»']);
const vp=items([240,325,475,1000,1520,1750,2050,2575,3650,5350,8700,11000],' VP');
const ucGlobal=items([60,325,660,1800,3850,8100,16200,24300,32800,40500],' UC');
const ucCodes=items([60,325,660,1800,3850,8100,16200,24300,32400,40500],' UC');
const ucCis=items([60,325,660,1800,3850,8100,16200,24300],' UC');
const countries=s=>s.split('|').map(x=>x.trim());
const giftRegions=countries('Турция|Америка|ЮАР|Бразилия|Европа|Саудовская Аравия|Великобритания|Гонконг|Польша');
const catalog={
 'Fortnite':{heading:'Выбери регион',children:regions(['Россия','Украина'],fortnite)},
 'Valorant':{heading:'Выбери регион',children:[...regions(['Россия','Украина','Беларусь'],vp),branch('Турция',items([325,825,1700,2925,4325,8900],' VP')),branch('Европа',items([240,475,1000,1520,1750,2050,2575,3650,5350,8700,11000],' VP'))]},
 'PUBG Mobile':{title:'PUBG',heading:'Выбери игру',children:[branch('PUBG Mobile',[branch('Global',[branch('Коды',ucCodes),branch('Автопополнение',ucGlobal)]),branch('СНГ',ucCis)]),branch('PUBG: Battlegrounds',items([100,510,1050,2700,5500,11200],' G-Coins'))]},
 'Xbox':{heading:'Выбери категорию',children:[branch('Подарочная карта',incompleteRegions(giftRegions)),branch('Подписка Xbox',incompleteRegions(countries('Индия|Япония|Америка|Европа|Бразилия|Турция|Великобритания|Мексика')))]},
 'PlayStation Store':{heading:'Выбери регион',children:incompleteRegions(countries('Турция|Америка|Польша|Великобритания|Индонезия|Франция|Бразилия|Испания|Япония|Арабские Эмираты'))},
 'Marvel Rivals':{heading:'Выбери количество',children:items([100,500,1000,2180,5680,11680])},
 'Roblox':{heading:'Выбери регион',children:incompleteRegions(countries('Глобал|Турция|Россия|Бразилия|Европа|Америка|Индонезия|Австралия|Гонконг|Саудовская Аравия|Новая Зеландия|Канада|Франция|Польша|Великобритания'))},
 'Apple':{heading:'Выбери регион',children:incompleteRegions(countries('Турция|Америка|Россия|Индия|Германия|Арабские Эмираты|Мексика|Великобритания|Франция|Польша|Канада'))},
 'Standoff 2':{heading:'Выбери количество',children:items([100,500,1000,3000],' голды')},
 'Minecraft':{heading:'Выбери категорию',children:[branch('Паки',items(['Minecraft: Java & Bedrock Edition for PC','Minecraft: Java & Bedrock for PC Deluxe Collection','Minecraft: Java & Bedrock Edition Ultimate Collection'])),branch('Валюта',items([1720,3500,8800])),branch('Dungeons',items(['Minecraft Dungeons II Standard Edition','Minecraft Dungeons II Deluxe Edition']))]},
 'Google Play':{heading:'Выбери регион',children:incompleteRegions(countries('Америка|Турция|Индия|Польша|Саудовская Аравия|Япония|Нидерланды|Бразилия|Франция|Арабские Эмираты|Италия|Германия|Испания|Великобритания'))},
 'Riot Games':{heading:'Выбери регион',children:incompleteRegions(countries('Европа|Турция|Великобритания|Америка|Арабские Эмираты|Бразилия|Саудовская Аравия'))},
 'Amazon':{heading:'Выбери регион',children:incompleteRegions(countries('Египет|Турция|Америка|Германия|Япония|Великобритания|Австралия|Саудовская Аравия|Италия|Канада|Франция'))},
 'Netflix':{heading:'Выбери регион',children:incompleteRegions(countries('Колумбия|Саудовская Аравия|Польша|Америка|Европа|Бразилия|Мексика|Австралия|Арабские Эмираты|Чехия|Турция|Великобритания'))},
 'Apex Legends':{heading:'Выбери платформу',children:regions(['Xbox','EA PC'],items([1000,2150,4350,6700,11500]))},
 'Electronic Arts':{heading:'Выбери категорию',children:[branch('Подарочные карты',incompleteRegions(['Америка','Европа','Великобритания'])),branch('EA Sports FC',[branch('EA Sports FC 26',[...items([1050,2800,5900,12000],' FC Points'),item('Team of the Year Edition')])]),branch('Battlefield 4',items(['Battlefield 4™ Premium Edition'])),branch('Split Fiction',items(['Split Fiction'])),branch('Star Wars Zero Company',items(['STAR WARS Zero Company™','STAR WARS Zero Company™ Deluxe Edition']))]},
 'Battle.net':{heading:'Выбери категорию',children:[branch('World of Warcraft 60 Days Time Card',items(['Европа','Америка','Канада'])),pending('Overwatch'),branch('Подарочные карты',incompleteRegions(countries('Европа|Америка|Польша|Великобритания|Сингапур|Бразилия|Индонезия')))]},
 'Steam':{heading:'Выбери регион',children:incompleteRegions(countries('Вьетнам|Индонезия|Малайзия|Америка|Гонконг|Арабские Эмираты|Индия|Филиппины|Турция|Таиланд|Саудовская Аравия|Европа|Сингапур|Аргентина|Бразилия|Польша|Колумбия|Великобритания|ЮАР|Мексика'))},
 'ExitLag':{heading:'Выбери категорию',children:[pending('Tier 1'),pending('Tier 2'),pending('Tier 3')]},
 'Nintendo':{heading:'Выбери категорию',children:[branch('Подписка',incompleteRegions(['Америка','Европа','Бразилия','Польша','Мексика'])),branch('Подарочная карта',incompleteRegions(['Америка','Европа','Бразилия','Япония','Польша']))]},
 'ChatGPT / OpenAI':{heading:'Выбери номинал',children:items([15,20,25,30,40,50,75,100,125,150,175,200,250],' $')},
 'Free Fire':{heading:'Выбери способ пополнения',children:[branch('Коды · Global',items(['100+10 Diamonds','210+21 Diamonds','530+53 Diamonds','1080+108 Diamonds','2200+220 Diamonds'])),branch('Автопополнение · СНГ',items(['Free Fire CIS: Newbie Bundle','Free Fire CIS: Level Up Package 6','Free Fire CIS: Weekly Lite','Free Fire CIS: Level Up Package 20','Free Fire CIS: Level Up Package 15','Free Fire CIS: Level Up Package 25','Free Fire CIS: Level Up Package 10','Free Fire CIS: Level Up Package 30','Free Fire CIS: Weekly Membership','Free Fire CIS: Monthly Membership']))]}
};
catalog['Steam Gifts']={...catalog.Steam,children:catalog.Steam.children.filter(region=>!['Польша','Великобритания'].includes(region.label))};
catalog.Steam={title:'Steam',children:[branch('Подарочные карты',catalog['Steam Gifts'].children),branch('Steam Автореги',incompleteRegions(countries('Вьетнам|Индонезия|Малайзия|Америка|Гонконг|Арабские Эмираты|Индия|Филиппины|Турция|Таиланд|Саудовская Аравия|Европа|Сингапур|Аргентина|Бразилия|Польша|Колумбия|Великобритания|ЮАР|Мексика')))]};
catalog['Steam Auto-Regs Games']=catalog.Steam;
for(const name of ['Arena Breakout', 'GearUP Booster PC', 'Rockstar Games', 'Razer Gold', 'Rewarble', 'Eneba', 'League of Legends'])catalog[name]={children:[]};
const allProducts=['Fortnite','Valorant','PUBG Mobile','Xbox','PlayStation Store','Marvel Rivals','Roblox','Apple','Standoff 2','Minecraft','Google Play','Riot Games','Amazon','Netflix','Apex Legends','Electronic Arts','Battle.net','Steam Gifts','ExitLag','Telegram Stars','Nintendo','ChatGPT / OpenAI','Spotify','Free Fire','Steam','Steam Auto-Regs Games','Honkai: Star Rail','Arena Breakout','GearUP Booster PC','Rockstar Games','Razer Gold','Rewarble','Eneba','League of Legends'];
export {catalog,allProducts};
