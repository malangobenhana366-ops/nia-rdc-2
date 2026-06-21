const API = "https://rdc-maison-et-appart-rapide.onrender.com";

let toutesLesAnnonces = [];
let COMPTE_ACTUEL = null;
let VUE_ADMIN_ACTIVE = "flux";

document.addEventListener("DOMContentLoaded", () => {
  chargerCatalogueGeneral();
  setInterval(verifierMessagesFlashEtAlertes, 8000);
});

async function chargerCatalogueGeneral() {
  try {
    const res = await fetch(`${API}/annonces`);
    if(res.ok) {
      toutesLesAnnonces = await res.json();
      afficherAnnoncesDansGrille(toutesLesAnnonces);
    }
  } catch (err) {
    console.error("Erreur réseau : ", err);
  }
}

function afficherAnnoncesDansGrille(liste) {
  const box = document.getElementById("catalogue-box");
  if(liste.length === 0) {
    box.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:40px 0;">Aucune propriété ne correspond à vos critères actuels.</p>`;
    return;
  }
  
  box.innerHTML = liste.map(a => `
    <div class="card ${a.categorie === 'VIP' ? 'vip' : ''}">
      ${a.categorie === 'VIP' ? '<div class="badge-vip">VIP PLATINUM</div>' : ''}
      <div class="card-content">
        <div class="card-price">${a.prix} $ / Mois</div>
        <h3 style="margin-bottom: 5px; font-size:1.1rem;">${a.titre}</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">📍 ${a.commune} - ${a.adresse}</p>
        <span style="font-size:0.8rem; background:#f1f5f9; padding:2px 6px; border-radius:4px; width:fit-content; margin-bottom:12px;">${a.type}</span>
        
        <div style="margin-top:auto; display:flex; gap:6px;">
          <a href="https://wa.me/${a.telephone}?text=Bonjour, je suis intéressé par votre offre : ${encodeURIComponent(a.titre)}" target="_blank" class="btn btn-primary" style="flex:1; text-decoration:none; background:var(--success); font-size:0.85rem;">WhatsApp</a>
          <button onclick="signalerUneAnnonceMalveillante(${a.id}, '${a.titre}')" class="btn" style="background:#fee2e2; color:var(--danger); padding:8px 10px;">🚨</button>
        </div>
      </div>
    </div>
  `).join("");
}

function filtrerCatalogue() {
  const commune = document.getElementById("filtre-commune").value.toLowerCase().trim();
  const type = document.getElementById("filtre-type").value;
  const cat = document.getElementById("filtre-categorie").value;

  const res = toutesLesAnnonces.filter(a => {
    const matchCommune = a.commune.toLowerCase().includes(commune);
    const matchType = !type || a.type === type;
    const matchCat = !cat || a.categorie === cat;
    return matchCommune && matchType && matchCat;
  });

  afficherAnnoncesDansGrille(res);
}

function ouvrirModal(id) { document.getElementById(`modal-${id}`).classList.add("active"); }
function fermerModal(id) { document.getElementById(`modal-${id}`).classList.remove("active"); }

async function authentifierBailleur() {
  const tel = document.getElementById("auth-tel").value.trim();
  const pin = document.getElementById("auth-pin").value.trim();

  if(!tel || pin.length !== 4) return alert("Indiquez un numéro valide et un code secret à 4 chiffres.");

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone: tel, pin: pin })
    });
    
    if(res.ok) {
      COMPTE_ACTUEL = { telephone: tel, pin: pin };
      document.getElementById("zone-gestion-bailleur").style.display = "block";
      alert("Authentification réussie ! Vous pouvez publier ou modifier vos offres.");
      verifierMessagesFlashEtAlertes();
    } else {
      alert("Erreur de validation. Vérifiez vos identifiants uniques.");
    }
  } catch(e) {
    alert("Impossible de joindre le serveur distant.");
  }
}

async function creerNouvelleAnnonce() {
  if(!COMPTE_ACTUEL) return alert("Veuillez vous identifier avant d'exécuter cette action.");

  const titre = document.getElementById("add-titre").value.trim();
  const adresse = document.getElementById("add-adresse").value.trim();
  const commune = document.getElementById("add-commune").value.trim();
  const prix = parseFloat(document.getElementById("add-prix").value);
  const type = document.getElementById("add-type").value;
  const cat = document.getElementById("add-categorie").value;

  if(!titre || !adresse || !commune || isNaN(prix)) {
    return alert("Veuillez remplir tous les critères obligatoires avant publication.");
  }

  if(adresse.length < 8) return alert("L'adresse est trop imprécise pour éviter les fraudes. Veuillez détailler (N°, Référence, Quartier).");

  try {
    const res = await fetch(`${API}/annonces/ajouter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telephone: COMPTE_ACTUEL.telephone, pin: COMPTE_ACTUEL.pin,
        titre, adresse, commune, prix, type, categorie: cat
      })
    });

    if(res.ok) {
      alert("Votre annonce a été vérifiée et ajoutée avec succès au catalogue !");
      fermerModal("auth");
      chargerCatalogueGeneral();
    } else {
      const errData = await res.json();
      alert(`Rejet du serveur : ${errData.message || 'Erreur lors de la création.'}`);
    }
  } catch(e) {
    alert("Échec de l'envoi de la nouvelle annonce.");
  }
}

async function signalerUneAnnonceMalveillante(id, titre) {
  const raison = prompt(`Pourquoi signalez-vous l'annonce "${titre}" ? (Arnaque, fausse adresse, faux prix...)`);
  if(!raison || !raison.trim()) return;

  await fetch(`${API}/annonces/signaler`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annonce_id: id, raison: raison.trim() })
  });
  alert("Merci, votre signalement a été transmis à la supervision centrale pour examen.");
}

function chargerTextesLegaux(type) {
  const titreBox = document.getElementById("legal-header-title");
  const corpsBox = document.getElementById("legal-body-content");

  if(type === 'propos') {
    titreBox.innerText = "À propos de RDC Maison Express";
    corpsBox.innerText = `Bienvenue sur la plateforme immobilière de référence en République Démocratique du Congo.\n\nNotre mission principale est d'éliminer les intermédiaires véreux et de fluidifier la recherche de maisons et d'appartements à travers toutes les grandes villes du pays.\n\nGrâce à notre infrastructure technologique légère, connectez-vous directement de bailleur à locataire via WhatsApp sans aucun frais caché.\n\nDéveloppé localement pour répondre aux réalités de connectivité et de sécurité du pays. Version 2.4.0 (2026).`;
  } 
  else if(type === 'confidentialite') {
    titreBox.innerText = "Politique de Confidentialité";
    corpsBox.innerText = `Dernière mise à jour : Juin 2026.\n\n1. COLLECTE DES DONNÉES\nNous collectons uniquement votre numéro de téléphone WhatsApp lors de la création d'un compte de publication d'annonces. Aucune donnée nominative superflue n'est conservée.\n\n2. USAGE DES CODES PIN\nVotre code PIN secret à 4 chiffres est chiffré de bout en bout et sert uniquement à authentifier les mises à jour et suppressions de vos propres annonces.\n\n3. ADRESSES ET LUTTE ANTI-FRAUDE\nLes adresses physiques fournies lors des soumissions font l'objet d'un filtrage automatisé pour détecter les descriptions fictives ou abusives afin de sécuriser la communauté.\n\n4. PARTAGE TIERS\nVos données ne sont ni vendues, ni louées, ni partagées avec des partenaires commerciaux tiers. Elles restent exclusivement cantonnées à l'exécution de l'application RDC Maison Express.`;
  }

  ouvrirModal('legal-display');
}

async function definirVueAdmin(mode) {
  VUE_ADMIN_ACTIVE = mode; 
  const box = document.getElementById("admin-main-render-box"); 
  box.innerHTML = "Mise à jour des logs...";
  
  if(mode === "flux") {
    box.innerHTML = toutesLesAnnonces.map(a => `
      <div style="background:#1e293b; padding:10px; border-radius:6px; font-size:0.85rem; border: 1px solid #334155;">
        <span><b>${a.titre}</b> (Tel: ${a.telephone})</span>
        <div style="display:flex; gap:4px; margin-top:6px;">
          <input id="adm-input-${a.id}" placeholder="Rédiger un avertissement..." style="flex:1; color:black; padding:6px; border-radius:4px; border:none;">
          <button onclick="envoyerMessageAvertissementCible('${a.id}', '${a.telephone}', 'normal')" style="background:var(--success); color:white; border:none; padding:4px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">Notifier</button>
          <button onclick="supprimerAnnonceParAdmin(${a.id})" style="background:var(--danger); color:white; border:none; padding:4px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">🗑️</button>
        </div>
      </div>`).join("");
  }
  else if(mode === "signaux") {
    try {
      const res = await fetch(`${API}/admin/reports`); 
      const data = await res.json();
      if(data.length === 0) { box.innerHTML = "Aucun signalement actif."; return; }
      box.innerHTML = data.map(r => `
        <div style="background:#1e293b; padding:10px; border-radius:6px; border-left:4px solid var(--danger); font-size:0.85rem; border-top:1px solid #334155; border-right:1px solid #334155; border-bottom:1px solid #334155;">
          <div style="color:#f87171; font-weight:bold; margin-bottom:4px;">🚨 MOTIF : "${r.raison}"</div>
          <span>Annonce : ${r.titre} | Propriétaire : ${r.telephone}</span>
          <div style="display:flex; gap:4px; margin-top:6px;">
            <input id="adm-input-${r.report_id}" placeholder="Exiger une justification..." style="flex:1; color:black; padding:6px; border-radius:4px; border:none;">
            <button onclick="envoyerMessageAvertissementCible('${r.report_id}', '${r.telephone}', 'signale')" style="background:orange; color:white; border:none; padding:4px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">Exiger Justif</button>
            <button onclick="supprimerAnnonceParAdmin(${r.id})" style="background:var(--danger); color:white; border:none; padding:4px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">Bannir</button>
          </div>
        </div>`).join("");
    } catch(e) { box.innerHTML = "Erreur de chargement des rapports."; }
  }
  else if(mode === "reponses_normales" || mode === "justifications") {
    const ctx = mode === "reponses_normales" ? "normal" : "signale";
    try {
      const res = await fetch(`${API}/admin/replied-messages/${ctx}`); 
      const data = await res.json();
      if(data.length === 0) { box.innerHTML = "<p style='color:gray; font-size:0.85rem;'>Aucune réponse reçue dans cette catégorie.</p>"; return; }
      box.innerHTML = data.map(m => `
        <div style="background:#1e293b; padding:10px; border-radius:6px; font-size:0.85rem; border: 1px solid #334155;">
          <div style="color:#94a3b8;"><b>Compte [Tel: ${m.user_tel}] - Alerte Admin :</b> ${m.message}</div>
          <div style="color:#4ade80; margin-top:6px; background:#0f172a; padding:6px; border-radius:4px;"><b>↩️ Justification Reçue :</b> "${m.reponse_utilisateur}"</div>
        </div>`).join("");
    } catch(e) { box.innerHTML = "Erreur de récupération des réponses."; }
  }
}

async function envoyerMessageAvertissementCible(domId, tel, ctx) {
  const inputTarget = document.getElementById(`adm-input-${domId}`);
  if(!inputTarget) return alert("Erreur interne de ciblage du champ texte.");
  
  const msg = inputTarget.value.trim(); 
  if(!msg) return alert("Veuillez saisir un texte à envoyer.");
  
  try {
    const res = await fetch(`${API}/admin/message`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_tel: tel, message: msg, is_global: false, provenance_contexte: ctx })
    });
    
    if(res.ok) {
      alert(`Message privé envoyé avec succès au bailleur (${tel}) !`);
      inputTarget.value = "";
      definirVueAdmin(VUE_ADMIN_ACTIVE);
    } else {
      alert("Une erreur est survenue lors du traitement du message par Render.");
    }
  } catch(e) {
    alert("Impossible de joindre le service de communication.");
  }
}

async function supprimerAnnonceParAdmin(id) {
  if(!confirm("Êtes-vous sûr de vouloir supprimer définitivement cette annonce du catalogue ?")) return;
  try {
    const res = await fetch(`${API}/admin/annonces/supprimer/${id}`, { method: "DELETE" });
    if(res.ok) {
      alert("Annonce retirée du catalogue en ligne.");
      chargerCatalogueGeneral();
      if(document.getElementById("modal-admin").classList.contains("active")) definirVueAdmin(VUE_ADMIN_ACTIVE);
    }
  } catch(e) { alert("Erreur réseau pendant la suppression."); }
}

async function diffuserNotificationGlobale() {
  const txt = document.getElementById("admin-global-txt").value.trim();
  if(!txt) return alert("Écrivez un message flash.");

  const res = await fetch(`${API}/admin/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_tel: "", message: txt, is_global: true, provenance_contexte: "global" })
  });

  if(res.ok) {
    alert("Alerte flash diffusée à la communauté.");
    document.getElementById("admin-global-txt").value = "";
  }
}

async function verifierMessagesFlashEtAlertes() {
  const boxAlertes = document.getElementById("boite-alertes-globales");
  
  try {
    let url = `${API}/notifications/globales`;
    if(COMPTE_ACTUEL) {
      url = `${API}/notifications/prives?tel=${encodeURIComponent(COMPTE_ACTUEL.telephone)}`;
    }
    
    const res = await fetch(url);
    if(res.ok) {
      const data = await res.json();
      if(data.length > 0) {
        boxAlertes.innerHTML = data.map(n => `
          <div class="alerte-item">
            <strong>📢 Message de l'administration :</strong> ${n.message}
            ${COMPTE_ACTUEL ? `<br><button onclick="repondreAlerteAdmin(${n.id}, '${n.provenance_contexte}')" style="margin-top:6px; background:var(--primary); color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Répondre / Justifier</button>` : ''}
          </div>
        `).join("");
      } else {
        boxAlertes.innerHTML = "";
      }
    }
  } catch(e) { console.log("Erreur silencieuse lors de la vérification des alertes."); }
}

async function repondreAlerteAdmin(notificationId, contexte) {
  const reponse = prompt("Saisissez votre réponse ou justification claire à destination de l'administrateur :");
  if(!reponse || !reponse.trim()) return;

  const res = await fetch(`${API}/bailleur/justifier`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      notification_id: notificationId,
      telephone: COMPTE_ACTUEL.telephone,
      reponse: reponse.trim(),
      contexte: contexte
    })
  });

  if(res.ok) {
    alert("Votre justification a été transmise. L'administrateur la verra sous peu.");
    verifierMessagesFlashEtAlertes();
  }
}

function changerOngletPrincipal(onglet) {
  if(onglet === 'accueil') {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.nav-item')[0].classList.add('active');
    chargerCatalogueGeneral();
  }
}
