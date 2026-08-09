import express from "express";
import Stripe from "stripe";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const products = [
  {id:"usb-c-20w", name:"Chargeur USB-C 20W Nova", price:1290, category:"Chargeurs", image:"https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80"},
  {id:"cable-usbc", name:"Câble USB-C tressé 2m", price:990, category:"Câbles", image:"https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=700&q=80"},
  {id:"mag-stand", name:"Support de charge magnétique", price:2490, category:"Sans fil", image:"https://images.unsplash.com/photo-1609592424848-5f8c1d4f9e1f?auto=format&fit=crop&w=700&q=80"},
  {id:"car-charger", name:"Chargeur voiture double USB-C", price:1990, category:"Voiture", image:"https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=700&q=80"}
];

app.get("/api/products", (req,res) => res.json(products));

app.post("/api/create-checkout-session", async (req,res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({error:"Stripe n'est pas configuré. Ajoute STRIPE_SECRET_KEY dans .env."});
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const items = (req.body.items || []).map(i => {
    const p = products.find(x => x.id === i.id);
    return p && ({price_data:{currency:"eur",product_data:{name:p.name},unit_amount:p.price},quantity:Math.max(1, i.quantity || 1)});
  }).filter(Boolean);
  const session = await stripe.checkout.sessions.create({
    mode:"payment",
    line_items:items,
    success_url:`${req.protocol}://${req.get("host")}/?success=1`,
    cancel_url:`${req.protocol}://${req.get("host")}/?cancel=1`
  });
  res.json({url:session.url});
});

app.listen(port, () => console.log(`Boutique Connect: http://localhost:${port}`));
