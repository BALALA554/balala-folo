// app-auth.js
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const $ = (id) => document.getElementById(id);

export function wireAuthUI({ redirectIfLoggedIn=true } = {}){
  const status = $("status");

  $("btnRegister").onclick = async () => {
    try{
      status.textContent = "Creating account...";
      await createUserWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
      status.textContent = "Account created ✅ Redirecting...";
      location.href = "./dashboard.html";
    }catch(e){
      status.textContent = e.message;
    }
  };

  $("btnLogin").onclick = async () => {
    try{
      status.textContent = "Signing in...";
      await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
      status.textContent = "Signed in ✅ Redirecting...";
      location.href = "./dashboard.html";
    }catch(e){
      status.textContent = e.message;
    }
  };

  $("btnGoogle").onclick = async () => {
    try{
      status.textContent = "Signing in with Google...";
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      status.textContent = "Signed in ✅ Redirecting...";
      location.href = "./dashboard.html";
    }catch(e){
      status.textContent = e.message;
    }
  };

  onAuthStateChanged(auth, (user) => {
    if(user && redirectIfLoggedIn){
      location.href = "./dashboard.html";
    }
  });
}

export function requireUser(onOk){
  onAuthStateChanged(auth, (user) => {
    if(!user) location.href = "./login.html";
    else onOk(user);
  });
}

export async function doLogout(){
  await signOut(auth);
  location.href = "./login.html";
}

export { auth };
