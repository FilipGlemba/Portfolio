const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");

  envFile.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
const apiKey = process.env.OPENWEATHER_API_KEY;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function proxyOpenWeather(response, endpoint, searchParams) {
  if (!apiKey) {
    sendJson(response, 500, { message: "Missing OPENWEATHER_API_KEY in .env." });
    return;
  }

  searchParams.set("appid", apiKey);
  const upstreamUrl = `https://api.openweathermap.org${endpoint}?${searchParams.toString()}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl);
    const text = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type") || "application/json; charset=utf-8";

    response.writeHead(upstreamResponse.status, { "Content-Type": contentType });
    response.end(text);
  } catch (error) {
    sendJson(response, 502, { message: "Upstream weather service is unavailable.", detail: error.message });
  }
}

function serveStaticFile(requestPath, response) {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const resolvedPath = path.normalize(path.join(rootDir, safePath));

  if (!resolvedPath.startsWith(rootDir)) {
    sendJson(response, 403, { message: "Forbidden path." });
    return;
  }

  fs.readFile(resolvedPath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendJson(response, 404, { message: "File not found." });
        return;
      }

      sendJson(response, 500, { message: "Failed to read requested file." });
      return;
    }

    const fileExtension = path.extname(resolvedPath).toLowerCase();
    response.writeHead(200, { "Content-Type": mimeTypes[fileExtension] || "application/octet-stream" });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === "/api/weather") {
    await proxyOpenWeather(response, "/data/2.5/weather", requestUrl.searchParams);
    return;
  }

  if (requestUrl.pathname === "/api/forecast") {
    await proxyOpenWeather(response, "/data/2.5/forecast", requestUrl.searchParams);
    return;
  }

  if (requestUrl.pathname === "/api/geocode") {
    await proxyOpenWeather(response, "/geo/1.0/direct", requestUrl.searchParams);
    return;
  }

  if (requestUrl.pathname === "/api/air-quality") {
    await proxyOpenWeather(response, "/data/2.5/air_pollution", requestUrl.searchParams);
    return;
  }

  serveStaticFile(requestUrl.pathname, response);
});

server.listen(port, host, () => {
  console.log(`Atmos is running on ${host}:${port}`);
});
