const API = ""; 
let toutesLesAnnonces = []; // Stockage local global pour faciliter la recherche

/* OUVERTURE / FERMETURE DES MODALES Popups */
function ouvrirModal(id) {
  document.getElementById(`modal-${id}`).style.display = "flex";
}

function fermerModal(id) {
  document.getElementById(`modal-${id}`).style.display = "none";
}

/* CHARGEMENT ET RENDU DES ANNONCES */
async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    afficherAnnonces(toutesLesAnnonces);
  } catch (error) {
    console.error("Erreur de chargement:", error);
    document.getElementById("feed").innerHTML = '<p style="color:#ef4444; text-align:center;">Erreur lors du chargement des annonces.</p>';
  }
}

function afficherAnnonces(liste) {
  const feed = document.getElementById("feed");
  
  if (liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; font-style:italic; text-align:center; padding:20px;">Aucune offre correspondante trouvée.</p>';
    return;
  }

  feed.innerHTML = "";
  liste.forEach(a=>{
    let localisation = `📍 ${a.ville || 'RDC'}`;
    if(a.commune) localisation += `, Commune de ${a.commune}`;
    if(a.quartier) localisation += ` (Q/ ${a.quartier})`;

    feed.innerHTML += `
      <div class="annonce-card">
        <h3>${a.titre}</h3>
        <div class="annonce-price">${a.prix ? `${a.prix} USD / par ${a.periode || 'jour'}` : 'Prix à négocier'}</div>
        <div class="annonce-meta">${localisation}</div>

        <div class="gallery">
          ${a.images && a.images.length > 0 ? a.images.map(img=>`
            <img src="${img}" class="gallery-item" alt="${a.titre}">
          `).join("") : '<p style="color:#64748b; font-style:italic; padding:10px;">Aucune photo</p>'}
        </div>

        ${a.description ? `<div class="annonce-description">${a.description}</div>` : ''}

        <div class="annonce-footer">
          <span class="badge-status ${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
            ${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}
          </span>
          ${a.telephone ? `<a href="tel:${a.telephone}" class="btn-contact">📞 Appeler (${a.telephone})</a>` : ''}
        </div>
      </div>
    `;
  });
}

/* FONCTIONNALITÉ DU BOUTON RECHERCHER */
function rechercher() {
  const sTitre = document.getElementById("search-titre").value.toLowerCase().trim();
  const sVille = document.getElementById("search-ville").value.toLowerCase().trim();
  const sCommune = document.getElementById("search-commune").value.toLowerCase().trim();
  const sQuartier = document.getElementById("search-quartier").value.toLowerCase().trim();

  if(!sTitre && !sVille && !sCommune && !sQuartier) {
    alert("Veuillez remplir au moins le champ Recherche ou Ville.");
    return;
  }

  // Filtrage intelligent
  const annoncesFiltrees = toutesLesAnnonces.filter(a => {
    const matchTitre = !sTitre || (a.titre && a.titre.toLowerCase().includes(sTitre));
    const matchVille = !sVille || (a.ville && a.ville.toLowerCase().includes(sVille));
    const matchCommune = !sCommune || (a.commune && a.commune.toLowerCase().includes(sCommune));
    const matchQuartier = !sQuartier || (a.quartier && a.quartier.toLowerCase().includes(sQuartier));

    return matchTitre && matchVille && matchCommune && matchQuartier;
  });

  // Mise à jour de l'affichage
  document.getElementById("feed-title").innerText = "Résultats de la recherche 🔍";
  document.getElementById("reset-btn").style.display = "inline-block";
  
  afficherAnnonces(annoncesFiltrees);
  fermerModal('rechercher');
}

function annulerRecherche() {
  document.getElementById("search-titre").value = "";
  document.getElementById("search-ville").value = "";
  document.getElementById("search-commune").value = "";
  document.getElementById("search-quartier").value = "";
  document.getElementById("feed-title").innerText = "Annonces récentes";
  document.getElementById("reset-btn").style.display = "none";
  afficherAnnonces(toutesLesAnnonces);
}

/* FONCTIONNALITÉ DU BOUTON PUBLIER (AVEC COMPRESSION) */
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
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

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

    if(!bodyData.titre || !bodyData.ville) {
      alert("Le Titre et la Ville sont obligatoires pour publier !");
      return;
    }

    const res = await fetch(`${API}/annonces`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(bodyData)
    });

    if (!res.ok) throw new Error("Échec");

    await res.json();
    alert("Votre offre de location est en ligne ! 🚀");

    // Reset du formulaire & fermeture
    document.getElementById("titre").value = "";
    document.getElementById("prix").value = "";
    document.getElementById("telephone").value = "";
    document.getElementById("description").value = "";
    document.getElementById("ville").value = "";
    document.getElementById("commune").value = "";
    document.getElementById("quartier").value = "";
    document.getElementById("image").value = "";
    
    fermerModal('publier');
    loadFeed();
  } catch (e) {
    alert("Erreur lors de la publication.");
    console.error(e);
  }
}

loadFeed();
      
