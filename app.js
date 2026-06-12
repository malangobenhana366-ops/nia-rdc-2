const API = "https://nia-rdc-2.onrender.com";

/* VAL */
function val(id){
  return document.getElementById(id)?.value?.trim() || "";
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
        <p>${a.prix} ${a.prix_type}</p>

        ${a.image_url ? `<img src="${a.image_url}" style="width:100%;margin-top:10px;border-radius:10px">` : ""}
      </div>
    `;
  });
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

/* =====================
   PUBLIER FIX FINAL
===================== */
async function publier(){

  const user = JSON.parse(localStorage.getItem("user"));
  if(!user) return alert("Connecte-toi");

  const files = document.getElementById("image").files;

  let images_base64 = [];

  if(files && files.length > 0){
    for(let f of files){
      images_base64.push(await toBase64(f));
    }
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

  if(!res.ok){
    return alert(data.error || "Erreur");
  }

  alert("Annonce publiée 🚀");

  /* reset clean */
  document.getElementById("titre").value = "";
  document.getElementById("desc").value = "";
  document.getElementById("prix").value = "";
  document.getElementById("ville").value = "";
  document.getElementById("quartier").value = "";
  document.getElementById("telephone").value = "";
  document.getElementById("image").value = "";

  loadFeed();
}

loadFeed();
