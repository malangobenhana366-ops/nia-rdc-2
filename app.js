const API = "https://nia-rdc-2.onrender.com"; 

let toutesLesAnnonces = [];
let tousLesSignalements = [];
let VUE_ADMIN_ACTUELLE = "flux"; // "flux" ou "signaux"
let ONGLE_PROFIL_ACTIF = "standard";
let BLOCS_VIP_COUNT = 0;
let adminTimer = null;
let tempsValide = false;
let yStart = 0;

// INJECTION INTÉGRALE DES TEXTES FOURNIS SANS MODIFICATION
const CHARTE_APROPOS = `À propos de NIA RDC

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

Merci de votre confiance et de votre participation au développement de NIA RDC.`;

const CHARTE_PRIVACY = `Politique de confidentialité de NIA RDC

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
En utilisant NIA RDC and en créant un compte, l'utilisateur reconnaît avoir pris connaissance de la présente Politique de confidentialité et accepte les conditions qui y sont décrites.`;

const CHARTE_CGU = `Conditions de sécurité et d'utilisation de NIA RDC

Bienvenue sur NIA RDC.
Avant de créer un compte, veuillez lire les présentes conditions. En utilisant la plateforme, vous acceptez les règles suivantes.

1. Utilisation de la plateforme
NIA RDC est une plateforme destinée à faciliter la publication et la consultation d'annonces de location, de vente et de services. Les utilisateurs s'engagent à utiliser la plateforme de manière honnête et responsable.

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
NIA RDC agit comme plateforme de mise en relation et n'est pas partie aux accords conclus entre les utilisateurs. Chaque utilisateur est responsable des transactions et échanges qu'il réalise.

9. Modération
NIA RDC peut suspendre ou supprimer un compte ou une annonce en cas de non-respect des présentes conditions ou pour protéger la sécurité de la communauté.

10. Évolution des conditions
Ces conditions peuvent être mises à jour afin d'améliorer le fonctionnement et la sécurité de la plateforme. Les nouvelles versions prendront effet dès leur publication.

Acceptation
En créant un compte sur NIA RDC, je reconnais avoir lu les présentes conditions de sécurité et d'utilisation et j'accepte de les respecter.`;

function detecterLectureConditionscomplet() {
  const box = document.getElementById("cgu-text-box");
  const checkbox = document.getElementById("auth-accept-rules");
  const btnSubmit = document.getElementById("register-submit-btn");
  if (box.scrollHeight - box.scrollTop <= box.clientHeight + 5) {
    checkbox.removeAttribute("disabled");
  }
}

document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "auth-accept-rules") {
    const btnSubmit = document.getElementById("register-submit-btn");
    if (e.target.checked) btnSubmit.removeAttribute("disabled");
    else btnSubmit.setAttribute("disabled", "true");
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
  }
}

function ouvrirModalSeccurisee(modalId) {
  if (!localStorage.getItem("nia_user_id")) declencherAuthentificationDynamique(false);
  else ouvrirModal(modalId);
}

function deconnecterUtilisateur() {
  localStorage.clear();
  alert("Session fermée.");
  window.location.reload();
}

async function supprimerCompteUtilisateur() {
  const userId = localStorage.getItem("nia_user_id");
  if(!userId) return;
  if (confirm("⚠️ Confirmez-vous la suppression définitive de votre compte ?")) {
    const res = await fetch(`${API}/auth/delete-account`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId })
    });
    if(res.ok) { localStorage.clear(); window.location.reload(); }
  }
}

function basculerModeAuth(versInscription) {
  document.getElementById("auth-title").textContent = versInscription ? "Créer un compte NIA RDC" : "Connexion";
  document.getElementById("auth-form-register").style.display = versInscription ? "grid" : "none";
  document.getElementById("auth-form-login").style.display = versInscription ? "none" : "grid";
}

async function executerInscription() {
  if (!document.getElementById("auth-accept-rules")?.checked) return alert("Veuillez accepter les conditions.");
  const telephone = val("auth-tel");
  const password = val("auth-pass");
  if (!telephone || !password) return alert("Remplissez les cases.");

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
    alert("Compte activé !");
    loadFeed();
  } else { alert(data.error); }
}

async function executerConnexion() {
  const telephone = val("login-tel");
  const password = val("login-pass");
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
  } else { alert(data.error); }
}

function toggleLeftDropdown() {
  const dropdown = document.getElementById("left-dropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function ouvrirModalLegal(type) {
  if(type === 'apropos') {
    document.getElementById("legal-title-display").textContent = "À propos de NIA RDC";
    document.getElementById("legal-body-display").textContent = CHARTE_APROPOS;
  } else {
    document.getElementById("legal-title-display").textContent = "Politique de Confidentialité";
    document.getElementById("legal-body-display").textContent = CHARTE_PRIVACY;
  }
  document.getElementById("modal-legal").style.display = "flex";
}

const TEXTES_PUB = [
  "⚡ Besoin de matériel ? Effectuez une recherche rapide par commune sur NIA RDC !",
  "🏢 Multipliez vos transactions immobilières en ouvrant votre Boutique VIP !",
  "📢 Passez votre annonce en quelques secondes et touchez des milliers de clients locaux."
];
let indexPub = 0;
function lancerBanniereAdsenseRotative() {
  setInterval(() => {
    indexPub = (indexPub + 1) % TEXTES_PUB.length;
    document.getElementById("adsense-rotative-banner").textContent = TEXTES_PUB[indexPub];
  }, 15000);
}

function val(id) { return document.getElementById(id)?.value?.trim() || ""; }

function optimiserEtCompresserImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > 600) { h = Math.round((h * 600) / w); w = 600; }
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
      ouvrirModal("admin"); 
      basculerVueAdmin('flux');
    }
  }
});

function inviterUtilisateurWhatsApp() {
  const lienApp = window.location.href;
  const message = encodeURIComponent(`Rejoins-nous sur NIA RDC pour louer en toute simplicité : ${lienApp}`);
  window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
}

async function chargerMessagesAdministratifsPrives() {
  const userId = localStorage.getItem("nia_user_id");
  if(!userId) return;
  try {
    const res = await fetch(`${API}/user/${userId}/messages`);
    const msgs = await res.json();
    const box = document.getElementById("admin-messages-box-container");
    if(msgs.length === 0) { box.innerHTML = "Aucun message reçu."; return; }
    box.innerHTML = msgs.map(m => `<div class="admin-msg-box"><b>[Admin]</b>: ${m.message}</div>`).join("");
  } catch(e){}
}

function rechercher() {
  const qTitre = val("search-titre"), qVille = val("search-ville");
  let res = toutesLesAnnonces.filter(a => {
    let mTitle = qTitre === "" || a.titre.toLowerCase().includes(qTitre.toLowerCase()) || (a.description && a.description.toLowerCase().includes(qTitre.toLowerCase()));
    let mVille = a.ville.toLowerCase().includes(qVille.toLowerCase());
    return mTitle && mVille;
  });
  fermerModal("rechercher");
  document.getElementById("feed-title").textContent = `Résultats (${res.length})`;
  afficherFlux(res, true);
}

function annulerRecherche() {
  document.getElementById("feed-title").textContent = "Annonces récentes";
  afficherFlux(toutesLesAnnonces, false);
}

async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    afficherFlux(toutesLesAnnonces, false);
  } catch (e) { document.getElementById("feed").innerHTML = "Erreur de chargement du flux."; }
}

function afficherFlux(liste, modeRecherche = false) {
  const feed = document.getElementById("feed");
  if (!feed) return; feed.innerHTML = "";
  document.getElementById("reset-btn").style.display = modeRecherche ? "block" : "none";
  if(liste.length === 0) { feed.innerHTML = "<p style='text-align:center; color:gray;'>Aucune annonce trouvée.</p>"; return; }

  liste.forEach(a => {
    let imagesHtml = "";
    if (a.images && a.images.length > 0) {
      imagesHtml = `<div class="gallery">${a.images.map(u => `<img src="${u}" class="gallery-item">`).join("")}</div>`;
    }
    feed.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="vip-badge-tag">👑 VIP</div>` : ""}
        <h3 style="margin:0 0 5px 0;">${a.titre}</h3>
        <div class="annonce-price">${a.prix} ${a.devise} / ${a.periode}</div>
        <div class="annonce-meta">📍 ${a.ville} - ${a.commune || ""}, ${a.quartier || ""}</div>
        <div class="annonce-description" onclick="this.classList.toggle('deployee')">${a.description || "Aucun détail complémentaire."}</div>
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

// UTILISATEUR OBLIGÉ DE JUSTIFIER LE SIGNALEMENT DE L'ANNONCE
async function signalerAnnonceAvecMotif(id) {
  const raison = prompt("Pourquoi signalez-vous cette annonce ? Veuillez écrire un texte explicatif :");
  if (!raison || raison.trim() === "") return alert("Le signalement a été annulé car aucun texte explicatif n'a été fourni.");
  
  const res = await fetch(`${API}/annonces/${id}/signaler`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raison: raison.trim() })
  });
  if(res.ok) alert("Merci, l'annonce a été signalée à l'administration avec votre motif.");
}

async function publier() {
  if (!val("titre") || !val("telephone")) return alert("Le titre et le téléphone sont obligatoires.");
  const files = document.getElementById("image")?.files;
  let images_base64 = [];
  if(files && files.length > 0) { 
    for(let i=0; i<files.length; i++) { 
      const b64 = await optimiserEtCompresserImage(files[i]);
      images_base64.push(b64);
    } 
  }
  localStorage.setItem("nia_standard_telephone", val("telephone"));

  const res = await fetch(`${API}/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: localStorage.getItem("nia_user_id"),
      titre: val("titre"), prix: val("prix"), devise: val("devise"), periode: val("periode"),
      telephone: val("telephone"), description: val("description"), ville: val("ville"),
      commune: val("commune"), quartier: val("quartier"), statut: val("statut"), is_vip: false, images_base64
    })
  });
  if (res.ok) { alert("Annonce en ligne !"); fermerModal("publier"); loadFeed(); }
}

function rafraichirEspaceVip() {
  const body = document.getElementById("vip-form-body");
  const nomBoutique = localStorage.getItem("nia_vip_nom");
  if (!nomBoutique) {
    body.innerHTML = `
      <div class="form-group full-width"><label>Nom de l'Espace / Vitrine VIP</label><input id="reg-vip-nom" placeholder="Ex: Maison de Commerce Express"></div>
      <div class="form-group full-width"><label>Téléphone par défaut</label><input id="reg-vip-tel" type="tel" placeholder="Ex: 0820000000"></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="creerBoutiqueVIP()">Activer mon Espace VIP 👑</button>`;
  } else {
    body.innerHTML = `
      <div style="background:var(--vip-bg); padding:10px; border-radius:8px; margin-bottom:12px; font-weight:bold; color:var(--vip-gold); text-align:center;">👑 CATALOGUE VIP : ${nomBoutique}</div>
      <div id="conteneur-blocs-annonces-vip"></div>
      <button class="modal-submit-btn" style="background:#475569; margin-bottom:8px;" onclick="ajouterNouveauBlocFormulaireVip()">➕ Ajouter un Produit au Catalogue</button>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="soumettreToutesLesAnnoncesVip()">🚀 Publier le Catalogue Actuel</button>`;
    BLOCS_VIP_COUNT = 0; ajouterNouveauBlocFormulaireVip();
  }
}

function creerBoutiqueVIP() {
  if(!val("reg-vip-nom") || !val("reg-vip-tel")) return alert("Veuillez remplir tous les champs.");
  localStorage.setItem("nia_vip_nom", val("reg-vip-nom"));
  localStorage.setItem("nia_vip_telephone", val("reg-vip-tel"));
  rafraichirEspaceVip();
}

function ajouterNouveauBlocFormulaireVip() {
  BLOCS_VIP_COUNT++;
  const conteneur = document.getElementById("conteneur-blocs-annonces-vip");
  const div = document.createElement("div");
  div.className = "vip-block-annonce";
  div.id = `vip-block-${BLOCS_VIP_COUNT}`;
  div.style = "background:#f8fafc; border:1px dashed #cbd5e1; padding:12px; border-radius:8px; margin-bottom:12px;";
  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.8rem; font-weight:bold; color:var(--vip-gold)">
      <span>📦 PRODUIT VIP N°${BLOCS_VIP_COUNT}</span>
      <button style="color:red; background:none; border:none; cursor:pointer;" onclick="document.getElementById('${div.id}').remove()">Supprimer</button>
    </div>
    <div class="form-grid">
      <div class="form-group full-width"><label>Nom de l'objet / service *</label><input class="vip-in-titre" required></div>
      <div class="form-group"><label>Prix</label>
        <div style="display:flex; gap:4px;"><input class="vip-in-prix" type="number" style="flex:2;"><select class="vip-in-devise" style="flex:1;"><option value="$">$</option><option value="FC">FC</option></select></div>
      </div>
      <div class="form-group"><label>Période</label><select class="vip-in-periode"><option value="jour">par jour</option><option value="heure">par heure</option></select></div>
      <div class="form-group"><label>Téléphone de contact *</label><input class="vip-in-tel" value="${localStorage.getItem("nia_vip_telephone")}"></div>
      <div class="form-group"><label>Commune</label><input class="vip-in-commune"></div>
      <div class="form-group full-width"><label>Description</label><textarea class="vip-in-desc"></textarea></div>
      <div class="form-group full-width"><label>Photos de l'article</label><input type="file" class="vip-in-photos" multiple accept="image/*"></div>
    </div>`;
  conteneur.appendChild(div);
}

async function soumettreToutesLesAnnoncesVip() {
  const blocs = document.querySelectorAll(".vip-block-annonce");
  if(blocs.length === 0) return alert("Ajoutez au moins un produit au catalogue.");
  let reussiteCount = 0;
  for (let b of blocs) {
    const titre = b.querySelector(".vip-in-titre").value.trim();
    const prix = b.querySelector(".vip-in-prix").value.trim();
    const devise = b.querySelector(".vip-in-devise").value;
    const periode = b.querySelector(".vip-in-periode").value;
    const telephone = b.querySelector(".vip-in-tel").value.trim();
    const description = b.querySelector(".vip-in-desc").value.trim();
    const commune = b.querySelector(".vip-in-commune").value.trim();
    const photoInput = b.querySelector(".vip-in-photos");

    if (!titre || !telephone) continue;
    let images_base64 = [];
    if(photoInput && photoInput.files.length > 0) {
      for(let i=0; i<photoInput.files.length; i++) {
        const dataB64 = await optimiserEtCompresserImage(photoInput.files[i]);
        images_base64.push(dataB64);
      }
    }
    const res = await fetch(`${API}/annonces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: localStorage.getItem("nia_user_id"),
        titre, prix, devise, periode, telephone, description, ville: "Lubumbashi", commune, is_vip: true, images_base64
      })
    });
    if(res.ok) reussiteCount++;
  }
  if(reussiteCount > 0){ alert("Catalogue VIP synchronisé !"); fermerModal("vip"); loadFeed(); }
}

function ouvrirModal(id) {
  document.getElementById(`modal-${id}`).style.display = "flex";
  if (id === "vip") rafraichirEspaceVip();
  if (id === "profil") { changerOngletProfil(ONGLE_PROFIL_ACTIF); chargerMessagesAdministratifsPrives(); }
}
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

function changerOngletProfil(type) {
  ONGLE_PROFIL_ACTIF = type;
  document.getElementById("tab-standard-btn").style.background = type === "standard" ? "#cbd5e1" : "#f1f5f9";
  document.getElementById("tab-vip-btn").style.background = type === "vip" ? "#fde68a" : "#f1f5f9";
  const tel = type === "vip" ? localStorage.getItem("nia_vip_telephone") : localStorage.getItem("nia_standard_telephone");
  const content = document.getElementById("profil-view-content");
  if(!tel) { content.innerHTML = "<p style='color:gray;text-align:center;'>Aucune annonce.</p>"; return; }

  const mesAnnonces = toutesLesAnnonces.filter(a => a.telephone === tel && a.is_vip === (type === "vip"));
  if(mesAnnonces.length === 0) { content.innerHTML = "<p style='color:gray;text-align:center;'>Aucun produit en ligne.</p>"; return; }

  content.innerHTML = mesAnnonces.map(a => `
    <div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
      <div><b>${a.titre}</b><div style="font-size:0.75rem; color:var(--text-light);">${a.prix} ${a.devise}</div></div>
      <div style="display:flex; gap:4px;">
        <button class="btn-edit" style="padding:4px 8px; font-size:0.75rem;" onclick="ouvrirFormulaireModificationAnnonce(${JSON.stringify(a).replace(/"/g, '&quot;')})">✏️ Modifier</button>
        <button class="btn-delete" style="padding:4px 8px; font-size:0.75rem;" onclick="supprimerAnnonce(${a.id})">🗑️</button>
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
  document.getElementById("edit-commune").value = annonce.commune || "";
  document.getElementById("edit-quartier").value = annonce.quartier || "";
  document.getElementById("edit-description").value = annonce.description || "";
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
      ville: val("edit-ville"), commune: val("edit-commune"), quartier: val("edit-quartier"), description: val("edit-description")
    })
  });
  fermerModal("modifier-annonce"); fermerModal("profil"); loadFeed();
}

async function supprimerAnnonce(id) {
  if(confirm("Supprimer l'article ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    fermerModal("profil"); loadFeed();
  }
}

// BASCULER ENTRE LES DEUX ONGLETS/BOUTONS DEMANDÉS PAR L'ADMINISTRATION
function basculerVueAdmin(mode) {
  VUE_ADMIN_ACTUELLE = mode;
  document.getElementById("admin-list-title").textContent = mode === "flux" ? "Gestion globale des Annonces" : "Suivi des Annonces Signalées";
  appliquerFiltrageSupervisionAdmin();
}

// TRANSMISSIONS PAR BOX INDIVIDUELLES ET FILTRAGE GLOBAL PAR VILLE/VIP/STANDARD
async function envoyerMessageAdminDirect(telephoneDest) {
  const message = val(`msg-text-node-${telephoneDest}`);
  if (!message) return alert("Veuillez saisir un texte à transmettre.");
  const res = await fetch(`${API}/admin/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel: telephoneDest, message, is_global: false })
  });
  if(res.ok) { alert("Message ciblé envoyé !"); document.getElementById(`msg-text-node-${telephoneDest}`).value = ""; }
  else { alert("Erreur lors de la distribution."); }
}

// ENVOYER UN MESSAGE À TOUS LES COMPTES SIMULTANÉMENT
async function envoyerMessageGlobalTousComptes() {
  const message = val("admin-msg-global-text");
  if (!message) return alert("Saisir un texte pour l'envoi de masse.");
  const res = await fetch(`${API}/admin/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel: "", message, is_global: true })
  });
  if(res.ok) { alert("Notification globale reçue par toute la plateforme !"); document.getElementById("admin-msg-global-text").value = ""; }
}

async function appliquerFiltrageSupervisionAdmin() {
  const list = document.getElementById("admin-flux-supervision-list");
  const villeFiltre = val("admin-filter-ville").toLowerCase();
  const typeFiltre = document.getElementById("admin-filter-type").value;

  if (VUE_ADMIN_ACTUELLE === "flux") {
    let filtre = toutesLesAnnonces.filter(a => {
      let mVille = villeFiltre === "" || a.ville.toLowerCase().includes(villeFiltre);
      let mType = typeFiltre === "all" || (typeFiltre === "vip" ? a.is_vip : !a.is_vip);
      return mVille && mType;
    });

    list.innerHTML = filtre.map(a => `
      <div class="admin-card-row">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span><b>[${a.is_vip ? 'VIP':'STD'}]</b> ${a.titre} (📍 ${a.ville})</span>
          <button style="background:red; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;" onclick="supprimerAnnonceAdmin(${a.id})">Supprimer 🗑️</button>
        </div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <input id="msg-text-node-${a.telephone}" placeholder="Message spécifique à cet annonceur..." style="flex:1; padding:5px; font-size:0.8rem; border-radius:4px; border:none;">
          <button style="background:#10b981; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.8rem; cursor:pointer;" onclick="envoyerMessageAdminDirect('${a.telephone}')">Envoyer 📨</button>
        </div>
      </div>
    `).join("");
  } else {
    // AFFICHAGE DES CONTENUS DÉTAILLÉS + TEXTE DES RAPPORTS UTILISATEUR
    try {
      const res = await fetch(`${API}/admin/reports`);
      tousLesSignalements = await res.json();
      let filtre = tousLesSignalements.filter(a => {
        let mVille = villeFiltre === "" || a.ville.toLowerCase().includes(villeFiltre);
        let mType = typeFiltre === "all" || (typeFiltre === "vip" ? a.is_vip : !a.is_vip);
        return mVille && mType;
      });

      list.innerHTML = filtre.map(a => `
        <div class="admin-card-row" style="border-left: 4px solid red;">
          <div style="background:#ef4444; color:white; padding:4px 8px; border-radius:4px; font-size:0.75rem; margin-bottom:6px; font-weight:bold;">
            ⚠️ RAISON DU SIGNALEMENT : "${a.raison}"
          </div>
          <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:6px;">
            <b>Contenu complet de l'annonce :</b><br>
            Titre : ${a.titre} | Prix : ${a.prix} ${a.devise} | Description : ${a.description || 'aucune'}<br>
            Contact : Tel: ${a.telephone}
          </div>
          <div style="display:flex; justify-content:space-between; gap:6px; align-items:center;">
            <div style="display:flex; gap:4px; flex:1;">
              <input id="msg-text-node-${a.telephone}" placeholder="Message spécifique..." style="flex:1; padding:5px; font-size:0.8rem; border-radius:4px; border:none;">
              <button style="background:#10b981; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.8rem; cursor:pointer;" onclick="envoyerMessageAdminDirect('${a.telephone}')">Envoyer 📨</button>
            </div>
            <button style="background:red; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem;" onclick="supprimerAnnonceAdmin(${a.id})">Supprimer 🗑️</button>
          </div>
        </div>
      `).join("");
    } catch(e) { list.innerHTML = "Erreur d'extraction des rapports."; }
  }
}

async function supprimerAnnonceAdmin(id) {
  if (confirm("Supprimer définitivement cette offre ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    loadFeed(); 
    setTimeout(() => appliquerFiltrageSupervisionAdmin(), 500);
  }
}

setInterval(() => { loadFeed(); }, 15000);

document.addEventListener("DOMContentLoaded", () => {
  verifierStatutAuthentificationHeader();
  loadFeed();
  lancerBanniereAdsenseRotative();
});
