const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let VUE_ADMIN_ACTIVE = "flux";
let BLOCS_VIP_COMPTEUR = 0;
let topAdminTimer = null;
let validationAdminOk = false;

const TEXTES_DU_DROIT = {
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

function toggleMenuLegal() {
  const m = document.getElementById("legal-dropdown"); 
  m.style.display = m.style.display === "block" ? "none" : "block";
}

function afficherDocumentJurisEtSecu(cle) {
  document.getElementById("legal-header-title").textContent = cle === "apropos" ? "À propos de NIA RDC" : "Politique de Confidentialité";
  document.getElementById("legal-body-content").innerText = TEXTES_DU_DROIT[cle];
  document.getElementById("legal-dropdown").style.display = "none";
  ouvrirModal("legal-display");
}

function ouvrirSecuriseModal(id) {
  if(!localStorage.getItem("nia_user_id")) ouvrirModal("auth");
  else ouvrirModal(id);
}

function ouvrirModal(id) {
  document.getElementById(`modal-${id}`).style.display = "flex";
  if(id === "vip") rafraichirVueVipFormulaire();
  if(id === "profil") chargerProfilEtMessages();
}

function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

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

function deconnexion() { localStorage.clear(); window.location.reload(); }

function traiterFichierEnBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => resolve(e.target.result);
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
      is_vip: false, images_base64
    })
  });
  fermerModal("publier"); chargerFluxPrincipal();
}

async function chargerFluxPrincipal() {
  const res = await fetch(`${API}/feed`); 
  toutesLesAnnonces = await res.json();
  rendreFluxHtml(toutesLesAnnonces);
}

function rendreFluxHtml(liste) {
  const container = document.getElementById("feed"); container.innerHTML = "";
  liste.forEach(a => {
    let imagesMarkup = (a.images && a.images.length > 0) ? `<div class="gallery">${a.images.map(img => `<img src="${img.url}">`).join("")}</div>` : "";
    let btnBoutique = a.is_vip ? `<button class="btn-action shop" onclick="parcourirBoutiqueProprietaire(${a.user_id})">🏪 Visiter la boutique</button>` : "";
    
    container.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="badge-vip">👑 VIP EXPRESS</div>` : ""}
        <h3>${a.titre}</h3>
        <div class="price-tag">${a.prix} ${a.devise} / ${a.periode}</div>
        <div style="font-size:0.8rem; color:var(--text-light);">📍 ${a.ville} · ${a.commune}</div>
        <p style="font-size:0.85rem;">${a.description || ''}</p>
        ${imagesMarkup}
        <div class="card-footer">
          <span class="${a.statut === 'occupe' ? 'status-occupe' : 'status-disponible'}">${a.statut === 'occupe' ? '🔴 Occupé' : '🟢 Disponible'}</span>
          <div style="display:flex; gap:4px;">
            <button class="btn-action report" onclick="signalerAnnonce(${a.id})">⚠️ Signaler</button>
            <button class="btn-action chat" onclick="ouvrirMessagerie(${a.id})">💬 Message</button>
            ${btnBoutique}
            <button class="btn-action call" onclick="window.location.href='tel:${a.telephone}'">📞 Appeler</button>
          </div>
        </div>
      </div>`;
  });
}

function parcourirBoutiqueProprietaire(userId) {
  let annoncesFiltrees = toutesLesAnnonces.filter(a => a.user_id == userId && a.is_vip === true);
  document.getElementById("feed-current-title").textContent = "Boutique VIP Privée";
  document.getElementById("btn-clear-search").style.display = "block";
  rendreFluxHtml(annoncesFiltrees);
}

function reinitialiserFluxGeneral() {
  document.getElementById("feed-current-title").textContent = "Annonces récentes";
  document.getElementById("btn-clear-search").style.display = "none";
  rendreFluxHtml(toutesLesAnnonces);
}

function rafraichirVueVipFormulaire() {
  const s = document.getElementById("vip-setup-zone");
  s.innerHTML = `
    <div id="vip-multi-blocks" style="display:flex; flex-direction:column; gap:12px; max-height:40vh; overflow-y:auto; padding-right:5px;"></div>
    <button class="btn-auth sec" style="width:100%; margin-top:12px;" onclick="ajouterBlocObjetAuCatalogueVip()">➕ Ajouter un logement VIP</button>
    <button class="btn-auth" style="width:100%; margin-top:8px; background:var(--vip-gold);" onclick="sauvegarderEtPublierToutLeCatalogueVip()">Publier le Catalogue VIP 🚀</button>`;
  BLOCS_VIP_COMPTEUR = 0; ajouterBlocObjetAuCatalogueVip();
}

function ajouterBlocObjetAuCatalogueVip() {
  BLOCS_VIP_COMPTEUR++;
  const container = document.getElementById("vip-multi-blocks");
  const row = document.createElement("div");
  row.className = "vip-pure-block"; row.id = `vip-b-${BLOCS_VIP_COMPTEUR}`;
  row.style = "background:#f8fafc; border:1px dashed var(--vip-gold); padding:12px; border-radius:10px; display:flex; flex-direction:column; gap:6px;";
  row.innerHTML = `
    <input class="vip-in-titre" placeholder="Titre du logement VIP *">
    <div style="display:flex; gap:6px;">
      <input class="vip-in-prix" type="number" placeholder="Prix" style="flex:1;">
      <input class="vip-in-ville" placeholder="Ville (Ex: Lubumbashi)" style="flex:1;">
      <input class="vip-in-commune" placeholder="Commune" style="flex:1;">
    </div>
    <textarea class="vip-in-desc" placeholder="Description..." rows="2"></textarea>
    <input class="vip-in-photos" type="file" multiple accept="image/*" style="font-size:0.75rem;">`;
  container.appendChild(row);
}

async function sauvegarderEtPublierToutLeCatalogueVip() {
  const nodes = document.querySelectorAll(".vip-pure-block");
  for(let n of nodes) {
    const titre = n.querySelector(".vip-in-titre").value.trim();
    if(!titre) continue;
    
    let photoInput = n.querySelector(".vip-in-photos");
    let images_base64 = [];
    if(photoInput.files.length > 0) {
      for(let i=0; i<photoInput.files.length; i++) { images_base64.push(await traiterFichierEnBase64(photoInput.files[i])); }
    }

    await fetch(`${API}/annonces`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: localStorage.getItem("nia_user_id"), titre, 
        prix: n.querySelector(".vip-in-prix").value, devise:"$", periode: "jour", statut: "disponible",
        telephone: localStorage.getItem("nia_user_tel"), description: n.querySelector(".vip-in-desc").value, 
        ville: n.querySelector(".vip-in-ville").value || "Lubumbashi", 
        commune: n.querySelector(".vip-in-commune").value, is_vip: true, images_base64
      })
    });
  }
  fermerModal("vip"); chargerFluxPrincipal();
}

async function chargerProfilEtMessages() {
  const uid = localStorage.getItem("nia_user_id");
  const res = await fetch(`${API}/chat/conversations/${uid}`);
  const messages = await res.json();
  const box = document.getElementById("chat-conversations-list");
  
  box.innerHTML = messages.map(m => {
    let estBroadcast = m.provenance_contexte === 'broadcast';
    return `
    <div style="background:#f1f5f9; padding:8px; border-radius:6px; font-size:0.8rem; margin-bottom:4px;">
      <b>De : ${m.expediteur_nup}</b> : "${m.contenu}"
      ${estBroadcast ? `<div style="color:var(--danger); font-size:0.7rem; font-weight:bold; margin-top:2px;">⚠️ Message Général (Réponse impossible)</div>` : 
       m.reponse_utilisateur ? `<div style="color:var(--success); margin-top:2px;">Votre réponse : ${m.reponse_utilisateur}</div>` :
       `<div style="display:flex; gap:4px; margin-top:4px;"><input id="reply-input-${m.id}" placeholder="Votre réponse..." style="flex:1; padding:4px; font-size:0.75rem;"><button class="btn-auth" style="padding:4px 8px; font-size:0.7rem;" onclick="envoyerReponseJustification(${m.id})">Répondre</button></div>`}
    </div>`;
  }).join("");
}

async function envoyerReponseJustification(msgId) {
  const val = document.getElementById(`reply-input-${msgId}`).value.trim();
  if(!val) return;
  await fetch(`${API}/chat/reply-justification/${msgId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reponse: val })
  });
  alert("Message transmis."); chargerProfilEtMessages();
}

async function signalerAnnonce(id) {
  const raison = prompt("Pourquoi signalez-vous cette annonce ?"); if(!raison) return;
  await fetch(`${API}/annonces/${id}/signaler`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raison })
  });
  alert("Signalement envoyé.");
}

async function envoyerMessageGlobalFlash() {
  const contenu = document.getElementById("broadcast-msg").value.trim();
  if(!contenu) return alert("Veuillez écrire un texte.");
  await fetch(`${API}/admin/broadcast`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contenu })
  });
  alert("Message collectif envoyé avec succès !");
  document.getElementById("broadcast-msg").value = "";
}

async function rafraichirStatsAdmin() {
  const res = await fetch(`${API}/admin/stats`);
  const data = await res.json();
  document.getElementById("stat-total").textContent = data.total;
  document.getElementById("stat-standard").textContent = data.standard;
  document.getElementById("stat-vip").textContent = data.vip;
}

async function definirVueAdmin(mode) {
  VUE_ADMIN_ACTIVE = mode;
  rafraichirStatsAdmin();
  const box = document.getElementById("admin-main-render-box");
  box.innerHTML = "Chargement...";

  if(mode === "flux") {
    box.innerHTML = toutesLesAnnonces.map(a => `
      <div style="background:#1e293b; padding:8px; border-radius:6px; font-size:0.8rem;">
        <b>[${a.proprietaire_nup || 'ANONYME'}]</b> ${a.titre} (${a.ville})
        <div style="display:flex; gap:4px; margin-top:4px;">
          <input id="adm-msg-${a.id}" placeholder="Envoyer un avertissement..." style="flex:1; color:black;">
          <button onclick="envoyerMessageAdmin(${a.id})" style="background:var(--vip-gold); border:none; color:white; border-radius:4px; padding:2px 6px;">Contacter</button>
        </div>
      </div>`).join("");
  } 
  else if(mode === "signaux") {
    const res = await fetch(`${API}/admin/reports`); const data = await res.json();
    box.innerHTML = data.map(r => `
      <div style="background:#fffee2; color:black; padding:8px; border-radius:6px; font-size:0.8rem;">
        🚨 <b>SIGNALEMENT :</b> "${r.raison}" sur l'annonce <b>${r.titre}</b> (Par: ${r.proprietaire_nup})
      </div>`).join("");
  }
  else if(mode === "justifications") {
    const res = await fetch(`${API}/admin/all-justifications`); const data = await res.json();
    box.innerHTML = data.map(j => `
      <div style="background:#d1fae5; color:black; padding:8px; border-radius:6px; font-size:0.8rem;">
        ✉️ <b>Profil [${j.user_nup}]</b> en réponse à "${j.contenu}" <br>
        ➔ <span style="color:var(--success); font-weight:bold;">"${j.reponse_utilisateur}"</span>
      </div>`).join("");
  }
}

async function envoyerMessageAdmin(annonceId) {
  const msg = document.getElementById(`adm-msg-${annonceId}`).value.trim(); if(!msg) return;
  await fetch(`${API}/admin/send-to-nup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: annonceId, contenu: msg, provenance_contexte: "signale" })
  });
  alert("Avertissement envoyé."); definirVueAdmin(VUE_ADMIN_ACTIVE);
}

function appliquerFiltresAdmin() {
  const villeFiltre = document.getElementById("admin-filter-city").value.toLowerCase().trim();
  const typeFiltre = document.getElementById("admin-filter-type").value;
  
  let listeFiltree = toutesLesAnnonces.filter(a => {
    let matchVille = !villeFiltre || a.ville.toLowerCase().includes(villeFiltre);
    let matchType = typeFiltre === "tous" || (typeFiltre === "vip" && a.is_vip) || (typeFiltre === "standard" && !a.is_vip);
    return matchVille && matchType;
  });

  const box = document.getElementById("admin-main-render-box");
  box.innerHTML = listeFiltree.map(a => `
    <div style="background:#1e293b; padding:8px; border-radius:6px; font-size:0.8rem;">
      <b>[${a.is_vip ? '👑 VIP' : '📜 STD'}]</b> ${a.titre} - 📍 ${a.ville}
    </div>`).join("");
}

function detecterClicLongAdmin() { topAdminTimer = setTimeout(() => { if(prompt("Code Superviseur :") === "BEN4002ET4200") { ouvrirModal("admin"); definirVueAdmin("flux"); } }, 3000); }
function annulerClicLongAdmin() { clearTimeout(topAdminTimer); }

document.addEventListener("DOMContentLoaded", () => { chargerFluxPrincipal(); });
