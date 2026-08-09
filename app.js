let products = [];
let cart = JSON.parse(localStorage.getItem("voltika-cart") || "[]");
let filter = "Tous";
let currentProduct = null;

const money = n => (n / 100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
const grid = document.querySelector("#grid");
const search = document.querySelector("#search");
const cartCount = document.querySelector("#cartCount");
const cartItems = document.querySelector("#cartItems");
const totalEl = document.querySelector("#total");
const drawer = document.querySelector("#drawer");
const overlay = document.querySelector("#overlay");
const productModal = document.querySelector("#productModal");

function saveCart(){ localStorage.setItem("voltika-cart", JSON.stringify(cart)); updateCart(); }

async function load(){
  try{
    const response = await fetch("/api/products");
    if(!response.ok) throw new Error("Produits indisponibles");
    products = await response.json();
    render();
    updateCart();
    handlePaymentMessage();
  }catch(error){
    grid.innerHTML = `<p class="empty">Impossible de charger les produits. Actualise la page.</p>`;
    console.error(error);
  }
}

function render(){
  const q = (search.value || "").trim().toLowerCase();
  const list = products.filter(p =>
    (filter === "Tous" || p.category === filter) &&
    (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  );
  grid.innerHTML = list.length ? list.map(p => `
    <article class="product">
      <button class="product-open" data-id="${p.id}" aria-label="Voir ${p.name}">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </button>
      <div class="product-body">
        <small>${p.category}</small>
        <h3>${p.name}</h3>
        <strong class="price">${money(p.price)}</strong>
        <div class="product-actions">
          <button class="secondary" data-id="${p.id}" data-action="details">Voir</button>
          <button class="primary add" data-id="${p.id}">Ajouter</button>
        </div>
      </div>
    </article>
  `).join("") : `<p class="empty">Aucun produit trouvé.</p>`;
}

function add(id){
  const item = cart.find(i => i.id === id);
  if(item) item.quantity += 1;
  else cart.push({id, quantity:1});
  saveCart();
  openCart();
}

function change(id, delta){
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.quantity += delta;
  if(item.quantity <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
}

function updateCart(){
  const count = cart.reduce((sum,i) => sum + i.quantity, 0);
  cartCount.textContent = count;
  let total = 0;
  cartItems.innerHTML = cart.length ? cart.map(item => {
    const p = products.find(x => x.id === item.id);
    if(!p) return "";
    total += p.price * item.quantity;
    return `<div class="cart-row">
      <img src="${p.image}" alt="">
      <div class="cart-row-info">
        <strong>${p.name}</strong>
        <span>${money(p.price)}</span>
        <div class="qty">
          <button data-change="-1" data-id="${p.id}">−</button>
          <span>${item.quantity}</span>
          <button data-change="1" data-id="${p.id}">+</button>
        </div>
      </div>
    </div>`;
  }).join("") : `<p class="empty">Ton panier est vide.</p>`;
  totalEl.textContent = money(total);
}

function openCart(){ drawer.classList.add("open"); overlay.classList.add("show"); }
function closeCart(){ drawer.classList.remove("open"); overlay.classList.remove("show"); }
function openModal(id){
  const p = products.find(x => x.id === id);
  if(!p) return;
  currentProduct = p;
  document.querySelector("#modalImage").src = p.image;
  document.querySelector("#modalImage").alt = p.name;
  document.querySelector("#modalCategory").textContent = p.category;
  document.querySelector("#modalName").textContent = p.name;
  document.querySelector("#modalDescription").textContent = p.description;
  document.querySelector("#modalPrice").textContent = money(p.price);
  productModal.classList.add("show");
  productModal.setAttribute("aria-hidden","false");
}
function closeModal(){ productModal.classList.remove("show"); productModal.setAttribute("aria-hidden","true"); }

document.querySelectorAll(".cat").forEach(btn => btn.addEventListener("click", () => {
  filter = btn.dataset.filter;
  document.querySelectorAll(".cat").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  render();
}));
search.addEventListener("input", render);
grid.addEventListener("click", e => {
  const addBtn = e.target.closest(".add");
  const detailsBtn = e.target.closest("[data-action='details']");
  const imageBtn = e.target.closest(".product-open");
  if(addBtn) add(addBtn.dataset.id);
  else if(detailsBtn) openModal(detailsBtn.dataset.id);
  else if(imageBtn) openModal(imageBtn.dataset.id);
});
cartItems.addEventListener("click", e => {
  const btn = e.target.closest("[data-change]");
  if(btn) change(btn.dataset.id, Number(btn.dataset.change));
});
document.querySelector("#cartBtn").addEventListener("click", openCart);
document.querySelector("#closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.querySelector("#closeModal").addEventListener("click", closeModal);
productModal.addEventListener("click", e => { if(e.target === productModal) closeModal(); });
document.querySelector("#modalAdd").addEventListener("click", () => {
  if(currentProduct){ add(currentProduct.id); closeModal(); }
});

document.querySelector("#checkout").addEventListener("click", async () => {
  const msg = document.querySelector("#checkoutMsg");
  msg.textContent = "";
  if(!cart.length){ msg.textContent = "Ajoute au moins un produit."; return; }
  const button = document.querySelector("#checkout");
  button.disabled = true; button.textContent = "Ouverture du paiement…";
  try{
    const response = await fetch("/api/create-checkout-session",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({items:cart})
    });
    const data = await response.json();
    if(!response.ok || !data.url) throw new Error(data.error || "Erreur de paiement");
    window.location.href = data.url;
  }catch(error){
    msg.textContent = error.message;
    button.disabled = false; button.textContent = "Payer";
  }
});

function handlePaymentMessage(){
  const params = new URLSearchParams(location.search);
  if(params.get("success") === "1"){
    cart = []; saveCart();
    alert("Paiement confirmé. Merci pour ta commande !");
    history.replaceState({}, "", "/");
  }
  if(params.get("cancel") === "1"){
    alert("Paiement annulé. Ton panier est conservé.");
    history.replaceState({}, "", "/");
  }
}

load();
