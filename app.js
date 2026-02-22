// SweetLab Demo (Vanilla JS)
// Edit this number to your WhatsApp orders number (include country code, no + sign)
const WHATSAPP_NUMBER = "201000000000"; // مثال: 201155590838

// Currency display fallback (each product can have its own currency)
const DEFAULT_CURRENCY = "ج.م";

let allProducts = [];
let filteredProducts = [];
let activeCategory = "الكل";
let searchText = "";

// cart structure: { [id]: {id, qty} }
let cart = loadCart();

const el = (id) => document.getElementById(id);
const grid = el("productsGrid");
const chipsWrap = el("categoryChips");

const openCartBtn = el("openCartBtn");
const closeCartBtn = el("closeCartBtn");
const drawer = el("drawer");
const drawerBackdrop = el("drawerBackdrop");

const cartItemsEl = el("cartItems");
const cartCountEl = el("cartCount");
const cartSubEl = el("cartSub");
const cartTotalEl = el("cartTotal");

const searchInput = el("searchInput");
const clearSearch = el("clearSearch");

const noteInput = el("noteInput");
const customerInput = el("customerInput");

const clearCartBtn = el("clearCartBtn");
const checkoutBtn = el("checkoutBtn");

el("year").textContent = new Date().getFullYear();

init();

async function init(){
  await loadProducts();
  buildCategoryChips();
  applyFilters();
  renderProducts();
  updateCartUI();

  // Events
  openCartBtn.addEventListener("click", () => setDrawer(true));
  closeCartBtn.addEventListener("click", () => setDrawer(false));
  drawerBackdrop.addEventListener("click", () => setDrawer(false));

  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") setDrawer(false);
  });

  searchInput.addEventListener("input", (e)=>{
    searchText = (e.target.value || "").trim();
    applyFilters();
    renderProducts();
  });
  clearSearch.addEventListener("click", ()=>{
    searchText = "";
    searchInput.value = "";
    applyFilters();
    renderProducts();
    searchInput.focus();
  });

  clearCartBtn.addEventListener("click", ()=>{
    cart = {};
    saveCart(cart);
    updateCartUI();
  });

  checkoutBtn.addEventListener("click", ()=>{
    const msg = buildWhatsAppMessage();
    if(!msg){
      alert("السلة فاضية. أضف منتجات أولاً.");
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  });
}

async function loadProducts(){
  const res = await fetch("products.json", {cache:"no-store"});
  allProducts = await res.json();
  filteredProducts = [...allProducts];
}

function buildCategoryChips(){
  const cats = new Set(allProducts.map(p => p.category));
  const categories = ["الكل", ...Array.from(cats)];
  chipsWrap.innerHTML = "";
  categories.forEach(cat=>{
    const b = document.createElement("button");
    b.className = "chip" + (cat === activeCategory ? " active": "");
    b.textContent = cat;
    b.addEventListener("click", ()=>{
      activeCategory = cat;
      [...chipsWrap.querySelectorAll(".chip")].forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      applyFilters();
      renderProducts();
    });
    chipsWrap.appendChild(b);
  });
}

function applyFilters(){
  const s = searchText.toLowerCase();
  filteredProducts = allProducts.filter(p=>{
    const inCat = (activeCategory === "الكل") ? true : p.category === activeCategory;
    const inSearch = !s ? true : (p.name.toLowerCase().includes(s) || (p.desc||"").toLowerCase().includes(s));
    return inCat && inSearch;
  });
}

function renderProducts(){
  grid.innerHTML = "";
  if(filteredProducts.length === 0){
    const empty = document.createElement("div");
    empty.className = "footerCard";
    empty.innerHTML = `<h2>لا يوجد نتائج</h2><p class="muted">جرّب كلمة بحث أخرى أو اختر تصنيف مختلف.</p>`;
    grid.appendChild(empty);
    return;
  }

  filteredProducts.forEach(p=>{
    const card = document.createElement("article");
    card.className = "card";
    const currency = p.currency || DEFAULT_CURRENCY;

    card.innerHTML = `
      <div class="thumb">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" />
        <div class="pill">${escapeHtml(p.category)}</div>
      </div>
      <div class="body">
        <div class="titleRow">
          <h3 class="h3">${escapeHtml(p.name)}</h3>
          <div class="price">${formatMoney(p.price)} ${escapeHtml(currency)}</div>
        </div>
        <p class="desc">${escapeHtml(p.desc || "")}</p>
        <div class="bottomRow">
          <button class="addBtn" data-id="${escapeHtml(p.id)}">إضافة للسلة</button>
          <span class="muted small">تجريبي</span>
        </div>
      </div>
    `;

    card.querySelector(".addBtn").addEventListener("click", ()=>{
      addToCart(p.id, 1);
      // tiny feedback
      openCartBtn.animate([{transform:"scale(1)"},{transform:"scale(1.05)"},{transform:"scale(1)"}], {duration:220});
    });

    grid.appendChild(card);
  });
}

function setDrawer(open){
  if(open){
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden","false");
    renderCartItems();
  }else{
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden","true");
  }
}

function addToCart(id, qty){
  if(!cart[id]) cart[id] = {id, qty:0};
  cart[id].qty += qty;
  if(cart[id].qty <= 0) delete cart[id];
  saveCart(cart);
  updateCartUI();
}

function updateCartUI(){
  const count = Object.values(cart).reduce((a,x)=>a + x.qty, 0);
  cartCountEl.textContent = String(count);
  cartSubEl.textContent = `${count} منتجات`;

  const total = calcTotal();
  cartTotalEl.textContent = `${formatMoney(total)} ${DEFAULT_CURRENCY}`;
  if(drawer.classList.contains("open")) renderCartItems();
}

function renderCartItems(){
  const items = Object.values(cart);
  if(items.length === 0){
    cartItemsEl.innerHTML = `<div class="footerCard"><h2>السلة فاضية</h2><p class="muted">ابدأ بإضافة منتجات من المنيو.</p></div>`;
    return;
  }

  cartItemsEl.innerHTML = "";
  items.forEach(item=>{
    const p = allProducts.find(x=>x.id === item.id);
    if(!p) return;

    const row = document.createElement("div");
    row.className = "cartItem";
    row.innerHTML = `
      <div class="ciImg"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" /></div>
      <div class="ciMain">
        <div class="ciName">${escapeHtml(p.name)}</div>
        <div class="ciMeta">
          <div class="qty" aria-label="تعديل الكمية">
            <button class="qBtn" aria-label="نقص" data-act="dec">−</button>
            <span class="qNum">${item.qty}</span>
            <button class="qBtn" aria-label="زود" data-act="inc">+</button>
          </div>
          <button class="trash" aria-label="حذف" title="حذف">حذف</button>
        </div>
      </div>
    `;

    row.querySelector('[data-act="dec"]').addEventListener("click", ()=> addToCart(item.id, -1));
    row.querySelector('[data-act="inc"]').addEventListener("click", ()=> addToCart(item.id,  1));
    row.querySelector(".trash").addEventListener("click", ()=>{
      delete cart[item.id];
      saveCart(cart);
      updateCartUI();
    });

    cartItemsEl.appendChild(row);
  });
}

function calcTotal(){
  let total = 0;
  for(const item of Object.values(cart)){
    const p = allProducts.find(x=>x.id === item.id);
    if(p) total += Number(p.price || 0) * Number(item.qty || 0);
  }
  return total;
}

function buildWhatsAppMessage(){
  const items = Object.values(cart);
  if(items.length === 0) return "";

  const lines = [];
  const customer = (customerInput.value || "").trim();
  const note = (noteInput.value || "").trim();

  lines.push("طلب جديد من منيو SweetLab ✅");
  if(customer) lines.push(`الاسم: ${customer}`);
  lines.push("—");
  items.forEach(item=>{
    const p = allProducts.find(x=>x.id === item.id);
    if(!p) return;
    lines.push(`• ${p.name} × ${item.qty} = ${formatMoney(p.price * item.qty)} ${p.currency || DEFAULT_CURRENCY}`);
  });
  lines.push("—");
  lines.push(`الإجمالي: ${formatMoney(calcTotal())} ${DEFAULT_CURRENCY}`);
  if(note) {
    lines.push("—");
    lines.push(`ملاحظة: ${note}`);
  }
  lines.push("شكراً لكم 🌟");

  return lines.join("\n");
}

function formatMoney(n){
  try{
    return new Intl.NumberFormat("ar-EG", {maximumFractionDigits:0}).format(Number(n||0));
  }catch{
    return String(n||0);
  }
}

function saveCart(c){
  localStorage.setItem("sweetlab_cart", JSON.stringify(c));
}

function loadCart(){
  try{
    return JSON.parse(localStorage.getItem("sweetlab_cart") || "{}") || {};
  }catch{
    return {};
  }
}

function escapeHtml(str){
  return String(str || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
