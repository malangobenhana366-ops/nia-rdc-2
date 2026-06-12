const API = "https://nia-rdc-2.onrender.com";

/* NAVIGATION FIX (IMPORTANT) */
function go(page){

  document.querySelectorAll(".page").forEach(p=>{
    p.style.display = "none";
  });

  const target = document.getElementById(page);
  if(target){
    target.style.display = "block";
  }

  if(page === "home") loadFeed();
}

/* VAL */
function val(id){
  return document.getElementById(id)?.value?.trim() || "";
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

/* FEED MULTI IMAGES FIX */
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

        ${a.image_url ? `<img src="${a.image_url}" style="width:100%">` : ""}

      </div>
    `;
  });
}

/* REGISTER FIX */
async function register(){

  const res = await fetch(`${API}/auth/register`,{
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

/* LOGIN FIX */
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

/* PUBLISH */
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

/* INIT */
go("home");
loadFeed();
