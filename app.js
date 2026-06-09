const API = "https://TON-SERVER.onrender.com/api";

/* =====================
   NAVIGATION STABLE
===================== */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");

  if(page === "home") loadFeed();
}

/* =====================
   FEED
===================== */
async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(a => {
    feed.innerHTML += `
      <div style="background:white;padding:10px;margin:10px;border-radius:10px">
        <h4>${a.titre}</h4>
        <img src="${a.image_url || ''}" width="100%">
        <p>${a.ville || ''}</p>
      </div>
    `;
  });
}

/* =====================
   LOGIN
===================== */
async function login(){
  const res = await fetch(`${API}/auth/login`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      telephone: login_tel.value,
      password: login_pass.value
    })
  });

  const data = await res.json();

  if(data.error) return alert("Erreur login");

  localStorage.setItem("user", JSON.stringify(data));

  alert("Connecté");
  go("home");
}

/* =====================
   REGISTER
===================== */
async function register(){
  await fetch(`${API}/auth/register`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      telephone: reg_tel.value,
      password: reg_pass.value
    })
  });

  alert("Compte créé");
  go("login");
}

/* =====================
   PUBLISH
===================== */
async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));

  if(!user) return alert("Connecte-toi");

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
}

/* =====================
   ADMIN HOLD 10s + VIBRATION
===================== */
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

/* =====================
   ADMIN CHECK
===================== */
async function checkAdmin(){
  const res = await fetch(`${API}/admin/login`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ code: admin_code.value })
  });

  const data = await res.json();

  if(data.success){
    alert("ADMIN OK");
  } else {
    alert("Code faux");
  }
}

/* INIT */
go("home");
loadFeed();