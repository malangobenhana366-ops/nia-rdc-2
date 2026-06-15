const API = "https://nia-rdc-2.onrender.com";

let toutesLesAnnonces = [];
let ONGLE_PROFIL_ACTIF = "standard";
let ACTION_POST_INTERSTITIELLE = null;
let BLOCS_VIP_COUNT = 0;

function val(id) { return document.getElementById(id)?.value?.trim() || ""; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

/* --- ARCHITECTURE COMPRESSION COMPATIBLE MULTI-BLOCS --- */
function optimiserEtCompresserImage(file, maxWidth = 800, maxHeight = 800, quality = 0.65) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else {
          if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    };
  });
}

/* --- AD ENGINES --- */
function declencherPubliciteInterstitielle(actionSuivante) {
  ACTION_POST_INTERSTITIELLE = actionSuivante;
  document.getElementById("interstitial-ad").style.display = "flex";
}
function fermerPubliciteInterstitielle() {
  document.getElementById("interstitial-ad").style.display = "none";
  if (ACTION_POST_INTERSTITIELLE) { ACTION_POST_INTERSTITIELLE(); ACTION_POST_INTERSTITIELLE = null; }
}

function ouvrirModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) {
    modal.style.display = "flex";
    if (id === "vip") rafraichirEspaceVip();
    if (id === "profil") changerOngletProfil(ONGLE_PROFIL_ACTIF);
  }
}
function fermerModal(id) { document.getElementById(`modal-${id}`).style.display = "none"; }

/* --- LOADING FLUX --- */
async function loadFeed() {
  try {
    const res = await fetch(`${API}/feed`);
    toutesLesAnnonces = await res.json();
    filtrerEtAfficherFlux(toutesLesAnnonces);
  } catch (e) { console.error("Feed error"); }
}

function filtrerEtAfficherFlux(listeAnnonces, modeRechercheActive = false) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  feed.innerHTML = "";
  document.getElementById("reset-btn").style.display = modeRechercheActive ? "block" : "none";

  listeAnnonces.forEach(a => {
    let galleryHtml = "";
    if (a.images && a.images.length > 0) {
      galleryHtml = `<div class="gallery">`;
      a.images.forEach(url => { galleryHtml += `<img src="${url}" class="gallery-item">`; });
      galleryHtml += `</div>`;
    }
    feed.innerHTML += `
      <div class="${a.is_vip ? 'annonce-card vip-premium' : 'annonce-card'}">
        ${a.is_vip ? `<div class="vip-badge-tag">👑 VIP</div>` : ""}
        <h3>${a.titre}</h3>
        <div class="annonce-price">${a.prix} ${a.devise} / ${a.periode}</div>
        <div class="annonce-meta">📍 ${a.ville} - ${a.commune || ""}, ${a.quartier || ""}</div>
        <div class="annonce-description">${a.description || ""}</div>
        ${galleryHtml}
        <div class="annonce-footer">
          <span class="badge-status status-disponible">🟢 Disponible</span>
          <button class="btn-contact" onclick="window.location.href='tel:${a.telephone}'">📞 Appeler (${a.telephone})</button>
        </div>
      </div>
    `;
  });
}

/* --- PUBLICATION STANDARD --- */
async function publier() {
  const files = document.getElementById("image")?.files;
  if (!val("titre") || !val("telephone")) return alert("Champs manquants");

  let images_base64 = [];
  if(files) {
    for(let f of files) { images_base64.push(await optimiserEtCompresserImage(f)); }
  }
  localStorage.setItem("nia_standard_telephone", val("telephone"));

  const res = await fetch(`${API}/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titre: val("titre"), prix: val("prix"), devise: val("devise"),
      periode: val("periode"), telephone: val("telephone"), description: val("description"),
      ville: val("ville"), commune: val("commune"), quartier: val("quartier"),
      is_vip: false, images_base64
    })
  });
  if(res.ok) { fermerModal("publier"); loadFeed(); }
}

/* --- MANAGEMENT DU MULTI-FORMULAIRE VIP (DYNAMIQUE) --- */
function rafraichirEspaceVip() {
  const body = document.getElementById("vip-form-body");
  const nomBoutique = localStorage.getItem("nia_vip_nom");

  if (!nomBoutique) {
    body.innerHTML = `
      <div class="form-group full-width"><label>Nom commercial de la boutique</label><input id="reg-vip-nom" placeholder="Ex: Maison Quincaillerie"></div>
      <div class="form-group full-width"><label>Téléphone Global VIP</label><input id="reg-vip-tel" type="tel" placeholder="Ex: 082..."></div>
      <button class="modal-submit-btn" style="background:var(--vip-gold);" onclick="creerBoutiqueVIP()">Activer Boutique VIP 👑</button>
    `;
  } else {
    body.innerHTML = `
      <div style="background:var(--vip-bg); padding:10px; border-radius:10px; margin-bottom:15px; font-weight:bold; color:var(--vip-gold); text-align:center;">
        👑 VITRINE : ${nomBoutique}
      </div>
      <div id="conteneur-blocs-annonces-vip"></div>
      <button class="btn-add-block" onclick="ajouterNouveauBlocFormulaireVip()">➕ Ajouter une autre annonce</button>
      <button id="btn-submit-multi-vip" class="modal-submit-btn" style="background:var(--vip-gold);" onclick="soumettreToutesLesAnnoncesVip()">🚀 Publier le catalogue d'annonces</button>
    `;
    BLOCS_VIP_COUNT = 0;
    ajouterNouveauBlocFormulaireVip(); // Ajoute le premier bloc par défaut
  }
}

function creerBoutiqueVIP() {
  if(!val("reg-vip-nom") || !val("reg-vip-tel")) return alert("Remplissez tout");
  localStorage.setItem("nia_vip_nom", val("reg-vip-nom"));
  localStorage.setItem("nia_vip_telephone", val("reg-vip-tel"));
  rafraichirEspaceVip();
}

// INJECTION UNIQUE DE BLOC D'ANNONCE INDÉPENDANT
function ajouterNouveauBlocFormulaireVip() {
  BLOCS_VIP_COUNT++;
  const conteneur = document.getElementById("conteneur-blocs-annonces-vip");
  const idUnique = BLOCS_VIP_COUNT;

  const blocHtml = document.createElement("div");
  blocHtml.className = "vip-block-annonce";
  blocHtml.id = `vip-block-${idUnique}`;
  blocHtml.innerHTML = `
    <div class="vip-block-header">
      <span style="font-weight:bold; color:var(--primary)">📦 Objet Particulier N°${idUnique}</span>
      ${idUnique > 1 ? `<button style="background:none; border:none; color:var(--danger); font-weight:bold; cursor:pointer;" onclick="supprimerBlocVipForm(${idUnique})">Supprimer ✕</button>` : ""}
    </div>
    <div class="form-grid">
      <div class="form-group full-width"><label>Nom de l'objet</label><input class="vip-in-titre" required placeholder="Ex: Soudeuse industrielle"></div>
      <div class="form-group"><label>Prix</label>
        <div style="display:flex; gap:6px;">
          <input class="vip-in-prix" type="number" placeholder="15" style="flex:2;">
          <select class="vip-in-devise" style="flex:1;"><option value="$">$</option><option value="FC">FC</option></select>
        </div>
      </div>
      <div class="form-group"><label>Période</label><select class="vip-in-periode"><option value="jour">par jour</option><option value="heure">par heure</option></select></div>
      <div class="form-group full-width"><label>Téléphone spécifique de contact (Coordonnée)</label><input class="vip-in-tel" value="${localStorage.getItem("nia_vip_telephone")}"></div>
      <div class="form-group full-width"><label>Description</label><textarea class="vip-in-desc" placeholder="Spécifications..."></textarea></div>
      <div class="form-group"><label>Commune</label><input class="vip-in-commune" placeholder="Ex: Kampemba"></div>
      <div class="form-group"><label>Quartier</label><input class="vip-in-quartier" placeholder="Ex: Bel-Air"></div>
      <div class="form-group full-width"><label>Photos spécifiques de cet objet</label><input type="file" class="vip-in-photos" multiple accept="image/*"></div>
    </div>
  `;
  conteneur.appendChild(blocHtml);
}

function supprimerBlocVipForm(id) {
  document.getElementById(`vip-block-${id}`)?.remove();
}

/* --- BOUCLE DE SOUMISSION VIP SÉPARÉE --- */
async function soumettreToutesLesAnnoncesVip() {
  const boutonsubmit = document.getElementById("btn-submit-multi-vip");
  const blocs = document.querySelectorAll(".vip-block-annonce");
  
  if(boutonsubmit) { boutonsubmit.disabled = true; boutonsubmit.textContent = "Traitement global en cours..."; }

  try {
    for (let b of blocs) {
      const titre = b.querySelector(".vip-in-titre").value.trim();
      const prix = b.querySelector(".vip-in-prix").value.trim();
      const devise = b.querySelector(".vip-in-devise").value;
      const periode = b.querySelector(".vip-in-periode").value;
      const telephone = b.querySelector(".vip-in-tel").value.trim();
      const description = b.querySelector(".vip-in-desc").value.trim();
      const commune = b.querySelector(".vip-in-commune").value.trim();
      const quartier = b.querySelector(".vip-in-quartier").value.trim();
      const fileInput = b.querySelector(".vip-in-photos");

      if (!titre || !telephone) continue; // Skip si bloc vide

      let images_base64 = [];
      if(fileInput && fileInput.files.length > 0) {
        for(let f of fileInput.files) {
          images_base64.push(await optimiserEtCompresserImage(f));
        }
      }

      await fetch(`${API}/annonces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre, prix, devise, periode, telephone, description,
          ville: "Lubumbashi", commune, quartier, is_vip: true, images_base64
        })
      });
    }

    alert("Toutes vos annonces VIP spécifiques ont été publiées ! 👑");
    fermerModal("vip");
    loadFeed();
  } catch(e) {
    alert("Erreur réseau détectée.");
  } finally {
    if(boutonsubmit) { boutonsubmit.disabled = false; boutonsubmit.textContent = "🚀 Publier le catalogue d'annonces"; }
  }
}

/* --- PROFIL ET RECHERCHE --- */
function ouvrirEspaceProfilGeneral() { ouvrirModal("profil"); }
function changerOngletProfil(type) {
  ONGLE_PROFIL_ACTIF = type;
  const tel = type === "vip" ? localStorage.getItem("nia_vip_telephone") : localStorage.getItem("nia_standard_telephone");
  const content = document.getElementById("profil-view-content");
  if(!tel) { content.innerHTML = "Aucun historique."; return; }

  const mesAnnonces = toutesLesAnnonces.filter(a => a.telephone === tel && a.is_vip === (type === "vip"));
  let html = "";
  mesAnnonces.forEach(a => {
    html += `
      <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between;">
        <div><b>${a.titre}</b><br>${a.prix} ${a.devise}</div>
        <button class="btn-delete" onclick="supprimer(${a.id})">🗑️</button>
      </div>`;
  });
  content.innerHTML = html || "Aucune annonce active.";
}

async function supprimer(id) {
  if(confirm("Supprimer ?")) {
    await fetch(`${API}/annonces/${id}/delete`, { method: "DELETE" });
    fermerModal("profil");
    loadFeed();
  }
}

document.addEventListener("DOMContentLoaded", loadFeed);
