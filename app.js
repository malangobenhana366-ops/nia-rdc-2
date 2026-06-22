const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let VUE_ADMIN_ACTIVE = "flux";
let ONGLET_PROFIL_ACTIF = "standard";
let BLOCS_VIP_COMPTEUR = 0;
let topAdminTimer = null;
let validationAdminOk = false;

// ================= MISSION 3: INTEGRATION COMPLÈTE DES CONTENUS EXACTS =================
const TEXTES_DU_DROIT = {
  securite: `POLITIQUE DE SÉCURITÉ AND CONDITIONS GÉNÉRALES D'UTILISATION (CGU) - NIA RDC

1. ACCEPTATION DES CONDITIONS
En créant un compte sur l'application NIA RDC, vous acceptez expressément d'être soumis aux présentes règles de sécurité.

2. NUMÉRO DE PROFIL UNIQUE (NUP)
Chaque utilisateur se voit attribuer automatiquement un Identifiant Unique de Profil (NUP).

[FIN DU DOCUMENT - DEFILEZ ENTIEREMENT POUR VALIDER]`,

  apropos: `À propos de NIA RDC

Bienvenue sur NIA RDC.

NIA RDC est une plateforme numérique conçue pour faciliter la mise en relation entre les personnes souhaitant louer, proposer ou rechercher des biens et des services en République Démocratique du Congo.

Notre objectif est de rendre les échanges plus simples, rapides et accessibles grâce à une plateforme facile à utiliser, adaptée aussi bien aux particuliers qu'aux professionnels.

Notre mission

Notre mission est de permettre à chacun de trouver ou de proposer des objets, équipements et services en toute simplicité, tout en favorisant les opportunités économiques locales.

Ce que propose NIA RDC

Les utilisateurs peuvent notamment :
- publier des annonces ;
- consulter les annonces disponibles ;
- contacter les annonceurs ;
- rechercher des biens et services selon leurs besoins.

La plateforme évolue régulièrement afin d'offrir de nouvelles fonctionnalités et une meilleure expérience utilisateur.

Nos valeurs

NIA RDC s'appuie sur plusieurs principes :
- simplicité ;
- accessibilité ;
- respect des utilisateurs ;
- innovation ;
- amélioration continue.

Notre engagement

Nous travaillons à maintenir une plateforme fiable et agréable à utiliser. Nous encourageons les utilisateurs à publier des informations exactes et à respecter les règles de la communauté.

Notre vision

Nous souhaitons contribuer au développement des échanges et des services numériques en République Démocratique du Congo en proposant une plateforme moderne et évolutive.

Contact

Pour toute question ou suggestion, les utilisateurs peuvent contacter l'équipe de NIA RDC par les moyens de communication disponibles sur la plateforme.

Merci de votre confiance et de votre participation au développement de NIA RDC.`,

  confidentialite: `Politique de confidentialité de NIA RDC

Dernière mise à jour : Juin 2026.

Bienvenue sur NIA RDC.

La protection des informations personnelles de nos utilisateurs est importante. Cette politique explique quelles informations sont collectées, pourquoi elles sont utilisées et les droits des utilisateurs.

1. Informations collectées
Lors de l'utilisation de NIA RDC, certaines informations peuvent être collectées, notamment :
- le numéro de téléphone fourni lors de l'inscription ;
- le mot de passe du compte, protégé par des mesures de sécurité ;
- les annonces publiées ;
- les photos et images ajoutées aux annonces ;
- les informations de contact renseignées dans les annonces ;
- les informations techniques nécessaires au fonctionnement de la plateforme.

2. Utilisation des informations
Les informations collectées servent à :
- créer et gérer les comptes utilisateurs ;
- publier et afficher les annonces ;
- améliorer les services proposés ;
- assurer la sécurité de la plateforme ;
- prévenir les activités frauduleuses ;
- répondre aux demandes des utilisateurs.

3. Partage des informations
NIA RDC ne vend pas les informations personnelles des utilisateurs.
Certaines informations publiées volontairement dans les annonces, comme les photos ou les numéros de contact, peuvent être visibles par les autres utilisateurs de la plateforme.
Les informations pourront être communiquées si la loi l'exige ou pour protéger les droits et la sécurité de NIA RDC et de ses utilisateurs.

4. Conservation des données
Les informations sont conservées aussi longtemps que nécessaire au fonctionnement de la plateforme et au respect des obligations légales.

5. Sécurité
NIA RDC met en œuvre des mesures raisonnables pour protéger les informations des utilisateurs contre les accès non autorisés, les pertes ou les utilisations abusives.
Toutefois, aucune technologie ne peut garantir une sécurité absolue sur Internet.

6. Cookies et technologies similaires
NIA RDC peut utiliser des cookies et des technologies similaires afin d'améliorer l'expérience utilisateur, de mesurer les performances du service et d'afficher des contenus ou publicités adaptés.

7. Publicités
NIA RDC peut afficher des annonces publicitaires afin de financer le fonctionnement de la plateforme.
Des partenaires publicitaires peuvent utiliser des technologies conformes à leurs propres politiques de confidentialité et aux lois applicables.

8. Droits des utilisateurs
Chaque utilisateur peut demander, dans les limites prévues par la loi :
- l'accès à ses informations ;
- la correction d'informations inexactes ;
- la suppression de certaines données ;
- la fermeture de son compte.

9. Modifications
Cette politique de confidentialité peut être mise à jour afin de suivre les évolutions de la plateforme ou des exigences légales.
Les modifications prendront effet dès leur publication sur NIA RDC.

10. Contact
Pour toute question concernant cette politique de confidentialité ou le traitement des données personnelles, les utilisateurs peuvent contacter l'équipe de NIA RDC par les moyens de communication mis à disposition sur la plateforme.

Acceptation
En utilisant NIA RDC et en créant un compte, l'utilisateur reconnaît avoir pris connaissance de la présente Politique de confidentialité et accepte les conditions qui y sont décrites.`
};

function brancherEvenementScrollControle() {
  const box = document.getElementById("cgu-scroller-node");
  if (!box) return;
  const chk = document.getElementById("chk-accept-rules");
  const btnReg = document.getElementById("btn-register-action");
  box.addEventListener("scroll", () => {
    if (box.scrollHeight - box.scrollTop <= box.clientHeight + 15) {
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
    setTimeout(brancherEvenementScrollControle, 200);
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
  const telephone = document.getElementById("reg-tel").value.trim();
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
  const telephone = document.getElementById("log-tel").value.trim();
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
  if (confirm("⚠️ Définitivement supprimer votre compte ?")) {
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
  const files = document.getElementById("photos-input").files;
  let images_base64 = [];
  for(let i=0; i<files.length; i++) { images_base64.push(await traiterFichierEnBase64(files[i])); }

  await fetch(`${API}/annonces`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"), 
      titre: document.getElementById("titre").value.trim(), 
      prix: document.getElementById("prix").value.trim(), 
      devise: document.getElementById("devise").value, 
      periode: document.getElementById("periode").value, 
      statut: document.getElementById("statut").value, 
      telephone: document.getElementById("telephone").value.trim(), 
      description: document.getElementById("description").value.trim(), 
      ville: document.getElementById("ville").value.trim(), 
      commune: document.getElementById("commune").value.trim(), 
      quartier: "", is_vip: false, images_base64
    })
  });
  fermerModal("publier"); chargerFluxPrincipal();
}

async function chargerFluxPrincipal() {
  try {
    const res = await fetch(`${API}/feed`); toutesLesAnnonces = await res.json();
    rendreFluxHtml(toutesLesAnnonces);
  } catch(e) { document.getElementById("feed").innerHTML = "Vérification réseau..."; }
}

function rendreFluxHtml(liste) {
  const container = document.getElementById("feed"); container.innerHTML = "";
  if(liste.length === 0) { container.innerHTML = "<p style='text-align:center;'>Aucune offre disponible.</p>"; return; }

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
          <span class="${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}</span>
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
  const text = prompt(`Votre message privé pour : "${titreAnnonce}"`);
  if(!text || !text.trim()) return;

  await fetch(`${API}/chat/send`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, expediteur_id: localStorage.getItem("nia_user_id"), contenu: text })
  });
  alert("Message transmis !");
}

// MISSION 1: EMPECHER LE BOUTON DE RÉPONSE SI LE CONTEXTE EST 'global_noreply'
async function chargerConversationsPrivees() {
  const uid = localStorage.getItem("nia_user_id"); if(!uid) return;
  const res = await fetch(`${API}/chat/conversations/${uid}`);
  const data = await res.json();
  const box = document.getElementById("chat-conversations-list");
  if(data.length === 0) { box.innerHTML = "Aucun message en cours."; return; }

  box.innerHTML = data.map(c => {
    const estAdmin = c.expediteur_nup === "NUP-ADMIN";
    const estNoReply = c.provenance_contexte === "global_noreply";
    return `
    <div style="background:${estAdmin ? '#fff5f5' : 'white'}; padding:8px; border-radius:6px; border:1px solid ${estAdmin ? 'red' : 'var(--border)'}; font-size:0.85rem;">
      <div style="font-weight:bold; color:${estAdmin ? 'red' : 'var(--primary)'};">
        ${estNoReply ? '📢 ANNONCE GÉNÉRALE DE L\'ADMINISTRATION' : estAdmin ? '🚨 ALERTE OFFICIELLE' : `Sujet : ${c.annonce_titre || 'Général'}`}
      </div>
      <div style="color:var(--text-light); font-size:0.75rem;">De : ${c.expediteur_nup} ➔ À : ${c.destinataire_nup}</div>
      <div style="background:#f1f5f9; padding:6px; border-radius:4px; font-style:italic; margin-top:4px;">"${c.contenu}"</div>
      
      ${estNoReply ? `<div style="color:var(--danger); font-size:0.75rem; margin-top:4px; font-weight:bold;">🚫 Il est impossible de répondre à ce message global.</div>` : 
        c.reponse_utilisateur ? `<div style="color:var(--success); font-weight:bold; margin-top:4px;">✓ Justification envoyée : "${c.reponse_utilisateur}"</div>` : 
        estAdmin ? `<div style="margin-top:6px; display:flex; gap:4px;"><input id="justif-reply-to-${c.id}" placeholder="Entrez votre justification..." style="flex:1; padding:4px;"><button class="btn-auth" style="font-size:0.75rem; padding:4px;" onclick="soumettreJustificationVersAdmin(${c.id})">Répondre</button></div>` : ''}
    </div>`;
  }).join("");
}

async function soumettreJustificationVersAdmin(msgId) {
  const text = document.getElementById(`justif-reply-to-${msgId}`).value.trim(); if(!text) return;
  await fetch(`${API}/chat/reply-justification/${msgId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reponse: text })
  });
  alert("Justification enregistrée !"); chargerConversationsPrivees();
}

async function signalerAnnonce(id) {
  const raison = prompt("Indiquez le motif du signalement :"); if(!raison) return;
  await fetch(`${API}/annonces/${id}/signaler`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raison })
  });
  alert("Signalement envoyé.");
}

function basculerOngletProfil(mode) {
  ONGLET_PROFIL_ACTIF = mode;
  document.getElementById("btn-tab-std").className = mode === "standard" ? "btn-auth" : "btn-auth sec";
  document.getElementById("btn-tab-vip").className = mode === "vip" ? "btn-auth" : "btn-auth sec";
  
  const currentUserId = localStorage.getItem("nia_user_id");
  const listDiv = document.getElementById("profil-annonces-list"); listDiv.innerHTML = "";
  
  let userList = toutesLesAnnonces.filter(a => a.user_id == currentUserId && a.is_vip === (mode === "vip"));
  if(userList.length === 0) { listDiv.innerHTML = "<p style='color:gray; text-align:center;'>Aucun bien publié.</p>"; return; }

  listDiv.innerHTML = userList.map(a => `
    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:8px;">
      <div style="font-weight:bold; font-size:0.9rem;">${a.titre} - ${a.prix} ${a.devise} [${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}]</div>
      <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:8px; padding-top:6px; border-top:1px dashed var(--border);">
        <button class="btn-auth" style="background:orange; font-size:0.75rem; padding:4px 8px;" onclick="executerProcessusInterstitielBoost(${a.id})">🚀 Booster</button>
        <button class="btn-auth sec" style="font-size:0.75rem; padding:4px 8px;" onclick='ouvrirFenetreModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})'>✏️ Modifier</button>
        <button class="btn-auth" style="background:var(--danger); font-size:0.75rem; padding:4px 8px;" onclick="supprimerAnnonceProfil(${a.id})">🗑️ Supprimer</button>
      </div>
    </div>`).join("");
}

function executerProcessusInterstitielBoost(id) {
  const m = document.getElementById("modal-adsense-interstitiel"); m.style.display = "flex";
  setTimeout(async () => {
    m.style.display = "none";
    await fetch(`${API}/annonces/${id}/boost`, { method: "POST" });
    alert("Annonce boostée !"); fermerModal("profil"); chargerFluxPrincipal();
  }, 2500);
}

// MISSION 2: CHARGEMENT DES ANCIENNES PHOTOS ET OPTIONS DE SUPPRESSION DEPUIS LE PROFIL
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
  } else { container.innerHTML = "<span style='color:gray; font-size:0.8rem;'>Aucune photo pour ce bien.</span>"; }
  ouvrirModal("modifier");
}

async function supprimerPhotoEnDirect(photoId) {
  if (confirm("Supprimer définitivement cette photo de la galerie ?")) {
    await fetch(`${API}/images/${photoId}`, { method: "DELETE" });
    const block = document.getElementById(`photo-block-${photoId}`);
    if (block) block.remove();
  }
}

// MISSION 2: TOUTES LES MODIFICATIONS PRENNENT IMMÉDIATEMENT EFFET SUR VIP ET STANDARD APRÈS SAUVEGARDE
async function sauvegarderChangementsAnnonce() {
  const id = document.getElementById("edit-id").value;
  const files = document.getElementById("edit-new-photos").files;
  
  let nouvelles_images_base64 = [];
  for(let i=0; i<files.length; i++) { nouvelles_images_base64.push(await traiterFichierEnBase64(files[i])); }

  await fetch(`${API}/annonces/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: document.getElementById("edit-titre").value, 
      prix: document.getElementById("edit-prix").value,
      devise: document.getElementById("edit-devise").value, 
      periode: document.getElementById("edit-periode").value,
      statut: document.getElementById("edit-statut").value, 
      telephone: document.getElementById("edit-telephone").value,
      description: document.getElementById("edit-description").value, 
      ville: "Lubumbashi", nouvelles_images_base64
    })
  });
  fermerModal("modifier"); fermerModal("profil"); chargerFluxPrincipal();
}

function rafraichirVueVipFormulaire() {
  const s = document.getElementById("vip-setup-zone");
  s.innerHTML = `
    <div id="vip-multi-blocks" style="display:flex; flex-direction:column; gap:12px;"></div>
    <button class="btn-auth sec" style="width:100%; margin-top:10px;" onclick="ajouterBlocObjetAuCatalogueVip()">➕ Ajouter un logement VIP</button>
    <button class="btn-auth" style="width:100%; margin-top:6px; background:var(--vip-gold);" onclick="sauvegarderEtPublierToutLeCatalogueVip()">Publier la Vitrine VIP 🚀</button>`;
  BLOCS_VIP_COMPTEUR = 0; ajouterBlocObjetAuCatalogueVip();
}

function ajouterBlocObjetAuCatalogueVip() {
  BLOCS_VIP_COMPTEUR++;
  const container = document.getElementById("vip-multi-blocks");
  const row = document.createElement("div");
  row.className = "vip-pure-block"; row.id = `vip-b-${BLOCS_VIP_COMPTEUR}`;
  row.style = "background:#f8fafc; border:2px dashed var(--vip-gold); padding:12px; border-radius:8px; display:flex; flex-direction:column; gap:8px;";
  row.innerHTML = `
    <input class="vip-in-titre" placeholder="Titre du logement VIP *">
    <input class="vip-in-prix" type="number" placeholder="Prix ($)">
    <select class="vip-in-periode"><option value="jour">/ Jour</option><option value="heure">/ Heure</option></select>
    <select class="vip-in-statut"><option value="disponible">🟢 Disponible</option><option value="occupe">🔴 Occupé</option></select>
    <textarea class="vip-in-desc" placeholder="Description..." rows="2"></textarea>`;
  container.appendChild(row);
}

async function sauvegarderEtPublierToutLeCatalogueVip() {
  const nodes = document.querySelectorAll(".vip-pure-block");
  for(let n of nodes) {
    const titre = n.querySelector(".vip-in-titre").value.trim(); if(!titre) continue;
    await fetch(`${API}/annonces`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: localStorage.getItem("nia_user_id"), titre, prix: n.querySelector(".vip-in-prix").value,
        devise:"$", periode: n.querySelector(".vip-in-periode").value, statut: n.querySelector(".vip-in-statut").value,
        telephone: localStorage.getItem("nia_user_tel"), description: n.querySelector(".vip-in-desc").value, ville:"Lubumbashi", is_vip: true, images_base64: []
      })
    });
  }
  fermerModal("vip"); chargerFluxPrincipal();
}

// ================= MISSION 1: SUPERVISION ET SUPPRESSION SUPRÊME DES MESSAGES VIA L'ADMINISTRATION =================
async function definirVueAdmin(mode) {
  VUE_ADMIN_ACTIVE = mode; const box = document.getElementById("admin-main-render-box"); box.innerHTML = "Chargement...";
  
  if(mode === "flux") {
    box.innerHTML = toutesLesAnnonces.map(a => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:4px;">
        <span style="color:#38bdf8; font-weight:bold;">[${a.proprietaire_nup || 'SANS NUP'}]</span> <b>${a.titre}</b>
        <div style="display:flex; gap:4px; margin-top:4px;">
          <input id="adm-input-${a.id}" placeholder="Message privé à ce NUP..." style="flex:1; color:black; padding:4px; border-radius:4px; border:none;">
          <button onclick="envoyerMessageDepuisAdminAuNup(${a.id}, 'normal')" style="background:var(--success); color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Contacter</button>
          <button onclick="supprimerAnnonceParAdmin(${a.id})" style="background:var(--danger); color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️ Annonce</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "messages") {
    const res = await fetch(`${API}/admin/all-messages`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "Aucun échange enregistré sur le réseau."; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:4px; border-left: 3px solid #60a5fa;">
        <div style="display:flex; justify-content:between; align-items:center; width:100%;">
          <span style="color:#eab308;"><b>De :</b> ${m.expediteur_nup} ➔ <b>À :</b> ${m.destinataire_nup}</span>
        </div>
        <div style="margin:4px 0; color:#cbd5e1; font-style:italic;">"${m.contenu}"</div>
        <button onclick="supprimerMessageParAdminDefinitif(${m.id})" style="background:var(--danger); color:white; border:none; padding:2px 6px; font-size:0.75rem; border-radius:4px; cursor:pointer; margin-top:4px;">🗑️ Supprimer le Message pour tous</button>
      </div>`).join("");
  }
  else if(mode === "justifications") {
    const res = await fetch(`${API}/admin/all-justifications/signale`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "Aucune justification active."; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:4px;">
        <div style="color:#94a3b8;"><b>Raison de l'alerte :</b> ${m.contenu}</div>
        <div style="color:#4ade80; margin-top:4px; font-weight:bold;"><b>↩️ Réponse [${m.user_nup}] :</b> "${m.reponse_utilisateur}"</div>
      </div>`).join("");
  }
}

// MISSION 1: ACTION SUPPRESSION TOTALE MESSAGE RECOUVREMENT
async function supprimerMessageParAdminDefinitif(msgId) {
  if (confirm("Voulez-vous supprimer ce message ? Il disparaîtra définitivement chez l'expéditeur et le destinataire.")) {
     await fetch(`${API}/admin/messages/${msgId}/delete`, { method: "DELETE" });
     definirVueAdmin("messages");
  }
}

// MISSION 1: DIFFUSION GENERALE EN UNE SEULE FOIS SANS CONFIGURATION DE CONVERSATION UNIQUE
async function envoyerNotificationGlobaleAdmin() {
  const input = document.getElementById("admin-global-msg-input");
  const contenu = input.value.trim();
  if(!contenu) return alert("Veuillez saisir un texte à envoyer.");
  
  await fetch(`${API}/admin/send-global`, {
     method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contenu })
  });
  alert("Message global envoyé avec succès à l'ensemble des utilisateurs de NIA RDC !");
  input.value = "";
  definirVueAdmin(VUE_ADMIN_ACTIVE);
}

async function envoyerMessageDepuisAdminAuNup(annonceId, ctx) {
  const msg = document.getElementById(`adm-input-${annonceId}`).value.trim(); if(!msg) return;
  await fetch(`${API}/admin/send-to-nup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, contenu: msg, provenance_contexte: ctx })
  });
  alert("Message envoyé !");
  document.getElementById(`adm-input-${annonceId}`).value = "";
  definirVueAdmin(VUE_ADMIN_ACTIVE);
}

async function supprimerAnnonceParAdmin(id) { 
  if(confirm("Supprimer ce bien ?")) { 
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); chargerFluxPrincipal(); 
    setTimeout(() => definirVueAdmin(VUE_ADMIN_ACTIVE), 400); 
  } 
}

function detecterClicLongAdmin() { validationAdminOk = false; topAdminTimer = setTimeout(() => { validationAdminOk = true; }, 4000); }
function annulerClicLongAdmin() {
  clearTimeout(topAdminTimer);
  if(validationAdminOk) {
    if (prompt("Code Admin :") === "BEN4002ET4200") { ouvrirModal("admin"); definirVueAdmin("flux"); }
  }
}

function executerRecherche() {
  const kw = document.getElementById("search-keyword").value.toLowerCase();
  let matches = toutesLesAnnonces.filter(a => kw === "" || a.titre.toLowerCase().includes(kw));
  rendreFluxHtml(matches); fermerModal("rechercher");
}
function reinitialiserFluxGeneral() { rendreFluxHtml(toutesLesAnnonces); }

setInterval(chargerFluxPrincipal, 20000);
document.addEventListener("DOMContentLoaded", () => { rafraichirHeaderVisuel(); chargerFluxPrincipal(); });
