const API = "https://nia-rdc-2.onrender.com";

/* ======================
UTILS
====================== */
function val(id){
  return document.getElementById(id)?.value?.trim() || "";
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
AUTH (inchangé)
====================== */
async function register(){ /* inchangé */ }
async function login(){ /* inchangé */ }

/* ======================
PUBLISH (CLOUDINARY READY)
====================== */
async function publier(){
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if(!user) return alert("Connecte-toi !");

    /* IMPORTANT : ton input HTML doit avoir id="image" */
    const fileInput = document.getElementById("image");
    const file = fileInput?.files?.[0];

    let image_url = "";

    /* UPLOAD IMAGE SI EXISTE */
    if(file){
      const formData = new FormData();
      formData.append("file", file);

      const upload = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData
      });

      const img = await upload.json();
      image_url = img.url || "";
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
      image_url
    };

    const res = await fetch(`${API}/annonces`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if(!res.ok){
      alert(data.error || "Erreur publication");
      return;
    }

    alert("Annonce publiée 🚀");

    go("home");
    loadFeed();

  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    alert("Erreur serveur");
  }
}

/* ======================
INIT
====================== */
go("home");
loadFeed();
