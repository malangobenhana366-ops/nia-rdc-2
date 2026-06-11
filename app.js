const API = "https://nia-rdc-2.onrender.com";

/* ======================
UTILS
====================== */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function valFile(id) {
  const el = document.getElementById(id);
  return el?.files ? Array.from(el.files) : [];
}

/* ======================
UI NAV
====================== */
function showLogin() {
  document.getElementById("authBox").style.display = "none";
  go("login");
}

function showRegister() {
  document.getElementById("authBox").style.display = "none";
  go("register");
}

function showApp() {
  document.getElementById("authBox").style.display = "none";
  document.getElementById("appBox").style.display = "block";
}

/* ======================
NAVIGATION
====================== */
function go(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  const target = document.getElementById(page);
  if (target) target.classList.add("active");

  if (page === "home") loadFeed();
}

/* ======================
FEED
====================== */
async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`);
    const data = await res.json();

    const feed = document.getElementById("feed");
    if (!feed) return;

    feed.innerHTML = "";

    data.forEach(a => {
      feed.innerHTML += `
        <div style="background:#fff;padding:10px;margin:10px;border-radius:10px">
          <h3>${a.titre || ""}</h3>
          <p>📍 ${a.ville || ""}</p>
          <p>💰 ${a.price || 0}</p>
          <img src="${a.image_url || ""}" style="width:100%;border-radius:8px">
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
async function register() {
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telephone: val("reg_tel"),
        password: val("reg_pass")
      })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.error || "Erreur inscription !");

    alert("Compte créé !");
    go("login");

  } catch (e) {
    alert("Erreur serveur inscription !");
  }
}

/* ======================
LOGIN
====================== */
async function login() {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telephone: val("login_tel"),
        password: val("login_pass")
      })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.error || "Erreur connexion !");

    localStorage.setItem("user", JSON.stringify(data));

    alert("Connecté !");
    showApp();
    go("home");

  } catch (e) {
    alert("Erreur serveur login !");
  }
}

/* ======================
PUBLISH (FIX FINAL CLEAN)
====================== */
async function publier() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("Connecte-toi !");
      return;
    }

    const photos = valFile("photos");

    const payload = {
      user_id: user.id,
      titre: val("titre"),
      description: val("desc"),
      ville: val("ville"),
      categorie: "general",
      image_url: "",
      price: Number(val("prix") || 0)
    };

    // IMPORTANT: on ne casse pas backend → pas de champs inutiles envoyés

    const res = await fetch(`${API}/annonces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("SERVER ERROR:", data);
      return alert(data.error || "create error");
    }

    alert("Annonce publiée !");
    go("home");
    loadFeed();

  } catch (e) {
    console.log(e);
    alert("Erreur serveur publish !");
  }
}

/* INIT */
go("home");
loadFeed();
