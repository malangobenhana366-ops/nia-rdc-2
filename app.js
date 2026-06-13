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
    console.error("Erreur feed:", error);
  }
}

function afficherAnnonces(liste) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  
  if (liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">Aucune offre correspondante trouvée.</p>';
    return;
  }
  
  feed.innerHTML = "";
  liste.forEach(a=>{
    let localisation = `📍 ${a.ville || 'RDC'}`;
    if(a.commune) localisation += `, ${a.commune}`;
    if(a.quartier) localisation += ` (Q/ ${a.quartier})`;

    // Une annonce est VIP si le compte utilisateur est VIP (is_vip) ou si elle est marquée explicitement
    const estVip = (a.is_vip === true || a.statut === 'vip');

    feed.innerHTML += `
      <div class="annonce-card ${estVip ? 'vip-premium' : ''}">
        ${estVip ? `<span class="vip-badge-tag">👑 Boutique VIP</span>` : ''}
        <h3>${a.titre}</h3>
        <div class="annonce-price">${a.prix ? `${a.prix} USD / par ${a.periode}` : 'À négocier'}</div>
        <div class="annonce-meta">${localisation}</div>

        <div class="gallery">
          ${a.images && a.images.length > 0 ? a.images.map(img=>`<img src="${img}" class="gallery-item" alt="">`).join("") : '<p style="padding:10px; color:#64748b; font-style:italic;">Aucune photo</p>'}
        </div>

        ${a.description ? `<div class="annonce-description">${a.description}</div>` : ''}

        <div class="annonce-footer">
          <span class="badge-status ${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
            ${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}
          </span>
          <div class="footer-actions">
            ${estVip ? `<button class="btn-shop" onclick="filtrerParBoutique(${a.user_id})">🏢 Visiter la boutique</button>` : ''}
            <button class="btn-boost" onclick="lancerLancementPubBoost(${a.id})">🚀 Booster</button>
            ${a.telephone ? `<a href="tel:${a.telephone}" class="btn-contact">📞 Appeler</a>` : ''}
          </div>
        </div>
      </div>
    `;
  });
}

/* FILTRAGE PAR BOUTIQUE VIP */
function filtrerParBoutique(userId) {
  const offresBoutique = toutesLesAnnonces.filter(a => a.user_id === userId);
  document.getElementById("feed-title").innerText = `Vitrine Boutique VIP`;
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(offresBoutique);
}

/* RECHERCHE ULTRA-PRÉCISE (Y COMPRIS SUR LE VIP) */
function rechercher() {
  const sTitre = document.getElementById("search-titre").value.toLowerCase().trim();
  const sVille = document.getElementById("search-ville").value.toLowerCase().trim();
  const sCommune = document.getElementById("search-commune").value.toLowerCase().trim();
  const sQuartier = document.getElementById("search-quartier").value.toLowerCase().trim();

  const filtre = toutesLesAnnonces.filter(a => {
    const titreNormalise = (a.titre || "").toLowerCase();
    const descriptionNormalisee = (a.description || "").toLowerCase();
    
    const matchTitre = !sTitre || titreNormalise.includes(sTitre) || descriptionNormalisee.includes(sTitre);
    const matchVille = !sVille || (a.ville && a.ville.toLowerCase().includes(sVille));
    const matchCommune = !sCommune || (a.commune && a.commune.toLowerCase().includes(sCommune));
    const matchQuartier = !sQuartier || (a.quartier && a.quartier.toLowerCase().includes(sQuartier));

    return matchTitre && matchVille && matchCommune && matchQuartier;
  });

  document.getElementById("feed-title").innerText = "Résultats de recherche 🔍";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(filtre);
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

/* COMPRESSION D'IMAGE EN CANVAS */
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
        if (w > 800) { h = Math.round((h * 800) / w); w = 800; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
}

/* GESTION DU CATALOGUE EN MASSE VIP */
let countObjetsBulk = 0;
function ouvrirEspaceVip() {
  document.getElementById("bulk-items-container").innerHTML = "";
  countObjetsBulk = 0;
  ajouterChampObjetUnique();
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
        <label>Nom précis de l'objet</label>
        <input class="bulk-titre" placeholder="Ex: Robe sirène satin rouge">
      </div>
      <div class="form-group">
        <label>Prix de location (USD)</label>
        <input type="number" class="bulk-prix" placeholder="20">
      </div>
      <div class="form-group">
        <label>Photos de cet objet</label>
        <input type="file" class="bulk-image" accept="image/*" multiple>
      </div>
    </div>
  `;
  container.appendChild(htmlBox);
}

async function publierCatalogueEnMasse() {
  const shopName = document.getElementById("vip-shop-name").value.trim();
  const telephone = document.getElementById("vip-phone").value.trim();
  const ville = document.getElementById("vip-ville").value.trim();
  const commune = document.getElementById("vip-commune").value.trim();

  const boxes = document.querySelectorAll(".bulk-item-box");
  if(boxes.length === 0 || !shopName || !ville) { 
    alert("Veuillez renseigner au moins le nom de la boutique et la ville."); 
    return; 
  }

  for(let box of boxes) {
    const titreSpécifique = box.querySelector(".bulk-titre").value.trim();
    const prixSpécifique = box.querySelector(".bulk-prix").value.trim();
    const inputFiles = box.querySelector(".bulk-image").files;

    if(!titreSpécifique) continue;

    let images_base64 = [];
    if (inputFiles && inputFiles.length > 0) {
      for(let f of inputFiles) {
        const dataB64 = await compressAndToBase64(f);
        images_base64.push(dataB64);
      }
    }

    // Envoi propre avec le statut 'vip' explicite
    await fetch(`${API}/annonces`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        user_id: 1, 
        titre: titreSpécifique,
        description: `Proposé en location par la boutique VIP : ${shopName}`,
        prix: prixSpécifique || 0,
        periode: "jour",
        ville, 
        commune, 
        quartier: "",
        telephone,
        statut: "vip", // Marqueur pour forcer l'affichage doré VIP
        images_base64
      })
    });
  }

  alert("Votre catalogue boutique a été publié avec succès ! 👑");
  fermerModal('vip');
  loadFeed();
}

/* PUBLICATION SIMPLE STANDARD */
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

    if(!bodyData.titre || !bodyData.ville) {
      alert("Titre et Ville obligatoires !");
      return;
    }

    await fetch(`${API}/annonces`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(bodyData)
    });

    fermerModal('publier');
    loadFeed();
  } catch (e) { alert("Erreur lors de la publication"); }
}

/* COMPTE À REBOURS DU BOUTON BOOSTER PUBLICITAIRE */
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
      alert("Annonce propulsée au top du fil d'actualité ! 🚀");
      fermerModal('boost-pub');
      loadFeed();
    }
  } catch (e) { console.error(e); }
}

loadFeed();
              
