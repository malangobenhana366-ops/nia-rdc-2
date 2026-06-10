const API = "https://nia-rdc-2.onrender.com";

/* ======================
UI SWITCH
====================== */
function showLogin(){
go("login");
}

function showRegister(){
go("register");
}

/* ======================
NAVIGATION
====================== */
function go(page) {
document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
document.getElementById(page).classList.add("active");

if (page === "home") {
loadFeed();
updateUI();
}
}

/* ======================
UI STATE
====================== */
function isLogged(){
return localStorage.getItem("user") !== null;
}

function updateUI(){
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");

if (!authBox || !appBox) return;

if (isLogged()) {
authBox.classList.add("hidden");
appBox.classList.remove("hidden");
} else {
authBox.classList.remove("hidden");
appBox.classList.add("hidden");
}
}

/* ======================
FEED
====================== */
async function loadFeed() {
try {
const res = await fetch("${API}/feed");
const data = await res.json();

const feed = document.getElementById("feed");
feed.innerHTML = "";

data.forEach(a => {
  feed.innerHTML += `
    <div style="background:#fff;padding:10px;margin:10px;border-radius:10px">
      <h3>${a.titre || ""}</h3>
      <p>${a.ville || ""}</p>
      <img src="${a.image_url || ''}" style="width:100%">
    </div>
  `;
});

} catch (e) {
console.log("Feed error", e);
}
}

/* ======================
LOGIN
====================== */
async function login() {
const res = await fetch("${API}/auth/login", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({
telephone: login_tel.value,
password: login_pass.value
})
});

const data = await res.json();

if (data.error) return alert("Erreur connexion");

localStorage.setItem("user", JSON.stringify(data));

updateUI();
go("home");
}

/* ======================
REGISTER
====================== */
async function register() {
const res = await fetch("${API}/auth/register", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({
telephone: reg_tel.value,
password: reg_pass.value
})
});

const data = await res.json();

if (data.error) return alert("Erreur inscription");

alert("Compte créé");
go("login");
}

/* ======================
PUBLISH
====================== */
async function publier() {
const user = JSON.parse(localStorage.getItem("user"));

if (!user) return alert("Connecte-toi");

const res = await fetch("${API}/annonces", {
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

const data = await res.json();

if (data.error) return alert("Erreur publication");

alert("Annonce publiée !");
go("home");
loadFeed();
}

/* INIT */
go("home");
loadFeed();