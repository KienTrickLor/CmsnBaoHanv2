/* ============================================================
   SỬA Ở ĐÂY: tên, lời chúc, ngày yêu nhau, ảnh, nhạc
   ============================================================ */
const CONFIG = {
  name: "em yêu",             // tên / biệt danh của người ấy
  from: "Anh",                // người gửi, ví dụ "Kiên"
  closing: "Yêu em,",         // dòng ngay trước tên người gửi
  introText: "Hôm nay có một điều anh muốn cho em xem.",
  startDate: "",              // ngày yêu nhau dạng "2025-02-14"; để trống thì bỏ câu đếm ngày
  messages: [
    "Hôm nay là ngày của em. Anh chỉ muốn dừng lại một chút để nói điều anh hay quên nói: cảm ơn em vì đã ở đây.",
    "Em làm cho những ngày bình thường nhất của anh trở nên đáng nhớ. Cười cùng em, bực cùng em, hay chỉ im lặng bên cạnh em, anh đều thấy dễ chịu.",
    "Chúc em tuổi mới bình yên, khoẻ mạnh, và làm được hết những điều em vẫn đang giữ trong lòng.",
    "Từ ngày {start} đến hôm nay là {days} ngày. Anh muốn còn thật nhiều ngày như thế nữa."
  ],
  // Ảnh để cạnh file này, ví dụ: [{ src: "anh1.jpg", caption: "Đà Lạt, 2025" }]
  photos: [],
  // Nhạc: bài "Anh vẫn ở đây" (tên file để không dấu, không khoảng trắng cho chắc ăn)
  songTitle: "Anh Vẫn Ở Đây",
  songArtist: "Quang Đăng Trần x ViAM",
  songCover: "anh_van_o_day_cover.jpg",
  music: "anh_van_o_day.mp3",
  musicStart: 0               // bắt đầu bài mp3 từ giây thứ mấy
};
/* ============================================================ */

(() => {
  const $ = (s) => document.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = $("#intro"), night = $("#night"), letter = $("#letter");
  const btn = $("#candle"), flame = $("#flame"), smoke = $("#smoke"), smoke2 = $("#smoke2"), tip = $("#tip");
  const openBtn = $("#openBtn"), musicBtn = $("#music"), musicLabel = $("#musicLabel");
  const hint = $("#hint"), replayBtn = $("#replay"), blowMeter = $("#blowMeter"), blowFill = $("#blowFill");
  const musicShowcase = $("#musicShowcase"), playerCard = $("#playerCard"), vinylDisc = $("#vinylDisc");
  const playerFill = $("#playerFill"), playerCur = $("#playerCur"), playerDur = $("#playerDur");

  if (CONFIG.songTitle) $("#playerTitle").textContent = CONFIG.songTitle;
  if (CONFIG.songArtist) $("#playerArtist").textContent = CONFIG.songArtist;
  if (CONFIG.songCover) $("#playerCover").src = CONFIG.songCover;

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

  let run = 0, skipping = false;
  const pending = new Set();
  function sleep(ms) {
    if (skipping) return Promise.resolve();
    return new Promise((res) => {
      const fin = () => { clearTimeout(tm); pending.delete(fin); res(); };
      const tm = setTimeout(fin, ms);
      pending.add(fin);
    });
  }
  function skip() { skipping = true; [...pending].forEach((f) => f()); }

  let userScrolled = false;
  function follow(node) {
    if (userScrolled) return;
    const r = node.getBoundingClientRect();
    const limit = innerHeight - 150;
    if (r.bottom > limit) letter.scrollBy({ top: r.bottom - limit + 40, behavior: "smooth" });
  }
  function scrollToEl(el) {
    if (userScrolled) return;
    const r = el.getBoundingClientRect();
    letter.scrollBy({ top: r.top + r.height / 2 - innerHeight / 2, behavior: "smooth" });
  }

  async function type(el, ms, id, doFollow) {
    let k = 0;
    for (const c of el._chars) {
      if (id !== run) return false;
      c.classList.add("on");
      if (skipping) continue;
      if (doFollow && ++k % 14 === 0) follow(c);
      const ch = c.textContent;
      await sleep(ms * (/[.!?…]/.test(ch) ? 9 : /[,;:]/.test(ch) ? 5 : 1));
    }
    return id === run;
  }

  /* ---------- Nội dung ---------- */
  const okDate = /^\d{4}-\d{2}-\d{2}$/.test(CONFIG.startDate);
  const fmtDate = (iso) => { const [y, m, d] = iso.split("-"); return d + "/" + m + "/" + y; };
  const daysSince = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    const n = new Date();
    return Math.max(0, Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(y, m - 1, d)) / 864e5));
  };

  document.title = "Gửi " + CONFIG.name;
  $("#introTo").textContent = "Gửi " + CONFIG.name + ",";
  $("#introSay").textContent = CONFIG.introText;
  $("#hName").textContent = CONFIG.name + ".";
  $("#closing").textContent = CONFIG.closing;
  $("#from").textContent = CONFIG.from;

  const msgEls = [];
  CONFIG.messages.forEach((raw) => {
    const needsDate = raw.includes("{days}") || raw.includes("{start}");
    if (needsDate && !okDate) return;
    const text = needsDate
      ? raw.replace("{days}", daysSince(CONFIG.startDate).toLocaleString("vi-VN")).replace("{start}", fmtDate(CONFIG.startDate))
      : raw;
    const p = document.createElement("p");
    p.className = "msg"; p.textContent = text;
    $("#paras").appendChild(p);
    msgEls.push(p);
  });

  let photosEl = null;
  if (CONFIG.photos.length) {
    photosEl = document.createElement("div");
    photosEl.className = "reel fade";
    CONFIG.photos.forEach((ph) => {
      const fig = document.createElement("figure");
      const img = document.createElement("img");
      img.src = ph.src; img.alt = ph.caption || ""; img.loading = "lazy";
      fig.appendChild(img);
      if (ph.caption) {
        const cap = document.createElement("figcaption");
        cap.textContent = ph.caption; fig.appendChild(cap);
      }
      photosEl.appendChild(fig);
    });
    $("#photos").appendChild(photosEl);
  }

  /* ---------- Vườn hoa đung đưa & Đàn bướm bay lượn (SVG + JS Physics) ---------- */
  const pet = (len, wid, rot, fill, ex) =>
    '<ellipse cx="0" cy="' + (-len / 2).toFixed(1) + '" rx="' + (wid / 2).toFixed(1) + '" ry="' + (len / 2).toFixed(1) +
    '" transform="rotate(' + rot.toFixed(1) + ')" fill="' + fill + '" ' + (ex || "") + "/>";
  const EDGE = 'stroke="rgba(140,37,79,.22)" stroke-width=".65"';

  function flowerMarkup(f) {
    const r = f.r, c0 = f.c[0], c1 = f.c[1], c2 = f.c[2];
    let s = "";
    if (f.type === "peony") {
      for (let k = 0; k < 10; k++) s += pet(r, r * 0.66, k * 36, c0, EDGE);
      for (let k = 0; k < 8; k++) s += pet(r * 0.78, r * 0.56, 18 + k * 45, c1, EDGE);
      for (let k = 0; k < 6; k++) s += pet(r * 0.54, r * 0.42, k * 60, c2, EDGE);
      for (let k = 0; k < 5; k++) s += pet(r * 0.34, r * 0.28, 30 + k * 72, c0, 'opacity=".9"');
      s += '<circle r="' + (r * 0.13).toFixed(1) + '" fill="#F6B25E"/>';
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        s += '<circle cx="' + (Math.cos(a) * r * 0.18).toFixed(1) + '" cy="' + (Math.sin(a) * r * 0.18).toFixed(1) + '" r="1.3" fill="#FFF4C8"/>';
      }
    } else if (f.type === "rose") {
      for (let k = 0; k < 8; k++) s += pet(r, r * 0.64, k * 45, c0, EDGE);
      for (let k = 0; k < 6; k++) s += pet(r * 0.74, r * 0.52, 30 + k * 60, c1, EDGE);
      for (let k = 0; k < 5; k++) s += pet(r * 0.48, r * 0.38, k * 72, c2, EDGE);
      s += '<circle r="' + (r * 0.11).toFixed(1) + '" fill="#F6B25E"/>';
    } else if (f.type === "tulip") {
      s += '<ellipse cx="' + (-r * 0.28).toFixed(1) + '" cy="' + (-r * 0.45).toFixed(1) + '" rx="' + (r * 0.36).toFixed(1) + '" ry="' + (r * 0.68).toFixed(1) + '" transform="rotate(-14)" fill="' + c0 + '" ' + EDGE + "/>";
      s += '<ellipse cx="' + (r * 0.28).toFixed(1) + '" cy="' + (-r * 0.45).toFixed(1) + '" rx="' + (r * 0.36).toFixed(1) + '" ry="' + (r * 0.68).toFixed(1) + '" transform="rotate(14)" fill="' + c0 + '" ' + EDGE + "/>";
      s += '<ellipse cx="0" cy="' + (-r * 0.52).toFixed(1) + '" rx="' + (r * 0.4).toFixed(1) + '" ry="' + (r * 0.74).toFixed(1) + '" fill="' + c1 + '" ' + EDGE + "/>";
      s += '<ellipse cx="0" cy="' + (-r * 0.42).toFixed(1) + '" rx="' + (r * 0.22).toFixed(1) + '" ry="' + (r * 0.5).toFixed(1) + '" fill="' + c2 + '" opacity=".65"/>';
    } else if (f.type === "daisy") {
      for (let k = 0; k < 14; k++) s += pet(r, r * 0.24, (k * 360) / 14, c0, 'stroke="#E3A3B1" stroke-width=".7"');
      s += '<circle r="' + (r * 0.26).toFixed(1) + '" fill="' + c1 + '"/><circle r="' + (r * 0.13).toFixed(1) + '" fill="#E39B3C"/>';
    } else if (f.type === "blossom") {
      for (let k = 0; k < 5; k++) s += pet(r * 0.98, r * 0.72, k * 72, c0, EDGE);
      for (let k = 0; k < 5; k++) s += pet(r * 0.56, r * 0.38, 36 + k * 72, c1, 'opacity=".78"');
      s += '<circle r="' + (r * 0.16).toFixed(1) + '" fill="' + c2 + '"/>';
    } else if (f.type === "breath") {
      [[-10, -14], [11, -12], [0, -24], [-15, -27], [15, -26], [0, -6]].forEach(([bx, by]) => {
        s += '<line x1="0" y1="0" x2="' + bx + '" y2="' + by + '" stroke="#84A387" stroke-width="1.1"/>';
        s += '<circle cx="' + bx + '" cy="' + by + '" r="3.4" fill="#FFFDF9" stroke="#E9A9B4" stroke-width=".7"/>';
      });
    } else {
      s += '<ellipse rx="' + (r * 0.8).toFixed(1) + '" ry="' + r + '" fill="' + c0 + '"/>';
      s += '<ellipse cx="' + (-r * 0.45).toFixed(1) + '" cy="' + (r * 0.55).toFixed(1) + '" rx="' + (r * 0.3).toFixed(1) + '" ry="' + (r * 0.7).toFixed(1) + '" transform="rotate(25)" fill="#7C9A7E"/>';
    }
    return s;
  }

  function butterflyGraphic(cTop, cBot, cStroke, scale) {
    return '<g transform="scale(' + scale + ')">' +
      '<g class="bfly-wing-l">' +
        '<path d="M0 0 C-14 -16 -24 -4 -12 5 C-20 12 -10 21 0 9 Z" fill="' + cTop + '" stroke="' + cStroke + '" stroke-width=".8"/>' +
        '<circle cx="-11" cy="-3" r="2.1" fill="#FFFDF9" opacity=".8"/>' +
        '<circle cx="-8" cy="8" r="1.4" fill="' + cBot + '" opacity=".85"/>' +
      '</g>' +
      '<g class="bfly-wing-r">' +
        '<path d="M0 0 C14 -16 24 -4 12 5 C20 12 10 21 0 9 Z" fill="' + cTop + '" stroke="' + cStroke + '" stroke-width=".8"/>' +
        '<circle cx="11" cy="-3" r="2.1" fill="#FFFDF9" opacity=".8"/>' +
        '<circle cx="8" cy="8" r="1.4" fill="' + cBot + '" opacity=".85"/>' +
      '</g>' +
      '<path d="M0 -4 C-3 -10 -7 -12 -9 -10 M0 -4 C3 -10 7 -12 9 -10" fill="none" stroke="#4A2535" stroke-width=".85" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="3" rx="1.4" ry="7.5" fill="#4A2535"/>' +
    '</g>';
  }

  const GARDEN = [
    { x0: 36,  hx: 44,  hy: 146, type: "breath",  r: 16, c: ["#FFFDF9"] },
    { x0: 66,  hx: 74,  hy: 112, type: "rose",    r: 30, c: ["#E9A9B4", "#F4C6D0", "#C8567F"] },
    { x0: 108, hx: 102, hy: 76,  type: "tulip",   r: 29, c: ["#D96B90", "#F2A7BE", "#8E2A52"] },
    { x0: 144, hx: 138, hy: 102, type: "daisy",   r: 25, c: ["#FFFDF9", "#F6B25E"] },
    { x0: 190, hx: 190, hy: 54,  type: "peony",   r: 40, c: ["#C8567F", "#E9A9B4", "#8E2A52"] },
    { x0: 238, hx: 244, hy: 92,  type: "blossom", r: 29, c: ["#F4C6D0", "#E9A9B4", "#F6B25E"] },
    { x0: 278, hx: 274, hy: 78,  type: "tulip",   r: 27, c: ["#E58CA4", "#F7C6D2", "#B5446E"] },
    { x0: 312, hx: 318, hy: 122, type: "daisy",   r: 23, c: ["#F4C6D0", "#F6B25E"] },
    { x0: 342, hx: 336, hy: 150, type: "breath",  r: 15, c: ["#FFFDF9"] },
    { x0: 162, hx: 158, hy: 158, type: "bud",     r: 9,  c: ["#E9A9B4"] },
    { x0: 222, hx: 226, hy: 148, type: "bud",     r: 8.5,c: ["#F4C6D0"] }
  ];

  const GARDEN_BASE = 242;

  function buildGarden() {
    const W = 380, H = 248, base = GARDEN_BASE;
    let out = '<svg class="garden" id="garden" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true">';
    out += '<ellipse cx="190" cy="242" rx="164" ry="5" fill="rgba(106,140,110,.18)"/>';
    GARDEN.forEach((f, i) => {
      const ex = f.hx - f.x0, ey = f.hy + f.r * 0.2 - base;
      const cx = ex / 2 + (i % 2 ? 16 : -16), cy = ey / 2;
      f._ex = ex; f._ey = ey; f._cx = cx; f._cy = cy; f._eyHead = f.hy - base;
      const stemColor = i % 2 ? "#5B7E60" : "#6E9272";
      const sdur = (3.3 + (i % 4) * 0.45).toFixed(2) + "s";
      const hdur = (2.4 + (i % 3) * 0.35).toFixed(2) + "s";
      let g = '<path class="stem" data-stem="' + i + '" pathLength="1" stroke="' + stemColor + '" stroke-width="2.8" d="M0 0 Q' + cx + " " + cy + " " + ex + " " + ey + '" style="--sd:' + (0.11 * i).toFixed(2) + 's"/>';
      [0.36, 0.64].forEach((t, k) => {
        const u = 1 - t;
        const px = 2 * u * t * cx + t * t * ex, py = 2 * u * t * cy + t * t * ey;
        const ang = (k % 2 === 0 ? -1 : 1) * (54 + ((i * 7) % 20));
        const L = 10 + f.r / 5.5;
        g += '<g data-leaf="' + i + '-' + k + '" transform="translate(' + px.toFixed(1) + " " + py.toFixed(1) + ") rotate(" + ang + ')">' +
          '<g class="leaf" style="--ld:' + (0.45 + 0.11 * i + k * 0.1).toFixed(2) + 's">' +
          '<g class="leaf-flutter" style="--lf:-' + (i * 0.4 + k * 0.5).toFixed(2) + 's">' +
          '<ellipse cx="0" cy="' + -L.toFixed(1) + '" rx="' + (L * 0.42).toFixed(1) + '" ry="' + L.toFixed(1) +
          '" fill="' + (k % 2 ? "#597B5E" : "#78987A") + '"/></g></g></g>';
      });
      g += '<g data-hpos="' + i + '" transform="translate(' + ex + " " + (f.hy - base) + ')">' +
        '<g class="head" style="--hd:' + (0.95 + 0.13 * i).toFixed(2) + 's">' +
        '<g class="head-nod" style="--hdur:' + hdur + ';--sw:-' + (i * 0.6).toFixed(1) + 's">' +
        flowerMarkup(f) + "</g></g></g>";
      out += '<g transform="translate(' + f.x0 + " " + base + ')"><g class="sway" style="--sdur:' + sdur + ';--sw:-' + (i * 0.75).toFixed(1) + 's">' + g + "</g></g>";
    });

    out += '<g class="butterfly" data-bfly="0" style="--bd:1.6s" transform="translate(82 54)">' +
      butterflyGraphic("#F4AFC0", "#D95B82", "#8C254F", 1.02) + '</g>';
    out += '<g class="butterfly" data-bfly="1" style="--bd:1.9s" transform="translate(288 52)">' +
      butterflyGraphic("#FFE29A", "#F29F4B", "#B56A28", 0.92) + '</g>';
    out += '<g class="butterfly" data-bfly="2" style="--bd:2.2s" transform="translate(185 30)">' +
      butterflyGraphic("#F8D4E6", "#C86D94", "#7A2852", 0.78) + '</g>';

    [[64, 72], [148, 38], [230, 42], [312, 82], [118, 128], [262, 126], [190, 26]].forEach(([px, py], idx) => {
      out += '<circle class="pollen" cx="' + px + '" cy="' + py + '" r="2.2" fill="#F6B25E" style="animation-delay:-' + (idx * 0.55).toFixed(1) + 's"/>';
    });
    return out + "</svg>";
  }
  $("#gardenSlot").innerHTML = buildGarden();
  const gardenEl = $("#garden");
  const stemNodes = GARDEN.map((_, i) => gardenEl.querySelector('[data-stem="' + i + '"]'));
  const hposNodes = GARDEN.map((_, i) => gardenEl.querySelector('[data-hpos="' + i + '"]'));
  const leafNodes = GARDEN.map((_, i) => [
    gardenEl.querySelector('[data-leaf="' + i + '-0"]'),
    gardenEl.querySelector('[data-leaf="' + i + '-1"]')
  ]);
  const bflyNodes = [0, 1, 2].map((i) => gardenEl.querySelector('[data-bfly="' + i + '"]'));

  const BFLY_PATHS = [
    { cx: 135, cy: 62, rx: 92, ry: 32, fx: 0.52, fy: 0.94, ph: 0.2, perchX: 190, perchY: 36 },
    { cx: 248, cy: 68, rx: 86, ry: 30, fx: 0.46, fy: 0.88, ph: 2.4, perchX: 102, perchY: 58 },
    { cx: 190, cy: 48, rx: 118, ry: 26, fx: 0.38, fy: 0.76, ph: 4.3, perchX: 244, perchY: 72 }
  ];

  let armed = false, bloomed = false, gardenRaf = 0, gardenStart = 0;

  function tickGarden(now) {
    if (!bloomed || reduce) { gardenRaf = 0; return; }
    const elapsed = (now - gardenStart) / 1000;

    for (let i = 0; i < GARDEN.length; i++) {
      const f = GARDEN[i];
      const wave = Math.sin(elapsed * 1.55 - f.x0 * 0.018) * 6.2 + Math.sin(elapsed * 2.85 - i * 0.7) * 2.4;
      const bendX = f._ex + wave;
      const ctrlX = f._cx + wave * 0.58;
      const liftY = Math.abs(wave) * 0.18;
      const stem = stemNodes[i];
      if (stem) {
        stem.setAttribute("d", "M0 0 Q" + ctrlX.toFixed(1) + " " + f._cy.toFixed(1) + " " + bendX.toFixed(1) + " " + (f._ey + liftY).toFixed(1));
      }
      const hpos = hposNodes[i];
      if (hpos) {
        hpos.setAttribute("transform", "translate(" + bendX.toFixed(1) + " " + (f._eyHead + liftY).toFixed(1) + ")");
      }
      const lvs = leafNodes[i];
      if (lvs) {
        [0.36, 0.64].forEach((t, k) => {
          const ln = lvs[k];
          if (!ln) return;
          const u = 1 - t;
          const px = 2 * u * t * ctrlX + t * t * bendX;
          const py = 2 * u * t * f._cy + t * t * (f._ey + liftY);
          const ang = (k % 2 === 0 ? -1 : 1) * (54 + ((i * 7) % 20)) + wave * 0.85;
          ln.setAttribute("transform", "translate(" + px.toFixed(1) + " " + py.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")");
        });
      }
    }

    for (let b = 0; b < bflyNodes.length; b++) {
      const node = bflyNodes[b];
      if (!node) continue;
      const cfg = BFLY_PATHS[b];
      const tb = elapsed + cfg.ph;
      const cycle = tb % 11;
      const hoverBlend = cycle > 8 ? Math.sin(((cycle - 8) / 3) * Math.PI) * 0.78 : 0;

      const orbitX = cfg.cx + Math.sin(tb * cfg.fx) * cfg.rx + Math.cos(tb * cfg.fx * 1.9) * 18;
      const orbitY = cfg.cy + Math.sin(tb * cfg.fy) * cfg.ry + Math.cos(tb * 2.6) * 7;
      const vx = Math.cos(tb * cfg.fx) * cfg.fx * cfg.rx;
      const vy = Math.cos(tb * cfg.fy) * cfg.fy * cfg.ry;

      const flutterBob = Math.sin(tb * 14 + b * 2) * (2.6 - hoverBlend * 1.4);
      const x = orbitX * (1 - hoverBlend) + cfg.perchX * hoverBlend;
      const y = orbitY * (1 - hoverBlend) + cfg.perchY * hoverBlend + flutterBob;

      const bankAngle = (Math.atan2(vy, Math.abs(vx) + 25) * (180 / Math.PI) * 0.55 + (vx >= 0 ? 12 : -12)) * (1 - hoverBlend * 0.65);
      node.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + bankAngle.toFixed(1) + ")");
    }

    gardenRaf = requestAnimationFrame(tickGarden);
  }

  function bloom() {
    if (bloomed) return;
    bloomed = true;
    gardenEl.classList.add("in");
    if (!reduce && !gardenRaf) {
      gardenStart = performance.now();
      gardenRaf = requestAnimationFrame(tickGarden);
    }
  }
  function checkGarden() {
    if (!armed || bloomed) return;
    const r = gardenEl.getBoundingClientRect();
    if (r.top < innerHeight * 0.82 && r.bottom > 0) bloom();
  }

  /* chuẩn bị mọi đoạn chữ sẽ hiện dần */
  const introTo = prepare($("#introTo")), introSay = prepare($("#introSay"));
  prepare(hint);
  const h1s = [prepare($("#h1a")), prepare($("#h1b")), prepare($("#hName"))];
  msgEls.forEach(prepare);
  const closingEl = prepare($("#closing")), fromEl = prepare($("#from"));

  /* ---------- Cánh hoa & đom đóm lấp lánh (canvas) ---------- */
  function makeField(cv, o) {
    const ctx = cv.getContext("2d");
    let ps = [], raf = 0, on = false, last = 0, w = 0, h = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = () => o.colors[(Math.random() * o.colors.length) | 0];
    function size() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      cv.width = w * d; cv.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function ambient(initial) {
      const isSpark = Math.random() < (o.sparkRatio || 0.25);
      return {
        x: rnd(0, w), y: initial ? rnd(0, h) : rnd(-60, -10),
        s: rnd(o.min, o.max), vy: isSpark ? rnd(0.2, 0.55) : rnd(0.45, 1.08),
        ph: rnd(0, 6.28), sw: rnd(0.4, 1.25), rot: rnd(0, 6.28), vr: rnd(-0.03, 0.03),
        fl: rnd(0, 6.28), vf: rnd(0.02, 0.05),
        c: isSpark ? "#FFE8A3" : pick(),
        dot: isSpark,
        a: o.alpha * rnd(0.55, 1)
      };
    }
    function tick(now) {
      const k = Math.min(2.5, (now - last) / 16.67 || 1); last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; let a = p.a;
        if (p.burst) {
          p.vy += 0.17 * k; p.vx *= Math.pow(0.985, k); p.vy *= Math.pow(0.99, k);
          p.x += p.vx * k; p.y += p.vy * k; p.life += k;
          if (p.life >= p.max) { ps.splice(i, 1); continue; }
          a *= Math.min(1, (p.max - p.life) / 40);
        } else {
          if (!on) { ps.splice(i, 1); continue; }
          p.ph += 0.02 * k; p.x += Math.sin(p.ph) * p.sw * 0.6 * k; p.y += p.vy * k;
          if (p.dot) a *= 0.6 + 0.4 * Math.sin(p.ph * 2.2);
          if (p.y > h + 24) { p.y = rnd(-60, -10); p.x = rnd(0, w); }
        }
        p.rot += p.vr * k; p.fl += p.vf * k;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.globalAlpha = a; ctx.fillStyle = p.c;
        if (p.dot) {
          ctx.beginPath(); ctx.arc(0, 0, p.s * 0.26, 0, 6.283); ctx.fill();
        } else if (p.heart) {
          ctx.rotate(p.rot * 0.4);
          const s = p.s * 0.55;
          ctx.beginPath();
          ctx.moveTo(0, s * 0.6);
          ctx.bezierCurveTo(-s * 1.2, -s * 0.2, -s * 0.6, -s * 1.1, 0, -s * 0.4);
          ctx.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.2, -s * 0.2, 0, s * 0.6);
          ctx.fill();
        } else {
          ctx.rotate(p.rot); ctx.scale(Math.cos(p.fl) || 0.05, 1);
          const s = p.s;
          ctx.beginPath(); ctx.moveTo(0, -s);
          ctx.bezierCurveTo(s * 0.85, -s * 0.55, s * 0.75, s * 0.6, 0, s);
          ctx.bezierCurveTo(-s * 0.75, s * 0.6, -s * 0.85, -s * 0.55, 0, -s);
          ctx.fill();
        }
        ctx.restore();
      }
      if (ps.length) raf = requestAnimationFrame(tick);
      else { raf = 0; ctx.clearRect(0, 0, w, h); }
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    size();
    return {
      size,
      start() {
        if (reduce || !o.count) return;
        on = true;
        if (!ps.some((p) => !p.burst)) for (let i = 0; i < o.count; i++) ps.push(ambient(true));
        kick();
      },
      stop() { on = false; },
      burst(x, y) {
        if (reduce) return;
        for (let i = 0; i < 68; i++) {
          const a = -Math.PI * rnd(0.06, 0.94), sp = rnd(5.5, 13.5);
          ps.push({
            burst: true, heart: i % 5 === 0, x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            s: rnd(6.5, 11.5), rot: rnd(0, 6.28), vr: rnd(-0.12, 0.12),
            fl: rnd(0, 6.28), vf: rnd(0.04, 0.1),
            c: o.colors[i % o.colors.length], a: 0.96, life: 0, max: rnd(115, 175)
          });
        }
        for (let i = 0; i < 22; i++) {
          const a = -Math.PI * rnd(0.04, 0.96), sp = rnd(4, 11.5);
          ps.push({
            burst: true, dot: true, x, y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            s: rnd(5, 9.5), rot: 0, vr: 0, fl: 0, vf: 0,
            c: "#FFE699", a: 1, life: 0, max: rnd(85, 135)
          });
        }
        kick();
      }
    };
  }
  const introField = makeField($("#petalsIntro"), { count: 20, min: 6, max: 11, alpha: 0.62, sparkRatio: 0.35, colors: ["#F4C6D0", "#E9A9B4", "#D77A99"] });
  const letterField = makeField($("#petalsLetter"), { count: 18, min: 6, max: 11, alpha: 0.82, sparkRatio: 0.2, colors: ["#E9A9B4", "#F4C6D0", "#D98FA6"] });
  const burstField = makeField($("#fx"), { count: 0, min: 6, max: 11, alpha: 1, colors: ["#E9A9B4", "#F4C6D0", "#D77A99", "#F6B25E", "#C8567F"] });

  /* ---------- Âm nhạc & Tự động bật ngay khi mở hoặc chạm bất kỳ đâu ---------- */
  let bgm = null, useSynth = !CONFIG.music, musicWanted = false, userMuted = false, fadeT = 0;
  let actx = null, masterGain = null, seqTimer = 0, noteIdx = 0;
  let synthElapsed = 0, synthTimer = 0;
  const SYNTH_TOTAL = 28;

  const MELODY = [
    [392.00, 130.81, 0.75], [392.00, 0, 0.25], [440.00, 174.61, 1.0], [392.00, 261.63, 1.0], [523.25, 220.00, 1.0], [493.88, 196.00, 2.0],
    [392.00, 130.81, 0.75], [392.00, 0, 0.25], [440.00, 196.00, 1.0], [392.00, 246.94, 1.0], [587.33, 196.00, 1.0], [523.25, 130.81, 2.0],
    [392.00, 130.81, 0.75], [392.00, 0, 0.25], [783.99, 164.81, 1.0], [659.25, 261.63, 1.0], [523.25, 174.61, 1.0], [493.88, 220.00, 1.0], [440.00, 174.61, 1.8],
    [698.46, 174.61, 0.75], [698.46, 0, 0.25], [659.25, 130.81, 1.0], [523.25, 196.00, 1.0], [587.33, 196.00, 1.0], [523.25, 130.81, 2.4]
  ];

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updatePlayerUI(cur, dur) {
    const total = dur > 0 && isFinite(dur) ? dur : 274.1;
    const now = Math.min(total, Math.max(0, cur || 0));
    const pct = Math.min(100, Math.max(0, (now / total) * 100));
    if (playerFill) playerFill.style.width = pct.toFixed(2) + "%";
    if (playerCur) playerCur.textContent = fmtTime(now);
    if (playerDur) playerDur.textContent = fmtTime(total);
  }

  function ensureAudioCtx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      masterGain = actx.createGain();
      masterGain.gain.value = 0.55;
      masterGain.connect(actx.destination);
    }
    if (actx.state === "suspended") actx.resume().catch(() => {});
    return actx;
  }

  function chime(freq, dur, vol, delaySec) {
    if (!actx || !freq) return;
    const t0 = actx.currentTime + (delaySec || 0);
    const osc = actx.createOscillator();
    const over = actx.createOscillator();
    const g = actx.createGain();
    const gOver = actx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0);
    over.type = "triangle";
    over.frequency.setValueAtTime(freq * 2, t0);
    gOver.gain.setValueAtTime(0.14, t0);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);

    osc.connect(g);
    over.connect(gOver);
    gOver.connect(g);
    g.connect(masterGain);

    osc.start(t0);
    over.start(t0);
    osc.stop(t0 + dur + 0.04);
    over.stop(t0 + dur + 0.04);
  }

  function stepMusicBox() {
    if (!musicWanted || !useSynth) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const [mel, bass, beats] = MELODY[noteIdx];
    noteIdx = (noteIdx + 1) % MELODY.length;
    const beatMs = 460;
    chime(mel, Math.max(1.1, beats * 0.68), 0.22, 0);
    if (bass) {
      chime(bass, 1.5, 0.11, 0);
      chime(bass * 1.5, 1.2, 0.07, 0.14);
    }
    seqTimer = setTimeout(stepMusicBox, beats * beatMs);
  }

  function playSparkleChime() {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      chime(f, 1.2, 0.14, i * 0.075);
    });
  }

  if (CONFIG.music) {
    bgm = new Audio(CONFIG.music);
    bgm.loop = true; bgm.preload = "auto"; bgm.volume = 0;
    bgm.addEventListener("error", () => { bgm = null; useSynth = true; });
    bgm.addEventListener("loadedmetadata", () => {
      if (bgm) {
        if (CONFIG.musicStart > 0) { try { bgm.currentTime = CONFIG.musicStart; } catch (e) {} }
        updatePlayerUI(bgm.currentTime, bgm.duration);
      }
    });
    bgm.addEventListener("timeupdate", () => {
      if (bgm && !useSynth) updatePlayerUI(bgm.currentTime, bgm.duration);
    });
  }

  function startSynthTicker() {
    clearInterval(synthTimer);
    synthTimer = setInterval(() => {
      if (!musicWanted || !useSynth) return;
      synthElapsed = (synthElapsed + 0.25) % SYNTH_TOTAL;
      updatePlayerUI(synthElapsed, SYNTH_TOTAL);
    }, 250);
  }

  function setIcon() {
    musicBtn.classList.toggle("off", !musicWanted);
    musicBtn.setAttribute("aria-pressed", String(musicWanted));
    musicBtn.setAttribute("aria-label", musicWanted ? "Tắt nhạc" : "Bật nhạc");
    if (musicLabel) musicLabel.textContent = musicWanted ? "Đang phát" : "Bật nhạc";
    if (vinylDisc) vinylDisc.classList.toggle("paused", !musicWanted);
    if (playerCard) playerCard.classList.toggle("paused", !musicWanted);
  }

  function fade(to, ms, done) {
    clearInterval(fadeT);
    if (!bgm) { if (done) done(); return; }
    const from = bgm.volume, t0 = performance.now();
    fadeT = setInterval(() => {
      if (!bgm) { clearInterval(fadeT); return; }
      const k = Math.min(1, (performance.now() - t0) / ms);
      bgm.volume = from + (to - from) * k;
      if (k >= 1) { clearInterval(fadeT); if (done) done(); }
    }, 50);
  }

  function startSynthFallback() {
    useSynth = true;
    ensureAudioCtx();
    musicWanted = true;
    setIcon();
    clearTimeout(seqTimer);
    stepMusicBox();
    startSynthTicker();
  }

  let starting = false;
  function playMusic(fromGesture) {
    if (musicWanted || starting) return;
    if (useSynth || !bgm) {
      const ctx = ensureAudioCtx();
      if (!ctx || (ctx.state === "suspended" && !fromGesture)) return;
      useSynth = true;
      musicWanted = true;
      setIcon();
      clearTimeout(seqTimer);
      stepMusicBox();
      startSynthTicker();
      return;
    }
    starting = true;
    clearInterval(fadeT);
    try { bgm.volume = 0; } catch (e) {}
    let pr;
    try { pr = bgm.play(); } catch (e) { pr = Promise.reject(e); }
    Promise.resolve(pr).then(() => {
      starting = false;
      if (userMuted) { bgm.pause(); return; }
      musicWanted = true;
      setIcon();
      fade(0.75, 1800);
    }).catch((err) => {
      starting = false;
      // Trình duyệt chặn tự phát (NotAllowedError): KHÔNG chuyển sang nhạc synth,
      // chỉ đợi lần chạm/bấm tiếp theo rồi thử lại bài mp3.
      if (err && (err.name === "NotAllowedError" || err.name === "AbortError")) return;
      // Chỉ khi file mp3 thật sự lỗi/không đọc được mới dùng nhạc dự phòng
      if (fromGesture && (!bgm || bgm.error || (err && err.name === "NotSupportedError"))) startSynthFallback();
    });
  }

  function stopMusic() {
    musicWanted = false;
    setIcon();
    clearTimeout(seqTimer);
    clearInterval(synthTimer);
    if (bgm) fade(0, 350, () => { if (bgm) bgm.pause(); });
  }

  musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (musicWanted) {
      userMuted = true;
      stopMusic();
    } else {
      userMuted = false;
      playMusic(true);
    }
  });

  /* Bắt lần chạm/bấm đầu tiên để bật nhạc. Chú ý: chỉ pointerup/touchend/click mới được trình duyệt
     di động tính là "người dùng đã tương tác"; pointerdown/touchstart thì KHÔNG. */
  function unlockAudioOnGesture(e) {
    if (userMuted || musicWanted) return;
    if (e && e.target && e.target.closest && e.target.closest("#music")) return;
    playMusic(true);
  }
  ["pointerup", "touchend", "click", "keydown"].forEach((ev) => {
    document.addEventListener(ev, unlockAudioOnGesture, { passive: true, capture: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(seqTimer);
      if (bgm) bgm.pause();
    } else if (musicWanted) {
      if (useSynth) { clearTimeout(seqTimer); stepMusicBox(); }
      else if (bgm) bgm.play().catch(() => {});
    }
  });
  setIcon();
  // Thử bật tự động ngay khi tải trang (nếu trình duyệt cho phép)
  playMusic(false);

  /* ---------- Ngọn nến ---------- */
  let state = "dark", holding = false, p = 0, g = 0, gTarget = 1, ig = 0;
  let t = 0, last = 0, running = false, fx = innerWidth / 2, fy = innerHeight / 2;

  function measure() {
    const r = tip.getBoundingClientRect();
    fx = r.left + r.width / 2; fy = r.top + r.height / 2;
    night.style.setProperty("--fx", fx + "px");
    night.style.setProperty("--fy", fy + "px");
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now; t += dt;

    if (state === "lit") {
      ig = Math.min(1, ig + dt / 1.25);
      const e = 1 - Math.pow(1 - ig, 3);
      p = holding ? Math.min(1, p + dt / 0.85) : Math.max(0, p - dt / 0.5);
      blowMeter.classList.toggle("active", holding || p > 0.02);
      blowFill.style.width = (p * 100).toFixed(1) + "%";

      const amp = reduce ? 0 : 1;
      const f = 1 + amp * (0.06 * Math.sin(t * 9.1) + 0.04 * Math.sin(t * 14.7 + 1.3) + 0.03 * Math.sin(t * 23.3 + 0.4));
      const sway = amp * 2.2 * Math.sin(t * 3.1);
      const skew = sway - p * 28;
      const sx = (1 - 0.25 * p) * (1 - (f - 1) * 0.5) * (0.3 + 0.7 * e);
      const sy = (1 - 0.58 * p) * f * e;
      flame.setAttribute("transform",
        "translate(170 106) skewX(" + skew.toFixed(2) + ") scale(" + sx.toFixed(3) + " " + sy.toFixed(3) + ") translate(-170 -106)");
      gTarget = Math.min(1.06, (1 - 0.62 * p) * (0.95 + (f - 1) * 0.8)) * e;
      if (p >= 1) extinguish();
    }

    g += (gTarget - g) * Math.min(1, dt * (state === "out" ? 5 : 10));
    night.style.setProperty("--g", g.toFixed(3));
    requestAnimationFrame(frame);
  }

  function startLoop() {
    if (running) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }

  function lightUp() {
    hint._chars.forEach((c) => c.classList.remove("on"));
    state = "lit"; ig = 0; p = 0; g = 0; gTarget = 1; holding = false;
    blowMeter.classList.remove("active");
    blowFill.style.width = "0%";
    flame.style.display = "";
    measure(); startLoop();
    const id = ++run;
    sleep(1350).then(() => { if (id === run) type(hint, 36, id, false); });
  }

  function extinguish() {
    state = "out"; holding = false; gTarget = 0;
    btn.classList.remove("pressing");
    blowMeter.classList.remove("active");
    flame.style.display = "none";
    smoke.classList.add("go");
    if (smoke2) smoke2.classList.add("go");
    night.classList.add("out");
    if (musicWanted) playSparkleChime();
    if (navigator.vibrate) navigator.vibrate(25);
    setTimeout(reveal, reduce ? 300 : 1100);
  }

  function reveal() {
    measure();
    const r = Math.hypot(Math.max(fx, innerWidth - fx), Math.max(fy, innerHeight - fy)) * 1.05;
    letter.classList.add("reset");
    letter.style.setProperty("--cx", fx + "px");
    letter.style.setProperty("--cy", fy + "px");
    letter.style.setProperty("--r", r + "px");
    letter.scrollTop = 0;
    void letter.offsetWidth;
    letter.classList.remove("reset");
    letter.removeAttribute("inert");
    letter.removeAttribute("aria-hidden");
    night.classList.add("zoom");
    requestAnimationFrame(() => letter.classList.add("open"));
    setTimeout(() => burstField.burst(fx, fy), reduce ? 0 : 340);
    setTimeout(() => document.body.classList.add("light"), reduce ? 0 : 980);
    setTimeout(playLetter, reduce ? 200 : 1220);
  }

  letter.addEventListener("transitionend", (e) => {
    if (e.target !== letter) return;
    if (e.propertyName === "clip-path" && letter.classList.contains("open")) {
      letter.classList.add("done");
      night.style.visibility = "hidden";
      running = false;
    }
  });

  /* ---------- Bức thư ---------- */
  let playing = false;
  async function playLetter() {
    const id = ++run;
    skipping = false; userScrolled = false; armed = false; bloomed = false; playing = true;
    letterField.start();

    for (const s of h1s) { if (!(await type(s, 60, id, true))) return; await sleep(110); }
    await sleep(460);
    for (const m of msgEls) {
      if (id !== run) return;
      if (!(await type(m, 27, id, true))) return;
      await sleep(480);
    }
    if (id !== run) return;
    if (photosEl) { photosEl.classList.add("in"); await sleep(850); }
    if (id !== run) return;

    armed = true;
    if (!skipping) {
      scrollToEl(gardenEl);
      await sleep(650);
      if (id !== run) return;
      bloom();
      await sleep(2300);
    } else checkGarden();
    if (id !== run) return;

    if (!(await type(closingEl, 44, id, true))) return;
    await sleep(240);
    if (!(await type(fromEl, 76, id, true))) return;

    await sleep(320);
    if (id !== run) return;
    if (musicShowcase) {
      musicShowcase.classList.add("in");
      if (!skipping) {
        await sleep(250);
        scrollToEl(musicShowcase);
      }
    }
    if (window._revealTrackGate) window._revealTrackGate();
    await sleep(350);
    if (id !== run) return;
    replayBtn.classList.add("in");
    playing = false;
  }

  letter.addEventListener("click", (e) => {
    if (e.target.closest("#replay") || e.target.closest(".trk-gate") || e.target.closest(".trk")) return;
    if (playing) skip();
  });
  ["wheel", "touchmove"].forEach((ev) => letter.addEventListener(ev, () => { userScrolled = true; }, { passive: true }));
  letter.addEventListener("scroll", checkGarden, { passive: true });

  function clearLetter() {
    letter.querySelectorAll(".c.on").forEach((c) => c.classList.remove("on"));
    letter.querySelectorAll(".fade.in").forEach((c) => c.classList.remove("in"));
    if (musicShowcase) musicShowcase.classList.remove("in");
    gardenEl.classList.remove("in");
    bloomed = false; armed = false;
    if (gardenRaf) { cancelAnimationFrame(gardenRaf); gardenRaf = 0; }
    letterField.stop();
  }

  replayBtn.addEventListener("click", () => {
    run++; skipping = false; playing = false;
    night.style.visibility = "";
    night.classList.remove("out", "zoom");
    smoke.classList.remove("go");
    if (smoke2) smoke2.classList.remove("go");
    document.body.classList.remove("light");
    lightUp();
    letter.classList.add("closing");
    setTimeout(() => {
      letter.classList.add("reset");
      letter.classList.remove("open", "done", "closing");
      letter.setAttribute("inert", "");
      letter.setAttribute("aria-hidden", "true");
      letter.scrollTop = 0;
      clearLetter();
      requestAnimationFrame(() => requestAnimationFrame(() => letter.classList.remove("reset")));
    }, 550);
  });

  /* ---------- Giữ để thổi ---------- */
  btn.addEventListener("pointerdown", (e) => {
    if (state !== "lit") return;
    holding = true;
    btn.classList.add("pressing");
    if (btn.setPointerCapture) btn.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) =>
    btn.addEventListener(ev, () => { holding = false; btn.classList.remove("pressing"); }));
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
  btn.addEventListener("keydown", (e) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      holding = true; btn.classList.add("pressing"); e.preventDefault();
    }
  });
  btn.addEventListener("keyup", (e) => {
    if (e.key === " " || e.key === "Enter") { holding = false; btn.classList.remove("pressing"); }
  });
  btn.addEventListener("blur", () => { holding = false; btn.classList.remove("pressing"); });

  /* ---------- Mở đầu ---------- */
  let began = false;
  function begin() {
    if (began) return;
    began = true;
    if (!userMuted) playMusic(true);
    intro.classList.add("leaving");
    setTimeout(lightUp, reduce ? 100 : 760);
    setTimeout(() => { intro.style.visibility = "hidden"; introField.stop(); }, 1200);
  }
  openBtn.addEventListener("click", begin);

  async function playIntro() {
    const id = ++run;
    await Promise.race([document.fonts && document.fonts.ready, sleep(1500)]);
    await sleep(450);
    if (!(await type(introTo, 56, id, false))) return;
    await sleep(320);
    if (!(await type(introSay, 40, id, false))) return;
    await sleep(450);
    if (id === run) openBtn.classList.add("in");
  }

  window.addEventListener("resize", () => {
    introField.size(); letterField.size(); burstField.size(); measure();
  });
  measure();
  introField.start();
  playIntro();
})();