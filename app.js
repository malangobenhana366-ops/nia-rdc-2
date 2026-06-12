const API = "https://nia-rdc-2.onrender.com";

/* NAV SIMPLE (IMPORTANT) */
function go(page){

  document.querySelectorAll("section").forEach(s=>{
    s.style.display = "none";
  });

  document.getElementById(page).style.display = "block";

  if(page === "home") loadFeed();
}

function showLogin(){ go("login"); }
function showRegister(){ go("register"); }

function val(id){
  return document.getElementById(id)?.value || "";
}

/* FEED */
async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(a=>{
    feed.innerHTML += `
      <div style="border:1px solid #ccc;margin:10px;padding:10px">
        <h3>${a.titre}</h3>
        <p>${a.ville} - ${a.quartier}</p>
        <p>${a.prix}</p>
        ${a.image_url ? `<img src="${a.image_url}" style="width:100%">` : ""}
      </div>
    `;
  });
}

/* REGISTER */
async function register(){
  await fetch(`${API}/auth/register`,{
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

  document.getElementById("authBox").style.display = "none";
  document.getElementById("appBox").style.display = "block";

  go("home");
}

/* PUBLISH (STABLE) */
async function publier(){

  const user = JSON.parse(localStorage.getItem("user"));
  if(!user) return alert("Connecte-toi");

  const files = document.getElementById("image").files;

  let images_base64 = [];

  for(let f of files){
    images_base64.push(await toBase64(f));
  }

  const res = await fetch(`${API}/annonces`,{
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

  if(!res.ok) return alert(data.error);

  alert("Publié 🚀");

  go("home");
  loadFeed();
}

/* BASE64 */
function toBase64(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload = ()=>res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/* INIT */
go("home");
loadFeed();
