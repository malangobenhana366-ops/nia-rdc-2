const API = ""; // Route relative automatique

/* CHARGEMENT DIRECT DES ANNONCES AVEC TOUTES LES INFOS ET IMAGES ENTIÈRES */
async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    const data = await res.json();

    const feed = document.getElementById("feed");
    
    if (data.length === 0) {
      feed.innerHTML = '<p style="color:#64748b; font-style:italic; text-align:center; padding:20px;">Aucune offre de location disponible pour le moment.</p>';
      return;
    }

    feed.innerHTML = "";

    data.forEach(a=>{
      // Configuration claire de l'emplacement géographique
      let localisation = `📍 ${a.ville || 'RDC'}`;
      if(a.commune) localisation += `, Commune de ${a.commune}`;
      if(a.quartier) localisation += ` (Q/ ${a.quartier})`;

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
            `).join("") : '<p style="color:#64748b; font-style:italic; padding:10px;">Aucune photo jointe</p>'}
          </div>

          ${a.description ? `<div class="annonce-description">${a.description}</div>` : ''}

          <div class="annonce-footer">
            <span class="badge-status ${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
              ${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}
            </span>

            ${a.telephone ? `
              <a href="tel:${a.telephone}" class="btn-contact">
                📞 Appeler (${a.telephone})
              </a>
            ` : '<span style="color:#64748b; font-size:0.8rem;">Pas de téléphone</span>'}
          </div>

        </div>
      `;
    });
  } catch (error) {
    console.error("Erreur lors du chargement du fil d'actualité NIA RDC:", error);
    document.getElementById("feed").innerHTML = '<p style="color:#ef4444; text-align:center;">Erreur lors du chargement des annonces. Vérifiez la connexion.</p>';
  }
}

// Lancement automatique du flux au démarrage
loadFeed();
