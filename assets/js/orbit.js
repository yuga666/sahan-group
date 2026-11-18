/* Sahan Group — homepage orbit scene
   One core (the group) with five sector nodes on tilted orbits.
   Plain WebGL 1, no libraries. Scroll drives position, scale and turn;
   text panels change with scroll progress through the story section. */
(function () {
  'use strict';

  var story = document.querySelector('[data-orbit]');
  if (!story) return;

  var canvas = story.querySelector('.orbit-canvas');
  var panels = Array.prototype.slice.call(story.querySelectorAll('[data-panel]'));
  var tags = Array.prototype.slice.call(story.querySelectorAll('[data-node]'));
  var sectorItems = Array.prototype.slice.call(story.querySelectorAll('[data-sector]'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Fixed parameters
  ------------------------------------------------------------------ */
  var CONFIG = {
    coreRadius: 1.2,
    corePoints: 2600,
    innerRadius: 0.72,
    innerPoints: 700,
    tilt: 0.37,
    initRotation: 2.07,
    spin: 0.05,
    scrollTurn: Math.PI * 1.6,
    starCount: 900,
    bg: '#121713',
    bg2: '#2a352d',
    gold: '#c6b08a',
    goldLight: '#e7d9bf',
    sage: '#93a89b',
    flameA: '#c6b08a',
    flameB: '#6f7a6e',
    flameAmt: 0.12,
    entryDur: 1.9,
    entryStartY: -3.2
  };

  /* one orbit per sector; accents match the sector doors */
  var SECTORS = [
    { color: '#e0cba6', r: 1.62, ax: 0.18,  az: 0.10,  speed: 0.16, phase: 0.2 },  /* Real estate */
    { color: '#d08a55', r: 1.86, ax: -0.42, az: 0.32,  speed: 0.12, phase: 1.5 },  /* Hospitality */
    { color: '#84bccd', r: 2.10, ax: 0.56,  az: -0.24, speed: 0.10, phase: 2.9 },  /* F&B */
    { color: '#c9b06f', r: 2.34, ax: -0.12, az: -0.46, speed: 0.08, phase: 4.1 },  /* Financial services */
    { color: '#93a89b', r: 2.58, ax: 0.34,  az: 0.58,  speed: 0.065, phase: 5.3 }  /* Logistics */
  ];

  /* scroll keyframes (p = progress through the story section) */
  var STOPS_X = [{ p: 0, v: 0 }, { p: 0.34, v: -2.3 }, { p: 0.68, v: 2.3 }, { p: 1, v: 2.3 }];
  var STOPS_Y = [{ p: 0, v: -3.15 }, { p: 0.34, v: 0.05 }, { p: 0.68, v: 0.0 }, { p: 1, v: 0.0 }];
  var STOPS_S = [{ p: 0, v: 2.05 }, { p: 0.34, v: 0.86 }, { p: 0.68, v: 0.92 }, { p: 1, v: 0.92 }];
  /* panel windows */
  var PANEL_AT = [0, 0.24, 0.58];

  /* ------------------------------------------------------------------
     Helpers
  ------------------------------------------------------------------ */
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function sample(stops, p) {
    if (p <= stops[0].p) return stops[0].v;
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stops[i], b = stops[i + 1];
      if (p <= b.p) {
        var t = (p - a.p) / (b.p - a.p);
        t = t * t * (3 - 2 * t);
        return a.v + (b.v - a.v) * t;
      }
    }
    return stops[stops.length - 1].v;
  }

  /* column-major 4x4 matrices */
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function translate(x, y, z) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); }
  function scale(s) { return new Float32Array([s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1]); }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
  function rotZ(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
  function apply(m, x, y, z) {
    return [
      m[0] * x + m[4] * y + m[8] * z + m[12],
      m[1] * x + m[5] * y + m[9] * z + m[13],
      m[2] * x + m[6] * y + m[10] * z + m[14],
      m[3] * x + m[7] * y + m[11] * z + m[15]
    ];
  }

  /* point on a sector orbit, in system space */
  var ringMats = SECTORS.map(function (s) { return mul(rotZ(s.az), rotX(s.ax)); });
  function orbitPoint(i, angle) {
    var r = SECTORS[i].r;
    return apply(ringMats[i], Math.cos(angle) * r, 0, Math.sin(angle) * r).slice(0, 3);
  }

  /* ------------------------------------------------------------------
     Panels — work even without WebGL
  ------------------------------------------------------------------ */
  var activePanel = -1;
  var activeSector = -1;

  function setPanels(p) {
    var idx = 0;
    for (var i = 0; i < PANEL_AT.length; i++) if (p >= PANEL_AT[i]) idx = i;
    if (idx !== activePanel) {
      activePanel = idx;
      panels.forEach(function (el, i) {
        el.classList.toggle('is-active', i === idx);
        el.classList.toggle('is-past', i < idx);
        el.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
      story.setAttribute('data-stage', String(idx));
    }
    /* walk through the five sectors in the last panel */
    var sector = -1;
    if (idx === PANEL_AT.length - 1) {
      var local = clamp((p - PANEL_AT[idx]) / (0.94 - PANEL_AT[idx]), 0, 0.999);
      sector = Math.floor(local * SECTORS.length);
    }
    if (sector !== activeSector) {
      activeSector = sector;
      sectorItems.forEach(function (el, i) { el.classList.toggle('is-current', i === sector); });
      tags.forEach(function (el, i) { el.classList.toggle('is-current', i === sector); });
    }
  }

  function storyProgress() {
    var r = story.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }

  /* ------------------------------------------------------------------
     WebGL
  ------------------------------------------------------------------ */
  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { gl = null; }

  if (!gl) {
    story.classList.add('orbit--nogl');
    var onScrollOnly = function () { setPanels(storyProgress()); };
    window.addEventListener('scroll', onScrollOnly, { passive: true });
    onScrollOnly();
    return;
  }

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }
  function program(vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var info = { p: p, a: {}, u: {} };
    var na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < na; i++) { var a = gl.getActiveAttrib(p, i).name; info.a[a] = gl.getAttribLocation(p, a); }
    var nu = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var j = 0; j < nu; j++) { var u = gl.getActiveUniform(p, j).name; info.u[u] = gl.getUniformLocation(p, u); }
    return info;
  }
  function buffer(data, usage) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage || gl.STATIC_DRAW);
    return b;
  }
  function attribs(prog, buf, layout) {
    /* layout: [[name, size], ...] interleaved floats */
    var stride = layout.reduce(function (s, l) { return s + l[1]; }, 0) * 4;
    var off = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    layout.forEach(function (l) {
      var loc = prog.a[l[0]];
      if (loc !== undefined && loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, l[1], gl.FLOAT, false, stride, off);
      }
      off += l[1] * 4;
    });
  }
  function disableAll() {
    var max = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    for (var i = 0; i < max; i++) gl.disableVertexAttribArray(i);
  }

  /* ---- background: brand-green field, corner flame, halo behind the core ---- */
  var bgProg = program(
    'attribute vec2 position; void main(){ gl_Position = vec4(position, 0.0, 1.0); }',
    [
      'precision highp float;',
      'uniform vec2 uRes; uniform float uTime; uniform vec2 uCore; uniform float uCoreR; uniform float uFade;',
      'uniform vec3 uBg; uniform vec3 uBg2; uniform vec3 uFlameA; uniform vec3 uFlameB; uniform float uFlameAmt; uniform vec3 uGlow;',
      'vec3 warp3d(vec3 pos, float t){ float curv=.8,a=1.9,b=0.7; pos*=2.;',
      '  pos.x+=curv*sin(t+a*pos.y)+t*b; pos.y+=curv*cos(t+a*pos.x);',
      '  pos.y+=curv*sin(t+a*pos.z)+t*b; pos.z+=curv*cos(t+a*pos.y);',
      '  pos.z+=curv*sin(t+a*pos.x)+t*b; pos.x+=curv*cos(t+a*pos.z);',
      '  return 0.5+0.5*cos(pos.xyz+vec3(1,2,4)); }',
      'void main(){',
      '  vec2 vUv = gl_FragCoord.xy / uRes;',
      '  vec2 uv = 2.*vUv - 1.;',
      '  vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), uTime*1.5), vec3(1.5));',
      '  vec3 flame = 1.5*uFlameA*w.x; flame*=w.y; flame += uFlameB*w.z;',
      '  flame *= smoothstep(0.25, 1., abs(uv.y));',
      '  float md = smoothstep(-0.7, 1., -uv.y*uv.x); flame *= md*md;',
      '  vec3 bg = mix(uBg2, uBg, clamp(length(uv*vec2(0.9,1.1)), 0.0, 1.0));',
      '  float d = length(gl_FragCoord.xy - uCore) / max(uCoreR, 1.0);',
      '  float halo = pow(clamp(1.0 - (d - 0.92) / 1.6, 0.0, 1.0), 2.4) * step(0.92, d);',
      '  float body = smoothstep(1.05, 0.0, d) * 0.42 + smoothstep(1.02, 0.94, d) * 0.12;',
      '  vec3 col = bg + flame*uFlameAmt + uGlow * (halo * 0.42 + body) * uFade;',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n')
  );
  var bgBuf = buffer(new Float32Array([-1, -1, 3, -1, -1, 3]));

  /* ---- point clouds: core shell, inner lattice, stars ---- */
  var ptsProg = program(
    [
      'attribute vec3 position; attribute float seed; attribute float size;',
      'uniform mat4 uProj; uniform mat4 uModelView; uniform float uTime; uniform float uPx; uniform float uScale;',
      'uniform float uCenterZ; uniform float uRadius; uniform float uMode;',
      'varying float vA; varying float vLit; varying float vSeed; varying float vBand;',
      'void main(){',
      '  vec3 p = position;',
      '  float breathe = 1.0 + 0.012 * sin(uTime * 1.3 + seed * 6.2831 + p.y * 3.0);',
      '  if (uMode < 1.5) p *= breathe;',
      '  vec4 mv = uModelView * vec4(p, 1.0);',
      '  vec3 vn = normalize(mat3(uModelView) * normalize(position + 1e-5));',
      '  float front = clamp((mv.z - uCenterZ) / max(uRadius, 1e-3) * 0.5 + 0.5, 0.0, 1.0);',
      '  float rim = 1.0 - abs(vn.z);',
      '  vec3 sun = normalize(vec3(-0.9, 0.35, 0.45));',
      '  vLit = smoothstep(-0.25, 0.45, dot(vn, sun));',
      '  vSeed = seed; vBand = position.y;',
      '  if (uMode > 1.5) {',
      '    vA = (0.35 + 0.65 * fract(seed * 7.13)) * (0.6 + 0.4 * sin(uTime * 0.9 + seed * 40.0));',
      '    gl_PointSize = max(size * uPx, 1.0);',
      '  } else {',
      '    vA = mix(0.18, 1.0, front) * (0.85 + 0.9 * pow(rim, 1.6));',
      '    gl_PointSize = max(size * uPx * sqrt(uScale) * (8.0 / max(-mv.z, 0.5)), 1.0);',
      '  }',
      '  gl_Position = uProj * mv;',
      '}'
    ].join('\n'),
    [
      'precision highp float;',
      'uniform vec3 uColorA; uniform vec3 uColorB; uniform float uAlpha; uniform float uMode; uniform float uTime;',
      'varying float vA; varying float vLit; varying float vSeed; varying float vBand;',
      'void main(){',
      '  vec2 q = gl_PointCoord - 0.5; float l = length(q); if (l > 0.5) discard;',
      '  float core = smoothstep(0.5, 0.0, l);',
      '  vec3 col = mix(uColorB, uColorA, vLit);',
      '  float a = vA;',
      '  if (uMode < 0.5) {',
      '    a *= mix(0.32, 1.0, vLit);',
      /* sparks on the shaded side, like lights on the night half of a globe */
      '    float spark = step(0.9, fract(vSeed * 13.7)) * (1.0 - vLit) * (0.6 + 0.4 * sin(uTime * 2.0 + vSeed * 50.0));',
      '    col += vec3(1.0, 0.82, 0.55) * spark * 1.4; a += spark * 0.9;',
      '  }',
      '  gl_FragColor = vec4(col * core * a * uAlpha, 1.0);',
      '}'
    ].join('\n')
  );

  function fibSphere(n, r, sizeMin, sizeMax) {
    var out = new Float32Array(n * 5);
    var ga = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2;
      var rad = Math.sqrt(1 - y * y);
      var th = ga * i;
      var jitter = 1 + (Math.random() - 0.5) * 0.02;
      out[i * 5] = Math.cos(th) * rad * r * jitter;
      out[i * 5 + 1] = y * r * jitter;
      out[i * 5 + 2] = Math.sin(th) * rad * r * jitter;
      out[i * 5 + 3] = Math.random();
      out[i * 5 + 4] = sizeMin + Math.random() * (sizeMax - sizeMin);
    }
    return out;
  }
  var coreData = fibSphere(CONFIG.corePoints, CONFIG.coreRadius, 1.8, 3.0);
  var coreBuf = buffer(coreData);
  var innerBuf = buffer(fibSphere(CONFIG.innerPoints, CONFIG.innerRadius, 1.0, 1.8));

  var starData = new Float32Array(CONFIG.starCount * 5);
  for (var si = 0; si < CONFIG.starCount; si++) {
    var u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, sr = Math.sqrt(1 - u * u);
    starData[si * 5] = Math.cos(th) * sr * 40;
    starData[si * 5 + 1] = u * 40;
    starData[si * 5 + 2] = Math.sin(th) * sr * 40;
    starData[si * 5 + 3] = Math.random();
    starData[si * 5 + 4] = 0.8 + Math.random() * 1.4;
  }
  var starBuf = buffer(starData);

  /* ---- lines: orbit rings + flowing spokes ---- */
  var lineProg = program(
    [
      'attribute vec3 position; attribute float t;',
      'uniform mat4 uProj; uniform mat4 uModelView; uniform float uCenterZ; uniform float uRadius;',
      'varying float vFront; varying float vT;',
      'void main(){',
      '  vec4 mv = uModelView * vec4(position, 1.0);',
      '  vFront = clamp((mv.z - uCenterZ) / max(uRadius, 1e-3) * 0.5 + 0.5, 0.0, 1.0);',
      '  vT = t;',
      '  gl_Position = uProj * mv;',
      '}'
    ].join('\n'),
    [
      'precision highp float;',
      'uniform vec3 uColor; uniform float uAlpha; uniform float uDash; uniform float uTime;',
      'varying float vFront; varying float vT;',
      'void main(){',
      '  float a = uAlpha * mix(0.25, 1.0, vFront);',
      '  if (uDash > 0.5) { a *= step(0.5, fract(vT * 9.0 + uTime * 0.8)) * smoothstep(0.0, 0.25, vT); }',
      '  gl_FragColor = vec4(uColor * a, 1.0);',
      '}'
    ].join('\n')
  );

  var RING_SEG = 200;
  var ringData = new Float32Array(SECTORS.length * (RING_SEG + 1) * 4);
  SECTORS.forEach(function (s, i) {
    for (var k = 0; k <= RING_SEG; k++) {
      var p = orbitPoint(i, (k / RING_SEG) * Math.PI * 2);
      var o = (i * (RING_SEG + 1) + k) * 4;
      ringData[o] = p[0]; ringData[o + 1] = p[1]; ringData[o + 2] = p[2]; ringData[o + 3] = k / RING_SEG;
    }
  });
  var ringBuf = buffer(ringData);
  var spokeData = new Float32Array(SECTORS.length * 2 * 4);
  var spokeBuf = buffer(spokeData, gl.DYNAMIC_DRAW);

  /* ---- sector nodes: glowing points with a radar ping ---- */
  var nodeProg = program(
    [
      'attribute vec3 position; attribute vec3 color; attribute float hl; attribute float seed;',
      'uniform mat4 uProj; uniform mat4 uModelView; uniform float uPx; uniform float uCenterZ; uniform float uRadius; uniform float uScale;',
      'varying vec3 vColor; varying float vHl; varying float vSeed; varying float vFront;',
      'void main(){',
      '  vec4 mv = uModelView * vec4(position, 1.0);',
      '  vFront = clamp((mv.z - uCenterZ) / max(uRadius, 1e-3) * 0.5 + 0.5, 0.0, 1.0);',
      '  vColor = color; vHl = hl; vSeed = seed;',
      '  gl_PointSize = (34.0 + 26.0 * hl) * uPx * sqrt(uScale) * (8.0 / max(-mv.z, 0.5));',
      '  gl_Position = uProj * mv;',
      '}'
    ].join('\n'),
    [
      'precision highp float;',
      'uniform float uTime;',
      'varying vec3 vColor; varying float vHl; varying float vSeed; varying float vFront;',
      'void main(){',
      '  vec2 p = gl_PointCoord - 0.5; float d = length(p) * 2.0; if (d > 1.0) discard;',
      '  float core = smoothstep(0.22, 0.0, d) * 1.4 + smoothstep(0.6, 0.0, d) * 0.25;',
      '  float ph = fract(uTime * 0.45 + vSeed);',
      '  float ring = smoothstep(0.06, 0.0, abs(d - ph)) * (1.0 - ph) * (0.5 + vHl);',
      '  float a = clamp(core + ring, 0.0, 1.6) * mix(0.35, 1.0, vFront) * (0.75 + 0.5 * vHl);',
      '  gl_FragColor = vec4(vColor * a, 1.0);',
      '}'
    ].join('\n')
  );
  var nodeData = new Float32Array(SECTORS.length * 8);
  var nodeBuf = buffer(nodeData, gl.DYNAMIC_DRAW);
  var nodeHl = SECTORS.map(function () { return 0; });
  var nodeColors = SECTORS.map(function (s) { return hexToRgb(s.color); });

  /* ------------------------------------------------------------------
     State
  ------------------------------------------------------------------ */
  var W = 1, H = 1, dpr = 1;
  var proj = perspective(40 * Math.PI / 180, 1, 0.1, 200);
  var view = translate(0, 0, -8);
  var curP = 0, curX = STOPS_X[0].v, curY = STOPS_Y[0].v, curS = STOPS_S[0].v;
  var time = 0, spinPhase = 0;
  var entryT = reduceMotion ? CONFIG.entryDur : 0;
  var fade = reduceMotion ? 1 : 0;
  var running = false, visible = true, last = 0, first = true;

  var C = {
    bg: hexToRgb(CONFIG.bg), bg2: hexToRgb(CONFIG.bg2), gold: hexToRgb(CONFIG.gold),
    goldLight: hexToRgb(CONFIG.goldLight), sage: hexToRgb(CONFIG.sage),
    flameA: hexToRgb(CONFIG.flameA), flameB: hexToRgb(CONFIG.flameB)
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    proj = perspective(40 * Math.PI / 180, W / H, 0.1, 200);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function targets(p) {
    var narrow = W / H < 0.85;
    var sideScale = clamp(W / 1200, 0.5, 1);
    var x = sample(STOPS_X, p) * sideScale;
    var y = sample(STOPS_Y, p);
    var s = sample(STOPS_S, p);
    if (narrow) {
      /* phones: keep the core centred and lift it above the text panel */
      var lift = clamp((p - 0.12) / 0.22, 0, 1);
      x = 0;
      y = y + lift * 1.05;
      s = s * (1 - lift * 0.22);
    }
    return [x, y, s];
  }

  function frame(now) {
    if (!running) return;
    var dt = first ? 0.016 : Math.min((now - last) / 1000, 0.05);
    first = false;
    last = now;

    var pTarget = storyProgress();
    setPanels(pTarget);

    if (!reduceMotion) {
      time += dt;
      spinPhase += dt * CONFIG.spin;
      entryT = Math.min(entryT + dt, CONFIG.entryDur);
      fade = Math.min(fade + dt / 1.2, 1);
    }
    var kp = reduceMotion ? 1 : Math.min(1, dt * 4.5);
    curP += (pTarget - curP) * kp;
    var tg = targets(curP);
    var k = reduceMotion ? 1 : Math.min(1, dt * 3.2);
    curX += (tg[0] - curX) * k;
    curY += (tg[1] - curY) * k;
    curS += (tg[2] - curS) * k;
    var e = clamp(entryT / CONFIG.entryDur, 0, 1);
    var entryY = CONFIG.entryStartY * Math.pow(1 - e, 3);

    render(curX, curY + entryY, curS, curP);
    if (reduceMotion) { running = false; return; }
    window.requestAnimationFrame(frame);
  }

  function render(x, y, s, p) {
    var rotYAngle = CONFIG.initRotation + spinPhase + p * CONFIG.scrollTurn;
    var system = mul(translate(x, y, 0), mul(scale(s), rotZ(CONFIG.tilt)));
    var model = mul(system, rotY(rotYAngle));
    var mvCore = mul(view, model);
    /* orbit frame turns slower than the core so the two read as layers */
    var mvOrbit = mul(view, mul(system, rotY(rotYAngle * 0.35 + 0.6)));
    var mvInner = mul(view, mul(system, rotY(-rotYAngle * 0.8)));
    var centerZ = -8;
    var radius = CONFIG.coreRadius * s;
    var orbitRadius = 2.6 * s;

    /* sector highlight follows the panel walk-through */
    for (var i = 0; i < SECTORS.length; i++) {
      var want = activeSector === i ? 1 : activeSector >= 0 ? 0 : 0.25;
      nodeHl[i] += (want - nodeHl[i]) * (reduceMotion ? 1 : 0.08);
    }

    gl.clearColor(C.bg[0], C.bg[1], C.bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);

    /* core position on screen for the halo */
    var c4 = apply(mul(proj, view), x, y, 0);
    var cx = (c4[0] / c4[3] * 0.5 + 0.5) * canvas.width;
    var cy = (c4[1] / c4[3] * 0.5 + 0.5) * canvas.height;
    var edge = apply(mul(proj, view), x + radius, y, 0);
    var ex = (edge[0] / edge[3] * 0.5 + 0.5) * canvas.width;
    var coreR = Math.abs(ex - cx);

    /* background */
    disableAll();
    gl.disable(gl.BLEND);
    gl.useProgram(bgProg.p);
    attribs(bgProg, bgBuf, [['position', 2]]);
    gl.uniform2f(bgProg.u.uRes, canvas.width, canvas.height);
    gl.uniform1f(bgProg.u.uTime, time * 0.25);
    gl.uniform2f(bgProg.u.uCore, cx, cy);
    gl.uniform1f(bgProg.u.uCoreR, coreR);
    gl.uniform1f(bgProg.u.uFade, fade);
    gl.uniform3fv(bgProg.u.uBg, C.bg);
    gl.uniform3fv(bgProg.u.uBg2, C.bg2);
    gl.uniform3fv(bgProg.u.uFlameA, C.flameA);
    gl.uniform3fv(bgProg.u.uFlameB, C.flameB);
    gl.uniform1f(bgProg.u.uFlameAmt, CONFIG.flameAmt);
    gl.uniform3f(bgProg.u.uGlow, 0.36, 0.33, 0.24);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    /* stars (fixed to camera space, slow drift) */
    disableAll();
    gl.useProgram(ptsProg.p);
    attribs(ptsProg, starBuf, [['position', 3], ['seed', 1], ['size', 1]]);
    gl.uniformMatrix4fv(ptsProg.u.uProj, false, proj);
    gl.uniformMatrix4fv(ptsProg.u.uModelView, false, mul(view, rotY(time * 0.01 + p * 0.4)));
    gl.uniform1f(ptsProg.u.uTime, time);
    gl.uniform1f(ptsProg.u.uPx, dpr);
    gl.uniform1f(ptsProg.u.uScale, 1);
    gl.uniform1f(ptsProg.u.uCenterZ, centerZ);
    gl.uniform1f(ptsProg.u.uRadius, 1);
    gl.uniform1f(ptsProg.u.uMode, 2);
    gl.uniform3fv(ptsProg.u.uColorA, C.goldLight);
    gl.uniform3fv(ptsProg.u.uColorB, C.goldLight);
    gl.uniform1f(ptsProg.u.uAlpha, 0.55 * fade);
    gl.drawArrays(gl.POINTS, 0, CONFIG.starCount);

    /* orbit rings */
    disableAll();
    gl.useProgram(lineProg.p);
    attribs(lineProg, ringBuf, [['position', 3], ['t', 1]]);
    gl.uniformMatrix4fv(lineProg.u.uProj, false, proj);
    gl.uniformMatrix4fv(lineProg.u.uModelView, false, mvOrbit);
    gl.uniform1f(lineProg.u.uCenterZ, centerZ);
    gl.uniform1f(lineProg.u.uRadius, orbitRadius);
    gl.uniform1f(lineProg.u.uTime, time);
    gl.uniform1f(lineProg.u.uDash, 0);
    for (var r = 0; r < SECTORS.length; r++) {
      gl.uniform3fv(lineProg.u.uColor, nodeColors[r]);
      gl.uniform1f(lineProg.u.uAlpha, (0.16 + nodeHl[r] * 0.42) * fade);
      gl.drawArrays(gl.LINE_STRIP, r * (RING_SEG + 1), RING_SEG + 1);
    }

    /* nodes + spokes */
    for (var n = 0; n < SECTORS.length; n++) {
      var sct = SECTORS[n];
      var pos = orbitPoint(n, sct.phase + time * sct.speed + p * (1.2 - n * 0.12));
      var len = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
      var o = n * 8;
      nodeData[o] = pos[0]; nodeData[o + 1] = pos[1]; nodeData[o + 2] = pos[2];
      nodeData[o + 3] = nodeColors[n][0]; nodeData[o + 4] = nodeColors[n][1]; nodeData[o + 5] = nodeColors[n][2];
      nodeData[o + 6] = nodeHl[n]; nodeData[o + 7] = n * 0.21;
      var so = n * 8;
      var inner = (CONFIG.coreRadius * 1.04) / len;
      spokeData[so] = pos[0] * inner; spokeData[so + 1] = pos[1] * inner; spokeData[so + 2] = pos[2] * inner; spokeData[so + 3] = 0;
      spokeData[so + 4] = pos[0]; spokeData[so + 5] = pos[1]; spokeData[so + 6] = pos[2]; spokeData[so + 7] = 1;

      /* HTML tag position */
      if (tags[n]) {
        var clip = apply(mul(proj, mvOrbit), pos[0], pos[1], pos[2]);
        var sx = (clip[0] / clip[3] * 0.5 + 0.5) * W;
        var sy = (1 - (clip[1] / clip[3] * 0.5 + 0.5)) * H;
        tags[n].style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0)';
        tags[n].style.setProperty('--front', (clamp(((-clip[3]) - centerZ) / orbitRadius * 0.5 + 0.5, 0, 1)).toFixed(3));
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, spokeBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, spokeData);
    gl.uniform1f(lineProg.u.uDash, 1);
    for (var q = 0; q < SECTORS.length; q++) {
      attribs(lineProg, spokeBuf, [['position', 3], ['t', 1]]);
      gl.uniform3fv(lineProg.u.uColor, nodeColors[q]);
      gl.uniform1f(lineProg.u.uAlpha, (0.22 + nodeHl[q] * 0.6) * fade);
      gl.drawArrays(gl.LINES, q * 2, 2);
    }

    /* inner lattice */
    disableAll();
    gl.useProgram(ptsProg.p);
    attribs(ptsProg, innerBuf, [['position', 3], ['seed', 1], ['size', 1]]);
    gl.uniformMatrix4fv(ptsProg.u.uModelView, false, mvInner);
    gl.uniform1f(ptsProg.u.uScale, s);
    gl.uniform1f(ptsProg.u.uRadius, CONFIG.innerRadius * s);
    gl.uniform1f(ptsProg.u.uMode, 1);
    gl.uniform3fv(ptsProg.u.uColorA, C.sage);
    gl.uniform3fv(ptsProg.u.uColorB, C.sage);
    gl.uniform1f(ptsProg.u.uAlpha, 0.35 * fade);
    gl.drawArrays(gl.POINTS, 0, CONFIG.innerPoints);

    /* core shell */
    attribs(ptsProg, coreBuf, [['position', 3], ['seed', 1], ['size', 1]]);
    gl.uniformMatrix4fv(ptsProg.u.uModelView, false, mvCore);
    gl.uniform1f(ptsProg.u.uRadius, radius);
    gl.uniform1f(ptsProg.u.uMode, 0);
    gl.uniform3fv(ptsProg.u.uColorA, C.goldLight);
    gl.uniform3fv(ptsProg.u.uColorB, C.gold);
    gl.uniform1f(ptsProg.u.uAlpha, 0.9 * fade);
    gl.drawArrays(gl.POINTS, 0, CONFIG.corePoints);

    /* nodes */
    disableAll();
    gl.useProgram(nodeProg.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeData);
    attribs(nodeProg, nodeBuf, [['position', 3], ['color', 3], ['hl', 1], ['seed', 1]]);
    gl.uniformMatrix4fv(nodeProg.u.uProj, false, proj);
    gl.uniformMatrix4fv(nodeProg.u.uModelView, false, mvOrbit);
    gl.uniform1f(nodeProg.u.uPx, dpr);
    gl.uniform1f(nodeProg.u.uScale, s);
    gl.uniform1f(nodeProg.u.uCenterZ, centerZ);
    gl.uniform1f(nodeProg.u.uRadius, orbitRadius);
    gl.uniform1f(nodeProg.u.uTime, time);
    gl.drawArrays(gl.POINTS, 0, SECTORS.length);
  }

  function start() {
    if (running || !visible || document.hidden) return;
    running = true;
    first = true;
    window.requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  resize();
  window.addEventListener('resize', function () { resize(); start(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }).observe(story);
  }

  /* reduced motion: draw only when the scroll position changes */
  if (reduceMotion) {
    window.addEventListener('scroll', start, { passive: true });
  }

  story.classList.add('orbit--ready');
  start();
})();
