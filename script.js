(() => {
  const $ = (s) => document.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noteMsg = $("#noteMsg");
  const bgCanvas = $("#bgCanvas");

  /* ---------- Hạt bụi đêm trôi chậm trên nền tối ---------- */
  if (bgCanvas && !reduce) {
    const ctx = bgCanvas.getContext("2d");
    let w = 0, h = 0, pts = [];
    function resize() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      bgCanvas.width = w * d; bgCanvas.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 28; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 1.6,
        vy: 0.15 + Math.random() * 0.35,
        vx: (Math.random() - 0.5) * 0.15,
        a: 0.12 + Math.random() * 0.25,
        ph: Math.random() * 6.28
      });
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.ph += 0.012;
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.ph) * 0.12;
        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
        ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.ph * 1.5));
        ctx.fillStyle = "#94A3B8";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Chữ hiện dần ---------- */
  function prepare(el) {
    const text = el.textContent.normalize("NFC");
    el.textContent = "";
    const sr = document.createElement("span");
    sr.className = "sr"; sr.textContent = text;
    el.appendChild(sr);
    const chars = [];
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span");
      w.className = "w"; w.setAttribute("aria-hidden", "true");
      for (const ch of part) {
        const c = document.createElement("span");
        c.className = "c"; c.textContent = ch;
        w.appendChild(c); chars.push(c);
      }
      el.appendChild(w);
    });
    el._chars = chars;
    return el;
  }

  let skipping = false;
  const pending = new Set();
  function sleep(ms) {
    if (skipping) return Promise.resolve();
    return new Promise((res) => {
      const fin = () => { clearTimeout(tm); pending.delete(fin); res(); };
      const tm = setTimeout(fin, ms);
      pending.add(fin);
    });
  }
  function skip() {
    skipping = true;
    [...pending].forEach((f) => f());
  }

  async function type(el, ms) {
    for (const c of el._chars) {
      c.classList.add("on");
      if (skipping) continue;
      const ch = c.textContent;
      await sleep(ms * (/[.!?…]/.test(ch) ? 8 : /[,;:]/.test(ch) ? 4.5 : 1));
    }
  }

  /* ---------- Chạy chữ lời nhắn rồi mở nút tracking ---------- */
  prepare(noteMsg);
  if (reduce) {
    noteMsg._chars.forEach((c) => c.classList.add("on"));
    if (window._revealTrackGate) window._revealTrackGate();
  } else {
    type(noteMsg, 32).then(() => {
      if (window._revealTrackGate) window._revealTrackGate();
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest(".trk-gate") || e.target.closest(".trk")) return;
    if (!skipping) skip();
  });
})();
