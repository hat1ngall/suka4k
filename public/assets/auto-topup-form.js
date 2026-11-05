import {priceLists} from './price-list.js?v=1';
import {displayProductName} from './catalog-product.js?v=1';
import {autoItems} from './auto-topup.js?v=1';
const form=document.querySelector('#topup'),platform=document.querySelector('#platform'),amount=document.querySelector('#amount');
if(form&&platform&&amount){
 const field=document.createElement('div');field.className='field';field.id='auto-product-field';field.hidden=true;
 const label=document.createElement('label');label.htmlFor='auto-product';label.textContent='Товар';
 const select=document.createElement('select');select.id='auto-product';field.append(label,select);document.querySelector('#stars-field').before(field);
 const amounts=document.querySelector('.amounts'),amountLabel=document.querySelector('label[for="amount"]'),hint=document.querySelector('#amount-hint');
 let items=[];
 function choose(){
  const item=items.find(i=>String(i.sourceRow)===select.value);
  amount.readOnly=!!item;amounts.hidden=!!item;
  amountLabel.textContent=item?'Стоимость':'Сумма пополнения';
  if(platform.value!=='Telegram Stars')hint.textContent=item?'Цена выбранного товара.':'Укажите желаемую сумму пополнения.';
  if(item){amount.value=item.priceRub;form.dataset.selectedProduct=displayProductName(platform.value,item);form.dataset.selectedRow=item.sourceRow;form.dataset.selectedRegion=item.group;}
  else{delete form.dataset.selectedProduct;delete form.dataset.selectedRow;delete form.dataset.selectedRegion;}
 }
 function refresh(){
  items=autoItems(platform.value,priceLists);field.hidden=!items.length;select.replaceChildren();
  const empty=document.createElement('option');empty.value='';empty.textContent='Своя сумма';select.append(empty);
  for(const item of items){const option=document.createElement('option');option.value=item.sourceRow;option.textContent=(platform.value==='PUBG Mobile'?item.group+' · ':'')+displayProductName(platform.value,item)+' — '+Number(item.priceRub).toLocaleString('ru-RU')+' ₽';select.append(option)}
  choose();
 }
 select.addEventListener('change',choose);platform.addEventListener('change',refresh);
 const params=new URLSearchParams(location.search),requested=params.get('platform'),row=params.get('item');
 if(requested&&[...platform.options].some(option=>option.value===requested)&&autoItems(requested,priceLists).some(item=>String(item.sourceRow)===row)){platform.value=requested;platform.dispatchEvent(new Event('change',{bubbles:true}));select.value=row;choose()}
 else refresh();
}
