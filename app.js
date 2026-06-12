const API = ""; 
let toutesLesAnnonces = [];
let idAnnonceEnCoursDeBoost = null;

function ouvrirModal(id) { document.getElementById(`modal-${id}`).style.display = "flex"; }
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

/* CHARGEMENT & TRAITEMENT DES DONNÉES DU FLUX */
async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    afficherAnnonces(toutesLesAnnonces);
  } catch (error) {
    console.error(error);
  }
}

function afficherAnnonces(liste) {
  const feed = document.getElementById("feed");
  if (liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">Aucune offre correspondante.</p>';
    return;
  }
  feed.innerHTML = "";
  liste.forEach(a=>{
    let localisation = `📍 ${a.ville || 'RDC'}`;
    if(a.commune) localisation += `, ${a.commune}`;
    if(a.quartier) localisation += ` (Q/ ${a.quartier})`;

    // Condition d'affichage Premium VIP
    const estVip = a.is_vip === true || a.user_id === 2; // Simulation ID 2 comme boutique ou champ is_vip bdd

    feed.innerHTML += `
      <div class="annonce-card ${estVip ? 'vip-premium' : ''}">
        ${estVip ? `<span class="vip-badge-tag">👑 Boutique VIP</span>` : ''}
        <h3>${a.titre}</h3>
        <div class="annonce-price">${a.prix ? `${a.prix} USD / par ${a.periode}` : 'À négocier'}</div>
        <div class="annonce-meta">${localisation}</div>

        <div class="gallery">
          ${a.images && a.images.length > 0 ? a.images.map(img=>`<img src="${img}" class="gallery-item">`).join("") : '<p style="padding:10px; color:#64748b;">Aucune photo</p>'}
        </div>

        ${a.description ? `<div class="annonce-description">${a.description}</div>` : ''}

        <div class="annonce-footer">
          <span class="badge-status ${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
            ${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}
          </span>
          <div class="footer-actions">
            ${estVip ? `<button class="btn-shop" onclick="filtrerParBoutique(${a.user_id}, '${a.titre}')">🏢 Visiter la boutique</button>` : ''}
            <button class="btn-boost" onclick="lancerLancementPubBoost(${a.id})">🚀 Booster</button>
            ${a.telephone ? `<a href="tel:${a.telephone}" class="btn-contact">📞 Appeler</a>` : ''}
          </div>
        </div>
      </div>
    `;
  });
}

/* FILTRAGE PAR BOUTIQUE VIP VIA LE FLUX UNIQUE */
function filtrerParBoutique(userId, nomExemple) {
  const offresBoutique = toutesLesAnnonces.filter(a => a.user_id === userId);
  document.getElementById("feed-title").innerText = `Vitrine VIP`;
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(offresBoutique);
}

/* RECHERCHE CLASSIQUE DANS LA BARRE UNIQUE */
function rechercher() {
  const sTitre = document.getElementById("search-titre").value.toLowerCase().trim();
  const sVille = document.getElementById("search-ville").value.toLowerCase().trim();
  const sCommune = document.getElementById("search-commune").value.toLowerCase().trim();
  const sQuartier = document.getElementById("search-quartier").value.toLowerCase().trim();

  const filtre = toutesLesAnnonces.filter(a => {
    return (!sTitre || (a.titre && a.titre.toLowerCase().includes(sTitre))) &&
           (!sVille || (a.ville && a.ville.toLowerCase().includes(sVille))) &&
           (!sCommune || (a.commune && a.commune.toLowerCase().includes(sCommune))) &&
           (!sQuartier || (a.quartier && a.quartier.toLowerCase().includes(sQuartier)));
  });

  document.getElementById("feed-title").innerText = "Résultats de recherche";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(filtre);
  fermerModal('rechercher');
}

function annulerRecherche() {
  document.getElementById("feed-title").innerText = "Annonces récentes";
  document.getElementById("reset-btn").style.display = "none";
  afficherAnnonces(toutesLesAnnonces);
}

/* SYSTÈME DE COMPRESSION D'IMAGE */
function compressAndToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > 900) { h = Math.round((h * 900) / w); w = 900; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
}

/* COMPORTEMENT ET INITIALISATION DE L'ESPACE COMPOSANTS MULTIPLES VIP */
let countObjetsBulk = 0;
function ouvrirEspaceVip() {
  document.getElementById("bulk-items-container").innerHTML = "";
  countObjetsBulk = 0;
  ajouterChampObjetUnique(); // On met au moins une ligne par défaut
  ouvrirModal('vip');
}

function ajouterChampObjetUnique() {
  countObjetsBulk++;
  const container = document.getElementById("bulk-items-container");
  const htmlBox = document.createElement('div');
  htmlBox.className = "bulk-item-box";
  htmlBox.id = `bulk-box-${countObjetsBulk}`;
  htmlBox.innerHTML = `
    <button type="button" class="btn-remove-bulk" onclick="document.getElementById('bulk-box-${countObjetsBulk}').remove()">✕</button>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <div class="form-group" style="grid-column:span 2">
        <label>Nom de l'objet unique</label>
        <input class="bulk-titre" placeholder="Ex: Robe sirène rouge satin">
      </div>
      <div class="form-group">
        <label>Prix (USD)</label>
        <input type="number" class="bulk-prix" placeholder="25">
      </div>
      <div class="form-group">
        <label>Photos de cet objet</label>
        <input type="file" class="bulk-image" accept="image/*" multiple>
      </div>
    </div>
  `;
  container.appendChild(htmlBox);
}

/* ENVOI DU CATALOGUE EN MASSE AU SERVEUR (BOUCLE JS) */
async function publierCatalogueEnMasse() {
  const shopName = document.getElementById("vip-shop-name").value;
  const telephone = document.getElementById("vip-phone").value;
  const ville = document.getElementById("vip-ville").value;
  const commune = document.getElementById("vip-commune").value;

  const boxes = document.querySelectorAll(".bulk-item-box");
  if(boxes.length === 0 || !shopName) { alert("Remplissez les informations de la boutique."); return; }

  alert(`Traitement de ${boxes.length} articles en cours... L'opération peut prendre un moment selon votre connexion.`);

  for(let box of boxes) {
    const titreSpécifique = box.querySelector(".bulk-titre").value;
    const prixSpécifique = box.querySelector(".bulk-prix").value;
    const inputFiles = box.querySelector(".bulk-image").files;

    if(!titreSpécifique) continue;

    let images_base64 = [];
    for(let f of inputFiles) {
      const dataB64 = await compressAndToBase64(f);
      images_base64.push(dataB64);
    }

    // On prépare l'envoi indépendant avec l'identifiant Boutique (User ID 2 simulé Pro VIP)
    await fetch(`${API}/annonces`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        user_id: 2, // Compte Boutique VIP Pro
        titre: `${shopName} - ${titreSpécifique}`,
        description: `Offre exclusive déposée par la maison ${shopName}.`,
        prix: prixSpécifique,
        periode: "jour",
        ville, commune, quartier: "",
        telephone,
        statut: "disponible",
        images_base64
      })
    });
  }

  alert("Félicitations, tout votre catalogue boutique a été importé individuellement ! 👑");
  fermerModal('vip');
  loadFeed();
}

/* PUBLICATION SIMPLE */
async function publier(){
  try {
    const files = document.getElementById("image").files;
    let images_base64 = [];
    for(let f of files){ images_base64.push(await compressAndToBase64(f)); }

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

    await fetch(`${API}/annonces`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(bodyData)
    });

    fermerModal('publier');
    loadFeed();
  } catch (e) { alert("Erreur"); }
}

/* ACTIONNEUR DE LA PUB ADSENSE POUR LE BOOST */
function lancerLancementPubBoost(idAnnonce) {
  idAnnonceEnCoursDeBoost = idAnnonce;
  document.getElementById("btn-finaliser-boost").style.display = "none";
  document.getElementById("countdown").innerText = "15";
  ouvrirModal('boost-pub');

  let tempsRestant = 15;
  const intervalle = setInterval(() => {
    tempsRestant--;
    document.getElementById("countdown").innerText = tempsRestant;
    if(tempsRestant <= 0) {
      clearInterval(intervalle);
      document.getElementById("countdown").innerText = "🎉";
      document.getElementById("btn-finaliser-boost").style.display = "block";
    }
  }, 1000);
}

async function executerRemonteeBdd() {
  try {
    const res = await fetch(`${API}/annonces/${idAnnonceEnCoursDeBoost}/boost`, { method: "POST" });
    if(res.ok) {
      alert("Annonce propulsée au top avec succès ! 🚀");
      fermerModal('boost-pub');
      loadFeed();
    }
  } catch (e) { console.error(e); }
}

loadFeed();
      
