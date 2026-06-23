const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let VUE_ADMIN_ACTIVE = "flux";
let ONGLET_PROFIL_ACTIF = "standard";
let BLOCS_VIP_COMPTEUR = 0;
let topAdminTimer = null;
let validationAdminOk = false;

const TEXTES_DU_DROIT = {
  securite: `POLITIQUE DE SÉCURITÉ ET CONDITIONS GÉNÉRALES D'UTILISATION (CGU) - NIA RDC

1. ACCEPTATION DES CONDITIONS
En créant un compte sur l'application NIA RDC, vous acceptez expressément d'être soumis aux présentes règles de sécurité et d'utilisation. Si vous n'avez pas l'intention de respecter ces dispositions, nous vous invitons à quitter le service.

2. NUMÉRO DE PROFIL UNIQUE (NUP)
Chaque utilisateur se voit attribuer automatiquement un Identifiant Unique de Profil (NUP). Cet identifiant permet à l'administration de suivre vos publications (Annonces Standards et VIP) et de vous contacter directement en cas de litige, de signalement ou d'audit de sécurité, préservant ainsi l'anonymat global tout en maintenant une traçabilité totale pour l'équipe de modération.

3. SÉCURITÉ DES TRANSACTIONS ET ANTI-FRAUDE
NIA RDC est une plateforme de mise en relation immobilière basée à Lubumbashi, RDC. L'administration ne prend aucune commission sur les transactions standards et décline toute responsabilité en cas de litige financier entre l'acheteur/locataire et le bailleur. Il est formellement interdit de publier des annonces mensongères, des biens fictifs ou d'utiliser des photos ne correspondant pas à la réalité du bien.

4. SYSTÈME DE SIGNALEMENT ET MODÉRATION
Toute annonce suspecte ou signalée par la communauté fera l'objet d'une enquête immédiate par les superviseurs. Un message officiel de l'administration sera envoyé directement dans l'Espace Privé (boîte de messages) du profil concerné. L'utilisateur dispose d'un délai requis pour fournir ses justifications directement depuis son profil sous peine de suppression définitive de l'annonce et de bannissement de son compte.

5. MODIFICATIONS DES SERVICES
L'administration se réserve le droit de modifier, suspendre ou supprimer des fonctionnalités (y compris la gestion des boosters et des suppressions d'annonces) à tout moment pour garantir la stabilité du réseau.

[FIN DU DOCUMENT - VEUILLEZ COCHER LA CASE CI-DESSOUS APRÈS LECTURE TOTALE COMPLÈTE POUR ACTIVER VOTRE INSCRIPTION]`,

  apropos: `À PROPOS DE NIA RDC\n\nNIA RDC est la plateforme immobilière de référence pour le marché de la République Démocratique du Congo, spécialement optimisée pour la ville de Lubumbashi.\n\nNotre mission est de simplifier la recherche et la publication de maisons, appartements, studios et espaces commerciaux grâce à un outil rapide, fluide et sécurisé par le système de Numéro de Profil Unique (NUP).`,

  confidentialite: `POLITIQUE DE CONFIDENTIALITÉ\n\n1. COLLECTE DES DONNÉES\nNous collectons uniquement votre numéro de téléphone afin de sécuriser votre accès et de permettre aux clients potentiels de vous contacter.\n\n2. SÉCURITÉ DES DONNÉES\nVos mots de passe sont hautement sécurisés et cryptés via un algorithme de hachage (bcrypt) sur nos serveurs. L'administration n'a pas accès à votre mot de passe en clair.`
};

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

function toggleMenuLegal() {
  const m = document.getElementById("legal-dropdown"); 
  m.style.display = m.style.display === "block" ? "none" : "block";
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
  if (confirm("⚠️ ATTENTION : Voulez-vous supprimer définitivement votre compte ainsi que l'ensemble de vos annonces ?")) {
    const user_id = localStorage.getItem("nia_user_id");
    if (!user_id) return;
    const res = await fetch(`${API}/auth/delete-account`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id })
    });
    const data = await res.json();
    if (data.success) { deconnexion(); }
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
  const titre = document.getElementById("titre").value.trim();
  const prix = document.getElementById("prix").value.trim();
  const devise = document.getElementById("devise").value;
  const periode = document.getElementById("periode").value;
  const statut = document.getElementById("statut").value;
  const telephone = document.getElementById("telephone").value.trim();
  const description = document.getElementById("description").value.trim();
  const ville = document.getElementById("ville").value.trim();
  const commune = document.getElementById("commune").value.trim();
  const files = document.getElementById("photos-input").files;

  let images_base64 = [];
  for(let i=0; i<files.length; i++) { images_base64.push(await traiterFichierEnBase64(files[i])); }

  await fetch(`${API}/annonces`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"), titre, prix, devise, periode, statut, telephone, description, ville, commune, quartier:"", is_vip: false, images_base64
    })
  });
  fermerModal("publier"); chargerFluxPrincipal();
}

async function chargerFluxPrincipal() {
  try {
    const res = await fetch(`${API}/feed`); toutesLesAnnonces = await res.json();
    rendreFluxHtml(toutesLesAnnonces);
  } catch(e) { document.getElementById("feed").innerHTML = "Erreur de synchronisation..."; }
}

function rendreFluxHtml(liste) {
  const container = document.getElementById("feed"); container.innerHTML = "";
  if(liste.length === 0) { container.innerHTML = "<p style='text-align:center; color:gray;'>Aucune offre disponible.</p>"; return; }

  liste.forEach(a => {
    let imagesMarkup = (a.images && a.images.length > 0) ? `<div class="gallery">${a.images.map(imgObj => `<img src="${imgObj.url}">`).join("")}</div>` : "";
    const isOwner = a.user_id == localStorage.getItem("nia_user_id");
    
    container.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="badge-vip">👑 VIP EXPRESS</div>` : ""}
        <h3 style="margin:0 0 4px 0; font-size:1.1rem; font-weight:700;">${a.titre}</h3>
        <div class="price-tag">${a.prix} ${a.devise} <span style="font-size:0.8rem; font-weight:normal; color:var(--text-light)">/ ${a.periode}</span></div>
        <div style="font-size:0.8rem; color:var(--text-light); margin-bottom:8px;">📍 ${a.ville}${a.commune ? ' · ' + a.commune : ''}</div>
        <div style="font-size:0.85rem; background:#f8fafc; padding:12px; border-radius:8px; margin:10px 0; line-height:1.5;">${a.description || ''}</div>
        ${imagesMarkup}
        <div class="card-footer">
          <span class="${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}</span>
          <div style="display:flex; gap:6px;">
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
  alert("Message transmis avec succès !");
}

async function chargerConversationsPrivees() {
  const uid = localStorage.getItem("nia_user_id"); if(!uid) return;
  const res = await fetch(`${API}/chat/conversations/${uid}`);
  const data = await res.json();
  const box = document.getElementById("chat-conversations-list");
  if(data.length === 0) { box.innerHTML = "<p style='color:gray; font-size:0.8rem; margin:0;'>Aucun message en cours.</p>"; return; }

  box.innerHTML = data.map(c => {
    const estAdmin = c.expediteur_nup === "NUP-ADMIN";
    return `
    <div style="background:${estAdmin ? '#fef2f2' : 'white'}; padding:10px; border-radius:8px; border:1px solid ${estAdmin ? 'var(--danger)' : 'var(--border)'}; font-size:0.85rem; display:flex; flex-direction:column; gap:4px;">
      <div style="font-weight:700; color:${estAdmin ? 'var(--danger)' : 'var(--primary)'};">
        ${estAdmin ? '🚨 ALERTE OFFICIELLE DE L\'ADMINISTRATION' : `Sujet : ${c.annonce_titre || 'Général'}`}
      </div>
      <div style="color:var(--text-light); font-size:0.75rem;">De : ${c.expediteur_nup} ➔ À : ${c.destinataire_nup}</div>
      <div style="background:#f1f5f9; padding:8px; border-radius:6px; font-style:italic; margin-top:4px; color:var(--text)">"${c.contenu}"</div>
      
      ${c.reponse_utilisateur ? `<div style="color:var(--success); font-weight:700; margin-top:4px;">✓ Justification fournie : "${c.reponse_utilisateur}"</div>` : 
        estAdmin ? `<div style="margin-top:6px; display:flex; gap:6px;"><input id="justif-reply-to-${c.id}" placeholder="Entrez votre justification..." style="flex:1; padding:8px; border:1px solid var(--border); border-radius:6px; font-size:0.8rem;"><button class="btn-auth" style="font-size:0.75rem; padding:8px 12px;" onclick="soumettreJustificationVersAdmin(${c.id})">Répondre</button></div>` : ''}
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
  const listDiv = document.getElementById("profil-annonces-list");
  listDiv.innerHTML = "";
  
  let userList = toutesLesAnnonces.filter(a => a.user_id == currentUserId && a.is_vip === (mode === "vip"));
  
  if(userList.length === 0) { listDiv.innerHTML = "<p style='color:gray; text-align:center; font-size:0.85rem;'>Aucune publication enregistrée.</p>"; return; }

  listDiv.innerHTML = userList.map(a => `
    <div style="background:#f8fafc; padding:14px; border-radius:10px; border:1px solid var(--border); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
      <div style="font-weight:600; font-size:0.85rem;">${a.titre} <span style="color:var(--primary); font-weight:700;">(${a.prix} ${a.devise})</span></div>
      <div style="display:flex; gap:4px;">
        <button class="btn-auth" style="background:#f59e0b; font-size:0.75rem; padding:6px 10px;" onclick="executerProcessusInterstitielBoost(${a.id})">🚀 Booster</button>
        <button class="btn-auth sec" style="font-size:0.75rem; padding:6px 10px;" onclick='ouvrirFenetreModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})'>✏️ Modifier</button>
        <button class="btn-auth" style="background:var(--danger); font-size:0.75rem; padding:6px 10px;" onclick="supprimerAnnonceProfil(${a.id})">🗑️</button>
      </div>
    </div>`).join("");
}

function executerProcessusInterstitielBoost(id) {
  const m = document.getElementById("modal-adsense-interstitiel");
  m.style.display = "flex";
  setTimeout(async () => {
    m.style.display = "none";
    await fetch(`${API}/annonces/${id}/boost`, { method: "POST" });
    alert("Annonce remontée au sommet de l'algorithme !"); fermerModal("profil"); chargerFluxPrincipal();
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

function rafraichirVueVipFormulaire() {
  const s = document.getElementById("vip-setup-zone");
  s.innerHTML = `
    <div id="vip-multi-blocks" style="display:flex; flex-direction:column; gap:12px;"></div>
    <button class="btn-auth sec" style="width:100%; margin-top:12px;" onclick="ajouterBlocObjetAuCatalogueVip()">➕ Ajouter un logement à la liste</button>
    <button class="btn-auth" style="width:100%; margin-top:8px; background:var(--vip-gold);" onclick="sauvegarderEtPublierToutLeCatalogueVip()">Publier la Vitrine VIP 🚀</button>`;
  BLOCS_VIP_COMPTEUR = 0; ajouterBlocObjetAuCatalogueVip();
}

function ajouterBlocObjetAuCatalogueVip() {
  BLOCS_VIP_COMPTEUR++;
  const container = document.getElementById("vip-multi-blocks");
  const row = document.createElement("div");
  row.className = "vip-pure-block"; row.id = `vip-b-${BLOCS_VIP_COMPTEUR}`;
  row.style = "background:#f8fafc; border:1px dashed var(--vip-gold); padding:14px; border-radius:10px; display:flex; flex-direction:column; gap:8px;";
  row.innerHTML = `
    <input class="vip-in-titre" placeholder="Titre du logement VIP *">
    <div style="display:flex; gap:6px;">
      <input class="vip-in-prix" type="number" placeholder="Prix" style="flex:1;">
      <select class="vip-in-periode" style="flex:1;"><option value="jour">/ Jour</option><option value="heure">/ Heure</option></select>
    </div>
    <select class="vip-in-statut"><option value="disponible">🟢 Disponible</option><option value="occupe">🔴 Occupé</option></select>
    <textarea class="vip-in-desc" placeholder="Description du bien..." rows="2"></textarea>`;
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

async function definirVueAdmin(mode) {
  VUE_ADMIN_ACTIVE = mode; const box = document.getElementById("admin-main-render-box"); box.innerHTML = "Chargement...";
  
  if(mode === "flux") {
    box.innerHTML = toutesLesAnnonces.map(a => `
      <div style="background:#1e293b; padding:10px; border-radius:8px; font-size:0.8rem; display:flex; flex-direction:column; gap:6px;">
        <div><span style="color:#38bdf8; font-weight:700;">[${a.proprietaire_nup || 'SANS NUP'}]</span> <b>${a.titre}</b></div>
        <div style="display:flex; gap:6px;">
          <input id="adm-input-${a.id}" placeholder="Message privé..." style="flex:1; color:black; border-radius:6px; padding:6px; border:none; font-size:0.8rem;">
          <button onclick="envoyerMessageDepuisAdminAuNup(${a.id}, 'normal')" style="background:var(--success); color:white; border:none; border-radius:6px; padding:0 10px; font-weight:600;">Contacter</button>
          <button onclick="supprimerAnnonceParAdmin(${a.id})" style="background:var(--danger); color:white; border:none; border-radius:6px; padding:0 8px;">🗑️</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "signaux") {
    const res = await fetch(`${API}/admin/reports`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "<p style='color:gray; font-size:0.8rem;'>Aucun signalement.</p>"; return; }
    box.innerHTML = data.map(r => `
      <div style="background:#1e293b; padding:10px; border-radius:8px; border-left:4px solid var(--danger); font-size:0.8rem; display:flex; flex-direction:column; gap:6px;">
        <div style="color:#f87171; font-weight:700;">⚠️ MOTIF : "${r.raison}"</div>
        <div style="color:#cbd5e1;">Cible : ${r.titre} | Propriétaire : <b>${r.proprietaire_nup || 'Inconnu'}</b></div>
        <div style="display:flex; gap:6px;">
          <input id="adm-input-${r.id}" placeholder="Exiger une explication requise..." style="flex:1; color:black; border-radius:6px; padding:6px; border:none; font-size:0.8rem;">
          <button onclick="envoyerMessageDepuisAdminAuNup(${r.id}, 'signale')" style="background:#f59e0b; color:white; border:none; border-radius:6px; padding:0 10px; font-weight:600;">Exiger Justif</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "justifications") {
    const res = await fetch(`${API}/admin/all-justifications/signale`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "<p style='color:gray; font-size:0.8rem;'>Aucune réponse reçue.</p>"; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:10px; border-radius:8px; font-size:0.8rem; display:flex; flex-direction:column; gap:4px;">
        <div style="color:#94a3b8;"><b>Alerte envoyée :</b> ${m.contenu}</div>
        <div style="color:#34d399; font-weight:700;"><b>↩️ Réponse du profil [${m.user_nup}] :</b> "${m.reponse_utilisateur}"</div>
      </div>`).join("");
  }
}

async function envoyerMessageDepuisAdminAuNup(annonceId, ctx) {
  const msg = document.getElementById(`adm-input-${annonceId}`).value.trim(); if(!msg) return;
  await fetch(`${API}/admin/send-to-nup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, contenu: msg, provenance_contexte: ctx })
  });
  alert("Notification envoyée avec succès sur l'espace privé de l'utilisateur !");
  document.getElementById(`adm-input-${annonceId}`).value = "";
  definirVueAdmin(VUE_ADMIN_ACTIVE);
}

async function supprimerAnnonceParAdmin(id) { 
  if(confirm("Confirmer le retrait de ce bien ?")) { 
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); 
    chargerFluxPrincipal(); 
    setTimeout(() => definirVueAdmin(VUE_ADMIN_ACTIVE), 400); 
  } 
}

function detecterClicLongAdmin() { validationAdminOk = false; topAdminTimer = setTimeout(() => { validationAdminOk = true; }, 4000); }
function annulerClicLongAdmin() {
  clearTimeout(topAdminTimer);
  if(validationAdminOk) {
    if (prompt("Entrez le code d'accès superviseur :") === "BEN4002ET4200") { ouvrirModal("admin"); definirVueAdmin("flux"); }
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
