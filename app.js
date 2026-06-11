const API = "https://nia-rdc-2.onrender.com";

/* ======================
SAFE GET INPUT
====================== */
function val(id){
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

/* ======================
UI STATE
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
LOGOUT
====================== */
function logout(){
  localStorage.removeItem("user");
  location.reload();
}

/* ======================
NAVIGATION
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
        <div style="background:#fff;padding:12px;margin:10px;border-radius:10px;box-shadow:0 2px 5px rgba(0,0,0,0.1)">
          <h3>${a.titre || ""}</h3>
          <p>📍 ${a.ville || ""} ${a.quartier ? " - " + a.quartier : ""}</p>
          <p>💰 ${a.price || 0}</p>
          <p>📦 ${a.categorie || ""}</p>
          <img src="${a.image_url || ''}" style="width:100%;border-radius:8px;margin-top:5px">
        </div>
      `;
    });

  } catch (e) {
    console.log("Feed error:", e);
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

    if(!res.ok){
      alert(data.error || "Erreur inscription !");
      return;
    }

    alert("Compte créé !");
    go("login");

  } catch (e) {
    alert("Erreur serveur inscription !");
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

    if(!res.ok){
      alert(data.error || "Erreur connexion !");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));

    alert("Connecté !");
    showApp();
    go("home");

  } catch (e) {
    alert("Erreur serveur login !");
  }
}

/* ======================
PUBLISH (ROBUST FINAL)
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
      quartier: val("quartier"),
      categorie: "general",
      image_url: "",

      price: Number(val("prix") || 0),
      price_type: val("prix_type"),
      telephone: val("telephone"),
      disponibilite: val("disponibilite")
    };

    if(!payload.titre){
      alert("Ajoute un titre !");
      return;
    }

    console.log("PUBLISH PAYLOAD:", payload);

    const res = await fetch(`${API}/annonces`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if(!res.ok){
      console.log("SERVER ERROR:", data);
      alert(data.error || "Erreur publication !");
      return;
    }

    alert("Annonce publiée !");
    go("home");
    loadFeed();

  } catch (e) {
    console.error(e);
    alert("Erreur serveur publication !");
  }
}

/* ======================
INIT
====================== */
go("home");
loadFeed();
