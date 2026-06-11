const API = "https://nia-rdc-2.onrender.com";

function val(id){
  return document.getElementById(id)?.value?.trim() || "";
}

function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById(page);
  if(el) el.classList.add("active");
  if(page === "home") loadFeed();
}

function showLogin(){ go("login"); }
function showRegister(){ go("register"); }

function showApp(){
  document.getElementById("authBox").style.display = "none";
  document.getElementById("appBox").style.display = "block";
}

async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  if(!feed) return;

  feed.innerHTML = "";

  data.forEach(a => {
    let imgs = [];
    try { imgs = JSON.parse(a.images || "[]"); } catch {}

    feed.innerHTML += `
      <div style="background:#fff;padding:10px;margin:10px;border-radius:10px">
        <h3>${a.titre || ""}</h3>
        <p>${a.ville || ""} - ${a.quartier || ""}</p>
        <p>${a.prix || 0} ${a.prix_type || ""}</p>
        <p>${a.telephone || ""}</p>

        ${imgs.map(i => `<img src="${i}" style="width:100%;margin-top:8px;border-radius:10px">`).join("")}
      </div>
    `;
  });
}

async function register(){
  const res = await fetch(`${API}/auth/register`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telephone: val("reg_tel"),
      password: val("reg_pass")
    })
  });

  const data = await res.json();
  if(!res.ok) return alert(data.error);

  alert("Compte créé");
  go("login");
}

async function login(){
  const res = await fetch(`${API}/auth/login`, {
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
}

async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));
  if(!user) return alert("Connecte-toi");

  const files = document.getElementById("image")?.files || [];
  let images = [];

  for(let f of files){
    images.push(await toBase64(f));
  }

  const res = await fetch(`${API}/annonces`, {
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
}

function toBase64(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result);
    r.onerror = rej;
  });
}

go("home");
loadFeed();
