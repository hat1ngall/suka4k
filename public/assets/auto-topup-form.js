import {applyItemPrices} from './item-prices.js?v=2';
import {priceLists} from './price-list.js?v=4';
import {displayProductName} from './catalog-product.js?v=3';
import {autoItems} from './auto-topup.js?v=2';
await applyItemPrices(priceLists);
const form=document.querySelector('#topup'),platform=document.querySelector('#platform'),amount=document.querySelector('#amount');
if(form&&platform&&amount){
 const field=document.createElement('div');field.className='field';field.id='auto-product-field';field.hidden=true;
 const label=document.createElement('span');label.className='auto-product-label';label.textContent='Товар';
 const select=document.createElement('select');select.id='auto-product';select.hidden=true;select.setAttribute('aria-hidden','true');select.tabIndex=-1;
 const picker=document.createElement('details');picker.className='auto-picker';const summary=document.createElement('summary');summary.textContent='Выберите товар';const panel=document.createElement('div');panel.className='auto-picker-panel';picker.append(summary,panel);field.append(label,select,picker);document.querySelector('#stars-field').before(field);
 const amounts=document.querySelector('.amounts'),amountLabel=document.querySelector('label[for="amount"]'),hint=document.querySelector('#amount-hint');
 let items=[],wasGame=false;
 function choose(){
  const item=items.find(i=>String(i.sourceRow)===select.value);
  const game=platform.value!=='Steam'&&platform.value!=='Telegram Stars';
  amount.readOnly=game;amounts.hidden=platform.value!=='Steam';
  amountLabel.textContent=game?'Стоимость':'Сумма пополнения';
  if(platform.value!=='Telegram Stars')hint.textContent=game?(item?'Цена выбранного товара.':'Выберите товар, чтобы увидеть цену.'):'Укажите желаемую сумму пополнения.';
  summary.textContent=item?displayProductName(platform.value,item)+' — '+Number(item.priceRub).toLocaleString('ru-RU')+' ₽':'Выберите товар';panel.querySelectorAll('[data-row]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.row===select.value)));
  if(item){amount.value=item.priceRub;form.dataset.selectedProduct=displayProductName(platform.value,item);form.dataset.selectedRow=item.sourceRow;form.dataset.selectedRegion=item.group;}
  else{if(game)amount.value='';delete form.dataset.selectedProduct;delete form.dataset.selectedRow;delete form.dataset.selectedRegion;}
 }
 function refresh(){
  const game=platform.value!=='Steam'&&platform.value!=='Telegram Stars';
  if(wasGame&&!game){amount.value=platform.value==='Steam'?({RUB:'1000',KZT:'6000',UAH:'600'}[document.querySelector('#region').value]||'1000'):'1000';amount.dispatchEvent(new Event('input',{bubbles:true}))}
  wasGame=game;items=autoItems(platform.value,priceLists);field.hidden=!game;picker.open=false;select.required=false;select.disabled=!game;select.replaceChildren();panel.replaceChildren();
  const empty=document.createElement('option');empty.value='';empty.textContent=items.length?'Выберите товар':'Товары пока не добавлены';select.append(empty);
  for(const item of items){const option=document.createElement('option');option.value=item.sourceRow;option.textContent=(platform.value==='PUBG Mobile'?item.group+' · ':'')+displayProductName(platform.value,item)+' — '+Number(item.priceRub).toLocaleString('ru-RU')+' ₽';select.append(option)}
  const groups=new Map();
  for(const item of items){let group='Пополнение';const text=item.label.toLowerCase();if(platform.value==='PUBG Mobile')group='Пополнение · '+item.group;else if(platform.value==='Free Fire'){if(/membership|weekly lite/.test(text))group='Подписки';else if(/bundle|package/.test(text))group='Паки';else group='Пополнение алмазов'}else if(platform.value==='Honkai: Star Rail')group=/pass/.test(text)?'Подписки':'Пополнение осколков';else if(platform.value==='Marvel Rivals')group='Пополнение Lattices';if(!groups.has(group))groups.set(group,[]);groups.get(group).push(item)}
  for(const [group,entries] of groups){const section=document.createElement('section');section.className='auto-picker-group';const heading=document.createElement('h3');heading.textContent=group;const grid=document.createElement('div');grid.className='auto-picker-grid';for(const item of entries){const button=document.createElement('button');button.type='button';button.className='auto-picker-item';button.dataset.row=String(item.sourceRow);button.setAttribute('aria-pressed','false');const name=document.createElement('span');name.textContent=displayProductName(platform.value,item);const price=document.createElement('strong');price.textContent=Number(item.priceRub).toLocaleString('ru-RU')+' ₽';button.append(name,price);button.addEventListener('click',()=>{select.value=String(item.sourceRow);choose();picker.open=false;summary.focus()});grid.append(button)}section.append(heading,grid);panel.append(section)}
  choose();
 }
 select.addEventListener('change',choose);platform.addEventListener('change',refresh);
 const params=new URLSearchParams(location.search),requested=params.get('platform'),row=params.get('item');
 if(requested&&[...platform.options].some(option=>option.value===requested)&&autoItems(requested,priceLists).some(item=>String(item.sourceRow)===row)){platform.value=requested;platform.dispatchEvent(new Event('change',{bubbles:true}));select.value=row;choose()}
 else refresh();
}
