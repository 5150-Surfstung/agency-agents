/* THE EQUIPPED AGENT — STARTER ORB
 * ---------------------------------------------------------------------------
 * The same mark that runs on the invite, packaged so an agent's own build can
 * mount it in one line. Hosted here rather than generated, on purpose: an orb
 * a model writes from a description is a coin toss, and this one is not going
 * to be a coin toss in front of a room.
 *
 *   <canvas id="orb"></canvas>
 *   <script src="https://the-equipped-agent.vercel.app/orb.js"></script>
 *   <script>EquippedOrb.mount(document.getElementById("orb"));</script>
 *
 * Everything is optional and everything can be changed later:
 *   EquippedOrb.mount(el, {
 *     background: "#0A1A2F",
 *     ring: "CHARLESTON · SC",
 *     words: ["your line", "another line"],
 *     objects: ["house", "key", "sold"],     // or your own segment lists
 *   })
 * --------------------------------------------------------------------------- */
(function (root) {
  "use strict";

  /* ---------- small vector helpers ---------- */
  function len3(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); }
  function norm(a) { var L = len3(a) || 1; return [a[0] / L, a[1] / L, a[2] / L]; }
  function cross(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  function dist3(a, b) { var x=a[0]-b[0], y=a[1]-b[1], z=a[2]-b[2]; return Math.sqrt(x*x+y*y+z*z); }

  /* ---------- sampling: points spread by ARC LENGTH, not by vertex ---------- */
  function polyLength(p) { var L = 0; for (var i = 1; i < p.length; i++) L += dist3(p[i-1], p[i]); return L; }

  function samplePoly(p, k) {
    var segL = [], L = 0, i;
    for (i = 1; i < p.length; i++) { var d = dist3(p[i-1], p[i]); segL.push(d); L += d; }
    var out = [];
    if (L <= 1e-9 || segL.length === 0) { for (i = 0; i < k; i++) out.push(p[0].slice()); return out; }
    for (var j = 0; j < k; j++) {
      var target = (k === 1) ? 0 : (j / (k - 1)) * L, acc = 0, idx = 0;
      while (idx < segL.length - 1 && acc + segL[idx] < target) { acc += segL[idx]; idx++; }
      var f = segL[idx] > 1e-9 ? (target - acc) / segL[idx] : 0;
      if (f > 1) f = 1; if (f < 0) f = 0;
      var a = p[idx], b = p[idx + 1];
      out.push([a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f]);
    }
    return out;
  }

  /** Turn a list of polylines into N points, remembering which line each came
   *  from. That memory is what lets the renderer join only points that belong
   *  to the same stroke. */
  function buildObject(segs, n) {
    var lens = segs.map(polyLength);
    var total = lens.reduce(function (a, b) { return a + b; }, 0) || 1;
    var counts = lens.map(function (L) { return Math.max(2, Math.round(n * L / total)); });
    var sum = counts.reduce(function (a, b) { return a + b; }, 0), guard = 0, i;
    while (sum > n && guard++ < 200000) {
      var idx = -1, best = 2;
      for (i = 0; i < counts.length; i++) if (counts[i] > best) { best = counts[i]; idx = i; }
      if (idx < 0) break;
      counts[idx]--; sum--;
    }
    guard = 0;
    while (sum < n && guard++ < 200000) {
      var id2 = 0, bestD = -1;
      for (i = 0; i < counts.length; i++) { var d = lens[i] / counts[i]; if (d > bestD) { bestD = d; id2 = i; } }
      counts[id2]++; sum++;
    }
    var pos = [], seg = [];
    for (var s = 0; s < segs.length; s++) {
      var pts = samplePoly(segs[s], counts[s]);
      for (var q = 0; q < pts.length; q++) { pos.push(pts[q]); seg.push(s); }
    }
    while (pos.length > n) { pos.pop(); seg.pop(); }
    while (pos.length < n) { pos.push(pos[pos.length-1].slice()); seg.push(seg[seg.length-1]); }

    var mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
    for (i = 0; i < n; i++) for (var k = 0; k < 3; k++) {
      if (pos[i][k] < mn[k]) mn[k] = pos[i][k];
      if (pos[i][k] > mx[k]) mx[k] = pos[i][k];
    }
    var c = [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2];
    var hx = (mx[0]-mn[0])/2, hy = (mx[1]-mn[1])/2, hz = (mx[2]-mn[2])/2;
    var fit = Math.max(hx/1.30, hy/1.02, hz/1.12, 1e-6), sc = 1 / fit;
    var flat = new Float32Array(n * 3);
    for (i = 0; i < n; i++) {
      flat[i*3]   = (pos[i][0]-c[0]) * sc;
      flat[i*3+1] = (pos[i][1]-c[1]) * sc;
      flat[i*3+2] = (pos[i][2]-c[2]) * sc;
    }
    /* THE RULE: join i to i+1 only when they share a stroke. Skip this and the
       object renders as a ball of spaghetti with the shape lost inside it. */
    var links = [];
    for (i = 0; i < n - 1; i++) if (seg[i] === seg[i+1]) links.push([i, i+1]);
    return { pos: flat, links: links };
  }

  /* ---------- the core the objects come out of and return to ---------- */
  function fibSphere(n) {
    var pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2;
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      var phi = i * Math.PI * (3 - Math.sqrt(5));
      pos[i*3] = Math.cos(phi) * r; pos[i*3+1] = y; pos[i*3+2] = Math.sin(phi) * r;
    }
    return pos;
  }

  function sphereLinks(pos, n) {
    var seen = {}, out = [];
    for (var i = 0; i < n; i++) {
      var b1 = -1, b2 = -1, d1 = 1e18, d2 = 1e18;
      var ax = pos[i*3], ay = pos[i*3+1], az = pos[i*3+2];
      for (var j = 0; j < n; j++) {
        if (j === i) continue;
        var dx = pos[j*3]-ax, dy = pos[j*3+1]-ay, dz = pos[j*3+2]-az;
        var d = dx*dx + dy*dy + dz*dz;
        if (d < d1) { d2 = d1; b2 = b1; d1 = d; b1 = j; }
        else if (d < d2) { d2 = d; b2 = j; }
      }
      var cand = [b1, b2];
      for (var q = 0; q < 2; q++) {
        var jj = cand[q]; if (jj < 0) continue;
        var a = Math.min(i, jj), b = Math.max(i, jj), key = a + "_" + b;
        if (!seen[key]) { seen[key] = 1; out.push([a, b]); }
      }
    }
    return out;
  }

  /* ===================== THE STARTER PACK =====================
     A house, a key, a SOLD sign. What an agent sells, what they hand over,
     and what goes in the yard when it worked. ============================ */

  function houseSegs() {
    var z0 = -0.42, z1 = 0.42, s = [];
    // Front and back profile: walls, eaves, ridge. One closed stroke each.
    function profile(z) {
      return [
        [-0.95, -0.85, z], [-0.95, 0.18, z], [0, 0.95, z],
        [0.95, 0.18, z], [0.95, -0.85, z], [-0.95, -0.85, z],
      ];
    }
    s.push(profile(z0));
    s.push(profile(z1));
    // The four long edges that make it a building rather than two drawings.
    s.push([[-0.95,-0.85,z0],[-0.95,-0.85,z1]]);
    s.push([[0.95,-0.85,z0],[0.95,-0.85,z1]]);
    s.push([[-0.95,0.18,z0],[-0.95,0.18,z1]]);
    s.push([[0.95,0.18,z0],[0.95,0.18,z1]]);
    s.push([[0,0.95,z0],[0,0.95,z1]]);
    // A door and two windows, so it reads as a home at thumbnail size.
    s.push([[-0.22,-0.85,z0],[-0.22,-0.18,z0],[0.22,-0.18,z0],[0.22,-0.85,z0]]);
    s.push([[-0.72,-0.55,z0],[-0.72,-0.12,z0],[-0.38,-0.12,z0],[-0.38,-0.55,z0],[-0.72,-0.55,z0]]);
    s.push([[0.38,-0.55,z0],[0.38,-0.12,z0],[0.72,-0.12,z0],[0.72,-0.55,z0],[0.38,-0.55,z0]]);
    return s;
  }

  function keySegs() {
    var s = [], i, a;
    // The bow: a ring you could actually put a finger through.
    var bow = [];
    for (i = 0; i <= 40; i++) { a = i / 40 * Math.PI * 2; bow.push([Math.cos(a)*0.40 - 0.78, Math.sin(a)*0.40, 0]); }
    s.push(bow);
    var inner = [];
    for (i = 0; i <= 28; i++) { a = i / 28 * Math.PI * 2; inner.push([Math.cos(a)*0.18 - 0.78, Math.sin(a)*0.18, 0]); }
    s.push(inner);
    // The shaft.
    s.push([[-0.38, 0, 0], [0.92, 0, 0]]);
    // Three teeth, different depths, on the business end.
    s.push([[0.42, 0, 0], [0.42, -0.30, 0]]);
    s.push([[0.62, 0, 0], [0.62, -0.20, 0]]);
    s.push([[0.82, 0, 0], [0.82, -0.32, 0]]);
    // A little thickness so it is not a flat sticker when it turns.
    s.push([[-0.38, 0, -0.10], [0.92, 0, -0.10]]);
    s.push([[0.92, 0, 0], [0.92, 0, -0.10]]);
    return s;
  }

  function soldSegs() {
    var s = [];
    // Post and the stake it stands in.
    s.push([[0, -1.0, 0], [0, 0.55, 0]]);
    s.push([[-0.26, -1.0, 0], [0.26, -1.0, 0]]);
    // The panel, hung off the post.
    s.push([[-0.86, 0.02, 0], [-0.86, 0.86, 0], [0.86, 0.86, 0], [0.86, 0.02, 0], [-0.86, 0.02, 0]]);
    // The rider above it — where SOLD actually goes on a real sign.
    s.push([[-0.56, 0.92, 0], [-0.56, 1.24, 0], [0.56, 1.24, 0], [0.56, 0.92, 0], [-0.56, 0.92, 0]]);
    // The diagonal slash a sold rider always has.
    s.push([[-0.70, 0.14, 0], [0.70, 0.74, 0]]);
    // Depth, so it turns like an object.
    s.push([[-0.86, 0.02, -0.14], [-0.86, 0.86, -0.14], [0.86, 0.86, -0.14], [0.86, 0.02, -0.14], [-0.86, 0.02, -0.14]]);
    s.push([[-0.86, 0.86, 0], [-0.86, 0.86, -0.14]]);
    s.push([[0.86, 0.86, 0], [0.86, 0.86, -0.14]]);
    return s;
  }

  var SHAPES = { house: houseSegs, key: keySegs, sold: soldSegs };

  /* ===================== THE RENDERER ===================== */

  var DEFAULTS = {
    background: "#0A1A2F",
    warm: [255, 232, 200],
    cool: [159, 198, 255],
    points: 300,
    objects: ["house", "key", "sold"],
    ring: "THE EQUIPPED AGENT · CHARLESTON SC · ",
    readouts: ["A HOUSE ANSWERS ITS OWN PHONE", "THE KEYS ARE THE POINT", "THAT IS WHAT IT IS FOR"],
    words: ["built in an hour", "on your own account", "answers at 11pm", "your voice, not a template"],
    holdObject: 4.0,
    holdCore: 1.1,
    morph: 1.5,
  };

  var LAGMAX = 0.35;
  function ease(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
  function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }

  function mount(canvas, opts) {
    if (!canvas || !canvas.getContext) throw new Error("EquippedOrb.mount needs a canvas element");
    var cfg = {};
    for (var k in DEFAULTS) cfg[k] = DEFAULTS[k];
    for (var k2 in (opts || {})) cfg[k2] = opts[k2];

    var N = cfg.points;
    var ctx = canvas.getContext("2d");

    var SPH = fibSphere(N);
    var SPH_LINKS = sphereLinks(SPH, N);
    var OBJ = cfg.objects.map(function (o) {
      var segs = typeof o === "string" ? (SHAPES[o] || SHAPES.house)() : o;
      return buildObject(segs, N);
    });
    var READ = cfg.readouts;

    var LAG = new Float32Array(N), ORDER = new Int32Array(N), i0;
    for (i0 = 0; i0 < N; i0++) { LAG[i0] = Math.random() * LAGMAX; ORDER[i0] = i0; }
    for (i0 = N - 1; i0 > 0; i0--) { var j0 = (Math.random()*(i0+1))|0, t0 = ORDER[i0]; ORDER[i0] = ORDER[j0]; ORDER[j0] = t0; }
    var VIS = new Uint8Array(N), visibleCount = N;
    function applyVis() { for (var k = 0; k < N; k++) VIS[ORDER[k]] = (k < visibleCount) ? 1 : 0; }
    applyVis();

    var W = 0, H = 0, DPR = 1;
    function fit() {
      DPR = Math.min(window.devicePixelRatio || 1, 2.5);
      W = canvas.clientWidth || canvas.width || 320;
      H = canvas.clientHeight || canvas.height || 320;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = cfg.background;
      ctx.fillRect(0, 0, W, H);
    }
    window.addEventListener("resize", fit);

    var LWARM = norm([0.58, 0.60, -0.55]), LCOOL = norm([-0.64, -0.28, -0.72]);
    var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    var RING = cfg.ring + cfg.ring;

    var drifters = cfg.words.map(function (w) {
      return { t: w, u: Math.random(), sp: 0.050 + Math.random()*0.045, a0: Math.random()*Math.PI*2, ain: (Math.random()-0.5)*0.9 };
    });

    var PX = new Float32Array(N), PY = new Float32Array(N);
    var SR = new Float32Array(N), SG = new Float32Array(N), SB = new Float32Array(N);
    var SA = new Float32Array(N), SS = new Float32Array(N);

    var phase = "holdS", pt = 0, objIdx = 0, lastLabel = 0;
    var yaw = 0.6, time = 0, ema = 16, last = 0, raf = 0;
    var bgRGB = (function (hex) {
      var h = hex.replace("#", "");
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    })(cfg.background);
    var TRAIL = "rgba(" + bgRGB[0] + "," + bgRGB[1] + "," + bgRGB[2] + ",0.18)";

    function step(dt) {
      time += dt; yaw += dt * 0.28; pt += dt;
      if (phase === "holdS" && pt >= cfg.holdCore) { phase = "morphIn"; pt = 0; }
      else if (phase === "morphIn" && pt >= cfg.morph) { phase = "holdO"; pt = 0; }
      else if (phase === "holdO" && pt >= cfg.holdObject) { phase = "morphOut"; pt = 0; }
      else if (phase === "morphOut" && pt >= cfg.morph) { phase = "holdS"; pt = 0; objIdx = (objIdx + 1) % OBJ.length; }
    }

    function draw() {
      var pitch = 0.34 + 0.15 * Math.sin(time * 0.31);
      var obj = OBJ[objIdx], from, to, m, sphA, objA;
      if (phase === "holdS") { from = SPH; to = SPH; m = 0; sphA = 1; objA = 0; }
      else if (phase === "morphIn") { m = pt / cfg.morph; from = SPH; to = obj.pos; sphA = 1 - m; objA = m; }
      else if (phase === "holdO") { from = obj.pos; to = obj.pos; m = 1; sphA = 0; objA = 1; }
      else { m = pt / cfg.morph; from = obj.pos; to = SPH; sphA = m; objA = 1 - m; }
      if (phase === "morphIn" && m > 0.45) lastLabel = objIdx;

      var cx = W/2, cy = H*0.47, R = Math.min(W, H) * 0.28, fov = 3.2;
      var cyaw = Math.cos(yaw), syaw = Math.sin(yaw), cpit = Math.cos(pitch), spit = Math.sin(pitch);

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = TRAIL;
      ctx.fillRect(0, 0, W, H);

      var i;
      for (i = 0; i < N; i++) {
        if (!VIS[i]) { SA[i] = 0; continue; }
        var lt = ease(clamp01((m - LAG[i]) / (1 - LAGMAX)));
        var ax = from[i*3], ay = from[i*3+1], az = from[i*3+2];
        var bx = to[i*3], by = to[i*3+1], bz = to[i*3+2];
        var px = ax + (bx-ax)*lt, py = ay + (by-ay)*lt, pz = az + (bz-az)*lt;
        var rr = 1 - 0.62 * Math.sin(Math.PI * lt);   // pulled through the core
        px *= rr; py *= rr; pz *= rr;

        var nl = Math.sqrt(px*px + py*py + pz*pz) || 1;
        var nx = px/nl, ny = py/nl, nz = pz/nl;

        var x1 = px*cyaw - pz*syaw, z1 = px*syaw + pz*cyaw, y1 = py;
        var y2 = y1*cpit - z1*spit, z2 = y1*spit + z1*cpit;
        var mx1 = nx*cyaw - nz*syaw, mz1 = nx*syaw + nz*cyaw, my1 = ny;
        var my2 = my1*cpit - mz1*spit, mz2 = my1*spit + mz1*cpit;

        var sc = fov / (fov + z2);
        PX[i] = cx + x1*sc*R; PY[i] = cy - y2*sc*R; SS[i] = sc;

        var wdot = mx1*LWARM[0] + my2*LWARM[1] + mz2*LWARM[2]; if (wdot < 0) wdot = 0;
        var cdot = mx1*LCOOL[0] + my2*LCOOL[1] + mz2*LCOOL[2]; if (cdot < 0) cdot = 0;
        var rim = Math.pow(1 - Math.abs(mz2), 2.2);
        var base = 0.26 + 0.62*rim;
        var dim = 0.32 + 0.68 * ((1.55 - z2) / 3.10);
        if (dim < 0.16) dim = 0.16; if (dim > 1) dim = 1;

        var r = (255*base + cfg.warm[0]*0.42*wdot + cfg.cool[0]*0.36*cdot) * dim;
        var g = (255*base + cfg.warm[1]*0.42*wdot + cfg.cool[1]*0.36*cdot) * dim;
        var b = (255*base + cfg.warm[2]*0.42*wdot + cfg.cool[2]*0.36*cdot) * dim;
        SR[i] = r>255?255:r; SG[i] = g>255?255:g; SB[i] = b>255?255:b;
        SA[i] = (0.38 + 0.56*rim) * dim;
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 0.9;
      var L, a, b2, al;
      if (sphA > 0.004) {
        for (L = 0; L < SPH_LINKS.length; L++) {
          a = SPH_LINKS[L][0]; b2 = SPH_LINKS[L][1];
          if (!VIS[a] || !VIS[b2]) continue;
          al = Math.min(SA[a], SA[b2]) * sphA * 0.52;
          if (al < 0.006) continue;
          ctx.strokeStyle = "rgba("+(SR[a]|0)+","+(SG[a]|0)+","+(SB[a]|0)+","+al.toFixed(3)+")";
          ctx.beginPath(); ctx.moveTo(PX[a], PY[a]); ctx.lineTo(PX[b2], PY[b2]); ctx.stroke();
        }
      }
      if (objA > 0.004) {
        var OL = obj.links;
        for (L = 0; L < OL.length; L++) {
          a = OL[L][0]; b2 = OL[L][1];
          if (!VIS[a] || !VIS[b2]) continue;
          al = Math.min(SA[a], SA[b2]) * objA;
          if (al < 0.006) continue;
          ctx.strokeStyle = "rgba("+(SR[a]|0)+","+(SG[a]|0)+","+(SB[a]|0)+","+al.toFixed(3)+")";
          ctx.beginPath(); ctx.moveTo(PX[a], PY[a]); ctx.lineTo(PX[b2], PY[b2]); ctx.stroke();
        }
      }
      for (i = 0; i < N; i++) {
        if (!VIS[i] || SA[i] <= 0.006) continue;
        ctx.fillStyle = "rgba("+(SR[i]|0)+","+(SG[i]|0)+","+(SB[i]|0)+","+Math.min(0.95, SA[i]).toFixed(3)+")";
        ctx.beginPath(); ctx.arc(PX[i], PY[i], (0.95 + 1.30*SA[i]) * SS[i], 0, 6.2832); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      /* the swagger, all dimmer than the mark */
      var ringR = Math.min(W, H) * 0.425;
      var spacing = (2*Math.PI*ringR) / RING.length;
      var fsz = Math.max(7, Math.min(12, spacing * 0.80));
      ctx.save(); ctx.translate(cx, cy);
      ctx.font = fsz + "px " + MONO; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(214,230,255,0.30)";
      var stepA = (Math.PI*2) / RING.length;
      for (i = 0; i < RING.length; i++) {
        ctx.save(); ctx.rotate(time*0.055 + i*stepA); ctx.translate(0, -ringR);
        ctx.fillText(RING.charAt(i), 0, 0); ctx.restore();
      }
      ctx.restore();

      var lab = READ[lastLabel % READ.length] || "";
      var labAlpha = phase === "morphIn" ? 0.46 * Math.abs(2*m - 1) : 0.46;
      ctx.font = "11px " + MONO; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(214,230,255," + labAlpha.toFixed(3) + ")";
      var sp = [];
      for (i = 0; i < lab.length; i++) sp.push(lab.charAt(i));
      ctx.fillText(sp.join(" "), cx, Math.min(H - 22, cy + ringR + 30));

      ctx.font = "10px " + MONO;
      var Rin = ringR * 1.16, Rout = Math.max(W, H) * 0.80;
      for (i = 0; i < drifters.length; i++) {
        var d = drifters[i], u = d.u, rr2, aa, e;
        if (u < 0.5) { e = ease(u*2); rr2 = Rout + (Rin-Rout)*e; aa = 0.05 + 0.15*e; }
        else { e = ease((u-0.5)*2); rr2 = Rin + (Rout-Rin)*e; aa = (0.20 + 0.26*e) * (1 - e*0.35); }
        var ang = d.a0 + d.ain*u;
        ctx.fillStyle = "rgba(232,240,255," + aa.toFixed(3) + ")";
        ctx.fillText(d.t, cx + Math.cos(ang)*rr2, cy + Math.sin(ang)*rr2*0.55);
      }

      ctx.strokeStyle = "rgba(214,230,255,0.22)"; ctx.lineWidth = 1;
      var pad = 24, arm = 28;
      ctx.beginPath();
      ctx.moveTo(pad, pad+arm); ctx.lineTo(pad, pad); ctx.lineTo(pad+arm, pad);
      ctx.moveTo(W-pad-arm, pad); ctx.lineTo(W-pad, pad); ctx.lineTo(W-pad, pad+arm);
      ctx.moveTo(W-pad, H-pad-arm); ctx.lineTo(W-pad, H-pad); ctx.lineTo(W-pad-arm, H-pad);
      ctx.moveTo(pad+arm, H-pad); ctx.lineTo(pad, H-pad); ctx.lineTo(pad, H-pad-arm);
      ctx.stroke();
    }

    fit();
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      phase = "holdO"; pt = 0; objIdx = 0; lastLabel = 0; time = 2.2; yaw = 0.85;
      ctx.fillStyle = cfg.background; ctx.fillRect(0, 0, W, H);
      draw();
      return { stop: function () {} };
    }

    function loop(ts) {
      raf = requestAnimationFrame(loop);
      if (document.hidden) { last = ts; return; }
      if (!last) { last = ts; return; }
      var dt = (ts - last) / 1000; last = ts;
      if (dt > 0.1) dt = 0.1;
      ema = ema*0.90 + (dt*1000)*0.10;
      if (ema > 22 && visibleCount > 150) { visibleCount -= 6; applyVis(); }
      else if (ema < 15 && visibleCount < N) { visibleCount += 3; if (visibleCount > N) visibleCount = N; applyVis(); }
      for (var k = 0; k < drifters.length; k++) {
        drifters[k].u += dt * drifters[k].sp;
        if (drifters[k].u >= 1) {
          drifters[k].u = 0; drifters[k].a0 = Math.random()*Math.PI*2;
          drifters[k].ain = (Math.random()-0.5)*0.9; drifters[k].sp = 0.050 + Math.random()*0.045;
        }
      }
      step(dt); draw();
    }
    raf = requestAnimationFrame(loop);
    return { stop: function () { cancelAnimationFrame(raf); } };
  }

  root.EquippedOrb = { mount: mount, SHAPES: SHAPES, DEFAULTS: DEFAULTS };
})(window);
