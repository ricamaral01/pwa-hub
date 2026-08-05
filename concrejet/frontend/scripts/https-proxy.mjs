import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

const [portArg, vitePortArg, pfxPath, passphrase] = process.argv.slice(2);
const port = Number(portArg || 5174);
const vitePort = Number(vitePortArg || 5173);

if (!pfxPath || !fs.existsSync(pfxPath)) {
  console.error(`PFX certificate not found: ${pfxPath}`);
  process.exit(1);
}

const server = https.createServer({ pfx: fs.readFileSync(pfxPath), passphrase }, (req, res) => {
  const isApi = req.url?.startsWith('/api');
  const targetPort = isApi ? 3000 : vitePort;
  const path = isApi ? req.url?.replace(/^\/api/, '') || '/' : req.url;
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

server.on('upgrade', (req, socket, head) => {
  const target = net.connect(vitePort, '127.0.0.1', () => {
    target.write(
      `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
        Object.entries(req.headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\r\n') +
        '\r\n\r\n',
    );
    if (head.length) target.write(head);
    socket.pipe(target).pipe(socket);
  });
  target.on('error', () => socket.destroy());
});

server.listen(port, '0.0.0.0');
