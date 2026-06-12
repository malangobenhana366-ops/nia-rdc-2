const API = ""; // Route relative automatique

/* CHARGEMENT DU FIL D'ACTUALITÉ COMPLET */
async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    const data = await res.json();

    const feed = document.getElementById("feed");
    feed.innerHTML = "";

    data.forEach(a=>{
      // Construction propre de l'adresse de localisation
      let localisation = `📍 ${a.ville || 'RDC'}`;
      if(a.commune) localisation += `, Q/ ${a.commune}`;
      if(a.quartier) localisation += ` (Quartier ${a.quartier})`;

      feed.innerHTML += `
        <div class="annonce-card">

          <h3>${a.titre}</h3>
          
          <div class="annonce-price">
            ${a.prix ? `${a.prix} USD / par ${a.periode || 'jour'}` : 'Prix à discuter'}
          </div>

          <div class="annonce-meta">
            ${localisation}
          </div>

          <div class="gallery">
            ${a.images && a.images.length > 0 ? a.images.map(img=>`
              <img src="${img}" class="gallery-item" alt="${a.titre}">
            `).join("") : '<p style="color:#64748b;font-style:italic;padding:10px;">Aucune photo fournie</p>'}
          </div>

          ${a.description ? `<div class="annonce-description">${a.description}</div>` : ''}

          <div class="annonce-footer">
            <span class="badge-status ${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
              ${a.statut === 'occupe' ? '🔴 Actuellement occupé' : '🟢 Disponible'}
            </span>

            ${a.telephone ? `
              <a href="tel:${a.telephone}" class="btn-contact">
                📞 Appeler (${a.telephone})
              </a>
            ` : '<span style="color:#64748b;font-size:0.85rem;">Aucun contact renseigné</span>'}
          </div>

        </div>
      `;
    });
  } catch (error) {
    console.error("Erreur lors du chargement du fil d'actualité:", error);
  }
}

/* COMPRESSION AUTOMATIQUE DES PHOTOS VIA CANVAS */
function compressAndToBase64(file, maxWidth = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/* PUBLISH MULTI */
async function publier(){
  try {
    const files = document.getElementById("image").files;
    let images_base64 = [];

    for(let f of files){
      const compressedData = await compressAndToBase64(f, 1024, 0.7);
      images_base64.push(compressedData);
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

    if(!bodyData.titre) {
      alert("Veuillez donner un nom à votre annonce !");
      return;
    }

    const res = await fetch(`${API}/annonces`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(bodyData)
    });

    if (!res.ok) throw new Error("Échec de sauvegarde");

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
  } catch (e) {
    alert("Erreur lors de la publication. Vérifiez votre base de données.");
    console.error(e);
  }
}

loadFeed();
      
