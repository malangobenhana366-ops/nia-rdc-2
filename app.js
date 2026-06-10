const API = "https://nia-rdc-2.onrender.com/api";

/* ======================
   NAVIGATION PRO
====================== */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));

  const target = document.getElementById(page);
  if(!target) return;

  target.classList.remove("hidden");

  if(page === "home") loadFeed();
}

/* ======================
   FEED PRO
====================== */
async function loadFeed(){
  const feed = document.getElementById("feed");

  try{
    const res = await fetch(`${API}/feed`);
    const data = await res.json();

    if(!Array.isArray(data) || data.length === 0){
      feed.innerHTML = "<p>Aucune annonce</p>";
      return;
    }

    feed.innerHTML = data.map(a => `
      <div>
        <img src="${a.image_url || ''}" width="100%">
        <h3>${a.titre || ''}</h3>
        <p>${a.ville || ''}</p>
      </div>
    `).join("");

  } catch(e){
    feed.innerHTML = "<p>Erreur chargement feed</p>";
  }
}

/* ======================
   LOGIN
====================== */
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

  if(data.error){
    alert(data.error);
    return;
  }

  localStorage.setItem("user", JSON.stringify(data));

  alert("Connecté");
  go("home");
}

/* ======================
   REGISTER
====================== */
async function register(){
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
}

/* ======================
   PUBLISH
====================== */
async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));

  if(!user){
    alert("Connecte-toi");
    return;
  }

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
}

/* ======================
   ADMIN HOLD
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
   ADMIN
====================== */
async function checkAdmin(){
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
}

/* INIT */
go("home");
loadFeed();