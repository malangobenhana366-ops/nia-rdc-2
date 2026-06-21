const API = "https://nia-rdc-2.onrender.com"; 

let toutesLesAnnonces = [];
let tousLesSignalements = [];
let VUE_ADMIN_ACTUELLE = "flux"; 
let ONGLE_PROFIL_ACTIF = "standard";
let BLOCS_VIP_COUNT = 0;
let adminTimer = null;
let tempsValide = false;
let yStart = 0;

const CHARTE_APROPOS = `À propos de NIA RDC\n\nPlateforme de mise en relation de confiance pour la colocation, les objets et les services en République Démocratique du Congo.`;
const CHARTE_PRIVACY = `Politique de confidentialité de NIA RDC\n\nNous protégeons vos numéros et photos. Vos données ne sont jamais vendues à des tiers.`;
const CHARTE_CGU = `Conditions de sécurité et d'utilisation de NIA RDC\n\nEn ouvrant un compte sur NIA RDC, vous certifiez l'authenticité de vos coordonnées téléphoniques. Tout comportement malveillant ou fraude entraînera un bannissement immédiat et irréversible de votre appareil.`;

// GESTION CORRIGÉE DU SCROLL DES CGU
function initialiserEcouteurScrollCGU() {
  const box = document.getElementById("cgu-text-box");
  if (!box) return;

  box.addEventListener("scroll", () => {
    const checkbox = document.getElementById("auth-accept-rules");
    // Tolérance de 8 pixels pour s'adapter à tous les écrans mobiles
    if (box.scrollHeight - box.scrollTop <= box.clientHeight + 8) {
      if (checkbox) {
        checkbox.removeAttribute("disabled");
      }
    }
  });
}

// GESTIONNAIRE DE CHANGEMENT DE LA CASE À COCHER CGU
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "auth-accept-rules") {
    const btnSubmit = document.getElementById("register-submit-btn");
    if (btnSubmit) {
      if (e.target.checked) btnSubmit.removeAttribute("disabled");
      else btnSubmit.setAttribute("disabled", "true");
    }
  }
});

function verifierStatutAuthentificationHeader() {
  const userId = localStorage.getItem("nia_user_id");
  const anonBlock = document.getElementById("anonymous-header-actions");
  const logoutBtn = document.getElementById("header-logout-btn");
  const deleteBtn = document.getElementById("header-delete-btn");
  if(userId) {
    if(anonBlock) anonBlock.style.display = "none";
    if(logoutBtn) logoutBtn.style.display = "block";
    if(deleteBtn) deleteBtn.style.display = "block";
  } else {
    if(anonBlock) anonBlock.style.display = "flex";
    if(logoutBtn) logoutBtn.style.display = "none";
    if(deleteBtn) deleteBtn.style.display = "none";
  }
}

function declencherAuthentificationDynamique(versInscription = true) {
  basculerModeAuth(versInscription);
  document.getElementById("modal-auth").style.display = "flex";
  
  if(versInscription) {
    const checkbox = document.getElementById("auth-accept-rules");
    const btnSubmit = document.getElementById("register-submit-btn");
    
    if(checkbox) { checkbox.checked = false; checkbox.setAttribute("disabled", "true"); }
    if(btnSubmit) btnSubmit.setAttribute("disabled", "true");
    
    const box = document.getElementById("cgu-text-box");
    if(box) { 
      box.innerHTML = CHARTE_CGU.replace(/\n/g, "<br>"); 
      box.scrollTop = 0; 
    }
    // Réattacher proprement la surveillance du scroll
    setTimeout(initialiserEcouteurScrollCGU, 200);
  }
}

function ouvrirModalSeccurisee(modalId) {
  if (!localStorage.getItem("nia_user_id")) declencherAuthentificationDynamique(false);
  else ouvrirModal(modalId);
}

function deconnecterUtilisateur() { localStorage.clear(); window.location.reload(); }

async function supprimerCompteUtilisateur() {
  if (confirm("Voulez-vous définitivement supprimer votre compte ?")) {
    await fetch(`${API}/auth/delete-account`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: localStorage.getItem("nia_user_id") })
    });
    localStorage.clear(); window.location.reload();
  }
}

function basculerModeAuth(versInscription) {
  document.getElementById("auth-title").textContent = versInscription ? "Créer un compte" : "Connexion";
  document.getElementById("auth-form-register").style.display = versInscription ? "grid" : "none";
  document.getElementById("auth-form-login").style.display = versInscription ? "none" : "grid";
}

// RE-EXECUTION CORRECTE ET SECURISEE DE L'INSCRIPTION
async function executerInscription() {
  const telephone = document.getElementById("auth-tel").value.trim(); 
  const password = document.getElementById("auth-pass").value.trim();
  
  if(!telephone || !password) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone, password, acceptedTerms: true })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem("nia_user_id", data.user.id);
      localStorage.setItem("nia_standard_telephone", data.user.telephone);
      document.getElementById("modal-auth").style.display = "none";
      verifierStatutAuthentificationHeader(); 
      loadFeed();
    } else { 
      alert(data.error || "Erreur lors de l'inscription."); 
    }
  } catch(e) {
    alert("Impossible de joindre le serveur.");
  }
}

// RE-EXECUTION DE LA CONNEXION
async function executerConnexion() {
  const telephone = document.getElementById("login-tel").value.trim(); 
  const password = document.getElementById("login-pass").value.trim();
  
  if(!telephone || !password) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem("nia_user_id", data.user.id);
      localStorage.setItem("nia_standard_telephone", data.user.telephone);
      document.getElementById("modal-auth").style.display = "none";
      verifierStatutAuthentificationHeader(); 
      loadFeed();
    } else { 
      alert(data.error || "Numéro ou mot de passe incorrect."); 
    }
  } catch(e) {
    alert("Erreur de connexion réseau.");
  }
}

function toggleLeftDropdown() {
  const d = document.getElementById("left-dropdown"); d.style.display = d.style.display === "block" ? "none" : "block";
}

function ouvrirModalLegal(type) {
  document.getElementById("legal-title-display").textContent = type === 'apropos' ? "À propos" : "Confidentialité";
  document.getElementById("legal-body-display").textContent = type === 'apropos' ? CHARTE_APROPOS : CHARTE_PRIVACY;
  document.getElementById("modal-legal").style.display = "flex";
}

function val(id) { return document.getElementById(id)?.value?.trim() || ""; }

function optimiserEtCompresserImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > 500) { h = Math.round((h * 500) / w); w = 500; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
    };
  });
}

function startAdminTouch() { tempsValide = false; adminTimer = setTimeout(() => { tempsValide = true; }, 10000); }
function stopAdminTouch() { clearTimeout(adminTimer); }
window.addEventListener("touchstart", e => { yStart = e.touches[0].clientY; });
window.addEventListener("touchend", e => {
  if (tempsValide && (yStart - e.changedTouches[0].clientY > 60)) {
    tempsValide = false;
    if (prompt("Saisir le code d'accès de sécurité Administrateur :") === "BEN4002ET4200") {
      ouvrirModal("admin"); basculerVueAdmin('flux');
    }
  }
});

// MESSAGES DE L'ESPACE PRIVÉ ET REPONSES DIRECTES CIBLEES
async function chargerMessagesAdministratifsPrives() {
  const userId = localStorage.getItem("nia_user_id");
  if(!userId) return;
  try {
    const res = await fetch(`${API}/user/${userId}/messages`);
    const msgs = await res.json();
    const box = document.getElementById("admin-messages-box-container");
    if(msgs.length === 0) { box.innerHTML = "Aucun message reçu de la part de la direction."; return; }
    
    box.innerHTML = msgs.map(m => {
      if (m.is_global) {
        return `<div class="admin-msg-box" style="border-left:4px solid #10b981;"><b>[Global Admin]</b>: ${m.message}</div>`;
      }
      let blocksReponse = m.reponse_utilisateur 
        ? `<div style="margin-top:4px; font-size:0.8rem; color:#047857; background:#e6f4ea; padding:4px; border-radius:4px;"><b>Ma réponse transmise :</b> ${m.reponse_utilisateur}</div>`
        : `<div style="margin-top:6px; display:flex; gap:4px;">
            <input id="user-reply-input-${m.id}" placeholder="Écrire ma réponse..." style="padding:4px; font-size:0.8rem; flex:1;">
            <button class="btn-contact" style="padding:4px 8px; font-size:0.75rem;" onclick="renvoyerReponseAAdmin(${m.id})">Répondre ↩️</button>
           </div>`;
      return `<div class="admin-msg-box" style="border-left:4px solid #2563eb;"><b>[Message Privé]</b>: ${m.message} ${blocksReponse}</div>`;
    }).join("");
  } catch(e){}
}

async function renvoyerReponseAAdmin(msgId) {
  const text = document.getElementById(`user-reply-input-${msgId}`).value.trim();
  if(!text) return;
  const res = await fetch(`${API}/user/reply-message/${msgId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reponse: text })
  });
  if(res.ok) { alert("Votre réponse a bien été envoyée à l'administrateur !"); chargerMessagesAdministratifsPrives(); }
}

function rechercher() {
  const qTitre = val("search-titre"), qVille = val("search-ville");
  let res = toutesLesAnnonces.filter(a => {
    let mTitle = qTitre === "" || a.titre.toLowerCase().includes(qTitre.toLowerCase());
    let mVille = a.ville.toLowerCase().includes(qVille.toLowerCase());
    return mTitle && mVille;
  });
  fermerModal("rechercher");
  document.getElementById("feed-title").textContent = `Résultats (${res.length})`;
  afficherFlux(res, true);
}

function annulerRecherche() { document.getElementById("feed-title").textContent = "Annonces récentes"; afficherFlux(toutesLesAnnonces, false); }

async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`); toutesLesAnnonces = await res.json(); afficherFlux(toutesLesAnnonces, false);
  } catch (e) { document.getElementById("feed").innerHTML = "Erreur de chargement des données."; }
}

function afficherFlux(liste, modeRecherche = false) {
  const feed = document.getElementById("feed"); if (!feed) return; feed.innerHTML = "";
  document.getElementById("reset-btn").style.display = modeRecherche ? "block" : "none";
  if(liste.length === 0) { feed.innerHTML = "<p style='text-align:center; color:gray;'>Aucune annonce disponible.</p>"; return; }

  liste.forEach(a => {
    let imagesHtml = (a.images && a.images.length > 0) ? `<div class="gallery">${a.images.map(u => `<img src="${u}" class="gallery-item">`).join("")}</div>` : "";
    feed.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="vip-badge-tag">👑 VIP</div>` : ""}
        <h3 style="margin:0;">${a.titre}</h3>
        <div class="annonce-price">${a.prix} ${a.devise} / ${a.periode}</div>
        <div class="annonce-meta">📍 ${a.ville} ${a.commune ? '- '+a.commune : ''}</div>
        <div class="annonce-description" onclick="this.classList.toggle('deployee')">${a.description || "Aucune description."}</div>
        ${imagesHtml}
        <div class="annonce-footer">
          ${a.statut === "occupe" ? `<span class="badge-status status-occupe">🔴 Occupé</span>` : `<span class="badge-status status-disponible">🟢 Disponible</span>`}
          <div style="display:flex; gap:6px;">
            <button class="btn-report" onclick="signalerAnnonceAvecMotif(${a.id})">⚠️ Signaler</button>
            <button class="btn-contact" onclick="window.location.href='tel:${a.telephone}'">📞 Appeler</button>
          </div>
        </div>
      </div>`;
  });
}

async function signalerAnnonceAvecMotif(id) {
  const raison = prompt("Saisir la raison du signalement de cette annonce :");
  if (!raison) return;
  await fetch(`${API}/annonces/${id}/signaler`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raison })
  });
  alert("Signalement envoyé à l'équipe de modération.");
}

async function publier() {
  if (!val("titre") || !val("telephone")) return alert("Le titre et le téléphone sont obligatoires.");
  const files = document.getElementById("image")?.files; let images_base64 = [];
  if(files) { for(let i=0; i<files.length; i++) { images_base64.push(await optimiserEtCompresserImage(files[i])); } }
  localStorage.setItem("nia_standard_telephone", val("telephone"));

  await fetch(`${API}/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"), titre: val("titre"), prix: val("prix"), devise: val("devise"),
      periode: val("periode"), telephone: val("telephone"), description: val("description"), ville: val("ville"),
      commune: val("commune"), quartier: val("quartier"), statut: val("statut"), is_vip: false, images_base64
    })
  });
  fermerModal("publier"); loadFeed();
}

function ouvrirModal(id) {
  document.getElementById(`modal-${id}`).style.display = "flex";
  if (id === "vip") rafraichirEspaceVip();
  if (id === "profil") { changerOngletProfil(ONGLE_PROFIL_ACTIF); chargerMessagesAdministratifsPrives(); }
}
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

// SYSTEME DE BOOST APRES TEMPORISATION PUBLICITAIRE INTERSTITIELLE
function declencherPubliciteInterstitielleBoost(annonceId) {
  const modal = document.getElementById("modal-interstitiel");
  const txt = document.getElementById("interstitiel-countdown-txt");
  modal.style.display = "flex";
  
  let secondesRestantes = 5;
  txt.innerHTML = `📢 [PUBLICITÉ INTERSTITIELLE EN COURS]<br><br>Traitement algorithmique du boost...<br>Votre annonce va remonter en tête de liste dans <b>${secondesRestantes}s</b>.`;
  
  const chrono = setInterval(async () => {
    secondesRestantes--;
    if(secondesRestantes <= 0) {
      clearInterval(chrono);
      modal.style.display = "none";
      
      const res = await fetch(`${API}/annonces/${annonceId}/boost`, { method: "POST" });
      if(res.ok) {
        alert("🚀 Succès ! Votre annonce est maintenant propulsée en première position !");
        fermerModal("profil");
        loadFeed();
      }
    } else {
      txt.innerHTML = `📢 [PUBLICITÉ INTERSTITIELLE EN COURS]<br><br>Traitement algorithmique du boost...<br>Votre annonce va remonter en tête de liste dans <b>${secondesRestantes}s</b>.`;
    }
  }, 1000);
}

function changerOngletProfil(type) {
  ONGLE_PROFIL_ACTIF = type;
  document.getElementById("tab-standard-btn").style.background = type === "standard" ? "#cbd5e1" : "#f1f5f9";
  document.getElementById("tab-vip-btn").style.background = type === "vip" ? "#fde68a" : "#f1f5f9";
  const tel = type === "vip" ? localStorage.getItem("nia_vip_telephone") : localStorage.getItem("nia_standard_telephone");
  const content = document.getElementById("profil-view-content");
  if(!tel) { content.innerHTML = "<p style='color:gray;text-align:center;'>Aucune annonce publiée.</p>"; return; }

  const mesAnnonces = toutesLesAnnonces.filter(a => a.telephone === tel && a.is_vip === (type === "vip"));
  if(mesAnnonces.length === 0) { content.innerHTML = "<p style='color:gray;text-align:center;'>Aucune annonce dans cette catégorie.</p>"; return; }

  content.innerHTML = mesAnnonces.map(a => `
    <div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid var(--border);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="flex:1; font-weight:bold; font-size:0.9rem;">${a.titre} <span style="font-size:0.75rem; color:var(--text-light);">(${a.prix} ${a.devise})</span></div>
        <button class="btn-boost" onclick="declencherPubliciteInterstitielleBoost(${a.id})">🚀 Booster</button>
      </div>
      <div style="display:flex; gap:4px; margin-top:8px; justify-content:flex-end;">
        <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem;" onclick="ouvrirFormulaireModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})">✏️ Modifier</button>
        <button class="btn-delete" style="padding:4px 8px; font-size:0.75rem;" onclick="supprimerAnnonce(${a.id})">🗑️ Supprimer</button>
      </div>
    </div>`).join("");
}

function ouvrirFormulaireModificationAnnonce(annonce) {
  document.getElementById("edit-id").value = annonce.id;
  document.getElementById("edit-titre").value = annonce.titre;
  document.getElementById("edit-prix").value = annonce.prix;
  document.getElementById("edit-devise").value = annonce.devise;
  document.getElementById("edit-periode").value = annonce.periode;
  document.getElementById("edit-statut").value = annonce.statut;
  document.getElementById("edit-telephone").value = annonce.telephone;
  document.getElementById("edit-ville").value = annonce.ville;
  ouvrirModal("modifier-annonce");
}

async function sauvegarderModificationAnnonce() {
  const id = document.getElementById("edit-id").value;
  await fetch(`${API}/annonces/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: val("edit-titre"), prix: val("edit-prix"), devise: val("edit-devise"),
      periode: val("edit-periode"), statut: val("edit-statut"), telephone: val("edit-telephone"),
      ville: val("edit-ville"), commune: "", quartier: "", description: ""
    })
  });
  fermerModal("modifier-annonce"); fermerModal("profil"); loadFeed();
}

async function supprimerAnnonce(id) { if(confirm("Supprimer définitivement cette offre ?")) { await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); fermerModal("profil"); loadFeed(); } }

// ENVOIS ET SUPREVISION DE LA CONSOLE DE MODÉRATION ADMIN
function basculerVueAdmin(mode) {
  VUE_ADMIN_ACTUELLE = mode;
  const titres = {
    flux: "Supervision Globale des Annonces",
    signaux: "Traitement des Signalements Reçus",
    reponses_normales: "Boîte des Messages Répondus (Annonces Normales)",
    justifications: "Boîte des Justifications (Annonces Signalées)"
  };
  document.getElementById("admin-list-title").textContent = titres[mode] || "Administration";
  appliquerFiltrageSupervisionAdmin();
}

async function distribuerMessageAdminPrive(telephoneDest, provenanceContexte) {
  const txt = document.getElementById(`msg-text-node-${telephoneDest}`).value.trim();
  if(!txt) return alert("Veuillez rédiger un message.");
  
  const res = await fetch(`${API}/admin/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel: telephoneDest, message: txt, is_global: false, provenance_contexte: provenanceContexte })
  });
  if(res.ok) { alert("Message ciblé transmis à l'utilisateur."); document.getElementById(`msg-text-node-${telephoneDest}`).value = ""; }
}

async function envoyerMessageGlobalTousComptes() {
  const txt = val("admin-msg-global-text"); if(!txt) return;
  await fetch(`${API}/admin/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel: "", message: txt, is_global: true })
  });
  alert("Message général diffusé."); document.getElementById("admin-msg-global-text").value = "";
}

async function appliquerFiltrageSupervisionAdmin() {
  const list = document.getElementById("admin-flux-supervision-list"); list.innerHTML = "Mise à jour...";
  const villeFiltre = val("admin-filter-ville").toLowerCase();

  if (VUE_ADMIN_ACTUELLE === "flux") {
    let filtre = toutesLesAnnonces.filter(a => (villeFiltre === "" || a.ville.toLowerCase().includes(villeFiltre)));
    list.innerHTML = filtre.map(a => `
      <div class="admin-card-row">
        <span><b>${a.titre}</b> (Tel: ${a.telephone})</span>
        <div style="display:flex; gap:4px; margin-top:6px;">
          <input id="msg-text-node-${a.telephone}" placeholder="Message d'annonce privé..." style="color:black; padding:4px; flex:1;">
          <button onclick="distribuerMessageAdminPrive('${a.telephone}', 'normal')" style="background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer; padding:6px;">Envoyer</button>
          <button onclick="supprimerAnnonceAdmin(${a.id})" style="background:red; color:white; border:none; border-radius:4px; cursor:pointer; padding:6px;">🗑️</button>
        </div>
      </div>`).join("");
  } 
  else if (VUE_ADMIN_ACTUELLE === "signaux") {
    const res = await fetch(`${API}/admin/reports`); tousLesSignalements = await res.json();
    list.innerHTML = tousLesSignalements.map(a => `
      <div class="admin-card-row" style="border-left:4px solid red;">
        <div style="color:#f87171; font-size:0.8rem; font-weight:bold;">🚨 RAISON : "${a.raison}"</div>
        <div style="font-size:0.75rem; color:#94a3b8;">Annonce : ${a.titre} | Tel Propriétaire : ${a.telephone}</div>
        <div style="display:flex; gap:4px; margin-top:6px;">
          <input id="msg-text-node-${a.telephone}" placeholder="Demande de justification..." style="color:black; padding:4px; flex:1;">
          <button onclick="distribuerMessageAdminPrive('${a.telephone}', 'signale')" style="background:var(--vip-gold); color:white; border:none; border-radius:4px; cursor:pointer; padding:6px;">Avertir</button>
          <button onclick="supprimerAnnonceAdmin(${a.id})" style="background:red; color:white; border:none; border-radius:4px; cursor:pointer; padding:6px;">Effacer</button>
        </div>
      </div>`).join("");
  } 
  else if (VUE_ADMIN_ACTUELLE === "reponses_normales" || VUE_ADMIN_ACTUELLE === "justifications") {
    const contexteTable = VUE_ADMIN_ACTUELLE === "reponses_normales" ? "normal" : "signale";
    const res = await fetch(`${API}/admin/replied-messages/${contexteTable}`);
    const data = await res.json();
    if(data.length === 0) { list.innerHTML = "<div style='color:gray; font-size:0.8rem; padding:10px;'>Aucune réponse utilisateur enregistrée dans ce canal.</div>"; return; }
    
    list.innerHTML = data.map(m => `
      <div class="admin-card-row" style="border-left: 4px solid #38bdf8;">
        <div style="font-size:0.75rem; color:#94a3b8;"><b>Admin :</b> ${m.message}</div>
        <div style="background:#0f172a; padding:8px; border-radius:6px; margin-top:6px; font-size:0.85rem; color:#10b981; border:1px solid #334155;">
          <b>↩️ Justification reçue :</b> "${m.reponse_utilisateur}"
        </div>
      </div>`).join("");
  }
}

async function supprimerAnnonceAdmin(id) { if(confirm("Supprimer définitivement l'offre ?")) { await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); loadFeed(); setTimeout(() => appliquerFiltrageSupervisionAdmin(), 400); } }

function rafraichirEspaceVip() {
  const body = document.getElementById("vip-form-body"); const nom = localStorage.getItem("nia_vip_nom");
  if(!nom) {
    body.innerHTML = `
      <div class="form-group full-width"><label>Nom de l'Espace Vitrine VIP</label><input id="reg-vip-nom" placeholder="Ex: Agence Immobilière Fast"></div>
      <div class="form-group full-width"><label>Numéro de téléphone Professionnel</label><input id="reg-vip-tel" type="tel" placeholder="082000000"></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="localStorage.setItem('nia_vip_nom', val('reg-vip-nom')); localStorage.setItem('nia_vip_telephone', val('reg-vip-tel')); rafraichirEspaceVip();">Activer mon Espace VIP 👑</button>`;
  } else {
    body.innerHTML = `<div style='color:var(--vip-gold); font-weight:bold; text-align:center; margin-bottom:10px;'>👑 ENREGISTREMENT SUR VOTRE VITRINE VIP : ${nom}</div><div id='conteneur-blocs-annonces-vip'></div><button class='modal-submit-btn' style='background:#64748b; margin-top:10px;' onclick='ajouterNouveauBlocFormulaireVip()'>➕ Ajouter un objet de colocation</button><button class='modal-submit-btn' style='background:var(--vip-gold); margin-top:5px;' onclick='soumettreToutesLesAnnoncesVip()'>Publier le catalogue complet</button>`;
    BLOCS_VIP_COUNT = 0; ajouterNouveauBlocFormulaireVip();
  }
}

function ajouterNouveauBlocFormulaireVip() {
  BLOCS_VIP_COUNT++; const c = document.getElementById("conteneur-blocs-annonces-vip"); const d = document.createElement("div");
  d.className = "vip-block-annonce"; d.id = `v-b-${BLOCS_VIP_COUNT}`; d.style = "background:#f1f5f9; padding:12px; border-radius:8px; margin-top:8px; display:flex; flex-direction:column; gap:6px; color:black;";
  d.innerHTML = `<input class="vip-in-titre" placeholder="Titre de l'annonce VIP *"><input class="vip-in-prix" type="number" placeholder="Prix"><select class="vip-in-devise"><option value="$">$</option></select><input class="vip-in-tel" value="${localStorage.getItem("nia_vip_telephone")}"><textarea class="vip-in-desc" placeholder="Détails descriptifs..."></textarea><input type="hidden" class="vip-in-periode" value="jour"><input type="file" class="vip-in-photos" multiple accept="image/*">`;
  c.appendChild(d);
}

async function soumettreToutesLesAnnoncesVip() {
  const blocs = document.querySelectorAll(".vip-block-annonce");
  for (let b of blocs) {
    const titre = b.querySelector(".vip-in-titre").value; const prix = b.querySelector(".vip-in-prix").value;
    const telephone = b.querySelector(".vip-in-tel").value; const description = b.querySelector(".vip-in-desc").value;
    if(!titre || !telephone) continue;
    await fetch(`${API}/annonces`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: localStorage.getItem("nia_user_id"), titre, prix, devise: "$", periode: "jour", telephone, description, ville: "Lubumbashi", is_vip: true, images_base64: [] })
    });
  }
  fermerModal("vip"); loadFeed();
}

setInterval(() => { loadFeed(); }, 20000);
document.addEventListener("DOMContentLoaded", () => { 
  verifierStatutAuthentificationHeader(); 
  loadFeed(); 
  initialiserEcouteurScrollCGU();
});
