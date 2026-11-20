"use strict";

/* ============ Configuration (à modifier) ============ */
const CURRENCY = "MAD";
const FREE_DELIVERY_FROM = 200;   // livraison gratuite à partir de ce montant
const DELIVERY_FEE = 20;          // frais de livraison sinon
const WHATSAPP_NUMBER = "212725825748"; // ton numéro, format international sans + (ex: 212612345678)
const STORAGE_KEY = "nourriture-express-cart";

/* ============ Catalogue ============ */
const CATEGORIES = ["Tous", "Fruits & légumes", "Boulangerie", "Viandes & poissons", "Produits laitiers", "Épicerie", "Boissons"];

const PRODUCTS = [
  { id: 1,  name: "Pommes rouges",       unit: "1 kg",       price: 18,  cat: "Fruits & légumes", emoji: "🍎" },
  { id: 2,  name: "Bananes",             unit: "1 kg",       price: 14,  cat: "Fruits & légumes", emoji: "🍌" },
  { id: 3,  name: "Oranges",             unit: "1 kg",       price: 9,   cat: "Fruits & légumes", emoji: "🍊" },
  { id: 4,  name: "Tomates",             unit: "1 kg",       price: 7,   cat: "Fruits & légumes", emoji: "🍅" },
  { id: 5,  name: "Carottes",            unit: "1 kg",       price: 6,   cat: "Fruits & légumes", emoji: "🥕" },
  { id: 6,  name: "Pommes de terre",     unit: "1 kg",       price: 6,   cat: "Fruits & légumes", emoji: "🥔" },
  { id: 7,  name: "Concombres",          unit: "1 kg",       price: 8,   cat: "Fruits & légumes", emoji: "🥒" },
  { id: 8,  name: "Pain baguette",       unit: "pièce",      price: 2,   cat: "Boulangerie",      emoji: "🥖" },
  { id: 9,  name: "Pain complet",        unit: "pièce",      price: 4,   cat: "Boulangerie",      emoji: "🍞" },
  { id: 10, name: "Croissants",          unit: "lot de 4",   price: 12,  cat: "Boulangerie",      emoji: "🥐" },
  { id: 11, name: "Poulet entier",       unit: "1 kg",       price: 38,  cat: "Viandes & poissons", emoji: "🍗" },
  { id: 12, name: "Viande hachée",       unit: "500 g",      price: 45,  cat: "Viandes & poissons", emoji: "🥩" },
  { id: 13, name: "Sardines fraîches",   unit: "1 kg",       price: 25,  cat: "Viandes & poissons", emoji: "🐟" },
  { id: 14, name: "Œufs",                unit: "boîte de 12", price: 22, cat: "Produits laitiers", emoji: "🥚" },
  { id: 15, name: "Lait demi-écrémé",    unit: "1 L",        price: 8,   cat: "Produits laitiers", emoji: "🥛" },
  { id: 16, name: "Fromage",             unit: "200 g",      price: 24,  cat: "Produits laitiers", emoji: "🧀" },
  { id: 17, name: "Yaourt nature",       unit: "pack de 4",  price: 10,  cat: "Produits laitiers", emoji: "🍶" },
  { id: 18, name: "Riz",                 unit: "1 kg",       price: 16,  cat: "Épicerie",         emoji: "🍚" },
  { id: 19, name: "Pâtes",               unit: "500 g",      price: 7,   cat: "Épicerie",         emoji: "🍝" },
  { id: 20, name: "Huile d'olive",       unit: "1 L",        price: 85,  cat: "Épicerie",         emoji: "🫒" },
  { id: 21, name: "Sucre",               unit: "1 kg",       price: 9,   cat: "Épicerie",         emoji: "🧂" },
  { id: 22, name: "Eau minérale",        unit: "pack de 6",  price: 15,  cat: "Boissons",         emoji: "💧" },
  { id: 23, name: "Jus d'orange",        unit: "1 L",        price: 14,  cat: "Boissons",         emoji: "🧃" },
  { id: 24, name: "Thé à la menthe",     unit: "boîte",      price: 20,  cat: "Boissons",         emoji: "🍵" }
];

const byId = new Map(PRODUCTS.map(p => [p.id, p]));

/* ============ État ============ */
let cart = loadCart();          // { [id]: quantité }
let category = "Tous";
let query = "";

/* ============ Outils ============ */
const $ = (id) => document.getElementById(id);
const money = (n) => n.toFixed(2).replace(".", ",") + " " + CURRENCY;

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const clean = {};
    for (const [id, qty] of Object.entries(raw)) {
      const q = Number(qty);
      if (byId.has(Number(id)) && Number.isInteger(q) && q > 0 && q <= 99) clean[id] = q;
    }
    return clean;
  } catch { return {}; }
}

function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { /* stockage indisponible */ }
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
}

/* ============ Catalogue ============ */
function renderChips() {
  const box = $("chips");
  box.replaceChildren();
  for (const c of CATEGORIES) {
    const b = el("button", { class: "chip", type: "button", role: "tab", "aria-selected": String(c === category), text: c });
    b.addEventListener("click", () => { category = c; renderChips(); renderGrid(); });
    box.append(b);
  }
}

function renderGrid() {
  const q = normalize(query.trim());
  const list = PRODUCTS.filter(p =>
    (category === "Tous" || p.cat === category) && (!q || normalize(p.name).includes(q))
  );
  const grid = $("grid");
  grid.replaceChildren();

  $("resultInfo").textContent = list.length + (list.length > 1 ? " produits" : " produit");

  if (!list.length) {
    grid.append(el("p", { class: "empty", text: "Aucun produit trouvé." }));
    return;
  }

  for (const p of list) {
    const add = el("button", { class: "add", type: "button", text: "Ajouter au panier" });
    add.addEventListener("click", () => { addToCart(p.id); toast(p.name + " ajouté"); });
    grid.append(el("article", { class: "card" }, [
      el("div", { class: "emoji", "aria-hidden": "true", text: p.emoji }),
      el("h3", { text: p.name }),
      el("span", { class: "unit", text: p.unit }),
      el("span", { class: "price", text: money(p.price) }),
      add
    ]));
  }
}

/* ============ Panier ============ */
function addToCart(id) {
  cart[id] = Math.min((cart[id] || 0) + 1, 99);
  updateCart();
}

function changeQty(id, delta) {
  const q = (cart[id] || 0) + delta;
  if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, 99);
  updateCart();
}

function totals() {
  let subtotal = 0, count = 0;
  for (const [id, qty] of Object.entries(cart)) {
    subtotal += byId.get(Number(id)).price * qty;
    count += qty;
  }
  const delivery = count === 0 ? 0 : (subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE);
  return { subtotal, count, delivery, total: subtotal + delivery };
}

function updateCart() {
  saveCart();
  const t = totals();
  $("cartCount").textContent = t.count;
  $("subtotal").textContent = money(t.subtotal);
  $("delivery").textContent = t.count === 0 ? money(0) : (t.delivery === 0 ? "Gratuite" : money(t.delivery));
  $("total").textContent = money(t.total);
  $("checkoutBtn").disabled = t.count === 0;

  const missing = FREE_DELIVERY_FROM - t.subtotal;
  $("freeHint").textContent = t.count > 0 && missing > 0
    ? "Plus que " + money(missing) + " pour la livraison gratuite."
    : (t.count > 0 ? "Livraison gratuite 🎉" : "");

  const box = $("cartItems");
  box.replaceChildren();
  if (t.count === 0) {
    box.append(el("p", { class: "cart-empty", text: "Votre panier est vide." }));
    return;
  }
  for (const [idStr, qty] of Object.entries(cart)) {
    const id = Number(idStr);
    const p = byId.get(id);
    const minus = el("button", { type: "button", "aria-label": "Retirer un " + p.name, text: "−" });
    const plus = el("button", { type: "button", "aria-label": "Ajouter un " + p.name, text: "+" });
    const remove = el("button", { class: "remove", type: "button", text: "Supprimer" });
    minus.addEventListener("click", () => changeQty(id, -1));
    plus.addEventListener("click", () => changeQty(id, 1));
    remove.addEventListener("click", () => changeQty(id, -qty));

    box.append(el("div", { class: "line" }, [
      el("div", { class: "emoji", "aria-hidden": "true", text: p.emoji }),
      el("div", {}, [
        el("div", { class: "name", text: p.name }),
        el("div", { class: "sub", text: p.unit + " · " + money(p.price) }),
        el("div", { class: "qty" }, [minus, el("span", { text: String(qty) }), plus])
      ]),
      el("div", {}, [el("div", { class: "line-total", text: money(p.price * qty) }), remove])
    ]));
  }
}

/* ============ Tiroir et fenêtre ============ */
function openCart() {
  $("overlay").hidden = false;
  const d = $("drawer");
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
  $("closeCart").focus();
}
function closeCart() {
  $("drawer").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
  if ($("modal").hidden) $("overlay").hidden = true;
  $("cartBtn").focus();
}
function openModal() {
  $("checkoutView").hidden = false;
  $("doneView").hidden = true;
  $("formError").textContent = "";
  $("modal").hidden = false;
  $("orderForm").elements.name.focus();
}
function closeModal() {
  $("modal").hidden = true;
  if (!$("drawer").classList.contains("open")) $("overlay").hidden = true;
}

/* ============ Commande ============ */
function buildSummary(number, data, t) {
  const lines = Object.entries(cart).map(([id, qty]) => {
    const p = byId.get(Number(id));
    return "• " + qty + " × " + p.name + " (" + p.unit + ") – " + money(p.price * qty);
  });
  return [
    "Commande " + number,
    "",
    ...lines,
    "",
    "Sous-total : " + money(t.subtotal),
    "Livraison : " + (t.delivery === 0 ? "Gratuite" : money(t.delivery)),
    "Total : " + money(t.total),
    "",
    "Client : " + data.name,
    "Téléphone : " + data.phone,
    "Adresse : " + data.address + ", " + data.city,
    "Paiement : " + data.payment
  ].join("\n");
}

function onSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const error = $("formError");
  if (!form.checkValidity()) {
    error.textContent = "Merci de remplir correctement tous les champs.";
    form.reportValidity();
    return;
  }
  const t = totals();
  if (t.count === 0) { error.textContent = "Votre panier est vide."; return; }

  const f = new FormData(form);
  const data = {
    name: String(f.get("name")).trim(),
    phone: String(f.get("phone")).trim(),
    city: String(f.get("city")).trim(),
    address: String(f.get("address")).trim(),
    payment: String(f.get("payment"))
  };
  const number = "NE-" + Date.now().toString(36).toUpperCase().slice(-6);
  const summary = buildSummary(number, data, t);

  $("orderNumber").textContent = number;
  $("orderSummary").textContent = summary;
  $("waBtn").href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(summary);
  $("checkoutView").hidden = true;
  $("doneView").hidden = false;

  cart = {};
  updateCart();
  form.reset();
}

/* ============ Démarrage ============ */
$("search").addEventListener("input", (e) => { query = e.target.value; renderGrid(); });
$("cartBtn").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
$("overlay").addEventListener("click", () => { if (!$("modal").hidden) closeModal(); closeCart(); });
$("checkoutBtn").addEventListener("click", () => { if (totals().count > 0) openModal(); });
$("clearBtn").addEventListener("click", () => { cart = {}; updateCart(); });
$("closeModal").addEventListener("click", closeModal);
$("doneClose").addEventListener("click", () => { closeModal(); closeCart(); });
$("orderForm").addEventListener("submit", onSubmit);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("modal").hidden) closeModal();
  else if ($("drawer").classList.contains("open")) closeCart();
});

$("year").textContent = new Date().getFullYear();
$("freeFrom").textContent = FREE_DELIVERY_FROM + " " + CURRENCY;
renderChips();
renderGrid();
updateCart();
