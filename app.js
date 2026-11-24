/* Générateur de DOE VTL (dossier de verticalité) — HTML / CSS / JavaScript pur, sans dépendance. */
(function () {
  'use strict';

  var DEFAULT_LOGO_LEFT = 'assets/logo-free.png';
  var DEFAULT_LOGO_RIGHT = 'assets/logo-topsat.png';
  /* Copie de assets/listes.csv, utilisée si le fichier n'est pas accessible (ouverture en file://). */
  var EMBEDDED_CSV = /*CSV_START*/"liste;valeur\nversion;(V1)\nversion;(V2)\nversion;(V3)\nversion;(V4)\nversion;(V5)\nras;RAS\nras;SO\nras;Oui\nras;Non\naccessType;I lock\naccessType;Porte grillag\u00e9e\naccessType;Portail coulissant\naccessType;Portillon\naccessType;Porte pleine\naccessType;Local technique\naccessType;Acc\u00e8s libre\nkeyType;SO\nkeyType;Cadenas\nkeyType;Deny\nkeyType;Abloy\nkeyType;Cl\u00e9 triangle\nkeyType;Cl\u00e9 carr\u00e9e\nkeyType;Badge\nkeyType;Digicode\nkeyType;Aucune\nsiteType;Pyl\u00f4ne\nsiteType;Toit-terrasse\nsiteType;Ch\u00e2teau d'eau\nsiteType;M\u00e2t\nsiteType;Clocher\nsiteType;Silo\nsiteType;Chemin\u00e9e\nsiteType;Immeuble\nsecurityType;SO\nsecurityType;Cadenas\nsecurityType;Tampon verrouill\u00e9\nsecurityType;Fermeture par vis\ntraffic;RAS\ntraffic;Oui\ntraffic;Non\ntraffic;Alternat par feux tricolores\ntraffic;Alternat manuel (K10)\n"/*CSV_END*/;

  /* ------------------------------------------------------------------ */
  /*  État                                                              */
  /* ------------------------------------------------------------------ */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function codeToHeader(c) { return String(c || '').replace(/-/g, '_'); }

  /* Images « emplacement » (couverture, vue d'ensemble, plan de masse) : { src, w, h, shapes } ou null */
  var SLOTS = ['coverImg', 'overviewImg', 'planImg'];

  function blankState() {
    return {
      headerCode: '', headerLine2: 'DOE VTL', headerLine3: 'BTS',
      logoLeft: '', logoRight: '',
      version: '(V1)', projectCode: '', author: '', date: todayISO(),

      coverTitle: 'REPORTAGE PHOTO', coverImg: null, address: '',
      showOverview: true, overviewTitle: 'VUE D’ENSEMBLE DU SITE', overviewImg: null,

      cableLength: '', laidUnderground: '', laidBuilding: '', laidOther: 'RAS',
      chambers: 'RAS', tubeIro: 'RAS', falseFloor: 'RAS', partition: 'RAS', wall: 'RAS',
      sheathUV: 'RAS', sheathLSOH: 'RAS', sheathRodent: 'RAS',

      accessContact: '', accessType: '', keyType: 'SO', accessCode: 'SO',
      chamberSecurity: 'SO', chamberName: 'SO', securityType: 'SO',

      technician: '', siteType: '', heritage: 'RAS', cableName: '',
      publicDomain: 'RAS', manager: '', privateDomain: 'RAS', parcels: '',
      signage: 'RAS', drire: 'RAS', traffic: 'RAS',

      showPlan: true, planTitle: 'PLAN DE MASSE', planImg: null,

      photosPerPage: 6, capBold: true,
      photos: []
    };
  }

  /* Exemple prérempli avec les données du dossier VTL 60175_007_01 */
  function sampleState() {
    var s = blankState();
    s.headerCode = '60175_007_01';
    s.projectCode = '60175_007_01';
    s.version = '(V2)';
    s.author = 'JF C';
    s.date = '2026-02-27';
    s.address = '3 BOULEVARD GABRIEL HAVEZ 60100 CREIL';
    s.cableLength = '20 ML';
    s.laidUnderground = '10 ml';
    s.sheathUV = '3ml';
    s.accessType = 'I lock';
    s.technician = 'David PETIT Chargé d’affaires\nTél : 01.60.86.06.00';
    s.siteType = 'Pylône';
    s.cableName = 'CAD_CRH60_001_01_03';
    s.manager = 'Commune de Creil';
    s.parcels = 'Orange central téléphonique';
    return s;
  }

  var state = sampleState();

  /* ------------------------------------------------------------------ */
  /*  Persistance (IndexedDB, assez grande pour de nombreuses photos)    */
  /* ------------------------------------------------------------------ */
  var DB_NAME = 'doe-vtl', STORE = 'kv', KEY = 'state';
  function openDB() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('IndexedDB indisponible'));
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function dbGet(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var r = db.transaction(STORE).objectStore(STORE).get(key);
        r.onsuccess = function () { resolve(r.result); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }
  function dbSet(key, value) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  var saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      dbSet(KEY, state).then(function () { setStatus('Sauvegardé automatiquement dans ce navigateur.'); })
        .catch(function () { setStatus('Sauvegarde automatique impossible : utilisez « Exporter (.json) ».'); });
    }, 600);
  }
  function setStatus(t) { document.getElementById('saveStatus').textContent = t; }

  /* ------------------------------------------------------------------ */
  /*  Utilitaires DOM                                                   */
  /* ------------------------------------------------------------------ */
  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      if (k === 'class') el.className = props[k];
      else if (k === 'text') el.textContent = props[k];
      else if (k === 'style') el.setAttribute('style', props[k]);
      else el.setAttribute(k, props[k]);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  function b(text) { return h('b', { text: text }); }
  function formatDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p.length === 3 ? 'Le ' + p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  /* ------------------------------------------------------------------ */
  /*  Images                                                            */
  /* ------------------------------------------------------------------ */
  function readImage(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onerror = function () { reject(fr.error); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Image illisible : ' + file.name)); };
        img.onload = function () {
          var w = img.naturalWidth, hgt = img.naturalHeight;
          var scale = Math.min(1, maxDim / Math.max(w, hgt));
          var c = document.createElement('canvas');
          c.width = Math.round(w * scale); c.height = Math.round(hgt * scale);
          var ctx = c.getContext('2d');
          var keepAlpha = file.type === 'image/png';
          if (!keepAlpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve({ src: keepAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', quality), w: c.width, h: c.height });
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Aperçu                                                            */
  /* ------------------------------------------------------------------ */
  function header() {
    return h('table', { class: 'hdr' },
      h('tr', {},
        h('td', { class: 'logo-l' }, h('img', { src: state.logoLeft || DEFAULT_LOGO_LEFT, alt: 'Logo gauche' })),
        h('td', { class: 'title' },
          h('div', { class: 'code', text: state.headerCode }),
          h('div', { class: 'l2row' },
            h('span', { class: 'l2', text: state.headerLine2 }),
            h('span', { class: 'l3', text: state.headerLine3 }))),
        h('td', { class: 'logo-r' }, h('img', { src: state.logoRight || DEFAULT_LOGO_RIGHT, alt: 'Logo droite' }))));
  }

  function footer(pageNo, total) {
    return h('div', { class: 'ftr' },
      h('table', {},
        h('tr', {},
          h('td', { text: 'Version du Document : ' + state.version }),
          h('td', {}, 'Code projet du site :', h('br'), state.projectCode),
          h('td', {}, 'Fait par :', h('br'), state.author),
          h('td', {}, 'Date de réalisation :', h('br'), formatDate(state.date)))),
      h('div', { class: 'pageno', text: 'Page ' + pageNo + '/' + total }));
  }

  function makePage(bodyNodes, pageNo, total) {
    return h('section', { class: 'page' }, header(), h('div', { class: 'body' }, bodyNodes), footer(pageNo, total));
  }

  function layoutFor(n) {
    if (n === 1) return { cols: 1, rows: 1 };
    if (n === 2) return { cols: 2, rows: 1 };
    if (n === 4) return { cols: 2, rows: 2 };
    return { cols: 2, rows: 3 };
  }

  /* ------------------------------------------------------------------ */
  /*  Tracés (polylignes) sur les photos                                */
  /* ------------------------------------------------------------------ */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  /* Groupe SVG d'un tracé. W = largeur de l'image en pixels (l'épaisseur est proportionnelle). */
  function shapeGroup(shape, W, opts) {
    opts = opts || {};
    var g = sv('g');
    var pts = shape.pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ');
    var sw = shape.w * W;
    var base = { points: pts, fill: 'none', 'stroke-linejoin': 'round' };
    if (shape.halo) {
      g.appendChild(sv('polyline', Object.assign({ stroke: '#fff', 'stroke-opacity': '0.65', 'stroke-width': sw * 1.9, 'stroke-linecap': 'round' }, base)));
    }
    var line = sv('polyline', Object.assign({ stroke: shape.color, 'stroke-width': sw, 'stroke-linecap': shape.dash ? 'butt' : 'round' }, base));
    if (shape.dash) line.setAttribute('stroke-dasharray', (sw * 3.2) + ' ' + (sw * 2.2));
    g.appendChild(line);
    if (opts.hit) {
      var hit = sv('polyline', Object.assign({ stroke: 'transparent', 'stroke-width': Math.max(sw * 2.4, W * 0.025), 'stroke-linecap': 'round' }, base));
      hit.setAttribute('data-sid', shape.id);
      hit.style.pointerEvents = 'stroke';
      hit.style.cursor = 'pointer';
      g.appendChild(hit);
    }
    return g;
  }

  /* Image d'une photo : <img> simple, ou <svg> (image + tracés) quand il y a des tracés. */
  function photoNode(p, alt) {
    if (p.shapes && p.shapes.length && p.w && p.h) {
      var svg = sv('svg', { viewBox: '0 0 ' + p.w + ' ' + p.h, preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': alt });
      svg.appendChild(sv('image', { href: p.src, x: 0, y: 0, width: p.w, height: p.h }));
      p.shapes.forEach(function (s) { if (s.pts.length >= 2) svg.appendChild(shapeGroup(s, p.w)); });
      return svg;
    }
    return h('img', { src: p.src, alt: alt });
  }

  var COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#00bcd4', '#1e88e5', '#d81b60', '#ffffff', '#111111'];
  var D = null; /* état de l'éditeur */

  function el(id) { return document.getElementById(id); }

  function openDraw(p, label) {
    var img = new Image();
    img.onload = function () {
      p.w = img.naturalWidth; p.h = img.naturalHeight;
      var idx = state.photos.indexOf(p);
      D = {
        photo: p, W: p.w, H: p.h,
        shapes: JSON.parse(JSON.stringify(p.shapes || [])),
        mode: 'draw', cur: [], mouse: null, sel: null, drag: null, dirty: false,
        color: COLORS[0], w: 0.014, dash: false, halo: true
      };
      el('drawTitle').textContent = label || ('Tracés sur la photo ' + (idx + 1));
      var svg = el('drawSvg');
      svg.textContent = '';
      svg.setAttribute('viewBox', '0 0 ' + D.W + ' ' + D.H);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.appendChild(sv('image', { href: p.src, x: 0, y: 0, width: D.W, height: D.H }));
      D.gShapes = sv('g'); D.gCur = sv('g'); D.gHandles = sv('g');
      D.gCur.style.pointerEvents = 'none';
      svg.appendChild(D.gShapes); svg.appendChild(D.gCur); svg.appendChild(D.gHandles);
      el('drawModal').hidden = false;
      setMode('draw');
      syncControls();
      renderDraw();
    };
    img.onerror = function () { alert('Photo illisible.'); };
    img.src = p.src;
  }

  function closeDraw() { el('drawModal').hidden = true; D = null; }

  function setMode(m) {
    if (!D) return;
    if (m === 'edit') finishCur();
    D.mode = m; D.sel = (m === 'edit') ? D.sel : null; D.cur = []; D.mouse = null;
    el('dMdDraw').classList.toggle('active', m === 'draw');
    el('dMdEdit').classList.toggle('active', m === 'edit');
    el('drawSvg').setAttribute('class', m);
    el('dHint').textContent = m === 'draw'
      ? 'Cliquez pour poser les points du tracé. Double-clic, Entrée, clic droit ou « Terminer le tracé » pour le finir. Retour arrière : annule le dernier point. Échap : abandonne le tracé en cours.'
      : 'Cliquez sur un tracé pour le sélectionner, glissez ses points pour le corriger, changez sa couleur ou son épaisseur ci-dessus. Suppr : supprime le tracé sélectionné.';
    renderDraw();
  }

  function selectedShape() {
    if (!D || !D.sel) return null;
    return D.shapes.filter(function (s) { return s.id === D.sel; })[0] || null;
  }

  function syncControls() {
    el('dColor').value = /^#[0-9a-f]{6}$/i.test(D.color) ? D.color : '#e53935';
    el('dWidth').value = String(D.w);
    el('dDash').checked = D.dash;
    el('dHalo').checked = D.halo;
    document.querySelectorAll('#dSwatches .swatch').forEach(function (b) {
      b.classList.toggle('active', b.dataset.color.toLowerCase() === D.color.toLowerCase());
    });
  }

  function applyStyle(key, value) {
    if (!D) return;
    D[key] = value;
    var s = selectedShape();
    if (D.mode === 'edit' && s) { s[key] = value; D.dirty = true; }
    syncControls();
    renderDraw();
  }

  function renderDraw() {
    if (!D) return;
    D.gShapes.textContent = '';
    D.shapes.forEach(function (s) { D.gShapes.appendChild(shapeGroup(s, D.W, { hit: D.mode === 'edit' })); });
    renderCur();
    D.gHandles.textContent = '';
    var s = selectedShape();
    if (D.mode === 'edit' && s) {
      var r = Math.max(D.W, D.H) * 0.009;
      s.pts.forEach(function (q, i) {
        var c = sv('circle', { cx: q[0], cy: q[1], r: r, fill: '#fff', stroke: s.color, 'stroke-width': r * 0.35 });
        c.setAttribute('data-vi', String(i));
        c.style.cursor = 'move';
        D.gHandles.appendChild(c);
      });
    }
    el('dDelete').disabled = !(D.mode === 'edit' && s);
    el('dFinish').disabled = !(D.mode === 'draw' && D.cur.length >= 2);
    el('dClear').disabled = !D.shapes.length && !D.cur.length;
    el('dUndo').disabled = !D.shapes.length && !D.cur.length;
  }

  function renderCur() {
    D.gCur.textContent = '';
    if (!D.cur.length) return;
    var pts = D.cur.slice();
    if (D.mouse) pts.push(D.mouse);
    if (pts.length >= 2) D.gCur.appendChild(shapeGroup({ id: '_', color: D.color, w: D.w, dash: D.dash, halo: D.halo, pts: pts }, D.W));
    var r = Math.max(D.W, D.H) * 0.006;
    D.cur.forEach(function (q) {
      D.gCur.appendChild(sv('circle', { cx: q[0], cy: q[1], r: r, fill: '#fff', stroke: D.color, 'stroke-width': r * 0.4 }));
    });
  }

  function finishCur() {
    if (!D) return;
    if (D.cur.length >= 2) {
      var s = { id: uid(), color: D.color, w: D.w, dash: D.dash, halo: D.halo, pts: D.cur.map(function (q) { return [q[0], q[1]]; }) };
      D.shapes.push(s);
      D.dirty = true;
    }
    D.cur = []; D.mouse = null;
    renderDraw();
  }

  function toPt(e) {
    var svg = el('drawSvg');
    var pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    var q = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [Math.min(D.W, Math.max(0, q.x)), Math.min(D.H, Math.max(0, q.y))];
  }

  function onDrawDown(e) {
    if (!D || e.button > 0) return;
    var pt = toPt(e);
    if (D.mode === 'draw') {
      /* Double-clic / double-tap : termine le tracé (le point du 1er clic est déjà posé). */
      var last = D.lastDown;
      D.lastDown = { t: e.timeStamp, x: e.clientX, y: e.clientY };
      if (last && D.cur.length >= 2 && e.timeStamp - last.t < 400 &&
          Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y) < 12) {
        D.lastDown = null;
        finishCur();
        return;
      }
      D.cur.push(pt); D.mouse = null; renderDraw();
      return;
    }
    var t = e.target;
    if (t.getAttribute && t.getAttribute('data-vi') != null && selectedShape()) {
      D.drag = { vi: Number(t.getAttribute('data-vi')) };
      el('drawSvg').setPointerCapture(e.pointerId);
      return;
    }
    var sid = t.getAttribute && t.getAttribute('data-sid');
    D.sel = sid || null;
    var s = selectedShape();
    if (s) { D.color = s.color; D.w = s.w; D.dash = !!s.dash; D.halo = !!s.halo; syncControls(); }
    renderDraw();
  }
  function onDrawMove(e) {
    if (!D) return;
    if (D.drag) {
      var s = selectedShape();
      if (s) { s.pts[D.drag.vi] = toPt(e); D.dirty = true; renderDraw(); }
    } else if (D.mode === 'draw' && D.cur.length) {
      D.mouse = toPt(e); renderCur();
    }
  }
  function onDrawUp() { if (D) D.drag = null; }

  function undoDraw() {
    if (!D) return;
    if (D.cur.length) D.cur.pop();
    else if (D.shapes.length) { D.shapes.pop(); D.sel = null; D.dirty = true; }
    D.mouse = null;
    renderDraw();
  }
  function deleteSelected() {
    if (!D || !D.sel) return;
    D.shapes = D.shapes.filter(function (s) { return s.id !== D.sel; });
    D.sel = null; D.dirty = true; renderDraw();
  }
  function askClose() {
    if (D && D.dirty && !confirm('Fermer sans enregistrer les modifications des tracés ?')) return;
    closeDraw();
  }

  function onDrawKey(e) {
    if (!D || el('drawModal').hidden) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'color') return;
    if (e.key === 'Enter') { e.preventDefault(); if (D.mode === 'draw') finishCur(); }
    else if (e.key === 'Escape') { e.preventDefault(); if (D.cur.length) { D.cur = []; D.mouse = null; renderDraw(); } else askClose(); }
    else if (e.key === 'Backspace' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z')) { e.preventDefault(); undoDraw(); }
    else if (e.key === 'Delete') { e.preventDefault(); deleteSelected(); }
  }

  function bindDraw() {
    var svg = el('drawSvg');
    svg.addEventListener('pointerdown', onDrawDown);
    svg.addEventListener('pointermove', onDrawMove);
    svg.addEventListener('pointerup', onDrawUp);
    svg.addEventListener('pointercancel', onDrawUp);
    svg.addEventListener('contextmenu', function (e) { e.preventDefault(); if (D && D.mode === 'draw') finishCur(); });
    document.addEventListener('keydown', onDrawKey);

    var sw = el('dSwatches');
    COLORS.forEach(function (c) {
      var b = h('button', { type: 'button', class: 'swatch', title: c, style: 'background:' + c });
      b.dataset.color = c;
      b.addEventListener('click', function () { applyStyle('color', c); });
      sw.appendChild(b);
    });
    el('dColor').addEventListener('input', function (e) { applyStyle('color', e.target.value); });
    el('dWidth').addEventListener('change', function (e) { applyStyle('w', Number(e.target.value)); });
    el('dDash').addEventListener('change', function (e) { applyStyle('dash', e.target.checked); });
    el('dHalo').addEventListener('change', function (e) { applyStyle('halo', e.target.checked); });
    el('dMdDraw').addEventListener('click', function () { setMode('draw'); });
    el('dMdEdit').addEventListener('click', function () { setMode('edit'); });
    el('dFinish').addEventListener('click', finishCur);
    el('dUndo').addEventListener('click', undoDraw);
    el('dDelete').addEventListener('click', deleteSelected);
    el('dClear').addEventListener('click', function () {
      if (!confirm('Effacer tous les tracés de cette photo ?')) return;
      D.shapes = []; D.cur = []; D.sel = null; D.dirty = true; renderDraw();
    });
    el('dCancel').addEventListener('click', askClose);
    el('dSave').addEventListener('click', function () {
      if (!D) return;
      finishCur();
      D.photo.shapes = D.shapes;
      D.photo.w = D.W; D.photo.h = D.H;
      closeDraw();
      renderPhotoList();
      refreshSlotUI();
      renderNow();
    });
  }

  function photoBody(chunk, startIndex, perPage) {
    var lay = layoutFor(perPage);
    var grid = h('div', {
      class: 'grid',
      style: 'grid-template-columns:repeat(' + lay.cols + ',minmax(0,1fr));grid-template-rows:repeat(' + lay.rows + ',minmax(0,1fr))'
    });
    chunk.forEach(function (p, i) {
      var n = startIndex + i + 1;
      grid.appendChild(h('div', { class: 'cell' },
        h('div', { class: 'frame' },
          photoNode(p, 'Photo ' + n),
          p.tag ? h('div', { class: 'tag', text: p.tag }) : null),
        h('div', { class: 'cap' + (state.capBold ? ' bold' : '') }, b('Photo ' + n + ' : '), p.caption || '')));
    });
    return [grid];
  }

  /* ------------------------------------------------------------------ */
  /*  Pages propres au DOE VTL                                          */
  /* ------------------------------------------------------------------ */
  function slotBox(img, cls, alt, placeholder) {
    return h('div', { class: 'slot ' + cls },
      img && img.src ? photoNode(img, alt) : h('div', { class: 'empty', text: placeholder }));
  }

  function coverBody() {
    return [
      h('div', { class: 'pill vtl first', text: state.coverTitle }),
      slotBox(state.coverImg, 'thick shadow cover', 'Photo centrée de situation du projet', '(photo centrée de situation du projet)'),
      h('div', { class: 'pill vtl wide', text: state.address })
    ];
  }

  function overviewBody() {
    return [
      h('div', { class: 'pill vtl first', text: state.overviewTitle }),
      slotBox(state.overviewImg, 'thick', 'Vue d’ensemble du site', '(vue d’ensemble du site)')
    ];
  }

  function planBody() {
    return [
      h('div', { class: 'plan-title', text: state.planTitle }),
      slotBox(state.planImg, 'plan shadow', 'Plan de masse', '(plan de masse)')
    ];
  }

  function vsec(t) { return h('div', { class: 'vsec', text: t }); }
  function li(label, value, sub) {
    return h('li', {}, label, value != null ? [' ', b(value)] : null, sub || null);
  }
  function vcell(label, value) { return [label, ' ', b(value)]; }

  function infoBody() {
    var out = [];

    out.push(vsec('Caractéristiques de la liaison :'));
    out.push(h('ul', { class: 'vlist' },
      li('Linéaire de câbles :', state.cableLength),
      li('Linéaire par mode de pose et type / nombre de fourreaux :', null,
        h('ul', { class: 'sub' },
          li('Souterrain :', state.laidUnderground),
          li('Immeuble / CDC :', state.laidBuilding),
          li('Autre :', state.laidOther))),
      li('Types et nombres de chambres :', state.chambers),
      li('Fourniture et pose d’un tube iro ou équivalent fixé (ml) :', state.tubeIro),
      li('Dépose, stockage et remise en place de faux-plancher ou faux-plafond (m²) :', state.falseFloor),
      li('Percement cloison, gaine, plâtre inter palier y compris rebouchage (u) :', state.partition),
      li('Percement mur plein, tubage anti feu + remise mousse/enduit M1 (u) :', state.wall),
      li('Linéaire de pose de gaine :', null,
        h('ul', { class: 'sub' },
          li('anti UV non fendue :', state.sheathUV),
          li('fendue LSOH :', state.sheathLSOH),
          li('anti rongeur (type capri…) :', state.sheathRodent)))));

    out.push(vsec('Modalités d’accès :'));
    out.push(h('table', { class: 'vinfo' },
      h('colgroup', {}, h('col', { style: 'width:31%' }), h('col', { style: 'width:35%' }), h('col', { style: 'width:34%' })),
      h('tr', { style: 'height:14mm' },
        h('td', {}, 'Nom et information de contact :', h('div', { class: 'pre' }, b(state.accessContact))),
        h('td', {},
          vcell('Type d’accès :', state.accessType), h('br'),
          vcell('Type de clés :', state.keyType), h('br'),
          vcell('Code, Badgeuse :', state.accessCode)),
        h('td', {},
          vcell('Sécurisation de chambre :', state.chamberSecurity), h('br'),
          vcell('Nom de la chambre :', state.chamberName), h('br'),
          vcell('Type de sécurisation :', state.securityType)))));

    out.push(vsec('Informations remarquables :'));
    out.push(h('table', { class: 'vinfo' },
      h('colgroup', {}, h('col', { style: 'width:31%' }), h('col', { style: 'width:35%' }), h('col', { style: 'width:34%' })),
      h('tr', { style: 'height:14mm' },
        h('td', {}, 'Coord. Technicien qui a fait la VT et/ou VIC :', h('div', { class: 'pre' }, b(state.technician))),
        h('td', {}, vcell('Typologie du site :', state.siteType), h('br'), h('br'), vcell('Monument historique, ONF, VNF :', state.heritage)),
        h('td', {}, 'Nom du câble CDD ou CAD :', h('div', {}, b(state.cableName))))));

    out.push(vsec('Impact GC :'));
    out.push(h('table', { class: 'vinfo' },
      h('colgroup', {}, h('col', { style: 'width:31%' }), h('col', { style: 'width:69%' })),
      h('tr', { style: 'height:11mm' },
        h('td', {}, vcell('Domaine public :', state.publicDomain)),
        h('td', {}, vcell('Impact gestionnaire (villes concernés, département…) :', state.manager))),
      h('tr', { style: 'height:11mm' },
        h('td', {}, vcell('Domaine privé :', state.privateDomain)),
        h('td', {}, vcell('Numéro(s) de parcelle(s) concernée(s) + nom propriétaires + coordonnées :', state.parcels)))));

    out.push(vsec('Modalités de mise en œuvre / sécurité :'));
    out.push(h('table', { class: 'vinfo' },
      h('colgroup', {}, h('col', { style: 'width:49%' }), h('col', { style: 'width:51%' })),
      h('tr', { style: 'height:11mm' },
        h('td', {}, vcell('Signalisation routière :', state.signage), h('br'), vcell('Intervention DRIRE :', state.drire)),
        h('td', {}, vcell('Circulation alternée :', state.traffic)))));
    return out;
  }


  function render() {
    var preview = document.getElementById('preview');
    var bodies = [coverBody()];
    if (state.showOverview) bodies.push(overviewBody());
    bodies.push(infoBody());
    if (state.showPlan) bodies.push(planBody());

    var per = state.photosPerPage || 6;
    for (var i = 0; i < state.photos.length; i += per) {
      bodies.push(photoBody(state.photos.slice(i, i + per), i, per));
    }

    preview.textContent = '';
    bodies.forEach(function (body, idx) {
      preview.appendChild(makePage(body, idx + 1, bodies.length));
    });
    document.getElementById('pageInfo').textContent = bodies.length + ' pages · ' + state.photos.length + ' photo(s)';
    document.getElementById('photoCount').textContent = state.photos.length;
    document.title = 'DOE_VTL_' + (state.projectCode || 'dossier');
  }

  var renderTimer = null;
  function renderSoon() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 80);
    scheduleSave();
  }
  function renderNow() { clearTimeout(renderTimer); render(); scheduleSave(); }

  /* ------------------------------------------------------------------ */
  /*  Listes de choix (fichier CSV : colonnes « liste;valeur »)         */
  /* ------------------------------------------------------------------ */
  var lists = Object.create(null);
  var currentCsv = '';
  var listControls = [];

  function parseCsv(text) {
    text = String(text || '').replace(/^﻿/, '');
    var firstLine = text.split(/\r?\n/)[0] || '';
    var delim = firstLine.indexOf(';') >= 0 ? ';' : ',';
    var rows = [], row = [], field = '', inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (inQ) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { field += '"'; i++; } else inQ = false;
        } else field += c;
      } else if (c === '"') inQ = true;
      else if (c === delim) { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text.charAt(i + 1) === '\n') i++;
        row.push(field); field = ''; rows.push(row); row = [];
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    var out = Object.create(null);
    rows.forEach(function (r, idx) {
      if (r.length < 2) return;
      var name = r[0].trim(), val = r[1].trim();
      if (!name || !val) return;
      if (idx === 0 && name.toLowerCase() === 'liste') return;
      if (!out[name]) out[name] = [];
      if (out[name].indexOf(val) < 0) out[name].push(val);
    });
    return out;
  }

  function applyCsv(text) {
    var parsed = parseCsv(text);
    if (!Object.keys(parsed).length) return false;
    currentCsv = text;
    lists = parsed;
    return true;
  }

  function loadLists() {
    return dbGet('csv').catch(function () { return null; }).then(function (saved) {
      if (saved) return saved;
      if (location.protocol === 'file:') return EMBEDDED_CSV; /* fetch interdit en file:// */
      return fetch('assets/listes.csv').then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).catch(function () { return EMBEDDED_CSV; });
    }).then(function (text) {
      if (!applyCsv(text)) applyCsv(EMBEDDED_CSV);
    });
  }

  /* Liste déroulante + option « Autre » qui ouvre une saisie libre */
  function createListControl(listName, getValue, setValue, placeholder) {
    var sel = h('select', { class: 'list-select' });
    var txt = h('input', { type: 'text', class: 'list-other', placeholder: placeholder || 'Saisie libre' });
    var wrap = h('div', { class: 'listctl' }, sel, txt);
    function refresh() {
      var v = getValue() || '';
      var items = lists[listName] || [];
      sel.textContent = '';
      sel.appendChild(h('option', { value: '', text: '— Choisir —' }));
      items.forEach(function (it) { sel.appendChild(h('option', { value: it, text: it })); });
      sel.appendChild(h('option', { value: '__other', text: 'Autre (saisie libre)…' }));
      if (v === '') { sel.value = ''; txt.style.display = 'none'; txt.value = ''; }
      else if (items.indexOf(v) >= 0) { sel.value = v; txt.style.display = 'none'; txt.value = ''; }
      else { sel.value = '__other'; txt.value = v; txt.style.display = ''; }
    }
    sel.addEventListener('change', function () {
      if (sel.value === '__other') { txt.style.display = ''; txt.focus(); return; }
      txt.style.display = 'none'; txt.value = '';
      setValue(sel.value);
    });
    txt.addEventListener('input', function () { setValue(txt.value); });
    wrap.refresh = refresh;
    refresh();
    listControls.push(wrap);
    return wrap;
  }

  function refreshListControls() {
    listControls = listControls.filter(function (c) { return document.body.contains(c); });
    listControls.forEach(function (c) { c.refresh(); });
  }

  function setupStaticLists() {
    document.querySelectorAll('[data-key][data-list]').forEach(function (el) {
      var key = el.dataset.key;
      var ctl = createListControl(el.dataset.list,
        function () { return state[key]; },
        function (v) { state[key] = v; renderSoon(); },
        el.getAttribute('placeholder'));
      el.style.display = 'none';
      el.parentNode.insertBefore(ctl, el.nextSibling);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Modèles en mémoire                                                */
  /* ------------------------------------------------------------------ */
  var models = [];
  /* Champs propres à un chantier : jamais enregistrés dans un modèle, jamais écrasés par un modèle. */
  var MODEL_EXCLUDE = ['photos', 'coverImg', 'overviewImg', 'planImg', 'projectCode', 'headerCode', 'address', 'date', 'cableName'];

  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function modelHaystack(m) {
    var parts = [m.name];
    Object.keys(m.data).forEach(function (k) {
      var v = m.data[k];
      if (typeof v === 'string' && v.indexOf('data:') !== 0) parts.push(v);
    });
    return norm(parts.join(' '));
  }

  function persistModels() {
    dbSet('models', models).catch(function () { setStatus('Enregistrement des modèles impossible dans ce navigateur : utilisez l’export.'); });
  }

  function snapshotModelData() {
    var d = JSON.parse(JSON.stringify(state));
    MODEL_EXCLUDE.forEach(function (k) { delete d[k]; });
    return d;
  }

  function applyModel(m) {
    var keep = {};
    MODEL_EXCLUDE.forEach(function (k) { keep[k] = state[k]; });
    state = Object.assign(blankState(), JSON.parse(JSON.stringify(m.data)), keep);
    fillForm();
    renderNow();
    setStatus('Modèle « ' + m.name + ' » appliqué.');
  }

  function renderModelList() {
    var box = document.getElementById('modelList');
    document.getElementById('modelCount').textContent = models.length;
    var words =norm(document.getElementById('modelSearch').value).split(/\s+/).filter(Boolean);
    box.textContent = '';
    var shown = models.filter(function (m) {
      var hay = modelHaystack(m);
      return words.every(function (w) { return hay.indexOf(w) >= 0; });
    });
    if (!shown.length) {
      box.appendChild(h('p', { class: 'hint', text: models.length ? 'Aucun modèle ne correspond à la recherche.' : 'Aucun modèle enregistré pour le moment.' }));
      return;
    }
    shown.forEach(function (m) {
      var sub = [m.data.siteType, m.data.accessType].filter(Boolean).join(' · ');
      var apply = h('button', { type: 'button', class: 'model-apply', title: 'Appliquer ce modèle au formulaire' },
        h('b', { text: m.name }), sub ? h('span', { text: sub }) : null);
      apply.addEventListener('click', function () { applyModel(m); });
      var upd = h('button', { type: 'button', class: 'icon', text: '↻', title: 'Mettre à jour ce modèle avec le formulaire actuel' });
      upd.addEventListener('click', function () {
        if (!confirm('Remplacer le contenu du modèle « ' + m.name + ' » par le formulaire actuel ?')) return;
        m.data = snapshotModelData(); persistModels(); renderModelList(); setStatus('Modèle « ' + m.name + ' » mis à jour.');
      });
      var del = h('button', { type: 'button', class: 'icon danger', text: '✕', title: 'Supprimer ce modèle' });
      del.addEventListener('click', function () {
        if (!confirm('Supprimer le modèle « ' + m.name + ' » ?')) return;
        models = models.filter(function (x) { return x !== m; }); persistModels(); renderModelList();
      });
      box.appendChild(h('div', { class: 'model-item' }, apply, upd, del));
    });
  }

  function saveModel() {
    var input = document.getElementById('modelName');
    var name = input.value.trim();
    if (!name) { alert('Donnez un nom au modèle.'); input.focus(); return; }
    var existing = models.filter(function (m) { return norm(m.name) === norm(name); })[0];
    if (existing) {
      if (!confirm('Un modèle « ' + existing.name + ' » existe déjà. Le remplacer ?')) return;
      existing.data = snapshotModelData();
    } else {
      models.push({ id: uid(), name: name, data: snapshotModelData() });
      models.sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); });
    }
    input.value = '';
    persistModels(); renderModelList();
    setStatus('Modèle « ' + name + ' » enregistré.');
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function readText(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsText(file);
    });
  }

  function bindListsAndModels() {
    document.getElementById('modelSearch').addEventListener('input', renderModelList);
    on('btnSaveModel', saveModel);
    document.getElementById('modelName').addEventListener('keydown', function (e) { if (e.key === 'Enter') saveModel(); });
    on('btnExportModels', function () { download('modeles_DOE_VTL.json', JSON.stringify(models), 'application/json'); });
    on('btnImportModels', function () { document.getElementById('fileModels').click(); });
    document.getElementById('fileModels').addEventListener('change', function (e) {
      var f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      readText(f).then(function (t) {
        var arr = JSON.parse(t);
        if (!Array.isArray(arr)) throw new Error('Format invalide');
        var n = 0;
        arr.forEach(function (m) {
          if (!m || typeof m.name !== 'string' || typeof m.data !== 'object' || !m.data) return;
          models = models.filter(function (x) { return norm(x.name) !== norm(m.name); });
          models.push({ id: m.id || uid(), name: m.name, data: m.data });
          n++;
        });
        models.sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); });
        persistModels(); renderModelList();
        setStatus(n + ' modèle(s) importé(s).');
      }).catch(function (err) { alert('Import impossible : ' + err.message); });
    });

    on('btnExportCsv', function () { download('listes.csv', '﻿' + currentCsv, 'text/csv;charset=utf-8'); });
    on('btnImportCsv', function () { document.getElementById('fileCsv').click(); });
    document.getElementById('fileCsv').addEventListener('change', function (e) {
      var f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      readText(f).then(function (t) {
        if (!applyCsv(t)) throw new Error('aucune ligne « liste;valeur » trouvée');
        dbSet('csv', t).catch(function () {});
        refreshListControls(); refreshSuggest();
        setStatus('Listes de choix importées (' + Object.keys(lists).length + ' listes).');
      }).catch(function (err) { alert('Import impossible : ' + err.message); });
    });
    on('btnResetCsv', function () {
      if (!confirm('Rétablir les listes de choix d’origine ?')) return;
      dbSet('csv', null).catch(function () {}).then(loadLists).then(function () {
        refreshListControls(); refreshSuggest(); setStatus('Listes de choix d’origine rétablies.');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Formulaire                                                        */
  /* ------------------------------------------------------------------ */
  function fillForm() {
    document.querySelectorAll('[data-key]').forEach(function (el) {
      if (el.dataset.list) return;
      var v = state[el.dataset.key];
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v == null ? '' : v;
    });
    renderPhotoList();
    refreshSlotUI();
    refreshListControls();
    refreshSuggest();
  }

  function bindForm() {
    document.querySelectorAll('[data-key]').forEach(function (el) {
      if (el.dataset.list) return;
      var evt = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
      el.addEventListener(evt, function () {
        var key = el.dataset.key;
        if (el.type === 'checkbox') state[key] = el.checked;
        else if ('number' in el.dataset) state[key] = Number(el.value);
        else {
          if (key === 'projectCode' && state.headerCode === codeToHeader(state.projectCode)) {
            state.headerCode = codeToHeader(el.value);
            document.querySelector('[data-key="headerCode"]').value = state.headerCode;
          }
          state[key] = el.value;
        }
        (evt === 'change') ? renderNow() : renderSoon();
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Suggestions (champs texte libres avec propositions : RAS, SO…)     */
  /* ------------------------------------------------------------------ */
  function setupSuggest() {
    document.querySelectorAll('input[data-suggest]').forEach(function (inp) {
      var id = 'dl-' + inp.dataset.suggest;
      if (!document.getElementById(id)) {
        var dl = document.createElement('datalist');
        dl.id = id;
        document.body.appendChild(dl);
      }
      inp.setAttribute('list', id);
    });
    refreshSuggest();
  }
  function refreshSuggest() {
    document.querySelectorAll('datalist[id^="dl-"]').forEach(function (dl) {
      dl.textContent = '';
      (lists[dl.id.slice(3)] || []).forEach(function (v) { dl.appendChild(h('option', { value: v })); });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Images d'emplacement (couverture, vue d'ensemble, plan de masse)   */
  /* ------------------------------------------------------------------ */
  function refreshSlotUI() {
    document.querySelectorAll('[data-slot]').forEach(function (box) {
      var img = state[box.dataset.slot];
      var n = img && img.shapes ? img.shapes.length : 0;
      box.querySelector('.slot-info').textContent = img && img.src
        ? 'Image chargée' + (n ? ' · ' + n + ' tracé' + (n > 1 ? 's' : '') : '')
        : 'Aucune image';
      box.querySelector('.slot-draw').disabled = !(img && img.src);
      box.querySelector('.slot-clear').disabled = !(img && img.src);
    });
  }

  function bindSlots() {
    document.querySelectorAll('[data-slot]').forEach(function (box) {
      var key = box.dataset.slot;
      box.querySelector('.slot-file').addEventListener('change', function (e) {
        var f = e.target.files[0]; e.target.value = '';
        if (!f) return;
        readImage(f, 2000, 0.88).then(function (r) {
          state[key] = { src: r.src, w: r.w, h: r.h, shapes: [] };
          refreshSlotUI(); renderNow();
        }).catch(function (err) { alert(err.message); });
      });
      box.querySelector('.slot-draw').addEventListener('click', function () {
        if (state[key] && state[key].src) openDraw(state[key], 'Tracés — ' + (box.dataset.label || 'image'));
      });
      box.querySelector('.slot-clear').addEventListener('click', function () {
        state[key] = null; refreshSlotUI(); renderNow();
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Classement des photos par « Photo 1 », « Photo 2 »…                */
  /* ------------------------------------------------------------------ */
  var IMG_EXT = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;
  function isImageFile(f) { return /^image\//.test(f.type || '') || IMG_EXT.test(f.name || ''); }
  function naturalCmp(a, b) { return String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' }); }

  var STRICT_NUM = /photo[\s_\-.]*(?:n[°o]?\s*)?0*(\d+)(?!\d)/i;
  var CAMERA_NAME = /^(img|dsc|dscn|dscf|pxl|mvimg|gopr|pict|p)[_\-\s]*\d/i;

  function cleanCaption(s) {
    return String(s || '').replace(/^[\s_\-.:)–—]+/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* file : { name, webkitRelativePath } → { num (ou null), caption, path } */
  function classify(file) {
    var path = file.webkitRelativePath || file.path || file.name || '';
    var segs = path.split('/');
    var base = (file.name || segs[segs.length - 1] || '').replace(/\.[^.]+$/, '');
    var num = null, caption = '';

    /* 1) « Photo N » dans le nom du fichier, puis dans les dossiers (du plus proche au plus éloigné) */
    for (var i = segs.length - 1; i >= 0 && num === null; i--) {
      var seg = i === segs.length - 1 ? base : segs[i];
      var m = STRICT_NUM.exec(seg);
      if (m) {
        num = parseInt(m[1], 10);
        if (i === segs.length - 1) caption = cleanCaption(seg.slice(m.index + m[0].length));
        else if (!CAMERA_NAME.test(base) && !/^\d+$/.test(base)) caption = cleanCaption(base);
      }
    }
    /* 2) à défaut : nom du fichier commençant par un nombre (« 3 - Vue… », « 03_chambre ») */
    if (num === null) {
      var m2 = /^\s*0*(\d+)(?!\d)[\s_\-.:)]*(.*)$/.exec(base);
      if (m2 && !CAMERA_NAME.test(base)) { num = parseInt(m2[1], 10); caption = cleanCaption(m2[2]); }
    }
    return { num: num, caption: caption, path: path };
  }

  function compareClassified(a, b) {
    var an = a.c.num, bn = b.c.num;
    if (an !== null && bn !== null && an !== bn) return an - bn;
    if (an !== null && bn === null) return -1;
    if (an === null && bn !== null) return 1;
    return naturalCmp(a.c.path, b.c.path);
  }

  function sortPhotosByName() {
    var withName = state.photos.filter(function (p) { return p.name || p.path; });
    if (withName.length < 2) { setStatus('Rien à trier : les photos n’ont pas de nom de fichier.'); return; }
    var wrapped = state.photos.map(function (p, i) { return { p: p, i: i, c: classify({ name: p.name, path: p.path }) }; });
    wrapped.sort(function (a, b) { return compareClassified(a, b) || (a.i - b.i); });
    state.photos = wrapped.map(function (w) { return w.p; });
    renderPhotoList(); renderNow();
    setStatus('Photos triées par numéro puis par nom de fichier.');
  }

  function importPhotoFiles(fileList) {
    var all = Array.prototype.slice.call(fileList);
    var files = all.filter(isImageFile);
    if (!files.length) { alert('Aucune image trouvée dans la sélection.'); return Promise.resolve(); }
    var replace = document.getElementById('importMode').value === 'replace';
    var useCaption = document.getElementById('importCaption').checked;
    if (replace && state.photos.length &&
        !confirm('Remplacer les ' + state.photos.length + ' photo(s) actuelle(s) par les ' + files.length + ' photo(s) importée(s) ?')) {
      return Promise.resolve();
    }
    var items = files.map(function (f, i) { return { f: f, i: i, c: classify(f) }; });
    items.sort(function (a, b) { return compareClassified(a, b) || (a.i - b.i); });

    var added = [], failed = [];
    function next(k) {
      if (k >= items.length) return Promise.resolve();
      setStatus('Import des photos ' + (k + 1) + '/' + items.length + '…');
      var it = items[k];
      return readImage(it.f, 1600, 0.82).then(function (r) {
        added.push({
          id: uid(), src: r.src, w: r.w, h: r.h, name: it.f.name, path: it.c.path,
          caption: useCaption ? it.c.caption : '', tag: '', shapes: []
        });
      }).catch(function () { failed.push(it.f.name); }).then(function () { return next(k + 1); });
    }
    return next(0).then(function () {
      state.photos = replace ? added : state.photos.concat(added);
      renderPhotoList(); renderNow();
      var msg = added.length + ' photo(s) importée(s) et classée(s)';
      if (all.length - files.length) msg += ' · ' + (all.length - files.length) + ' fichier(s) ignoré(s) (pas des images)';
      if (failed.length) { msg += ' · illisible(s) : ' + failed.join(', '); alert('Photos illisibles (format non pris en charge) :\n' + failed.join('\n')); }
      setStatus(msg + '.');
    });
  }

  /* --- Liste des photos --- */
  function movePhoto(from, to) {
    var n = state.photos.length;
    to = Math.max(0, Math.min(n - 1, to));
    if (from === to) { renderPhotoList(); return; }
    var p = state.photos.splice(from, 1)[0];
    state.photos.splice(to, 0, p);
    renderPhotoList(); renderNow();
  }

  function renderPhotoList() {
    var box = document.getElementById('photoList');
    box.textContent = '';
    var n = state.photos.length;
    state.photos.forEach(function (p, i) {
      var cap = h('textarea', { rows: '2', placeholder: 'Légende de la photo' });
      cap.value = p.caption || '';
      cap.addEventListener('input', function () { p.caption = cap.value; renderSoon(); });
      var tag = h('input', { type: 'text', placeholder: 'Étiquette jaune sur la photo (optionnel)' });
      tag.value = p.tag || '';
      tag.addEventListener('input', function () { p.tag = tag.value; renderSoon(); });

      function btn(label, title, fn, disabled) {
        var bt = h('button', { type: 'button', text: label, title: title });
        if (disabled) bt.disabled = true;
        bt.addEventListener('click', fn);
        return bt;
      }
      var pos = h('input', { type: 'number', min: '1', max: String(n), class: 'pos', title: 'Position dans le dossier (classement)' });
      pos.value = String(i + 1);
      pos.addEventListener('change', function () { movePhoto(i, (parseInt(pos.value, 10) || (i + 1)) - 1); });

      var handle = h('span', { class: 'handle', draggable: 'true', title: 'Glisser pour réordonner', text: '⠿' });
      var item = h('div', { class: 'photo-item' },
        h('img', { src: p.src, alt: '' }),
        h('div', { class: 'body' },
          h('div', { class: 'num' }, handle, 'Photo ', pos,
            (p.shapes && p.shapes.length) ? h('span', { class: 'badge', text: p.shapes.length + ' tracé' + (p.shapes.length > 1 ? 's' : '') }) : null),
          p.name ? h('div', { class: 'fname', text: p.name, title: p.path || p.name }) : null,
          cap, tag,
          h('div', { class: 'actions' },
            btn('↑', 'Monter', function () { movePhoto(i, i - 1); }, i === 0),
            btn('↓', 'Descendre', function () { movePhoto(i, i + 1); }, i === n - 1),
            btn('Supprimer', 'Supprimer la photo', function () {
              state.photos.splice(i, 1); renderPhotoList(); renderNow();
            }),
            (function () {
              var d = btn('✎ Tracer', 'Dessiner des polylignes sur cette photo', function () { openDraw(p); });
              d.className = 'draw-btn';
              return d;
            })())));

      /* glisser-déposer */
      handle.addEventListener('dragstart', function (e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'photo:' + i);
        try { e.dataTransfer.setDragImage(item, 10, 10); } catch (err) { /* ignore */ }
        item.classList.add('dragging');
      });
      handle.addEventListener('dragend', function () { item.classList.remove('dragging'); });
      item.addEventListener('dragover', function (e) {
        if (!(e.dataTransfer.types || []).length) return;
        e.preventDefault(); item.classList.add('over');
      });
      item.addEventListener('dragleave', function () { item.classList.remove('over'); });
      item.addEventListener('drop', function (e) {
        e.preventDefault(); item.classList.remove('over');
        var m = /^photo:(\d+)$/.exec(e.dataTransfer.getData('text/plain') || '');
        if (m) movePhoto(Number(m[1]), i);
      });
      box.appendChild(item);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Actions                                                           */
  /* ------------------------------------------------------------------ */
  function bindFile(id, handler, opts) {
    document.getElementById(id).addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      e.target.value = '';
      if (!files.length) return;
      Promise.all(files.map(function (f) { return readImage(f, opts.max, opts.q); }))
        .then(function (res) { handler(res); renderNow(); })
        .catch(function (err) { alert(err.message); });
    });
  }

  function bindActions() {
    bindFile('logoLeftFile', function (r) { state.logoLeft = r[0].src; }, { max: 600, q: 0.9 });
    bindFile('logoRightFile', function (r) { state.logoRight = r[0].src; }, { max: 600, q: 0.9 });
    on('btnResetLogos', function () { state.logoLeft = ''; state.logoRight = ''; renderNow(); });

    on('btnImportFolder', function () { document.getElementById('folderInput').click(); });
    on('btnImportFiles', function () { document.getElementById('photoFiles').click(); });
    ['folderInput', 'photoFiles'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function (e) {
        var files = Array.prototype.slice.call(e.target.files);
        e.target.value = '';
        if (files.length) importPhotoFiles(files);
      });
    });
    on('btnSortNames', sortPhotosByName);
    on('btnClearPhotos', function () {
      if (!state.photos.length || !confirm('Supprimer les ' + state.photos.length + ' photos du dossier ?')) return;
      state.photos = []; renderPhotoList(); renderNow();
    });

    on('btnPrint', function () { render(); window.print(); });

    on('btnExport', function () {
      download('DOE_VTL_' + (state.projectCode || 'dossier') + '.json', JSON.stringify(state), 'application/json');
    });
    on('btnImport', function () { document.getElementById('fileImport').click(); });
    document.getElementById('fileImport').addEventListener('change', function (e) {
      var f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      readText(f).then(function (t) {
        var data = JSON.parse(t);
        if (typeof data !== 'object' || data === null || !Array.isArray(data.photos)) throw new Error('Format invalide');
        state = Object.assign(blankState(), data);
        fillForm(); renderNow();
      }).catch(function (err) { alert('Import impossible : ' + err.message); });
    });
    on('btnNew', function () {
      if (!confirm('Créer un dossier vierge ? Les données actuelles seront effacées (pensez à les exporter).')) return;
      state = blankState();
      fillForm(); renderNow();
    });

    var zoom = document.getElementById('zoom');
    zoom.addEventListener('input', function () { applyZoom(zoom.value); });
  }
  function on(id, fn) { document.getElementById(id).addEventListener('click', fn); }

  function applyZoom(v) {
    document.getElementById('preview').style.zoom = String(v / 100);
  }
  function fitZoom() {
    var wrap = document.querySelector('.preview-wrap');
    var pageW = 210 / 25.4 * 96;
    var z = Math.max(40, Math.min(100, Math.floor(((wrap.clientWidth - 50) / pageW) * 100)));
    document.getElementById('zoom').value = z;
    applyZoom(z);
  }

  /* ------------------------------------------------------------------ */
  /*  Démarrage                                                         */
  /* ------------------------------------------------------------------ */
  function start() {
    setupStaticLists();
    setupSuggest();
    bindForm();
    bindActions();
    bindSlots();
    bindListsAndModels();
    bindDraw();
    fillForm();
    renderModelList();
    fitZoom();
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    Promise.all([
      dbGet(KEY).catch(function () { return null; }),
      dbGet('models').catch(function () { return null; }),
      loadLists()
    ]).then(function (r) {
      if (r[0] && Array.isArray(r[0].photos)) state = Object.assign(blankState(), r[0]);
      if (Array.isArray(r[1])) models = r[1];
      start();
    });
  });
})();
