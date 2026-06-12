const API = "https://nia-rdc-2.onrender.com";

/* FEED */
async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(a=>{
    const link = `details.html?id=${a.id}`;

    feed.innerHTML += `
      <div style="border:1px solid #ccc; margin:10px; padding:15px; border-radius:8px; background:#fff; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">

        <h3><a href="${link}" style="text-decoration:none; color:#2563eb; font-size:1.2rem;">${a.titre}</a></h3>
        
        <p style="font-weight:bold; color:#1e293b; margin:5px 0;">
          ${a.prix ? `${a.prix} USD / ${a.periode || 'jour'}` : 'Prix non spécifié'}
        </p>

        <p style="color:#64748b; font-size:0.9rem; margin-bottom: 10px;">
          📍 ${a.ville}${a.commune ? `, ${a.commune}` : ''} (${a.quartier})
        </p>

        <div class="gallery">
          ${a.images && a.images.length > 0 ? a.images.map(img=>`
            <a href="${link}"><img src="${img}" alt="${a.titre}"></a>
          `).join("") : '<p style="color:#64748b;font-style:italic;">Aucune photo</p>'}
        </div>

        <div style="margin-top:12px; font-size:0.85rem; font-weight:600;">
          ${a.statut === 'occupe' ? '🔴 Actuellement occupé' : '🟢 Disponible'}
        </div>

      </div>
    `;
  });
}

/* PUBLISH MULTI */
async function publier(){
  const files = document.getElementById("image").files;
  let images_base64 = [];

  for(let f of files){
    images_base64.push(await toBase64(f));
  }

  const bodyData = {
    user_id: 1,
    titre: document.getElementById("titre").value,
    prix: document.getElementById("prix").value,
    periode: document.getElementById("periode").value,
    telephone: document.getElementById("telephone").value,
    description: document.getElementById("description").value,
    ville: document.getElementById("ville").value,
    commune: document.getElementById("commune").value,
    quartier: document.getElementById("quartier").value,
    statut: document.getElementById("statut").value,
    images_base64
  };

  const res = await fetch(`${API}/annonces`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(bodyData)
  });

  await res.json();

  alert("Votre offre de location est en ligne ! 🚀");

  // Reset du formulaire
  document.getElementById("titre").value = "";
  document.getElementById("prix").value = "";
  document.getElementById("telephone").value = "";
  document.getElementById("description").value = "";
  document.getElementById("ville").value = "";
  document.getElementById("commune").value = "";
  document.getElementById("quartier").value = "";
  document.getElementById("image").value = "";

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

loadFeed();
