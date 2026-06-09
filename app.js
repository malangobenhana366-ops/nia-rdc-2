const API = "https://TON-SERVER.onrender.com/api";

/* =========================
   NAVIGATION PROPRE
========================= */
function show(page){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
}

function goLogin(){ show("login"); }
function goRegister(){ show("register"); }
function goHome(){ show("home"); }

/* =========================
   FEED
========================= */
async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(a => {
    feed.innerHTML += `
      <div class="card">
        <h4>${a.titre}</h4>
        <img src="${a.image_url || ''}" width="100%">
        <p>${a.ville || ''}</p>
      </div>
    `;
  });
}

/* =========================
   AUTH
========================= */
async function login(){
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      telephone: login_tel.value,
      password: login_pass.value
    })
  });

  const data = await res.json();

  if(data.error) return alert("Erreur");

  localStorage.setItem("user", JSON.stringify(data));
  alert("Connecté");
  goHome();
  loadFeed();
}

async function register(){
  await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      telephone: reg_tel.value,
      password: reg_pass.value
    })
  });

  alert("Compte créé");
  goLogin();
}

/* =========================
   PUBLISH (LOCKED)
========================= */
async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));
  if(!user) return alert("Connecte-toi");

  await fetch(`${API}/annonces`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
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
  goHome();
  loadFeed();
}

/* =========================
   ADMIN HOLD SYSTEM (10s)
========================= */
let holdTimer;

function startAdminHold(){
  holdTimer = setTimeout(() => {
    if (navigator.vibrate) navigator.vibrate(200);
    show("admin");
  }, 10000);
}

function stopAdminHold(){
  clearTimeout(holdTimer);
}

/* =========================
   ADMIN LOGIN SIMPLE
========================= */
async function checkAdmin(){
  const code = admin_code.value;

  const res = await fetch(`${API}/admin/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ code })
  });

  const data = await res.json();

  if(data.success){
    alert("ADMIN OK");
  } else {
    alert("Code invalide");
  }
}

/* INIT */
loadFeed();
goHome();