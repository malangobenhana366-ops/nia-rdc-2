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
En créant un compte sur l'application NIA RDC, vous acceptez expressément d'être soumis aux présentes règles de sécurité et d'utilisation.

2. NUMÉRO DE PROFIL UNIQUE (NUP)
Chaque utilisateur se voit attribuer automatiquement un Identifiant Unique de Profil (NUP). Cet identifiant permet à l'administration de suivre vos publications et de filtrer toute activité malveillante ou robotique.

3. EXCLUSION STRICTE DE L'IMMOBILIER
NIA RDC est exclusivement réservée aux objets, matériels, équipements, véhicules et prestations de services physiques. Toute annonce d'ordre immobilier (Vente/Location de parcelles, maisons, studios, appartements) est strictement interdite et automatiquement bloquée par notre algorithme de sécurité.

4. SYSTÈME DE SIGNALEMENT ET MODÉRATION RADICALE
L'administration dispose d'un pouvoir de contrôle absolu. Tout message ou annonce illégal, abusif ou robotisé sera supprimé définitivement du réseau instantanément sans préavis.

[FIN DU DOCUMENT - DEFILEZ VERS LE BAS POUR VALIDER L'INSCRIPTION]`,

  apropos: `À propos de NIA RDC... (Texte inchangé pour préserver la structure)`,
  confidentialite: `Politique de confidentialité de NIA RDC... (Texte inchangé)`
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
    cle === "securite" ? "📜 Sécurité & CGU" : cle === "apropos" ? "ℹ️ À propos de NIA RDC" : "🔒 Politique de Confidentialité";
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
  if (confirm("⚠️ Voulez-vous supprimer définitivement votre compte et vos publications ?")) {
    const user_id = localStorage.getItem("nia_user_id");
    if (!user_id) return;
    const res = await fetch(`${API}/auth/delete-account`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id })
    });
    if ((await res.json()).success) { deconnexion(); }
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

// ACTION EXPANSION DU TEXTE AU CLIC SÉCURISÉ
function basculerAffichageDescriptionElement(element) {
  element.classList.toggle("expanded");
}

// PARTAGE SUR WHATSAPP (BOUTON INVITATION PROFIL)
function partagerLienApplicationWhatsApp() {
  const lienApp = window.location.href;
  const texteMessage = encodeURIComponent(`Bonjour ! Je t'invite à rejoindre NIA RDC, la plateforme sécurisée pour trouver rapidement des objets, équipements et services matériels. Voici le lien direct de l'application : ${lienApp}`);
  window.open(`https://api.whatsapp.com/send?text=${texteMessage}`, '_blank');
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

  const response = await fetch(`${API}/annonces`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"), titre, prix, devise, periode, statut, telephone, description, ville, commune, quartier:"", is_vip: false, images_base64
    })
  });
  
  const result = await response.json();
  if(!response.ok) {
    alert(result.error);
  } else {
    fermerModal("publier"); chargerFluxPrincipal();
  }
}

async function chargerFluxPrincipal() {
  try {
    const res = await fetch(`${API}/feed`); toutesLesAnnonces = await res.json();
    rendreFluxHtml(toutesLesAnnonces);
    if(document.getElementById("admin-total-count")) {
      document.getElementById("admin-total-count").textContent = toutesLesAnnonces.length;
    }
  } catch(e) { document.getElementById("feed").innerHTML = "Erreur de synchronisation..."; }
}

function rendreFluxHtml(liste) {
  const container = document.getElementById("feed"); container.innerHTML = "";
  if(liste.length === 0) { container.innerHTML = "<p style='text-align:center; color:gray;'>Aucune offre disponible.</p>"; return; }

  liste.forEach(a => {
    let imagesMarkup = (a.images && a.images.length > 0) ? `<div class="gallery">${a.images.map(imgObj => `<img src="${imgObj.url}">`).join("")}</div>` : "";
    const isOwner = a.user_id == localStorage.getItem("nia_user_id");
    
    let shopButtonMarkup = "";
    if (a.is_vip && a.user_id) {
      shopButtonMarkup = `<button class="btn-action shop" onclick="filtrerAnnoncesParBoutiqueProprietaire(${a.user_id}, '${a.proprietaire_nup || 'Boutique'}')">🏪 Vitrine</button>`;
    }
    
    // BOUTON WHATSAPP DE L'ANNONCE
    const shareMessage = encodeURIComponent(`Regarde cette offre sur NIA RDC : ${a.titre} - ${a.prix} ${a.devise} disponible à ${a.ville}.`);
    const whatsappShareMarkup = `<button class="btn-action share" onclick="window.open('https://api.whatsapp.com/send?text=${shareMessage}', '_blank')">✉️ Inviter</button>`;

    container.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="badge-vip">👑 VIP EXPRESS</div>` : ""}
        <h3 style="margin:0 0 4px 0; font-size:1.1rem; font-weight:700;">${a.titre}</h3>
        <div class="price-tag">${a.prix} ${a.devise} <span style="font-size:0.8rem; font-weight:normal; color:var(--text-light)">/ ${a.periode}</span></div>
        <div style="font-size:0.8rem; color:var(--text-light); margin-bottom:8px;">📍 ${a.ville}${a.commune ? ' · ' + a.commune : ''}</div>
        
        <div class="expandable-desc" onclick="basculerAffichageDescriptionElement(this)">${a.description || 'Aucune description fournie.'}</div>
        
        ${imagesMarkup}
        <div class="card-footer">
          <span class="${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}</span>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            <button class="btn-action report" onclick="signalerAnnonce(${a.id})">⚠️ Signaler</button>
            ${isOwner ? '' : `<button class="btn-action chat" onclick="ouvrirMessagerieDirecteInstantane(${a.id}, '${a.titre.replace(/'/g, "\\'")}')">💬 Message</button>`}
            ${shopButtonMarkup}
            ${whatsappShareMarkup}
            <button class="btn-action call" onclick="window.location.href='tel:${a.telephone}'">📞 Appeler</button>
          </div>
        </div>
      </div>`;
  });
}

function filtrerAnnoncesParBoutiqueProprietaire(ownerId, nupName) {
  let filtered = toutesLesAnnonces.filter(a => a.user_id == ownerId && a.is_vip === true);
  document.getElementById("feed-current-title").textContent = `Vitrine VIP de ${nupName}`;
  document.getElementById("btn-clear-search").style.display = "block";
  rendreFluxHtml(filtered);
}

async function ouvrirMessagerieDirecteInstantane(annonceId, titreAnnonce) {
  if(!localStorage.getItem("nia_user_id")) return ouvrirSecuriseAuth(false);
  const text = prompt(`Votre message pour : "${titreAnnonce}"`);
  if(!text || !text.trim()) return;

  await fetch(`${API}/chat/send`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, expediteur_id: localStorage.getItem("nia_user_id"), contenu: text, provenance_contexte: 'normal' })
  });
  alert("Message transmis avec succès !");
}

async function chargerConversationsPrivees() {
  const uid = localStorage.getItem("nia_user_id"); if(!uid) return;
  const res = await fetch(`${API}/chat/conversations/${uid}`);
  const data = await res.json();
  const box = document.getElementById("chat-conversations-list");
  if(data.length === 0) { box.innerHTML = "<p style='color:gray; font-size:0.8rem; margin:0;'>Aucun message.</p>"; return; }

  box.innerHTML = data.map(c => {
    const estAdmin = c.expediteur_nup === "NUP-ADMIN";
    const estBroadcast = c.provenance_contexte === "broadcast";
    return `
    <div style="background:${estAdmin ? '#fef2f2' : 'white'}; padding:10px; border-radius:8px; border:1px solid ${estAdmin ? 'var(--danger)' : 'var(--border)'}; font-size:0.85rem; display:flex; flex-direction:column; gap:4px;">
      <div style="font-weight:700; color:${estAdmin ? 'var(--danger)' : 'var(--primary)'};">
        ${estBroadcast ? '📢 ALERTE GÉNÉRALE INFO' : estAdmin ? '🚨 MODÉRATION ADMINISTRATIVE' : `Sujet : ${c.annonce_titre || 'Général'}`}
      </div>
      <div style="color:var(--text-light); font-size:0.75rem;">De : ${c.expediteur_nup} ➔ À : ${c.destinataire_nup}</div>
      <div style="background:#f1f5f9; padding:8px; border-radius:6px; font-style:italic; margin-top:4px; color:var(--text)">"${c.contenu}"</div>
      ${c.reponse_utilisateur ? `<div style="color:var(--success); font-weight:700; margin-top:4px;">✓ Justification : "${c.reponse_utilisateur}"</div>` : 
        (estAdmin && !estBroadcast) ? `<div style="margin-top:6px; display:flex; gap:6px;"><input id="justif-reply-to-${c.id}" placeholder="Entrez votre explication..." style="flex:1; padding:8px; border:1px solid var(--border); border-radius:6px; font-size:0.8rem;"><button class="btn-auth" style="font-size:0.75rem; padding:8px 12px;" onclick="soumettreJustificationWZAdmin(${c.id})">Envoyer</button></div>` : ''}
    </div>`;
  }).join("");
}

async function soumettreJustificationWZAdmin(msgId) {
  const text = document.getElementById(`justif-reply-to-${msgId}`).value.trim(); if(!text) return;
  await fetch(`${API}/chat/reply-justification/${msgId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reponse: text })
  });
  alert("Justification envoyée !"); chargerConversationsPrivees();
}

async function signalerAnnonce(id) {
  const raison = prompt("Indiquez le motif de l'alerte :"); if(!raison) return;
  await fetch(`${API}/annonces/${id}/signaler`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raison })
  });
  alert("Signalement enregistré.");
}

function basculerOngletProfil(mode) {
  ONGLET_PROFIL_ACTIF = mode;
  document.getElementById("btn-tab-std").className = mode === "standard" ? "btn-auth" : "btn-auth sec";
  document.getElementById("btn-tab-vip").className = mode === "vip" ? "btn-auth" : "btn-auth sec";
  
  const currentUserId = localStorage.getItem("nia_user_id");
  const listDiv = document.getElementById("profil-annonces-list");
  listDiv.innerHTML = "";
  
  let userList = toutesLesAnnonces.filter(a => a.user_id == currentUserId && a.is_vip === (mode === "vip"));
  if(userList.length === 0) { listDiv.innerHTML = "<p style='color:gray; text-align:center; font-size:0.85rem;'>Aucun bien.</p>"; return; }

  listDiv.innerHTML = userList.map(a => `
    <div style="background:#f8fafc; padding:14px; border-radius:10px; border:1px solid var(--border); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
      <div style="font-weight:600; font-size:0.85rem;">${a.titre} <span style="color:var(--primary); font-weight:700;">(${a.prix} ${a.devise})</span></div>
      <div style="display:flex; gap:4px;">
        <button class="btn-auth" style="background:#f59e0b; font-size:0.75rem; padding:6px 10px;" onclick="executerProcessusInterstitielBoost(${a.id})">🚀 Booster</button>
        <button class="btn-auth sec" style="font-size:0.75rem; padding:6px 10px;" onclick='ouvrirFenetreModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})'>✏️ Éditer</button>
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
    alert("Annonce boostée !"); fermerModal("profil"); chargerFluxPrincipal();
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
  const res = await fetch(`${API}/annonces/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: document.getElementById("edit-titre").value, prix: document.getElementById("edit-prix").value,
      devise: document.getElementById("edit-devise").value, periode: document.getElementById("edit-periode").value,
      statut: document.getElementById("edit-statut").value, telephone: document.getElementById("edit-telephone").value,
      description: document.getElementById("edit-description").value, ville: "Lubumbashi"
    })
  });
  if(!res.ok) { alert((await res.json()).error); }
  else { fermerModal("modifier"); fermerModal("profil"); chargerFluxPrincipal(); }
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
    <button class="btn-auth sec" style="width:100%; margin-top:12px;" onclick="ajouterBlocObjetAuCatalogueVip()">➕ Ajouter un article au catalogue VIP</button>
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
    <input class="vip-in-titre" placeholder="Nom de l'article VIP *">
    <div style="display:flex; gap:6px;">
      <input class="vip-in-prix" type="number" placeholder="Prix" style="flex:1;">
      <select class="vip-in-periode" style="flex:1;"><option value="jour">/ Jour</option><option value="heure">/ Heure</option></select>
    </div>
    <div style="display:flex; gap:6px;">
      <input class="vip-in-ville" value="Lubumbashi" placeholder="Ville">
      <input class="vip-in-commune" placeholder="Commune">
    </div>
    <select class="vip-in-statut"><option value="disponible">🟢 Disponible</option><option value="occupe">🔴 Occupé</option></select>
    <textarea class="vip-in-desc" placeholder="Description détaillée..." rows="2"></textarea>
    <div class="form-box"><label style="font-size:0.75rem;">Photos de l'élément</label><input type="file" class="vip-in-photos" multiple accept="image/*" style="border:none; background:transparent; padding:0;"></div>`;
  container.appendChild(row);
}

async function sauvegarderEtPublierToutLeCatalogueVip() {
  const nodes = document.querySelectorAll(".vip-pure-block");
  for(let n of nodes) {
    const titre = n.querySelector(".vip-in-titre").value.trim();
    if(!titre) continue;
    const photoFiles = n.querySelector(".vip-in-photos").files;
    let images_base64 = [];
    for(let i = 0; i < photoFiles.length; i++){ images_base64.push(await traiterFichierEnBase64(photoFiles[i])); }

    const res = await fetch(`${API}/annonces`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: localStorage.getItem("nia_user_id"), titre, prix: n.querySelector(".vip-in-prix").value || 0,
        devise: "$", periode: n.querySelector(".vip-in-periode").value, statut: n.querySelector(".vip-in-statut").value,
        telephone: localStorage.getItem("nia_user_tel"), description: n.querySelector(".vip-in-desc").value, 
        ville: n.querySelector(".vip-in-ville").value || "Lubumbashi", commune: n.querySelector(".vip-in-commune").value || "",
        quartier: "", is_vip: true, images_base64
      })
    });
    if(!res.ok) { alert((await res.json()).error); return; }
  }
  fermerModal("vip"); chargerFluxPrincipal();
}

async function envoyerMessageGlobalBroadcast() {
  const msg = document.getElementById("admin-broadcast-text").value.trim();
  if(!msg) return alert("Veuillez saisir un message.");
  await fetch(`${API}/admin/broadcast`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contenu: msg })
  });
  alert("Message collectif envoyé !"); document.getElementById("admin-broadcast-text").value = "";
}

function appliquerFiltresAdmin() { definirVueAdmin(VUE_ADMIN_ACTIVE); }

// EXCLUSIF ADMIN : RECOMPOSITION DU SYSTÈME DE VUE AVEC MODÉRATION DES CHATS
async function definirVueAdmin(mode) {
  VUE_ADMIN_ACTIVE = mode; const box = document.getElementById("admin-main-render-box"); box.innerHTML = "Chargement...";
  const fVille = document.getElementById("admin-filter-ville").value.toLowerCase().trim();
  const fType = document.getElementById("admin-filter-type").value;

  let listeFiltree = toutesLesAnnonces.filter(a => {
    if(fVille && (!a.ville || !a.ville.toLowerCase().includes(fVille))) return false;
    if(fType === "standard" && a.is_vip) return false;
    if(fType === "vip" && !a.is_vip) return false;
    return true;
  });

  if(mode === "flux") {
    box.innerHTML = listeFiltree.map(a => `
      <div style="background:#1e293b; padding:10px; border-radius:8px; font-size:0.8rem; display:flex; flex-direction:column; gap:6px;">
        <div><span style="color:#38bdf8; font-weight:700;">[${a.proprietaire_nup || 'SANS NUP'}]</span> <b>${a.titre}</b></div>
        <div style="display:flex; gap:6px;">
          <input id="adm-input-${a.id}" placeholder="Message de modération..." style="flex:1; color:black; border-radius:6px; padding:6px; border:none;">
          <button onclick="envoyerMessageDepuisAdminAuNup(${a.id}, 'signale')" style="background:var(--success); color:white; border:none; border-radius:6px; padding:4px 10px;">Contacter</button>
          <button onclick="supprimerAnnonceParAdmin(${a.id})" style="background:var(--danger); color:white; border:none; border-radius:6px; padding:4px 8px;">🗑️</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "chat-moderation") {
    const res = await fetch(`${API}/admin/all-messages`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "<p style='color:gray; font-size:0.8rem;'>Aucun chat en cours.</p>"; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:10px; border-radius:8px; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
        <div style="flex:1; padding-right:10px;">
          <span style="color:#a7f3d0;">${m.expediteur_nup} ➜ ${m.destinataire_nup}:</span>
          <span style="color:white; font-style:italic;">"${m.contenu}"</span>
        </div>
        <button onclick="supprimerMessageParAdminRadical(${m.id})" style="background:var(--danger); color:white; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; font-weight:bold;">Supprimer 🗑️</button>
      </div>`).join("");
  }
  else if(mode === "signaux") {
    const res = await fetch(`${API}/admin/reports`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "<p style='color:gray; font-size:0.8rem;'>Aucun signalement.</p>"; return; }
    box.innerHTML = data.map(r => `
      <div style="background:#1e293b; padding:10px; border-radius:8px; border-left:4px solid var(--danger); font-size:0.8rem; display:flex; flex-direction:column; gap:6px;">
        <div style="color:#f87171; font-weight:700;">⚠️ MOTIF : "${r.raison}"</div>
        <div style="color:#cbd5e1;">Cible : ${r.titre}</div>
        <div style="display:flex; gap:6px;">
          <input id="adm-input-${r.id}" placeholder="Explication requise..." style="flex:1; color:black; border-radius:6px; padding:6px; border:none;">
          <button onclick="envoyerMessageDepuisAdminAuNup(${r.id}, 'signale')" style="background:#f59e0b; color:white; border:none; border-radius:6px; padding:4px 10px;">Exiger Justif</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "justifications") {
    const res = await fetch(`${API}/admin/all-justifications/signale`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "<p style='color:gray; font-size:0.8rem;'>Aucune justification.</p>"; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:10px; border-radius:8px; font-size:0.8rem;">
        <div style="color:#94a3b8;"><b>Alerte :</b> ${m.contenu}</div>
        <div style="color:#34d399; font-weight:700;"><b>↩️ Réponse du [${m.user_nup}] :</b> "${m.reponse_utilisateur}"</div>
      </div>`).join("");
  }
}

async function supprimerMessageParAdminRadical(msgId) {
  if(confirm("Voulez-vous supprimer ce message ? Il disparaîtra définitivement pour les deux interlocuteurs.")) {
    await fetch(`${API}/admin/messages/${msgId}`, { method: "DELETE" });
    definirVueAdmin("chat-moderation");
  }
}

async function envoyerMessageDepuisAdminAuNup(annonceId, ctx) {
  const msg = document.getElementById(`adm-input-${annonceId}`).value.trim(); if(!msg) return;
  await fetch(`${API}/admin/send-to-nup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, contenu: msg, provenance_contexte: ctx })
  });
  alert("Message envoyé !"); document.getElementById(`adm-input-${annonceId}`).value = "";
  definirVueAdmin(VUE_ADMIN_ACTIVE);
}

async function supprimerAnnonceParAdmin(id) { 
  if(confirm("Retirer cette annonce du serveur ?")) { 
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); 
    chargerFluxPrincipal(); setTimeout(() => definirVueAdmin(VUE_ADMIN_ACTIVE), 400); 
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
  const v = document.getElementById("search-ville").value.toLowerCase();
  let matches = toutesLesAnnonces.filter(a => {
    let matchKw = kw === "" || a.titre.toLowerCase().includes(kw);
    let matchVille = v === "" || (a.ville && a.ville.toLowerCase().includes(v));
    return matchKw && matchVille;
  });
  document.getElementById("feed-current-title").textContent = "Résultats du filtrage";
  document.getElementById("btn-clear-search").style.display = "block";
  rendreFluxHtml(matches); fermerModal("rechercher");
}

function reinitialiserFluxGeneral() {
  document.getElementById("feed-current-title").textContent = "Annonces récentes";
  document.getElementById("btn-clear-search").style.display = "none";
  rendreFluxHtml(toutesLesAnnonces);
}

// ALLÈGEMENT DU SYNCHRO CHRONO (ANTI-BUG / DES MILLIERS D'UTILISATEURS EN MÊME TEMPS)
setInterval(chargerFluxPrincipal, 35000);
document.addEventListener("DOMContentLoaded", () => { rafraichirHeaderVisuel(); chargerFluxPrincipal(); });
