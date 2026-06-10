const API = "https://nia-rdc-2.onrender.com";

function val(id){
  return document.getElementById(id)?.value || "";
}

/* UI SWITCH SIMPLE */
function showLogin(){
  document.getElementById("authBox").style.display = "none";
  go("login");
}

function showRegister(){
  document.getElementById("authBox").style.display = "none";
  go("register");
}

function showApp(){
  document.getElementById("authBox").style.display = "none";
  document.getElementById("appBox").style.display = "block";
}

/* NAV */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(page).classList.add("active");

  if(page === "home") loadFeed();
}

/* FEED */
async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(a => {
    feed.innerHTML += `
      <div style="background:#fff;padding:10px;margin:10px;border-radius:10px">
        <h3>${a.titre}</h3>
        <p>${a.ville || ""}</p>
        <p>${a.categorie || ""}</p>
        <img src="${a.image_url || ''}" style="width:100%">
      </div>
    `;
  });
}

/* REGISTER */
async function register(){
  const res = await fetch(`${API}/auth/register`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      telephone: val("reg_tel"),
      password: val("reg_pass")
    })
  });

  const data = await res.json();

  if(data.error) return alert("Erreur inscription !");
  alert("Compte créé !");
  go("login");
}

/* LOGIN */
async function login(){
  const res = await fetch(`${API}/auth/login`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      telephone: val("login_tel"),
      password: val("login_pass")
    })
  });

  const data = await res.json();

  if(data.error) return alert("Erreur connexion !");

  localStorage.setItem("user", JSON.stringify(data));

  alert("Connecté !");
  showApp();
  go("home");
}

/* PUBLISH */
async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));

  if(!user) return alert("Connecte-toi !");

  const res = await fetch(`${API}/annonces`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      user_id: user.id,
      titre: val("titre"),
      description: val("desc"),
      ville: val("ville"),
      categorie: val("categorie"),
      image_url: val("image")
    })
  });

  const data = await res.json();

  if(data.error) return alert("Erreur publication !");

  alert("Annonce publiée !");
  go("home");
  loadFeed();
}

go("home");
loadFeed();
