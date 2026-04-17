const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const port = Number(process.env.APP_PORT || process.env.PORT || 3000);
const appRoot = __dirname;
const repoRoot = path.resolve(appRoot, "..");
const galleriesFilePath = path.join(appRoot, "data", "galleries.json");
const domainsFilePath = path.join(appRoot, "data", "domains.json");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const cssFilePath = path.join(appRoot, "styles.css");
const indexFilePath = path.join(appRoot, "index.html");
const appJsFilePath = path.join(appRoot, "app.js");

function sendText(response, statusCode, body, contentType) {
  response.writeHead(statusCode, {
    "Content-Type": contentType
  });
  response.end(body);
}

function sendJson(response, statusCode, payload) {
  sendText(
    response,
    statusCode,
    JSON.stringify(payload),
    "application/json; charset=utf-8"
  );
}

function sendFile(response, filePath, contentType) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      const statusCode = error.code === "ENOENT" ? 404 : 500;
      const message = error.code === "ENOENT"
        ? "Not found"
        : "Unable to read file";

      sendJson(response, statusCode, {
        status: "error",
        message
      });
      return;
    }

    sendText(response, 200, content, contentType);
  });
}

function sendNotFound(response) {
  sendJson(response, 404, {
    status: "error",
    message: "Not found"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeHost(host) {
  return String(host || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

function readJsonFile(filePath) {
  return fs.promises.readFile(filePath, "utf8").then((content) => JSON.parse(content));
}

function isImageFile(fileName) {
  return imageExtensions.has(path.extname(fileName).toLowerCase());
}

function resolveGallerySourcePath(sourcePath) {
  const resolvedPath = path.resolve(repoRoot, sourcePath);

  if (!resolvedPath.startsWith(path.join(repoRoot, "data"))) {
    throw new Error("Invalid gallery source path");
  }

  return resolvedPath;
}

function getGalleryImagePaths(gallery) {
  const galleryRoot = resolveGallerySourcePath(gallery.sourcePath);

  return {
    thumbnailsDir: path.join(galleryRoot, "images", "thumbnails"),
    largeDir: path.join(galleryRoot, "images", "large")
  };
}

async function fileExists(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.isFile() && stats.size > 0;
  } catch (error) {
    return false;
  }
}

async function listConsistentImageFiles(sourcePath) {
  const { thumbnailsDir, largeDir } = getGalleryImagePaths({ sourcePath });

  const [thumbnailEntries, largeEntries] = await Promise.all([
    fs.promises.readdir(thumbnailsDir, { withFileTypes: true }),
    fs.promises.readdir(largeDir, { withFileTypes: true })
  ]);

  const thumbnailFiles = thumbnailEntries
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => entry.name)
    .sort();

  const largeFiles = new Set(
    largeEntries
      .filter((entry) => entry.isFile() && isImageFile(entry.name))
      .map((entry) => entry.name)
  );

  return thumbnailFiles.filter((fileName) => largeFiles.has(fileName));
}

async function loadGalleries() {
  return readJsonFile(galleriesFilePath);
}

async function loadDomains() {
  return readJsonFile(domainsFilePath);
}

function filterGalleriesByCatalog(galleries, domainContext) {
  return galleries.filter((item) => item.catalog === domainContext.catalog);
}

function selectFallbackDomain(domains, galleries) {
  for (const domain of domains) {
    if (galleries.some((gallery) => gallery.catalog === domain.catalog)) {
      return domain;
    }
  }

  return domains[0] || null;
}

async function resolveDomainContext(request) {
  const [domains, galleries] = await Promise.all([
    loadDomains(),
    loadGalleries()
  ]);
  const requestedHost = normalizeHost(request.headers.host);
  const matchedDomain = domains.find((item) => normalizeHost(item.domain) === requestedHost);
  const activeDomain = matchedDomain || selectFallbackDomain(domains, galleries);

  if (!activeDomain) {
    throw new Error("No configured domains");
  }

  return {
    ...activeDomain,
    requestedHost,
    isFallback: !matchedDomain
  };
}

async function findGalleryBySlug(slug, domainContext) {
  const galleries = await loadGalleries();
  return filterGalleriesByCatalog(galleries, domainContext)
    .find((item) => item.slug === slug) || null;
}

async function getCoverUrl(gallery) {
  const { thumbnailsDir, largeDir } = getGalleryImagePaths(gallery);
  const preferredPaths = [
    path.join(thumbnailsDir, gallery.cover),
    path.join(largeDir, gallery.cover)
  ];

  for (const filePath of preferredPaths) {
    if (await fileExists(filePath)) {
      return `/media/${encodeURIComponent(gallery.slug)}/${encodeURIComponent(gallery.cover)}`;
    }
  }

  return `/assets/capa-serra.svg`;
}

async function buildGallerySummary(gallery) {
  try {
    const imageFiles = await listConsistentImageFiles(gallery.sourcePath);
    const coverUrl = await getCoverUrl(gallery);

    return {
      ...gallery,
      imageCount: imageFiles.length,
      coverUrl,
      entryUrl: `/g/${encodeURIComponent(gallery.slug)}`,
      galleryUrl: `/gallery/${encodeURIComponent(gallery.slug)}`
    };
  } catch (error) {
    return {
      ...gallery,
      imageCount: 0,
      coverUrl: "/assets/capa-serra.svg",
      entryUrl: `/g/${encodeURIComponent(gallery.slug)}`,
      galleryUrl: `/gallery/${encodeURIComponent(gallery.slug)}`
    };
  }
}

async function buildGalleryDetail(gallery) {
  const imageFiles = await listConsistentImageFiles(gallery.sourcePath);
  const coverUrl = await getCoverUrl(gallery);

  return {
    ...gallery,
    coverUrl,
    entryUrl: `/g/${encodeURIComponent(gallery.slug)}`,
    galleryUrl: `/gallery/${encodeURIComponent(gallery.slug)}`,
    images: {
      thumbnailsPath: `${gallery.sourcePath}/images/thumbnails`,
      largePath: `${gallery.sourcePath}/images/large`,
      files: imageFiles
    }
  };
}

function renderEntryPage(gallery) {
  const actionText = gallery.isPrivate
    ? "Acesso protegido a esta galeria"
    : "Entrar na galeria";
  const noteText = gallery.isPrivate
    ? "A estrutura de acesso protegido esta preparada, mas a senha ainda nao foi implementada."
    : "Esta galeria esta sinalizada como publica e segue para a experiencia final.";
  const statusText = gallery.isPrivate ? "Privada" : "Publica";
  const actionClass = gallery.isPrivate ? "entry-action entry-action--private" : "entry-action";

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(gallery.title)} | Gallery Platform</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main class="entry-page">
      <a class="entry-back" href="/vitrine">Voltar para a vitrine</a>
      <section class="entry-hero">
        <div class="entry-cover">
          <img src="${escapeHtml(gallery.coverUrl)}" alt="Capa da galeria ${escapeHtml(gallery.title)}">
        </div>
        <div class="entry-copy">
          <p class="eyebrow">Pagina de entrada</p>
          <h1>${escapeHtml(gallery.title)}</h1>
          <span class="entry-status">${escapeHtml(statusText)}</span>
          <p>${escapeHtml(gallery.description || "Galeria sem descricao cadastrada.")}</p>
          <a class="${actionClass}" href="${escapeHtml(gallery.galleryUrl)}">${escapeHtml(actionText)}</a>
          <p class="entry-note">${escapeHtml(noteText)}</p>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

function renderGalleryPlaceholderPage(gallery) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(gallery.title)} | Galeria</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main class="gallery-placeholder">
      <a class="entry-back" href="/g/${encodeURIComponent(gallery.slug)}">Voltar para a entrada da galeria</a>
      <section class="gallery-placeholder-panel">
        <p class="eyebrow">Galeria final</p>
        <h1>${escapeHtml(gallery.title)}</h1>
        <p>Esta rota sera a galeria final de ${escapeHtml(gallery.title)}. Nesta etapa ela permanece como placeholder simples para validar o fluxo vitrine -> entrada -> galeria.</p>
      </section>
    </main>
  </body>
</html>`;
}

function renderHomePage(domainContext) {
  const fallbackMessage = domainContext.isFallback
    ? `<p class="home-fallback">Host desconhecido. Usando fallback seguro para ${escapeHtml(domainContext.name)}.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(domainContext.name)} | Gallery Platform</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main class="home-page">
      <section class="home-panel">
        <p class="eyebrow">Home do dominio</p>
        <h1>${escapeHtml(domainContext.name)}</h1>
        <p>Esta e a home local do dominio ${escapeHtml(domainContext.domain)}. O mesmo motor de aplicacao atende dominios diferentes e filtra a vitrine pelo catalogo configurado.</p>
        ${fallbackMessage}
        <div class="home-actions">
          <a class="home-action" href="/vitrine">Abrir vitrine</a>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

function renderVitrineTemplate(domainContext) {
  return fs.readFileSync(indexFilePath, "utf8")
    .replaceAll("__DOMAIN_NAME__", escapeHtml(domainContext.name));
}

async function handleApiRequest(requestUrl, response, domainContext) {
  if (requestUrl.pathname === "/api/galleries") {
    const galleries = filterGalleriesByCatalog(await loadGalleries(), domainContext);
    const payload = await Promise.all(galleries.map(buildGallerySummary));

    sendJson(response, 200, {
      domain: {
        domain: domainContext.domain,
        name: domainContext.name,
        catalog: domainContext.catalog,
        isFallback: domainContext.isFallback
      },
      galleries: payload
    });
    return true;
  }

  if (requestUrl.pathname.startsWith("/api/gallery/")) {
    const slug = decodeURIComponent(requestUrl.pathname.replace("/api/gallery/", ""));
    const gallery = await findGalleryBySlug(slug, domainContext);

    if (!gallery) {
      sendNotFound(response);
      return true;
    }

    const payload = await buildGalleryDetail(gallery);
    sendJson(response, 200, payload);
    return true;
  }

  return false;
}

async function handlePageRequest(requestUrl, response, domainContext) {
  if (requestUrl.pathname === "/") {
    sendText(response, 200, renderHomePage(domainContext), "text/html; charset=utf-8");
    return true;
  }

  if (requestUrl.pathname === "/vitrine") {
    sendText(
      response,
      200,
      renderVitrineTemplate(domainContext),
      "text/html; charset=utf-8"
    );
    return true;
  }

  if (requestUrl.pathname.startsWith("/g/")) {
    const slug = decodeURIComponent(requestUrl.pathname.replace("/g/", ""));
    const gallery = await findGalleryBySlug(slug, domainContext);

    if (!gallery) {
      sendNotFound(response);
      return true;
    }

    const detail = await buildGalleryDetail(gallery);
    sendText(response, 200, renderEntryPage(detail), "text/html; charset=utf-8");
    return true;
  }

  if (requestUrl.pathname.startsWith("/gallery/")) {
    const slug = decodeURIComponent(requestUrl.pathname.replace("/gallery/", ""));
    const gallery = await findGalleryBySlug(slug, domainContext);

    if (!gallery) {
      sendNotFound(response);
      return true;
    }

    const detail = await buildGalleryDetail(gallery);
    sendText(
      response,
      200,
      renderGalleryPlaceholderPage(detail),
      "text/html; charset=utf-8"
    );
    return true;
  }

  return false;
}

async function handleMediaRequest(requestUrl, response, domainContext) {
  if (!requestUrl.pathname.startsWith("/media/")) {
    return false;
  }

  const mediaParts = requestUrl.pathname.split("/").filter(Boolean);

  if (mediaParts.length !== 3) {
    sendNotFound(response);
    return true;
  }

  const slug = decodeURIComponent(mediaParts[1]);
  const fileName = decodeURIComponent(mediaParts[2]);
  const gallery = await findGalleryBySlug(slug, domainContext);

  if (!gallery) {
    sendNotFound(response);
    return true;
  }

  const { thumbnailsDir, largeDir } = getGalleryImagePaths(gallery);
  const fileCandidates = [
    path.join(thumbnailsDir, fileName),
    path.join(largeDir, fileName)
  ];

  for (const filePath of fileCandidates) {
    if (filePath.startsWith(thumbnailsDir) || filePath.startsWith(largeDir)) {
      if (await fileExists(filePath)) {
        sendFile(response, filePath, "image/jpeg");
        return true;
      }
    }
  }

  sendFile(response, path.join(appRoot, "assets", "capa-serra.svg"), "image/svg+xml; charset=utf-8");
  return true;
}

async function handleRequest(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed"
    });
    return;
  }

  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const domainContext = await resolveDomainContext(request);

  if (await handleApiRequest(requestUrl, response, domainContext)) {
    return;
  }

  if (await handlePageRequest(requestUrl, response, domainContext)) {
    return;
  }

  if (await handleMediaRequest(requestUrl, response, domainContext)) {
    return;
  }

  if (requestUrl.pathname === "/styles.css") {
    sendFile(response, cssFilePath, "text/css; charset=utf-8");
    return;
  }

  if (requestUrl.pathname === "/app.js") {
    sendFile(response, appJsFilePath, "application/javascript; charset=utf-8");
    return;
  }

  if (requestUrl.pathname && requestUrl.pathname.startsWith("/assets/")) {
    const assetPath = path.normalize(requestUrl.pathname.replace(/^\/+/, ""));
    const filePath = path.join(appRoot, assetPath);

    if (!filePath.startsWith(path.join(appRoot, "assets"))) {
      sendJson(response, 400, {
        status: "error",
        message: "Invalid asset path"
      });
      return;
    }

    sendFile(response, filePath, "image/svg+xml; charset=utf-8");
    return;
  }

  if (requestUrl.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "gallery-platform-app"
    });
    return;
  }

  sendNotFound(response);
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    const isClientError = error.message === "Invalid gallery source path";
    const isConfigError = error.message === "No configured domains";
    const statusCode = isClientError ? 400 : 500;
    const message = isClientError
      ? "Invalid gallery source path"
      : isConfigError
        ? "No configured domains"
        : "Internal server error";

    sendJson(response, statusCode, {
      status: "error",
      message
    });
  });
});

server.listen(port, () => {
  console.log(`gallery-platform app listening on port ${port}`);
});
