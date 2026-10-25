function tickClock() {
  const now = new Date();
  const el = document.getElementById("clock");
  if (el) el.textContent = now.toLocaleString("pt-BR");
}

tickClock();
setInterval(tickClock, 1000);
