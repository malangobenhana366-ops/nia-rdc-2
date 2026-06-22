// =========================================================================
// SCRIPT LOGIQUE APPLICATIVE - NIA RDC (VERSION FINALE JUIN 2026)
// =========================================================================
const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let VUE_ADMIN_ACTIVE = "flux";
let ONGLET_PROFIL_ACTIF = "standard";
let BLOCS_VIP_COMPTEUR = 0;
let topAdminTimer = null;
let validationAdminOk = false;

const TEXTES_DU_DROIT = {
  securite: `Conditions de sécurité et d'utilisation de NIA RDC

Bienvenue sur NIA RDC.

Avant de créer un compte, veuillez lire les présentes conditions. En utilisant la plateforme, vous acceptez les règles suivantes.

1. Utilisation de la plateforme
NIA RDC est une plateforme destinée à faciliter la publication et la consultation d'annonces de location, de vente et de services. Les utilisateurs s'engagent à utiliser la plateforme de manière honteuse et responsable.

2. Exactitude des informations
Chaque utilisateur est responsable des informations qu'il publie. Les annonces doivent être exactes et ne pas contenir d'informations trompeuses ou mensongères.

3. Protection du compte
L'utilisateur est responsable de la confidentialité de son numéro de téléphone, de son mot de passe et des activités réalisées depuis son compte.

4. Contenus interdits
Il est interdit de publier des contenus :
- contraires aux lois en vigueur ;
- frauduleux ou trompeurs ;
- portant atteinte aux droits d'autrui ;
- contenant des informations fausses ou usurpant l'identité d'une autre personne.
NIA RDC se réserve le droit de supprimer tout contenu non conforme.

5. Photos et annonces
L'utilisateur garantit qu'il possède les droits nécessaires sur les photos et les informations publiées et autorise leur affichage sur la plateforme.

6. Protection des données
NIA RDC collecte uniquement les informations nécessaires au fonctionnement du service, notamment les informations de compte et les données liées aux annonces publiées.

7. Sécurité
NIA RDC met en œuvre des mesures techniques raisonnables pour protéger les données des utilisateurs. Toutefois, aucun système informatique ne peut garantir une sécurité absolue.

8. Responsabilité
NIA RDC acts comme plateforme de mise en relation et n'est pas partie aux accords conclus entre les utilisateurs. Chaque utilisateur est responsable des transactions et échanges qu'il réalise.

9. Modération
NIA RDC peut suspendre ou supprimer un compte ou une annonce en cas de non-respect des présentes conditions ou pour protéger la sécurité de la communauté.

10. Évolution des conditions
Ces conditions peuvent être mises à jour afin d'améliorer la sécurité de la plateforme. Les nouvelles versions prendront effet dès leur publication.

Acceptation
En créant un compte sur NIA RDC, je reconnais avoir lu les présentes conditions de sécurité et d'utilisation et j'accepte de les respecter.

[FIN DU DOCUMENT - DEFILEZ ENTIEREMENT POUR VALIDER]`,

  apropos: `À propos de NIA RDC

Bienvenue sur NIA RDC.
NIA RDC est une plateforme numérique conçue pour faciliter la mise en relation entre les personnes souhaitant louer, proposer ou rechercher des biens et des services en République Démocratique du Congo...`,

  confidentialite: `Politique de confidentialité de NIA RDC
Dernière mise à jour : Juin 2026.
La protection des informations personnelles de nos utilisateurs est importante pour notre équipe...`
};

function executerSecurisationEtMiseAJourAutomatique() {
  const cleDerniereMaj = "nia_security_cron_timestamp";
  const maintenant = Date.now();
  const d25JoursEnMillisecondes = 25 * 24 * 60 * 60 * 1000;

  const derniereMaj = localStorage.getItem(cleDerniereMaj);
  if (!derniereMaj || (maintenant - parseInt(derniereMaj)) > d25JoursEnMillisecondes) {
    localStorage.removeItem("nia_user_id");
    localStorage.setItem(cleDerniereMaj, maintenant.toString());
    alert("🔄 NIA RDC : Une mise à jour automatique de sécurité obligatoire a été appliquée. Veuillez vous reconnecter.");
    window.location.reload();
  }
}

function nettoyerChaineAntiXSS(chaine) {
  if (!chaine) return "";
  return chaine.replace(/[<>'"&]/g, (m) => {
    const table = { '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;', '&': '&amp;' };
    return table[m];
  });
}

function verifierFiltreStrictImmobilierEtContenusIllegaux(titre, description) {
  const texteComplet = `${titre.toLowerCase()} ${description.toLowerCase()}`;
  const motsImmobilierInterdits = ["maison", "chambre", "appartement", "studio", "parcelle", "terrain", "villa", "immeuble", "logement", "hotel", "bureau"];
  for (let mot of motsImmobilierInterdits) {
    if (texteComplet.includes(mot)) {
      alert(`⚠️ Publication refusée : NIA RDC n'est PAS une application immobilière. Les annonces pour maisons, chambres ou appartements sont interdites.`);
      return false;
    }
  }
  const motsIllegaux = ["drogue", "faux billets", "arme", "piratage", "hack", "blanchiment", "munition", "volé", "fake", "achat de compte"];
  for (let mot of motsIllegaux) {
    if (texteComplet.includes(mot)) {
      alert(`🚨 Alerte de Sécurité : Ce contenu a été détecté comme suspect ou illégal. Publication bloquée.`);
      return false;
    }
  }
  return true;
}

function brancherEvenementScrollControle() {
  const box = document.getElementById("cgu-scroller-node");
  if (!box) return;
  const chk = document.getElementById("chk-accept-rules");
  const btnReg = document.getElementById("btn-register-action");
  
  box.addEventListener("scroll", () => {
    if (box.scrollHeight - box.scrollTop <= box.clientHeight + 25) {
      if (chk && chk.hasAttribute("disabled")) {
        chk.removeAttribute("disabled");
        chk.onchange = function() { btnReg.disabled = !this.checked; };
      }
    }
  });
}

function toggleMenuLegal() {
  const m = document.getElementById("legal-dropdown"); 
  m.style.display = m.style.display === "block" ? "none" : "block";
}

function afficherDocumentJurisEtSecu(cle) {
  document.getElementById("legal-header-title").textContent = 
    cle === "securite" ? "📜 Sécurité & CGU" : cle === "apropos" ? "ℹ️ À propos de NIA RDC" : "🔒 Politique de confidentialité";
    
  document.getElementById("legal-body-content").textContent = TEXTES_DU_DROIT[cle];
  document.getElementById("legal-dropdown").style.display = "none";
  ouvrirModal("legal-display");
}

function rafraichirHeaderVisuel() {
  const isLogged = localStorage.getItem("nia_user_id");
  document.getElementById("header-auth-zone").style.display = isLogged ? "none" : "flex";
}

function ouvrirSecuriseAuth(inscription = true) {
  basculerAffichageAuthentification(inscription);
  ouvrirModal("auth");
  if(inscription) {
    const scroller = document.getElementById("cgu-scroller-node");
    if(scroller) { scroller.innerHTML = TEXTES_DU_DROIT.securite; scroller.scrollTop = 0; }
    const chk = document.getElementById("chk-accept-rules");
    const btnReg = document.getElementById("btn-register-action");
    if(chk) { chk.checked = false; chk.setAttribute("disabled", "true"); }
    if(btnReg) btnReg.disabled = true;
    setTimeout(brancherEvenementScrollControle, 300);
  }
}

function basculerAffichageAuthentification(versInscription) {
  document.getElementById("auth-main-title").textContent = versInscription ? "Inscription" : "Connexion";
  document.getElementById("form-register-block").style.display = versInscription ? "grid" : "none";
  document.getElementById("form-login-block").style.display = versInscription ? "none" : "grid";
}

function ouvrirSecuriseModal(id) {
  if(!localStorage.getItem("nia_user_id")) ouvrirSecuriseAuth(false);
  else ouvrirModal(id);
}

function ouvrirModal(id) {
  document.getElementById(`modal-${id}`).style.display = "flex";
  if(id === "vip") rafraichirVueVipFormulaire();
  if(id === "profil") {
    const nup = localStorage.getItem("nia_user_nup") || "Non assigné";
    document.getElementById("user-profile-nup-title").textContent = `Mon Numéro de Profil Unique : ${nup}`;
    basculerOngletProfil(ONGLET_PROFIL_ACTIF); 
    chargerConversationsPrivees(); 
  }
}

function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }
function deconnexion() { localStorage.clear(); window.location.reload(); }

async function actionInscription() {
  const telephone = nettoyerChaineAntiXSS(document.getElementById("reg-tel").value.trim());
  const password = document.getElementById("reg-pass").value.trim();
  if(!telephone || !password) return alert("Remplissez tous les champs.");
  
  const res = await fetch(`${API}/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone, password })
  });
  const data = await res.json();
  if(data.success) {
    localStorage.setItem("nia_user_id", data.user.id);
    localStorage.setItem("nia_user_tel", data.user.telephone);
    localStorage.setItem("nia_user_nup", data.user.nup);
    window.location.reload();
  } else alert(data.error);
}

async function actionConnexion() {
  const telephone = nettoyerChaineAntiXSS(document.getElementById("log-tel").value.trim());
  const password = document.getElementById("log-pass").value.trim();
  const res = await fetch(`${API}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone, password })
  });
  const data = await res.json();
  if(data.success) {
    localStorage.setItem("nia_user_id", data.user.id);
    localStorage.setItem("nia_user_tel", data.user.telephone);
    localStorage.setItem("nia_user_nup", data.user.nup);
    window.location.reload();
  } else alert(data.error);
}

async function suppressionDefinitiveCompte() {
  if (confirm("⚠️ Souhaitez-vous définitivement effacer votre compte NIA RDC ?")) {
    const user_id = localStorage.getItem("nia_user_id");
    await fetch(`${API}/auth/delete-account`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id })
    });
    deconnexion();
  }
}

function traiterFichierEnBase64(file) {
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

async function soumettreAnnonceStandard() {
  const titre = nettoyerChaineAntiXSS(document.getElementById("titre").value.trim());
  const description = nettoyerChaineAntiXSS(document.getElementById("description").value.trim());
  
  if (!verifierFiltreStrictImmobilierEtContenusIllegaux(titre, description)) return;

  const files = document.getElementById("photos-input").files;
  let images_base64 = [];
  for(let i=0; i<files.length; i++) { images_base64.push(await traiterFichierEnBase64(files[i])); }

  await fetch(`${API}/annonces`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"), titre, 
      prix: document.getElementById("prix").value.trim(), 
      devise: document.getElementById("devise").value, 
      periode: document.getElementById("periode").value, 
      statut: document.getElementById("statut").value, 
      telephone: nettoyerChaineAntiXSS(document.getElementById("telephone").value.trim()), 
      description, 
      ville: nettoyerChaineAntiXSS(document.getElementById("ville").value.trim()), 
      commune: nettoyerChaineAntiXSS(document.getElementById("commune").value.trim()), 
      is_vip: false, images_base64
    })
  });
  fermerModal("publier"); chargerFluxPrincipal();
}

async function chargerFluxPrincipal() {
  try {
    const res = await fetch(`${API}/feed`); toutesLesAnnonces = await res.json();
    rendreFluxHtml(toutesLesAnnonces);
  } catch(e) { document.getElementById("feed").innerHTML = "Problème de synchronisation réseau..."; }
}

function rendreFluxHtml(liste) {
  const container = document.getElementById("feed"); container.innerHTML = "";
  if(liste.length === 0) { container.innerHTML = "<p style='text-align:center; padding:20px; color:gray;'>Aucune offre disponible actuellement.</p>"; return; }

  liste.forEach(a => {
    let imagesMarkup = (a.images && a.images.length > 0) ? `<div class="gallery">${a.images.map(imgObj => `<img src="${imgObj.url}">`).join("")}</div>` : "";
    const isOwner = a.user_id == localStorage.getItem("nia_user_id");
    
    container.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="badge-vip">👑 VITRINE VIP</div>` : ""}
        <h3 style="margin:0 0 4px 0;">${a.titre}</h3>
        <div class="price-tag">${a.prix} ${a.devise} <span style="font-size:0.8rem; color:var(--text-light)">/ ${a.periode}</span></div>
        <div style="font-size:0.85rem; color:var(--text-light); margin-bottom:6px;">📍 Localisation: ${a.ville} ${a.commune ? ' - '+a.commune : ''}</div>
        <div style="font-size:0.9rem; background:#f8fafc; padding:10px; border-radius:6px; margin:8px 0;">${a.description || ''}</div>
        ${imagesMarkup}
        <div class="card-footer">
          <span class="${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">${a.statut === 'occupe' ? '🔴 Occupé / Épuisé' : '🟢 Disponible'}</span>
          <div style="display:flex; gap:4px;">
            <button class="btn-action report" onclick="signalerAnnonce(${a.id})">⚠️ Signaler</button>
            ${isOwner ? '' : `<button class="btn-action chat" onclick="ouvrirMessagerieDirecteInstantane(${a.id}, '${a.titre.replace(/'/g, "\\'")}')">💬 Message</button>`}
            <button class="btn-action call" onclick="window.location.href='tel:${a.telephone}'">📞 Appeler</button>
          </div>
        </div>
      </div>`;
  });
}

async function ouvrirMessagerieDirecteInstantane(annonceId, titreAnnonce) {
  if(!localStorage.getItem("nia_user_id")) return ouvrirSecuriseAuth(false);
  const text = prompt(`Saisir votre message pour : "${titreAnnonce}"`);
  if(!text || !text.trim()) return;

  await fetch(`${API}/chat/send`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, expediteur_id: localStorage.getItem("nia_user_id"), contenu: nettoyerChaineAntiXSS(text) })
  });
  alert("Message transmis avec succès !");
}

async function chargerConversationsPrivees() {
  const uid = localStorage.getItem("nia_user_id"); if(!uid) return;
  const res = await fetch(`${API}/chat/conversations/${uid}`);
  const data = await res.json();
  const box = document.getElementById("chat-conversations-list");
  if(data.length === 0) { box.innerHTML = "Aucun message reçu."; return; }

  box.innerHTML = data.map(c => {
    const estAdmin = c.provenance_contexte === "alerte_admin";
    const estNoReply = c.provenance_contexte === "global_noreply";
    return `
    <div style="background:${estAdmin || estNoReply ? '#fff5f5' : 'white'}; padding:8px; border-radius:6px; border:1px solid ${estAdmin || estNoReply ? 'red' : 'var(--border)'}; font-size:0.85rem; margin-bottom:6px;">
      <div style="font-weight:bold; color:${estAdmin || estNoReply ? 'red' : 'var(--primary)'};">
        ${estNoReply ? '📢 ANNONCE GÉNÉRALE' : estAdmin ? '🚨 ALERTE OFFICIELLE (Réponse requise)' : `Sujet : ${c.annonce_titre || 'Général'}`}
      </div>
      <div style="color:var(--text-light); font-size:0.75rem;">De : ${c.expediteur_nup} ➔ À : ${c.destinataire_nup}</div>
      <div style="background:#f1f5f9; padding:6px; border-radius:4px; font-style:italic; margin-top:4px;">"${c.contenu}"</div>
      
      ${estNoReply ? `<div style="color:var(--danger); font-size:0.75rem; margin-top:4px; font-weight:bold;">🚫 Réponse impossible.</div>` : 
        c.reponse_utilisateur ? `<div style="color:var(--success); font-weight:bold; margin-top:4px;">✓ Justification transmise : "${c.reponse_utilisateur}"</div>` : 
        estAdmin ? `<div style="margin-top:6px; display:flex; gap:4px;"><input id="justif-reply-to-${c.id}" placeholder="Écrire votre justification..." style="flex:1; padding:4px;"><button class="btn-auth" style="font-size:0.75rem; padding:4px 8px; width:auto;" onclick="soumettreJustificationVersAdmin(${c.id})">Envoyer</button></div>` : ''}
    </div>`;
  }).join("");
}

async function soumettreJustificationVersAdmin(msgId) {
  const text = document.getElementById(`justif-reply-to-${msgId}`).value.trim(); if(!text) return;
  await fetch(`${API}/chat/reply-justification/${msgId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reponse: nettoyerChaineAntiXSS(text) })
  });
  alert("Votre justification a été consignée."); chargerConversationsPrivees();
}

async function signalerAnnonce(id) {
  const raison = prompt("Motif précis du signalement :"); if(!raison) return;
  await fetch(`${API}/annonces/${id}/signaler`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raison: nettoyerChaineAntiXSS(raison) })
  });
  alert("Signalement enregistré.");
}

function basculerOngletProfil(mode) {
  ONGLET_PROFIL_ACTIF = mode;
  document.getElementById("btn-tab-std").className = mode === "standard" ? "btn-auth" : "btn-auth sec";
  document.getElementById("btn-tab-vip").className = mode === "vip" ? "btn-auth" : "btn-auth sec";
  
  const currentUserId = localStorage.getItem("nia_user_id");
  const listDiv = document.getElementById("profil-annonces-list"); listDiv.innerHTML = "";
  
  let userList = toutesLesAnnonces.filter(a => a.user_id == currentUserId && a.is_vip === (mode === "vip"));
  if(userList.length === 0) { listDiv.innerHTML = "<p style='color:gray; text-align:center; padding:10px;'>Aucune publication.</p>"; return; }

  listDiv.innerHTML = userList.map(a => `
    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:8px;">
      <div style="font-weight:bold; font-size:0.9rem;">${a.titre} - ${a.prix} ${a.devise} [${a.statut === 'occupe' ? '🔴 Épuisé' : '🟢 Disponible'}]</div>
      <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:8px; padding-top:6px; border-top:1px dashed var(--border);">
        <button class="btn-auth" style="background:orange; font-size:0.75rem; padding:4px 8px; width:auto;" onclick="executerProcessusInterstitielBoost(${a.id})">🚀 Booster</button>
        <button class="btn-auth sec" style="font-size:0.75rem; padding:4px 8px; width:auto;" onclick='ouvrirFenetreModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})'>✏️ Modifier</button>
        <button class="btn-auth" style="background:var(--danger); font-size:0.75rem; padding:4px 8px; width:auto;" onclick="supprimerAnnonceProfil(${a.id})">🗑️ Supprimer</button>
      </div>
    </div>`).join("");
}

function executerProcessusInterstitielBoost(id) {
  const m = document.getElementById("modal-adsense-interstitiel"); m.style.display = "flex";
  setTimeout(async () => {
    m.style.display = "none";
    await fetch(`${API}/annonces/${id}/boost`, { method: "POST" });
    alert("Annonce propulsée en tête de liste !"); fermerModal("profil"); chargerFluxPrincipal();
  }, 2500);
}

function ouvrirFenetreModificationAnnonce(a) {
  document.getElementById("edit-id").value = a.id;
  document.getElementById("edit-titre").value = a.titre;
  document.getElementById("edit-prix").value = a.prix;
  document.getElementById("edit-devise").value = a.devise;
  document.getElementById("edit-periode").value = a.periode;
  document.getElementById("edit-statut").value = a.statut;
  document.getElementById("edit-telephone").value = a.telephone;
  document.getElementById("edit-description").value = a.description || "";

  const container = document.getElementById("edit-photos-container"); container.innerHTML = "";
  if (a.images && a.images.length > 0) {
    a.images.forEach(img => {
      container.innerHTML += `
        <div class="photo-edit-preview" id="photo-block-${img.id}">
          <img src="${img.url}">
          <div class="photo-delete-overlay" onclick="supprimerPhotoEnDirect(${img.id})">✕</div>
        </div>`;
    });
  } else { container.innerHTML = "<span style='color:gray; font-size:0.8rem;'>Aucune photo.</span>"; }
  ouvrirModal("modifier");
}

async function supprimerPhotoEnDirect(photoId) {
  if (confirm("Supprimer définitivement cette photo ?")) {
    await fetch(`${API}/images/${photoId}`, { method: "DELETE" });
    const block = document.getElementById(`photo-block-${photoId}`);
    if (block) block.remove();
  }
}

async function sauvegarderChangementsAnnonce() {
  const id = document.getElementById("edit-id").value;
  const titre = nettoyerChaineAntiXSS(document.getElementById("edit-titre").value);
  const description = nettoyerChaineAntiXSS(document.getElementById("edit-description").value);

  if (!verifierFiltreStrictImmobilierEtContenusIllegaux(titre, description)) return;

  const files = document.getElementById("edit-new-photos").files;
  let nouvelles_images_base64 = [];
  for(let i=0; i<files.length; i++) { nouvelles_images_base64.push(await traiterFichierEnBase64(files[i])); }

  await fetch(`${API}/annonces/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre, prix: document.getElementById("edit-prix").value,
      devise: document.getElementById("edit-devise").value, periode: document.getElementById("edit-periode").value,
      statut: document.getElementById("edit-statut").value, telephone: nettoyerChaineAntiXSS(document.getElementById("edit-telephone").value),
      description, ville: "Lubumbashi", nouvelles_images_base64
    })
  });
  fermerModal("modifier"); fermerModal("profil"); chargerFluxPrincipal();
}

function rafraichirVueVipFormulaire() {
  const s = document.getElementById("vip-setup-zone");
  s.innerHTML = `
    <div id="vip-multi-blocks" style="display:flex; flex-direction:column; gap:12px;"></div>
    <button class="btn-auth sec" style="width:100%; margin-top:10px;" onclick="ajouterBlocObjetAuCatalogueVip()">➕ Ajouter un produit/service VIP</button>
    <button class="btn-auth" style="width:100%; margin-top:6px; background:var(--vip-gold); color:black;" onclick="sauvegarderEtPublierToutLeCatalogueVip()">Publier tout le Catalogue VIP 🚀</button>`;
  BLOCS_VIP_COMPTEUR = 0; ajouterBlocObjetAuCatalogueVip();
}

function ajouterBlocObjetAuCatalogueVip() {
  BLOCS_VIP_COMPTEUR++;
  const container = document.getElementById("vip-multi-blocks");
  const row = document.createElement("div");
  row.className = "vip-pure-block"; row.id = `vip-b-${BLOCS_VIP_COMPTEUR}`;
  row.style = "background:#f8fafc; border:2px dashed var(--vip-gold); padding:12px; border-radius:8px; display:flex; flex-direction:column; gap:8px;";
  row.innerHTML = `
    <div style="font-weight:bold; font-size:0.8rem; color:var(--vip-gold)">PRODUIT VIP BLOC #${BLOCS_VIP_COMPTEUR}</div>
    <input class="vip-in-titre" placeholder="Nom du produit ou service VIP *">
    <div style="display:flex; gap:4px;">
      <input class="vip-in-prix" type="number" placeholder="Prix" style="flex:2;">
      <select class="vip-in-devise" style="flex:1;"><option value="$">$</option><option value="FC">FC</option></select>
      <select class="vip-in-periode" style="flex:1.5;"><option value="total">/ Total</option><option value="jour">/ Jour</option></select>
    </div>
    <div style="display:flex; gap:4px;">
      <input class="vip-in-ville" placeholder="Ville" value="Lubumbashi">
      <input class="vip-in-commune" placeholder="Commune">
    </div>
    <select class="vip-in-statut"><option value="disponible">🟢 En Stock / Disponible</option><option value="occupe">🔴 Indisponible</option></select>
    <textarea class="vip-in-desc" placeholder="Détails descriptifs (Exclusion totale de l'immobilier)..." rows="2"></textarea>
    <input type="file" class="vip-in-photos" multiple accept="image/*" style="font-size:0.8rem;">`;
  container.appendChild(row);
}

async function sauvegarderEtPublierToutLeCatalogueVip() {
  const nodes = document.querySelectorAll(".vip-pure-block");
  for(let n of nodes) {
    const titre = n.querySelector(".vip-in-titre").value.trim();
    const description = n.querySelector(".vip-in-desc").value.trim();
    const ville = n.querySelector(".vip-in-ville").value.trim() || "Lubumbashi";
    const commune = n.querySelector(".vip-in-commune").value.trim();

    if(!titre) continue;
    if (!verifierFiltreStrictImmobilierEtContenusIllegaux(titre, description)) return;

    const fileInput = n.querySelector(".vip-in-photos");
    let images_base64 = [];
    if(fileInput && fileInput.files.length > 0) {
      for(let i=0; i<fileInput.files.length; i++) {
        images_base64.push(await traiterFichierEnBase64(fileInput.files[i]));
      }
    }

    await fetch(`${API}/annonces`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: localStorage.getItem("nia_user_id"), titre, prix: n.querySelector(".vip-in-prix").value || 0,
        devise: n.querySelector(".vip-in-devise").value, periode: n.querySelector(".vip-in-periode").value,
        statut: n.querySelector(".vip-in-statut").value, telephone: localStorage.getItem("nia_user_tel"),
        description, ville, commune, is_vip: true, images_base64
      })
    });
  }
  fermerModal("vip"); chargerFluxPrincipal();
}

function filtrerFluxAdminEnTempsReel() {
  const villeSaisie = document.getElementById("admin-filter-ville").value.toLowerCase();
  const formatSaisie = document.getElementById("admin-filter-type").value;

  const filtreTotal = toutesLesAnnonces.filter(a => {
    const correspondVille = villeSaisie === "" || (a.ville && a.ville.toLowerCase().includes(villeSaisie));
    let correspondFormat = true;
    if(formatSaisie === "standard") correspondFormat = (!a.is_vip);
    if(formatSaisie === "vip") correspondFormat = (a.is_vip === true);
    return correspondVille && correspondFormat;
  });

  injecterDonniesHtmlAdmin(filtreTotal);
}

function injecterDonniesHtmlAdmin(liste) {
  const box = document.getElementById("admin-main-render-box");
  if(liste.length === 0) { box.innerHTML = "<p style='color:gray; padding:10px;'>Aucune offre trouvée.</p>"; return; }
  
  box.innerHTML = liste.map(a => `
    <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:4px; border-left:3px solid ${a.is_vip ? 'var(--vip-gold)' : '#64748b'}">
      <span style="color:#38bdf8; font-weight:bold;">[${a.proprietaire_nup || 'SANS NUP'}]</span> <b>${a.titre}</b>
      <span style="font-size:0.7rem; background:#334155; padding:2px 4px; border-radius:3px; color:#cbd5e1; margin-left:6px;">📍 ${a.ville}</span>
      <div style="display:flex; gap:4px; margin-top:4px;">
        <input id="adm-input-${a.id}" placeholder="Avertissement privé..." style="flex:1; color:black; padding:4px; border-radius:4px; border:none; font-size:0.8rem;">
        <button onclick="envoyerMessageDepuisAdminAuNup(${a.id}, 'alerte_admin')" style="background:var(--success); color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem;">Avertir</button>
        <button onclick="supprimerAnnonceParAdmin(${a.id})" style="background:var(--danger); color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem;">🗑️ Supprimer</button>
      </div>
    </div>`).join("");
}

async function definirVueAdmin(mode) {
  VUE_ADMIN_ACTIVE = mode; 
  const box = document.getElementById("admin-main-render-box"); 
  box.innerHTML = "Chargement...";
  
  document.getElementById("admin-filters-bar").style.display = (mode === "flux") ? "flex" : "none";
  
  if(mode === "flux") {
    filtrerFluxAdminEnTempsReel();
  }
  else if(mode === "messages") {
    const res = await fetch(`${API}/admin/all-messages`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "Aucun échange privé."; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:4px;">
        <span style="color:#eab308;"><b>De :</b> ${m.expediteur_nup} ➔ <b>À :</b> ${m.destinataire_nup}</span>
        <div style="margin:4px 0; color:#cbd5e1; font-style:italic;">"${m.contenu}"</div>
        <button onclick="supprimerMessageParAdminDefinitif(${m.id})" style="background:var(--danger); color:white; border:none; padding:2px 6px; font-size:0.75rem; border-radius:4px; cursor:pointer;">🗑️ Supprimer</button>
      </div>`).join("");
  }
  else if(mode === "justifications") {
    const res = await fetch(`${API}/admin/all-justifications/signale`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "Aucun signalement."; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:10px; border-radius:6px; font-size:0.85rem; margin-bottom:6px; border-left:4px solid var(--danger);">
        <div style="display:flex; justify-content:between; font-weight:bold; color:#f87171;">
          <span>🚨 ALERTES COMPTE [${m.user_nup || 'NUP'}]</span>
          <button onclick="supprimerJustificationParAdmin(${m.id})" style="background:none; border:none; color:#94a3b8; cursor:pointer;">🗑️ Effacer</button>
        </div>
        <div style="background:#0f172a; padding:6px; border-radius:4px; margin:4px 0; color:#cbd5e1;">
          <b>Plainte initiale :</b> "${m.contexte_alerte}"
        </div>
        <div style="background:#022c22; padding:6px; border-radius:4px; color:#4ade80; font-weight:bold;">
          <b>↩️ Justification :</b> ${m.reponse_utilisateur ? `"${m.reponse_utilisateur}"` : `<span style='color:orange; font-weight:normal;'>En attente...</span>`}
        </div>
      </div>`).join("");
  }
}

async function supprimerMessageParAdminDefinitif(msgId) {
  if (confirm("Supprimer ce message ?")) {
     await fetch(`${API}/admin/messages/${msgId}/delete`, { method: "DELETE" });
     definirVueAdmin("messages");
  }
}

async function supprimerJustificationParAdmin(id) {
  if (confirm("Effacer cette fiche ?")) {
    await fetch(`${API}/admin/justifications/${id}/delete`, { method: "DELETE" });
    definirVueAdmin("justifications");
  }
}

async function envoyerNotificationGlobaleAdmin() {
  const input = document.getElementById("admin-global-msg-input");
  const contenu = input.value.trim();
  if(!contents) return alert("Texte vide.");
  
  await fetch(`${API}/admin/send-global`, {
     method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contenu: nettoyerChaineAntiXSS(contenu) })
  });
  alert("Message global diffusé !");
  input.value = "";
  definirVueAdmin(VUE_ADMIN_ACTIVE);
}

async function envoyerMessageDepuisAdminAuNup(annonceId, ctx) {
  const msg = document.getElementById(`adm-input-${annonceId}`).value.trim(); if(!msg) return;
  await fetch(`${API}/admin/send-to-nup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, contenu: nettoyerChaineAntiXSS(msg), provenance_contexte: ctx })
  });
  alert("Avertissement envoyé.");
  document.getElementById(`adm-input-${annonceId}`).value = "";
  definirVueAdmin(VUE_ADMIN_ACTIVE);
}

async function supprimerAnnonceParAdmin(id) { 
  if(confirm("Confirmer la suppression ?")) { 
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); chargerFluxPrincipal(); 
    setTimeout(() => definirVueAdmin(VUE_ADMIN_ACTIVE), 400); 
  } 
}

async function supprimerAnnonceProfil(id) { 
  if(confirm("Supprimer cette annonce définitivement ?")) { 
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); chargerFluxPrincipal(); 
    setTimeout(() => basculerOngletProfil(ONGLET_PROFIL_ACTIF), 400); 
  } 
}

function detecterClicLongAdmin() { validationAdminOk = false; topAdminTimer = setTimeout(() => { validationAdminOk = true; }, 4000); }
function annulerClicLongAdmin() {
  clearTimeout(topAdminTimer);
  if(validationAdminOk) {
    if (prompt("Entrez le code d'accès administrateur :") === "BEN4002ET4200") { ouvrirModal("admin"); definirVueAdmin("flux"); }
  }
}

function executerRecherche() {
  const kw = document.getElementById("search-keyword").value.toLowerCase();
  let matches = toutesLesAnnonces.filter(a => kw === "" || a.titre.toLowerCase().includes(kw));
  rendreFluxHtml(matches); fermerModal("rechercher");
}
function reinitialiserFluxGeneral() { rendreFluxHtml(toutesLesAnnonces); }

document.addEventListener("DOMContentLoaded", () => { 
  executerSecurisationEtMiseAJourAutomatique();
  rafraichirHeaderVisuel(); 
  chargerFluxPrincipal(); 
});
