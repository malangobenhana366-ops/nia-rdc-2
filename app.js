const API = "https://nia-rdc-2.onrender.com/api";

/* ======================
   STATE
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
      feed.innerHTML = "<p>Aucune annonce</p>";
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
    feed.innerHTML = "<p>Erreur chargement</p>";
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

  currentUser = data;
  localStorage.setItem("user", JSON.stringify(data));

  alert("Connecté 🚀");
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
   UPLOAD IMAGE CLOUDINARY
====================== */
async function uploadImage(file){
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API}/upload`, {
    method:"POST",
    body: formData
  });

  const data = await res.json();

  if(data.error){
    throw new Error(data.error);
  }

  return data.url;
}

/* ======================
   PUBLISH (FINAL PRO)
====================== */
async function publier(){
  if(!currentUser){
    alert("Connecte-toi");
    go("login");
    return;
  }

  const file = imageFile.files[0];

  let imageUrl = "";

  try{
    if(file){
      imageUrl = await uploadImage(file);
    }

    await fetch(`${API}/annonces`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        user_id: currentUser.id,
        titre: titre.value,
        description: desc.value,
        ville: ville.value,
        categorie: categorie.value,
        image_url: imageUrl
      })
    });

    alert("Annonce publiée 🚀");

    titre.value = "";
    desc.value = "";
    ville.value = "";
    categorie.value = "";
    imageFile.value = "";

    go("home");

  } catch(e){
    console.error(e);
    alert("Erreur publication");
  }
}

/* ======================
   ADMIN HOLD 10s
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
   ADMIN LOGIN
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
    alert("Admin OK ⚡");
  } else {
    alert("Code invalide");
  }
}

/* ======================
   INIT
====================== */
go("home");
loadFeed();