(function () {
  'use strict';

  const header = document.querySelector('.header');
  const projects = document.querySelectorAll('[data-project]');
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');

  const hero = document.querySelector('[data-hero-3d]');

  // —— Wireframe Terrain: clean from scratch ——
  // Cursor proximity makes peaks grow taller. Everything else stays still.
  (function initTerrain() {
    var container = document.getElementById('heroVisual');
    var canvas = document.getElementById('heroCanvas');
    if (!container || !canvas || typeof THREE === 'undefined') return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(pointer: coarse)').matches;

    // ---- Scene ----
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0.72, 3.0);
    camera.lookAt(0, 0.0, -0.6);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // ---- Fog: fades wireframe to black with distance ----
    scene.fog = new THREE.Fog(0x000000, 3.0, 12.0);

    // ---- Subtle night-sky stars above terrain ----
    var skyStarCount = isMobile ? 180 : 320;
    var skyStarPos = new Float32Array(skyStarCount * 3);
    var skyStarColor = new Float32Array(skyStarCount * 3);
    for (var si = 0; si < skyStarCount; si++) {
      var sx = (Math.random() * 2 - 1) * 11.5;
      var sy = 0.9 + Math.random() * 2.1;
      var sz = -1.2 - Math.random() * 8.4;
      skyStarPos[si * 3] = sx;
      skyStarPos[si * 3 + 1] = sy;
      skyStarPos[si * 3 + 2] = sz;

      // Slight warm/cool variation, very low intensity.
      var t = Math.random();
      skyStarColor[si * 3] = 0.72 + t * 0.18;
      skyStarColor[si * 3 + 1] = 0.74 + t * 0.16;
      skyStarColor[si * 3 + 2] = 0.78 + t * 0.14;
    }
    var skyStarGeo = new THREE.BufferGeometry();
    skyStarGeo.setAttribute('position', new THREE.BufferAttribute(skyStarPos, 3));
    skyStarGeo.setAttribute('color', new THREE.BufferAttribute(skyStarColor, 3));
    var skyStarMat = new THREE.PointsMaterial({
      size: isMobile ? 0.042 : 0.036,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.42,
      vertexColors: true,
      depthWrite: false,
      depthTest: true,
      fog: true,
      blending: THREE.AdditiveBlending
    });
    var skyStars = new THREE.Points(skyStarGeo, skyStarMat);
    scene.add(skyStars);

    // ---- 3D landscape heading: depth-stacked text behind peaks ----
    var landscapeHeading = null;
    var headingIntroStart = 0;
    var headingIntroDur = 900;
    var headingBaseY = 0;
    var headingDropY = 0.12;
    (function initLandscapeHeading() {
      // Use the flat DOM heading on mobile for a cleaner two-line responsive layout.
      if (isMobile) return;
      var headingText = 'REAL TIME 3D VISUALIZER | WORLDBUILDER';
      var headingFontStack = '"Space Grotesk", "SpaceGrotesk", "Sohne", "Söhne", "Soehne", "Neue Montreal", "NeueMontreal", "Arial Black", sans-serif';
      var headingCanvas = document.createElement('canvas');
      headingCanvas.width = 4096;
      headingCanvas.height = 512;
      var hctx = headingCanvas.getContext('2d');
      if (!hctx) return;

      hctx.textAlign = 'center';
      hctx.textBaseline = 'middle';
      var fontPx = 150;
      var trackingPx = fontPx * 0.13; // broader baseline spacing
      function extraGapForChar(ch, baseTracking) {
        // Narrow glyphs need a little extra right-side air to avoid visual collisions.
        if (ch === 'I' || ch === '|' || ch === '1') return baseTracking * 0.9;
        return 0;
      }
      function charOffsetForDraw(ch, baseTracking) {
        // Nudge narrow glyphs slightly left so they sit optically centered.
        if (ch === 'I' || ch === '|' || ch === '1') return -baseTracking * 0.38;
        return 0;
      }
      function measureTrackedText(ctx, text, tracking) {
        var total = 0;
        for (var ti = 0; ti < text.length; ti++) {
          total += ctx.measureText(text[ti]).width;
          if (ti < text.length - 1) {
            total += tracking + extraGapForChar(text[ti], tracking);
          }
        }
        return total;
      }
      function drawTrackedText(ctx, text, x, y, tracking) {
        var totalW = measureTrackedText(ctx, text, tracking);
        var cx = x - totalW * 0.5;
        for (var ti = 0; ti < text.length; ti++) {
          var ch = text[ti];
          ctx.fillText(ch, cx + charOffsetForDraw(ch, tracking), y);
          cx += ctx.measureText(ch).width + tracking + extraGapForChar(ch, tracking);
        }
      }
      function strokeTrackedText(ctx, text, x, y, tracking) {
        var totalW = measureTrackedText(ctx, text, tracking);
        var cx = x - totalW * 0.5;
        for (var ti = 0; ti < text.length; ti++) {
          var ch = text[ti];
          ctx.strokeText(ch, cx + charOffsetForDraw(ch, tracking), y);
          cx += ctx.measureText(ch).width + tracking + extraGapForChar(ch, tracking);
        }
      }
      function renderHeadingTexture() {
        hctx.clearRect(0, 0, headingCanvas.width, headingCanvas.height);
        fontPx = 150;
        trackingPx = fontPx * 0.13;
        hctx.font = '500 ' + fontPx + 'px ' + headingFontStack;
        var maxTextWidth = headingCanvas.width * 0.92;
        var measured = measureTrackedText(hctx, headingText, trackingPx);
        if (measured > maxTextWidth) {
          fontPx = Math.floor(fontPx * (maxTextWidth / measured));
          hctx.font = '500 ' + fontPx + 'px ' + headingFontStack;
          trackingPx = fontPx * 0.13;
        }

        // Restore the flat-heading palette as a 3D-integrated gradient.
        var grad = hctx.createLinearGradient(
          headingCanvas.width * 0.05, 0,
          headingCanvas.width * 0.95, 0
        );
        grad.addColorStop(0.0, '#b5eeff');
        grad.addColorStop(0.45, '#ffd8ae');
        grad.addColorStop(1.0, '#bde9ae');

        // Main crisp gradient face.
        hctx.shadowBlur = 0;
        hctx.fillStyle = grad;
        drawTrackedText(hctx, headingText, headingCanvas.width * 0.5, headingCanvas.height * 0.5, trackingPx);

        // Silver sheen clipped to text glyphs only.
        var sheen = hctx.createLinearGradient(0, 0, headingCanvas.width, 0);
        sheen.addColorStop(0.0, 'rgba(190, 196, 210, 0.05)');
        sheen.addColorStop(0.28, 'rgba(218, 224, 235, 0.38)');
        sheen.addColorStop(0.5, 'rgba(245, 247, 252, 0.62)');
        sheen.addColorStop(0.72, 'rgba(216, 223, 235, 0.34)');
        sheen.addColorStop(1.0, 'rgba(185, 192, 205, 0.05)');
        hctx.globalCompositeOperation = 'source-atop';
        hctx.fillStyle = sheen;
        hctx.fillRect(0, 0, headingCanvas.width, headingCanvas.height);
        hctx.globalCompositeOperation = 'source-over';

        // Subtle letter glow pass (drawn from text only).
        hctx.save();
        hctx.shadowColor = 'rgba(224, 231, 245, 0.65)';
        hctx.shadowBlur = 18;
        hctx.fillStyle = 'rgba(236, 241, 250, 0.2)';
        drawTrackedText(hctx, headingText, headingCanvas.width * 0.5, headingCanvas.height * 0.5, trackingPx);
        hctx.restore();
      }
      renderHeadingTexture();

      var headingTex = new THREE.CanvasTexture(headingCanvas);
      headingTex.minFilter = THREE.LinearFilter;
      headingTex.magFilter = THREE.LinearFilter;
      headingTex.needsUpdate = true;
      if (document.fonts && document.fonts.load) {
        document.fonts.load('500 150px "Space Grotesk"').then(function () {
          renderHeadingTexture();
          headingTex.needsUpdate = true;
        }).catch(function () {});
      }

      var headingGeo = new THREE.PlaneGeometry(5.13912, 0.960204); // 30% smaller than previous size
      landscapeHeading = new THREE.Group();

      for (var layer = 14; layer >= 0; layer--) {
        var isFront = layer === 0;
        var mat = new THREE.MeshBasicMaterial({
          map: headingTex,
          transparent: true,
          fog: false,
          depthWrite: true,
          depthTest: true,
          alphaTest: 0.24,
          color: isFront ? 0xffffff : 0x3a3a3a,
          opacity: 1
        });
        mat.userData.baseOpacity = 1;
        mat.opacity = 0;
        var layerMesh = new THREE.Mesh(headingGeo, mat);
        layerMesh.position.z = -layer * 0.006; // 80% thinner depth
        layerMesh.position.y = layer * 0.0015;
        landscapeHeading.add(layerMesh);
      }

      // Soft hover glow under the heading.
      var glowCanvas = document.createElement('canvas');
      glowCanvas.width = 512;
      glowCanvas.height = 128;
      var gctx = glowCanvas.getContext('2d');
      if (gctx) {
        var g = gctx.createRadialGradient(256, 64, 0, 256, 64, 248);
        g.addColorStop(0.0, 'rgba(185, 210, 255, 0.112)');
        g.addColorStop(0.25, 'rgba(182, 203, 236, 0.063)');
        g.addColorStop(0.5, 'rgba(168, 188, 218, 0.021)');
        g.addColorStop(0.72, 'rgba(0, 0, 0, 0)');
        g.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        gctx.fillStyle = g;
        gctx.fillRect(0, 0, 512, 128);
      }
      var glowTex = new THREE.CanvasTexture(glowCanvas);
      glowTex.minFilter = THREE.LinearFilter;
      glowTex.magFilter = THREE.LinearFilter;
      var glowMat = new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true
      });
      glowMat.userData.baseOpacity = 0;
      glowMat.opacity = 0;
      var glowSprite = new THREE.Sprite(glowMat);
      glowSprite.scale.set(6.3, 0.95, 1);
      glowSprite.position.set(0, -0.43, -0.04);
      landscapeHeading.add(glowSprite);

      // Move title to the terrain middle/front, in front of the main center peak.
      headingBaseY = 1.38;
      landscapeHeading.position.set(0, headingBaseY + headingDropY, -0.62);
      landscapeHeading.rotation.x = -0.294533; // tilt forward by 10 degrees
      scene.add(landscapeHeading);
      headingIntroStart = performance.now() + 120;

      // Hide flat DOM heading once 3D heading is ready.
      var domHeading = document.querySelector('.hero-label');
      if (domHeading) domHeading.classList.add('is-3d-heading');
      if (hero) hero.classList.add('hero-3d-heading-mode');
    })();

    // ---- Geometry: quad wireframe mesh (extended past horizon) ----
    var W = 18, D = 16;
    var cellSize = isMobile ? 0.16 : 0.087;
    var SX = Math.round(W / cellSize), SZ = Math.round(D / cellSize);
    var N = (SX + 1) * (SZ + 1);
    var geo = new THREE.PlaneGeometry(W, D, SX, SZ);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position;
    var halfW = W * 0.5, halfD = D * 0.5;

    // ---- Normalised coords per vertex ----
    var uCoords = new Float32Array(N);   // [-1, 1] lateral
    var vCoords = new Float32Array(N);   // [-1, 1] depth (+ = near camera)
    for (var i = 0; i < N; i++) {
      uCoords[i] = pos.getX(i) / halfW;
      vCoords[i] = pos.getZ(i) / halfD;
    }

    // ---- Hash / noise for organic edge ----
    function hash(a, b) {
      var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return n - Math.floor(n);
    }
    function noise2(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z);
      var fx = x - ix, fz = z - iz;
      fx *= fx * (3 - 2 * fx);
      fz *= fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz);
      var c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
    }

    // ---- Explicit peaks: [u, v, height, radius] ----
    // Landing state: slightly taller + sharper peaks
    var peaks = [
      [-0.55,  0.05,  0.614, 0.077],
      [ 0.10, -0.10,  0.418, 0.083],
      [ 0.60,  0.10,  0.500, 0.072],
      [-0.25,  0.35,  0.334, 0.066],
      [ 0.38,  0.45,  0.372, 0.061],
      [-0.70, -0.20,  0.594, 0.075],
      [ 0.75, -0.15,  0.450, 0.061],
      [ 0.00, -0.30,  0.630, 0.055],
      [-0.40, -0.25,  0.486, 0.063],
      [ 0.50,  0.00,  0.378, 0.055],
      [-0.15,  0.10,  0.297, 0.050],
      [ 0.28, -0.20,  0.342, 0.052],
    ];

    // ---- Organic edge mask: lateral fade + noise wobble ----
    // Fog handles depth fade, so this mainly softens left/right edges
    var edgeMask = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var u = uCoords[i], v = vCoords[i];
      // Lateral fade with noise wobble
      var lateralDist = Math.abs(u);
      var wobble = (noise2(u * 3.0 + 5.5, v * 3.0 + 2.2) - 0.5) * 0.12;
      var edgeVal = lateralDist + wobble;
      var lateral = 1.0 - smoothstep(0.75, 1.0, edgeVal);
      // Gentle front-edge fade (only the very nearest rows)
      var front = 1.0 - smoothstep(0.7, 1.0, v);
      edgeMask[i] = lateral * front;
    }
    function smoothstep(lo, hi, x) {
      var t = Math.max(0, Math.min(1, (x - lo) / (hi - lo)));
      return t * t * (3 - 2 * t);
    }

    // ---- Precompute base terrain ----
    // Keep interactive cursor motion unchanged; only reshape dormant terrain.
    var BASE_FLAT_SCALE = 0.8; // overall 20% flatter at rest
    var baseH = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var u = uCoords[i], v = vCoords[i];
      var h = 0;
      for (var p = 0; p < peaks.length; p++) {
        var pu = peaks[p][0], pv = peaks[p][1], ph = peaks[p][2], pr = peaks[p][3];
        var du = u - pu, dv = v - pv;
        h += ph * Math.exp(-(du * du + dv * dv) / (2 * pr * pr));
      }
      // Flatten center lane and slightly lift sides so the heading stays readable.
      var lateralAbs = Math.abs(u);
      var centerFlatten = 1.0 - 0.35 * (1.0 - smoothstep(0.06, 0.42, lateralAbs));
      var sideLift = 1.0 + 0.28 * smoothstep(0.34, 0.95, lateralAbs);
      var lateralShape = centerFlatten * sideLift;

      baseH[i] = h * edgeMask[i] * BASE_FLAT_SCALE * lateralShape;
      pos.setY(i, baseH[i]);
    }
    pos.needsUpdate = true;

    // ---- Boost buffer: persists and slowly decays ----
    var boostH = new Float32Array(N);

    // ---- Wireframe vertex colors: lateral fade to black at side edges ----
    var wireColors = new Float32Array(N * 3);
    var WIRE_BRIGHTNESS = 0.45; // light grey instead of full white
    var baseWireBright = new Float32Array(N); // store base brightness for glow compositing
    for (var ci = 0; ci < N; ci++) {
      var u = uCoords[ci];
      var lateralAbs = Math.abs(u);
      var fade = (1.0 - smoothstep(0.55, 0.95, lateralAbs)) * WIRE_BRIGHTNESS;
      baseWireBright[ci] = fade;
      wireColors[ci * 3]     = fade;
      wireColors[ci * 3 + 1] = fade;
      wireColors[ci * 3 + 2] = fade;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(wireColors, 3));

    // ---- Per-vertex wire glow state (decays with color) ----
    var wireGlow = new Float32Array(N); // 0-1 glow intensity per vertex
    var WIRE_GLOW_MAX = 0.28; // how much brighter the glow makes the lines


    // ---- Fill geometry (clone): separate vertex colors for pastel textures ----
    var fillGeo = geo.clone();
    var fillPos = fillGeo.attributes.position;
    var fillColors = new Float32Array(N * 3);
    fillGeo.setAttribute('color', new THREE.BufferAttribute(fillColors, 3));

    // ---- Per-vertex color state ----
    var colorOpacity = new Float32Array(N);     // 0-1, decays in ~2.5s
    var colorBlurred = new Float32Array(N);
    var GRID_COLS = SX + 1;
    var vertexHue = new Float32Array(N);        // assigned hue 0-1

    // ---- Side-based terrain colors ----
    // Left side (experiential) = blue, Right side (cinematic) = green.
    var ZONE_EXPERIENTIAL = [0.08, 0.28, 0.30];
    var ZONE_CINEMATIC = [0.15, 0.26, 0.10];

    function zoneColorAt(u, out, idx) {
      // Smooth crossfade from experiential (left) to cinematic (right).
      var blend = smoothstep(-0.18, 0.18, u);
      out[idx] = ZONE_EXPERIENTIAL[0] * (1 - blend) + ZONE_CINEMATIC[0] * blend;
      out[idx + 1] = ZONE_EXPERIENTIAL[1] * (1 - blend) + ZONE_CINEMATIC[1] * blend;
      out[idx + 2] = ZONE_EXPERIENTIAL[2] * (1 - blend) + ZONE_CINEMATIC[2] * blend;
    }

    // ---- Materials ----
    // Fill: vertex-colored grass/snow, blends to black via fog
    var fillMat = new THREE.MeshBasicMaterial({
      side: THREE.FrontSide,
      fog: true,
      vertexColors: true
    });
    var fillMesh = new THREE.Mesh(fillGeo, fillMat);
    scene.add(fillMesh);

    // Quad wireframe: only horizontal & vertical edges (no diagonals)
    var quadIndices = [];
    var cols = SX + 1;
    for (var row = 0; row <= SZ; row++) {
      for (var col = 0; col <= SX; col++) {
        var idx = row * cols + col;
        if (col < SX) { quadIndices.push(idx, idx + 1); }
        if (row < SZ) { quadIndices.push(idx, idx + cols); }
      }
    }
    var wireLineGeo = new THREE.BufferGeometry();
    wireLineGeo.setAttribute('position', geo.attributes.position);
    wireLineGeo.setAttribute('color', geo.attributes.color);
    wireLineGeo.setIndex(quadIndices);
    var wireMat = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.30,
      fog: true,
      vertexColors: true
    });
    var mesh = new THREE.LineSegments(wireLineGeo, wireMat);
    scene.add(mesh);

    // ---- Vertex dot points for ripple intersection glow ----
    var dotGeo = geo.clone();
    var dotPos = dotGeo.attributes.position;
    var dotSizes = new Float32Array(N);
    var dotColors = new Float32Array(N * 3);
    dotGeo.setAttribute('customSize', new THREE.BufferAttribute(dotSizes, 1));
    dotGeo.setAttribute('color', new THREE.BufferAttribute(dotColors, 3));
    for (var di = 0; di < N; di++) { dotSizes[di] = 0; }

    var dotMat = new THREE.PointsMaterial({
      size: 0.175,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1.0,
      fog: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: (function () {
        var s = 128;
        var c = document.createElement('canvas');
        c.width = s; c.height = s;
        var ctx = c.getContext('2d');
        var mid = s / 2;

        // Soft radial glow base
        var g = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.03, 'rgba(255,252,245,0.9)');
        g.addColorStop(0.08, 'rgba(255,245,230,0.4)');
        g.addColorStop(0.15, 'rgba(255,235,210,0.1)');
        g.addColorStop(0.3, 'rgba(255,225,195,0.02)');
        g.addColorStop(0.5, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, s, s);

        // 6 star spikes at 0, 60, 120, 30, 90, 150 degrees
        ctx.globalCompositeOperation = 'lighter';
        var spikes = [0, Math.PI / 3, Math.PI * 2 / 3, Math.PI / 6, Math.PI / 2, Math.PI * 5 / 6];
        var lengths = [0.65, 0.65, 0.65, 0.4, 0.4, 0.4];
        var widths = [1.2, 1.2, 1.2, 0.7, 0.7, 0.7];
        var alphas = [0.5, 0.5, 0.5, 0.25, 0.25, 0.25];
        for (var si = 0; si < spikes.length; si++) {
          var sLen = mid * lengths[si];
          var sW = widths[si];
          var sA = alphas[si];
          ctx.save();
          ctx.translate(mid, mid);
          ctx.rotate(spikes[si]);
          var lg = ctx.createLinearGradient(0, -sLen, 0, sLen);
          lg.addColorStop(0, 'rgba(255,250,240,0)');
          lg.addColorStop(0.35, 'rgba(255,250,240,' + (sA * 0.4) + ')');
          lg.addColorStop(0.5, 'rgba(255,255,255,' + sA + ')');
          lg.addColorStop(0.65, 'rgba(255,250,240,' + (sA * 0.4) + ')');
          lg.addColorStop(1, 'rgba(255,250,240,0)');
          ctx.fillStyle = lg;
          ctx.fillRect(-sW, -sLen, sW * 2, sLen * 2);
          ctx.restore();
        }

        var tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
      })()
    });
    var dotPoints = new THREE.Points(dotGeo, dotMat);
    scene.add(dotPoints);

    // ---- Cursor star: single glowing point that follows mouse on terrain ----
    var cursorStarGeo = new THREE.BufferGeometry();
    var cursorStarPos = new Float32Array([0, -10, 0]);
    cursorStarGeo.setAttribute('position', new THREE.BufferAttribute(cursorStarPos, 3));
    var starCanvas = document.createElement('canvas');
    starCanvas.width = 256; starCanvas.height = 256;
    var sCtx = starCanvas.getContext('2d');
    var cx = 128, cy = 128;
    // Bright core glow
    var grad = sCtx.createRadialGradient(cx, cy, 0, cx, cy, 128);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.02, 'rgba(255,255,250,1)');
    grad.addColorStop(0.06, 'rgba(255,250,235,0.85)');
    grad.addColorStop(0.15, 'rgba(255,240,210,0.5)');
    grad.addColorStop(0.3, 'rgba(255,225,180,0.2)');
    grad.addColorStop(0.5, 'rgba(255,210,160,0.06)');
    grad.addColorStop(1, 'rgba(255,200,140,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);
    // Second brighter pass for intense core
    sCtx.globalCompositeOperation = 'lighter';
    var grad2 = sCtx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    grad2.addColorStop(0, 'rgba(255,255,255,1)');
    grad2.addColorStop(0.5, 'rgba(255,250,240,0.4)');
    grad2.addColorStop(1, 'rgba(255,240,220,0)');
    sCtx.fillStyle = grad2;
    sCtx.fillRect(0, 0, 256, 256);
    // Star spikes
    var spikes = 6;
    for (var s = 0; s < spikes; s++) {
      var angle = (s / spikes) * Math.PI * 2;
      sCtx.save();
      sCtx.translate(cx, cy);
      sCtx.rotate(angle);
      var sg = sCtx.createLinearGradient(0, 0, 110, 0);
      sg.addColorStop(0, 'rgba(255,255,245,0.9)');
      sg.addColorStop(0.15, 'rgba(255,245,220,0.4)');
      sg.addColorStop(0.4, 'rgba(255,235,200,0.1)');
      sg.addColorStop(1, 'rgba(255,220,180,0)');
      sCtx.fillStyle = sg;
      sCtx.beginPath();
      sCtx.moveTo(0, -1.8);
      sCtx.lineTo(110, 0);
      sCtx.lineTo(0, 1.8);
      sCtx.closePath();
      sCtx.fill();
      sCtx.restore();
    }
    var cursorStarTex = new THREE.CanvasTexture(starCanvas);
    cursorStarTex.needsUpdate = true;
    var cursorStarMat = new THREE.PointsMaterial({
      size: 3.0,
      map: cursorStarTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      opacity: 0
    });
    var cursorStarPoints = new THREE.Points(cursorStarGeo, cursorStarMat);
    cursorStarPoints.renderOrder = 999;
    scene.add(cursorStarPoints);
    var cursorStarOpacity = 0;
    var CURSOR_STAR_DECAY = 1.0;

    // ---- Mouse tracking via raycasting ----
    // Project cursor onto the y=0 ground plane for accurate terrain coords
    var raycaster = new THREE.Raycaster();
    var mouseNDC = new THREE.Vector2(0, 0);
    var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var hitPoint = new THREE.Vector3();
    // Cursor position in terrain normalised coords
    var cursorU = 0, cursorV = 0, cursorOnTerrain = false;
    var smCurU = 0, smCurV = 0;

    // Terrain cursor CTA — hide on first interaction
    var terrainCta = document.getElementById('terrainCursorCta');
    var terrainCtaDismissed = false;

    var clickCta = document.getElementById('terrainClickCta');
    var clickCtaDismissed = false;
    var clickCtaTimer = null;
    var mouseOnTerrainStart = 0;

    // ---- Click ripple system ----
    var clickRipples = [];
    var MAX_RIPPLES = 5;
    var RIPPLE_SPEED = 1.4;
    var RIPPLE_MAX_R = 5.5;
    var RIPPLE_WIDTH = 0.14;
    var RIPPLE_FADE_START = 1.5;

    if (hero && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
      hero.addEventListener('mousemove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouseNDC.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouseNDC.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        raycaster.setFromCamera(mouseNDC, camera);
        var hits = raycaster.intersectObject(fillMesh, false);
        if (hits.length > 0) {
          var hp = hits[0].point;
          cursorU = hp.x / halfW;
          cursorV = hp.z / halfD;
          cursorOnTerrain = (Math.abs(cursorU) < 1.3 && Math.abs(cursorV) < 1.3);
        } else {
          var t = raycaster.ray.intersectPlane(groundPlane, hitPoint);
          if (t) {
            cursorU = hitPoint.x / halfW;
            cursorV = hitPoint.z / halfD;
            cursorOnTerrain = (Math.abs(cursorU) < 1.3 && Math.abs(cursorV) < 1.3);
          } else {
            cursorOnTerrain = false;
          }
        }
        if (cursorOnTerrain && !terrainCtaDismissed && terrainCta) {
          terrainCtaDismissed = true;
          terrainCta.classList.add('hidden');
        }
        // Start click CTA timer on first terrain interaction
        if (cursorOnTerrain && !clickCtaDismissed && clickCta && !clickCtaTimer) {
          mouseOnTerrainStart = performance.now();
          clickCtaTimer = setTimeout(function () {
            if (!clickCtaDismissed && clickCta) clickCta.classList.add('show');
          }, 5000);
        }
      });
      hero.addEventListener('mouseleave', function () {
        cursorOnTerrain = false;
        if (clickCtaTimer) { clearTimeout(clickCtaTimer); clickCtaTimer = null; }
      });

      hero.addEventListener('click', function (e) {
        // Dismiss click CTA on first click
        if (!clickCtaDismissed && clickCta) {
          clickCtaDismissed = true;
          clickCta.classList.add('hidden');
        }
        var r = canvas.getBoundingClientRect();
        var ndcX = ((e.clientX - r.left) / r.width) * 2 - 1;
        var ndcY = -(((e.clientY - r.top) / r.height) * 2 - 1);
        var rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
        var clickHits = rc.intersectObject(fillMesh, false);
        var clickPt = null;
        if (clickHits.length > 0) {
          clickPt = clickHits[0].point;
        } else {
          var pt = new THREE.Vector3();
          var hit = rc.ray.intersectPlane(groundPlane, pt);
          if (hit) clickPt = pt;
        }
        if (clickPt) {
          if (clickRipples.length >= MAX_RIPPLES) clickRipples.shift();
          clickRipples.push({
            wx: clickPt.x, wz: clickPt.z,
            radius: 0,
            alive: true
          });
        }
      });
    }

    // ---- Resize ----
    function resize() {
      var w = container.offsetWidth, h = container.offsetHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    // ---- Animate ----
    var STAMP_STR  = 0.918;
    var RIPPLE_STR = 0.2493;
    var INNER_R    = 0.065; // ~10% less affected area
    var RIPPLE_R   = 0.171; // ~10% less affected area
    var DECAY_SECONDS = 12.0; // longer hold before peaks settle
    var COLOR_DECAY_S = 1.0;
    var COLOR_INNER_R = INNER_R * 0.725;
    var GLOW_INNER_R = INNER_R * 0.25;
    var GLOW_DECAY_S = 0.7;
    var glowOpacity = new Float32Array(N);
    var M_DAMP     = 0.18;   // tighter mouse tracking to match cursor position
    var RISE_SPEED = 0.04;   // how fast boost ramps up toward stamp target
    var lastTime = performance.now();

    function animate() {
      requestAnimationFrame(animate);
      var now = performance.now();
      var dt = Math.max(0.001, (now - lastTime) / 1000);
      lastTime = now;
      var decayMul = Math.exp(-dt / DECAY_SECONDS);
      var colorDecayMul = Math.exp(-dt / COLOR_DECAY_S);
      var glowDecayMul = Math.exp(-dt / GLOW_DECAY_S);

      // Smooth cursor in terrain-space
      if (cursorOnTerrain) {
        smCurU += (cursorU - smCurU) * M_DAMP;
        smCurV += (cursorV - smCurV) * M_DAMP;
      }
      window._terrainCursorU = smCurU;
      window._terrainCursorOn = cursorOnTerrain;

      for (var i = 0; i < N; i++) {
        var du = uCoords[i] - smCurU;
        var dv = vCoords[i] - smCurV;
        var dist2 = du * du + dv * dv;
        var dist = Math.sqrt(dist2);

        // --- Stamp new boost from cursor ---
        var stamp = 0;
        if (cursorOnTerrain && dist < RIPPLE_R) {
          var mainG = Math.exp(-dist2 / (2 * INNER_R * INNER_R));
          stamp += mainG * mainG * STAMP_STR;

          var ringCenter = (INNER_R + RIPPLE_R) * 0.55;
          var ringWidth = (RIPPLE_R - INNER_R) * 0.3;
          var ringDist = dist - ringCenter;
          var ringG = Math.exp(-(ringDist * ringDist) / (2 * ringWidth * ringWidth));
          ringG *= ringG;
          var angle = Math.atan2(dv, du);
          var ripplePattern = 0.5 + 0.5 * Math.sin(angle * 6 + hash(Math.floor(smCurU * 3), Math.floor(smCurV * 3)) * 6.28);
          stamp += ringG * RIPPLE_STR * ripplePattern;
        }

        // Depth scale: smaller at front, taller at back
        var depthFactor = 0.35 + 0.65 * ((1 - vCoords[i]) * 0.5);
        // Organic mask: suppress boost outside the organic boundary
        stamp *= depthFactor * edgeMask[i];

        if (stamp > boostH[i]) {
          // Ramp up gradually instead of snapping
          boostH[i] += (stamp - boostH[i]) * RISE_SPEED;
        } else {
          // Slow decay when no longer being stamped
          boostH[i] *= decayMul;
          if (boostH[i] < 0.001) boostH[i] = 0;
        }

        var totalH = baseH[i] + boostH[i];
        pos.setY(i, totalH);
        fillPos.setY(i, totalH);

        // ---- Pastel vertex color on fill mesh ----
        var ci3 = i * 3;

        // When cursor stamps this vertex, paint color with organic cloud-like falloff
        if (cursorOnTerrain && dist < RIPPLE_R * 0.8) {
          var colorMaxR = COLOR_INNER_R * 3.6;
          var ux = uCoords[i], vx = vCoords[i];
          var n1 = (noise2(ux * 4.0 + 3.3, vx * 4.0 + 7.7) - 0.5) * 0.45;
          var n2 = (noise2(ux * 9.0 + 11.1, vx * 9.0 + 5.3) - 0.5) * 0.25;
          var n3 = (noise2(ux * 17.0 + 1.7, vx * 17.0 + 13.9) - 0.5) * 0.12;
          var nJitter = 1.0 + n1 + n2 + n3;
          var normDist = dist / (colorMaxR * nJitter);
          var colorStamp;
          if (normDist >= 1.0) {
            colorStamp = 0;
          } else if (normDist < 0.35) {
            colorStamp = 1.0;
          } else {
            var t = (normDist - 0.35) / 0.65;
            t = t * t * t * (t * (t * 6 - 15) + 10);
            colorStamp = 1.0 - t;
          }
          var targetOp = Math.min(1, colorStamp * 1.3);
          if (targetOp > colorOpacity[i]) {
            colorOpacity[i] += (targetOp - colorOpacity[i]) * 0.06;
          }
        }

        // Decay color
        colorOpacity[i] *= colorDecayMul;
        if (colorOpacity[i] < 0.005) colorOpacity[i] = 0;
      }

      // Spatial blur pass: smooth colorOpacity across grid neighbors to eliminate jagged polygon edges
      for (var bi = 0; bi < N; bi++) {
        var row = (bi / GRID_COLS) | 0;
        var col = bi % GRID_COLS;
        var sum = colorOpacity[bi] * 4;
        var count = 4;
        if (col > 0)      { sum += colorOpacity[bi - 1] * 2; count += 2; }
        if (col < SX)     { sum += colorOpacity[bi + 1] * 2; count += 2; }
        if (row > 0)      { sum += colorOpacity[bi - GRID_COLS] * 2; count += 2; }
        if (row < SZ)     { sum += colorOpacity[bi + GRID_COLS] * 2; count += 2; }
        if (col > 0 && row > 0)   { sum += colorOpacity[bi - GRID_COLS - 1]; count += 1; }
        if (col < SX && row > 0)  { sum += colorOpacity[bi - GRID_COLS + 1]; count += 1; }
        if (col > 0 && row < SZ)  { sum += colorOpacity[bi + GRID_COLS - 1]; count += 1; }
        if (col < SX && row < SZ) { sum += colorOpacity[bi + GRID_COLS + 1]; count += 1; }
        colorBlurred[bi] = sum / count;
      }

      // Apply blurred colors to fill mesh
      for (var fi = 0; fi < N; fi++) {
        var ci3 = fi * 3;
        var blurOp = colorBlurred[fi];
        if (blurOp < 0.003) {
          fillColors[ci3] = 0;
          fillColors[ci3 + 1] = 0;
          fillColors[ci3 + 2] = 0;
        } else {
          var zc = [0, 0, 0];
          zoneColorAt(uCoords[fi], zc, 0);
          var smoothC = blurOp * blurOp * (3 - 2 * blurOp);
          var cMul = smoothC * 0.75;
          fillColors[ci3]     = Math.min(1, zc[0] * cMul);
          fillColors[ci3 + 1] = Math.min(1, zc[1] * cMul);
          fillColors[ci3 + 2] = Math.min(1, zc[2] * cMul);
        }

        var wb = baseWireBright[fi];
        wireColors[ci3]     = wb;
        wireColors[ci3 + 1] = wb;
        wireColors[ci3 + 2] = wb;
      }

      // ---- Click ripple rings expanding across terrain ----
      // Reset dot sizes each frame
      for (var dri = 0; dri < N; dri++) {
        dotSizes[dri] = 0;
        dotColors[dri * 3] = 0;
        dotColors[dri * 3 + 1] = 0;
        dotColors[dri * 3 + 2] = 0;
      }

      for (var ri = clickRipples.length - 1; ri >= 0; ri--) {
        var rip = clickRipples[ri];
        rip.radius += RIPPLE_SPEED * dt;
        if (rip.radius > RIPPLE_MAX_R) {
          clickRipples.splice(ri, 1);
          continue;
        }
        var ripAlpha = 1.0 - Math.max(0, (rip.radius - RIPPLE_FADE_START) / (RIPPLE_MAX_R - RIPPLE_FADE_START));
        ripAlpha *= ripAlpha;

        var ringW = RIPPLE_WIDTH + rip.radius * 0.04;
        var rOuter = rip.radius + ringW;
        var rInner = Math.max(0, rip.radius - ringW);
        var rOuter2 = rOuter * rOuter;
        var rInner2 = rInner * rInner;
        var rCenter = rip.radius;
        var invW = 1.0 / Math.max(0.01, ringW);

        var dotZone = ringW * 3.5;
        var dotOuter2 = (rip.radius + dotZone) * (rip.radius + dotZone);
        var dotInner2 = Math.max(0, rip.radius - dotZone) * Math.max(0, rip.radius - dotZone);

        for (var vi = 0; vi < N; vi++) {
          var vx = pos.getX(vi);
          var vz = pos.getZ(vi);
          var rdx = vx - rip.wx;
          var rdz = vz - rip.wz;
          var flatDist2 = rdx * rdx + rdz * rdz;

          // Bright wireframe contour ring (3x enhanced)
          if (flatDist2 <= rOuter2 && flatDist2 >= rInner2) {
            var flatDist = Math.sqrt(flatDist2);
            var ringFalloff = 1.0 - Math.abs(flatDist - rCenter) * invW;
            if (ringFalloff > 0) {
              ringFalloff *= ringFalloff;
              var brightness = ringFalloff * ripAlpha * 0.25;
              var vci = vi * 3;
              wireColors[vci]     = Math.min(1, wireColors[vci]     + brightness * 0.95);
              wireColors[vci + 1] = Math.min(1, wireColors[vci + 1] + brightness * 0.88);
              wireColors[vci + 2] = Math.min(1, wireColors[vci + 2] + brightness * 0.65);
            }
          }

          // Glowing vertex dots at intersections near the ring
          if (flatDist2 <= dotOuter2 && flatDist2 >= dotInner2) {
            var dDist = Math.sqrt(flatDist2);
            var dotFalloff = 1.0 - Math.abs(dDist - rCenter) / dotZone;
            if (dotFalloff > 0) {
              dotFalloff *= dotFalloff;
              var dotBright = dotFalloff * ripAlpha * 0.35;
              if (dotBright > dotSizes[vi]) dotSizes[vi] = dotBright;
              var dci = vi * 3;
              dotColors[dci]     = Math.min(1, dotColors[dci]     + dotBright * 1.0);
              dotColors[dci + 1] = Math.min(1, dotColors[dci + 1] + dotBright * 0.92);
              dotColors[dci + 2] = Math.min(1, dotColors[dci + 2] + dotBright * 0.7);
            }
          }
        }
      }

      // Sync dot geometry with terrain height
      for (var dsi = 0; dsi < N; dsi++) {
        dotPos.setY(dsi, pos.getY(dsi) + 0.005);
      }
      dotPos.needsUpdate = true;
      dotGeo.attributes.customSize.needsUpdate = true;
      dotGeo.attributes.color.needsUpdate = true;
      dotMat.size = clickRipples.length > 0 ? 0.175 : 0;

      pos.needsUpdate = true;
      fillPos.needsUpdate = true;
      fillGeo.attributes.color.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;

      // Update cursor star position and opacity
      if (cursorOnTerrain) {
        var starX = smCurU * halfW;
        var starZ = smCurV * halfD;
        var col0 = Math.round((smCurU * 0.5 + 0.5) * SX);
        var row0 = Math.round((smCurV * 0.5 + 0.5) * SZ);
        col0 = Math.max(0, Math.min(SX, col0));
        row0 = Math.max(0, Math.min(SZ, row0));
        var nearIdx = row0 * (SX + 1) + col0;
        var starY = pos.getY(nearIdx) + 0.15;
        cursorStarPos[0] = starX;
        cursorStarPos[1] = starY;
        cursorStarPos[2] = starZ;
        cursorStarOpacity = 1.0;
      } else {
        cursorStarOpacity *= Math.exp(-dt / CURSOR_STAR_DECAY);
        if (cursorStarOpacity < 0.005) cursorStarOpacity = 0;
      }
      cursorStarMat.opacity = cursorStarOpacity;
      cursorStarGeo.attributes.position.needsUpdate = true;

      // Keep heading locked to terrain depth line (no floating motion).
      if (landscapeHeading) {
        var introT = (now - headingIntroStart) / headingIntroDur;
        if (introT < 0) introT = 0;
        if (introT > 1) introT = 1;
        var ease = 1 - Math.pow(1 - introT, 3);
        landscapeHeading.position.y = headingBaseY + (1 - ease) * headingDropY;
        for (var li = 0; li < landscapeHeading.children.length; li++) {
          var child = landscapeHeading.children[li];
          if (child.material && child.material.userData && child.material.userData.baseOpacity != null) {
            child.material.opacity = child.material.userData.baseOpacity * ease;
          }
        }
      }

      renderer.render(scene, camera);
    }

    resize();
    window.addEventListener('resize', resize);
    animate();
  })();

  // —— Capability reveal ——
  var capabilitiesContainer = document.querySelector('[data-capabilities]');
  var capabilityItems = document.querySelectorAll('[data-capability]');

  if (hero && capabilitiesContainer && capabilityItems.length && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var on = window._terrainCursorOn;
      if (!on) {
        capabilityItems.forEach(function (el) { el.classList.remove('revealed'); });
        return;
      }
      var mx = e.clientX;
      var closest = null;
      var closestDist = Infinity;
      capabilityItems.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var d = Math.abs(mx - cx);
        if (d < closestDist) { closestDist = d; closest = el; }
      });
      capabilityItems.forEach(function (el) {
        el.classList.toggle('revealed', el === closest);
      });
    });

    hero.addEventListener('mouseleave', function () {
      capabilityItems.forEach(function (el) {
        el.classList.remove('revealed');
      });
    });
  }

  // Make grid tiles clickable — navigate to project page
  document.querySelectorAll('.project-block[data-href]').forEach(function (block) {
    block.addEventListener('click', function () {
      window.location.href = block.getAttribute('data-href');
    });
  });

  // Subtle headline parallax
  var headlineEl = document.querySelector('.hero-headline');
  if (hero && headlineEl && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      headlineEl.style.transform =
        'translateX(' + (x * 6) + 'px) translateY(' + (y * 3) + 'px)';
    });
    hero.addEventListener('mouseleave', function () {
      headlineEl.style.transform = 'translateX(0) translateY(0)';
    });
  }

  // Show scroll CTA after 10 seconds on hero page
  var scrollCta = document.querySelector('.hero-scroll-cta');
  if (scrollCta) {
    setTimeout(function () {
      scrollCta.classList.add('show');
    }, 10000);
  }

  // Story parallax video scrub (plays through with scroll, then holds last frame)
  (function initStoryParallax() {
    var storySection = document.querySelector('[data-story-parallax]');
    var storyVideo = document.getElementById('storyVideo');
    var storyOverlay = document.getElementById('storyOverlay');
    if (!storySection || !storyVideo) return;

    var duration = 0;
    var rafPending = false;

    function clamp(v, min, max) {
      return Math.min(max, Math.max(min, v));
    }

    function onFrame() {
      rafPending = false;
      var viewH = window.innerHeight || 1;
      var rect = storySection.getBoundingClientRect();
      var totalScrollable = Math.max(1, storySection.offsetHeight - viewH);
      var travelled = clamp(-rect.top, 0, totalScrollable);
      var progress = travelled / totalScrollable;

      if (duration > 0) {
        var targetTime = progress * Math.max(0, duration - 0.04);
        if (Math.abs(storyVideo.currentTime - targetTime) > 0.02) {
          try { storyVideo.currentTime = targetTime; } catch (e) {}
        }
      }

      // Subtle parallax zoom-out while scrolling through the section.
      var scale = 1.08 - progress * 0.06;
      storyVideo.style.transform = 'scale(' + scale.toFixed(3) + ')';

      // Fade video in from black at the start of the section.
      var fadeProgress = clamp(progress / 0.096, 0, 1);
      storySection.style.setProperty('--story-fade', (1 - fadeProgress).toFixed(3));

      if (storyOverlay) {
        storyOverlay.classList.toggle('show', progress >= 0.98);
      }
    }

    function requestFrame() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(onFrame);
    }

    storyVideo.muted = true;
    storyVideo.pause();
    storyVideo.addEventListener('loadedmetadata', function () {
      duration = Number(storyVideo.duration) || 0;
      requestFrame();
    });

    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', requestFrame);
    requestFrame();
  })();

  // (Grid tiles use CSS hover overlay instead of 3D tilt)

  // Scroll reveal for project blocks
  const observerOptions = { root: null, rootMargin: '0px 0px -80px 0px', threshold: 0.1 };
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  projects.forEach(function (block) {
    observer.observe(block);
  });

  // Header background on scroll
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Custom cursor (desktop only)
  if (cursorDot && cursorRing && window.matchMedia('(hover: hover)').matches) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursorRing.style.width = '56px';
        cursorRing.style.height = '56px';
      });
      el.addEventListener('mouseleave', function () {
        cursorRing.style.width = '40px';
        cursorRing.style.height = '40px';
      });
    });
  }

  // Form submit
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      contactForm.reset();
      if (formSuccess) {
        formSuccess.hidden = false;
        setTimeout(function () {
          formSuccess.hidden = true;
        }, 4000);
      }
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
