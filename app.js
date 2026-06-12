const API = ""; // Route relative automatique (plus de bugs d'URLs absolues)

/* FEED */
async function loadFeed(){
  try {
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

        // Calcul du redimensionnement proportionnel
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Exportation en Base64 compressé (JPEG)
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

    // Compression et conversion de chaque photo sélectionnée
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

    const res = await fetch(`${API}/annonces`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(bodyData)
    });

    if (!res.ok) {
      throw new Error("Échec de la sauvegarde.");
    }

    await res.json();
    alert("Votre offre de location est en ligne ! 🚀");

    // Reset complet du formulaire
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
  
