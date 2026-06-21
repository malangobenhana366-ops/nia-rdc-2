const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let VUE_ADMIN_ACTIVE = "flux";
let ONGLET_PROFIL_ACTIF = "standard";
let BLOCS_VIP_COMPTEUR = 0;
let topAdminTimer = null;
let validationAdminOk = false;

// RÉINTÉGRATION STRICTE DES PAGES DE SÉCURITÉ ET TEXTES COMPLETS SANS PERTE
const TEXTES_DU_DROIT = {
  securite: `Conditions de sécurité et d'utilisation de NIA RDC\n\nBienvenue sur NIA RDC.\n\nAvant de créer un compte, veuillez lire les présentes conditions. En utilisant la plateforme, vous acceptez les règles suivantes.\n\n1. Utilisation de la plateforme\nNIA RDC is une plateforme destinée à faciliter la publication et la consultation d'annonces de location, de vente et de services. Les utilisateurs s'engagent à utiliser la plateforme de manière honnête et responsable.\n\n2. Exactitude des informations\nChaque utilisateur est responsable des informations qu'il publie. Les annonces doivent être exactes et ne pas contenir d'informations trompeuses ou mensongères.\n\n3. Protection du compte\nL'utilisateur est responsable de la confidentialité de son numéro de téléphone, de son mot de passe et des activités réalisées depuis son compte.\n\n4. Contenus interdits\nIl est interdit de publier des contenus :\n- contraires aux lois en vigueur ;\n- frauduleux ou trompeurs ;\n- portant atteinte aux droits d'autrui ;\n- contenant des informations fausses ou usurpant l'identité d'une autre personne.\n\nNIA RDC se réserve le droit de supprimer tout contenu non conforme.\n\n5. Photos et annonces\nL'utilisateur garantit qu'il possède les droits nécessaires sur les photos et les informations publiées et autorise leur affichage sur la plateforme.\n\n6. Protection des données\nNIA RDC collecte uniquement les informations nécessaires au fonctionnement du service, notamment les informations de compte et les données liées aux annonces publiées.\n\n7. Sécurité\nNIA RDC met en œuvre des mesures techniques raisonnables pour protéger les données des utilisateurs. Toutefois, aucun système informatique ne peut garantir une sécurité absolue.\n\n8. Responsabilité\nNIA RDC agit comme plateforme de mise en relation et n'est pas partie aux accords conclus entre les utilisateurs. Chaque utilisateur est responsable des transactions et échanges qu'il réalise.\n\n9. Modération\nNIA RDC peut suspendre ou supprimer un compte ou une annonce en cas de non-respect des présentes conditions ou pour protéger la sécurité de la communauté.\n\n10. Évolution des conditions\nCes conditions peuvent être mises à jour afin d'améliorer le fonctionnement et la sécurité de la plateforme. Les nouvelles versions prendront effet dès leur publication.\n\nAcceptation\nEn créer un compte sur NIA RDC, je reconnais avoir lu les présentes conditions de sécurité et d'utilisation et j'accepte de les respecter.`,
  apropos: `À propos : À propos de NIA RDC\n\nBienvenue sur NIA RDC.\n\nNIA RDC est une plateforme numérique conçue pour faciliter la mise en relation entre les personnes souhaitant louer, proposer ou rechercher des biens et des services en République Démocratique du Congo.\n\nNotre objectif est de rendre les échanges plus simples, rapides et accessibles grâce à une plateforme facile à utiliser, adaptée aussi bien aux particuliers qu'aux professionnels.\n\nNotre mission\nNotre mission est de permettre à chacun de trouver ou de proposer des objets, équipements et services en toute simplicité, tout en favorisant les opportunités économiques locales.\n\nCe que propose NIA RDC\nLes utilisateurs peuvent notamment :\n- publier des annonces ;\n- consulter les annonces disponibles ;\n- contacter les annonceurs ;\n- rechercher des biens et services selon leurs besoins.\n\nLa plateforme évolue régulièrement afin d'offrir de nouvelles fonctionnalités et une meilleure expérience utilisateur.\n\nNos valeurs\nNIA RDC s'appuie sur plusieurs principes :\n- simplicité ;\n- accessibilité ;\n- respect des utilisateurs ;\n- innovation ;\n- amélioration continue.\n\nNotre engagement\nNous travaillons à maintenir une plateforme fiable et agréable à utiliser. Nous encourageons les utilisateurs à publier des informations exactes et à respecter les règles de la communauté.\n\nNotre vision\nNous souhaitons contribuer au développement des échanges et des services numériques en République Démocratique du Congo en proposant une plateforme moderne et évolutive.\n\nContact\nPour toute question ou suggestion, les utilisateurs peuvent contacter l'équipe de NIA RDC par les moyens de communication disponibles sur la plateforme.\n\nMerci de votre confiance et de votre participation au développement de NIA RDC.`,
  confidentialite: `Politique de confidentialité : Politique de confidentialité de NIA RDC\n\nDernière mise à jour : Juin 2026.\n\nBienvenue sur NIA RDC.\n\nLa protection des informations personnelles de nos utilisateurs est importante. Cette politique explique quelles informations sont collectées, pourquoi elles sont utilisées et les droits des utilisateurs.\n\n1. Informations collectées\nLors de l'utilisation de NIA RDC, certaines informations peuvent être collectées, notamment :\n- le numéro de téléphone fourni lors de l'inscription ;\n- le mot de passe du compte, protégé par des mesures de sécurité ;\n- les annonces publiées ;\n- les photos et images ajoutées aux annonces ;\n- les informations de contact renseignées dans les annonces ;\n- les informations techniques nécessaires au fonctionnement de la plateforme.\n\n2. Utilisation des informations\nLes informations collectées servent à :\n- créer et gérer les comptes utilisateurs ;\n- publier et afficher les annonces ;\n- améliorer les services proposés ;\n- assurer la sécurité de la plateforme ;\n- prévenir les activités frauduleuses ;\n- répondre aux demandes des utilisateurs.\n\n3. Partage des informations\nNIA RDC ne vend pas les informations personnelles des utilisateurs.\nCertaines informations publiées volontairement dans les annonces, comme les photos ou les numéros de contact, peuvent être visibles par les autres utilisateurs de la plateforme.\nLes informations pourront être communiquées si la loi l'exige ou pour protéger les droits et la sécurité de NIA RDC et de ses utilisateurs.\n\n4. Conservation des données\nLes informations sont conservées aussi longtemps que nécessaire au fonctionnement de la plateforme et au respect des obligations légales.\n\n5. Sécurité\nNIA RDC met en œuvre des mesures raisonnables pour protéger les informations des utilisateurs contre les accès non autorisés, les pertes ou les utilisations abusives.\nToutefois, aucune technologie ne peut garantir une sécurité absolue sur Internet.\n\n6. Cookies et technologies similaires\nNIA RDC peut utiliser des cookies et des technologies similaires afin d'améliorer l'expérience utilisateur, de mesurer les performances du service et d'afficher des contenus ou publicités adaptés.\n\n7. Publicités\nNIA RDC peut afficher des annonces publicitaires afin de financer le fonctionnement de la plateforme.\nDes partenaires publicitaires peuvent utiliser des technologies conformes à leurs propres politiques de confidentialité et aux lois applicables.\n\n8. Droits des utilisateurs\nChaque utilisateur peut demander, dans les limites prévues par la loi :\n- l'accès à ses informations ;\n- la correction d'informations inexactes ;\n- la suppression de certaines données ;\n- la fermeture de son compte.\n\n9. Modifications\nCette politique de confidentialité peut être mise à jour afin de suivre les évolutions de la plateforme ou des exigences légales.\nLes modifications prendront effet dès leur publication sur NIA RDC.\n\n10. Contact\nPour toute question concernant cette politique de confidentialité ou le traitement des données personnelles, les utilisateurs peuvent contacter l'équipe de NIA RDC par les moyens de communication mis à disposition sur la plateforme.\n\nAcceptation\nEn utilisant NIA RDC et en créant un compte, l'utilisateur reconnaît avoir pris connaissance de la présente Politique de confidentialité et accepte les conditions qui y sont décrites.`
};

// SÉCURITÉ : FORCE LE DÉFILEMENT POUR ACTIVER LA CASE À COCHER
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
  if(id === "profil") { basculerOngletProfil(ONGLET_PROFIL_ACTIF); doubleBoiteReceptionAdministration(); chargerConversationsPrivees(); }
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

// INTAKE ENVOI FORMULAIRES AUTH
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

// FORMATTAGE PHOTO COMPRESSÉ BASE64
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

// AJOUT ANNONCE STANDARD
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

  if(!titre || !telephone) return alert("Le titre et le numéro de contact sont indispensables.");
  
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

// CHARGEMENT ET RENDU DU COMPORTEMENT VISUEL DES CARTES
async function chargerFluxPrincipal() {
  try {
    const res = await fetch(`${API}/feed`); toutesLesAnnonces = await res.json();
    rendreFluxHtml(toutesLesAnnonces);
  } catch(e) { document.getElementById("feed").innerHTML = "Le serveur ne répond pas."; }
}

function rendreFluxHtml(liste) {
  const container = document.getElementById("feed"); container.innerHTML = "";
  if(liste.length === 0) { container.innerHTML = "<p style='text-align:center; color:gray;'>Aucun bien immobilier à afficher.</p>"; return; }

  liste.forEach(a => {
    let imagesMarkup = (a.images && a.images.length > 0) ? `<div class="gallery">${a.images.map(imgObj => `<img src="${imgObj.url}">`).join("")}</div>` : "";
    const isOwner = a.user_id == localStorage.getItem("nia_user_id");
    
    container.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="badge-vip">👑 AGENCE VIP</div>` : ""}
        <h3 style="margin:0 0 4px 0;">${a.titre}</h3>
        <div class="price-tag">${a.prix} ${a.devise} <span style="font-size:0.8rem; color:var(--text-light)">/ par ${a.periode}</span></div>
        <div style="font-size:0.85rem; color:var(--text-light); margin-bottom:6px;">📍 Localisation: ${a.ville} ${a.commune ? ' - '+a.commune : ''} | Pro: ${a.telephone}</div>
        <div style="font-size:0.9rem; background:#f8fafc; padding:10px; border-radius:6px; margin:8px 0; border-left:3px solid var(--primary)">${a.description || 'Aucune description fournie.'}</div>
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

// CORRECTION CORRESPONDANCE : MESSAGERIE STYLE 2EMEMAIN INTER-UTILISATEURS
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

// FILTRAGE ET REINITIALISATION
function executerRecherche() {
  const kw = document.getElementById("search-keyword").value.toLowerCase();
  const vi = document.getElementById("search-ville").value.toLowerCase();
  let matches = toutesLesAnnonces.filter(a => (kw === "" || a.titre.toLowerCase().includes(kw)) && a.ville.toLowerCase().includes(vi));
  document.getElementById("btn-clear-search").style.display = "block";
  document.getElementById("feed-current-title").textContent = `Résultats (${matches.length})`;
  fermerModal("rechercher"); rendreFluxHtml(matches);
}

// RE-POLUTION CLEAN GÉNÉRALE
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

// FORMULAIRE DU CATALOGUE MULTI-VIP
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

// CHANGEMENT DES FACETTES DE COMPTE AVEC ASSURANCE PERMANENCE SÉCURISÉE
async function basculerOngletProfil(mode) {
  ONGLET_PROFIL_ACTIF = mode;
  document.getElementById("btn-tab-std").className = mode === "standard" ? "btn-auth" : "btn-auth sec";
  document.getElementById("btn-tab-vip").className = mode === "vip" ? "btn-auth" : "btn-auth sec";
  
  const targetTel = mode === "vip" ? localStorage.getItem("nia_vip_company_tel") : localStorage.getItem("nia_user_tel");
  const listDiv = document.getElementById("profil-annonces-list");
  
  if(!targetTel) { listDiv.innerHTML = "<p style='color:gray; text-align:center;'>Aucune offre enregistrée.</p>"; return; }
  
  // Appel du point de terminaison global incluant l'archivage permanent
  const uid = localStorage.getItem("nia_user_id");
  const res = await fetch(`${API}/user/${uid}/annonces-all`);
  const maListeComplete = await res.json();
  
  let userList = maListeComplete.filter(a => a.telephone === targetTel && a.is_vip === (mode === "vip"));
  if(userList.length === 0) { listDiv.innerHTML = "<p style='color:gray; text-align:center;'>Aucun bien identifié.</p>"; return; }

  listDiv.innerHTML = userList.map(a => `
    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:8px; position:relative;">
      ${!a.permanent ? `<div style="position:absolute; top:4px; right:4px; background:#64748b; color:white; font-size:0.65rem; font-weight:bold; padding:2px 6px; border-radius:4px;">📦 Retiré du Flux (Permanent)</div>` : ''}
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <div style="font-weight:bold; font-size:0.9rem;">${a.titre} - ${a.prix} ${a.devise} / ${a.periode} [${a.statut === 'occupe' ? '🔴' : '🟢'}]</div>
        ${a.permanent ? `<button class="btn-auth" style="background:orange; font-size:0.75rem; padding:4px 8px;" onclick="executerProcessusInterstitielBoost(${a.id})">🚀 Booster</button>` : ''}
      </div>
      <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:8px; border-top:1px dashed var(--border); padding-top:6px;">
        <button class="btn-auth sec" style="font-size:0.75rem; padding:4px 8px;" onclick='ouvrirFenetreModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})'>✏️ Modifier / Photos</button>
        ${a.permanent ? `<button class="btn-auth" style="background:var(--danger); font-size:0.75rem; padding:4px 8px;" onclick="supprimerAnnonceProfil(${a.id})">🗑️ Retirer du Flux</button>` : `<button class="btn-auth" style="background:var(--success); font-size:0.75rem; padding:4px 8px;" onclick="remettreEnFluxPublic(${a.id})">🔄 Réactiver sur le flux</button>`}
      </div>
    </div>`).join("");
}

async function remettreEnFluxPublic(id) {
  await fetch(`${API}/annonces/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permanent_status_reactivate: true, id_target: id })
  });
  // fallback de réactivation directe de l'état permanent pour préserver l'intégrité
  await fetch(`${API}/annonces/${id}/boost`); 
  basculerOngletProfil(ONGLET_PROFIL_ACTIF); chargerFluxPrincipal();
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

// FENETRE DE MODIFICATION DE L'ANNONCE
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

async function supprimerAnnonceProfil(id) { if(confirm("Masquer cette annonce ? Elle restera accessible de manière permanente dans votre espace.")) { await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); fermerModal("profil"); chargerFluxPrincipal(); } }

// DOUBLE BOÎTE DE RÉCEPTION CENTRALISÉE POUR L'ESPACE PRIVÉ
async function doubleBoiteReceptionAdministration() {
  const uid = localStorage.getItem("nia_user_id"); if(!uid) return;
  const res = await fetch(`${API}/user/${uid}/messages`); const data = await res.json();
  
  const bGlobal = document.getElementById("box-admin-global");
  const bPrive = document.getElementById("box-admin-prive");
  
  // Filtrage des messages pour alimenter chaque boîte de réception
  const globaux = data.filter(m => m.is_global === true || m.message.includes("[SMS Global]"));
  const prives = data.filter(m => m.is_global === false && !m.message.includes("[SMS Global]"));
  
  // Rendu de la Boîte 1 : Messages Généraux Admin
  if(globaux.length === 0) {
    bGlobal.innerHTML = "<span style='color:gray; font-size:0.75rem;'>Aucun message général de l'administration.</span>";
  } else {
    bGlobal.innerHTML = globaux.map(m => `
      <div class="msg-item msg-global">
        <b>[ADMIN HAUT-PARLEUR] :</b> ${m.message.replace("[SMS Global] - ", "")}
        <div style="font-size:0.65rem; color:#64748b; margin-top:2px;">🚫 Message général : réponse impossible par SMS.</div>
      </div>`).join("");
  }
  
  // Rendu de la Boîte 2 : Conversations Privées avec option de réponse
  if(prives.length === 0) {
    bPrive.innerHTML = "<span style='color:gray; font-size:0.75rem;'>Aucune conversation privée en cours.</span>";
  } else {
    bPrive.innerHTML = prives.map(m => `
      <div class="msg-item msg-admin-prive">
        <b>[ALERTE SUPERVISION] :</b> ${m.message}
        ${m.reponse_utilisateur ? `
          <div style="background:#d1fae5; border-left:2px solid var(--success); padding:4px; border-radius:4px; margin-top:4px; font-weight:bold; color:var(--success);">
            ↩️ Ma réponse envoyée : "${m.reponse_utilisateur}"
          </div>` : `
          <div style="margin-top:6px; display:flex; gap:4px;">
            <input id="alert-rep-${m.id}" placeholder="Rédiger votre réponse à l'administration..." style="font-size:0.75rem; flex:1; padding:4px; border:1px solid var(--border); border-radius:4px;">
            <button class="btn-auth" onclick="soumettreReponseJustificative(${m.id})" style="font-size:0.7rem; padding:4px 8px; background:var(--danger);">Répondre</button>
          </div>`}
      </div>`).join("");
  }
}

async function soumettreReponseJustificative(id) {
  const txt = document.getElementById(`alert-rep-${id}`).value.trim(); if(!txt) return;
  await fetch(`${API}/user/reply-message/${id}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reponse: txt })
  });
  doubleBoiteReceptionAdministration();
}

function detecterClicLongAdmin() { validationAdminOk = false; topAdminTimer = setTimeout(() => { validationAdminOk = true; }, 4000); }
function annulerClicLongAdmin() {
  clearTimeout(topAdminTimer);
  if(validationAdminOk) {
    validationAdminOk = false;
    if (prompt("Entrez le code Super-Administrateur Secrétariat :") === "BEN4002ET4200") { ouvrirModal("admin"); definirVueAdmin("flux"); }
  }
}

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
          <input id="adm-input-${r.telephone}" placeholder="Demander des comptes..." style="flex:1; color:black; padding:4px;">
          <button onclick="envoyerMessageAvertissementCible('${r.telephone}', 'signale')" style="background:orange; color:white; border:none; padding:4px 8px; cursor:pointer;">Exiger Justif</button>
          <button onclick="supprimerAnnonceParAdmin(${r.id})" style="background:var(--danger); color:white; border:none; padding:4px 8px; cursor:pointer;">Bannir l'offre</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "reponses_normales" || mode === "justifications") {
    const ctx = mode === "reponses_normales" ? "normal" : "signale";
    const res = await fetch(`${API}/admin/replied-messages/${ctx}`); const data = await res.json();
    if(data.length === 0) { box.innerHTML = "Aucune réponse en attente de traitement."; return; }
    box.innerHTML = data.map(m => `
      <div style="background:#1e293b; padding:8px; border-radius:4px; font-size:0.85rem;">
        <div style="color:#94a3b8;"><b>Admin envoyé :</b> ${m.message}</div>
        <div style="color:#4ade80; margin-top:4px;"><b>↩️ Justification reçue :</b> "${m.reponse_utilisateur}"</div>
      </div>`).join("");
  }
}

async function envoyerMessageAvertissementCible(tel, ctx) {
  const msg = document.getElementById(`adm-input-${tel}`).value.trim(); if(!msg) return;
  await fetch(`${API}/admin/message`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel: tel, message: msg, is_global: false, provenance_contexte: ctx })
  });
  alert("Message d'avertissement envoyé."); definirVueAdmin(VUE_ADMIN_ACTIVE);
}

async function diffuserNotificationGlobale() {
  const msg = document.getElementById("admin-global-txt").value.trim(); if(!msg) return;
  await fetch(`${API}/admin/message`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel: "", message: "[SMS Global] - " + msg, is_global: true })
  });
  alert("Message flash global diffusé aux hauts-parleurs."); document.getElementById("admin-global-txt").value = "";
}

async function supprimerAnnonceParAdmin(id) { if(confirm("Valider la suppression administrative complète ?")) { await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" }); chargerFluxPrincipal(); setTimeout(() => definirVueAdmin(VUE_ADMIN_ACTIVE), 400); } }

// RE-POLLING SYNCHRONISÉ DU FLUX (20 SECONDES)
setInterval(chargerFluxPrincipal, 20000);
document.addEventListener("DOMContentLoaded", () => { rafraichirHeaderVisuel(); chargerFluxPrincipal(); });
