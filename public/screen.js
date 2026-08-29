/* Projector view. Lives on the room screen for the whole event: a countdown
 * everyone can see, live circle counts, and a big MOVE flash on rotation. */

(() => {
  const $ = id => document.getElementById(id);
  let data = null;
  let lastRound = 0;

  function render(next) {
    data = next;
    const { event, colors, guests } = data;
    const live = event.status === 'running' || event.status === 'paused';

    $('live').style.display = live ? 'grid' : 'none';
    $('idle').style.display = live ? 'none' : 'grid';
    $('guests').textContent = guests;

    if (event.status === 'ended') {
      $('round').textContent = 'Thank you';
      $('idle-note').textContent = `${guests} guests, ${event.roundIndex} rounds of new conversations.`;
    } else if (live) {
      $('round').textContent = `Round ${event.roundIndex}`;
    }

    $('circles').innerHTML = colors.map(c => `
      <div class="c">
        <div class="dot" style="background:${c.hex}"></div>
        <div class="nm">${c.name}</div>
        <div class="n">${c.count}</div>
      </div>`).join('');

    // New round: flash the room and sound the chime through the house system.
    if (event.roundIndex !== lastRound && lastRound !== 0 && live) {
      const move = $('move');
      move.classList.add('on');
      window.Sound?.rotate();
      setTimeout(() => move.classList.remove('on'), 7000);
    }
    lastRound = event.roundIndex;
    paint();
  }

  function paint() {
    if (!data) return;
    const { status, roundEndsAt, pausedRemainingMs } = data.event;
    const clock = $('clock');
    if (status === 'paused') {
      clock.textContent = 'Paused';
      clock.classList.remove('urgent');
      $('clock-note').textContent = 'the host will start the next round shortly';
      return;
    }
    if (!roundEndsAt) return;
    const left = Math.max(0, roundEndsAt - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    clock.textContent = `${m}:${String(s).padStart(2, '0')}`;
    clock.classList.toggle('urgent', left < 60000);
    $('clock-note').textContent = left < 60000 ? 'get ready to move' : 'until the next rotation';
  }

  setInterval(paint, 1000);

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${proto}://${location.host}/ws?role=screen`);
    socket.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'screen') render(msg.data);
    };
    socket.onclose = () => setTimeout(connect, 3000);
  }

  // Browsers will not play audio until someone interacts with the page, so the
  // operator arms it once when they put the screen up.
  $('arm').addEventListener('click', () => {
    window.Sound?.unlock();
    window.Sound?.tick();
    $('arm').classList.add('off');
  }, { once: true });

  fetch('/api/screen').then(r => r.json()).then(render);
  fetch('/api/qr').then(r => r.json()).then(({ dataUrl }) => { $('qr').src = dataUrl; });
  connect();
})();
