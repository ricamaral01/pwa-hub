import fs from 'node:fs';
import https from 'node:https';
import http from 'node:http';

const [portArg, vitePortArg, pfxPath, passphrase] = process.argv.slice(2);
const port = Number(portArg || 5174);
const vitePort = Number(vitePortArg || 5173);

const server = https.createServer({ pfx: fs.readFileSync(pfxPath), passphrase }, (req, res) => {
  const targetPort = req.url?.startsWith('/api') ? 3000 : vitePort;
  const path = req.url?.startsWith('/api') ? req.url.replace(/^\/api/, '') || '/' : req.url;
  const proxy = http.request(
    {
      hostname: '127.0.0.1',
      port: targetPort,
      method: req.method,
      path,
      headers: { ...req.headers, host: `127.0.0.1:${targetPort}` },
    },
    (upstream) => {
      res.writeHead(upstream.statusCode ?? 502, upstream.headers);
      upstream.pipe(res);
    },
  );
  proxy.on('error', () => {
    res.writeHead(502);
    res.end('ConcreTrack HTTPS proxy unavailable');
  });
  req.pipe(proxy);
});

server.listen(port, '0.0.0.0');
