const API = "https://nia-rdc-2.onrender.com";

function go(page){
  document.querySelectorAll("section").forEach(s=>{
    s.style.display="none";
  });

  document.getElementById(page).style.display="block";

  if(page==="home") loadFeed();
}

function val(id){
  return document.getElementById(id)?.value || "";
}

function toBase64(file){
  return new Promise((res)=>{
    const r = new FileReader();
    r.onload = ()=>res(r.result);
    r.readAsDataURL(file);
  });
}

/* FEED */
async function loadFeed(){
  const r = await fetch(`${API}/feed`);
  const data = await r.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(a=>{
    feed.innerHTML += `
      <div onclick='openAnnonce(${JSON.stringify(a)})'
        style="border:1px solid #ccc;margin:10px;padding:10px;cursor:pointer">

        <img src="${a.image_url}" style="width:100%;height:180px;object-fit:cover">

        <h3>${a.titre}</h3>
      </div>
    `;
  });
}

/* DETAIL + BOUTON PHOTOS GARANTI */
function openAnnonce(a){

  go("detail");

  const images = a.images || [];

  const d = document.getElementById("detail");

  d.innerHTML = `
    <button onclick="go('home')">⬅ Retour</button>

    <h2>${a.titre}</h2>

    <p>${a.description}</p>
    <p>${a.prix}</p>
    <p>${a.ville}</p>
    <p>${a.quartier}</p>
    <p>${a.telephone}</p>

    <button onclick="togglePhotos()">📸 Voir les photos</button>

    <div id="gallery" style="display:none;flex;overflow-x:auto;gap:10px">
      ${images.map(img=>`
        <img src="${img}" style="width:250px;height:250px;object-fit:cover">
      `).join("")}
    </div>
  `;

  window.currentGallery = images;
}

/* TOGGLE ULTRA STABLE */
function togglePhotos(){
  const g = document.getElementById("gallery");
  if(!g) return;
  g.style.display = g.style.display === "none" ? "flex" : "none";
}

/* REGISTER */
async function register(){
  await fetch(`${API}/auth/register`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telephone:val("reg_tel"),
      password:val("reg_pass")
    })
  });

  go("login");
}

/* LOGIN */
async function login(){
  const r = await fetch(`${API}/auth/login`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      telephone:val("login_tel"),
      password:val("login_pass")
    })
  });

  const data = await r.json();
  if(!r.ok) return alert(data.error);

  localStorage.setItem("user",JSON.stringify(data));
  go("home");
}

/* PUBLISH */
async function publier(){

  const user = JSON.parse(localStorage.getItem("user"));
  if(!user) return alert("login first");

  const files = document.getElementById("image").files;

  let images = [];

  for(const f of files){
    images.push(await toBase64(f));
  }

  await fetch(`${API}/annonces`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      user_id:user.id,
      titre:val("titre"),
      description:val("desc"),
      prix:val("prix"),
      ville:val("ville"),
      quartier:val("quartier"),
      telephone:val("telephone"),
      images_base64:images
    })
  });

  go("home");
  loadFeed();
}

/* INIT */
go("home");
loadFeed();
