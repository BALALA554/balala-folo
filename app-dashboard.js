// app-dashboard.js
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { requireUser, doLogout, auth } from "./app-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

const PRICES = { views: 5, engagement: 5, followers: 15 };

function statusBadge(status){
  if(status === "done") return `<span class="badge ok">تم التنفيذ</span>`;
  if(status === "in_progress") return `<span class="badge warn">جاري التنفيذ</span>`;
  if(status === "canceled") return `<span class="badge bad">ملغى</span>`;
  return `<span class="badge">قيد التنفيذ</span>`;
}

function serviceLabel(s){
  if(s==="views") return "Views Boost (Promotion)";
  if(s==="engagement") return "Engagement Boost";
  return "Followers Growth (Targeted)";
}

function calcTotal(service, qty){
  const per = PRICES[service] || 0;
  const q = Math.max(1000, Math.round((Number(qty)||1000)/1000)*1000);
  return (q/1000)*per;
}

function renderRow(o){
  const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
  const date = d.toLocaleString();
  return `
    <tr class="row">
      <td style="padding:14px">${date}</td>
      <td style="padding:14px">${serviceLabel(o.service)}</td>
      <td style="padding:14px">${o.quantity}</td>
      <td style="padding:14px">${o.priceMad} MAD</td>
      <td style="padding:14px">${statusBadge(o.status)}</td>
    </tr>
  `;
}

function wire(){
  $("btnLogout").onclick = doLogout;

  $("service").onchange = () => {
    const total = calcTotal($("service").value, $("quantity").value);
    $("pricePreview").textContent = total + " MAD";
  };
  $("quantity").oninput = () => {
    const total = calcTotal($("service").value, $("quantity").value);
    $("pricePreview").textContent = total + " MAD";
  };

  $("orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if(!user) return;

    const service = $("service").value;
    const quantity = Math.max(1000, Math.round((Number($("quantity").value)||1000)/1000)*1000);
    const priceMad = calcTotal(service, quantity);

    await addDoc(collection(db, "orders"), {
      userId: user.uid,
      igUsername: $("ig").value.trim(),
      service,
      quantity,
      niche: $("niche").value,
      country: $("country").value.trim(),
      payment: $("payment").value,
      notes: $("notes").value.trim(),
      priceMad,
      status: "pending",
      createdAt: new Date()
    });

    $("msg").textContent = "طلبك تسجّل ✅";
    e.target.reset();
    $("pricePreview").textContent = "—";
  });
}

function listenOrders(user){
  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snap) => {
    let rows = "";
    let count = 0;
    let sum = 0;

    snap.forEach(doc => {
      const o = doc.data();
      count++;
      sum += Number(o.priceMad||0);
      rows += renderRow(o);
    });

    $("ordersBody").innerHTML = rows || `<tr><td colspan="5" class="muted" style="padding:14px">ما كاين حتى طلب دابا.</td></tr>`;
    $("kpiCount").textContent = count;
    $("kpiSum").textContent = sum.toLocaleString() + " MAD";
  });
}

requireUser((user) => {
  $("uid").textContent = user.uid;
  $("emailShow").textContent = user.email || "—";
  wire();
  listenOrders(user);
});
