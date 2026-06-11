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
  document.getElementById("authBox").style.display = "none";
  document.getElementById("appBox").style.display = "block";
}

/* ======================
BASE64 MULTI IMAGES
====================== */
function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => resolve(r.result);
    r.onerror = reject;
  });
}

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

      let imagesHTML = "";

      if(a.image_url){
        imagesHTML += `<img src="${a.image_url}" style="width:100%;margin-top:10px;border-radius:10px">`;
      }

      // support futur multi images (si backend évolue)
      if(a.images){
        try {
          const imgs = typeof a.images === "string" ? JSON.parse(a.images) : a.images;
          imgs.forEach(img=>{
            imagesHTML += `<img src="${img}" style="width:100%;margin-top:10px;border-radius:10px">`;
          });
        } catch(e){}
      }

      feed.innerHTML += `
        <div style="background:#fff;padding:10px;margin:10px;border-radius:10px">
          <h3>${a.titre || ""}</h3>
          <p>📍 ${a.ville || ""} - ${a.quartier || ""}</p>
          <p>💰 ${a.prix || 0} ${a.prix_type || ""}</p>
          <p>📞 ${a.telephone || ""}</p>
          <p>📦 ${a.disponibilite || ""}</p>
          ${imagesHTML}
        </div>
      `;
    });

  } catch (err) {
    console.log("FEED ERROR:", err);
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
      body:JSON.stringify({
        telephone: val("reg_tel"),
        password: val("reg_pass")
      })
    });

    const data = await res.json();

    if(!res.ok) return alert(data.error || "Erreur inscription");

    alert("Compte créé");
    go("login");

  } catch {
    alert("Erreur serveur");
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
      body:JSON.stringify({
        telephone: val("login_tel"),
        password: val("login_pass")
      })
    });

    const data = await res.json();

    if(!res.ok) return alert(data.error || "Erreur connexion");

    localStorage.setItem("user", JSON.stringify(data));

    showApp();
    go("home");

  } catch {
    alert("Erreur serveur");
  }
}

/* ======================
PUBLISH MULTI PHOTOS (IMPORTANT)
====================== */
async function publier(){
  try {

    const user = JSON.parse(localStorage.getItem("user"));
    if(!user) return alert("Connecte-toi");

    const input = document.getElementById("image");
    const files = input?.files;

    if(!files || files.length === 0){
      return alert("Ajoute au moins une photo");
    }

    let images_base64 = [];

    for(let f of files){
      images_base64.push(await fileToBase64(f));
    }

    const res = await fetch(`${API}/annonces`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        user_id: user.id,
        titre: val("titre"),
        description: val("desc"),
        prix: val("prix"),
        prix_type: val("prix_type"),
        ville: val("ville"),
        quartier: val("quartier"),
        telephone: val("telephone"),
        disponibilite: val("disponibilite"),
        images_base64
      })
    });

    const data = await res.json();

    if(!res.ok){
      return alert(data.error || "Erreur publication");
    }

    alert("Annonce publiée 🚀");
    go("home");
    loadFeed();

  } catch (e) {
    console.log(e);
    alert("Erreur serveur");
  }
}

/* INIT */
go("home");
loadFeed();
