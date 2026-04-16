const http = require("http");

const port = Number(process.env.APP_PORT || process.env.PORT || 3000);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

const server = http.createServer((request, response) => {
  if (request.method !== "GET") {
    sendJson(response, 405, {
      status: "error",
      message: "Method not allowed"
    });
    return;
  }

  if (request.url === "/") {
    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end("gallery-platform app is active");
    return;
  }

  if (request.url === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "gallery-platform-app"
    });
    return;
  }

  sendJson(response, 404, {
    status: "error",
    message: "Not found"
  });
});

server.listen(port, () => {
  console.log(`gallery-platform app listening on port ${port}`);
});
