const API = "https://nia-rdc-2.onrender.com";

function val(id){
  return document.getElementById(id)?.value || "";
}

/* ======================
UI
====================== */
function showLogin(){
  document.getElementById("authBox").style.display = "none";
  go("login");
}

function showRegister(){
  document.getElementById("authBox").style.display = "none";
  go("register");
}

function showApp(){
  const auth = document.getElementById("authBox");
  const app = document.getElementById("appBox");

  if(auth) auth.style.display = "none";
  if(app) app.style.display = "block";
}

/* ======================
NAV
====================== */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  const target = document.getElementById(page);
  if(target) target.classList.add("active");

  if(page === "home") loadFeed();
}

/* ======================
FEED
====================== */
async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    const data = await res.json();

    const feed = document.getElementById("feed");
    if(!feed) return;

    feed.innerHTML = "";

    data.forEach(a => {
      feed.innerHTML += `
        <div style="background:#fff;padding:10px;margin:10px;border-radius:10px">
          <h3>${a.titre}</h3>
          <p>📍 ${a.ville || ""}</p>
          <p>💰 ${a.price || 0}</p>
          <p>📦 ${a.categorie || ""}</p>
          <img src="${a.image_url || ''}" style="width:100%">
        </div>
      `;
    });

  } catch (e) {
    console.log("feed error", e);
  }
}

/* ======================
REGISTER
====================== */
async function register(){
  try {
    const res = await fetch(`${API}/auth/register`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        telephone: val("reg_tel"),
        password: val("reg_pass")
      })
    });

    const data = await res.json();

    if(data.error) return alert("Erreur inscription !");
    alert("Compte créé !");
    go("login");

  } catch {
    alert("Erreur serveur !");
  }
}

/* ======================
LOGIN
====================== */
async function login(){
  try {
    const res = await fetch(`${API}/auth/login`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        telephone: val("login_tel"),
        password: val("login_pass")
      })
    });

    const data = await res.json();

    if(data.error) return alert("Erreur connexion !");

    localStorage.setItem("user", JSON.stringify(data));

    alert("Connecté !");
    showApp();
    go("home");

  } catch {
    alert("Erreur serveur !");
  }
}

/* ======================
PUBLISH (FIX FINAL ROBUSTE)
====================== */
async function publier(){
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    if(!user){
      alert("Connecte-toi !");
      return;
    }

    const payload = {
      user_id: user.id,
      titre: val("titre"),
      description: val("desc"),
      ville: val("ville"),
      categorie: val("categorie"),
      image_url: val("image"),
      price: Number(val("prix") || 0)
    };

    console.log("PUBLISH:", payload);

    const res = await fetch(`${API}/annonces`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if(!res.ok){
      alert(data.error || "Erreur publication !");
      return;
    }

    alert("Annonce publiée !");
    go("home");
    loadFeed();

  } catch (e) {
    console.error(e);
    alert("Erreur serveur publish !");
  }
}

go("home");
loadFeed();
