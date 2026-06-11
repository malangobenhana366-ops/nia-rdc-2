const API = "https://nia-rdc-2.onrender.com";

/* UTILS */
function val(id){
  return document.getElementById(id)?.value?.trim() || "";
}

/* NAV */
function go(page){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById(page);
  if(el) el.classList.add("active");
  if(page === "home") loadFeed();
}

/* UI */
function showLogin(){ go("login"); }
function showRegister(){ go("register"); }

function showApp(){
  document.getElementById("authBox").style.display = "none";
  document.getElementById("appBox").style.display = "block";
}

/* FEED */
async function loadFeed(){
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
        <p>${a.ville || ""} - ${a.quartier || ""}</p>
        <p>${a.prix || 0} ${a.prix_type || ""}</p>
        <p>${a.telephone || ""}</p>

        ${images.map(img =>
          `<img src="${img}" style="width:100%;margin-top:8px;border-radius:10px">`
        ).join("")}
      </div>
    `;
  });
}

/* REGISTER */
async function register(){
  await fetch(`${API}/auth/register`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telephone: val("reg_tel"),
      password: val("reg_pass")
    })
  });

  alert("Compte créé");
  go("login");
}

/* LOGIN */
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

/* MULTI UPLOAD PUBLISH */
async function publier(){
  const user = JSON.parse(localStorage.getItem("user"));
  if(!user) return alert("Connecte-toi");

  const files = document.getElementById("image").files;

  if(!files.length) return alert("Ajoute des images");

  let images_base64 = [];

  for(let f of files){
    const b64 = await toBase64(f);
    images_base64.push(b64);
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
      images: images_base64
    })
  });

  const data = await res.json();

  if(!res.ok) return alert(data.error);

  alert("Annonce publiée 🚀");
  go("home");
  loadFeed();
}

/* BASE64 */
function toBase64(file){
  return new Promise((res, rej)=>{
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
  });
}

/* INIT */
go("home");
loadFeed();
