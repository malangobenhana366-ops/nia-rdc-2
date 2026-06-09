const API = "https://TON-SERVER.onrender.com/api";

/* =====================
   NAVIGATION
===================== */
function hideAll(){
  document.getElementById("feedBox").classList.add("hidden");
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("registerBox").classList.add("hidden");
  document.getElementById("publishBox").classList.add("hidden");
}

function showFeed(){
  hideAll();
  document.getElementById("feedBox").classList.remove("hidden");
  loadFeed();
}

function showLogin(){
  hideAll();
  document.getElementById("loginBox").classList.remove("hidden");
}

function showRegister(){
  hideAll();
  document.getElementById("registerBox").classList.remove("hidden");
}

function showPublish(){
  hideAll();
  document.getElementById("publishBox").classList.remove("hidden");
}

/* =====================
   FEED
===================== */
async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const container = document.getElementById("feed");
  container.innerHTML = "";

  data.forEach(a => {
    container.innerHTML += `
      <div class="card">
        <img src="${a.image_url || ''}" />
        <h4>${a.titre}</h4>
        <p>${a.ville || ''}</p>
        <p>${a.prix_jour || ''} $</p>
      </div>
    `;
  });
}

/* =====================
   REGISTER
===================== */
async function register(){
  const telephone = document.getElementById("reg_tel").value;
  const password = document.getElementById("reg_pass").value;

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ telephone, password })
  });

  const data = await res.json();

  if(data.error) return alert(data.error);

  alert("Compte créé !");
}

/* =====================
   LOGIN
===================== */
async function login(){
  const telephone = document.getElementById("login_tel").value;
  const password = document.getElementById("login_pass").value;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ telephone, password })
  });

  const data = await res.json();

  if(data.error) return alert(data.error);

  localStorage.setItem("user", JSON.stringify(data));

  alert("Connexion réussie !");
  showFeed();
}

/* =====================
   PUBLISH
===================== */
async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));

  if(!user){
    return alert("Connecte-toi d'abord");
  }

  const annonce = {
    user_id: user.id,
    titre: document.getElementById("titre").value,
    description: document.getElementById("desc").value,
    ville: document.getElementById("ville").value,
    categorie: document.getElementById("categorie").value,
    image_url: document.getElementById("image").value,
    contact_nom: "user",
    contact_tel: user.telephone
  };

  const res = await fetch(`${API}/annonces`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(annonce)
  });

  const data = await res.json();

  if(data.error) return alert("Erreur publication");

  alert("Annonce publiée !");
  showFeed();
}