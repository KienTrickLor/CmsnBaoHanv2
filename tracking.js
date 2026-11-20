/* ============================================================
   Theo dõi hành trình: Điểm đi Hải Phòng -> Điểm nhận Gia Lai
   ============================================================ */
(() => {
  "use strict";

  const TRACK = {
    fromCity: "Hải Phòng",
    toCity: "Gia Lai",
    distanceKm: "1.120 km",
    text: "Hành trình từ Hải Phòng đến Gia Lai",
    btnText: "Xem hành trình",
    doneText: "Đã đến Gia Lai",
    from: [20.8449, 106.6881],
    via: [
      [20.25, 105.97], [19.81, 105.78], [18.68, 105.68], [17.47, 106.62],
      [16.46, 107.59], [16.05, 108.22], [15.12, 108.80], [14.65, 109.03],
      [13.78, 109.22], [13.95, 108.90], [14.00, 108.65]
    ],
    to: [13.9833, 108.0022],
    days: 3.5,
    minStartProgress: 0.10,
    startAt: "2026-11-16T00:00:50+07:00",
    drawMs: 3600
  };

  const STAGES = [
    { upTo: 0.02, label: "Xuất phát từ Hải Phòng" },
    { upTo: 0.14, label: "Đã rời Hải Phòng · Qua Ninh Bình" },
    { upTo: 0.28, label: "Đang qua Thanh Hóa – Nghệ An" },
    { upTo: 0.44, label: "Đang qua Hà Tĩnh – Quảng Bình" },
    { upTo: 0.60, label: "Đang qua Huế – Đà Nẵng" },
    { upTo: 0.76, label: "Đang qua Quảng Ngãi – Quy Nhơn" },
    { upTo: 0.92, label: "Đang vượt đèo An Khê lên Tây Nguyên" },
    { upTo: 0.999, label: "Đã vào Gia Lai" },
    { upTo: 1.01, label: "Đã đến Gia Lai" }
  ];

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
  const TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";

  const letter = document.querySelector("#letter");
  const anchor = document.querySelector("#trackingAnchor");
  if (!letter || !anchor) return;

  const HEART_PATH = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
  const HEART = '<svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="' + HEART_PATH + '"/></svg>';

  const PIN = '<svg class="trk-end-pin" viewBox="0 0 40 52" aria-hidden="true">' +
    '<defs><linearGradient id="trkPinG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B57286"/><stop offset="1" stop-color="#533245"/></linearGradient></defs>' +
    '<path d="M20 51C20 51 3 33 3 19a17 17 0 1 1 34 0C37 33 20 51 20 51z" fill="url(#trkPinG)" stroke="rgba(226,232,240,.75)" stroke-width="1.6"/>' +
    '<path d="M20 27C10.5 20.5 10.5 11.5 16.3 11.5c2.3 0 3.7 1.5 3.7 3.2 0-1.7 1.4-3.2 3.7-3.2C29.5 11.5 29.5 20.5 20 27z" fill="#E2E8F0"/></svg>';

  function spline(P, steps) {
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (
          2 * p1[k] + (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    out.push(P[P.length - 1]);
    return out;
  }
  const COS = Math.cos(15 * Math.PI / 180);
  const dist = (a, b) => Math.hypot(b[0] - a[0], (b[1] - a[1]) * COS);

  const pts = spline([TRACK.from, ...TRACK.via, TRACK.to], 18);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  const TOTAL = cum[cum.length - 1];

  function at(d) {
    d = Math.max(0, Math.min(TOTAL, d));
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const span = cum[i] - cum[i - 1] || 1;
    const k = (d - cum[i - 1]) / span;
    const a = pts[i - 1], b = pts[i];
    return { idx: i - 1, pt: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] };
  }
  const ease = (k) => 0.5 - 0.5 * Math.cos(Math.PI * k);

  function loadLeaflet(done) {
    if (window.L) { done(); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = LEAFLET_CSS;
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = LEAFLET_JS; js.onload = done;
    js.onerror = () => {};
    document.head.appendChild(js);
  }

  const KEY = "trk_start_hp_gl";
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, String(v)); } catch (e) {} }
  };
  const fixedStart = TRACK.startAt ? Date.parse(TRACK.startAt) : NaN;
  function startMs() {
    if (!isNaN(fixedStart)) return fixedStart;
    const v = Number(store.get());
    return v > 0 ? v : null;
  }
  function progressNow() {
    const s = startMs();
    const baseP = TRACK.minStartProgress || 0.10;
    if (s === null) return baseP;
    const raw = Math.max(0, (Date.now() - s) / (TRACK.days * 864e5));
    return Math.min(1, baseP + (1 - baseP) * raw);
  }
  function stageText(p) {
    for (let i = 0; i < STAGES.length; i++) {
      if (p <= STAGES[i].upTo) return STAGES[i].label;
    }
    return STAGES[STAGES.length - 1].label;
  }
  function etaText(p) {
    if (p >= 1) return "Đã tới Gia Lai";
    const baseP = TRACK.minStartProgress || 0.10;
    const remRatio = Math.max(0, (1 - p) / (1 - baseP));
    const left = remRatio * TRACK.days * 864e5;
    const d = Math.floor(left / 864e5);
    const h = Math.floor((left % 864e5) / 36e5);
    const m = Math.max(1, Math.floor((left % 36e5) / 6e4));
    if (d > 0) return "Còn ~" + d + " ngày " + h + "h";
    if (h > 0) return "Còn ~" + h + " giờ " + m + "p";
    return "Còn ~" + m + " phút";
  }

  function launchHeart(fromEl) {
    if (reduce) return;
    const r = fromEl.getBoundingClientRect();
    const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
    const el = document.createElement("div");
    el.className = "trk-fly";
    el.style.left = x0 + "px"; el.style.top = y0 + "px";
    el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + HEART_PATH + '" fill="#B57286"/></svg>';
    document.body.appendChild(el);

    const dx = Math.min(innerWidth * 0.42, 220), dy = -(y0 + 160);
    const T = "translate(-50%,-50%) ";
    const anim = el.animate([
      { transform: T + "scale(1) rotate(0deg)", opacity: 1, offset: 0, easing: "cubic-bezier(.2,.8,.3,1)" },
      { transform: T + "translate(0,-42px) scale(1.8) rotate(-10deg)", opacity: 1, offset: 0.28, easing: "ease-in-out" },
      { transform: T + "translate(" + dx + "px," + dy + "px) scale(.5) rotate(20deg)", opacity: 0, offset: 1 }
    ], { duration: 1350, fill: "forwards" });

    const trail = setInterval(() => {
      if (anim.currentTime < 360) return;
      const b = el.getBoundingClientRect();
      const sp = document.createElement("i");
      sp.className = "trk-spark";
      sp.style.left = (b.left + b.width / 2 + (Math.random() * 14 - 7)) + "px";
      sp.style.top = (b.top + b.height / 2 + (Math.random() * 14 - 7)) + "px";
      document.body.appendChild(sp);
      sp.animate([
        { transform: "translate(-50%,-50%) scale(.8)", opacity: 0.85 },
        { transform: "translate(-50%,calc(-50% + 22px)) scale(0)", opacity: 0 }
      ], { duration: 600, easing: "ease-out" }).onfinish = () => sp.remove();
    }, 55);
    anim.onfinish = () => { clearInterval(trail); el.remove(); };
  }

  function init() {
    const alreadySent = store.get() !== null;
    let sec = null, mount = null;

    const gate = document.createElement("div");
    gate.className = "trk-gate";
    gate.innerHTML =
      '<button class="trk-send" id="trkSendBtn" type="button">' +
        '<span class="trk-send-ico">' + HEART + "</span>" +
        '<span class="trk-send-txt"></span>' +
      "</button>";
    anchor.insertAdjacentElement("afterend", gate);
    const sendBtn = gate.querySelector(".trk-send");
    const ico = gate.querySelector(".trk-send-ico");
    const txt = gate.querySelector(".trk-send-txt");

    window._revealTrackGate = () => gate.classList.add("in");

    function markSent() {
      sendBtn.classList.add("sent"); sendBtn.disabled = true;
      txt.textContent = TRACK.fromCity + " ➔ " + TRACK.toCity;
    }
    txt.textContent = TRACK.btnText;
    if (alreadySent) markSent();

    const gio = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) gate.classList.add("in"); });
    }, { root: letter, threshold: 0.25 });
    gio.observe(gate);

    sendBtn.addEventListener("click", () => {
      if (sendBtn.disabled) return;
      if (store.get() === null) store.set(Date.now());
      ico.classList.add("gone");
      launchHeart(ico);
      markSent();
      setTimeout(() => ico.classList.remove("gone"), reduce ? 0 : 1000);
      setTimeout(() => {
        mount();
        const r = sec.getBoundingClientRect();
        letter.scrollBy({ top: r.top + r.height / 2 - innerHeight / 2, behavior: reduce ? "auto" : "smooth" });
        setTimeout(() => { if (sec && sec._reveal) sec._reveal(); }, 320);
      }, reduce ? 0 : 850);
    });

    mount = function () {
      if (sec) return;
      const L = window.L;
      sec = document.createElement("section");
      sec.className = "trk";
      sec.setAttribute("aria-label", TRACK.text);
      sec.style.setProperty("--p", "0%");

      const words = (t) => t.split(" ").map((w, i) =>
        '<span class="trk-w" style="--i:' + i + '" aria-hidden="true">' + w + "</span>").join(" ");

      sec.innerHTML =
        '<div class="trk-card">' +
          '<div class="trk-route-head">' +
            '<div class="trk-place start">' +
              '<span class="trk-place-lbl"><i></i>Điểm đi</span>' +
              '<span class="trk-place-name">' + TRACK.fromCity + '</span>' +
            '</div>' +
            '<div class="trk-route-mid" aria-hidden="true">' +
              '<span class="trk-route-dist">' + TRACK.distanceKm + '</span>' +
              '<div class="trk-route-line"><span class="trk-route-runner">' + HEART + '</span></div>' +
            '</div>' +
            '<div class="trk-place end">' +
              '<span class="trk-place-lbl">Điểm nhận<i></i></span>' +
              '<span class="trk-place-name">' + TRACK.toCity + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="trk-map"></div>' +
          '<div class="trk-info">' +
            '<span class="trk-ico">' + HEART + "</span>" +
            '<div class="trk-txt">' +
              '<div class="trk-head-row">' +
                '<p class="trk-line"><span class="trk-sr">' + TRACK.text + '</span><span class="trk-words">' + words(TRACK.text) + '</span>' +
                  '<span class="trk-dots" aria-hidden="true"><i></i><i></i><i></i></span></p>' +
                '<span class="trk-pct">0%</span>' +
              '</div>' +
              '<div class="trk-bar" aria-hidden="true"><i></i></div>' +
              '<div class="trk-meta-row">' +
                '<span class="trk-stage-txt">' + stageText(0) + '</span>' +
                '<p class="trk-eta">' + etaText(progressNow()) + '</p>' +
              '</div>' +
            "</div>" +
          "</div>" +
        "</div>";
      gate.insertAdjacentElement("afterend", sec);

      const wordsEl = sec.querySelector(".trk-words");
      const srEl = sec.querySelector(".trk-sr");
      const etaEl = sec.querySelector(".trk-eta");
      const pctEl = sec.querySelector(".trk-pct");
      const stageEl = sec.querySelector(".trk-stage-txt");

      const map = L.map(sec.querySelector(".trk-map"), {
        zoomControl: false, dragging: false, touchZoom: false, doubleClickZoom: false,
        scrollWheelZoom: false, boxZoom: false, keyboard: false, tap: false,
        zoomSnap: 0, zoomAnimation: false, inertia: false
      });
      map.attributionControl.setPrefix(false);
      L.tileLayer(TILE_URL, {
        maxZoom: 16, attribution: "Esri, HERE, Garmin, © OpenStreetMap"
      }).addTo(map);

      const line = (o) => L.polyline([], Object.assign({ lineCap: "round", lineJoin: "round", interactive: false }, o)).addTo(map);
      L.polyline(pts, {
        color: "#64748B", weight: 2, opacity: 0.45, dashArray: "4 8",
        lineCap: "round", className: "trk-ghost", interactive: false
      }).addTo(map);

      const glow1 = line({ color: "#9E6B7B", weight: 14, opacity: 0.16 });
      const glow2 = line({ color: "#B57286", weight: 7, opacity: 0.30 });
      const main = line({ color: "#E2E8F0", weight: 2.8, opacity: 0.95 });

      const mk = (latlng, cls, html, size, anc, z) => L.marker(latlng, {
        icon: L.divIcon({ className: cls, html, iconSize: size, iconAnchor: anc }),
        interactive: false, keyboard: false, zIndexOffset: z || 0
      }).addTo(map);

      mk(TRACK.from, "trk-start",
        '<span class="trk-start-pulse"></span><span class="trk-start-dot"></span>' +
        '<div class="trk-pin-badge from-badge"><span class="trk-pin-sub">Điểm đi</span><span class="trk-pin-city">' + TRACK.fromCity + '</span></div>',
        [20, 20], [10, 10], 400);

      mk(TRACK.to, "trk-end",
        '<i class="trk-rip"></i><i class="trk-rip r2"></i>' + PIN +
        '<div class="trk-pin-badge to-badge"><span class="trk-pin-sub">Điểm nhận</span><span class="trk-pin-city">' + TRACK.toCity + '</span></div>',
        [46, 54], [23, 50], 500);

      const comet = mk(TRACK.from, "trk-comet", '<div class="trk-comet-dot"></div>', [10, 10], [5, 5], 800);

      const MINI = [[0, 48, 0, 1, -14], [0.55, 42, 10, 0.8, 12], [1.1, 52, -10, 0.88, -8], [1.65, 38, 6, 0.72, 16]]
        .map((m) => '<i class="trk-mini" style="--d:' + m[0] + "s;--far:" + m[1] + "px;--side:" + m[2] + "px;--sc:" + m[3] + ";--r:" + m[4] + 'deg"></i>').join("");
      const pkg = mk(TRACK.from, "trk-pkg", '<span class="trk-halo"></span>' + MINI + '<span class="trk-core">' + HEART + "</span>", [46, 46], [23, 23], 1000);

      const fit = () => {
        map.invalidateSize();
        map.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [44, 86], paddingBottomRight: [44, 132], animate: false });
      };
      fit();
      addEventListener("resize", fit);

      let raf = 0, cometRaf = 0, timer = 0, tick = 0, shown = false, arrived = false;
      const setSeg = (seg) => { glow1.setLatLngs(seg); glow2.setLatLngs(seg); main.setLatLngs(seg); };

      function aim(e) {
        const el = pkg.getElement();
        if (!el) return;
        const a = map.latLngToLayerPoint(pts[e.idx]), b = map.latLngToLayerPoint(pts[Math.min(pts.length - 1, e.idx + 1)]);
        let dx = b.x - a.x, dy = b.y - a.y;
        const n = Math.hypot(dx, dy) || 1;
        dx /= n; dy /= n;
        el.style.setProperty("--dx", dx.toFixed(3));
        el.style.setProperty("--dy", dy.toFixed(3));
        el.style.setProperty("--px", (-dy).toFixed(3));
        el.style.setProperty("--py", dx.toFixed(3));
      }

      function applyProgressState(curP) {
        const e = at(TOTAL * curP);
        setSeg(curP <= 0.001 ? [] : pts.slice(0, e.idx + 1).concat([e.pt]));
        pkg.setLatLng(e.pt);
        aim(e);
        sec.style.setProperty("--p", (curP * 100).toFixed(2) + "%");
        if (pctEl) pctEl.textContent = Math.round(curP * 100) + "%";
        if (stageEl) stageEl.textContent = stageText(curP);
      }

      function startCometLoop() {
        if (reduce || cometRaf) return;
        const tStart = performance.now();
        function stepComet(now) {
          if (!shown) { cometRaf = 0; return; }
          const cycle = ((now - tStart) % 4400) / 4400;
          const e = at(TOTAL * ease(cycle));
          comet.setLatLng(e.pt);
          cometRaf = requestAnimationFrame(stepComet);
        }
        cometRaf = requestAnimationFrame(stepComet);
      }

      function refresh() {
        const p = progressNow();
        applyProgressState(p);
        etaEl.textContent = etaText(p);
        if (p >= 1 && !arrived) {
          arrived = true;
          srEl.textContent = TRACK.doneText;
          wordsEl.innerHTML = words(TRACK.doneText);
          sec.classList.add("trk-arrived");
        }
        if (p >= 1) clearInterval(tick);
      }

      function draw() {
        sec.classList.add("trk-live");
        startCometLoop();
        const targetP = progressNow();
        const t0 = performance.now();
        function step(now) {
          const k = Math.min(1, (now - t0) / TRACK.drawMs);
          const curP = targetP * ease(k);
          applyProgressState(curP);
          if (k < 1) raf = requestAnimationFrame(step);
          else { refresh(); tick = setInterval(refresh, 20000); }
        }
        raf = requestAnimationFrame(step);
      }

      function reveal() {
        if (shown) return;
        shown = true;
        fit();
        applyProgressState(0);
        etaEl.textContent = etaText(progressNow());
        sec.classList.add("in");
        timer = setTimeout(draw, 650);
      }
      sec._reveal = reveal;

      const io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) reveal(); });
      }, { root: letter, threshold: 0.12 });
      io.observe(sec);

      letter.addEventListener("scroll", () => {
        if (shown) return;
        const r = sec.getBoundingClientRect();
        if (r.top < innerHeight * 0.85 && r.bottom > 60) reveal();
      }, { passive: true });
    };

    if (alreadySent) mount();
  }

  loadLeaflet(init);
})();
