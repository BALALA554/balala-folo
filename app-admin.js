// app-admin.js
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { requireUser, doLogout } from "./app-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

function statusBadge(status){
  if(status === "done") return `<span class="badge ok">done</span>`;
  if(status === "in_progress") return `<span class="badge warn">in_progress</span>`;
  if(status === "canceled") return `<span class="badge bad">canceled</span>`;
  return `<span class="badge">pending</span>`;
}

async function checkAdmin(uid){
  const ref = doc(db, "admins", uid);
  const s = await getDoc(ref);
  return s.exists();
}

function renderRow(id, o){
  const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
  const date = d.toLocaleString();

  return `
  <tr class="row">
    <td style="padding:14px">${date}</td>
    <td style="padding:14px">${o.igUsername || "—"}</td>
    <td style="padding:14px">${o.service} / ${o.quantity}</td>
    <td style="padding:14px">${o.country || "—"} / ${o.niche || "—"}</td>
    <td style="padding:14px">${o.priceMad || 0} MAD</td>
    <td style="padding:14px">${statusBadge(o.status)}</td>
    <td style="padding:14px">
      <select data-id="${id}" class="statusSel">
        <option value="pending" ${o.status==="pending"?"selected":""}>pending</option>
        <option value="in_progress" ${o.status==="in_progress"?"selected":""}>in_progress</option>
        <option value="done" ${o.status==="done"?"selected":""}>done</option>
        <option value="canceled" ${o.status==="canceled"?"selected":""}>canceled</option>
      </select>
    </td>
  </tr>`;
}

function listenAll(){
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    let rows = "";
    snap.forEach(docu => {
      rows += renderRow(docu.id, docu.data());
    });
    $("ordersBody").innerHTML = rows || `<tr><td colspan="7" class="muted" style="padding:14px">No orders yet.</td></tr>`;

    // wire selects
    document.querySelectorAll(".statusSel").forEach(sel => {
      sel.onchange = async () => {
        const id = sel.getAttribute("data-id");
        await updateDoc(doc(db, "orders", id), { status: sel.value });
        $("msg").textContent = "Status updated ✅";
        setTimeout(()=> $("msg").textContent="", 1200);
      };
    });
  });
}

requireUser(async (user) => {
  $("btnLogout").onclick = doLogout;
  $("uid").textContent = user.uid;

  const ok = await checkAdmin(user.uid);
  if(!ok){
    $("msg").textContent = "You are not admin ❌ (Add your UID to Firestore collection: admins)";
    $("panel").style.display = "none";
    return;
  }
  $("msg").textContent = "Admin mode ✅";
  $("panel").style.display = "block";
  listenAll();
});
