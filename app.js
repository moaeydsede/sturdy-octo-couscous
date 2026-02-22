const WHATSAPP_NUMBER="201155590838";
const DEFAULT_CURRENCY="ج.م";

let products=[], view=[];
let activeCategory="الكل", quickTag="all", searchText="", sortMode="reco";
let cart=load("sl_cart2", {});
let activeProduct=null, activeVariant=null, qty=1;

const $=(id)=>document.getElementById(id);

const grid=$("grid"), emptyState=$("emptyState"), resultCount=$("resultCount");
const categoryList=$("categoryList"), categoryListMobile=$("categoryListMobile");
const sortSelect=$("sortSelect"), sortSelectMobile=$("sortSelectMobile");
const searchInput=$("searchInput"), clearSearch=$("clearSearch");
const cartCount=$("cartCount");
$("year").textContent=new Date().getFullYear();

// drawers / modal
const filtersDrawer=$("filtersDrawer"), openFilters=$("openFilters"), closeFilters=$("closeFilters"), filtersBg=$("filtersBg");
const productModal=$("productModal"), productBg=$("productBg"), closeProduct=$("closeProduct");
const mName=$("mName"), mCat=$("mCat"), mImg=$("mImg"), mTags=$("mTags"), mDesc=$("mDesc"), variantGrid=$("variantGrid"), mPrice=$("mPrice");
const decQty=$("decQty"), incQty=$("incQty"), qtyNum=$("qtyNum"), addToCartBtn=$("addToCartBtn");
const cartDrawer=$("cartDrawer"), cartBg=$("cartBg"), openCart=$("openCart"), closeCart=$("closeCart");
const cartItems=$("cartItems"), cartTotal=$("cartTotal"), note=$("note"), clearCartBtn=$("clearCart"), waOrder=$("waOrder");

init();

async function init(){
  const res=await fetch("products.json",{cache:"no-store"});
  products=await res.json();
  buildCategories();
  bindEvents();
  applyFilters(); render(); updateCartUI();
}

function bindEvents(){
  searchInput.addEventListener("input",(e)=>{searchText=(e.target.value||"").trim(); applyFilters(); render();});
  clearSearch.addEventListener("click",()=>{searchText=""; searchInput.value=""; applyFilters(); render(); searchInput.focus();});

  sortSelect.addEventListener("change",(e)=>{sortMode=e.target.value; sortSelectMobile.value=sortMode; applyFilters(); render();});
  sortSelectMobile.addEventListener("change",(e)=>{sortMode=e.target.value; sortSelect.value=sortMode; applyFilters(); render();});

  document.querySelectorAll("[data-tag]").forEach(btn=>btn.addEventListener("click",()=>setQuick(btn.dataset.tag||"all")));
  openFilters.addEventListener("click",()=>setFilters(true));
  closeFilters.addEventListener("click",()=>setFilters(false));
  filtersBg.addEventListener("click",()=>setFilters(false));

  productBg.addEventListener("click",()=>setProduct(false));
  closeProduct.addEventListener("click",()=>setProduct(false));
  decQty.addEventListener("click",()=>setQty(qty-1));
  incQty.addEventListener("click",()=>setQty(qty+1));
  addToCartBtn.addEventListener("click",()=>{ if(!activeProduct||!activeVariant) return; addToCart(activeProduct, activeVariant, qty); setProduct(false); });

  openCart.addEventListener("click",()=>setCart(true));
  closeCart.addEventListener("click",()=>setCart(false));
  cartBg.addEventListener("click",()=>setCart(false));

  clearCartBtn.addEventListener("click",()=>{cart={}; save("sl_cart2",cart); updateCartUI();});

  waOrder.addEventListener("click",()=>{
    const msg=buildWA();
    if(!msg){alert("السلة فاضية."); return;}
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank");
  });

  document.addEventListener("keydown",(e)=>{ if(e.key==="Escape"){setFilters(false);setProduct(false);setCart(false);} });
}

function setQuick(tag){
  quickTag=tag;
  document.querySelectorAll("[data-tag]").forEach(b=>b.classList.toggle("active", b.dataset.tag===quickTag));
  applyFilters(); render();
}

function buildCategories(){
  const cats=Array.from(new Set(products.map(p=>p.category)));
  const list=["الكل", ...cats];
  categoryList.innerHTML=""; categoryListMobile.innerHTML="";
  list.forEach(cat=>{
    const make=()=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="sideItem"+(cat===activeCategory?" active":"");
      btn.innerHTML=`<span>${esc(cat)}</span><span class="muted small">›</span>`;
      btn.addEventListener("click",()=>{
        activeCategory=cat;
        categoryList.querySelectorAll(".sideItem").forEach(x=>x.classList.remove("active"));
        categoryListMobile.querySelectorAll(".sideItem").forEach(x=>x.classList.remove("active"));
        btn.classList.add("active");
        applyFilters(); render(); setFilters(false);
      });
      return btn;
    };
    categoryList.appendChild(make());
    categoryListMobile.appendChild(make());
  });
}

function applyFilters(){
  const s=searchText.toLowerCase();
  view=products.filter(p=>{
    const catOk=activeCategory==="الكل"?true:p.category===activeCategory;
    const searchOk=!s?true:(p.name.toLowerCase().includes(s)||(p.desc||"").toLowerCase().includes(s));
    const tagOk=quickTag==="all"?true:(p.tags||[]).includes(quickTag);
    return catOk && searchOk && tagOk;
  });

  const priceOf=(p)=>{const v=(p.variants||[])[0]; return v?Number(v.price||0):0;};
  if(sortMode==="price_asc") view.sort((a,b)=>priceOf(a)-priceOf(b));
  if(sortMode==="price_desc") view.sort((a,b)=>priceOf(b)-priceOf(a));
  if(sortMode==="name") view.sort((a,b)=>a.name.localeCompare(b.name,"ar"));
}

function render(){
  resultCount.textContent=`${view.length} منتج`;
  grid.innerHTML="";
  if(view.length===0){ emptyState.hidden=false; return; }
  emptyState.hidden=true;

  view.forEach(p=>{
    const first=(p.variants||[])[0];
    const price=first?`${money(first.price)} ${esc(first.currency||DEFAULT_CURRENCY)}`:"—";
    const card=document.createElement("article");
    card.className="card";
    card.innerHTML=`
      <div class="thumb">
        <img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}">
        <div class="tag">${esc(p.category)}</div>
      </div>
      <div class="cardBody">
        <div class="titleRow">
          <h3 class="pName">${esc(p.name)}</h3>
          <div class="price">${price}</div>
        </div>
        <div class="pDesc">${esc(p.desc||"")}</div>
        <div class="cardActions">
          <button class="addBtn" type="button">اختر / إضافة</button>
          <div class="badges">${badgesHtml(p.tags||[])}</div>
        </div>
      </div>`;
    card.querySelector(".addBtn").addEventListener("click",(e)=>{e.stopPropagation(); openProduct(p.id);});
    card.addEventListener("click",()=>openProduct(p.id));
    grid.appendChild(card);
  });
}

function badgesHtml(tags){
  const map={offer:"عرض",new:"جديد",popular:"الأكثر طلباً"};
  const show=tags.slice(0,2).map(t=>map[t]||t);
  if(show.length===0) return `<span class="bSmall">—</span>`;
  return show.map(x=>`<span class="bSmall">${esc(x)}</span>`).join("");
}

function openProduct(id){
  const p=products.find(x=>x.id===id); if(!p) return;
  activeProduct=p;
  mName.textContent=p.name;
  mCat.textContent=p.category;
  mImg.src=p.image; mImg.alt=p.name;
  mDesc.textContent=p.desc||"";

  mTags.innerHTML="";
  (p.tags||[]).forEach(t=>{
    const b=document.createElement("span");
    b.className="tagP";
    b.textContent=t==="offer"?"عرض":t==="new"?"جديد":t==="popular"?"الأكثر طلباً":t;
    mTags.appendChild(b);
  });

  const vars=p.variants||[];
  variantGrid.innerHTML="";
  activeVariant=vars[0]||null;

  vars.forEach((v,i)=>{
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="optBtn"+(i===0?" active":"");
    btn.innerHTML=`<div>${esc(v.label)}</div><span class="muted">${esc(v.hint||"")}</span><div class="muted small">${money(v.price)} ${esc(v.currency||DEFAULT_CURRENCY)}</div>`;
    btn.addEventListener("click",()=>{
      variantGrid.querySelectorAll(".optBtn").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      activeVariant=v;
      updateModalPrice();
    });
    variantGrid.appendChild(btn);
  });

  setQty(1); updateModalPrice(); setProduct(true);
}

function updateModalPrice(){
  if(!activeVariant){ mPrice.textContent="—"; return; }
  mPrice.textContent=`${money(activeVariant.price)} ${activeVariant.currency||DEFAULT_CURRENCY}`;
}
function setQty(n){ qty=Math.max(1,Math.min(99,Number(n)||1)); qtyNum.textContent=String(qty); }

function setFilters(open){ filtersDrawer.classList.toggle("open",!!open); filtersDrawer.setAttribute("aria-hidden", open?"false":"true"); }
function setProduct(open){ productModal.classList.toggle("open",!!open); productModal.setAttribute("aria-hidden", open?"false":"true"); }
function setCart(open){ cartDrawer.classList.toggle("open",!!open); cartDrawer.setAttribute("aria-hidden", open?"false":"true"); if(open) renderCart(); }

function addToCart(p,v,q){
  const key=v.sku;
  if(!cart[key]) cart[key]={sku:v.sku,qty:0,productId:p.id,name:p.name,variantLabel:v.label,price:Number(v.price||0),currency:v.currency||DEFAULT_CURRENCY,image:p.image};
  cart[key].qty += q;
  if(cart[key].qty<=0) delete cart[key];
  save("sl_cart2",cart);
  updateCartUI();
}

function renderCart(){
  const items=Object.values(cart);
  if(items.length===0){
    cartItems.innerHTML=`<div class="emptyCard"><div class="emptyTitle">السلة فاضية</div><div class="muted">أضف منتجات من الصفحة.</div></div>`;
    return;
  }
  cartItems.innerHTML="";
  items.forEach(it=>{
    const row=document.createElement("div");
    row.className="cItem";
    row.innerHTML=`
      <div class="cImg"><img loading="lazy" src="${esc(it.image)}" alt="${esc(it.name)}"></div>
      <div class="cMain">
        <div class="cName">${esc(it.name)} <span class="muted small">(${esc(it.variantLabel)})</span></div>
        <div class="cMeta">
          <div class="qty">
            <button class="qBtn" data-dec>−</button>
            <span class="qNum">${it.qty}</span>
            <button class="qBtn" data-inc>+</button>
          </div>
          <button class="trash" data-del>حذف</button>
        </div>
      </div>`;
    row.querySelector("[data-dec]").addEventListener("click",()=>{it.qty-=1; if(it.qty<=0) delete cart[it.sku]; save("sl_cart2",cart); updateCartUI();});
    row.querySelector("[data-inc]").addEventListener("click",()=>{it.qty+=1; save("sl_cart2",cart); updateCartUI();});
    row.querySelector("[data-del]").addEventListener("click",()=>{delete cart[it.sku]; save("sl_cart2",cart); updateCartUI();});
    cartItems.appendChild(row);
  });
}

function updateCartUI(){
  const items=Object.values(cart);
  const count=items.reduce((a,x)=>a+x.qty,0);
  cartCount.textContent=String(count);
  const total=items.reduce((a,x)=>a+x.qty*x.price,0);
  cartTotal.textContent=`${money(total)} ${DEFAULT_CURRENCY}`;
  if(cartDrawer.classList.contains("open")) renderCart();
}

function buildWA(){
  const items=Object.values(cart);
  if(items.length===0) return "";
  const lines=["طلب جديد ✅","—"];
  items.forEach(it=>lines.push(`• ${it.name} (${it.variantLabel}) × ${it.qty} = ${money(it.qty*it.price)} ${it.currency}`));
  lines.push("—");
  const total=items.reduce((a,x)=>a+x.qty*x.price,0);
  lines.push(`الإجمالي: ${money(total)} ${DEFAULT_CURRENCY}`);
  const n=(note.value||"").trim();
  if(n){ lines.push("—"); lines.push(`ملاحظة: ${n}`); }
  lines.push("شكراً لكم 🌟");
  return lines.join("\n");
}

function money(n){ try{return new Intl.NumberFormat("ar-EG",{maximumFractionDigits:0}).format(Number(n||0));}catch{return String(n||0);} }
function esc(s){return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function save(k,v){localStorage.setItem(k,JSON.stringify(v));}
function load(k,d){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d));}catch{return d;}}
