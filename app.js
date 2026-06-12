const API = "https://nia-rdc-2.onrender.com";

/* ======================
UTILS
====================== */
function val(id){
  return document.getElementById(id)?.value?.trim() || "";
}

/* ======================
NAV
====================== */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById(page);
  if(el) el.classList.add("active");
  if(page === "home") loadFeed();
}

/* ======================
AUTH UI
====================== */
function showLogin(){ go("login"); }
function showRegister(){ go("register"); }

function showApp(){
  const auth = document.getElementById("authBox");
  const app = document.getElementById("appBox");
  if(auth) auth.style.display = "none";
  if(app) app.style.display = "block";
}

/* ======================
FEED (AFFICHAGE MULTI PHOTOS)
====================== */
async function loadFeed(){
  try{
    const res = await fetch(`${API}/feed`);
    const data = await res.json();

    const feed = document.getElementById("feed");
    if(!feed) return;

    feed.innerHTML = "";

    data.forEach(a => {

      let images = [];
      try {
        images = a.images ? JSON.parse(a.images) : [];
      } catch(e){}

      feed.innerHTML += `
        <div style="background:#fff;padding:10px;margin:10px;border-radius:10px">
          <h3>${a.titre || ""}</h3>
          <p>📍 ${a.ville || ""} - ${a.quartier || ""}</p>
          <p>💰 ${a.prix || 0} ${a.prix_type || ""}</p>
          <p>📞 ${a.telephone || ""}</p>

          ${images.map(img => `
            <img src="${img}" style="width:100%;margin-top:8px;border-radius:10px">
          `).join("")}

        </div>
      `;
    });

  } catch(err){
    console.log("FEED ERROR", err);
  }
}

/* ======================
REGISTER
====================== */
async function register(){
  try{
    const res = await fetch(`${API}/auth/register`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        telephone: val("reg_tel"),
        password: val("reg_pass")
      })
    });

    const data = await res.json();
    if(!res.ok) return alert(data.error || "Erreur inscription");

    alert("Compte créé");
    go("login");

  }catch(e){
    alert("Erreur serveur");
  }
}

/* ======================
LOGIN
====================== */
async function login(){
  try{
    const res = await fetch(`${API}/auth/login`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        telephone: val("login_tel"),
        password: val("login_pass")
      })
    });

    const data = await res.json();
    if(!res.ok) return alert(data.error);

    localStorage.setItem("user", JSON.stringify(data));

    showApp();
    go("home");

  }catch(e){
    alert("Erreur serveur");
  }
}

/* ======================
PUBLISH MULTI IMAGES
====================== */
async function publier(){
  try{
    const user = JSON.parse(localStorage.getItem("user"));
    if(!user) return alert("Connecte-toi");

    const files = document.getElementById("image").files;

    if(!files.length) return alert("Ajoute des images");

    let images = [];

    for(let f of files){
      const b64 = await toBase64(f);
      images.push(b64);
    }

    const res = await fetch(`${API}/annonces`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        user_id:user.id,
        titre:val("titre"),
        description:val("desc"),
        prix:val("prix"),
        prix_type:val("prix_type"),
        ville:val("ville"),
        quartier:val("quartier"),
        telephone:val("telephone"),
        disponibilite:val("disponibilite"),
        images
      })
    });

    const data = await res.json();
    if(!res.ok) return alert(data.error);

    alert("Annonce publiée 🚀");
    go("home");
    loadFeed();

  }catch(e){
    alert("Erreur serveur");
  }
}

/* ======================
BASE64
====================== */
function toBase64(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => resolve(r.result);
    r.onerror = reject;
  });
}

/* INIT */
go("home");
loadFeed();
