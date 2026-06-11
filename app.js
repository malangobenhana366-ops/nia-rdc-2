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

  const target = document.getElementById(page);
  if(target) target.classList.add("active");

  if(page === "home") loadFeed();
}

/* ======================
FEED (AVEC IMAGE PRINCIPALE)
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
          <p>📍 ${a.ville || ""}</p>
          <p>🏷️ ${a.quartier || ""}</p>
          <p>💰 ${a.prix || 0} ${a.prix_type || ""}</p>
          <p>📞 ${a.telephone || ""}</p>
          <p>📦 ${a.disponibilite || ""}</p>

          ${a.image_url ? `
            <img src="${a.image_url}" 
            style="width:100%;margin-top:10px;border-radius:10px">
          ` : ""}
        </div>
      `;
    });

  } catch (err) {
    console.log("FEED ERROR:", err);
  }
}

/* ======================
LOGIN (inchangé logique)
====================== */
async function login(){
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        telephone: val("login_tel"),
        password: val("login_pass")
      })
    });

    const data = await res.json();

    if(!res.ok){
      return alert(data.error || "Erreur login");
    }

    localStorage.setItem("user", JSON.stringify(data));

    alert("Connecté 🚀");
    go("home");
    loadFeed();

  } catch (err) {
    console.error(err);
    alert("Erreur serveur login");
  }
}

/* ======================
REGISTER (inchangé logique)
====================== */
async function register(){
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        telephone: val("reg_tel"),
        password: val("reg_pass")
      })
    });

    const data = await res.json();

    if(!res.ok){
      return alert(data.error || "Erreur register");
    }

    alert("Compte créé 🚀");
    go("login");

  } catch (err) {
    console.error(err);
    alert("Erreur serveur register");
  }
}

/* ======================
🔥 PUBLISH MULTI PHOTOS READY
====================== */
async function publier(){
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if(!user) return alert("Connecte-toi !");

    const files = document.getElementById("photos")?.files;

    let images = [];

    if(files && files.length > 0){
      for(let i = 0; i < Math.min(files.length, 5); i++){
        const base64 = await toBase64(files[i]);
        images.push(base64);
      }
    }

    const payload = {
      user_id: user.id,
      titre: val("titre"),
      description: val("desc"),
      prix: Number(val("prix") || 0),
      prix_type: val("prix_type"),
      ville: val("ville"),
      quartier: val("quartier"),
      telephone: val("telephone"),
      disponibilite: val("disponibilite"),
      images // 👈 IMPORTANT (multi images)
    };

    const res = await fetch(`${API}/annonces`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if(!res.ok){
      console.log(data);
      return alert(data.error || "Erreur publication");
    }

    alert("Annonce publiée 🚀");
    go("home");
    loadFeed();

  } catch (err) {
    console.error(err);
    alert("Erreur serveur publication");
  }
}

/* ======================
CONVERT FILE → BASE64
====================== */
function toBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
  });
}

/* INIT */
go("home");
loadFeed();
