const API = "https://nia-rdc-2.onrender.com";

/* UTILS */
function val(id){
  return document.getElementById(id)?.value?.trim() || "";
}

/* MODALS CONTROLLERS */
function ouvrirModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if(modal) modal.style.display = "flex";
}

function fermerModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if(modal) modal.style.display = "none";
}

/* FEED GENERATOR */
async function loadFeed(){
  const res = await fetch(`${API}/feed`);
  const data = await res.json();

  const feed = document.getElementById("feed");
  if(!feed) return;

  feed.innerHTML = "";

  if(data.length === 0) {
    feed.innerHTML = `<p style="text-align:center; color:var(--text-light);">Aucune annonce disponible pour le moment.</p>`;
    return;
  }

  data.forEach(a => {
    const isVip = a.statut === "vip";
    const cardClass = isVip ? "annonce-card vip-premium" : "annonce-card";
    const statusBadge = a.statut === "occupe" ? 
      `<span class="badge-status status-occupe">🔴 Occupé</span>` : 
      `<span class="badge-status status-disponible">🟢 Disponible</span>`;

    // Gestion de la galerie d'images
    let galleryHtml = "";
    if(a.images && a.images.length > 0) {
      galleryHtml = `<div class="gallery">`;
      a.images.forEach(imgUrl => {
        galleryHtml += `<img src="${imgUrl}" class="gallery-item" alt="${a.titre}">`;
      });
      galleryHtml += `</div>`;
    }

    feed.innerHTML += `
      <div class="${cardClass}">
        ${isVip ? `<div class="vip-badge-tag">👑 Premium VIP</div>` : ""}
        <h3 style="margin:0 0 8px 0; font-size:1.25rem;">${a.titre || ""}</h3>
        <div class="annonce-price">${a.prix || 0} USD <span style="font-size:0.85rem; font-weight:500; color:var(--text-light)">/ ${a.periode || "jour"}</span></div>
        <div class="annonce-meta">📍 ${a.ville || ""} - ${a.commune || ""}, ${a.quartier || ""}</div>
        
        ${a.description ? `<div class="annonce-description">${a.description}</div>` : ""}
        
        ${galleryHtml}

        <div class="annonce-footer">
          <div>${statusBadge}</div>
          <div class="footer-actions">
            <a href="tel:${a.telephone}" class="btn-contact">📞 Appeler (${a.telephone || ""})</a>
          </div>
        </div>
      </div>
    `;
  });
}

/* PUBLISH METHOD (MULTIPLE IMAGES BASE64) */
async function publier(){
  const files = document.getElementById("image")?.files;
  let images_base64 = [];

  if(files && files.length > 0) {
    for(let file of files) {
      const b64 = await toBase64(file);
      images_base64.push(b64);
    }
  }

  const res = await fetch(`${API}/annonces`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      user_id: 1, // Utilisateur par défaut
      titre: val("titre"),
      description: val("description"),
      prix: val("prix"),
      periode: val("periode"),
      ville: val("ville"),
      commune: val("commune"),
      quartier: val("quartier"),
      telephone: val("telephone"),
      statut: "disponible",
      images_base64
    })
  });

  const data = await res.json();
  if(!res.ok) return alert("Erreur lors de la publication");

  alert("Annonce publiée avec succès ! 🚀");
  fermerModal("publier");
  loadFeed();
}

/* BASE64 CONVERTER */
function toBase64(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => resolve(r.result);
    r.onerror = reject;
  });
}

/* SEARCH & FILTERS PLACEHOLDERS */
function rechercher() {
  alert("Filtrage en cours...");
  fermerModal("rechercher");
}

function annulerRecherche() {
  loadFeed();
}

function gererClicBoutonVipMenu() {
  ouvrirModal("vip");
}

function ouvrirMonProfilOuMaBoutique() {
  ouvrirModal("profil");
}

/* INITIALIZATION */
document.addEventListener("DOMContentLoaded", () => {
  loadFeed();
});
