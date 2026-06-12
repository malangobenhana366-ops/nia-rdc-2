const API = "https://nia-rdc-2.onrender.com";

/* FEED */
async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(a => {

    feed.innerHTML += `
      <div style="border:1px solid #ccc;margin:10px;padding:10px">

        <h3>${a.titre}</h3>

        <p>${a.ville} - ${a.quartier}</p>
        <p>${a.prix}</p>

        <!-- 🔥 AFFICHAGE MULTI IMAGES (IMPORTANT FIX) -->
        <div style="display:flex;overflow-x:auto;gap:10px">
          ${a.image_url ? `
            <img src="${a.image_url}" style="width:200px;height:200px;object-fit:cover">
          ` : ""}
        </div>

      </div>
    `;
  });
}

/* UPLOAD MULTI */
async function publier(){

  const files = document.getElementById("image").files;

  let images_base64 = [];

  for(let f of files){
    images_base64.push(await toBase64(f));
  }

  const res = await fetch(`${API}/annonces`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      user_id: 1,
      titre: document.getElementById("titre").value,
      description: document.getElementById("desc").value,
      prix: document.getElementById("prix").value,
      ville: document.getElementById("ville").value,
      quartier: document.getElementById("quartier").value,
      telephone: document.getElementById("telephone").value,
      images_base64
    })
  });

  const data = await res.json();

  if(!res.ok) return alert("Erreur");

  alert("Publié 🚀");

  // 🔥 FIX IMPORTANT RESET INPUT
  document.getElementById("image").value = "";

  loadFeed();
}

/* BASE64 */
function toBase64(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

loadFeed();
