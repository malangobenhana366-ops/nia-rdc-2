const API = "https://nia-rdc-2.onrender.com";

/* ======================
UTILS INPUT SAFE
====================== */
function val(id){
  return document.getElementById(id)?.value || "";
}

/* ======================
UI STATE CONTROL
====================== */
function showApp(){
  const authBox = document.getElementById("authBox");
  const appBox = document.getElementById("appBox");

  if(authBox) authBox.style.display = "none";
  if(appBox) appBox.style.display = "block";
}

function showAuth(){
  const authBox = document.getElementById("authBox");
  const appBox = document.getElementById("appBox");

  if(authBox) authBox.style.display = "block";
  if(appBox) appBox.style.display = "none";
}

/* ======================
NAVIGATION
====================== */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const target = document.getElementById(page);

  if(target) target.classList.add("active");

  if(page === "home") loadFeed();
}

/* ======================
SHOW FORMS
====================== */
function showLogin(){ go("login"); }
function showRegister(){ go("register"); }

/* ======================
FEED
====================== */
async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    const data = await res.json();

    const feed = document.getElementById("feed");
    if(!feed) return;

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
    console.log("feed error", e);
  }
}

/* ======================
REGISTER
====================== */
async function register(){
  try {
    const res = await fetch(`${API}/auth/register`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        telephone: val("reg_tel"),
        password: val("reg_pass")
      })
    });

    const data = await res.json();

    if(data.error){
      alert("Erreur inscription !");
      return;
    }

    alert("Compte créé !");
    go("login");

  } catch(e){
    alert("Erreur serveur inscription !");
  }
}

/* ======================
LOGIN
====================== */
async function login(){
  try {
    const res = await fetch(`${API}/auth/login`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        telephone: val("login_tel"),
        password: val("login_pass")
      })
    });

    const data = await res.json();

    if(data.error){
      alert("Erreur connexion !");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));

    alert("Connecté !");

    // 🔥 SWITCH UI PRO
    showApp();
    go("home");

  } catch(e){
    alert("Erreur serveur login !");
  }
}

/* ======================
PUBLISH
====================== */
async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));

  if(!user){
    alert("Connecte-toi !");
    return;
  }

  try {
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

    if(data.error){
      alert("Erreur publication !");
      return;
    }

    alert("Annonce publiée !");
    go("home");
    loadFeed();

  } catch(e){
    alert("Erreur serveur publish !");
  }
}

/* ======================
INIT
====================== */
go("home");
loadFeed();