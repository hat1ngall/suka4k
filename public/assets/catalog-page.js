import {catalog,allProducts} from './catalog-data.js?v=7';
import {priceLists} from './price-list.js?v=4';
import {buildPricedCatalog} from './catalog-priced.js?v=5';
import {displayProductName} from './catalog-product.js?v=3';
import {createCatalogCart} from './catalog-cart.js?v=1';
import {getActivationGuide} from './activation-guides.js?v=3';
import {isAutoDelivery} from './auto-topup.js?v=2';
import {flagForRegion} from './region-flags.js';
const $=selector=>document.querySelector(selector);
const params=new URLSearchParams(location.search),name=params.get('product')||'',raw=params.get('step')||'';
const validSteps=raw===''||/^\d+(?:\.\d+)*$/.test(raw);
const indexes=validSteps&&raw?raw.split('.').map(Number):[];
const title=allProducts.includes(name)?name:'';
const product=name==='Steam Auto-Regs Games'?'Steam':name;
const root=buildPricedCatalog(product,catalog[product],priceLists);
const label=root.title||name;
const customImages={'Arena Breakout':'arena','GearUP Booster PC':'gearup','Rockstar Games':'rockstar','Razer Gold':'razer','Rewarble':'rewarble','Eneba':'eneba','League of Legends':'league'};
const sceneNames=['Fortnite','Valorant','PUBG Mobile','Xbox','PlayStation Store','','Marvel Rivals','Roblox','Apple','Standoff 2','Minecraft','Google Play','Riot Games','Amazon','Netflix','Apex Legends','Electronic Arts','Battle.net','Steam Gifts','ExitLag','Telegram Stars','Nintendo','ChatGPT / OpenAI','Spotify','Free Fire','Steam','Honkai: Star Rail'];
const sceneIndex=sceneNames.indexOf(name==='Steam Auto-Regs Games'?'Steam':name),banner=$('.banner-scene');
if(sceneIndex>=0){banner.style.setProperty('--image',`url(/assets/banner-mascots-${Math.floor(sceneIndex/6)+1}.png)`);banner.style.setProperty('--x',`${(sceneIndex%2)*100}%`);banner.style.setProperty('--y',`${Math.floor((sceneIndex%6)/2)*50}%`);banner.style.setProperty('--ratio',Math.floor(sceneIndex/6)===1?'2.25':'2.665')}else{banner.hidden=true}
function url(path){const query=new URLSearchParams({product:name});if(path.length)query.set('step',path.join('.'));return '/catalog.html?'+query.toString()}
function addCrumb(label,href,current=false){const container=$('#breadcrumbs');if(container.childNodes.length){const separator=document.createElement('span');separator.className='separator';separator.textContent='/';separator.setAttribute('aria-hidden','true');container.append(separator)}const el=document.createElement(href?'a':'span');el.textContent=label;if(href)el.href=href;if(current)el.setAttribute('aria-current','page');container.append(el)}
function setupTheme(){const button=$('.theme-toggle');const sync=()=>{const dark=document.documentElement.dataset.theme==='dark';button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'Включить светлую тему':'Включить тёмную тему')};sync();button.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('theme',theme)}catch{}sync()})}
const addToCart=createCatalogCart();
setupTheme();fetch('/api/auth/me',{credentials:'same-origin'}).then(response=>response.ok?response.json():null).then(data=>{if(data?.user)$('#balance').textContent=Number(data.user.bonus_balance||0).toLocaleString('ru-RU')}).catch(()=>{});
addCrumb('Каталог','/home#catalog');
if(!title){document.title='Раздел не найден — mupple';$('#page-title').textContent='Раздел не найден';$('#subtitle').textContent='Вернись в каталог и выбери товар.';$('#empty').hidden=false;$('#empty').textContent='Такого раздела нет.'}
else{
 document.title=label+' — mupple';let current=root,valid=validSteps;const ancestors=[];
 if(indexes.length===0)fetch('/api/catalog/prices').then(r=>r.ok?r.json():Promise.reject()).then(data=>{const product=data.products.find(p=>p.name===name);if(product?.price_rub!=null){const price=document.createElement('p');price.className='root-price';price.textContent='Цена раздела: '+Number(product.price_rub).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽. Продажа пока не подключена.';$('.page-header > div').append(price)}}).catch(()=>{});

 for(const index of indexes){if(!current.children||!Number.isSafeInteger(index)||!current.children[index]){valid=false;break}current=current.children[index];ancestors.push(current)}
 addCrumb(label,indexes.length?url([]):null,indexes.length===0);
 ancestors.forEach((entry,i)=>addCrumb(entry.label,i<ancestors.length-1?url(indexes.slice(0,i+1)):null,i===ancestors.length-1));
 const steps=getActivationGuide(name,ancestors.map(x=>x.label));if(steps){const details=document.createElement('details');details.className='activation-guide';const summary=document.createElement('summary');summary.textContent='Инструкция по активации';const list=document.createElement('ol');for(const step of steps){const item=document.createElement('li');item.textContent=step;list.append(item)}details.append(summary,list);$('.catalog-panel').append(details);}
 const back=$('#back-link');back.href=indexes.length?url(indexes.slice(0,-1)):'/home#catalog';back.textContent='← Назад';$('#footer-back').href=back.href;
 if(!valid){$('#page-title').textContent='Раздел не найден';$('#subtitle').textContent='Возможно, ссылка устарела.';$('#empty').hidden=false;$('#empty').textContent='Вернись на предыдущую страницу и выбери вариант.'}
 else if(current.pending||!current.children?.length){
   $('#page-title').textContent=current===root?label:current.label;
   $('#subtitle').textContent=current.pending||current===root?'Этот раздел ещё готовится.':'Выбранный товар';
   const empty=$('#empty');empty.hidden=false;const strong=document.createElement('strong'),description=document.createElement('p');
   if(current.pending||current===root){strong.textContent='Варианты скоро появятся';description.textContent='Список товаров для этого раздела ещё дополняется.'}else{strong.textContent=current.label;description.textContent=current.priceRub!=null?'Цена: '+Number(current.priceRub).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽.':'Цена пока не указана.'}
   empty.append(strong,description);const link=document.createElement('a');link.href=back.href;link.textContent='Вернуться к выбору';empty.append(link)
 }else{
   $('#page-title').textContent=current===root?label:current.label;
   $('#subtitle').textContent='';
   $('.banner-cta').hidden=false;
   const options=$('#options');
   const scene=Math.max(0,sceneIndex);
   current.children.forEach((option,index)=>{
    if(!option.pending&&!option.children){
     const card=document.createElement('article');card.className='catalog-product';
     const picture=document.createElement('div');picture.className='catalog-product-art';picture.setAttribute('aria-hidden','true');
     if(customImages[name]){picture.classList.add('custom-product-art');picture.style.setProperty('--custom-art',`url(/assets/category-${customImages[name]}.png?v=4)`)}
     picture.style.setProperty('--product-icon',`url(/assets/${/подпис|pass|netflix|spotify/i.test(name+' '+option.label)?'category-subscription.svg':/gift|карт|steam|xbox|apple|google/i.test(name+' '+option.label)?'category-topup.svg':'category-game.svg'})`);
     picture.style.setProperty('--image',`url(/assets/catalog-cinematic-${Math.floor(scene/6)+1}.png)`);picture.style.setProperty('--x',`${(scene%2)*100}%`);picture.style.setProperty('--y',`${Math.floor((scene%6)/2)*50}%`);picture.style.setProperty('--ratio',Math.floor(scene/6)===1?'2.25':'2.665');
     const content=document.createElement('div');content.className='catalog-product-content';const productTitle=document.createElement('h2');const productName=displayProductName(name,option,ancestors.map(x=>x.label));productTitle.textContent=productName;
     const price=document.createElement('p');price.className='catalog-product-price';price.textContent=option.priceRub!=null?Number(option.priceRub).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽':'Цена уточняется';
     const add=document.createElement('button');add.type='button';add.className='catalog-product-add';add.textContent=option.priceRub!=null?'В корзину':'Скоро';add.disabled=option.priceRub==null;
     const auto=isAutoDelivery(name,ancestors.map(x=>x.label));if(auto&&option.priceRub!=null)add.textContent='К пополнению';
     add.addEventListener('click',async()=>{if(auto){if(option.sourceRow)location.href='/home?'+new URLSearchParams({platform:name,item:String(option.sourceRow)})+'#balance';return}add.disabled=true;try{await addToCart({platform:name,productName,region:ancestors.map(x=>x.label).join(' · '),login:'',currency:'RUB',amount:Number(option.priceRub),sourceRow:option.sourceRow||null})}finally{add.disabled=false}});
     content.append(productTitle,price,add);card.append(picture,content);options.append(card);return;
    }
    const link=document.createElement('a');link.className='option'+(option.pending?' pending':'');link.href=url([...indexes,index]);const visual=document.createElement('span');visual.className='option-visual';const heading=document.createElement('span');heading.className='option-heading';const flag=flagForRegion(option.label);if(flag){const image=document.createElement('img');image.className='region-flag';image.src='/assets/flags/'+flag+'.svg';image.alt='';image.setAttribute('aria-hidden','true');image.width=36;image.height=27;visual.append(image)}else{const image=document.createElement('img');image.className='option-category-icon';image.src=/подпис|pass/i.test(option.label)?'/assets/category-subscription.svg':/подароч|card|кошел|пополн/i.test(option.label)?'/assets/category-topup.svg':'/assets/category-game.svg';image.alt='';visual.append(image)}const badge=document.createElement('span');badge.className='option-badge';badge.textContent=flag?'Регион':'Каталог';const text=document.createElement('span');text.className='option-title';text.textContent=option.label;const description=document.createElement('span');description.className='option-description';description.textContent=flag?'Товары для выбранного региона':option.label.includes('Подписка')?'Доступ к подписке и предложениям':option.label.includes('карт')||option.label.includes('Card')?'Подарочные карты и пополнение':'Выбери подходящий вариант';heading.append(badge,text,description);const action=document.createElement('span');action.className='option-action';const actionLabel=document.createElement('span');actionLabel.textContent=option.pending?'Скоро':'Выбрать';const arrow=document.createElement('span');arrow.className='option-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');action.append(actionLabel,arrow);link.append(visual,heading,action);options.append(link);
   });
 }
}
