const API = ""; 
let toutesLesAnnonces = [];
let idAnnonceEnCoursDeBoost = null;

// Données de simulation locale pour la boutique VIP de l'utilisateur connecté
let maBoutiqueVipInfos = null; 

function ouvrirModal(id) { document.getElementById(`modal-${id}`).style.display = "flex"; }
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    afficherAnnonces(toutesLesAnnonces);
  } catch (e) { console.error(e); }
}

/* AFFICHAGE DU FLUX PRINCIPAL AVEC SÉCURISATION DU MODE DROITS VISITEUR */
function afficherAnnonces(liste, uniqueShopUserId = null, modeVisiteur = false) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  if (liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">Aucun élément trouvé.</p>';
    return;
  }
  
  feed.innerHTML = "";
  liste.forEach(a => {
    let localisation = `📍 ${a.ville || 'RDC'}`;
    if(a.commune) localisation += `, ${a.commune}`;
    if(a.quartier) localisation += ` (Q/ ${a.quartier})`;

    const estVip = (a.statut === 'vip' || a.is_vip === true);

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
            ${estVip && !uniqueShopUserId ? `<button class="btn-shop" onclick="actionVisiterBoutiqueTierce(${a.user_id}, '${a.description}')">🏢 Visiter la boutique</button>` : ''}
            
            ${!modeVisiteur ? `
              <button class="btn-boost" onclick="lancerLancementPubBoost(${a.id})">🚀 Booster</button>
              <button class="btn-edit" onclick="ouvrirFormulaireModificationAnnonce(${a.id})">📝 Modifier</button>
              <button class="btn-delete" onclick="supprimerAnnonce(${a.id})">🗑️ Supprimer</button>
            ` : ''}
            
            ${a.telephone ? `<a href="tel:${a.telephone}" class="btn-contact">📞 Appeler</a>` : ''}
          </div>
        </div>
      </div>
    `;
  });
}

/* ACTIONS DE LA RECHERCHE UNIQUE ET FILTRAGE */
function rechercher() {
  const sTitre = document.getElementById("search-titre").value.toLowerCase().trim();
  const sVille = document.getElementById("search-ville").value.toLowerCase().trim();
  const sCommune = document.getElementById("search-commune").value.toLowerCase().trim();
  const sQuartier = document.getElementById("search-quartier").value.toLowerCase().trim();

  const filtre = toutesLesAnnonces.filter(a => {
    return (!sTitre || (a.titre && a.titre.toLowerCase().includes(sTitre)) || (a.description && a.description.toLowerCase().includes(sTitre))) &&
           (!sVille || (a.ville && a.ville.toLowerCase().includes(sVille))) &&
           (!sCommune || (a.commune && a.commune.toLowerCase().includes(sCommune))) &&
           (!sQuartier || (a.quartier && a.quartier.toLowerCase().includes(sQuartier)));
  });

  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Résultats de la recherche 🔍";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(filtre);
  fermerModal('rechercher');
}

function annulerRecherche() {
  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Annonces récentes";
  document.getElementById("reset-btn").style.display = "none";
  afficherAnnonces(toutesLesAnnonces);
}

/* 🏢 MODE VISITEUR : QUAND QUELQU'UN DÉCOUVRE UNE BOUTIQUE SANS POUVOIR MODIFIER */
function actionVisiterBoutiqueTierce(boutiqueUserId, descriptionAnnonce) {
  // Extraction propre du nom de la boutique contenu dans la description
  let nomBoutique = "Maison Partenaire VIP";
  if(descriptionAnnonce.includes("VIP :")) {
    nomBoutique = descriptionAnnonce.split("VIP :")[1].trim();
  }

  const articlesBoutique = toutesLesAnnonces.filter(a => a.user_id === boutiqueUserId);

  // Construction d'une bannière de vitrine pro non-cliquable pour le client
  document.getElementById("shop-header-container").innerHTML = `
    <div class="shop-banner">
      <h2>👑 ${nomBoutique}</h2>
      <p>Vitrine certifiée officielle NIA RDC — Consultation uniquement</p>
    </div>
  `;

  document.getElementById("feed-title").innerText = "Catalogue de la boutique";
  document.getElementById("reset-btn").style.display = "inline-block";
  
  // Rendu forcé avec le paramètre 'modeVisiteur = true' pour masquer les boutons de modification
  afficherAnnonces(articlesBoutique, boutiqueUserId, true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* 👤 MODAL MON PROFIL STANDARD : ACCÈS DIRECT À TOUTES SES MODIFICATIONS */
function ouvrirMonProfilStandard() {
  document.getElementById("profil-tel").innerText = "Utilisateur ID 1 (Standard RDC)";
  const mesOffres = toutesLesAnnonces.filter(a => a.user_id === 1);
  const conteneurList = document.getElementById("profil-mes-annonces-list");
  
  conteneurList.innerHTML = "";
  if(mesOffres.length === 0) {
    conteneurList.innerHTML = "<p style='font-size:0.85rem; color:var(--text-light);'>Vous n'avez publié aucune annonce.</p>";
  } else {
    mesOffres.forEach(o => {
      conteneurList.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f1f5f9; padding:10px; border-radius:8px;">
          <span style="font-size:0.9rem; font-weight:600; max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${o.titre} (${o.prix} $)</span>
          <div style="display:flex; gap:5px;">
            <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); ouvrirFormulaireModificationAnnonce(${o.id});">📝 Gérer</button>
          </div>
        </div>
      `;
    });
  }
  ouvrirModal('profil');
}

/* 🔄 INTERFACE DE MODIFICATION COMPLÈTE ET TOTALE */
function ouvrirFormulaireModificationAnnonce(id) {
  const annonce = toutesLesAnnonces.find(a => a.id === id);
  if(!annonce) return;

  document.getElementById("edit-id").value = annonce.id;
  document.getElementById("edit-titre").value = annonce.titre;
  document.getElementById("edit-prix").value = annonce.prix;
  document.getElementById("edit-periode").value = annonce.periode;
  document.getElementById("edit-statut").value = annonce.statut;
  document.getElementById("edit-description").value = annonce.description;
  document.getElementById("edit-ville").value = annonce.ville || "Lubumbashi";
  document.getElementById("edit-commune").value = annonce.commune || "";
  document.getElementById("edit-quartier").value = annonce.quartier || "";
  document.getElementById("edit-telephone").value = annonce.telephone || "";

  ouvrirModal('modifier-annonce');
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  const corpsModifie = {
    titre: document.getElementById("edit-titre").value,
    prix: document.getElementById("edit-prix").value,
    periode: document.getElementById("edit-periode").value,
    statut: document.getElementById("edit-statut").value,
    description: document.getElementById("edit-description").value,
    ville: document.getElementById("edit-ville").value,
    commune: document.getElementById("edit-commune").value,
    quartier: document.getElementById("edit-quartier").value,
    telephone: document.getElementById("edit-telephone").value
  };

  try {
    const res = await fetch(`${API}/annonces/${id}/update`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(corpsModifie)
    });
    if(res.ok) {
      alert("Votre annonce a été entièrement mise à jour ! 💾");
      fermerModal('modifier-annonce');
      loadFeed();
    }
  } catch (e) { alert("Erreur d'enregistrement"); }
}

async function supprimerAnnonce(id) {
  if(!confirm("Voulez-vous définitivement retirer cet objet de la location ?")) return;
  try {
    const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    if(res.ok) {
      alert("L'objet a été supprimé.");
      loadFeed();
    }
  } catch (e) { console.error(e); }
}

/* 👑 DYNAMIQUE BOUTON MENU VIP : S'INSCRIRE OU ACCÉDER À SA PROPRE BOUTIQUE */
function gererClicBoutonVipMenu() {
  const container = document.getElementById("vip-form-body");
  
  if(!maBoutiqueVipInfos) {
    // Étape 1 : Formulaire d'inscription de l'entreprise
    document.getElementById("vip-modal-title").innerText = "👑 Inscrire votre Maison VIP";
    container.innerHTML = `
      <div class="form-group full-width"><label>Nom officiel de votre Boutique / Agence</label><input id="vip-shop-name" placeholder="Ex: Maison Elégance Chic"></div>
      <div class="form-group"><label>Téléphone Clientèle</label><input id="vip-phone" placeholder="+243..."></div>
      <div class="form-group"><label>Ville principale</label><input id="vip-ville" value="Lubumbashi"></div>
      <div class="form-group full-width"><label>Commune</label><input id="vip-commune" placeholder="Ex: Lubumbashi, Kampemba"></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="enregistrerDonneesBoutiqueLocale()">Créer mon Espace Pro & Accéder</button>
    `;
  } else {
    // Étape 2 : L'espace est créé, l'espace VIP devient son profil d'administration pro !
    document.getElementById("vip-modal-title").innerText = `🏢 Dashboard : ${maBoutiqueVipInfos.shopName}`;
    container.innerHTML = `
      <div class="form-group full-width" style="background:#fffbeb; padding:10px; border-radius:8px; border:1px solid #fde68a; font-size:0.85rem; color:#78350f;">
        <strong>Bienvenue dans votre espace gestion pro !</strong><br>
        Vous pouvez ajouter de nouveaux articles en masse ci-dessous. Vos clients verront vos articles avec le badge doré VIP.
      </div>
      <div class="form-group full-width">
        <div id="bulk-items-container"></div>
        <button type="button" style="background:#fffdf5; color:var(--vip-gold); border:1px dashed var(--vip-gold); padding:8px; border-radius:8px; font-weight:bold; cursor:pointer; width:100%; margin-top:5px;" onclick="ajouterChampObjetUnique()">
          ➕ Ajouter une autre fiche d'objet à ma liste
        </button>
      </div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="publierCatalogueEnMasse()">🚀 Publier les nouveaux articles sur NIA RDC</button>
    `;
    document.getElementById("bulk-items-container").innerHTML = "";
    countObjetsBulk = 0;
    ajouterChampObjetUnique();
  }
  ouvrirModal('vip');
}

function enregistrerDonneesBoutiqueLocale() {
  const shopName = document.getElementById("vip-shop-name").value.trim();
  const phone = document.getElementById("vip-phone").value.trim();
  const ville = document.getElementById("vip-ville").value.trim();
  const commune = document.getElementById("vip-commune").value.trim();

  if(!shopName || !phone) { alert("Le nom et le numéro de téléphone sont requis !"); return; }
  
  maBoutiqueVipInfos = { shopName, phone, ville, commune };
  alert(`Félicitations ! Votre espace d'entreprise "${shopName}" est maintenant prêt. Réouvrez l'espace VIP pour ajouter vos catalogues.`);
  gererClicBoutonVipMenu();
}

/* LE RESTE DES COMPOSANTS (COMPRESSION / AJOUT CHAMPS) RESTE CONFIGURÉ CORRECTEMENT */
function compressAndToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > 800) { h = Math.round((h * 800) / w); w = 800; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
}

let countObjetsBulk = 0;
function ajouterChampObjetUnique() {
  countObjetsBulk++;
  const container = document.getElementById("bulk-items-container");
  const htmlBox = document.createElement('div');
  htmlBox.className = "bulk-item-box"; htmlBox.id = `bulk-box-${countObjetsBulk}`;
  htmlBox.innerHTML = `
    <button type="button" class="btn-remove-bulk" onclick="document.getElementById('bulk-box-${countObjetsBulk}').remove()">✕</button>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <div class="form-group" style="grid-column:span 2"><label>Nom de la pièce / objet unique</label><input class="bulk-titre" placeholder="Ex: Robe sirène rouge satin"></div>
      <div class="form-group"><label>Prix de location (USD)</label><input type="number" class="bulk-prix" placeholder="25"></div>
      <div class="form-group"><label>Photos de cet objet</label><input type="file" class="bulk-image" accept="image/*" multiple></div>
    </div>
  `;
  container.appendChild(htmlBox);
}

async function publierCatalogueEnMasse() {
  const boxes = document.querySelectorAll(".bulk-item-box");
  alert(`Publication de ${boxes.length} fches en cours...`);

  for(let box of boxes) {
    const titreSpécifique = box.querySelector(".bulk-titre").value.trim();
    const prixSpécifique = box.querySelector(".bulk-prix").value.trim();
    const inputFiles = box.querySelector(".bulk-image").files;
    if(!titreSpécifique) continue;

    let images_base64 = [];
    if (inputFiles) {
      for(let f of inputFiles) { images_base64.push(await compressAndToBase64(f)); }
    }

    await fetch(`${API}/annonces`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        user_id: 100, // ID distinct pour simuler le compte boutique pro
        titre: titreSpécifique,
        description: `Proposé en location par la boutique VIP : ${maBoutiqueVipInfos.shopName}`,
        prix: prixSpécifique || 0, periode: "jour",
        ville: maBoutiqueVipInfos.ville, commune: maBoutiqueVipInfos.commune, quartier: "",
        telephone: maBoutiqueVipInfos.phone, statut: "vip", images_base64
      })
    });
  }
  alert("Catalogue en ligne ! 👑");
  fermerModal('vip');
  loadFeed();
}

async function publier(){
  try {
    const files = document.getElementById("image").files;
    let images_base64 = [];
    for(let f of files){ images_base64.push(await compressAndToBase64(f)); }
    const bodyData = {
      user_id: 1, titre: document.getElementById("titre").value,
      prix: document.getElementById("prix").value, periode: document.getElementById("periode").value,
      telephone: document.getElementById("telephone").value, description: document.getElementById("description").value,
      ville: document.getElementById("ville").value, commune: document.getElementById("commune").value,
      quartier: document.getElementById("quartier").value, statut: "disponible", images_base64
    };
    await fetch(`${API}/annonces`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(bodyData) });
    fermerModal('publier');
    loadFeed();
  } catch (e) { alert("Erreur"); }
}

function lancerLancementPubBoost(idAnnonce) {
  idAnnonceEnCoursDeBoost = idAnnonce;
  document.getElementById("btn-finaliser-boost").style.display = "none";
  document.getElementById("countdown").innerText = "15";
  ouvrirModal('boost-pub');
  let tempsRestant = 15;
  const intervalle = setInterval(() => {
    tempsRestant--; document.getElementById("countdown").innerText = tempsRestant;
    if(tempsRestant <= 0) { clearInterval(intervalle); document.getElementById("btn-finaliser-boost").style.display = "block"; }
  }, 1000);
}

async function executerRemonteeBdd() {
  try {
    const res = await fetch(`${API}/annonces/${idAnnonceEnCoursDeBoost}/boost`, { method: "POST" });
    if(res.ok) { alert("Annonce boostée ! 🚀"); fermerModal('boost-pub'); loadFeed(); }
  } catch (e) { console.error(e); }
}

loadFeed();
                          
