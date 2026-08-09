let products=[], cart=JSON.parse(localStorage.getItem("voltika-cart")||"[]"), filter="Tous";
const €=n=>(n/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
const grid=document.querySelector("#grid"), search=document.querySelector("#search");

async function load(){
  try{
    const r=await fetch("/api/products");
    if(!r.ok) throw new Error("API");
    products=await r.json();
  }catch(e){
    products=[
      {id:"usb-c-20w",name:"Chargeur USB-C 20W Nova",price:1290,category:"Chargeurs",image:"https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80"},
      {id:"cable-usbc",name:"Câble USB-C tressé 2m",price:990,category:"Câbles",image:"https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=700&q=80"},
      {id:"mag-stand",name:"Support de charge magnétique",price:2490,category:"Sans fil",image:"https://images.unsplash.com/photo-1609592424848-5f8c1d4f9e1f?auto=format&fit=crop&w=700&q=80"},
      {id:"car-charger",name:"Chargeur voiture double USB-C",price:1990,category:"Voiture",image:"https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=700&q=80"}
    ];
  }
  render();
  updateCart();
}
function render(){
  const q=(search.value||"").toLowerCase();

  const list=products.filter(p=>{
    const okFilter=filter==="Tous" || p.category===filter;
    const okSearch=!q || p.name.toLowerCase().includes(q);
    return okFilter && okSearch;
  });

  grid.innerHTML=list.map(p=>`
    <article class="product">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${money(p.price)}</p>
      <button onclick="add('${p.id}')">Ajouter au panier</button>
    </article>
  `).join("");
}
function add(id){const x=cart.find(i=>i.id===id);x?x.quantity++:cart.push({id,quantity:1});save();}
function save(){localStorage.setItem("voltika-cart",JSON.stringify(cart));updateCart();}
function updateCart(){
 document.querySelector("#cartCount").textContent=cart.reduce((a,b)=>a+b.quantity,0);
 const box=document.querySelector("#cartItems"); let total=0;
 box.innerHTML=cart.map(i=>{const p=products.find(x=>x.id===i.id);total+=p.price*i.quantity;return `<div class="cart-row"><img src="${p.image}"><div style="flex:1"><strong>${p.name}</strong><div>${€(p.price)}</div><div class="qty"><button onclick="change('${i.id}',-1)">−</button> ${i.quantity} <button onclick="change('${i.id}',1)">+</button></div></div></div>`}).join("")||"<p>Ton panier est vide.</p>";
 document.querySelector("#total").textContent=€(total);
}
function change(id,n){const i=cart.find(x=>x.id===id);i.quantity+=n;if(i.quantity<=0)cart=cart.filter(x=>x.id!==id);save();}
document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");render();});
search.oninput=render;
const drawer=document.querySelector("#drawer"),overlay=document.querySelector("#overlay");
document.querySelector("#cartBtn").onclick=()=>{drawer.classList.add("open");overlay.classList.add("show")};
document.querySelector("#closeCart").onclick=()=>{drawer.classList.remove("open");overlay.classList.remove("show")};
overlay.onclick=()=>document.querySelector("#closeCart").click();
document.querySelector("#checkout").onclick=async()=>{
 const msg=document.querySelector("#checkoutMsg"); msg.textContent="";
 if(!cart.length){msg.textContent="Ajoute au moins un produit.";return}
 const r=await fetch("/api/create-checkout-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:cart})});
 const data=await r.json(); if(data.url) location.href=data.url; else msg.textContent=data.error||"Erreur de paiement.";
};
load();
