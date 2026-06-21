const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let VUE_ADMIN_ACTIVE = "flux";
let ONGLET_PROFIL_ACTIF = "standard";
let BLOCS_VIP_COMPTEUR = 0;
let topAdminTimer = null;
let validationAdminOk = false;

const TEXTES_DU_DROIT = {
  securite: `Conditions de sécurité et d'utilisation de NIA RDC\n\nBienvenue sur NIA RDC.\n\nAvant de créer un compte, veuillez lire les présentes conditions. En utilisant la plateforme, vous acceptez les règles suivantes.\n\n1. Utilisation de la plateforme\nNIA RDC est une plateforme destinée à faciliter la publication et la consultation d'annonces de location, de vente et de services. Les utilisateurs s'engagent à utiliser la plateforme de manière honnête et responsable.\n\n2. Exactitude des informations\nChaque utilisateur est responsable des informations qu'il possède ou publie.\n\n3. Protection du compte\nL'utilisateur est responsable de son numéro de téléphone, de son mot de passe.\n\n4. Contenus interdits\nIl est interdit de publier des contenus frauduleux ou trompeurs.\n\nNIA RDC se réserve le droit de supprimer tout contenu non conforme.`,
  apropos: `À propos : À propos de NIA RDC\n\nBienvenue sur NIA RDC.\n\nNIA RDC est une plateforme numérique conçue pour faciliter la mise en relation immobilière en République Démocratique du Congo.`,
  confidentialite: `Politique de confidentialité : Politique de confidentialité de NIA RDC\n\nDernière mise à jour : Juin 2026.\n\nLa protection des informations personnelles de nos utilisateurs est importante.`
};

function brancherEvenementScrollControle() {
  const box = document.getElementById("cgu-scroller-node");
  if (!box) return;
  box.addEventListener("scroll", () => {
    const chk = document.getElementById("chk-accept-rules");
    if (box.scrollHeight - box.scrollTop <= box.clientHeight + 12) {
      if(chk) chk.removeAttribute("disabled");
    }
  });
}

document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "chk-accept-rules") {
    const btn = document.getElementById("btn-register-action");
    if(btn) {
      if(e.target.checked) btn.removeAttribute("disabled");
      else btn.setAttribute("disabled", "true");
    }
  }
});

function toggleMenuLegal() {
  const m = document.getElementById("legal-dropdown"); m.style.display = m.style.display === "block" ? "none" : "block";
}

function afficherDocumentJurisEtSecu(cle) {
  document.getElementById("legal-header-title").textContent = cle === "securite" ? "Sécurité & CGU" : cle === "apropos" ? "À propos de nous" : "Confidentialité";
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
    document.getElementById("cgu-scroller-node").innerHTML = TEXTES_DU_DROIT.securite.replace(/\n/g, "<br>");
    document.getElementById("chk-accept-rules").checked = false;
    document.getElementById("chk-accept-rules").setAttribute("disabled", "true");
    document.getElementById("btn-register-action").setAttribute("disabled", "true");
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
  if(id === "profil") { basculerOngletProfil(ONGLET_PROFIL_ACTIF); chargerAlertesAdmin(); chargerConversationsPrivees(); }
}

function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }
function deconnexion() { localStorage.clear(); window.location.reload(); }

async function suppressionDefinitiveCompte() {
  if (confirm("Supprimer irréversiblement votre compte ? Tout sera perdu.")) {
    await fetch(`${API}/auth/delete-account`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: localStorage.getItem("nia_user_id") })
    });
    deconnexion();
  }
}

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
    window.location.reload();
  } else alert(data.error);
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
  const canvasDevise = document.getElementById("devise").value;
  const canvasPeriode = document.getElementById("periode").value;
  const statut = document.getElementById("statut").value;
  const telephone = document.getElementById("telephone").value.trim();
  const description = document.getElementById("description").value.trim();
  const ville = document.getElementById("ville").value.trim();
  const commune = document.getElementById("commune").value.trim();
  const files = document.getElementById("photos-input").files;

  if(!titre || !telephone) return alert("Le titre et le contact sont obligatoires.");
  
  let images_base64 = [];
  for(let i=0; i<files.length; i++) { images_base64.push(await traiterFichierEnBase64(files[i])); }

  await fetch(`${API}/annonces`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"), titre, prix, devise: canvasDevise, periode: canvasPeriode, statut, telephone, description, ville, commune, quartier:"", is_vip: false, images_base64
    })
  });
  fermerModal("publier"); chargerFluxPrincipal();
}

async function chargerFluxPrincipal() {
  try {
    const res = await fetch(`${API}/feed`); toutesLesAnnonces = await res.json();
    rendreFluxHtml(toutesLesAnnonces);
  } catch(e) { document.getElementById("feed").innerHTML = "Erreur de connexion au serveur."; }
}

function rendreFluxHtml(liste) {
  const container = document.getElementById("feed"); container.innerHTML = "";
  if(liste.length === 0) { container.innerHTML = "<p style='text-align:center; color:gray;'>Aucun bien immobilier à afficher.</p>"; return; }

  liste.forEach(a => {
    let imagesMarkup = (a.images && a.images.length > 0) ? `<div class="gallery">${a.images.map(i => `<img src="${i.url}">`).join("")}</div>` : "";
    const isOwner = a.user_id == localStorage.getItem("nia_user_id");
    
    container.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="badge-vip">👑 AGENCE VIP</div>` : ""}
        <h3 style="margin:0 0 4px 0;">${a.titre}</h3>
        <div class="price-tag">${a.prix} ${a.devise} <span style="font-size:0.8rem; color:var(--text-light)">/ ${a.periode}</span></div>
        <div style="font-size:0.85rem; color:var(--text-light); margin-bottom:6px;">📍 Localisation: ${a.ville} ${a.commune ? '- '+a.commune : ''} | Contact: ${a.telephone}</div>
        <div style="font-size:0.9rem; background:#f8fafc; padding:10px; border-radius:6px; margin:8px 0; border-left:3px solid var(--primary)">${a.description || 'Pas de description.'}</div>
        ${imagesMarkup}
        <div class="card-footer">
          <span class="${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">
            ${a.statut === 'occupe' ? '🔴 Occupé actuellement' : '🟢 Disponible'}
          </span>
          <div style="display:flex; gap:4px;">
            <button class="btn-action report" onclick="signalerAnnonce(${a.id})">⚠️ Signaler</button>
            ${isOwner ? '' : `<button class="btn-action chat" onclick="ouvrirMessagerieDirecteInstantane(${a.id}, '${a.titre.replace(/'/g, "\\'")}')">💬 Message</button>`}
            <button class="btn-action call" onclick="window.location.href='tel:${a.telephone}'">📞 Appeler</button>
          </div>
        </div>
      </div>`;
  });
}

// ENVOI MESSAGE PRIVÉ DIRECT (STYLE 2EMEMAIN)
async function ouvrirMessagerieDirecteInstantane(annonceId, titreAnnonce) {
  if(!localStorage.getItem("nia_user_id")) return ouvrirSecuriseAuth(false);
  const text = prompt(`Écrire votre message privé pour le bien : "${titreAnnonce}"`);
  if(!text || !text.trim()) return;

  const res = await fetch(`${API}/chat/send`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      annonce_id: annonceId, expediteur_id: localStorage.getItem("nia_user_id"), contenu: text
    })
  });
  if(res.ok) alert("Message privé envoyé au propriétaire ! Suivez la conversation dans votre Profil.");
  else alert("Erreur d'envoi. Assurez-vous que le propriétaire a un compte.");
}

async function chargerConversationsPrivees() {
  const uid = localStorage.getItem("nia_user_id"); if(!uid) return;
  const res = await fetch(`${API}/chat/conversations/${uid}`);
  const data = await res.json();
  const box = document.getElementById("chat-conversations-list");
  if(data.length === 0) { box.innerHTML = "Aucun message en cours."; return; }

  box.innerHTML = data.map(c => `
    <div style="background:white; padding:8px; border-radius:6px; border:1px solid var(--border); font-size:0.85rem;">
      <div style="font-weight:bold; color:var(--primary);">Sujet : ${c.annonce_titre}</div>
      <div style="color:var(--text-light); font-size:0.75rem;">De : ${c.expediteur_tel} ➔ À : ${c.destinataire_tel}</div>
      <div style="background:#f1f5f9; padding:6px; border-radius:4px; font-style:italic; margin-top:4px; color:var(--text)">"${c.contenu}"</div>
    </div>`).join("");
}

function executerRecherche() {
  const kw = document.getElementById("search-keyword").value.toLowerCase();
  const vi = document.getElementById("search-ville").value.toLowerCase();
  let matches = toutesLesAnnonces.filter(a => (kw === "" || a.titre.toLowerCase().includes(kw)) && a.ville.toLowerCase().includes(vi));
  document.getElementById("btn-clear-search").style.display = "block";
  document.getElementById("feed-current-title").textContent = `Résultats (${matches.length})`;
  fermerModal("rechercher"); rendreFluxHtml(matches);
}

function reinitialiserFluxGeneral() {
  document.getElementById("btn-clear-search").style.display = "none";
  document.getElementById("feed-current-title").textContent = "Annonces récentes";
  rendreFluxHtml(toutesLesAnnonces);
}

async function signalerAnnonce(id) {
  const raison = prompt("Quel est le problème de sécurité détecté ?"); if(!raison) return;
  await fetch(`${API}/annonces/${id}/signaler`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raison })
  });
  alert("Signalement reçu par notre département sécurité.");
}

// FORMULAIRE DU CATALOGUE MULTI-VIP COMPLET PERSISTANT
function rafraichirVueVipFormulaire() {
  const s = document.getElementById("vip-setup-zone");
  const nomVip = localStorage.getItem("nia_vip_company_name");
  
  if(!nomVip) {
    s.innerHTML = `
      <div class="grid-2">
        <div class="form-box full-width"><label>Nom de l'Agence Immobilière Professionnelle</label><input id="v-name" placeholder="Ex: Horizon Immobilier RDC"></div>
        <div class="form-box full-width"><label>Téléphone Contact Pro</label><input id="v-tel" type="tel" value="${localStorage.getItem("nia_user_tel") || ''}"></div>
        <div class="form-box full-width"><button class="btn-auth" style="background:var(--vip-gold); padding:12px;" onclick="localStorage.setItem('nia_vip_company_name', document.getElementById('v-name').value); localStorage.setItem('nia_vip_company_tel', document.getElementById('v-tel').value); rafraichirVueVipFormulaire();">Activer mon Espace Agence VIP 👑</button></div>
      </div>`;
  } else {
    s.innerHTML = `
      <div style="font-weight:bold; color:var(--vip-gold); text-align:center; margin-bottom:12px;">Compte VIP Professionnel : ${nomVip}</div>
      <div id="vip-multi-blocks" style="display:flex; flex-direction:column; gap:12px;"></div>
      <button class="btn-auth sec" style="width:100%; margin-top:10px;" onclick="ajouterBlocObjetAuCatalogueVip()">➕ Ajouter un logement à la vitrine</button>
      <button class="btn-auth" style="width:100%; margin-top:6px; background:var(--vip-gold);" onclick="sauvegarderEtPublierToutLeCatalogueVip()">Mettre en ligne toute la Vitrine VIP 🚀</button>`;
    BLOCS_VIP_COMPTEUR = 0; ajouterBlocObjetAuCatalogueVip();
  }
}

function ajouterBlocObjetAuCatalogueVip() {
  BLOCS_VIP_COMPTEUR++;
  const container = document.getElementById("vip-multi-blocks");
  const row = document.createElement("div");
  row.className = "vip-pure-block"; row.id = `vip-b-${BLOCS_VIP_COMPTEUR}`;
  row.style = "background:#f8fafc; border:2px dashed var(--vip-gold); padding:12px; border-radius:8px; display:flex; flex-direction:column; gap:8px;";
  row.innerHTML = `
    <div style="font-weight:bold; font-size:0.75rem; color:var(--vip-gold);">🏠 LOGEMENT COMPOSANT #${BLOCS_VIP_COMPTEUR}</div>
    <input class="vip-in-titre" placeholder="Titre abrégé de cet objet *">
    <div style="display:flex; gap:4px;">
      <input class="vip-in-prix" type="number" placeholder="Prix" style="width:60%;">
      <select class="vip-in-periode" style="width:40%;"><option value="jour">/ Jour</option><option value="heure">/ Heure</option></select>
    </div>
    <div style="display:flex; gap:4px; align-items:center;">
      <label style="font-size:0.75rem; font-weight:bold;">Disponibilité actuelle :</label>
      <select class="vip-in-statut"><option value="disponible">🟢 Disponible</option><option value="occupe">🔴 Occupé</option></select>
    </div>
    <textarea class="vip-in-desc" placeholder="Caractéristiques, nombre de chambres..." rows="2"></textarea>
    <div class="form-box"><label style="font-size:0.7rem; color:var(--text-light);">Photos de ce logement spécifique :</label><input type="file" class="vip-in-photos" multiple accept="image/*"></div>`;
  container.appendChild(row);
}

async function sauvegarderEtPublierToutLeCatalogueVip() {
  const nodes = document.querySelectorAll(".vip-pure-block");
  const proTel = localStorage.getItem("nia_vip_company_tel");
  
  for(let n of nodes) {
    const titre = n.querySelector(".vip-in-titre").value.trim();
    const prix = n.querySelector(".vip-in-prix").value.trim();
    const periode = n.querySelector(".vip-in-periode").value;
    const statut = n.querySelector(".vip-in-statut").value;
    const description = n.querySelector(".vip-in-desc").value.trim();
    const photoFiles = n.querySelector(".vip-in-photos").files;

    if(!titre) continue;

    let images_base64 = [];
    if(photoFiles) {
      for(let f=0; f<photoFiles.length; f++) { images_base64.push(await traiterFichierEnBase64(photoFiles[f])); }
    }

    await fetch(`${API}/annonces`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: localStorage.getItem("nia_user_id"), titre, prix, devise:"$", periode, statut, telephone: proTel, description, ville:"Lubumbashi", is_vip: true, images_base64
      })
    });
  }
  fermerModal("vip"); chargerFluxPrincipal();
}

// MANAGEMENT INTEGRAL DES ACTIONS PROPRIÉTAIRES DANS L'ESPACE PRIVÉ
function basculerOngletProfil(mode) {
  ONGLET_PROFIL_ACTIF = mode;
  document.getElementById("btn-tab-std").className = mode === "standard" ? "btn-auth" : "btn-auth sec";
  document.getElementById("btn-tab-vip").className = mode === "vip" ? "btn-auth" : "btn-auth sec";
  
  const targetTel = mode === "vip" ? localStorage.getItem("nia_vip_company_tel") : localStorage.getItem("nia_user_tel");
  const listDiv = document.getElementById("profil-annonces-list");
  
  if(!targetTel) { listDiv.innerHTML = "<p style='color:gray; text-align:center;'>Aucune offre enregistrée.</p>"; return; }
  
  let userList = toutesLesAnnonces.filter(a => a.telephone === targetTel && a.is_vip === (mode === "vip"));
  if(userList.length === 0) { listDiv.innerHTML = "<p style='color:gray; text-align:center;'>Aucun bien identifié.</p>"; return; }

  listDiv.innerHTML = userList.map(a => `
    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <div style="font-weight:bold; font-size:0.9rem;">${a.titre} - ${a.prix} ${a.devise} / ${a.periode} [${a.statut === 'occupe' ? '🔴' : '🟢'}]</div>
        <button class="btn-auth" style="background:orange; font-size:0.75rem; padding:4px 8px;" onclick="executerProcessusInterstitielBoost(${a.id})">🚀 Booster</button>
      </div>
      <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:8px; border-top:1px dashed var(--border); padding-top:6px;">
        <button class="btn-auth sec" style="font-size:0.75rem; padding:4px 8px;" onclick='ouvrirFenetreModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})'>✏️ Modifier / Photos</button>
        <button class="btn-auth" style="background:var(--danger); font-size:0.75rem; padding:4px 8px;" onclick="supprimerAnnonceProfil(${a.id})">🗑️ Supprimer</button>
      </div>
    </div>`).join("");
}

function executerProcessusInterstitielBoost(id) {
  const m = document.getElementById("modal-adsense-interstitiel");
  const t = document.getElementById("adsense-timer-node");
  m.style.display = "flex";
  let reste = 5;
  t.innerHTML = `📢 [MOTEUR DE PROPULSION ACTIVE]<br><br>Traitement algorithmique du boost en cours...<br>Retour au catalogue dans <b>${reste}s</b>.`;
  
  const timer = setInterval(async () => {
    reste--;
    if(reste <= 0) {
      clearInterval(timer); m.style.display = "none";
      await fetch(`${API}/annonces/${id}/boost`, { method: "POST" });
      alert("Votre bien est désormais affiché en tête de liste !"); fermerModal("profil"); chargerFluxPrincipal();
    } else {
      t.innerHTML = `📢 [MOTEUR DE PROPULSION ACTIVE]<br><br>Traitement algorithmique du boost en cours...<br>Retour au catalogue dans <b>${reste}s</b>.`;
    }
  }, 1000);
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
  
  const imgBox = document.getElementById("edit-photos-container"); imgBox.innerHTML = "";
  if(a.images && a.images.length > 0) {
    a.images.forEach(i => {
      imgBox.innerHTML += `
        <div class="photo-edit-preview" id="node-img-view-${i.id}">
          <img src="${i.url}">
          <div class="photo-delete-overlay" onclick="supprimerPhotoIndividuelleAnnonce(${i.id})">✕</div>
        </div>`;
    });
  } else { imgBox.innerHTML = "<span style='color:gray; font-size:0.8rem;'>Pas de photo sur cette annonce.</span>"; }
  ouvrirModal("modifier");
}

async function supprimerPhotoIndividuelleAnnonce(imageId) {
  if(confirm("Supprimer cette photo définitivement de l'annonce ?")) {
    const res = await fetch(`${API}/images/${imageId}`, { method: "DELETE" });
    if(res.ok) {
      const el = document.getElementById(`node-img-view-${imageId}`);
      if(el) el.remove();
    }
  }
}

async function sauvegarderChangementsAnnonce() {
  const id = document.getElementById("edit-id").value;
  const newFiles = document.getElementById("edit-new-photos").files;
  
  let nouvelles_images_base64 = [];
  if(newFiles) {
    for(let f=0; f<newFiles.length; f++) { nouvelles_images_base64.push(await traiterFichierEnBase64(newFiles[f])); }
  }

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
      ville: "Lubumbashi", commune:"", nouvelles_images_base64
    })
  });
  fermerModal("modifier"); fermerModal("profil"); chargerFluxPrincipal();
}

async function supprimerAnnonceProfil(id) { if(confirm("Supprimer définitivement cette offre ?")) { await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); fermerModal("profil"); chargerFluxPrincipal(); } }

// BOITE DES ALERTES ADMINISTRATIVES AVEC ENVOI DE JUSTIFICATION
async function chargerAlertesAdmin() {
  const uid = localStorage.getItem("nia_user_id"); if(!uid) return;
  const res = await fetch(`${API}/user/${uid}/messages`); const data = await res.json();
  const c = document.getElementById("admin-alerts-container");
  if(data.length === 0) { c.innerHTML = "Aucun message administratif."; return; }
  c.innerHTML = data.map(m => `
    <div style="border-bottom:1px solid #cbd5e1; padding-bottom:6px; margin-bottom:6px; color:var(--text)">
      <b>🚨 Alerte Admin [Contexte: ${m.provenance_contexte}] :</b> ${m.message}
      ${m.reponse_utilisateur ? `<div style="color:var(--success); font-weight:bold; padding-left:10px; font-size:0.8rem;">Ma justification : ${m.reponse_utilisateur}</div>` : `
        <div style="margin-top:4px; display:flex; gap:4px;"><input id="alert-rep-${m.id}" placeholder="Entrez votre justification ici..." style="font-size:0.8rem; flex:1; padding:4px;"><button class="btn-auth" onclick="soumettreReponseJustificative(${m.id})" style="font-size:0.75rem; padding:4px 8px;">Justifier</button></div>`}
    </div>`).join("");
}

async function soumettreReponseJustificative(id) {
  const txt = document.getElementById(`alert-rep-${id}`).value.trim(); if(!txt) return;
  await fetch(`${API}/user/reply-message/${id}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reponse: txt })
  });
  chargerAlertesAdmin();
}

function detecterClicLongAdmin() { validationAdminOk = false; topAdminTimer = setTimeout(() => { validationAdminOk = true; }, 4000); }
function annulerClicLongAdmin() {
  clearTimeout(topAdminTimer);
  if(validationAdminOk) {
    validationAdminOk = false;
    if (prompt("Entrez le code Super-Administrateur Secrétariat :") === "BEN4002ET4200") { ouvrirModal("admin"); definirVueAdmin("flux"); }
  }
}

// INTERFACE ADMIN ET ROUTAGE DES LOGS AVEC OPTION JUSTIFICATION FILTRÉE
async function definirVueAdmin(mode) {
  VUE_ADMIN_ACTIVE = mode; const box = document.getElementById("admin-main-render-box"); box.innerHTML = "Mise à jour des logs...";
  
  if(mode === "flux") {
    box.innerHTML = toutesLesAnnonces.map(a => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem;">
        <span><b>${a.titre}</b> (Tel: ${a.telephone})</span>
        <div style="display:flex; gap:4px; margin-top:4px;">
          <input id="adm-input-${a.telephone}" placeholder="Rédiger un avertissement..." style="flex:1; color:black; padding:4px;">
          <button onclick="envoyerMessageAvertissementCible('${a.telephone}', 'normal')" style="background:var(--success); color:white; border:none; padding:4px 8px; cursor:pointer;">Notifier</button>
          <button onclick="supprimerAnnonceParAdmin(${a.id})" style="background:var(--danger); color:white; border:none; padding:4px 8px; cursor:pointer;">🗑️ Supprimer</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "signaux") {
    const res = await fetch(`${API}/admin/reports`); const data = await res.json();
    box.innerHTML = data.map(r => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; border-left:4px solid var(--danger); font-size:0.85rem;">
        <div style="color:#f87171; font-weight:bold;">🚨 MOTIF : "${r.raison}"</div>
        <span>Annonce : ${r.titre} | Tel unique : ${r.telephone}</span>
        <div style="display:flex; gap:4px; margin-top:4px;">
          <input id="adm-input-${r.telephone}" placeholder="Exiger des comptes..." style="flex:1; color:black; padding:4px;">
          <button onclick="envoyerMessageAvertissementCible('${r.telephone}', 'signale')" style="background:orange; color:white; border:none; padding:4px 8px; cursor:pointer;">Exiger Justif</button>
          <button onclick="supprimerAnnonceParAdmin(${r.id})" style="background:var(--danger); color:white; border:none; padding:4px 8px; cursor:pointer;">Bannir</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "reponses_normales" || mode === "justifications") {
    const ctx = mode === "reponses_normales" ? "normal" : "signale";
    const res = await fetch(`${API}/admin/replied-messages/${ctx}`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "Aucune réponse reçue pour cet onglet."; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem;">
        <div style="color:#94a3b8;"><b>Compte [Tel: ${m.user_tel}] - Message Admin :</b> ${m.message}</div>
        <div style="color:#4ade80; margin-top:4px;"><b>↩️ Justification Reçue :</b> "${m.reponse_utilisateur}"</div>
      </div>`).join("");
  }
}

async function envoyerMessageAvertissementCible(tel, ctx) {
  const msg = document.getElementById(`adm-input-${tel}`).value.trim(); if(!msg) return;
  await fetch(`${API}/admin/message`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel: tel, message: msg, is_global: false, provenance_contexte: ctx })
  });
  alert("Message envoyé."); definirVueAdmin(VUE_ADMIN_ACTIVE);
}

async function diffuserNotificationGlobale() {
  const msg = document.getElementById("admin-global-txt").value.trim(); if(!msg) return;
  await fetch(`${API}/admin/message`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel: "", message: msg, is_global: true, provenance_contexte: "normal" })
  });
  alert("Alerte flash envoyée."); document.getElementById("admin-global-txt").value = "";
}

async function supprimerAnnonceParAdmin(id) { if(confirm("Valider la suppression administrative ?")) { await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); chargerFluxPrincipal(); setTimeout(() => definirVueAdmin(VUE_ADMIN_ACTIVE), 400); } }

setInterval(chargerFluxPrincipal, 20000);
document.addEventListener("DOMContentLoaded", () => { rafraichirHeaderVisuel(); chargerFluxPrincipal(); });
