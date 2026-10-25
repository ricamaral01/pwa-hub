const banner = document.createElement('div');
banner.setAttribute('role', 'status');
banner.textContent = '⚠ PILOTO — o sistema oficial continua sendo o legado. Não use estas cartas na produção.';
banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:100;background:#ffca55;color:#302005;padding:10px 16px;text-align:center;font:700 15px system-ui;box-shadow:0 2px 8px #0002';
document.body.prepend(banner);
fetch('/api/v1/saude').then(response => response.json()).then(body => {
  if (body.piloto !== true) banner.remove();
}).catch(() => {});
