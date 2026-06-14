// Base de données simulée en mémoire locale (SynchroniséeLocalStorage)
let annonces = JSON.parse(localStorage.getItem('nia_annonces')) || [
  {
    id: "1",
    titre: "Marteau Professionnel",
    prix: "157596",
    devise: "USD",
    periode: "jour",
    telephone: "099123456",
    description: "Zrthhh - Idéal pour les chantiers de Ruachi.",
    ville: "Lubumbashi",
    commune: "Ruachi",
    quartier: "Ruachi",
    images: [],
    isVip: true,
    ownerToken: "user_vip_test",
    statut: "disponible"
  }
];

// Configuration utilisateur
let profilActuel = localStorage.getItem('nia_profile_type') || 'standard'; // 'standard' ou 'vip'
let userToken = "user_vip_test"; // Token simulé de l'appareil actuel

// Dictionnaire étendu pour la recherche intelligente (Fuzzy Match & Synonymes)
const dictionnaireSynonymes = {
  "marteau": ["marto", "zrthhh", "outils", "marteau piqueur"],
  "groupe": ["générateur", "courant", "moteur", "delco", "elec"],
  "robe": ["habit", "fête", "mariage", "vetement", "liputa"],
  "maison": ["appartement", "chambre", "parcelle", "studio", "logement"],
  "camion": ["benne", "transport", "fuso", "voiture", "vehicule"]
};

// Initialisation au chargement
document.addEventListener("DOMContentLoaded", () => {
  renderFeed(annonces);
  configurerAppuiLongAdmin();
  lancerRotationBanniereAdSense();
  document.getElementById('current-profile-status').innerText = profilActuel === 'vip' ? '👑 Professionnel VIP' : 'Standard 👤';
});

// SAUVEGARDE
function saveToStorage() {
  localStorage.setItem('nia_annonces', JSON.stringify(annonces));
}

// ROUTAGE PROFILS
function basculerTypeProfil() {
  profilActuel = profilActuel === 'standard' ? 'vip' : 'standard';
  localStorage.setItem('nia_profile_type', profilActuel);
  document.getElementById('current-profile-status').innerText = profilActuel === 'vip' ? '👑 Professionnel VIP' : 'Standard 👤';
  renderFeed(annonces);
}

// INJECTION DU FLUX D'ANNONCES
function renderFeed(liste) {
  const feed = document.getElementById('feed');
  feed.innerHTML = "";

  if(liste.length === 0) {
    feed.innerHTML = "<p style='text-align:center; color:var(--text-light);'>Aucune offre trouvée pour cette recherche.</p>";
    return;
  }

  // Trier pour mettre les VIP en premier systématiquement
  const triee = [...liste].sort((a, b) => (b.isVip ? 1 : 0) - (a.isVip ? 1 : 0));

  triee.forEach(art => {
    const card = document.createElement('div');
    card.className = `annonce-card ${art.isVip ? 'vip-premium' : ''}`;
    
    // Déterminer si l'utilisateur connecté possède cette offre
    const isOwner = (art.ownerToken === userToken);

    card.innerHTML = `
      ${art.isVip ? '<span class="vip-badge-tag">👑 VIP PARTENAIRE</span>' : ''}
      <h3 style="margin:0 0 5px 0;">${art.titre}</h3>
      <div class="annonce-price">${art.prix} ${art.devise} <span style="font-size:0.8rem; color:var(--text-light)">/${art.periode}</span></div>
      <div class="annonce-meta">📍 ${art.ville} - ${art.commune}, ${art.quartier}</div>
      
      <div class="annonce-description">${art.description}</div>
      
      <div class="annonce-footer">
        <span class="badge-status status-${art.statut}">${art.statut.toUpperCase()}</span>
        <div class="footer-actions">
          <a href="tel:${art.telephone}" class="btn-contact" onclick="declencherPubliciteAction('Appel vers ' + ${art.telephone})">📞 Appeler</a>
          ${isOwner ? `<button class="btn-boost" onclick="declencherPubliciteBoost('${art.id}')">🚀 Booster</button>` : ''}
          ${isOwner ? `<button class="btn-delete" onclick="supprimerAnnonce('${art.id}')">🗑️</button>` : ''}
        </div>
      </div>
    `;
    feed.appendChild(card);
  });
}

// GESTION DES RECHERCHES INTELLIGENTES (Mots mal écrits + Synonymes)
function executerRechercheIntelligente() {
  const query = document.getElementById('search-query').value.toLowerCase().trim();
  if(!query) {
    clearRecherche();
    return;
  }

  const resultats = annonces.filter(art => {
    const titre = art.titre.toLowerCase();
    const desc = art.description.toLowerCase();
    const commune = art.commune.toLowerCase();

    // 1. Match direct ou partiel
    if (titre.includes(query) || desc.includes(query) || commune.includes(query)) return true;

    // 2. Recherche par dictionnaire de synonymes et fautes d'orthographe connues
    for (let cle in dictionnaireSynonymes) {
      if (query.includes(cle) || cle.includes(query)) {
        // Si le mot clé matche un des synonymes de l'annonce
        if (titre.includes(cle) || desc.includes(cle)) return true;
      }
      // Parcourir la liste de synonymes associés
      const synonymes = dictionnaireSynonymes[cle];
      if (synonymes.some(syn => syn.includes(query) || query.includes(syn))) {
        if (titre.includes(cle) || desc.includes(cle)) return true;
      }
    }
    return false;
  });

  document.getElementById('reset-btn').style.display = "block";
  document.getElementById('feed-title').innerText = `Résultats pour "${query}"`;
  fermerModal('rechercher');
  renderFeed(resultats);
}

function clearRecherche() {
  document.getElementById('search-query').value = "";
  document.getElementById('reset-btn').style.display = "none";
  document.getElementById('feed-title').innerText = "Annonces Disponibles";
  renderFeed(annonces);
}

// SYSTÈME DE PUBLICITÉ BANNIÈRE (AUTO-ROTATION 30 SECONDES)
const cataloguesPubBanniere = [
  "🌟 Vodacom RDC : Restez connectés partout avec la 4G+ ! 🌟",
  "🍺 Rawbank : Un crédit express pour booster votre commerce à Lubumbashi ?",
  "🚀 Airtel Money : Envoyez de l'argent instantanément et sans frais cachés !",
  "🏠 ImmoKatanga : Les meilleures villas au Golf et à Carrefour sont ici."
];
let indexPub = 0;

function lancerRotationBanniereAdSense() {
  const zoneBanner = document.getElementById('adsense-banner');
  setInterval(() => {
    indexPub = (indexPub + 1) % cataloguesPubBanniere.length;
    zoneBanner.style.opacity = 0;
    setTimeout(() => {
      zoneBanner.innerText = cataloguesPubBanniere[indexPub];
      zoneBanner.style.opacity = 1;
    }, 300);
  }, 30000); // 30 secondes réglementaires
}

// PUBLICITÉ INTERSTITIELLE ET ACTIONS SÉCURISÉES
let actionApresPub = null;

function declencherPubliciteAction(labelAction) {
  ouvrirInterstitial(`Ouverture du lien sponsorisé pour [${labelAction}]...`);
  actionApresPub = () => { console.log("Action exécutée : ", labelAction); };
}

function declencherPubliciteBoost(idAnnonce) {
  ouvrirInterstitial("Optimisation des moteurs de recherche AdSense pour remonter votre annonce...");
  actionApresPub = () => {
    const idx = annonces.findIndex(a => a.id === idAnnonce);
    if(idx !== -1) {
      const annonceA-Booster = annonces.splice(idx, 1)[0];
      annonces.unshift(annonceA-Booster); // Remise tout en haut
      saveToStorage();
      renderFeed(annonces);
      alert("🚀 Annonce propulsée en haut de la liste avec succès !");
    }
  };
}

function ouvrirInterstitial(texte) {
  document.getElementById('ad-text-content').innerText = texte;
  const modalAd = document.getElementById('interstitial-ad');
  const closeBtn = document.getElementById('interstitial-close-btn');
  const timerTxt = document.getElementById('ad-timer');
  
  modalAd.style.display = "flex";
  closeBtn.style.display = "none";
  
  let decompte = 3;
  timerTxt.innerText = decompte;

  const interval = setInterval(() => {
    decompte--;
    timerTxt.innerText = decompte;
    if(decompte <= 0) {
      clearInterval(interval);
      timerTxt.innerText = "Prêt !";
      closeBtn.style.display = "inline-block";
    }
  }, 1000);
}

function fermerInterstitial() {
  document.getElementById('interstitial-ad').style.display = "none";
  if(actionApresPub) {
    actionApresPub();
    actionApresPub = null;
  }
}

// CRÉATION DES OFFRES DU FORMULAIRE
function creerOffre() {
  const titre = document.getElementById('titre').value;
  const prix = document.getElementById('prix').value;
  const devise = document.getElementById('devise').value;
  const periode = document.getElementById('periode').value;
  const telephone = document.getElementById('telephone').value;
  const description = document.getElementById('description').value;
  const ville = document.getElementById('ville').value;
  const commune = document.getElementById('commune').value;
  const quartier = document.getElementById('quartier').value;

  if(!titre || !prix || !telephone) {
    alert("Veuillez remplir les champs obligatoires (Titre, Prix, Téléphone).");
    return;
  }

  const nouvelleAnnonce = {
    id: Date.now().toString(),
    titre, prix, devise, periode, telephone, description, ville, commune, quartier,
    images: [],
    isVip: (profilActuel === 'vip'), // Si l'utilisateur est en profil VIP, sa publication est VIP automatiquement
    ownerToken: userToken,
    statut: "disponible"
  };

  annonces.unshift(nouvelleAnnonce);
  saveToStorage();
  fermerModal('publier');
  renderFeed(annonces);
  
  // Clean du formulaire
  document.getElementById('titre').value = "";
  document.getElementById('prix').value = "";
  document.getElementById('description').value = "";
}

function supprimerAnnonce(id) {
  if(confirm("Supprimer définitivement cette publication ?")) {
    annonces = annonces.filter(a => a.id !== id);
    saveToStorage();
    renderFeed(annonces);
  }
}

// SÉCURITÉ DE L'ADMINISTRATION : DEUX SECONDES D'APPUI LONG TACTILE
function configurerAppuiLongAdmin() {
  const btnGear = document.getElementById('admin-gear-btn');
  let timerPresse;

  const demarrerPresse = (e) => {
    e.preventDefault();
    timerPresse = setTimeout(() => {
      lancerConsoleAdmin();
    }, 2000); // Déclenchement strict après 2 secondes d'appui continu
  };

  const annulerPresse = () => {
    clearTimeout(timerPresse);
  };

  btnGear.addEventListener('mousedown', demarrerPresse);
  btnGear.addEventListener('touchstart', demarrerPresse, { passive: false });
  btnGear.addEventListener('mouseup', annulerPresse);
  btnGear.addEventListener('mouseleave', annulerPresse);
  btnGear.addEventListener('touchend', annulerPresse);
}

function lancerConsoleAdmin() {
  document.getElementById('adm-total').innerText = annonces.length;
  const conteneurAdmin = document.getElementById('admin-liste-annonces');
  conteneurAdmin.innerHTML = "";

  annonces.forEach(a => {
    const item = document.createElement('div');
    item.style = "display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #334155; font-size:0.85rem;";
    item.innerHTML = `
      <span>${a.titre} (${a.prix} ${a.devise})</span>
      <button onclick="supprimerAnnonce('${a.id}'); lancerConsoleAdmin();" style="background:var(--danger); color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Bannir</button>
    `;
    conteneurAdmin.appendChild(item);
  });

  ouvrirModal('admin-panel');
}

// FENÊTRES MODALES UNIVERSAL ROUTER
function ouvrirModal(id) { document.getElementById(`modal-${id}`).style.display = 'flex'; }
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = 'none'; }

function ouvrirEspaceVIP() {
  const panel = document.getElementById('vip-panel-content');
  if(profilActuel !== 'vip') {
    panel.innerHTML = `
      <div style="text-align:center; padding:20px;">
        <p style="font-size:1.1rem; font-weight:bold; color:var(--vip-gold);">⚠️ Accès Limité aux Professionnels</p>
        <p>Basculez votre compte en profil <strong>Professionnel VIP</strong> en haut du fil pour créer automatiquement des annonces labellisées Or.</p>
        <button onclick="basculerTypeProfil(); fermerModal('vip');" style="background:var(--vip-gold); color:white; border:none; padding:10px 15px; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:10px;">Devenir VIP instantanément</button>
      </div>
    `;
  } else {
    panel.innerHTML = `
      <div style="background:var(--vip-bg); padding:15px; border-radius:12px; color:#78350f; font-weight:500; margin-bottom:15px;">
        ✓ Votre compte est configuré sur <strong>Mode Agence / Pro</strong>. Toutes vos offres s'afficheront au sommet de l'application.
      </div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="fermerModal('vip'); ouvrirModal('publier');">📢 Publier une offre VIP Or</button>
    `;
  }
  ouvrirModal('vip');
}
