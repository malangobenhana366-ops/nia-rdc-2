const API = ""; 
let toutesLesAnnonces = [];
let idAnnonceEnCoursDeBoost = null;

// IDs simulés : Utilisateur standard = 1, Compte Boutique VIP Pro = 100
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

/* RENDU SÉCURISÉ DU FEED PUBLIC : LES BOUTONS MODIFIER/SUPPRIMER SONT RESTRINTS */
function afficherAnnonces(liste, executionContextId = null) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  if (liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">Aucun résultat disponible.</p>';
    return;
  }
  
  feed.innerHTML = "";
  liste.forEach(a => {
    let localisation = `📍 ${a.ville || 'RDC'}`;
    if(a.commune) localisation += `, ${a.commune}`;
    if(a.quartier) localisation += ` (Q/ ${a.quartier})`;

    const estVip = (a.statut === 'vip' || a.user_id === 100);

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
            ${estVip && executionContextId !== 'OWNER_VIP' ? `<button class="btn-shop" onclick="actionVisiterBoutiqueTierce(${a.user_id}, '${a.description}')">🏢 Visiter la boutique</button>` : ''}
            
            ${executionContextId === 'OWNER_STANDARD' || executionContextId === 'OWNER_VIP' ? `
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

/* BARRE DE RECHERCHE UNIQUE ET TRANSVERSALE (MONTE TOUTES LES COMPOSANTES) */
function rechercher() {
  const sTitre = document.getElementById("search-titre").value.toLowerCase().trim();
  const sVille = document.getElementById("search-ville").value.toLowerCase().trim();
  const sCommune = document.getElementById("search-commune").value.toLowerCase().trim();
  const sQuartier = document.getElementById("search-quartier").value.toLowerCase().trim();

  const filtre = toutesLesAnnonces.filter(a => {
    const titreMatch = !sTitre || (a.titre && a.titre.toLowerCase().includes(sTitre)) || (a.description && a.description.toLowerCase().includes(sTitre));
    const villeMatch = !sVille || (a.ville && a.ville.toLowerCase().includes(sVille));
    const communeMatch = !sCommune || (a.commune && a.commune.toLowerCase().includes(sCommune));
    const quartierMatch = !sQuartier || (a.quartier && a.quartier.toLowerCase().includes(sQuartier));
    return titreMatch && villeMatch && communeMatch && quartierMatch;
  });

  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Résultats trouvés 🔍";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(filtre, 'PUBLIC_SEARCH'); 
  fermerModal('rechercher');
}

function annulerRecherche() {
  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Annonces récentes";
  document.getElementById("reset-btn").style.display = "none";
  afficherAnnonces(toutesLesAnnonces);
}

/* RECHERCHE REDIRECTS CLIENTS : ACCÈS VISITEUR SANS ATTEINTE AUX DROITS */
function actionVisiterBoutiqueTierce(boutiqueUserId, descriptionAnnonce) {
  let nomBoutique = "Espace Pro Partenaire";
  if(descriptionAnnonce.includes("VIP :")) {
    nomBoutique = descriptionAnnonce.split("VIP :")[1].trim();
  }
  const articlesBoutique = toutesLesAnnonces.filter(a => a.user_id === boutiqueUserId || (boutiqueUserId === 100 && a.statut === 'vip'));

  document.getElementById("shop-header-container").innerHTML = `
    <div class="shop-banner">
      <h2>👑 Boutique ${nomBoutique}</h2>
      <p>Catalogue Officiel — Mode Lecture Uniquement</p>
    </div>
  `;
  document.getElementById("feed-title").innerText = "Vitrine Privée";
  document.getElementById("reset-btn").style.display = "inline-block";
  
  afficherAnnonces(articlesBoutique, 'VISITOR_MODE');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* DOUBLE CONSOLE : ROUTAGE ET MODIFICATION DE L'ESPACE PROFIL EN "MA BOUTIQUE" */
function ouvrirMonProfilOuMaBoutique() {
  const title = document.getElementById("profil-modal-title");
  const content = document.getElementById("profil-view-content");

  if(!maBoutiqueVipInfos) {
    // Profil standard
    title.innerText = "👤 Mon Profil Personnel";
    const mesAnnonces = toutesLesAnnonces.filter(a => a.user_id === 1 && a.statut !== 'vip');
    
    content.innerHTML = `
      <p style="margin:0 0 15px 0;"><strong>ID Utilisateur :</strong> Compte Standard (Lubumbashi)</p>
      <h4 style="margin:10px 0;">🛠️ Mes offres publiées :</h4>
      <div id="sub-list" style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto; margin-bottom:15px;"></div>
    `;
    
    const subList = content.querySelector("#sub-list");
    if(mesAnnonces.length === 0) {
      subList.innerHTML = "<p style='color:var(--text-light); font-size:0.85rem;'>Aucune annonce.</p>";
    } else {
      mesAnnonces.forEach(o => {
        subList.innerHTML += `
          <div style="background:#f1f5f9; padding:8px 12px; border-radius:6px; display:flex; justify-content:between; align-items:center;">
            <span style="font-size:0.85rem; font-weight:bold; flex-grow:1;">${o.titre}</span>
            <button class="btn-edit" style="padding:3px 6px; font-size:0.75rem;" onclick="fermerModal('profil'); ouvrirFormulaireModificationAnnonce(${o.id})">Gérer</button>
          </div>`;
      });
    }
  } else {
    // Transformation complète de l'interface en Boutique Privée
    title.innerText = `🏢 Vitrine Privée : ${maBoutiqueVipInfos.shopName}`;
    const mesAnnoncesVip = toutesLesAnnonces.filter(a => a.user_id === 100 || a.statut === 'vip');

    content.innerHTML = `
      <p style="margin:0 0 5px 0; color:var(--vip-gold)"><strong>Boutique VIP Active Professionnelle</strong></p>
      <p style="margin:0 0 15px 0; font-size:0.85rem; color:var(--text-light)">Contact : ${maBoutiqueVipInfos.phone} | ${maBoutiqueVipInfos.ville}</p>
      <h4 style="margin:10px 0;">📦 Gestion de mon catalogue (${mesAnnoncesVip.length} articles) :</h4>
      <div id="sub-list-vip" style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto; margin-bottom:15px;"></div>
    `;

    const subListVip = content.querySelector("#sub-list-vip");
    if(mesAnnoncesVip.length === 0) {
      subListVip.innerHTML = "<p style='color:var(--text-light); font-size:0.85rem;'>Votre boutique est vide.</p>";
    } else {
      mesAnnoncesVip.forEach(o => {
        subListVip.innerHTML += `
          <div style="background:#fffdf5; border:1px solid #fde68a; padding:8px 12px; border-radius:6px; display:flex; justify-content:between; align-items:center;">
            <span style="font-size:0.85rem; font-weight:bold; flex-grow:1; color:var(--vip-gold);">${o.titre}</span>
            <button class="btn-edit" style="padding:3px 6px; font-size:0.75rem; background:var(--vip-gold);" onclick="fermerModal('profil'); ouvrirFormulaireModificationAnnonce(${o.id})">Gérer</button>
          </div>`;
      });
    }
  }
  ouvrirModal('profil');
}

/* INSCRIPTION ET SYNCRONISATION DU BOUTON BASSE EN TEMPS RÉEL */
function gererClicBoutonVipMenu() {
  const container = document.getElementById("vip-form-body");
  if(!maBoutiqueVipInfos) {
    document.getElementById("vip-modal-title").innerText = "👑 Inscription Boutique VIP";
    container.innerHTML = `
      <div class="form-group full-width"><label>Nom de votre Boutique</label><input id="vip-shop-name" placeholder="Ex: Horizon Location"></div>
      <div class="form-group"><label>Téléphone Clientèle</label><input id="vip-phone" placeholder="+243..."></div>
      <div class="form-group"><label>Ville</label><input id="vip-ville" value="Lubumbashi"></div>
      <div class="form-group full-width"><label>Commune</label><input id="vip-commune"></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="validerInscriptionBoutiqueLocale()">Créer ma boutique pro</button>
    `;
  } else {
    document.getElementById("vip-modal-title").innerText = `📦 Ajouter au catalogue : ${maBoutiqueVipInfos.shopName}`;
    container.innerHTML = `
      <div class="form-group full-width"><div id="bulk-items-container"></div>
        <button type="button" style="background:#fffdf5; color:var(--vip-gold); border:1px dashed var(--vip-gold); padding:8px; border-radius:8px; font-weight:bold; cursor:pointer; width:100%;" onclick="ajouterChampObjetUnique()">➕ Ajouter une fiche d'objet</button>
      </div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="publierCatalogueEnMasse()">🚀 Mettre le catalogue en ligne</button>
    `;
    document.getElementById("bulk-items-container").innerHTML = "";
    countObjetsBulk = 0;
    ajouterChampObjetUnique();
  }
  ouvrirModal('vip');
}

function validerInscriptionBoutiqueLocale() {
  const shopName = document.getElementById("vip-shop-name").value.trim();
  const phone = document.getElementById("vip-phone").value.trim();
  const ville = document.getElementById("vip-ville").value.trim();
  const commune = document.getElementById("vip-commune").value.trim();

  if(!shopName || !phone) { alert("Champs obligatoires !"); return; }
  maBoutiqueVipInfos = { shopName, phone, ville, commune };

  // CHANGEMENT DU BOUTON EN TEMPS RÉEL : RECONNAISSANCE IMMEDIATE DE LA MARQUE
  const navBtnLabel = document.getElementById("main-profile-nav-btn");
  if(navBtnLabel) navBtnLabel.innerHTML = `<span>🏢</span><span>Ma Boutique</span>`;

  alert(`Votre Espace Boutique "${shopName}" est maintenant opérationnel !`);
  fermerModal('vip');
  ouvrirMonProfilOuMaBoutique();
}

/* EDITIONS, MISES A JOUR ET SÉCURISATION DU SERVEUR VIA CONTEXTE DE LECTURE */
function ouvrirFormulaireModificationAnnonce(id) {
  const a = toutesLesAnnonces.find(o => o.id === id);
  if(!a) return;
  document.getElementById("edit-id").value = a.id;
  document.getElementById("edit-titre").value = a.titre;
  document.getElementById("edit-prix").value = a.prix;
  document.getElementById("edit-periode").value = a.periode;
  document.getElementById("edit-statut").value = a.statut;
  document.getElementById("edit-description").value = a.description;
  document.getElementById("edit-ville").value = a.ville || "Lubumbashi";
  document.getElementById("edit-commune").value = a.commune || "";
  document.getElementById("edit-quartier").value = a.quartier || "";
  document.getElementById("edit-telephone").value = a.telephone || "";
  ouvrirModal('modifier-annonce');
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  const payload = {
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
  const res = await fetch(`${API}/annonces/${id}/update`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
  if(res.ok) { alert("Modifications enregistrées !"); fermerModal('modifier-annonce'); loadFeed(); }
}

async function supprimerAnnonce(id) {
  if(!confirm("Supprimer définitivement cet objet ?")) return;
  const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
  if(res.ok) { alert("Objet supprimé."); loadFeed(); }
}

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
      <div class="form-group" style="grid-column:span 2"><label>Nom de l'objet unique</label><input class="bulk-titre" placeholder="Ex: Robe de mariée"></div>
      <div class="form-group"><label>Prix (USD)</label><input type="number" class="bulk-prix" placeholder="30"></div>
      <div class="form-group"><label>Photos</label><input type="file" class="bulk-image" accept="image/*" multiple></div>
    </div>
  `;
  container.appendChild(htmlBox);
}

async function publierCatalogueEnMasse() {
  const boxes = document.querySelectorAll(".bulk-item-box");
  for(let box of boxes) {
    const titre = box.querySelector(".bulk-titre").value.trim();
    const prix = box.querySelector(".bulk-prix").value.trim();
    const inputFiles = box.querySelector(".bulk-image").files;
    if(!titre) continue;
    let images_base64 = [];
    if(inputFiles) { for(let f of inputFiles) { images_base64.push(await compressAndToBase64(f)); } }

    await fetch(`${API}/annonces`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        user_id: 100, titre: titre,
        description: `Offre déposée par la boutique VIP : ${maBoutiqueVipInfos.shopName}`,
        prix: prix || 0, periode: "jour", ville: maBoutiqueVipInfos.ville, commune: maBoutiqueVipInfos.commune,
        quartier: "", telephone: maBoutiqueVipInfos.phone, statut: "vip", images_base64
      })
    });
  }
  alert("Catalogue ajouté ! 👑"); fermerModal('vip'); loadFeed();
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
    fermerModal('publier'); loadFeed();
  } catch (e) { alert("Erreur"); }
}

function lancerLancementPubBoost(idAnnonce) {
  idAnnonceEnCoursDeBoost = idAnnonce;
  document.getElementById("btn-finaliser-boost").style.display = "none";
  document.getElementById("countdown").innerText = "15"; ouvrirModal('boost-pub');
  let t = 15;
  const inter = setInterval(() => {
    t--; document.getElementById("countdown").innerText = t;
    if(t <= 0) { clearInterval(inter); document.getElementById("btn-finaliser-boost").style.display = "block"; }
  }, 1000);
}

async function executerRemonteeBdd() {
  const res = await fetch(`${API}/annonces/${idAnnonceEnCoursDeBoost}/boost`, { method: "POST" });
  if(res.ok) { alert("Boost réussi !"); fermerModal('boost-pub'); loadFeed(); }
}

loadFeed();
