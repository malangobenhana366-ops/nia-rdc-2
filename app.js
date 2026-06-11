const API = "https://nia-rdc-2.onrender.com";

/* ======================
UTILS SAFE
====================== */
function val(id){
  return document.getElementById(id)?.value?.trim() || "";
}

/* ======================
NAVIGATION UI
====================== */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  const target = document.getElementById(page);
  if(target) target.classList.add("active");

  if(page === "home") loadFeed();
}

/* ======================
AUTH UI
====================== */
function showLogin(){
  const auth = document.getElementById("authBox");
  if(auth) auth.style.display = "none";
  go("login");
}

function showRegister(){
  const auth = document.getElementById("authBox");
  if(auth) auth.style.display = "none";
  go("register");
}

function showApp(){
  const auth = document.getElementById("authBox");
  const app = document.getElementById("appBox");

  if(auth) auth.style.display = "none";
  if(app) app.style.display = "block";
}

/* ======================
FEED (AFFICHAGE ANNONCES)
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
          <h3>${a.titre || ""}</h3>
          <p>📍 ${a.ville || ""}</p>
          <p>🏷️ ${a.quartier || ""}</p>
          <p>💰 ${a.prix || 0} ${a.prix_type || ""}</p>
          <p>📞 ${a.telephone || ""}</p>
          <p>📦 ${a.disponibilite || ""}</p>
        </div>
      `;
    });

  } catch (err) {
    console.log("FEED ERROR:", err);
  }
}

/* ======================
REGISTER
====================== */
async function register(){
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
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

  } catch (err) {
    console.error(err);
    alert("Erreur serveur !");
  }
}

/* ======================
LOGIN
====================== */
async function login(){
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
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

  } catch (err) {
    console.error(err);
    alert("Erreur serveur login !");
  }
}

/* ======================
PUBLISH FIX FINAL (ALIGNÉ SERVER)
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
      prix: Number(val("prix") || 0),
      prix_type: val("prix_type"),
      ville: val("ville"),
      quartier: val("quartier"),
      telephone: val("telephone"),
      disponibilite: val("disponibilite")
    };

    console.log("📦 SEND ANNONCE:", payload);

    const res = await fetch(`${API}/annonces`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if(!res.ok){
      console.log("SERVER ERROR:", data);
      alert(data.error || "Erreur publication !");
      return;
    }

    alert("Annonce publiée avec succès 🚀");

    go("home");
    loadFeed();

  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    alert("Erreur serveur publication !");
  }
}

/* ======================
INIT
====================== */
go("home");
loadFeed();
