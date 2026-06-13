const API = "https://nia-rdc-2.onrender.com"; 

let toutesLesAnnonces = [];
let utilisateurConnecte = null; 
let actionAExecuterApresAd = null;

const BANNER_ADS = [
  "Vodacom Congo : Rejoignez le réseau 4G le plus stable de la RDC ! 🌐",
  "Airtel Money : Transférez vos fonds instantanément avec moins de frais 💸",
  "Orange RDC : Des forfaits internet adaptés pour rester toujours connecté 📱",
  "Rawbank : Votre partenaire de confiance pour sécuriser vos investissements 🏦",
  "TMB : Notre banque, votre force à Lubumbashi et partout ailleurs 🤝"
];
let currentAdIndex = 0;

const DICTIONNAIRE_SYNONYMES = {
  "maison": ["villa", "parcelle", "flat", "appartement", "chambre", "studio"],
  "flat": ["appartement", "maison", "chambre", "studio", "logement"],
  "appartement": ["flat", "maison", "chambre", "studio", "villa"],
  "robe": ["habit", "vetement", "pagne", "veste"],
  "habit": ["robe", "vetement", "pagne", "veste"],
  "auto": ["voiture", "vehicule", "jeep", "camion"],
  "voiture": ["auto", "vehicule", "jeep", "camion"]
};

function calculerDistanceLevenshtein(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) { tmp[i] = [i]; }
  for (let j = 0; j <= b.length; j++) { tmp[0][j] = j; }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function verifierCorrespondanceIntelligente(motSaisi, motBase) {
  const s = motSaisi.toLowerCase().trim();
  const b = motBase.toLowerCase().trim();
  if (b.includes(s) || s.includes(b)) return true;
  for (let cle in DICTIONNAIRE_SYNONYMES) {
    if (s === cle || DICTIONNAIRE_SYNONYMES[cle].includes(s)) {
      if (b.includes(cle) || DICTIONNAIRE_SYNONYMES[cle].some(syn => b.includes(syn))) return true;
    }
  }
  const dist = calculerDistanceLevenshtein(s, b);
  if (s.length > 4 && dist <= 2) return true;
  if (s.length <= 4 && dist <= 1) return true;
  return false;
}

function declencherPubliciteInterstitielle(actionSuivante) {
  actionAExecuterApresAd = actionSuivante;
  const modalAd = document.getElementById("interstitial-ad");
  const closeBtn = document.getElementById("interstitial-close-btn");
  if(!modalAd || !closeBtn) return actionSuivante();
  closeBtn.disabled = true;
  closeBtn.innerText = "Patientez (5s)...";
  modalAd.classList.remove("hidden");
  let t = 5;
  const timer = setInterval(() => {
    t--;
    if (t > 0) { closeBtn.innerText = `Patientez (${t}s)...`; } 
    else { clearInterval(timer); closeBtn.disabled = false; closeBtn.innerText = "Fermer l'annonce ✕"; }
  }, 1000);
}

function fermerPubliciteInterstitielle() {
  document.getElementById("interstitial-ad").classList.add("hidden");
  if (actionAExecuterApresAd) { actionAExecuterApresAd(); actionAExecuterApresAd = null; }
}

function initialiserBanniereAdSenseRotative() {
  const adText = document.getElementById("adsense-text-rotation");
  if (!adText) return;
  setInterval(() => {
    currentAdIndex = (currentAdIndex + 1) % BANNER_ADS.length;
    adText.innerText = BANNER_ADS[currentAdIndex];
  }, 30000);
}

function ouvrirModal(id) { document.getElementById(`modal-${id}`).classList.remove("hidden"); }
function fermerModal(id) { document.getElementById(`modal-${id}`).classList.add("hidden"); }

function verifierSession() {
  const session = localStorage.getItem("nia_user_session");
  if (session) { utilisateurConnecte = JSON.parse(session); masquerEcranAuth(); loadFeed(); }
}

function basculerAuth(versInscription) {
  if (versInscription) {
    document.getElementById("form-connexion").classList.add("hidden");
    document.getElementById("form-inscription").classList.remove("hidden");
  } else {
    document.getElementById("form-inscription").classList.add("hidden");
    document.getElementById("form-connexion").classList.remove("hidden");
  }
}

function masquerEcranAuth() {
  document.getElementById("auth-screen").classList.add("hidden");
  const navBtnLabel = document.getElementById("main-profile-nav-btn");
  if (utilisateurConnecte && utilisateurConnecte.is_vip && navBtnLabel) {
    navBtnLabel.innerHTML = `<span>🏢</span><span>Ma Boutique</span>`;
  }
}

async function executerInscription() {
  const tel = document.getElementById("auth-reg-phone").value.trim();
  const pass = document.getElementById("auth-reg-pass").value.trim();
  if(!tel || !pass) return alert("Champs obligatoires !");
  const res = await fetch(`${API}/auth/inscription`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone: tel, password: pass })
  });
  const d = await res.json();
  if(d.success) { alert("Compte créé !"); basculerAuth(false); } else { alert(d.error); }
}

async function executerConnexion() {
  const tel = document.getElementById("auth-login-phone").value.trim();
  const pass = document.getElementById("auth-login-pass").value.trim();
  if(!tel || !pass) return alert("Identifiants requis !");
  const res = await fetch(`${API}/auth/connexion`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone: tel, password: pass })
  });
  const d = await res.json();
  if(d.success) {
    utilisateurConnecte = d.user;
    localStorage.setItem("nia_user_session", JSON.stringify(d.user));
    masquerEcranAuth(); loadFeed();
  } else { alert(d.error); }
}

async function loadFeed(){
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    afficherAnnonces(toutesLesAnnonces);
  } catch (e) { console.error("Erreur flux:", e); }
}

function afficherAnnonces(liste, context = null) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  if (!liste || liste.length === 0) {
    feed.innerHTML = '<p style="color:#64748b; text-align:center; padding:30px;">Aucun contenu disponible.</p>';
    return;
  }
  feed.innerHTML = "";
  liste.forEach(a => {
    let loc = `📍 ${a.ville || 'Lubumbashi'}`;
    if(a.commune) loc += `, ${a.commune}`;
    if(a.quartier) loc += ` (${a.quartier})`;
    const estVip = (a.statut === 'vip');

    feed.innerHTML += `
      <div class="annonce-card ${estVip ? 'vip-premium' : ''}">
        ${estVip ? `<span class="vip-badge-tag">👑 Boutique Pro VIP</span>` : ''}
        <h3 style="margin:0 0 5px 0;">${a.titre}</h3>
        <div class="annonce-price">${a.prix} ${a.devise || '$'} / par ${a.periode || 'jour'}</div>
        <div class="annonce-meta">${loc}</div>
        <div class="gallery">
          ${a.images && a.images.length > 0 ? a.images.map(img=>`<img src="${img}" class="gallery-item">`).join("") : '<p style="padding:10px; color:#64748b; font-size:0.8rem;">Pas de photo disponible</p>'}
        </div>
        ${a.description ? `<div class="annonce-description">${a.description}</div>` : ''}
        <div class="annonce-footer">
          <span class="badge-status ${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
            ${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}
          </span>
          <div class="footer-actions">
            ${estVip && context !== 'OWNER_VIEW' ? `<button class="btn-shop" onclick="visiterBoutique(${a.user_id}, \`${a.description || ''}\`)">🏢 Vitrine</button>` : ''}
            ${utilisateurConnecte && a.user_id === utilisateurConnecte.id ? `
              <button class="btn-boost" onclick="declencherPubliciteInterstitielle(() => executerRemonteeBdd(${a.id}))">🚀 Booster</button>
              <button class="btn-edit" onclick="ouvrirFormulaireModificationAnnonce(${a.id})">📝 Gérer</button>
              <button class="btn-delete" onclick="supprimerAnnonce(${a.id})">🗑️ Retirer</button>
            ` : ''}
            ${a.telephone ? `<button class="btn-contact" onclick="declencherPubliciteInterstitielle(() => window.location.href='tel:${a.telephone}')">📞 Appeler</button>` : ''}
          </div>
        </div>
      </div>
    `;
  });
}

function rechercher() {
  const sTitre = document.getElementById("search-titre").value.toLowerCase().trim();
  const sVille = document.getElementById("search-ville").value.toLowerCase().trim();
  const sCommune = document.getElementById("search-commune").value.toLowerCase().trim();
  const sQuartier = document.getElementById("search-quartier").value.toLowerCase().trim();

  const filtre = toutesLesAnnonces.filter(a => {
    let matchTitre = true;
    if (sTitre) { matchTitre = verifierCorrespondanceIntelligente(sTitre, `${a.titre} ${a.description || ''}`); }
    const matchVille = !sVille || (a.ville && a.ville.toLowerCase().includes(sVille));
    const matchCommune = !sCommune || (a.commune && a.commune.toLowerCase().includes(sCommune));
    const matchQuartier = !sQuartier || (a.quartier && a.quartier.toLowerCase().includes(sQuartier));
    return matchTitre && matchVille && matchCommune && matchQuartier;
  });

  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Résultats 🔍";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(filtre, 'PUBLIC_SEARCH'); fermerModal('rechercher');
}

function annulerRecherche() {
  document.getElementById("shop-header-container").innerHTML = "";
  document.getElementById("feed-title").innerText = "Annonces récentes";
  document.getElementById("reset-btn").style.display = "none";
  afficherAnnonces(toutesLesAnnonces);
}

function visiterBoutique(boutiqueUserId, desc) {
  let nom = "Boutique Exclusive";
  if(desc && desc.includes("VIP :")) { nom = desc.split("VIP :")[1].split("\n")[0].trim(); }
  const net = toutesLesAnnonces.filter(a => a.user_id === boutiqueUserId);
  document.getElementById("shop-header-container").innerHTML = `
    <div class="shop-banner"><h2>👑 Boutique : ${nom}</h2></div>
  `;
  document.getElementById("feed-title").innerText = "Vitrine Pro";
  document.getElementById("reset-btn").style.display = "inline-block";
  afficherAnnonces(net, 'VISITOR_MODE'); window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function publier(){
  try {
    if (!utilisateurConnecte) return alert("Session fermée.");
    const titre = document.getElementById("titre").value.trim();
    const prix = document.getElementById("prix").value.trim();
    const telephone = document.getElementById("telephone").value.trim();

    if (!titre || !prix || !telephone) return alert("Veuillez remplir les champs obligatoires.");

    const btnSubmit = document.querySelector(".modal-submit-btn");
    if(btnSubmit) { btnSubmit.innerText = "Envoi... ⏳"; btnSubmit.disabled = true; }

    const files = document.getElementById("image").files; 
    let images_base64 = [];
    for(let f of files){ images_base64.push(await compressAndToBase64(f)); }
    
    const bodyData = {
      user_id: utilisateurConnecte.id, titre, prix, 
      devise: document.getElementById("devise").value,
      periode: document.getElementById("periode").value, telephone,
      description: document.getElementById("description").value, 
      ville: document.getElementById("ville").value,
      commune: document.getElementById("commune").value, 
      quartier: document.getElementById("quartier").value,
      statut: "disponible", images_base64
    };
    
    const res = await fetch(`${API}/annonces`, { 
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(bodyData) 
    });
    
    if(res.ok) {
      alert("Annonce publiée ! 🎉");
      // RESET COMPLET DES CHAMPS ET FERMETURE
      document.getElementById("titre").value = "";
      document.getElementById("prix").value = "";
      document.getElementById("description").value = "";
      document.getElementById("commune").value = "";
      document.getElementById("quartier").value = "";
      document.getElementById("image").value = "";
      fermerModal('publier'); 
      await loadFeed();
    } else { alert("Le serveur a rejeté la fiche."); }
  } catch (e) { console.error(e); alert("Erreur serveur."); } 
  finally {
    const btnSubmit = document.querySelector(".modal-submit-btn");
    if(btnSubmit) { btnSubmit.innerText = "Mettre en ligne"; btnSubmit.disabled = false; }
  }
}

let countObjetsBulk = 0;
function ajouterChampObjetUnique() {
  countObjetsBulk++; 
  const container = document.getElementById("bulk-items-container");
  if(!container) return;
  const d = document.createElement('div'); 
  d.id = `bulk-box-${countObjetsBulk}`;
  d.style = "background:#f8fafc; padding:12px; border-radius:10px; margin-bottom:12px; position:relative; border:1px solid #e2e8f0;";
  d.innerHTML = `
    <span style="position:absolute; right:10px; top:5px; cursor:pointer; color:red; font-weight:bold;" onclick="document.getElementById('bulk-box-${countObjetsBulk}').remove()">✕</span>
    <input class="bulk-titre" placeholder="Nom de l'objet (Ex: Studio meublé)" style="padding:8px; margin:4px 0;">
    <div style="display:flex; gap:5px; margin:4px 0;">
      <input type="number" class="bulk-prix" placeholder="Prix" style="padding:8px; margin:0;">
      <select class="bulk-devise" style="width:70px; margin:0;"><option value="$">$</option><option value="FC">FC</option></select>
      <select class="bulk-periode" style="margin:0;"><option value="heure">heure</option><option value="jour" selected>jour</option><option value="mois">mois</option></select>
    </div>
    <textarea class="bulk-description" placeholder="Description..." style="padding:8px; margin:4px 0; height:60px; font-size:0.85rem;"></textarea>
    <input type="file" class="bulk-image" accept="image/*" multiple style="padding:5px;">
  `;
  container.appendChild(d);
}

async function publierCatalogueEnMasse() {
  const boxes = document.querySelectorAll("#bulk-items-container > div"); 
  if(boxes.length === 0) return alert("Insérez au moins un élément.");
  const masterBtn = document.getElementById("bulk-submit-master-btn");
  if(masterBtn) { masterBtn.innerText = "Envoi en masse... ⏳"; masterBtn.disabled = true; }

  try {
    let successCount = 0;
    for(let box of boxes) {
      const titre = box.querySelector(".bulk-titre").value.trim();
      const prix = box.querySelector(".bulk-prix").value.trim();
      const dev = box.querySelector(".bulk-devise").value;
      const per = box.querySelector(".bulk-periode").value;
      const desc = box.querySelector(".bulk-description").value.trim();
      const files = box.querySelector(".bulk-image").files;
      if(!titre || !prix) continue;

      let images_base64 = []; 
      if(files) { for(let f of files) { images_base64.push(await compressAndToBase64(f)); } }
      
      const res = await fetch(`${API}/annonces`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: utilisateurConnecte.id, titre, 
          description: desc ? `VIP : ${utilisateurConnecte.shop_name}\n${desc}` : `VIP : ${utilisateurConnecte.shop_name}`,
          prix, devise: dev, periode: per, ville: utilisateurConnecte.ville || "Lubumbashi",
          commune: "", quartier: "", telephone: utilisateurConnecte.telephone, statut: "vip", images_base64
        })
      });
      if(res.ok) successCount++;
    }
    alert(`${successCount} fiches VIP créées !`);
    fermerModal('vip'); document.getElementById("bulk-items-container").innerHTML = "";
    await loadFeed();
  } catch (e) { console.error(e); } 
  finally { if(masterBtn) { masterBtn.innerText = "Lancer la publication groupée"; masterBtn.disabled = false; } }
}

function gererClicBoutonVipMenu() {
  if(!utilisateurConnecte) return alert("Veuillez vous connecter.");
  const container = document.getElementById("vip-form-body");
  if(!container) return;

  if(!utilisateurConnecte.is_vip) {
    document.getElementById("vip-modal-title").innerText = "👑 Espace VIP Pro";
    container.innerHTML = `
      <div class="form-group full-width"><label>Nom commercial</label><input id="vip-shop-name" placeholder="Ex: Agence Immo"></div>
      <div class="form-group full-width"><label>Ville</label><input id="vip-ville" value="Lubumbashi"></div>
      <button class="modal-submit-btn" style="background:#d97706;" onclick="validerInscriptionBoutiqueLocale()">Devenir VIP Pro 👑</button>
    `;
  } else {
    document.getElementById("vip-modal-title").innerText = `📦 Multi-Dépôt VIP`;
    container.innerHTML = `
      <div class="form-group full-width"><div id="bulk-items-container"></div>
      <button type="button" style="background:#fffdf5; color:#d97706; border:1px dashed #d97706; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;" onclick="ajouterChampObjetUnique()">➕ Ajouter une fiche</button></div>
      <button class="modal-submit-btn" id="bulk-submit-master-btn" style="background:#d97706;" onclick="publierCatalogueEnMasse()">Lancer la publication groupée</button>
    `;
    document.getElementById("bulk-items-container").innerHTML = ""; countObjetsBulk = 0; ajouterChampObjetUnique();
  }
  ouvrirModal('vip');
}

async function validerInscriptionBoutiqueLocale() {
  const sName = document.getElementById("vip-shop-name").value.trim();
  if(!sName) return alert("Nom indispensable.");
  const res = await fetch(`${API}/users/${utilisateurConnecte.id}/upgrade-vip`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shop_name: sName })
  });
  if(res.ok) {
    utilisateurConnecte.is_vip = true; utilisateurConnecte.shop_name = sName;
    localStorage.setItem("nia_user_session", JSON.stringify(utilisateurConnecte));
    alert("Profil Boutique Activé !"); fermerModal('vip'); location.reload();
  }
}

function ouvrirFormulaireModificationAnnonce(id) {
  const a = toutesLesAnnonces.find(o => o.id === id);
  if(!a) return; fermerModal('profil');
  document.getElementById("edit-id").value = a.id;
  document.getElementById("edit-titre").value = a.titre;
  document.getElementById("edit-prix").value = a.prix;
  document.getElementById("edit-devise").value = a.devise || "$";
  document.getElementById("edit-periode").value = a.periode || "jour";
  document.getElementById("edit-statut").value = a.statut;
  document.getElementById("edit-description").value = a.description || "";
  document.getElementById("edit-ville").value = a.ville || "Lubumbashi";
  document.getElementById("edit-commune").value = a.commune || "";
  document.getElementById("edit-quartier").value = a.quartier || "";
  document.getElementById("edit-telephone").value = a.telephone || "";
  ouvrirModal('modifier-annonce');
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  const payload = {
    titre: document.getElementById("edit-titre").value, prix: document.getElementById("edit-prix").value,
    devise: document.getElementById("edit-devise").value, periode: document.getElementById("edit-periode").value,
    statut: document.getElementById("edit-statut").value, description: document.getElementById("edit-description").value,
    ville: document.getElementById("edit-ville").value, commune: document.getElementById("edit-commune").value,
    quartier: document.getElementById("edit-quartier").value, telephone: document.getElementById("edit-telephone").value
  };
  const res = await fetch(`${API}/annonces/${id}/update`, {
    method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)
  });
  if(res.ok) { alert("Modifications enregistrées !"); fermerModal('modifier-annonce'); loadFeed(); }
}

async function supprimerAnnonce(id) {
  if(!confirm("Supprimer cette publication ?")) return;
  const res = await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
  if(res.ok) { alert("Fiche retirée."); loadFeed(); }
}

async function executerRemonteeBdd(idAnnonce) {
  const res = await fetch(`${API}/annonces/${idAnnonce}/boost`, { method: "POST" });
  if(res.ok) { alert("Annonce boostée !"); loadFeed(); }
}

function ouvrirMonProfilOuMaBoutique() {
  const title = document.getElementById("profil-modal-title");
  const content = document.getElementById("profil-view-content");
  if(!utilisateurConnecte) return alert("Connectez-vous.");
  const mesAnnonces = toutesLesAnnonces.filter(a => a.user_id === utilisateurConnecte.id);

  title.innerText = utilisateurConnecte.is_vip ? `🏢 Vitrine : ${utilisateurConnecte.shop_name}` : "👤 Mon Profil";
  content.innerHTML = `
    <p>Téléphone : ${utilisateurConnecte.telephone}</p>
    <h4>Publications (${mesAnnonces.length}) :</h4>
    <div id="sub-list" style="display:flex; flex-direction:column; gap:8px;"></div>
    <button class="big-btn secondary" style="margin-top:20px;" onclick="localStorage.clear(); location.reload();">Déconnexion 🚪</button>
  `;
  const sub = content.querySelector("#sub-list");
  mesAnnonces.forEach(o => {
    sub.innerHTML += `
      <div style="background:#f1f5f9; padding:8px; border-radius:8px; display:flex; justify-content:between; align-items:center;">
        <div style="flex:1;"><strong>${o.titre}</strong></div>
        <button class="btn-edit" onclick="ouvrirFormulaireModificationAnnonce(${o.id})">Gérer</button>
      </div>`;
  });
  ouvrirModal('profil');
}

function compressAndToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas'); let w = img.width, h = img.height;
        if (w > 800) { h = Math.round((h * 800) / w); w = 800; } canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
}

// ADMIN CONSOLE VIA LE BOUTON ENGRENAGE
let adminTimer = null; let aVibre = false;
const gearBtn = document.getElementById("gear-admin-trigger");
if(gearBtn){
  gearBtn.addEventListener("contextmenu", (e) => {
    e.preventDefault(); const c = prompt("Code secret PC:");
    if(c === "BEN4002ET4200") ouvrirAdmin();
  });
}
async function ouvrirAdmin() {
  const res = await fetch(`${API}/admin/stats`); const s = await res.json();
  document.getElementById("adm-stat-total").innerText = s.total;
  document.getElementById("adm-stat-vip").innerText = s.vip;
  document.getElementById("adm-stat-stand").innerText = s.standard;
  ouvrirModal('admin-panel');
}

verifierSession();
initialiserBanniereAdSenseRotative();
