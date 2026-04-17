const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const port = Number(process.env.APP_PORT || process.env.PORT || 3000);
const appRoot = __dirname;
const repoRoot = path.resolve(appRoot, "..");
const galleriesFilePath = path.join(appRoot, "data", "galleries.json");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

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

async function listConsistentImageFiles(sourcePath) {
  const galleryRoot = resolveGallerySourcePath(sourcePath);
  const thumbnailsDir = path.join(galleryRoot, "images", "thumbnails");
  const largeDir = path.join(galleryRoot, "images", "large");

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

async function buildGallerySummary(gallery) {
  try {
    const imageFiles = await listConsistentImageFiles(gallery.sourcePath);

    return {
      ...gallery,
      imageCount: imageFiles.length
    };
  } catch (error) {
    return {
      ...gallery,
      imageCount: 0
    };
  }
}

async function buildGalleryDetail(gallery) {
  const imageFiles = await listConsistentImageFiles(gallery.sourcePath);

  return {
    ...gallery,
    images: {
      thumbnailsPath: `${gallery.sourcePath}/images/thumbnails`,
      largePath: `${gallery.sourcePath}/images/large`,
      files: imageFiles
    }
  };
}

async function handleApiRequest(requestUrl, response) {
  if (requestUrl.pathname === "/api/galleries") {
    const galleries = await loadGalleries();
    const payload = await Promise.all(galleries.map(buildGallerySummary));

    sendJson(response, 200, payload);
    return true;
  }

  if (requestUrl.pathname.startsWith("/api/gallery/")) {
    const slug = decodeURIComponent(requestUrl.pathname.replace("/api/gallery/", ""));
    const galleries = await loadGalleries();
    const gallery = galleries.find((item) => item.slug === slug);

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

async function handleRequest(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed"
    });
    return;
  }

  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (await handleApiRequest(requestUrl, response)) {
    return;
  }

  if (requestUrl.pathname === "/") {
    sendFile(
      response,
      path.join(appRoot, "index.html"),
      "text/html; charset=utf-8"
    );
    return;
  }

  if (requestUrl.pathname === "/styles.css") {
    sendFile(
      response,
      path.join(appRoot, "styles.css"),
      "text/css; charset=utf-8"
    );
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
    const statusCode = error.message === "Invalid gallery source path" ? 400 : 500;
    const message = statusCode === 400
      ? "Invalid gallery source path"
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
