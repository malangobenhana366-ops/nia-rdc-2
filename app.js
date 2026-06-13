const API = ""; 
let toutesLesAnnonces = [];
let idAnnonceEnCoursDeBoost = null;
let maBoutiqueVipInfos = null; 
let lienAppelEnAttente = "";
let typeProfilActuel = "standard"; // Possibilité d'avoir 2 profils : VIP et standard

// CONFIGURATION VARIABLES CAPTEURS ACTION ADMIN PRIVÉ
let adminTimer = null;
let aVibreEtValideTemps = false;
let touchStartY = 0;

// DICTIONNAIRE DE SYNONYMES POUR LA RECHERCHE INTELLIGENTE
const SYNONYMES = {
  "maison": ["villa", "residence", "appartement", "studio", "logement", "immeuble", "chambre"],
  "robe": ["vetement", "habit", "jupe", "pagne"],
  "camion": ["vehicule", "remorque", "benne", "transport"],
  "voiture": ["auto", "automobile", "vehicule", "char"],
  "bureau": ["local", "espace", "workspace"]
};

// ADSENSE : TABLEAU DE BANNIÈRES TOURNANTES (CHAQUE 30 SECONDES)
const BANNIERES_ADSENSE = [
  "💎 BANNIÈRE ADSENSE : Louez vos appartements certifiés au meilleur prix sur NIA RDC !",
  "🚗 BANNIÈRE ADSENSE : Besoin d'un véhicule de luxe à Lubumbashi ? Cliquez ici.",
  "📱 BANNIÈRE ADSENSE : Boostez la visibilité de vos annonces professionnelles en devenant membre VIP !",
  "⚡ BANNIÈRE ADSENSE : Matériels événementiels et chaises de fêtes disponibles à la location !",
  "👑 BANNIÈRE ADSENSE : Créez votre boutique Pro locale et gérez vos stocks en masse."
];
let indexAdActuel = 0;

function ouvrirModal(id) { document.getElementById(`modal-${id}`).style.display = "flex"; }
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

// CYCLAGE AUTOMATIQUE DES BANNIÈRES ADSENSE (30 SECONDES)
function initialiserBanniereTournanteAdSense() {
  const conteneurBanner = document.getElementById("adsense-bottom-banner");
  if (!conteneurBanner) return;
  
  const changerBanniere = () => {
    conteneurBanner.style.backgroundColor = "#fee2e2";
    conteneurBanner.innerText = BANNIERES_ADSENSE[indexAdActuel];
    indexAdActuel = (indexAdActuel + 1) % BANNIERES_ADSENSE.length;
    setTimeout(() => {
      conteneurBanner.style.backgroundColor = "#f1f5f9";
    }, 500);
  };
  
  changerBanniere();
  setInterval(changerBanniere, 30000);
}

// DECLENCHEMENT DE LA PUB INTERSTITIELLE AU CLIC APPELER
function declencherPubInterstitielleAppel(lienTel) {
  lienAppelEnAttente = lienTel;
  document.getElementById("global-ad-content").innerHTML = `
    <h4>🔥 PUBLICITÉ ADSENSE INTERSTITIELLE</h4>
    <p>Annonce Sponsorisée : Bénéficiez des meilleurs tarifs de location de la province.</p>
    <span style="font-size:0.75rem; color:var(--text-light);">La redirection s'effectuera après fermeture.</span>
  `;
  ouvrirModal('interstitial-global');
}

function executerAppelApresPub() {
  if(lienAppelEnAttente) {
    window.location.href = lienAppelEnAttente;
    lienAppelEnAttente = "";
  }
}

async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    afficherAnnonces(toutesLesAnnonces);
  } catch (e) { console.error(e); }
}

/* RENDU DES ANNONCES AVEC RESTRICTION DES BOUTONS DE GESTION AU SEUL PROPRIETAIRE */
function afficherAnnonces(liste, executionContextId = null) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  if (liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; text-align:center; padding:30px; font-weight:600;">Aucun élément trouvé sur le réseau.</p>';
    return;
  }
  
  feed.innerHTML = "";
  liste.forEach(a => {
    let localisation = `📍 ${a.ville || 'RDC'}`;
    if(a.commune) localisation += `, ${a.commune}`;
    if(a.quartier) localisation += ` (Q/ ${a.quartier})`;

    const estVip = (a.statut === 'vip' || a.user_id === 100);
    // Affichage des prix propre avec Devise stockée
    const symboleDevise = a.devise || "$";

    feed.innerHTML += `
      <div class="annonce-card ${estVip ? 'vip-premium' : ''}">
        ${estVip ? `<span class="vip-badge-tag">👑 Boutique VIP</span>` : ''}
        <h3>${a.titre}</h3>
        <div class="annonce-price">${a.prix ? `${a.prix} ${symboleDevise} / par ${a.periode}` : 'À négocier'}</div>
        <div class="annonce-meta">${localisation}</div>

        <div class="gallery">
          ${a.images && a.images.length > 0 ? a.images.map(img=>`<img src="${img}" class="gallery-item">`).join("") : '<p style="padding:15px; color:#64748b; font-size:0.85rem;">Pas de visuel photo disponible</p>'}
        </div>

        ${a.description ? `<div class="annonce-description">${a.description}</div>` : ''}

        <div class="annonce-footer">
          <span class="badge-status ${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
            ${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}
          </span>
          <div class="footer-actions">
            ${estVip && executionContextId !== 'OWNER_VIP' ? `<button class="btn-shop" onclick="actionVisiterBoutiqueTierce(${a.user_id}, '${a.description}')">🏢 Visiter la boutique</button>` : ''}
            
            ${executionContextId === 'OWNER_STANDARD' || executionContextId === 'OWNER_VIP' ? `
              <button class="btn-edit" onclick="ouvrirFormulaireModificationAnnonce(${a.id})">📝 Modifier</button>
              <button class="btn-delete" onclick="supprimerAnnonce(${a.id})">🗑️ Supprimer</button>
            ` : ''}
            
            ${a.telephone ? `<button class="btn-contact" onclick="declencherPubInterstitielleAppel('tel:${a.telephone}')">📞 Appeler</button>` : ''}
          </div>
        </div>
      </div>
    `;
  });
}

// RECHERCHE INTELLIGENTE : DISTANCE DE LEVENSHTEIN (ORTHOGRAPHE APPROXIMATIVE)
function distanceLevenshtein(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return track[str2.length][str1.length];
}

function verifierCorrespondanceIntelligente(texteSaisi, texteReference) {
  if (!texteSaisi) return true;
  if (!texteReference) return false;
  
  const motsSaisis = texteSaisi.toLowerCase().split(/\s+/);
  const motsRef = texteReference.toLowerCase().split(/\s+/);

  return motsSaisis.every(motSaisi => {
    // 1. Match direct ou inclusion
    if (texteReference.toLowerCase().includes(motSaisi)) return true;

    // 2. Vérification des synonymes
    for (let cle in SYNONYMES) {
      if (motSaisi === cle || SYNONYMES[cle].includes(motSaisi)) {
        if (motsRef.some(mr => mr === cle || SYNONYMES[cle].includes(mr))) return true;
      }
    }

    // 3. Tolérance aux fautes de frappe (Distance de Levenshtein)
    // Permet une erreur si le mot fait plus de 4 lettres
    return motsRef.some(mr => {
      if (Math.abs(mr.length - motSaisi.length) > 2) return false;
      const dist = distanceLevenshtein(motSaisi, mr);
      return dist <= (motSaisi.length > 5 ? 2 : 1);
    });
  });
}

/* BARRE DE RECHERCHE INTELLIGENTE TRANSVERSALE */
function rechercher() {
  const sTitre = document.getElementById("search-titre").value.trim();
  const sVille = document.getElementById("search-ville").value.toLowerCase().trim();
  const sCommune = document.getElementById("search-commune").value.toLowerCase().trim();
  const sQuartier = document.getElementById("search-quartier").value.toLowerCase().trim();

  const filtre = toutesLesAnnonces.filter(a => {
    const matchTitre = !sTitre || verifierCorrespondanceIntelligente(sTitre, a.titre) || verifierCorrespondanceIntelligente(sTitre, a.description);
    const matchVille = !sVille || (a.ville && a.ville.toLowerCase().includes(sVille));
    const matchCommune = !sCommune || (a.commune && a.commune.toLowerCase().includes(sCommune));
    const matchQuartier = !sQuartier || (a.quartier && a.quartier.toLowerCase().includes(sQuartier));
    return matchTitre && matchVille && matchCommune && matchQuartier;
  });

  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Résultats intelligents 🔍";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(filtre, 'PUBLIC_SEARCH_EXEC');
  fermerModal('rechercher');
}

function annulerRecherche() {
  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Annonces récentes";
  document.getElementById("reset-btn").style.display = "none";
  afficherAnnonces(toutesLesAnnonces);
}

function actionVisiterBoutiqueTierce(boutiqueUserId, descriptionAnnonce) {
  let nomBoutique = "Partenaire Certifié";
  if(descriptionAnnonce.includes("VIP :")) { nomBoutique = descriptionAnnonce.split("VIP :")[1].trim(); }
  const articles = toutesLesAnnonces.filter(a => a.user_id === boutiqueUserId || (boutiqueUserId === 100 && a.statut === 'vip'));

  document.getElementById("shop-header-container").innerHTML = `
    <div class="shop-banner"><h2>👑 Boutique ${nomBoutique}</h2><p style="margin-top:5px;">Espace Professionnel Certifié NIA RDC</p></div>
  `;
  document.getElementById("feed-title").innerText = "Vitrine Boutique";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(articles, 'VISITOR_MODE');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* CONSOLE DE LECTURE INTERNE DE PROFIL PROPRIETAIRE AVEC BOUTON BOOSTER EXCLUSIF */
function ouvrirMonProfilOuMaBoutique() {
  const title = document.getElementById("profil-modal-title");
  const content = document.getElementById("profil-view-content");

  if(!maBoutiqueVipInfos) {
    typeProfilActuel = "standard";
    title.innerText = "👤 Mon Profil Personnel (Standard)";
    const mesAnnonces = toutesLesAnnonces.filter(a => a.user_id === 1 && a.statut !== 'vip');
    content.innerHTML = `
      <p><strong>Type de compte :</strong> Standard (Publication Directe Gratuite)</p>
      <h4 style="margin:15px 0 10px 0;">📋 Piloter mes fiches de location actives :</h4>
      <div id="sub-list" style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto;"></div>
    `;
    const subList = content.querySelector("#sub-list");
    if(mesAnnonces.length === 0) {
      subList.innerHTML = "<p style='color:var(--text-light); font-size:0.85rem;'>Aucune annonce en ligne.</p>";
    } else {
      mesAnnonces.forEach(o => {
        subList.innerHTML += `
          <div style="background:#f1f5f9; padding:10px; border-radius:8px; display:flex; flex-direction:column; gap:6px;">
            <span style="font-size:0.85rem; font-weight:700;">${o.titre}</span>
            <div style="display:flex; gap:6px; justify-content:flex-end;">
              <button class="btn-boost" style="padding:4px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); lancerLancementPubBoost(${o.id})">🚀 Booster</button>
              <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem;" onclick="fermerModal('profil'); ouvrirFormulaireModificationAnnonce(${o.id})">Gérer</button>
            </div>
          </div>`;
      });
    }
  } else {
    typeProfilActuel = "vip";
    title.innerText = `🏢 Ma Boutique VIP : ${maBoutiqueVipInfos.shopName}`;
    const mesAnnoncesVip = toutesLesAnnonces.filter(a => a.user_id === 100 || a.statut === 'vip');
    content.innerHTML = `
      <p style="color:var(--vip-gold); margin:0; font-weight:bold;">✨ Tableau de Bord Entrepreneur VIP</p>
      <p style="margin:5px 0 15px 0; font-size:0.85rem; color:var(--text-light)">Ligne directe : ${maBoutiqueVipInfos.phone}</p>
      <h4 style="margin:10px 0;">📦 Administrer mes pièces exclusives (${mesAnnoncesVip.length}) :</h4>
      <div id="sub-list-vip" style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;"></div>
    `;
    const subListVip = content.querySelector("#sub-list-vip");
    if(mesAnnoncesVip.length === 0) {
      subListVip.innerHTML = "<p style='color:var(--text-light); font-size:0.85rem;'>Aucune pièce dans votre vitrine.</p>";
    } else {
      mesAnnoncesVip.forEach(o => {
        subListVip.innerHTML += `
          <div style="background:#fffdf5; border:1px solid #fde68a; padding:10px; border-radius:8px; display:flex; flex-direction:column; gap:6px;">
            <span style="font-size:0.85rem; font-weight:700; color:var(--vip-gold);">${o.titre}</span>
            <div style="display:flex; gap:6px; justify-content:flex-end;">
              <button class="btn-boost" style="padding:4px 8px; font-size:0.75rem; background:#2563eb;" onclick="fermerModal('profil'); lancerLancementPubBoost(${o.id})">🚀 Booster</button>
              <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem; background:var(--vip-gold);" onclick="fermerModal('profil'); ouvrirFormulaireModificationAnnonce(${o.id})">Gérer</button>
            </div>
          </div>`;
      });
    }
  }
  ouvrirModal('profil');
}

function gererClicBoutonVipMenu() {
  const container = document.getElementById("vip-form-body");
  if(!maBoutiqueVipInfos) {
    document.getElementById("vip-modal-title").innerText = "👑 Inscription Espace Pro VIP";
    container.innerHTML = `
      <div class="form-group full-width"><label>Nom Commercial de la Boutique</label><input id="vip-shop-name" placeholder="Ex: Lubumbashi Rent Pro"></div>
      <div class="form-group"><label>Téléphone Clientèle</label><input id="vip-phone" placeholder="+243..."></div>
      <div class="form-group"><label>Ville Principale</label><input id="vip-ville" value="Lubumbashi"></div>
      <div class="form-group full-width"><label>Commune</label><input id="vip-commune" placeholder="Ex: Kamalondo"></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="validerInscriptionBoutiqueLocale()">Créer ma boutique pro</button>
    `;
  } else {
    document.getElementById("vip-modal-title").innerText = `📦 Publication de Masse VIP`;
    container.innerHTML = `
      <div class="form-group full-width"><div id="bulk-items-container"></div>
        <button type="button" style="background:#fffdf5; color:var(--vip-gold); border:1px dashed var(--vip-gold); padding:10px; border-radius:8px; font-weight:bold; cursor:pointer; width:100%;" onclick="ajouterChampObjetUnique()">➕ Ajouter un objet au lot</button>
      </div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="publierCatalogueEnMasse()">🚀 Balancer le catalogue en ligne</button>
    `;
    document.getElementById("bulk-items-container").innerHTML = ""; countObjetsBulk = 0; ajouterChampObjetUnique();
  }
  ouvrirModal('vip');
}

function validerInscriptionBoutiqueLocale() {
  const shopName = document.getElementById("vip-shop-name").value.trim();
  const phone = document.getElementById("vip-phone").value.trim();
  const ville = document.getElementById("vip-ville").value.trim();
  const commune = document.getElementById("vip-commune").value.trim();
  if(!shopName || !phone) { alert("Veuillez remplir les informations de contact !"); return; }
  
  maBoutiqueVipInfos = { shopName, phone, ville, commune };
  typeProfilActuel = "vip";
  const navBtnLabel = document.getElementById("main-profile-nav-btn");
  if(navBtnLabel) navBtnLabel.innerHTML = `<span>🏢</span><span>Ma Boutique</span>`;

  alert(`Félicitations ! Votre Espace Commercial Professionnel "${shopName}" est maintenant opérationnel sur l'application.`);
  fermerModal('vip');
  ouvrirMonProfilOuMaBoutique();
}

/* ⚙️ INTELLIGENCE COFFRE-FORT ADMIN PRIVÉ */
const gearBtn = document.getElementById("gear-admin-trigger");

gearBtn.addEventListener("mousedown", demarrerCompteAReboursAdmin);
gearBtn.addEventListener("touchstart", demarrerCompteAReboursAdmin);
gearBtn.addEventListener("mouseup", abandonnerCompteAReboursAdmin);
gearBtn.addEventListener("touchend", abandonnerCompteAReboursAdmin);

function demarrerCompteAReboursAdmin(e) {
  aVibreEtValideTemps = false;
  if(e.touches) touchStartY = e.touches[0].clientY;
  
  adminTimer = setTimeout(() => {
    aVibreEtValideTemps = true;
    if (navigator.vibrate) { navigator.vibrate(150); }
    console.log("NIA RDC SECURE ENGINE: Lock 15 secondes validé. Swipe down requis.");
  }, 15000); 
}

function abandonnerCompteAReboursAdmin() { clearTimeout(adminTimer); }

gearBtn.addEventListener("touchmove", (e) => {
  if(!aVibreEtValideTemps) return;
  let currentY = e.touches[0].clientY;
  if(currentY - touchStartY > 40) {
    aVibreEtValideTemps = false;
    clearTimeout(adminTimer);
    declencherVerificationCodeSecretAdmin();
  }
});

function declencherVerificationCodeSecretAdmin() {
  const codeSaisi = prompt("🔒 ENTRER LE CODE SECRET DE SÉCURITÉ DE L'ADMINISTRATION :");
  if(codeSaisi === "BEN4002ET4200") {
    initialiserEtOuvrirEspaceAdmin();
  } else if (codeSaisi !== null) {
    alert("❌ Code d'accès incorrect. Accès refusé.");
  }
}

function initialiserEtOuvrirEspaceAdmin() {
  const total = toutesLesAnnonces.length;
  const vips = toutesLesAnnonces.filter(a => a.statut === 'vip' || a.user_id === 100).length;
  const standards = total - vips;

  document.getElementById("adm-stat-total").innerText = total;
  document.getElementById("adm-stat-vip").innerText = vips;
  document.getElementById("adm-stat-stand").innerText = standards;

  const selectVille = document.getElementById("adm-filter-ville");
  const villesUniques = [...new Set(toutesLesAnnonces.map(a => a.ville || "Lubumbashi"))];
  
  selectVille.innerHTML = `<option value="all">Toutes les villes de la RDC</option>`;
  villesUniques.forEach(v => {
    selectVille.innerHTML += `<option value="${v.toLowerCase()}">${v}</option>`;
  });

  filtrerIndexationAnnoncesAdmin();
  ouvrirModal('admin-panel');
}

function filtrerIndexationAnnoncesAdmin() {
  const fVille = document.getElementById("adm-filter-ville").value;
  const fType = document.getElementById("adm-filter-type").value;
  const listConteneur = document.getElementById("admin-liste-moderat-annonces");

  const annoncesFiltrees = toutesLesAnnonces.filter(a => {
    const isVip = (a.statut === 'vip' || a.user_id === 100);
    const matchVille = (fVille === "all" || (a.ville && a.ville.toLowerCase() === fVille));
    
    let matchType = true;
    if (fType === "vip") matchType = isVip;
    if (fType === "standard") matchType = !isVip;

    return matchVille && matchType;
  });

  listConteneur.innerHTML = "";
  if(annoncesFiltrees.length === 0) {
    listConteneur.innerHTML = `<p style="color:#64748b; font-size:0.9rem; text-align:center; padding:15px;">Aucune annonce ne correspond.</p>`;
    return;
  }

  annoncesFiltrees.forEach(a => {
    const typeLabel = (a.statut === 'vip' || a.user_id === 100) ? "👑 VIP" : "👤 Standard";
    listConteneur.innerHTML += `
      <div class="admin-annonce-item">
        <div style="max-width:70%;">
          <strong style="color:white; font-size:0.9rem;">${a.titre}</strong> 
          <span style="font-size:0.75rem; background:#334155; padding:2px 6px; border-radius:4px; margin-left:5px; color:#fde68a;">${typeLabel}</span>
          <div style="font-size:0.75rem; color:#94a3b8; margin-top:3px;">📍 ${a.ville || 'Lubumbashi'} | Prix: ${a.prix} ${a.devise || '$'}</div>
        </div>
        <button class="btn-delete" style="padding:6px 12px; font-size:0.8rem;" onclick="supprimerForceParAdmin(${a.id})">🗑️ Purger</button>
      </div>
    `;
  });
}

async function supprimerForceParAdmin(id) {
  if(!confirm("🕵️‍♂️ MODÉRATION ACTION : Confirmez-vous le retrait de cette annonce ?")) return;
  try {
    const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    if(res.ok) {
      alert("L'annonce abusive a été purgée.");
      const resFeed = await fetch(`${API}/feed`);
      toutesLesAnnonces = await resFeed.json();
      initialiserEtOuvrirEspaceAdmin();
      afficherAnnonces(toutesLesAnnonces);
    }
  } catch(e) { console.error(e); }
}

function ouvrirFormulaireModificationAnnonce(id) {
  const a = toutesLesAnnonces.find(o => o.id === id);
  if(!a) return;
  document.getElementById("edit-id").value = a.id;
  document.getElementById("edit-titre").value = a.titre;
  document.getElementById("edit-prix").value = a.prix;
  document.getElementById("edit-devise").value = a.devise || "$";
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
    devise: document.getElementById("edit-devise").value,
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
  if(res.ok) { alert("La fiche a été mise à jour !"); fermerModal('modifier-annonce'); loadFeed(); }
}

async function supprimerAnnonce(id) {
  if(!confirm("Retirer cet objet de la plateforme ?")) return;
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
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; border:1px solid var(--border); padding:10px; border-radius:10px;">
      <div class="form-group" style="grid-column:span 2"><label>Nom de l'objet unique</label><input class="bulk-titre" placeholder="Ex: Véhicule de luxe"></div>
      <div class="form-group"><label>Prix et Devise</label>
        <div class="price-currency-group">
          <input type="number" class="bulk-prix" placeholder="50">
          <select class="bulk-devise"><option value="$">$</option><option value="FC">FC</option></select>
        </div>
      </div>
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
    const devise = box.querySelector(".bulk-devise").value;
    const inputFiles = box.querySelector(".bulk-image").files;
    if(!titre) continue;
    let images_base64 = [];
    if(inputFiles) { for(let f of inputFiles) { images_base64.push(await compressAndToBase64(f)); } }

    await fetch(`${API}/annonces`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        user_id: 100, titre: titre,
        description: `VIP : ${maBoutiqueVipInfos.shopName}`,
        prix: prix || 0, devise: devise, periode: "jour", ville: maBoutiqueVipInfos.ville, commune: maBoutiqueVipInfos.commune,
        quartier: "", telephone: maBoutiqueVipInfos.phone, statut: "vip", images_base64
      })
    });
  }
  alert("Votre lot d'annonces est maintenant en ligne ! 👑"); fermerModal('vip'); loadFeed();
}

async function publier(){
  try {
    const files = document.getElementById("image").files;
    let images_base64 = [];
    for(let f of files){ images_base64.push(await compressAndToBase64(f)); }
    const bodyData = {
      user_id: 1, titre: document.getElementById("titre").value,
      prix: document.getElementById("prix").value, 
      devise: document.getElementById("devise").value,
      periode: document.getElementById("periode").value,
      telephone: document.getElementById("telephone").value, description: document.getElementById("description").value,
      ville: document.getElementById("ville").value, commune: document.getElementById("commune").value,
      quartier: document.getElementById("quartier").value, statut: "disponible", images_base64
    };
    await fetch(`${API}/annonces`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(bodyData) });
    fermerModal('publier'); loadFeed();
  } catch (e) { alert("Erreur lors du dépôt de l'annonce"); }
}

// DECLENCHEMENT PUBLICITÉ INTERSTITIELLE ET COMPTE À REBOURS AVANT LE BOOST
function lancerLancementPubBoost(idAnnonce) {
  idAnnonceEnCoursDeBoost = idAnnonce;
  document.getElementById("btn-finaliser-boost").style.display = "none";
  document.getElementById("interstitial-ad-content").innerHTML = `
    <strong>🔥 PUBLICITÉ INTERSTITIELLE ADSENSE (BOOSTER ENGINE)</strong><br>
    <p>Découvrez les résidences et vitrines immobilières de la région au meilleur prix du marché.</p>
  `;
  document.getElementById("countdown").innerText = "15"; 
  ouvrirModal('boost-pub');
  let t = 15;
  const inter = setInterval(() => {
    t--; document.getElementById("countdown").innerText = t;
    if(t <= 0) { clearInterval(inter); document.getElementById("btn-finaliser-boost").style.display = "block"; }
  }, 1000);
}

async function executerRemonteeBdd() {
  const res = await fetch(`${API}/annonces/${idAnnonceEnCoursDeBoost}/boost`, { method: "POST" });
  if(res.ok) { alert("Boost positionnel validé ! L'annonce est remontée."); fermerModal('boost-pub'); loadFeed(); }
}

// INITIALISATION DU FLUX ET DE LA PUBLICITE TOURNANTE BANNIERE
loadFeed();
initialiserBanniereTournanteAdSense();
