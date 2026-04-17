async function loadGalleryCatalog() {
  const response = await fetch("/api/galleries");

  if (!response.ok) {
    throw new Error("Unable to load galleries");
  }

  return response.json();
}

function buildPrivacyBadge(gallery) {
  if (gallery.isPrivate) {
    return '<span class="privacy-badge" aria-label="Galeria privada">Privada</span>';
  }

  return '<span class="privacy-badge privacy-badge--public" aria-label="Galeria publica">Publica</span>';
}

function buildCoverStatusBadge(gallery) {
  if (gallery.coverStatus === "ok") {
    return "";
  }

  return '<span class="cover-status-badge" aria-label="Capa com erro">Capa com erro</span>';
}

function buildGalleryStatusBadge(gallery) {
  if (gallery.galleryStatus === "ok") {
    return "";
  }

  return '<span class="gallery-status-badge" aria-label="Import com erro">Import com erro</span>';
}

function buildGalleryOperationalBadge(gallery) {
  if (gallery.galleryOperationalStatus === "ok") {
    return "";
  }

  return '<span class="gallery-operational-badge" aria-label="Estado operacional com alerta">Atencao operacional</span>';
}

function buildGalleryCard(gallery) {
  return `
    <article class="gallery-card">
      <a class="cover-link" href="/g/${encodeURIComponent(gallery.slug)}">
        <div class="cover-shell">
          <img
            src="${gallery.coverUrl}"
            alt="Capa da galeria ${gallery.title}"
            loading="lazy"
          >
        </div>
        <span class="gallery-meta">
          <span class="cover-title-row">
            <span class="cover-title">${gallery.title}</span>
            <span class="cover-badges">
              ${buildGalleryOperationalBadge(gallery)}
              ${buildGalleryStatusBadge(gallery)}
              ${buildCoverStatusBadge(gallery)}
              ${buildPrivacyBadge(gallery)}
            </span>
          </span>
          <span class="cover-description">${gallery.description || ""}</span>
        </span>
      </a>
    </article>
  `;
}

function renderGalleryCards(galleries) {
  const galleryGrid = document.getElementById("galleryGrid");

  if (!galleryGrid) {
    return;
  }

  if (!Array.isArray(galleries) || galleries.length === 0) {
    galleryGrid.innerHTML = `
      <article class="gallery-card gallery-card--empty">
        <div class="cover-link">
          <div class="cover-shell cover-shell--placeholder"></div>
          <span class="cover-title">Nenhuma galeria cadastrada</span>
          <span class="cover-description">
            Adicione itens com o catalogo correto em app/data/galleries.json para alimentar esta vitrine.
          </span>
        </div>
      </article>
    `;
    return;
  }

  galleryGrid.innerHTML = galleries.map(buildGalleryCard).join("");
}

function renderGalleryError() {
  const galleryGrid = document.getElementById("galleryGrid");

  if (!galleryGrid) {
    return;
  }

  galleryGrid.innerHTML = `
    <article class="gallery-card gallery-card--empty">
      <div class="cover-link">
        <div class="cover-shell cover-shell--placeholder"></div>
        <span class="cover-title">Falha ao carregar a vitrine</span>
        <span class="cover-description">
          Confira o catalogo local e as rotas da API do servidor.
        </span>
      </div>
    </article>
  `;
}

async function initGalleryShowcase() {
  try {
    const payload = await loadGalleryCatalog();
    const galleries = Array.isArray(payload) ? payload : payload.galleries;
    renderGalleryCards(galleries);
  } catch (error) {
    renderGalleryError();
  }
}

initGalleryShowcase();
