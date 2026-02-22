// SweetLab PRO - Vanilla JS (GitHub Pages friendly)
//
// عدّل رقم واتساب هنا (بدون +)
const WHATSAPP_NUMBER = "201155590838"; // مثال: 201155590838
const DEFAULT_CURRENCY = "ج.م";
const DELIVERY_FEE = 25; // رسوم التوصيل (تجريبي)

let all = [];
let view = [];
let activeCat = "الكل";
let quickFilter = "all";
let search = "";

let cart = load("sl_cart", {});
let shipMode = load("sl_ship", "pickup"); // pickup | delivery

const $ = (id) => document.getElementById(id);

const grid = $("grid");
const chips = $("chips");
const featuredRail = $("featuredRail");

const cartCount = $("cartCount");
const miniCount = $("miniCount");
const miniTotal = $("miniTotal");
const resultCount = $("resultCount");

const drawer = $("drawer");
const drawerBg = $("drawerBg");
const openCart = $("openCart");
const closeCart = $("closeCart");
const miniCart = $("miniCart");

const cartItems = $("cartItems");
const cartMeta = $("cartMeta");

const subTotal = $("subTotal");
const shipFee = $("shipFee");
const grandTotal = $("grandTotal");

const clearCartBtn = $("clearCart");
const waOrderBtn = $("waOrder");

const custName = $("custName");
const custPhone = $("custPhone");
const custAddress = $("custAddress");
const custNote = $("custNote");

const searchOverlay = $("searchOverlay");
const openSearch = $("openSearch");
const closeSearch = $("closeSearch");
const searchBg = $("searchBg");
const searchInput = $("searchInput");

const ctaStart = $("ctaStart");
const ctaOffers = $("ctaOffers");
const miniInfo = $("miniInfo");

const year = $("year");
year.textContent = new Date().getFullYear();

// Product sheet
const productSheet = $("productSheet");
const productBg = $("productBg");
const closeProduct = $("closeProduct");
const pName = $("pName");
const pCat = $("pCat");
const pImg = $("pImg");
const pBadges = $("pBadges");
const pDesc = $("pDesc");
const pPrice = $("pPrice");
const qtyNum = $("qtyNum");
const decQty = $("decQty");
const incQty = $("incQty");
const addToCartBtn = $("addToCartBtn");

let activeProduct = null;
let sheetQty = 1;

init();

async function init(){
  await loadProducts();
  buildFeatured();
  buildChips();
  applyFilters();
  renderGrid();
  updateCartUI();
  bindEvents();
  setShipMode(shipMode);

  // PWA SW
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
}

async function loadProducts(){
  const res = await fetch("products.json", {cache:"no-store"});
  all = await res.json();
  view = [...all];
}

function bindEvents(){
  openCart.addEventListener("click", ()=> setDrawer(true));
  miniCart.addEventListener("click", ()=> setDrawer(true));
  closeCart.addEventListener("click", ()=> setDrawer(false));
  drawerBg.addEventListener("click", ()=> setDrawer(false));

  openSearch.addEventListener("click", ()=> setSearch(true));
  closeSearch.addEventListener("click", ()=> setSearch(false));
  searchBg.addEventListener("click", ()=> setSearch(false));

  searchInput.addEventListener("input", (e)=>{
    search = (e.target.value || "").trim();
    applyFilters(); renderGrid();
  });

  // Quick pills
  document.querySelectorAll("[data-quick]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll("[data-quick]").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      quickFilter = btn.dataset.quick || "all";
      applyFilters(); renderGrid();
    });
  });

  ctaStart.addEventListener("click", ()=>{
    document.querySelector(".section")?.scrollIntoView({behavior:"smooth"});
  });
  ctaOffers.addEventListener("click", ()=>{
    quickFilter = "offer";
    document.querySelectorAll("[data-quick]").forEach(x=>x.classList.toggle("active", x.dataset.quick==="offer"));
    setSearch(true);
    applyFilters(); renderGrid();
  });

  miniInfo.addEventListener("click", ()=> $("info").scrollIntoView({behavior:"smooth"}));

  // Ship segments
  document.querySelectorAll("[data-ship]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll("[data-ship]").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      setShipMode(btn.dataset.ship);
    });
  });

  clearCartBtn.addEventListener("click", ()=>{
    cart = {};
    save("sl_cart", cart);
    updateCartUI();
  });

  waOrderBtn.addEventListener("click", ()=>{
    const msg = buildWA();
    if(!msg){
      alert("السلة فاضية. أضف منتجات أولاً.");
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  });

  // Product sheet
  productBg.addEventListener("click", ()=> setProduct(false));
  closeProduct.addEventListener("click", ()=> setProduct(false));
  decQty.addEventListener("click", ()=> setSheetQty(sheetQty - 1));
  incQty.addEventListener("click", ()=> setSheetQty(sheetQty + 1));
  addToCartBtn.addEventListener("click", ()=>{
    if(!activeProduct) return;
    add(activeProduct.id, sheetQty);
    setProduct(false);
    pulse(openCart);
  });

  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      setDrawer(false);
      setSearch(false);
      setProduct(false);
    }
  });
}

function buildFeatured(){
  const picks = all.filter(p => (p.tags||[]).includes("popular") || (p.tags||[]).includes("offer")).slice(0,8);
  featuredRail.innerHTML = "";
  picks.forEach(p=>{
    const el = document.createElement("div");
    el.className = "fCard";
    el.innerHTML = `
      <div class="fImg"><img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}"></div>
      <div class="fBody">
        <div class="fName">${esc(p.name)}</div>
        <div class="fMeta">
          <span class="fTag">${esc(p.category)}</span>
          <span class="price">${money(p.price)} ${esc(p.currency||DEFAULT_CURRENCY)}</span>
        </div>
      </div>
    `;
    el.addEventListener("click", ()=> openProduct(p.id));
    featuredRail.appendChild(el);
  });
}

function buildChips(){
  const cats = ["الكل", ...Array.from(new Set(all.map(p=>p.category)))];
  chips.innerHTML = "";
  cats.forEach(cat=>{
    const b = document.createElement("button");
    b.className = "chip" + (cat===activeCat ? " active":"");
    b.textContent = cat;
    b.addEventListener("click", ()=>{
      activeCat = cat;
      chips.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      applyFilters(); renderGrid();
    });
    chips.appendChild(b);
  });
}

function applyFilters(){
  const s = search.toLowerCase();
  view = all.filter(p=>{
    const catOk = activeCat==="الكل" ? true : p.category===activeCat;
    const searchOk = !s ? true : (p.name.toLowerCase().includes(s) || (p.desc||"").toLowerCase().includes(s));
    const quickOk =
      quickFilter==="all" ? true :
      quickFilter==="offer" ? (p.tags||[]).includes("offer") :
      quickFilter==="new" ? (p.tags||[]).includes("new") :
      quickFilter==="popular" ? (p.tags||[]).includes("popular") : true;

    return catOk && searchOk && quickOk;
  });

  resultCount.textContent = `${view.length} منتج`;
}

function renderGrid(){
  grid.innerHTML = "";
  if(view.length === 0){
    const box = document.createElement("div");
    box.className = "infoCard";
    box.innerHTML = `<div class="h2">لا يوجد نتائج</div><p class="muted">جرّب بحث آخر أو تصنيف مختلف.</p>`;
    grid.appendChild(box);
    return;
  }

  view.forEach(p=>{
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb">
        <img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}">
        <div class="pill">${esc(p.category)}</div>
      </div>
      <div class="body">
        <div class="nameRow">
          <h3 class="pName">${esc(p.name)}</h3>
          <div class="price">${money(p.price)} ${esc(p.currency||DEFAULT_CURRENCY)}</div>
        </div>
        <div class="pDesc">${esc(p.desc||"")}</div>
        <div class="actions">
          <button class="add" data-add="${esc(p.id)}">إضافة</button>
          <span class="muted small">${tagLabel(p.tags)}</span>
        </div>
      </div>
    `;

    card.addEventListener("click", (e)=>{
      // prevent if clicking add
      if(e.target && e.target.matches("[data-add]")) return;
      openProduct(p.id);
    });

    card.querySelector("[data-add]").addEventListener("click", (e)=>{
      e.stopPropagation();
      add(p.id, 1);
      pulse(openCart);
    });

    grid.appendChild(card);
  });
}

function openProduct(id){
  const p = all.find(x=>x.id===id);
  if(!p) return;
  activeProduct = p;
  setSheetQty(1);

  pName.textContent = p.name;
  pCat.textContent = p.category;
  pImg.src = p.image;
  pImg.alt = p.name;
  pDesc.textContent = p.desc || "";
  pPrice.textContent = `${money(p.price)} ${p.currency||DEFAULT_CURRENCY}`;

  pBadges.innerHTML = "";
  const tags = p.tags || [];
  tags.forEach(t=>{
    const b = document.createElement("div");
    b.className = "pTag";
    b.textContent = t==="offer" ? "عرض" : t==="new" ? "جديد" : t==="popular" ? "الأكثر طلباً" : t;
    pBadges.appendChild(b);
  });

  setProduct(true);
}

function setSheetQty(n){
  sheetQty = Math.max(1, Math.min(99, Number(n)||1));
  qtyNum.textContent = String(sheetQty);
}

function setProduct(open){
  productSheet.classList.toggle("open", !!open);
  productSheet.setAttribute("aria-hidden", open ? "false" : "true");
}

function setDrawer(open){
  drawer.classList.toggle("open", !!open);
  drawer.setAttribute("aria-hidden", open ? "false":"true");
  if(open) renderCart();
}

function setSearch(open){
  searchOverlay.classList.toggle("open", !!open);
  searchOverlay.setAttribute("aria-hidden", open ? "false":"true");
  if(open) setTimeout(()=> searchInput.focus(), 50);
}

function add(id, qty){
  if(!cart[id]) cart[id] = {id, qty:0};
  cart[id].qty += qty;
  if(cart[id].qty <= 0) delete cart[id];
  save("sl_cart", cart);
  updateCartUI();
}

function renderCart(){
  const items = Object.values(cart);
  if(items.length === 0){
    cartItems.innerHTML = `<div class="infoCard"><div class="h2">السلة فاضية</div><p class="muted">أضف منتجات من المنيو.</p></div>`;
    return;
  }
  cartItems.innerHTML = "";
  items.forEach(it=>{
    const p = all.find(x=>x.id===it.id);
    if(!p) return;

    const row = document.createElement("div");
    row.className = "cItem";
    row.innerHTML = `
      <div class="cImg"><img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}"></div>
      <div class="cMain">
        <div class="cName">${esc(p.name)}</div>
        <div class="cMeta">
          <div class="qty">
            <button class="qBtn" data-dec="${esc(p.id)}">−</button>
            <span class="qNum">${it.qty}</span>
            <button class="qBtn" data-inc="${esc(p.id)}">+</button>
          </div>
          <button class="trash" data-del="${esc(p.id)}">حذف</button>
        </div>
      </div>
    `;
    row.querySelector("[data-dec]").addEventListener("click", ()=> add(p.id, -1));
    row.querySelector("[data-inc]").addEventListener("click", ()=> add(p.id,  1));
    row.querySelector("[data-del]").addEventListener("click", ()=> { delete cart[p.id]; save("sl_cart", cart); updateCartUI(); });

    cartItems.appendChild(row);
  });
}

function updateCartUI(){
  const count = Object.values(cart).reduce((a,x)=>a + x.qty, 0);
  cartCount.textContent = String(count);
  miniCount.textContent = String(count);

  const sub = calcSubtotal();
  const fee = shipMode==="delivery" && sub>0 ? DELIVERY_FEE : 0;
  const total = sub + fee;

  miniTotal.textContent = `${money(total)} ${DEFAULT_CURRENCY}`;
  subTotal.textContent = `${money(sub)} ${DEFAULT_CURRENCY}`;
  shipFee.textContent = `${money(fee)} ${DEFAULT_CURRENCY}`;
  grandTotal.textContent = `${money(total)} ${DEFAULT_CURRENCY}`;
  cartMeta.textContent = `${count} عناصر • ${money(total)} ${DEFAULT_CURRENCY}`;

  if(drawer.classList.contains("open")) renderCart();
}

function calcSubtotal(){
  let t = 0;
  for(const it of Object.values(cart)){
    const p = all.find(x=>x.id===it.id);
    if(p) t += Number(p.price||0) * Number(it.qty||0);
  }
  return t;
}

function setShipMode(mode){
  shipMode = mode==="delivery" ? "delivery" : "pickup";
  save("sl_ship", shipMode);

  // Toggle address requirement visually
  custAddress.style.display = shipMode==="delivery" ? "block" : "none";

  updateCartUI();
}

function buildWA(){
  const items = Object.values(cart);
  if(items.length===0) return "";

  const name = (custName.value||"").trim();
  const phone = (custPhone.value||"").trim();
  const addr = (custAddress.value||"").trim();
  const note = (custNote.value||"").trim();

  const sub = calcSubtotal();
  const fee = shipMode==="delivery" ? DELIVERY_FEE : 0;
  const total = sub + (sub>0?fee:0);

  const lines = [];
  lines.push("طلب جديد ✅");
  lines.push(`نوع الطلب: ${shipMode==="delivery" ? "توصيل" : "استلام"}`);
  if(name) lines.push(`الاسم: ${name}`);
  if(phone) lines.push(`الهاتف: ${phone}`);
  if(shipMode==="delivery" && addr) lines.push(`العنوان: ${addr}`);
  lines.push("—");
  items.forEach(it=>{
    const p = all.find(x=>x.id===it.id);
    if(!p) return;
    lines.push(`• ${p.name} × ${it.qty} = ${money(p.price*it.qty)} ${p.currency||DEFAULT_CURRENCY}`);
  });
  lines.push("—");
  lines.push(`المجموع: ${money(sub)} ${DEFAULT_CURRENCY}`);
  if(shipMode==="delivery") lines.push(`رسوم التوصيل: ${money(fee)} ${DEFAULT_CURRENCY}`);
  lines.push(`الإجمالي: ${money(total)} ${DEFAULT_CURRENCY}`);
  if(note){
    lines.push("—");
    lines.push(`ملاحظة: ${note}`);
  }
  lines.push("شكراً لكم 🌟");

  return lines.join("\n");
}

function tagLabel(tags=[]){
  if(tags.includes("offer")) return "عرض";
  if(tags.includes("new")) return "جديد";
  if(tags.includes("popular")) return "الأكثر طلباً";
  return "—";
}

function money(n){
  try{ return new Intl.NumberFormat("ar-EG", {maximumFractionDigits:0}).format(Number(n||0)); }
  catch{ return String(n||0); }
}

function esc(s){
  return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function load(k, d){ try{ return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); }catch{ return d; } }
function pulse(btn){
  btn.animate([{transform:"scale(1)"},{transform:"scale(1.06)"},{transform:"scale(1)"}], {duration:240});
}
