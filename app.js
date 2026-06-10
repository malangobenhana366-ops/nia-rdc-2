const API = "https://nia-rdc-2.onrender.com/api";

/* =========================
   NAVIGATION
========================= */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));

  const el = document.getElementById(page);

  if(!el){
    console.error("Page inconnue:", page);
    return;
  }

  el.classList.remove("hidden");

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

    if(!Array.isArray(data)){
      feed.innerHTML = "<p>Erreur feed</p>";
      return;
    }

    if(data.length === 0){
      feed.innerHTML = "<p>Aucune annonce</p>";
      return;
    }

    feed.innerHTML = data.map(a => `
      <div style="background:white;padding:10px;margin:10px;border-radius:10px">
        <img src="${a.image_url || ''}" style="width:100%">
        <h4>${a.titre || ''}</h4>
        <p>${a.ville || ''}</p>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    feed.innerHTML = "<p>Erreur chargement</p>";
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
      alert(data.error);
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));

    alert("Connecté");
    go("home");

  } catch (err) {
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
      alert(data.error);
      return;
    }

    alert("Compte créé");
    go("login");

  } catch (err) {
    alert("Erreur serveur register");
  }
}

/* =========================
   PUBLISH
========================= */
async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));

  if(!user){
    alert("Connecte-toi");
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

    alert("Publié !");
    go("home");
    loadFeed();

  } catch (err) {
    alert("Erreur publication");
  }
}

/* =========================
   ADMIN
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

async function checkAdmin(){
  try {
    const res = await fetch(`${API}/admin/login`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ code: admin_code.value })
    });

    const data = await res.json();

    if(data.success){
      alert("ADMIN OK");
    } else {
      alert("Code invalide");
    }

  } catch (err) {
    alert("Erreur admin");
  }
}

/* INIT */
go("home");
loadFeed();