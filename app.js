const API = "https://nia-rdc-2.onrender.com";

/* NAV */
function go(page){
  document.querySelectorAll("section").forEach(s=>{
    s.style.display = "none";
  });

  document.getElementById(page).style.display = "block";

  if(page === "home") loadFeed();
}

/* VAL */
function val(id){
  return document.getElementById(id)?.value || "";
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

/* FEED (CARDS + CLICK DETAIL) */
async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(a=>{

    feed.innerHTML += `
      <div onclick='openAnnonce(${JSON.stringify(a)})'
           style="border:1px solid #ddd;margin:10px;padding:10px;cursor:pointer">

        <img src="${a.image_url}" style="width:100%;height:180px;object-fit:cover">

        <h3>${a.titre}</h3>
        <p>${a.ville} - ${a.quartier}</p>
        <p>${a.prix}</p>

      </div>
    `;
  });
}

/* DETAIL ANNONCE */
function openAnnonce(a){

  document.querySelectorAll("section").forEach(s=>{
    s.style.display = "none";
  });

  const d = document.getElementById("detail");
  d.style.display = "block";

  d.innerHTML = `
    <button onclick="go('home')">⬅ Retour</button>

    <h2>${a.titre}</h2>

    <div style="display:flex;overflow-x:auto;gap:10px">
      ${(a.images || []).map(img=>`
        <img src="${img}" style="width:250px;height:250px;object-fit:cover">
      `).join("")}
    </div>

    <p><b>Prix:</b> ${a.prix}</p>
    <p><b>Ville:</b> ${a.ville}</p>
    <p><b>Quartier:</b> ${a.quartier}</p>
    <p><b>Description:</b> ${a.description}</p>
  `;
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

  alert("OK");
  go("login");
}

/* INIT */
go("home");
loadFeed();
