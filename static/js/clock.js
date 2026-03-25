function tickClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;
  const now = new Date();
  clock.textContent = now.toLocaleString("pt-BR");
}

tickClock();
setInterval(tickClock, 1000);
