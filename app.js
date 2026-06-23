const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let VUE_ADMIN_ACTIVE = "flux";
let ONGLET_PROFIL_ACTIF = "standard";
let BLOCS_VIP_COMPTEUR = 0;
let topAdminTimer = null;
let validationAdminOk = false;

// ================= 1. TEXTES JURIDIQUES COMPLETS =================
const TEXTES_DU_DROIT = {
  securite: `POLITIQUE DE SÉCURITÉ ET CONDITIONS GÉNÉRALES D'UTILISATION (CGU) - NIA RDC

1. ACCEPTATION DES CONDITIONS
En créant un compte sur l'application NIA RDC, vous acceptez expressément d'être soumis aux présentes règles de sécurité et d'utilisation.

2. NUMÉRO DE PROFIL UNIQUE (NUP)
Chaque utilisateur se voit attribuer automatiquement un Identifiant Unique de Profil (NUP). Cet identifiant permet à l'administration de suivre vos publications (Annonces Standards et VIP) et de vous contacter directement en cas de litige, de signalement ou d'audit de sécurité.

3. SÉCURITÉ DES TRANSACTIONS ET ANTI-FRAUDE
NIA RDC est une plateforme de mise en relation immobilière basée à Lubumbashi, RDC. L'administration décline toute responsabilité en cas de litige financier entre l'acheteur/locataire et le bailleur. Il est formellement interdit de publier des annonces mensongères ou des biens fictifs.

4. SYSTÈME DE SIGNALEMENT ET MODÉRATION
Toute annonce suspecte fera l'objet d'une enquête. Un message officiel de l'administration sera envoyé directement dans l'Espace Privé du profil concerné. L'utilisateur dispose d'un délai pour fournir ses justifications directement depuis son profil sous peine de suppression définitive du compte.

[FIN DU DOCUMENT - DEFILEZ TOUT LE TEXTE POUR ACTIVER VOTRE INSCRIPTION]`,

  apropos: `À PROPOS DE NIA RDC\n\nNIA RDC est la plateforme immobilière de référence en République Démocratique du Congo, spécialement optimisée pour la ville de Lubumbashi.\n\nNotre mission est de simplifier la recherche et la publication de maisons, appartements, studios et espaces commerciaux grâce à un outil rapide, fluide et sécurisé par le système de Numéro de Profil Unique (NUP).`,

  confidentialite: `POLITIQUE DE CONFIDENTIALITÉ\n\n1. COLLECTE DES DONNÉES\nNous collectons uniquement votre numéro de téléphone afin de sécuriser votre accès et de permettre aux clients de vous contacter.\n\n2. SÉCURITÉ DES DONNÉES\nVos mots de passe sont hautement sécurisés et cryptés via un algorithme de hachage (bcrypt) sur nos serveurs.`
};

// ================= 2. GESTION DU SCROLL ET DE L'AUTHENTIFICATION =================
function brancherEvenementScrollControle() {
  const box = document.getElementById("cgu-scroller-node");
  if (!box) return;
  
  const chk = document.getElementById("chk-accept-rules");
  const btnReg = document.getElementById("btn-register-action");
  if(chk) chk.checked = false;
  
  box.addEventListener("scroll", () => {
    if (box.scrollHeight - box.scrollTop <= box.clientHeight + 15) {
      if (chk && chk.hasAttribute("disabled")) {
        chk.removeAttribute("disabled");
        chk.onchange = function() {
          if(this.checked) btnReg.removeAttribute("disabled");
          else btnReg.setAttribute("disabled", "true");
        };
      }
    }
  });
}

// TOGGLE DU MENU DÉROULANT DES PAGES DE SÉCURITÉ
function toggleMenuLegal() {
  const m = document.getElementById("legal-dropdown"); 
  m.style.display = m.style.display === "block" ? "none" : "block";
}

// FERMETURE DU MENU DÉROULANT SI ON CLIQUE AILLEURS
window.onclick = function(event) {
  if (!event.target.matches('.btn-burger')) {
    const dropdown = document.getElementById("legal-dropdown");
    if (dropdown && dropdown.style.display === "block") {
      dropdown.style.display = "none";
    }
  }
}

function afficherDocumentJurisEtSecu(cle) {
  document.getElementById("legal-header-title").textContent = 
    cle === "securite" ? "📜 Sécurité & CGU" : cle === "apropos" ? "ℹ️ À propos" : "🔒 Confidentialité";
    
  document.getElementById("legal-body-content").textContent = TEXTES_DU_DROIT[cle];
  document.getElementById("legal-dropdown").style.display = "none";
  ouvrirModal("legal-display");
}

function rafraichirHeaderVisuel() {
  const isLogged = localStorage.getItem("nia_user_id");
  document.getElementById("header-auth-zone").style.display = isLogged ? "none" : "flex";
  
  // Afficher ou masquer les options de compte dans le menu déroulant
  document.getElementById("menu-btn-logout").style.display = isLogged ? "block" : "none";
  document.getElementById("menu-btn-delete").style.display = isLogged ? "block" : "none";
}

function ouvrirSecuriseAuth(inscription = true) {
  basculerAffichageAuthentification(inscription);
  ouvrirModal("auth");
  if(inscription) {
    const scroller = document.getElementById("cgu-scroller-node");
    if(scroller) {
      scroller.innerHTML = TEXTES_DU_DROIT.securite;
      scroller.scrollTop = 0;
    }
    const chk = document.getElementById("chk-accept-rules");
    const btnReg = document.getElementById("btn-register-action");
    if(chk) chk.setAttribute("disabled", "true");
    if(btnReg) btnReg.setAttribute("disabled", "true");
    
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
  else abrirModal(id);
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
  if (confirm("⚠️ ATTENTION : Voulez-vous supprimer définitivement votre compte et toutes vos annonces ?")) {
    const user_id = localStorage.getItem("nia_user_id");
    if (!user_id) return;
    const res = await fetch(`${API}/auth/delete-account`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id })
    });
    const data = await res.json();
    if (data.success) deconnexion();
  }
}

// ================= 3. ENVOI ET RENDU DES OFFRES IMMOBILIÈRES =================
async function soumettreAnnonceStandard() {
  const titre = document.getElementById("titre").value.trim();
  const prix = document.getElementById("prix").value.trim();
  const devise = document.getElementById("devise").value;
  const periode = document.getElementById("periode").value;
  const statut = document.getElementById("statut").value;
  const telephone = document.getElementById("telephone").value.trim();
  const description = document.getElementById("description").value.trim();
  const ville = document.getElementById("ville").value.trim();
  const commune = document.getElementById("commune").value.trim();

  await fetch(`${API}/annonces`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"), titre, prix, devise, periode, statut, telephone, description, ville, commune, quartier:"", is_vip: false, images_base64: []
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

// ================= 4. GESTION PRIVÉE, MESSAGES ET SIGNALEMENTS =================
async function ouvrirMessagerieDirecteInstantane(annonceId, titreAnnonce) {
  if(!localStorage.getItem("nia_user_id")) return ouvrirSecuriseAuth(false);
  const text = prompt(`Votre message privé pour : "${titreAnnonce}"`);
  if(!text || !text.trim()) return;

  await fetch(`${API}/chat/send`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, expediteur_id: localStorage.getItem("nia_user_id"), contenu: text })
  });
  alert("Message transmis avec succès !");
}

async function chargerConversationsPrivees() {
  const uid = localStorage.getItem("nia_user_id"); if(!uid) return;
  const res = await fetch(`${API}/chat/conversations/${uid}`);
  const data = await res.json();
  const box = document.getElementById("chat-conversations-list");
  if(data.length === 0) { box.innerHTML = "Aucun message."; return; }

  box.innerHTML = data.map(c => {
    const estAdmin = c.expediteur_nup === "NUP-ADMIN";
    return `
    <div style="background:${estAdmin ? '#fff5f5' : 'white'}; padding:8px; border-radius:6px; border:1px solid ${estAdmin ? 'red' : 'var(--border)'}; font-size:0.85rem;">
      <div style="font-weight:bold; color:${estAdmin ? 'red' : 'var(--primary)'};">
        ${estAdmin ? '🚨 ALERTE OFFICIELLE DE L\'ADMINISTRATION' : `Sujet : ${c.annonce_titre || 'Général'}`}
      </div>
      <div style="background:#f1f5f9; padding:6px; border-radius:4px; font-style:italic; margin-top:4px;">"${c.contenu}"</div>
      ${c.reponse_utilisateur ? `<div style="color:var(--success); font-weight:bold; margin-top:4px;">✓ Justification envoyée : "${c.reponse_utilisateur}"</div>` : 
        estAdmin ? `<div style="margin-top:6px; display:flex; gap:4px;"><input id="justif-reply-to-${c.id}" placeholder="Justification..." style="flex:1;"><button class="btn-auth" style="font-size:0.75rem;" onclick="soumettreJustificationVersAdmin(${c.id})">Répondre</button></div>` : ''}
    </div>`;
  }).join("");
}

async function soumettreJustificationVersAdmin(msgId) {
  const text = document.getElementById(`justif-reply-to-${msgId}`).value.trim(); if(!text) return;
  await fetch(`${API}/chat/reply-justification/${msgId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reponse: text })
  });
  alert("Justification envoyée !"); chargerConversationsPrivees();
}

async function signalerAnnonce(id) {
  const raison = prompt("Motif du signalement :"); if(!raison) return;
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
  const listDiv = document.getElementById("profil-annonces-list");
  listDiv.innerHTML = "";
  
  let userList = toutesLesAnnonces.filter(a => a.user_id == currentUserId && a.is_vip === (mode === "vip"));
  if(userList.length === 0) { listDiv.innerHTML = "<p style='color:gray; text-align:center;'>Aucun bien.</p>"; return; }

  listDiv.innerHTML = userList.map(a => `
    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:8px;">
      <div style="font-weight:bold;">${a.titre} - ${a.prix} ${a.devise}</div>
      <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:8px;">
        <button class="btn-auth" style="background:orange; font-size:0.75rem;" onclick="executerProcessusInterstitielBoost(${a.id})">🚀 Booster</button>
        <button class="btn-auth sec" style="font-size:0.75rem;" onclick='ouvrirFenetreModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})'>✏️ Modifier</button>
        <button class="btn-auth" style="background:var(--danger); font-size:0.75rem;" onclick="supprimerAnnonceProfil(${a.id})">🗑️ Supprimer</button>
      </div>
    </div>`).join("");
}

function executerProcessusInterstitielBoost(id) {
  const m = document.getElementById("modal-adsense-interstitiel"); m.style.display = "flex";
  setTimeout(async () => {
    m.style.display = "none";
    await fetch(`${API}/annonces/${id}/boost`, { method: "POST" });
    alert("Annonce boostée !"); fermerModal("profil"); chargerFluxPrincipal();
  }, 1500);
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
  ouvrirModal("modifier");
}

async function sauvegarderChangementsAnnonce() {
  const id = document.getElementById("edit-id").value;
  await fetch(`${API}/annonces/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: document.getElementById("edit-titre").value, prix: document.getElementById("edit-prix").value,
      devise: document.getElementById("edit-devise").value, periode: document.getElementById("edit-periode").value,
      statut: document.getElementById("edit-statut").value, telephone: document.getElementById("edit-telephone").value,
      description: document.getElementById("edit-description").value, ville: "Lubumbashi"
    })
  });
  fermerModal("modifier"); fermerModal("profil"); chargerFluxPrincipal();
}

async function supprimerAnnonceProfil(id) {
  if(confirm("Confirmer la suppression complète ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    fermerModal("profil"); chargerFluxPrincipal();
  }
}

// ================= 5. GESTION VITRINE MULTI-VIP =================
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
    <input class="vip-in-prix" type="number" placeholder="Prix">
    <select class="vip-in-periode"><option value="jour">/ Jour</option><option value="heure">/ Heure</option></select>
    <select class="vip-in-statut"><option value="disponible">🟢 Disponible</option><option value="occupe">🔴 Occupé</option></select>
    <textarea class="vip-in-desc" placeholder="Description..." rows="2"></textarea>`;
  container.appendChild(row);
}

async function sauvegarderEtPublierToutLeCatalogueVip() {
  const nodes = document.querySelectorAll(".vip-pure-block");
  for(let n of nodes) {
    const titre = n.querySelector(".vip-in-titre").value.trim();
    if(!titre) continue;
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

// ================= 6. INTERFACE D'ADMINISTRATION CENTRALE =================
async function definirVueAdmin(mode) {
  VUE_ADMIN_ACTIVE = mode; const box = document.getElementById("admin-main-render-box"); box.innerHTML = "Chargement...";
  
  if(mode === "flux") {
    box.innerHTML = toutesLesAnnonces.map(a => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:4px;">
        <span style="color:#38bdf8;">[${a.proprietaire_nup || 'SANS NUP'}]</span> <b>${a.titre}</b>
        <div style="display:flex; gap:4px; margin-top:4px;">
          <input id="adm-input-${a.id}" placeholder="Avertissement..." style="flex:1; color:black;">
          <button onclick="envoyerMessageDepuisAdminAuNup(${a.id}, 'normal')" style="background:var(--success); color:white;">Contacter</button>
          <button onclick="supprimerAnnonceParAdmin(${a.id})" style="background:var(--danger); color:white;">🗑️</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "signaux") {
    const res = await fetch(`${API}/admin/reports`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "Aucun signalement."; return; }
    box.innerHTML = data.map(r => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; border-left:4px solid var(--danger); font-size:0.85rem; margin-bottom:4px;">
        <div style="color:#f87171;">⚠️ ${r.raison}</div>
        <span>Annonce : ${r.titre} | Compte : <b>${r.proprietaire_nup || 'Inconnu'}</b></span>
        <div style="display:flex; gap:4px; margin-top:4px;">
          <input id="adm-input-${r.id}" placeholder="Exiger justification..." style="flex:1; color:black;">
          <button onclick="envoyerMessageDepuisAdminAuNup(${r.id}, 'signale')" style="background:orange; color:white;">Exiger Justif</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "justifications") {
    const res = await fetch(`${API}/admin/all-justifications/signale`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "Aucune justification."; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:4px;">
        <div style="color:#94a3b8;"><b>Alerte :</b> ${m.contenu}</div>
        <div style="color:#4ade80;"><b>↩️ Profil [${m.user_nup}] :</b> "${m.reponse_utilisateur}"</div>
      </div>`).join("");
  }
}

async function envoyerMessageDepuisAdminAuNup(annonceId, ctx) {
  const msg = document.getElementById(`adm-input-${annonceId}`).value.trim(); if(!msg) return;
  await fetch(`${API}/admin/send-to-nup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, contenu: msg, provenance_contexte: ctx })
  });
  alert("Message envoyé."); document.getElementById(`adm-input-${annonceId}`).value = "";
  definirVueAdmin(VUE_ADMIN_ACTIVE);
}

async function supprimerAnnonceParAdmin(id) { 
  if(confirm("Supprimer ?")) { 
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); 
    chargerFluxPrincipal(); setTimeout(() => definirVueAdmin(VUE_ADMIN_ACTIVE), 400); 
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
