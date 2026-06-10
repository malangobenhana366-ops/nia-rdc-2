const API = "https://nia-rdc-2.onrender.com/api";

/* =========================
   NAVIGATION STABLE
========================= */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const target = document.getElementById(page);

  if(!target){
    console.error("Page introuvable :", page);
    return;
  }

  target.classList.remove("hidden");

  if(page === "home") loadFeed();
}

/* =========================
   FEED
========================= */
async function loadFeed(){
  const feed = document.getElementById("feed");

  try {
    const res = await fetch(`${API}/feed`);
    const data = await res.json();

    feed.innerHTML = "";

    if(!Array.isArray(data) || data.length === 0){
      feed.innerHTML = "<p>Aucune annonce pour le moment</p>";
      return;
    }

    data.forEach(a => {
      feed.innerHTML += `
        <div style="background:white;padding:10px;margin:10px;border-radius:10px">
          <img src="${a.image_url || ''}" width="100%" />
          <h4>${a.titre || ''}</h4>
          <p>${a.ville || ''}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    feed.innerHTML = "<p>Erreur chargement feed</p>";
  }
}

/* =========================
   LOGIN
========================= */
async function login(){
  try {
    const res = await fetch(`${API}/auth/login`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        telephone: login_tel.value,
        password: login_pass.value
      })
    });

    const data = await res.json();

    if(data.error){
      alert("Connexion refusée");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));

    alert("Connecté");
    go("home");

  } catch (e) {
    alert("Erreur serveur login");
  }
}

/* =========================
   REGISTER
========================= */
async function register(){
  try {
    const res = await fetch(`${API}/auth/register`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        telephone: reg_tel.value,
        password: reg_pass.value
      })
    });

    const data = await res.json();

    if(data.error){
      alert("Erreur inscription");
      return;
    }

    alert("Compte créé");
    go("login");

  } catch (e) {
    alert("Erreur serveur inscription");
  }
}

/* =========================
   PUBLISH
========================= */
async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));

  if(!user){
    alert("Connecte-toi d'abord");
    go("login");
    return;
  }

  try {
    await fetch(`${API}/annonces`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        user_id: user.id,
        titre: titre.value,
        description: desc.value,
        ville: ville.value,
        categorie: categorie.value,
        image_url: image.value
      })
    });

    alert("Annonce publiée");
    go("home");

  } catch (e) {
    alert("Erreur publication");
  }
}

/* =========================
   ADMIN HOLD
========================= */
let timer;

function adminHoldStart(){
  timer = setTimeout(() => {
    if(navigator.vibrate) navigator.vibrate(200);
    go("admin");
  }, 10000);
}

function adminHoldStop(){
  clearTimeout(timer);
}

/* =========================
   ADMIN LOGIN
========================= */
async function checkAdmin(){
  try {
    const res = await fetch(`${API}/admin/login`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        code: admin_code.value
      })
    });

    const data = await res.json();

    if(data.success){
      alert("ADMIN OK");
    } else {
      alert("Code invalide");
    }

  } catch (e) {
    alert("Erreur admin");
  }
}

/* INIT */
go("home");
loadFeed();