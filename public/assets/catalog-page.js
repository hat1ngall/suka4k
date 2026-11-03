import {catalog,allProducts} from './catalog-data.js';
import {flagForRegion} from './region-flags.js';
const $=selector=>document.querySelector(selector);
const params=new URLSearchParams(location.search),name=params.get('product')||'',raw=params.get('step')||'';
const validSteps=raw===''||/^\d+(?:\.\d+)*$/.test(raw);
const indexes=validSteps&&raw?raw.split('.').map(Number):[];
const title=allProducts.includes(name)?name:'';
const root=catalog[name]||{title:name,children:[]};
const label=root.title||name;
function url(path){const query=new URLSearchParams({product:name});if(path.length)query.set('step',path.join('.'));return '/catalog.html?'+query.toString()}
function addCrumb(label,href,current=false){const container=$('#breadcrumbs');if(container.childNodes.length){const separator=document.createElement('span');separator.className='separator';separator.textContent='/';separator.setAttribute('aria-hidden','true');container.append(separator)}const el=document.createElement(href?'a':'span');el.textContent=label;if(href)el.href=href;if(current)el.setAttribute('aria-current','page');container.append(el)}
function setupTheme(){const button=$('.theme-toggle');const sync=()=>{const dark=document.documentElement.dataset.theme==='dark';button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'Включить светлую тему':'Включить тёмную тему')};sync();button.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('theme',theme)}catch{}sync()})}
setupTheme();fetch('/api/auth/me',{credentials:'same-origin'}).then(response=>response.ok?response.json():null).then(data=>{if(data?.user)$('#balance').textContent=Number(data.user.bonus_balance||0).toLocaleString('ru-RU')}).catch(()=>{});
addCrumb('Каталог','/home#catalog');
if(!title){document.title='Раздел не найден — mupple';$('#page-title').textContent='Раздел не найден';$('#subtitle').textContent='Вернись в каталог и выбери товар.';$('#empty').hidden=false;$('#empty').textContent='Такого раздела нет.'}
else{
 document.title=label+' — mupple';let current=root,valid=validSteps;const ancestors=[];
 if(indexes.length===0)fetch('/api/catalog/prices').then(r=>r.ok?r.json():Promise.reject()).then(data=>{const product=data.products.find(p=>p.name===name);if(product?.price_rub!=null){const price=document.createElement('p');price.className='root-price';price.textContent='Цена раздела: '+Number(product.price_rub).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽. Продажа пока не подключена.';$('.page-header > div').append(price)}}).catch(()=>{});

 for(const index of indexes){if(!current.children||!Number.isSafeInteger(index)||!current.children[index]){valid=false;break}current=current.children[index];ancestors.push(current)}
 addCrumb(label,indexes.length?url([]):null,indexes.length===0);
 ancestors.forEach((entry,i)=>addCrumb(entry.label,i<ancestors.length-1?url(indexes.slice(0,i+1)):null,i===ancestors.length-1));
 const back=$('#back-link');back.href=indexes.length?url(indexes.slice(0,-1)):'/home#catalog';back.textContent='← Назад';$('#footer-back').href=back.href;
 if(!valid){$('#page-title').textContent='Раздел не найден';$('#subtitle').textContent='Возможно, ссылка устарела.';$('#empty').hidden=false;$('#empty').textContent='Вернись на предыдущую страницу и выбери вариант.'}
 else if(current.pending||!current.children?.length){
   $('#page-title').textContent=current===root?label:current.label;
   $('#subtitle').textContent=current.pending||current===root?'Этот раздел ещё готовится.':'Выбранный товар';
   const empty=$('#empty');empty.hidden=false;const strong=document.createElement('strong'),description=document.createElement('p');
   if(current.pending||current===root){strong.textContent='Варианты скоро появятся';description.textContent='Список товаров для этого раздела ещё дополняется.'}else{strong.textContent=current.label;description.textContent='Цена и оформление заказа пока не добавлены.'}
   empty.append(strong,description);const link=document.createElement('a');link.href=back.href;link.textContent='Вернуться к выбору';empty.append(link)
 }else{
   $('#page-title').textContent=current===root?label:current.label;
   $('#subtitle').textContent=current===root?(root.heading||'Выбери вариант'):'Выбери подходящий вариант';
   const options=$('#options');current.children.forEach((option,index)=>{const link=document.createElement('a');link.className='option'+(option.pending?' pending':'');link.href=url([...indexes,index]);const visual=document.createElement('span');visual.className='option-visual';const heading=document.createElement('span');heading.className='option-heading';const flag=flagForRegion(option.label);if(flag){const image=document.createElement('img');image.className='region-flag';image.src='/assets/flags/'+flag+'.svg';image.alt='';image.setAttribute('aria-hidden','true');image.width=36;image.height=27;visual.append(image)}else{const image=document.createElement('img');image.className='option-mascot';image.src='/assets/hero-mascot-cutout.png';image.alt='';image.loading='lazy';visual.append(image)}const text=document.createElement('span');text.className='option-title';text.textContent=option.label;heading.append(text);const action=document.createElement('span');action.className='option-action';const actionLabel=document.createElement('span');actionLabel.textContent=option.pending?'Скоро':option.children?'Выбрать':'Подробнее';const arrow=document.createElement('span');arrow.className='option-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');action.append(actionLabel,arrow);link.append(visual,heading,action);options.append(link)})
 }
}
