const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
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
const ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;
const galleryAccessStore = new Map();

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

function redirect(response, location) {
  response.writeHead(302, {
    Location: location
  });
  response.end();
}

function redirectWithHeaders(response, location, headers) {
  response.writeHead(302, {
    Location: location,
    ...headers
  });
  response.end();
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

function getEntryUrl(gallery, errorCode) {
  const baseUrl = `/g/${encodeURIComponent(gallery.slug)}`;

  if (!errorCode) {
    return baseUrl;
  }

  return `${baseUrl}?error=${encodeURIComponent(errorCode)}`;
}

function getGalleryUrl(gallery) {
  return `/gallery/${encodeURIComponent(gallery.slug)}`;
}

function getContentType(fileName) {
  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".svg":
      return "image/svg+xml; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function normalizeHost(host) {
  return String(host || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

function parseCookies(request) {
  const header = request.headers.cookie || "";

  if (!header) {
    return {};
  }

  return header.split(";").reduce((cookies, item) => {
    const [rawName, ...rawValueParts] = item.trim().split("=");
    const rawValue = rawValueParts.join("=");

    if (!rawName) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValue || "");
    return cookies;
  }, {});
}

function getGalleryAccessCookieName(gallery) {
  return `gallery_access_${gallery.slug}`;
}

function pruneExpiredGalleryAccess() {
  const now = Date.now();

  for (const [token, access] of galleryAccessStore.entries()) {
    if (access.expiresAt <= now) {
      galleryAccessStore.delete(token);
    }
  }
}

function createGalleryAccess(gallery) {
  pruneExpiredGalleryAccess();

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + ACCESS_TOKEN_TTL_MS;

  galleryAccessStore.set(token, {
    slug: gallery.slug,
    expiresAt
  });

  return {
    token,
    expiresAt
  };
}

function buildGalleryAccessCookie(gallery, token) {
  const cookieName = getGalleryAccessCookieName(gallery);
  const maxAge = Math.floor(ACCESS_TOKEN_TTL_MS / 1000);

  return `${cookieName}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/gallery/${encodeURIComponent(gallery.slug)}; HttpOnly; SameSite=Lax`;
}

function hasValidGalleryAccess(request, gallery) {
  pruneExpiredGalleryAccess();

  const cookieName = getGalleryAccessCookieName(gallery);
  const cookies = parseCookies(request);
  const token = cookies[cookieName];

  if (!token) {
    return false;
  }

  const access = galleryAccessStore.get(token);

  if (!access || access.slug !== gallery.slug || access.expiresAt <= Date.now()) {
    galleryAccessStore.delete(token);
    return false;
  }

  return true;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString("utf8");

      if (body.length > 10_000) {
        reject(new Error("Request body too large"));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
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
      entryUrl: getEntryUrl(gallery),
      galleryUrl: getGalleryUrl(gallery)
    };
  } catch (error) {
    return {
      ...gallery,
      imageCount: 0,
      coverUrl: "/assets/capa-serra.svg",
      entryUrl: getEntryUrl(gallery),
      galleryUrl: getGalleryUrl(gallery)
    };
  }
}

async function buildGalleryDetail(gallery) {
  const imageFiles = await listConsistentImageFiles(gallery.sourcePath);
  const coverUrl = await getCoverUrl(gallery);
  const imageItems = imageFiles.map((fileName) => ({
    fileName,
    thumbnailUrl: `/media/${encodeURIComponent(gallery.slug)}/thumbnails/${encodeURIComponent(fileName)}`,
    largeUrl: `/media/${encodeURIComponent(gallery.slug)}/large/${encodeURIComponent(fileName)}`
  }));

  return {
    ...gallery,
    coverUrl,
    entryUrl: getEntryUrl(gallery),
    galleryUrl: getGalleryUrl(gallery),
    images: {
      thumbnailsPath: `${gallery.sourcePath}/images/thumbnails`,
      largePath: `${gallery.sourcePath}/images/large`,
      files: imageFiles,
      items: imageItems
    }
  };
}

function renderEntryPage(gallery) {
  const statusText = gallery.isPrivate ? "Privada" : "Publica";
  const hasPasswordError = gallery.accessError === "invalid-password";
  const privateAccessMarkup = `
          <form class="entry-form" method="POST" action="/access/${encodeURIComponent(gallery.slug)}">
            <label class="entry-label" for="gallery-password">Senha</label>
            <input
              class="entry-input"
              id="gallery-password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
            >
            ${hasPasswordError ? '<p class="entry-error">Senha incorreta. Tente novamente.</p>' : ""}
            <button class="entry-action entry-action--private" type="submit">Acessar galeria</button>
          </form>
          <p class="entry-note">Esta galeria e privada. O controle atual usa verificacao simples por senha, sem sessao persistente.</p>`;
  const publicAccessMarkup = `
          <a class="entry-action" href="${escapeHtml(gallery.galleryUrl)}">Entrar na galeria</a>
          <p class="entry-note">Esta galeria esta sinalizada como publica e segue para a experiencia final.</p>`;

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
          ${gallery.isPrivate ? privateAccessMarkup : publicAccessMarkup}
        </div>
      </section>
    </main>
  </body>
</html>`;
}

function renderGalleryPlaceholderPage(gallery) {
  const firstImage = gallery.images.items[0] || null;
  const thumbnailsMarkup = gallery.images.items.map((image, index) => {
    const isActive = index === 0 ? " gallery-thumb-button--active" : "";

    return `<button
      class="gallery-thumb-button${isActive}"
      type="button"
      data-large-src="${escapeHtml(image.largeUrl)}"
      data-file-name="${escapeHtml(image.fileName)}"
      aria-label="Abrir imagem ${index + 1} de ${gallery.images.items.length}"
    >
      <img src="${escapeHtml(image.thumbnailUrl)}" alt="Thumbnail ${index + 1} da galeria ${escapeHtml(gallery.title)}" loading="lazy">
    </button>`;
  }).join("");

  const emptyMarkup = `
      <section class="gallery-placeholder-panel">
        <p class="eyebrow">Galeria final</p>
        <h1>${escapeHtml(gallery.title)}</h1>
        <p>Galeria sem imagens disponiveis</p>
      </section>`;

  const galleryMarkup = `
      <section class="gallery-viewer-panel">
        <div class="gallery-stage">
          <img
            id="galleryLargeImage"
            src="${escapeHtml(firstImage.largeUrl)}"
            alt="Imagem ampliada da galeria ${escapeHtml(gallery.title)}"
          >
        </div>
        <div class="gallery-stage-caption">
          <span class="eyebrow">Visualizacao</span>
          <p id="galleryLargeLabel">${escapeHtml(firstImage.fileName)}</p>
        </div>
      </section>
      <section class="gallery-thumb-panel">
        <div class="section-heading">
          <h2>Thumbnails</h2>
          <p>Toque ou clique em uma miniatura para trocar a imagem em destaque.</p>
        </div>
        <div class="gallery-thumb-grid" id="galleryThumbGrid">
          ${thumbnailsMarkup}
        </div>
      </section>
      <script>
        (function () {
          const viewer = document.getElementById("galleryLargeImage");
          const label = document.getElementById("galleryLargeLabel");
          const buttons = Array.from(document.querySelectorAll(".gallery-thumb-button"));

          function setActiveButton(target) {
            buttons.forEach((button) => {
              button.classList.toggle("gallery-thumb-button--active", button === target);
            });
          }

          buttons.forEach((button) => {
            button.addEventListener("click", () => {
              const largeSrc = button.getAttribute("data-large-src");
              const fileName = button.getAttribute("data-file-name");

              viewer.setAttribute("src", largeSrc);
              viewer.setAttribute("alt", "Imagem ampliada " + fileName);
              label.textContent = fileName;
              setActiveButton(button);
            });
          });
        }());
      </script>`;

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
        <p>Visualizacao real baseada nos arquivos locais do export do Lightroom Classic, usando thumbnails e imagem grande em pares consistentes.</p>
      </section>
      ${firstImage ? galleryMarkup : emptyMarkup}
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

async function handlePageRequest(requestUrl, request, response, domainContext) {
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
    detail.accessError = requestUrl.searchParams.get("error") || "";
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

    if (gallery.isPrivate && !hasValidGalleryAccess(request, gallery)) {
      redirect(response, getEntryUrl(gallery));
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

async function handleAccessRequest(requestUrl, request, response, domainContext) {
  if (request.method !== "POST" || !requestUrl.pathname.startsWith("/access/")) {
    return false;
  }

  const slug = decodeURIComponent(requestUrl.pathname.replace("/access/", ""));
  const gallery = await findGalleryBySlug(slug, domainContext);

  if (!gallery) {
    sendNotFound(response);
    return true;
  }

  if (!gallery.isPrivate) {
    redirect(response, gallery.galleryUrl);
    return true;
  }

  const rawBody = await readRequestBody(request);
  const formData = new URLSearchParams(rawBody);
  const submittedPassword = formData.get("password") || "";
  const expectedPassword = gallery.password || "";

  if (submittedPassword && submittedPassword === expectedPassword) {
    const access = createGalleryAccess(gallery);
    const cookie = buildGalleryAccessCookie(gallery, access.token);

    redirectWithHeaders(response, gallery.galleryUrl, {
      "Set-Cookie": cookie
    });
    return true;
  }

  redirect(response, getEntryUrl(gallery, "invalid-password"));
  return true;
}

async function handleMediaRequest(requestUrl, response, domainContext) {
  if (!requestUrl.pathname.startsWith("/media/")) {
    return false;
  }

  const mediaParts = requestUrl.pathname.split("/").filter(Boolean);

  if (mediaParts.length !== 3 && mediaParts.length !== 4) {
    sendNotFound(response);
    return true;
  }

  const slug = decodeURIComponent(mediaParts[1]);
  const gallery = await findGalleryBySlug(slug, domainContext);

  if (!gallery) {
    sendNotFound(response);
    return true;
  }

  const { thumbnailsDir, largeDir } = getGalleryImagePaths(gallery);

  if (mediaParts.length === 4) {
    const variant = decodeURIComponent(mediaParts[2]);
    const fileName = decodeURIComponent(mediaParts[3]);
    const baseDir = variant === "thumbnails"
      ? thumbnailsDir
      : variant === "large"
        ? largeDir
        : null;

    if (!baseDir) {
      sendNotFound(response);
      return true;
    }

    const filePath = path.join(baseDir, fileName);

    if (filePath.startsWith(baseDir) && await fileExists(filePath)) {
      sendFile(response, filePath, getContentType(fileName));
      return true;
    }

    sendNotFound(response);
    return true;
  }

  const fileName = decodeURIComponent(mediaParts[2]);
  const fileCandidates = [path.join(thumbnailsDir, fileName), path.join(largeDir, fileName)];

  for (const filePath of fileCandidates) {
    if (filePath.startsWith(thumbnailsDir) || filePath.startsWith(largeDir)) {
      if (await fileExists(filePath)) {
        sendFile(response, filePath, getContentType(fileName));
        return true;
      }
    }
  }

  sendFile(response, path.join(appRoot, "assets", "capa-serra.svg"), getContentType("fallback.svg"));
  return true;
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const domainContext = await resolveDomainContext(request);

  if (await handleAccessRequest(requestUrl, request, response, domainContext)) {
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed"
    });
    return;
  }

  if (await handleApiRequest(requestUrl, response, domainContext)) {
    return;
  }

  if (await handlePageRequest(requestUrl, request, response, domainContext)) {
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
    const isBodyTooLarge = error.message === "Request body too large";
    const isConfigError = error.message === "No configured domains";
    const statusCode = isClientError
      ? 400
      : isBodyTooLarge
        ? 413
        : 500;
    const message = isClientError
      ? "Invalid gallery source path"
      : isBodyTooLarge
        ? "Request body too large"
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
