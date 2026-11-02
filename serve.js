const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "standalone");
const moviesRoot = path.resolve(__dirname, "capture2", "movies");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".wasm": "application/wasm",
  ".riv": "application/octet-stream",
};

function serveFile(req, res, file, type) {
  fs.stat(file, function (err, st) {
    if (err || !st.isFile()) {
      res.writeHead(404);
      return res.end("404 Not Found");
    }
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] ? parseInt(m[1], 10) : 0;
      let end = m && m[2] ? parseInt(m[2], 10) : st.size - 1;
      if (start >= st.size) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }); return res.end(); }
      end = Math.min(end, st.size - 1);
      res.writeHead(206, {
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${st.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Cache-Control": "no-cache",
      });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  });
}

function handleRequest(req, res) {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  // local movie library lives outside standalone/ (capture2/movies)
  if (p.startsWith("/movies/")) {
    const name = path.basename(p);
    const mfile = path.join(moviesRoot, name);
    if (!mfile.startsWith(moviesRoot)) { res.writeHead(403); return res.end("Forbidden"); }
    return serveFile(req, res, mfile, "video/mp4");
  }
  let file = path.join(root, p);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.stat(file, function (err, st) {
    if (!err && st.isDirectory()) file = path.join(file, "index.html");
    fs.stat(file, function (e2, st2) {
      if (e2 || !st2.isFile()) {
        res.writeHead(404);
        return res.end("404 Not Found: " + p);
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      fs.createReadStream(file).pipe(res);
    });
  });
}

const defaultPort = 8901;
const requestedPort = parseInt(process.env.PORT || process.argv[2], 10) || defaultPort;

function startServer(port, maxRetries = 5) {
  const server = http.createServer(handleRequest);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[!] Port ${port} is currently in use.`);
      if (maxRetries > 0) {
        console.log(`    Trying next port ${port + 1}...`);
        startServer(port + 1, maxRetries - 1);
      } else {
        console.error(`\n❌ Could not bind to an available port.`);
        console.error(`   To free port ${requestedPort} on Windows PowerShell, run:`);
        console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${requestedPort}).OwningProcess -Force\n`);
        process.exit(1);
      }
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`\n🚀 Explore Chaupal server running at:`);
    console.log(`   http://127.0.0.1:${port}/`);
    console.log(`   Serving root: ${root}`);
    console.log(`   Press Ctrl+C to stop.\n`);
  });
}

startServer(requestedPort);
