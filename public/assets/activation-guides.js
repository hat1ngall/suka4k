const microsoft=['Войдите в нужную учётную запись Microsoft.','В браузере откройте redeem.microsoft.com, введите 25-значный код и подтвердите активацию.','На Xbox откройте Microsoft Store → «Активировать код»; в Windows откройте Microsoft Store → меню профиля → «Активировать код».'];
const ea=['Откройте ea.com/redeem и войдите в аккаунт EA.','Введите полученный код и подтвердите активацию.'];
const guides={
 'Valorant':['Войдите в клиент VALORANT и откройте магазин.','Выберите Prepaid Cards & Codes, введите PIN-код и нажмите Submit.'],
 'PlayStation Store':['Войдите в PlayStation Store, нажмите на аватар и выберите «Активировать коды».','Введите код ваучера и подтвердите.','На PS5: Настройки → Пользователи и учётные записи → Учётная запись → Платежи и подписки → Активировать коды. На PS4 пункт находится в меню PlayStation Store.'],
 'Apple':['На iPhone или iPad откройте App Store, нажмите на профиль и выберите «Активировать подарочную карту или код».','Отсканируйте карту или введите код вручную. На Mac откройте App Store, нажмите на своё имя и выберите «Активировать подарочную карту».'],
 'Standoff 2':['В официальном магазине Standoff 2 войдите с игровым ID и выберите свой аккаунт.','Откройте Promo Code, введите код и нажмите Apply.','На Android также можно открыть в игре Inventory → Shop → Promocode. На iPhone и iPad используйте сайт.'],
 'Google Play':['Откройте Google Play Маркет и выберите активацию кода в меню аккаунта.','Введите код и подтвердите. Также можно открыть play.google.com/redeem в браузере.'],
 'Riot Games':['В League of Legends или Teamfight Tactics откройте магазин → Purchase RP → Prepaid Cards.','Введите PIN без пробелов и нажмите Submit. В Legends of Runeterra откройте магазин и нажмите «+», затем выберите Prepaid Cards.','В VALORANT выберите в магазине Prepaid Cards & Codes, введите PIN и нажмите Submit.'],
 'Amazon':['Откройте сайт Amazon, соответствующий региону карты: например, amazon.com для США или amazon.co.uk для Великобритании.','Войдите в аккаунт, найдите раздел активации подарочной карты, введите код и подтвердите. Карта предназначена для магазина своего региона.'],
 'Netflix':['Откройте netflix.com/redeem и войдите в свой аккаунт Netflix.','Введите код, нажмите Redeem и следуйте подсказкам.'],
 'Electronic Arts':ea,
 'Battle.net':['Войдите в аккаунт Battle.net и откройте обзор учётной записи.','В разделе Redeem a Code введите код и подтвердите. Также активация доступна в приложении Battle.net через Games или Shop → Services.'],
 'Steam Gifts':['Откройте store.steampowered.com/account/redeemwalletcode и войдите в Steam.','Введите код кошелька Steam и нажмите Continue. При необходимости укажите адрес для определения валюты кошелька.'],
 'ChatGPT / OpenAI':['Откройте chatgpt.com/redeem и войдите в нужный аккаунт и рабочее пространство.','Введите PIN и подтвердите активацию. Активация не подключает подписку автоматически.','Карты предназначены для активации в США при биллинге в USD. Баланс нельзя использовать для OpenAI API или подписок через App Store и Google Play.']
};
export function getActivationGuide(product,path=[]){
 if(guides[product])return guides[product];
 if(product==='Xbox'&&path.length)return microsoft;
 if(product==='Apex Legends'&&path.length)return path[0]==='Xbox'?microsoft:ea;
 if(product==='Minecraft'&&path.length)return path[0]==='Валюта'?['Откройте minecraft.net/redeem и войдите в аккаунт.','Введите код, подтвердите активацию и при необходимости выберите имя игрока.']:microsoft;
 if(product==='Nintendo'&&path.length)return path[0]==='Подписка'?['Откройте ec.nintendo.com/redeem и войдите в нужный Nintendo Account.','Введите код, нажмите Next и подтвердите активацию.']:['На консоли откройте Nintendo eShop и выберите аккаунт.','Выберите Enter Code, введите 16-значный код и нажмите OK.'];
 if(product==='Roblox'&&path.length)return ['Откройте roblox.com/redeem и войдите в аккаунт Roblox.','Введите PIN-код и подтвердите активацию.',path[0]==='Глобал'?'Robux будут зачислены на аккаунт.':'Зачисленные средства можно использовать для покупки Robux или Roblox Premium.'];
 if(product==='PUBG Mobile'&&path[0]==='PUBG: Battlegrounds')return ['Запустите игру и в лобби откройте Store → Add Bonus/Gift Code.','Введите код и нажмите Redeem.'];
 if(product==='PUBG Mobile'&&path.includes('Коды'))return ['Войдите на midasbuy.com/ot/pubgm/ и откройте пополнение PUBG Mobile.','Укажите Player ID, откройте Redeem Code, введите код и подтвердите.'];
 if(product==='Free Fire'&&path[0]==='Коды · Global')return ['Откройте shop2game.com, выберите Free Fire и войдите в аккаунт.','Выберите Garena Voucher, введите код и подтвердите.'];
 return null;
}
