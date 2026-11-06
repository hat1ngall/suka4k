import {priceLists} from './price-list.js?v=2';
import {displayProductName} from './catalog-product.js?v=2';
import {autoItems} from './auto-topup.js?v=1';
const form=document.querySelector('#topup'),platform=document.querySelector('#platform'),amount=document.querySelector('#amount');
if(form&&platform&&amount){
 const field=document.createElement('div');field.className='field';field.id='auto-product-field';field.hidden=true;
 const label=document.createElement('label');label.htmlFor='auto-product';label.textContent='Товар';
 const select=document.createElement('select');select.id='auto-product';field.append(label,select);document.querySelector('#stars-field').before(field);
 const amounts=document.querySelector('.amounts'),amountLabel=document.querySelector('label[for="amount"]'),hint=document.querySelector('#amount-hint');
 let items=[],wasGame=false;
 function choose(){
  const item=items.find(i=>String(i.sourceRow)===select.value);
  const game=platform.value!=='Steam'&&platform.value!=='Telegram Stars';
  amount.readOnly=game;amounts.hidden=platform.value!=='Steam';
  amountLabel.textContent=game?'Стоимость':'Сумма пополнения';
  if(platform.value!=='Telegram Stars')hint.textContent=game?(item?'Цена выбранного товара.':'Выберите товар, чтобы увидеть цену.'):'Укажите желаемую сумму пополнения.';
  if(item){amount.value=item.priceRub;form.dataset.selectedProduct=displayProductName(platform.value,item);form.dataset.selectedRow=item.sourceRow;form.dataset.selectedRegion=item.group;}
  else{if(game)amount.value='';delete form.dataset.selectedProduct;delete form.dataset.selectedRow;delete form.dataset.selectedRegion;}
 }
 function refresh(){
  const game=platform.value!=='Steam'&&platform.value!=='Telegram Stars';
  if(wasGame&&!game){amount.value=platform.value==='Steam'?({RUB:'1000',KZT:'6000',UAH:'600'}[document.querySelector('#region').value]||'1000'):'1000';amount.dispatchEvent(new Event('input',{bubbles:true}))}
  wasGame=game;items=autoItems(platform.value,priceLists);field.hidden=!game;select.required=game;select.disabled=!game;select.replaceChildren();
  const empty=document.createElement('option');empty.value='';empty.textContent=items.length?'Выберите товар':'Товары пока не добавлены';select.append(empty);
  for(const item of items){const option=document.createElement('option');option.value=item.sourceRow;option.textContent=(platform.value==='PUBG Mobile'?item.group+' · ':'')+displayProductName(platform.value,item)+' — '+Number(item.priceRub).toLocaleString('ru-RU')+' ₽';select.append(option)}
  choose();
 }
 select.addEventListener('change',choose);platform.addEventListener('change',refresh);
 const params=new URLSearchParams(location.search),requested=params.get('platform'),row=params.get('item');
 if(requested&&[...platform.options].some(option=>option.value===requested)&&autoItems(requested,priceLists).some(item=>String(item.sourceRow)===row)){platform.value=requested;platform.dispatchEvent(new Event('change',{bubbles:true}));select.value=row;choose()}
 else refresh();
}
