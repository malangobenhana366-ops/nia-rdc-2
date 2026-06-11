const API = "https://nia-rdc-2.onrender.com";

/* ======================
UTILS SAFE
====================== */
function val(id){
  return document.getElementById(id)?.value?.trim() || "";
}

/* ======================
UI NAV HELPERS
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
NAV SYSTEM
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
          <h3>${a.titre || ""}</h3>
          <p>📍 ${a.ville || ""}</p>
          <p>📦 ${a.categorie || ""}</p>
          <p>💰 ${a.price || 0}</p>
          ${a.image_url ? `<img src="${a.image_url}" style="width:100%">` : ""}
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
    alert("Erreur serveur inscription !");
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
PUBLISH (ROBUST FIX FINAL)
====================== */
async function publier(){
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    if(!user){
      alert("Connecte-toi !");
      return;
    }

    const titre = val("titre");
    const description = val("desc");
    const ville = val("ville");
    const quartier = val("quartier");
    const price = Number(val("prix") || 0);
    const price_type = val("prix_type");
    const disponibilite = val("disponibilite");
    const telephone = val("telephone");

    // images (preview simple -> backend reçoit NULL ou string future upgrade)
    const photosInput = document.getElementById("photos");
    const photos = photosInput?.files || [];

    let image_url = "";

    if(photos.length > 0){
      // pour éviter crash backend actuel → on envoie juste un nom temporaire
      image_url = photos[0].name;
    }

    const payload = {
      user_id: user.id,
      titre,
      description,
      ville,
      categorie: quartier, // on remplace catégorie par quartier comme tu voulais
      image_url,
      price
    };

    console.log("📦 PUBLISH PAYLOAD:", payload);

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

    alert("Annonce publiée !");
    go("home");
    loadFeed();

  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    alert("Erreur serveur publication !");
  }
}

/* INIT */
go("home");
loadFeed();
