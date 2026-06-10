const API = "https://nia-rdc-2.onrender.com/api";

/* ======================
   STATE GLOBAL
====================== */
let currentUser = JSON.parse(localStorage.getItem("user"));

/* ======================
   NAVIGATION
====================== */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));

  const target = document.getElementById(page);
  if(!target) return;

  target.classList.remove("hidden");

  if(page === "home") loadFeed();
}

/* ======================
   FEED
====================== */
async function loadFeed(){
  const feed = document.getElementById("feed");

  feed.innerHTML = "Chargement...";

  try{
    const res = await fetch(`${API}/feed`);
    const data = await res.json();

    if(!Array.isArray(data) || data.length === 0){
      feed.innerHTML = "<p>Aucune annonce pour le moment</p>";
      return;
    }

    feed.innerHTML = data.map(a => `
      <div class="card">
        <img src="${a.image_url || ''}" />
        <h3>${a.titre || ''}</h3>
        <p>${a.ville || ''}</p>
      </div>
    `).join("");

  } catch(e){
    feed.innerHTML = "<p>Erreur réseau</p>";
  }
}

/* ======================
   LOGIN
====================== */
async function login(){
  const btn = document.querySelector("#login button");
  btn.disabled = true;
  btn.innerText = "Connexion...";

  try{
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

    currentUser = data;
    localStorage.setItem("user", JSON.stringify(data));

    alert("Connecté 🚀");
    go("home");

  } catch(e){
    alert("Erreur serveur");
  } finally {
    btn.disabled = false;
    btn.innerText = "Connexion";
  }
}

/* ======================
   REGISTER
====================== */
async function register(){
  const btn = document.querySelector("#register button");
  btn.disabled = true;
  btn.innerText = "Création...";

  try{
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

    alert("Compte créé ✨");
    go("login");

  } catch(e){
    alert("Erreur serveur");
  } finally {
    btn.disabled = false;
    btn.innerText = "S'inscrire";
  }
}

/* ======================
   PUBLISH (VERSION PRO)
====================== */
async function publier(){
  if(!currentUser){
    alert("Connecte-toi d'abord");
    go("login");
    return;
  }

  const btn = document.querySelector("#publish button");
  btn.disabled = true;
  btn.innerText = "Publication...";

  try{
    await fetch(`${API}/annonces`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        user_id: currentUser.id,
        titre: titre.value,
        description: desc.value,
        ville: ville.value,
        categorie: categorie.value,
        image_url: image.value
      })
    });

    alert("Annonce publiée 🚀");

    titre.value = "";
    desc.value = "";
    ville.value = "";
    categorie.value = "";
    image.value = "";

    go("home");

  } catch(e){
    alert("Erreur publication");
  } finally {
    btn.disabled = false;
    btn.innerText = "Publier";
  }
}

/* ======================
   ADMIN (HOLD 10s)
====================== */
let timer;

function adminHoldStart(){
  timer = setTimeout(()=>{
    if(navigator.vibrate) navigator.vibrate(200);
    go("admin");
  }, 10000);
}

function adminHoldStop(){
  clearTimeout(timer);
}

/* ======================
   ADMIN CHECK
====================== */
async function checkAdmin(){
  try{
    const res = await fetch(`${API}/admin/login`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        code: admin_code.value
      })
    });

    const data = await res.json();

    if(data.success){
      alert("Mode admin activé ⚡");
    } else {
      alert("Code incorrect");
    }

  } catch(e){
    alert("Erreur admin");
  }
}

/* ======================
   INIT
====================== */
go("home");
loadFeed();