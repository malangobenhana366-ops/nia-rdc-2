<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NIA RDC - Location d'Objets & Services</title>
<style>
  :root {
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --bg: #f8fafc;
    --card-bg: #ffffff;
    --text: #1e293b;
    --text-light: #64748b;
    --border: #e2e8f0;
    --success: #10b981;
    --danger: #ef4444;
    --vip-gold: #f59e0b;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 0;
    line-height: 1.6;
  }

  /* BARRE SUPÉRIEURE (LOGO + ENGRENAGE) */
  header {
    background-color: var(--card-bg);
    border-bottom: 1px solid var(--border);
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  header .logo {
    margin: 0;
    color: var(--primary);
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  header .settings-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 5px;
    transition: transform 0.3s;
    width: auto; /* Évite que le bouton prenne 100% */
  }

  header .settings-btn:hover {
    transform: rotate(45deg);
  }

  /* ZONE PRINCIPALE (ANNONCES RÉCENTES) */
  main {
    max-width: 800px;
    margin: 10px auto 220px auto; /* Marge en bas importante pour ne pas cacher le contenu sous les menus fixes */
    padding: 0 15px;
  }

  .section-title {
    margin: 15px 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  #feed {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* DESIGN CARTE ANNONCE */
  .annonce-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 15px;
    background: var(--card-bg);
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }

  .annonce-card h3 {
    margin: 0 0 8px 0;
    font-size: 1.25rem;
    color: var(--text);
  }

  .annonce-price {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--primary);
    margin: 4px 0;
  }

  .annonce-meta {
    font-size: 0.85rem;
    color: var(--text-light);
    margin-bottom: 10px;
  }

  .annonce-description {
    background: #f1f5f9;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #334155;
    margin: 12px 0;
    white-space: pre-line;
    border-left: 3px solid var(--primary);
  }

  /* GALERIE PHOTO ENTIÈRE SANS COUPURE */
  .gallery {
    display: flex;
    overflow-x: auto;
    gap: 10px;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }

  .gallery::-webkit-scrollbar {
    height: 5px;
  }
  
  .gallery::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 4px;
  }

  .gallery-item {
    width: 280px;
    height: 200px;
    object-fit: contain;
    background-color: #0f172a;
    border-radius: 8px;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  }

  .annonce-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--border);
  }

  .btn-contact {
    background-color: #10b981;
    color: white;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.85rem;
    transition: background-color 0.2s;
  }

  .btn-contact:hover {
    background-color: #059669;
  }

  .badge-status {
    padding: 3px 8px;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-disponible {
    background-color: #ecfdf5;
    color: var(--success);
  }

  .status-occupe {
    background-color: #fef2f2;
    color: var(--danger);
  }

  /* ================= ZONE FIXE EN BAS (BOUTONS + ADSENSE) ================= */
  .bottom-area {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--card-bg);
    border-top: 1px solid var(--border);
    box-shadow: 0 -4px 10px rgba(0,0,0,0.05);
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }

  /* REGROUPEMENT DES NOUVEAUX BOUTONS */
  .bottom-nav {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-bottom: 1px solid var(--border);
  }

  .nav-btn {
    background: none;
    border: none;
    padding: 12px 5px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-light);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .nav-btn:hover {
    background-color: #f1f5f9;
    color: var(--primary);
  }

  .nav-btn .icon {
    font-size: 1.3rem;
  }

  .nav-btn.vip-btn {
    color: var(--vip-gold);
  }

  /* ESPACE RÉSERVÉ GOOGLE ADSENSE (BANNIÈRE AFRIQUE / RDC OPTIMISÉE) */
  .adsense-space {
    background-color: #f1f5f9;
    height: 60px; /* Taille standard pour bannière mobile (320x50 ou 468x60) */
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
</style>
</head>
<body>

  <header>
    <div class="logo">NIA RDC</div>
    <button class="settings-btn" onclick="alert('Paramètres (Fonctionnalité à venir)')">⚙️</button>
  </header>

  <main>
    <div class="section-title">Annonces récentes</div>
    <div id="feed">Chargement des offres en cours...</div>
  </main>

  <div class="bottom-area">
    
    <nav class="bottom-nav">
      <button class="nav-btn" onclick="alert('Publier (Fonctionnalité à venir)')">
        <span class="icon">📢</span>
        <span>Publier</span>
      </button>
      <button class="nav-btn" onclick="alert('Rechercher (Fonctionnalité à venir)')">
        <span class="icon">🔍</span>
        <span>Rechercher</span>
      </button>
      <button class="nav-btn vip-btn" onclick="alert('Espace VIP (Fonctionnalité à venir)')">
        <span class="icon">👑</span>
        <span>VIP</span>
      </button>
      <button class="nav-btn" onclick="alert('Mon Profil (Fonctionnalité à venir)')">
        <span class="icon">👤</span>
        <span>Profil</span>
      </button>
    </nav>

    <div class="adsense-space">
      ⚡ ESPACE PUBLICITAIRE ADSENSE (BANNIÈRE) ⚡
    </div>

  </div>

  <script src="app.js"></script>
</body>
</html>
    
