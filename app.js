let products = [];
let cart = JSON.parse(localStorage.getItem("voltika-cart") || "[]");

const money = n =>
  (n / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR"
  });

const grid = document.querySelector("#grid");
const search = document.querySelector("#search");

async function load() {
  try {
    const r = await fetch("/api/products");
    products = await r.json();
    render();
  } catch (e) {
    console.error(e);
  }
}

function render() {
  const q = (search?.value || "").toLowerCase();

  const list = products.filter(p =>
    !q || p.name.toLowerCase().includes(q)
  );

  grid.innerHTML = list.map(p => `
    <article class="product">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${money(p.price)}</p>
      <button onclick="add('${p.id}')">Ajouter</button>
    </article>
  `).join("");
}

function add(id) {
  const x = cart.find(i => i.id === id);

  if (x) {
    x.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  localStorage.setItem("voltika-cart", JSON.stringify(cart));
}

search?.addEventListener("input", render);

load();
