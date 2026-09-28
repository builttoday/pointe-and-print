/* "Design your own" (v2).
   Garment + colour, then any number of text, graphic and uploaded-image layers on
   the front, back and sleeves. Text is drawn to a canvas so curved text, outlines,
   letter spacing, shadows and metallic inks look the same on screen, in the
   basket picture and in the order. Nothing is uploaded until an order is sent. */
(function(){
  const VB_W = 240, VB_H = 260, PX = 8;       // drawing units; canvas pixels per unit for text
  const FONTS = [
    ['Jost', 'Clean', 500], ['Montserrat', 'Bold', 800], ['Bebas Neue', 'Varsity', 400], ['Anton', 'Impact', 400],
    ['Oswald', 'Athletic', 600], ['Righteous', 'Retro', 400], ['Permanent Marker', 'Marker', 400], ['Abril Fatface', 'Poster', 400],
    ['Playfair Display', 'Elegant', 700], ['Pacifico', 'Script', 400], ['Lobster', 'Bold script', 400], ['Dancing Script', 'Handwritten', 700],
    ['Great Vibes', 'Fancy', 400], ['Satisfy', 'Signature', 400],
  ].map(([id, label, weight]) => ({ id, label, weight, css: `'${id}', Arial, sans-serif` }));
  const INKS = [
    ['White', '#ffffff'], ['Black', '#141414'], ['Hot pink', '#e0457b'], ['Baby pink', '#f5c9d6'], ['Neon pink', '#ff3d9a'],
    ['Lilac', '#b9a8e0'], ['Purple', '#6b2d8e'], ['Navy', '#1f2a56'], ['Royal blue', '#2447a8'], ['Sky blue', '#8fc7e8'],
    ['Teal', '#1f8a8a'], ['Neon green', '#39e75f'], ['Red', '#c62828'], ['Orange', '#ef7d22'], ['Yellow', '#f7c948'],
    ['Gold (metallic)', '#c9a227', 1], ['Silver (metallic)', '#bfc3c8', 1], ['Rose gold (metallic)', '#d7a08c', 1],
  ].map(([name, hex, metal]) => ({ name, hex, metal: !!metal }));
  const METHODS = [
    ['print', 'Print', 'Bright, full-colour logos and big back designs'],
    ['emb', 'Embroidery', 'A premium stitched finish for smaller logos'],
  ];
  const SLEEVED = { hoodie: 'long', zoodie: 'long', cropHoodie: 'long', cropZoodie: 'long', cropSweat: 'long', trackJacket: 'long', tee: 'short' };
  const SIDE_LABEL = { front: 'Front', back: 'Back', left: 'Left sleeve', right: 'Right sleeve' };

  /* one-click positions (drawing units, inside the print area) */
  const P = (label, x, y, w, h) => ({ label, box: [x, y, w, h] });
  const HOOD_BACK = [P('Back neck', 104, 82, 32, 12), P('Across shoulders', 80, 90, 80, 26), P('Full back', 76, 92, 88, 120)];
  const PRESETS = {
    hoodie: { front: [P('Left chest', 134, 108, 26, 20), P('Right chest', 80, 108, 26, 20), P('Centre chest', 90, 110, 60, 34), P('Full front', 78, 106, 84, 84)], back: HOOD_BACK },
    cropHoodie: { front: [P('Left chest', 134, 108, 26, 20), P('Right chest', 80, 108, 26, 20), P('Centre chest', 90, 110, 60, 32), P('Full front', 78, 106, 84, 68)], back: [P('Back neck', 104, 82, 32, 12), P('Across shoulders', 80, 90, 80, 24), P('Full back', 76, 92, 88, 84)] },
    zoodie: { front: [P('Left chest', 132, 108, 32, 22), P('Right chest', 76, 108, 32, 22)], back: HOOD_BACK },
    cropZoodie: { front: [P('Left chest', 132, 108, 32, 22), P('Right chest', 76, 108, 32, 22)], back: [P('Back neck', 104, 82, 32, 12), P('Across shoulders', 80, 90, 80, 24), P('Full back', 76, 92, 88, 84)] },
    trackJacket: { front: [P('Left chest', 132, 80, 32, 22), P('Right chest', 76, 80, 32, 22)], back: [P('Back neck', 104, 68, 32, 12), P('Across shoulders', 80, 78, 80, 26), P('Full back', 76, 80, 88, 130)] },
    cropSweat: { front: [P('Centre chest', 90, 118, 60, 30), P('Full front', 76, 118, 88, 58)], back: [P('Back neck', 104, 72, 32, 12), P('Across shoulders', 80, 80, 80, 24), P('Full back', 76, 82, 88, 94)] },
    tee: { front: [P('Left chest', 132, 78, 28, 22), P('Centre chest', 90, 80, 60, 40), P('Full front', 80, 76, 80, 120)], back: [P('Back neck', 104, 66, 32, 12), P('Across shoulders', 80, 74, 80, 24), P('Full back', 80, 72, 80, 140)] },
    cropTop: { front: [P('Centre', 92, 92, 56, 30), P('Full front', 80, 88, 80, 56)], back: [P('Centre', 92, 90, 56, 30), P('Full back', 80, 84, 80, 60)] },
    sportsBra: { front: [P('Centre', 90, 100, 60, 28)], back: [P('Band', 74, 134, 92, 14), P('Centre', 84, 102, 72, 28)] },
    leggings: { front: [P('Left hip', 124, 58, 38, 26), P('Right hip', 78, 58, 38, 26)], back: [P('Waistband', 80, 36, 80, 14), P('Seat', 80, 56, 80, 40)] },
    joggers: { front: [P('Left thigh', 128, 70, 40, 30), P('Right thigh', 72, 70, 40, 30)], back: [P('Waistband', 80, 56, 80, 18), P('Seat', 76, 76, 88, 40)] },
    bag: { front: [P('Centre', 70, 104, 100, 64), P('Full front', 56, 80, 128, 140)], back: [P('Centre', 70, 104, 100, 64), P('Full back', 56, 80, 128, 140)] },
  };
  const SLEEVE_AREA = { long: [102, 46, 36, 160], short: [98, 44, 44, 54] };
  const SLEEVE_PRESETS = { long: [P('Upper arm', 104, 50, 32, 40), P('Down the sleeve', 106, 50, 28, 150)], short: [P('Sleeve', 100, 48, 40, 34)] };

  const TEMPLATES = [
    { id: 'team', label: 'Team name & year', make: () => [
      T('front', 'STARLIGHT', { font: 2, size: 15, arc: 35, ink: 1 }, 'Centre chest', -8), T('front', 'DANCE ACADEMY · 2027', { font: 0, size: 6, spacing: 20 }, 'Centre chest', 12)] },
    { id: 'nameback', label: 'Name on the back', make: () => [
      T('back', 'YOUR NAME', { font: 2, size: 16, spacing: 8, outline: 2, outlineInk: 1 }, 'Across shoulders'), A('back', 'star', 16, 'Back neck')] },
    { id: 'comp', label: 'Competition squad', make: () => [
      A('front', 'sparkle', 14, 'Left chest', 0), T('back', 'COMPETITION TEAM', { font: 4, size: 10, arc: 25, spacing: 10 }, 'Full back', -24),
      T('back', '2027', { font: 2, size: 26, ink: 15 }, 'Full back', 12)] },
    { id: 'mum', label: 'Dance mum', make: () => [T('front', 'Dance Mum', { font: 9, size: 16 }, 'Centre chest', -4), A('front', 'heart', 10, 'Centre chest', 16)] },
    { id: 'ballet', label: 'Ballet school', make: () => [A('front', 'dancer-crown', 22, 'Centre chest', -6), T('front', 'Ballet School', { font: 8, size: 9 }, 'Centre chest', 22)] },
    { id: 'initials', label: 'Initials on the chest', make: () => [T('front', 'E.M.', { font: 12, size: 12, ink: 15 }, 'Left chest')] },
  ];
  function T(side, text, o, place, dy){ return { side, type: 'text', text, font: 0, size: 12, bold: false, italic: false, upper: false, spacing: 0, arc: 0, ink: 1, outline: 0, outlineInk: 0, shadow: false, ...o, _place: place, _dy: dy || 0 }; }
  function A(side, art, w, place, dy){ return { side, type: 'art', art, w, ink: 2, _place: place, _dy: dy || 0 }; }

  const assets = {};                     // uploaded images, in memory for this visit: id -> { dataURL, clean, name, file }
  const bitmaps = {};                    // rendered text/graphic bitmaps, by content key
  let D = null, uid = 0, dragging = false;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shapeKey = () => designShape(D.p.shape);
  const sidesFor = () => ['front', 'back'].concat(SLEEVED[shapeKey()] ? ['left', 'right'] : []);
  const areaOf = side => (side === 'left' || side === 'right') ? SLEEVE_AREA[SLEEVED[shapeKey()]] : PRINT_AREAS[shapeKey()][side];
  const presetsOf = side => (side === 'left' || side === 'right') ? SLEEVE_PRESETS[SLEEVED[shapeKey()]] : ((PRESETS[shapeKey()] || {})[side] || []);
  const sel = () => D.layers.find(L => L.id === D.sel);
  function contrastInk(){ const h = D.p.colours[D.colour].hex, n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.55 ? 1 : 0; }

  /* ---------- drawing the garment (incl. sleeve views) ---------- */
  function sleeveSVG(kind, hex, accent, mirror){
    const S = 'stroke="#1a1a1a" stroke-width="2.2" stroke-linejoin="round"';
    const cuff = accent || shadeHex(hex, -0.18);
    const body = kind === 'long'
      ? `<path d="M90 24 Q120 14 150 24 L142 212 L98 212 Z" fill="${hex}" ${S}/><path d="M98 212 L142 212 L143 240 L97 240 Z" fill="${cuff}" ${S}/><path d="M92 40 Q120 30 148 40" fill="none" stroke="#1a1a1a" stroke-width="1.2" stroke-dasharray="3 3"/>`
      : `<path d="M82 34 Q120 20 158 34 L150 112 L90 112 Z" fill="${hex}" ${S}/><path d="M90 104 L150 104" fill="none" ${S}/>`;
    return `<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg"><g${mirror ? ' transform="translate(240 0) scale(-1 1)"' : ''}>${body}</g></svg>`;
  }
  function shadeHex(hex, amt){ const n = parseInt(hex.slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v + amt * v)))).map(v => v.toString(16).padStart(2, '0')).join(''); }
  function garmentFor(side, c){
    if(side === 'left' || side === 'right') return sleeveSVG(SLEEVED[shapeKey()], c.hex, c.accent, side === 'right');
    return garmentSVG(shapeKey(), c.hex, { accent: c.accent, plain: true, back: side === 'back', label: D.p.name });
  }

  /* ---------- bitmaps for text and graphics ---------- */
  function inkOf(i){ return typeof i === 'string' ? { name: 'Custom ' + i, hex: i, metal: false } : INKS[i]; }
  function paint(ctx, ink, x0, y0, x1, y1){
    if(!ink.metal) return ink.hex;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, ink.hex);
    g.addColorStop(0.5, shadeHex(ink.hex, -0.35)); g.addColorStop(0.72, ink.hex); g.addColorStop(1, '#fff7e0');
    return g;
  }
  const fontStr = (L, px) => `${L.italic ? 'italic ' : ''}${L.bold ? 800 : FONTS[L.font].weight} ${px}px ${FONTS[L.font].css}`;
  async function textBitmap(L){
    const key = 'T' + JSON.stringify([L.text, L.font, L.size, L.bold, L.italic, L.upper, L.spacing, L.arc, L.ink, L.outline, L.outlineInk, L.shadow]);
    if(bitmaps[key]) return bitmaps[key];
    const fpx = L.size * PX;
    try { await document.fonts.load(fontStr(L, 40), L.text); } catch(e){}
    const fontReady = document.fonts.check(fontStr(L, 40), L.text);
    const m = document.createElement('canvas').getContext('2d'); m.font = fontStr(L, fpx);
    const chars = [...(L.upper ? L.text.toUpperCase() : L.text)], gap = L.spacing / 100 * fpx;
    const ws = chars.map(ch => m.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0) + gap * Math.max(0, chars.length - 1);
    // where each character sits: along a straight line, or along an arc
    const theta = Math.abs(L.arc) / 100 * Math.PI, R = theta > 0.01 ? total / theta : 0, pos = [];
    let run = -total / 2;
    chars.forEach((ch, i) => {
      const t = run + ws[i] / 2; run += ws[i] + gap;
      if(!R) pos.push([t, 0, 0]);
      else { const a = t / R; pos.push(L.arc > 0 ? [R * Math.sin(a), -R * Math.cos(a) + R, a] : [R * Math.sin(a), R * Math.cos(a) - R, -a]); }
    });
    const ow = L.outline * fpx / 18, pad = fpx * 0.75 + ow + (L.shadow ? fpx * 0.1 : 0) + 4;
    const xs = pos.map(p => p[0]), ys = pos.map(p => p[1]);
    const minX = Math.min(...xs) - pad - Math.max(...ws) / 2, maxX = Math.max(...xs) + pad + Math.max(...ws) / 2;
    const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
    const cv = document.createElement('canvas'); cv.width = Math.max(4, Math.ceil(maxX - minX)); cv.height = Math.max(4, Math.ceil(maxY - minY));
    const ctx = cv.getContext('2d'); ctx.font = fontStr(L, fpx); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const ink = inkOf(L.ink), oink = inkOf(L.outlineInk);
    const each = fn => chars.forEach((ch, i) => { ctx.save(); ctx.translate(pos[i][0] - minX, pos[i][1] - minY); ctx.rotate(pos[i][2]); fn(ch); ctx.restore(); });
    if(L.shadow){ ctx.fillStyle = 'rgba(0,0,0,.35)'; each(ch => ctx.fillText(ch, fpx * 0.07, fpx * 0.07)); }
    if(ow > 0){ ctx.strokeStyle = oink.hex; ctx.lineWidth = ow * 2; each(ch => ctx.strokeText(ch, 0, 0)); }
    each(ch => { ctx.fillStyle = paint(ctx, ink, 0, -fpx / 2, 0, fpx / 2); ctx.fillText(ch, 0, 0); });
    const out = { canvas: cv, url: cv.toDataURL(), w: cv.width / PX, h: cv.height / PX };
    if(fontReady){ const ks = Object.keys(bitmaps); if(ks.length > 300) ks.slice(0, 150).forEach(k => delete bitmaps[k]); bitmaps[key] = out; }
    return out;
  }
  function artSVG(a, ink, w, h){
    const grad = ink.metal ? `<defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="${ink.hex}"/><stop offset=".55" stop-color="${shadeHex(ink.hex, -0.35)}"/><stop offset=".8" stop-color="${ink.hex}"/><stop offset="1" stop-color="#fff7e0"/></linearGradient></defs>` : '';
    const fill = ink.metal ? 'url(#m)' : ink.hex;
    const body = a.shapes.map(s => s.d ? `<path d="${s.d}"/>` : s.points ? `<polygon points="${s.points}"/>` : `<circle cx="${s.circle[0]}" cy="${s.circle[1]}" r="${s.circle[2]}"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${a.vb.join(' ')}"${w ? ` width="${w}" height="${h}"` : ''}>${grad}<g fill="${fill}">${body}</g></svg>`;
  }
  async function bitmapOf(L){
    if(L.type === 'text') return textBitmap(L);
    if(L.type === 'art'){
      const a = (window.DESIGN_ART || []).find(x => x.id === L.art); const ink = inkOf(L.ink);
      const key = 'A' + L.art + JSON.stringify(ink); if(bitmaps[key]) return bitmaps[key];
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(artSVG(a, ink));
      return (bitmaps[key] = { url, ratio: a.vb[3] / a.vb[2], art: a, ink });
    }
    const as = assets[L.asset]; return { url: L.clean && as.clean ? as.clean : as.dataURL, ratio: as.ratio };
  }
  /* size of a layer in drawing units */
  function dims(L, b){
    if(L.type === 'text') return [b.w, b.h];
    return [L.w, L.w * b.ratio];
  }

  /* ---------- view ---------- */
  window.designView = function(code){
    const list = (window.PRODUCTS || []).filter(p => PRINT_AREAS[designShape(p.shape)]);
    const p = list.find(x => x.code === code) || list.find(x => x.code === 'JH001') || list[0];
    D = { p, colour: 0, side: 'front', layers: [], sel: null, sizes: {}, method: 'print', names: { on: false, text: '' }, hist: [], fut: [], tab: 'text', ink: 1, font: 2 };
    const art = window.DESIGN_ART || [];
    return `<div class="page-head"><div class="wrap"><h1>Design your own</h1><p>Add text, graphics and your logo to the front, back and sleeves, then drag them into place.</p></div></div>
    <div class="wrap designer">
      <div class="d-stage-col">
        <div class="side-tabs" id="dSides"></div>
        <div class="d-stage" id="dStage" tabindex="0" aria-label="Design area. Arrow keys move the selected item."><div id="dGarment"></div><div class="d-area" id="dArea"></div><div class="d-guide" id="dGuide" hidden></div><div class="d-layers" id="dLayers"></div></div>
        <div class="d-toolbar">
          <button type="button" onclick="dzUndo()" title="Undo (Ctrl+Z)">↶ Undo</button><button type="button" onclick="dzRedo()" title="Redo (Ctrl+Y)">↷ Redo</button>
          <button type="button" onclick="dzClearSide()">Clear this side</button><button type="button" onclick="dzStartAgain()">Start again</button>
        </div>
        <div class="d-layerlist" id="dLayerList"></div>
      </div>
      <div class="d-panel">
        <div class="opt" style="margin-top:0"><h4>1. Garment</h4>
          <select id="dProduct" class="d-select" onchange="dzProduct(this.value)">${list.map(x => `<option value="${esc(x.code)}"${x === p ? ' selected' : ''}>${esc(x.name)} (${esc(x.code)})</option>`).join('')}</select></div>
        <div class="opt"><h4>2. Garment colour <small id="dColName"></small></h4><div class="swatches" id="dSwatches"></div></div>

        <div class="opt"><h4>3. Add to your design</h4>
          <div class="d-tabs">${['text', 'graphics', 'upload', 'templates'].map(t => `<button type="button" data-tab="${t}" class="${t === 'text' ? 'on' : ''}" onclick="dzTab('${t}')">${{ text: 'Text', graphics: 'Graphics', upload: 'Upload', templates: 'Templates' }[t]}</button>`).join('')}</div>
          <div class="d-tabpane" data-pane="text">
            <div class="d-row"><input id="dText" class="d-input" maxlength="40" placeholder="Start typing, e.g. Starlight Dance" autocomplete="off" oninput="dzTyping(this.value)" onkeydown="if(event.key==='Enter')dzAddText()"><button class="btn" type="button" onclick="dzAddText()">Add another</button></div>
            <p class="meta">Your text appears on the garment as you type. Click a style to change it.</p>
            <div class="d-fonts" id="dFontPick">${FONTS.map((f, i) => `<button type="button" class="${i === 2 ? 'on' : ''}" style="font-family:${f.css};font-weight:${f.weight}" onclick="dzPickFont(${i})">${f.label}</button>`).join('')}</div>
          </div>
          <div class="d-tabpane" data-pane="graphics" hidden>
            ${['Dancers', 'Icons'].map(g => `<div class="d-arthead">${g}</div><div class="d-artgrid">${art.filter(a => a.group === g).map(a => `<button type="button" title="${esc(a.label)}" aria-label="${esc(a.label)}" onclick="dzAddArt('${a.id}')">${artSVG(a, { hex: '#141414' })}</button>`).join('')}</div>`).join('')}
          </div>
          <div class="d-tabpane" data-pane="upload" hidden>
            <label class="btn ghost" style="width:100%">Upload your logo or picture<input id="dFile" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden onchange="dzUpload(this)"></label>
            <p class="meta">PNG, JPG, SVG or WEBP, up to 8MB. A PNG with a see-through background looks best, and there's a button to remove a white background.</p>
          </div>
          <div class="d-tabpane" data-pane="templates" hidden>
            <div class="d-templates">${TEMPLATES.map(t => `<button type="button" onclick="dzTemplate('${t.id}')">${esc(t.label)}</button>`).join('')}</div>
            <p class="meta">Templates add editable text and graphics. Change the words to your own.</p>
          </div>
        </div>

        <div class="opt d-selbox" id="dSelBox" hidden></div>

        <div class="opt"><h4>4. Finish</h4><div class="deco">${METHODS.map(([k, n, d], i) => `<label class="row"><input type="radio" name="dMethod" value="${k}" ${i ? '' : 'checked'} onchange="dzMethod(this.value)"><div><b>${n}</b><small>${d}</small></div></label>`).join('')}</div></div>

        <div class="opt"><h4>5. Names for your team <small>optional</small></h4>
          <label class="row d-check"><input type="checkbox" id="dNamesOn" onchange="dzNamesOn(this.checked)"><div><b>A different name on each garment</b><small>Great for teams: one name per line, with the size</small></div></label>
          <div id="dNamesBox" hidden>
            <textarea id="dNames" class="d-input" rows="5" placeholder="Ava, 7/8 yrs&#10;Mia, 9/11 yrs&#10;Lily, 7/8 yrs" oninput="dzNames(this.value)"></textarea>
            <p class="meta" id="dNamesInfo"></p>
            <button type="button" class="btn ghost" onclick="dzNamePlaceholder()">Show where names go</button>
          </div></div>

        <div class="opt"><h4>6. Sizes and quantities <small id="dSizeRange"></small></h4><div class="size-grid" id="dSizes"></div></div>
        <div class="summary" id="dSummary"></div>
        <div class="actions"><button class="btn" type="button" onclick="dzAddToBasket()">Add design to basket</button></div>
      </div>
    </div>`;
  };
  window.initDesign = function(){
    drawAll();
    if(!window._dzKeys){ window._dzKeys = 1; document.addEventListener('keydown', onKey); window.addEventListener('resize', () => D && drawLayers());
      if(document.fonts) document.fonts.addEventListener('loadingdone', () => { if(D && $('#dLayers')) drawLayers(); }); }
    // start fetching every font now, so styles switch instantly
    if(document.fonts) FONTS.forEach(f => document.fonts.load(`${f.weight} 40px '${f.id}'`).catch(() => {}));
  };

  function drawAll(){
    const c = D.p.colours[D.colour];
    $('#dColName').textContent = c.name;
    $('#dSwatches').innerHTML = D.p.colours.map((x, i) => `<button type="button" class="${i === D.colour ? 'on' : ''}" title="${esc(x.name)}" aria-label="${esc(x.name)}" style="background:${x.accent ? `linear-gradient(135deg, ${x.hex} 50%, ${x.accent} 50%)` : x.hex}" onclick="dzColour(${i})"></button>`).join('');
    $('#dSizeRange').textContent = D.p.sizes;
    $('#dSizes').innerHTML = D.p.sizeList.map(s => `<label>${esc(s)}<input type="number" min="0" max="999" inputmode="numeric" placeholder="0" value="${D.sizes[s] || ''}" data-size="${esc(s)}" onfocus="this.select()" oninput="dzQty(this)" ${D.names.on ? 'disabled' : ''}></label>`).join('');
    if(!sidesFor().includes(D.side)) D.side = 'front';
    $('#dSides').innerHTML = sidesFor().map(s => `<button type="button" class="${s === D.side ? 'on' : ''}" onclick="dzSide('${s}')">${SIDE_LABEL[s]}${D.layers.some(L => L.side === s) ? ' •' : ''}</button>`).join('');
    drawGarment(); drawLayers(); summary();
  }
  function drawGarment(){
    $('#dGarment').innerHTML = garmentFor(D.side, D.p.colours[D.colour]);
    const [x, y, w, h] = areaOf(D.side);
    Object.assign($('#dArea').style, { left: x / VB_W * 100 + '%', top: y / VB_H * 100 + '%', width: w / VB_W * 100 + '%', height: h / VB_H * 100 + '%' });
  }
  let drawToken = 0;
  async function drawLayers(){
    const my = ++drawToken, here = D.layers.filter(L => L.side === D.side);
    const bms = await Promise.all(here.map(bitmapOf)); if(my !== drawToken || !$('#dLayers')) return;   // page may have changed meanwhile
    $('#dLayers').innerHTML = here.map((L, i) => {
      const [w, h] = dims(L, bms[i]); L._w = w; L._h = h; if(L.type === 'text'){ L._bw = w; L._bh = h; L._rs = L.size; }
      const st = `left:${(L.x - w / 2) / VB_W * 100}%;top:${(L.y - h / 2) / VB_H * 100}%;width:${w / VB_W * 100}%;height:${h / VB_H * 100}%;transform:rotate(${L.rot || 0}deg) scaleX(${L.flip ? -1 : 1});opacity:${L.opacity == null ? 1 : L.opacity}`;
      return `<div class="d-layer${L.id === D.sel ? ' sel' : ''}" data-id="${L.id}" style="${st}"><img src="${bms[i].url}" alt="" draggable="false"></div>`;
    }).join('');
    document.querySelectorAll('.d-layer').forEach(el => el.addEventListener('pointerdown', startDrag));
    $('#dLayerList').innerHTML = here.length ? `<div class="d-arthead">On the ${SIDE_LABEL[D.side].toLowerCase()} (top first)</div>` + here.slice().reverse().map(L => `<button type="button" class="${L.id === D.sel ? 'on' : ''}" onclick="dzSelect(${L.id})">${L.type === 'text' ? 'T' : L.type === 'art' ? '★' : '▣'} ${esc(L.type === 'text' ? L.text : L.type === 'art' ? ((window.DESIGN_ART || []).find(a => a.id === L.art) || {}).label : assets[L.asset].name)}</button>`).join('') : '';
    if(!dragging) drawSelBox();
  }
  /* keep every item inside the print area: shrink it if its (rotated) outline is too big, then keep it in bounds */
  function clamp(L){
    const [ax, ay, aw, ah] = areaOf(L.side), t = (L.rot || 0) * Math.PI / 180, c = Math.abs(Math.cos(t)), sn = Math.abs(Math.sin(t));
    let w = L._w || 10, h = L._h || 10;
    const bw = w * c + h * sn, bh = w * sn + h * c, k = Math.min(1, aw / bw, ah / bh);
    if(k < 0.999){
      if(L.type === 'text'){ L.size = Math.max(2, L.size * k); if(L._bw) { L._bw *= k; L._bh *= k; } }
      else L.w *= k;
      w *= k; h *= k; L._w = w; L._h = h; L._shrunk = true;
    }
    const hw = (w * c + h * sn) / 2, hh = (w * sn + h * c) / 2;
    L.x = Math.max(ax + hw, Math.min(ax + aw - hw, L.x)); L.y = Math.max(ay + hh, Math.min(ay + ah - hh, L.y));
  }
  /* after an item was shrunk to fit, move its Size slider to match */
  function syncSize(L){
    if(!L._shrunk) return; L._shrunk = false;
    const lab = [...document.querySelectorAll('#dSelBox .d-slider')].find(l => l.querySelector('span').textContent === 'Size'); if(!lab) return;
    const inp = lab.querySelector('input'), v = L.type === 'text' ? L.size : L.w;
    inp.value = v; inp.style.setProperty('--p', (inp.value - inp.min) / (inp.max - inp.min) * 100 + '%'); lab.querySelector('output').textContent = Math.round(inp.value * 10) / 10;
  }

  /* ---------- selected-item panel ---------- */
  function rng(label, key, min, max, step, val, unit, div){
    div = div || 1; const pct = (val * div - min) / (max - min) * 100;
    return `<label class="d-slider"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val * div}" style="--p:${pct}%" data-unit="${unit || ''}" oninput="dzSlide(this, '${key}', ${div})" onchange="dzCommit()"><output>${Math.round(val * div * 10) / 10}${unit || ''}</output></label>`;
  }
  window.dzSlide = (el, key, div) => {
    el.style.setProperty('--p', (el.value - el.min) / (el.max - el.min) * 100 + '%');
    el.nextElementSibling.textContent = el.value + (el.dataset.unit || '');
    dzSet(key, +el.value / div, 1);
  };
  function drawSelBox(){
    const L = sel(), box = $('#dSelBox'); if(!box) return; if(!L || L.side !== D.side){ box.hidden = true; return; }
    box.hidden = false;
    const inks = (cur, fn) => `<div class="d-inks">${INKS.map((k, i) => `<button type="button" class="${cur === i ? 'on' : ''}${k.metal ? ' metal' : ''}" title="${k.name}" aria-label="${k.name}" style="background:${k.metal ? `linear-gradient(135deg,#fff,${k.hex} 35%,${shadeHex(k.hex, -0.3)} 70%,${k.hex})` : k.hex}" onclick="${fn}(${i})"></button>`).join('')}<label class="d-custom" title="Any colour"><input type="color" value="${typeof cur === 'string' ? cur : '#e0457b'}" onchange="${fn}(this.value)"><span>Any colour</span></label></div>`;
    const presets = presetsOf(L.side);
    let h = `<h4>Selected: ${L.type === 'text' ? 'text' : L.type === 'art' ? 'graphic' : 'picture'}</h4>`;
    if(L.type === 'text'){
      markFont(L.font);
      h += `<input class="d-input" id="dEditText" value="${esc(L.text)}" maxlength="40" oninput="dzSet('text', this.value, 1)" onchange="dzCommit()">
        <label class="d-slider d-sel" style="margin-top:10px"><span>Font</span><select class="d-select" onchange="dzSet('font', +this.value)">${FONTS.map((f, i) => `<option value="${i}" ${i === L.font ? 'selected' : ''}>${f.label} (${f.id})</option>`).join('')}</select></label>
        <div class="d-toggles"><button type="button" class="${L.bold ? 'on' : ''}" onclick="dzSet('bold', ${!L.bold})"><b>B</b> Bold</button><button type="button" class="${L.italic ? 'on' : ''}" onclick="dzSet('italic', ${!L.italic})"><i>I</i> Italic</button><button type="button" class="${L.upper ? 'on' : ''}" onclick="dzSet('upper', ${!L.upper})">AA Capitals</button><button type="button" class="${L.shadow ? 'on' : ''}" onclick="dzSet('shadow', ${!L.shadow})">Shadow</button></div>
        ${rng('Size', 'size', 3, 40, 0.5, L.size)}
        ${rng('Spacing', 'spacing', -10, 80, 1, L.spacing)}
        ${rng('Curve', 'arc', -100, 100, 1, L.arc)}
        <p class="meta" style="margin:0 0 6px">Curve right for an arch, left for a smile.</p>
        <div class="d-sub">Text colour</div>${inks(L.ink, 'dzInk')}
        ${rng('Outline', 'outline', 0, 6, 0.5, L.outline)}
        ${L.outline ? `<div class="d-sub">Outline colour</div>${inks(L.outlineInk, 'dzOutlineInk')}` : ''}`;
    } else {
      h += rng('Size', 'w', 4, Math.round(areaOf(L.side)[2]), 0.5, Math.round(L.w * 2) / 2);
      if(L.type === 'art') h += `<div class="d-sub">Colour</div>${inks(L.ink, 'dzInk')}`;
      if(L.type === 'image') h += `<label class="row d-check"><input type="checkbox" ${L.clean ? 'checked' : ''} onchange="dzClean(this.checked)"><div><b>Remove white background</b><small>Makes white areas of your picture see-through</small></div></label>`;
    }
    h += `${rng('Rotate', 'rot', -180, 180, 1, L.rot || 0, '°')}
      ${rng('See-through', 'opacity', 20, 100, 1, L.opacity == null ? 1 : L.opacity, '%', 100)}
      ${presets.length ? `<div class="d-sub">Put it on the ${SIDE_LABEL[L.side].toLowerCase()}</div><div class="d-toggles">${presets.map((pr, i) => `<button type="button" onclick="dzPlace(${i})">${pr.label}</button>`).join('')}</div>` : ''}
      <div class="d-toggles"><button type="button" onclick="dzCentre()">Centre</button><button type="button" onclick="dzFlip()">Flip</button><button type="button" onclick="dzDup()">Duplicate</button><button type="button" onclick="dzOrder(1)">Bring forward</button><button type="button" onclick="dzOrder(-1)">Send back</button><button type="button" onclick="dzResetStyle()">Reset style</button><button type="button" class="danger" onclick="dzDelete()">Remove</button></div>`;
    box.innerHTML = h;
  }

  /* ---------- history ---------- */
  const snap = () => JSON.stringify(D.layers.map(({ _w, _h, ...rest }) => rest));
  function remember(){ D.hist.push(snap()); if(D.hist.length > 60) D.hist.shift(); D.fut = []; }
  let pendingSnap = null;
  window.dzCommit = () => {
    if(pendingSnap){ D.hist.push(pendingSnap); D.fut = []; pendingSnap = null; }
    const L = sel(); drawLayers().then(() => { if(L){ clamp(L); drawLayers(); } drawSelBox(); });   // sharp redraw once the slider is let go
  };
  function place(L){
    const el = document.querySelector(`.d-layer[data-id="${L.id}"]`); if(!el) return null;
    Object.assign(el.style, { left: (L.x - L._w / 2) / VB_W * 100 + '%', top: (L.y - L._h / 2) / VB_H * 100 + '%', width: L._w / VB_W * 100 + '%', height: L._h / VB_H * 100 + '%',
      transform: `rotate(${L.rot || 0}deg) scaleX(${L.flip ? -1 : 1})`, opacity: L.opacity == null ? 1 : L.opacity });
    return el;
  }
  let busy = false;
  function fastUpdate(L, k){
    L._v = (L._v || 0) + 1;
    if(k === 'opacity'){ place(L); return; }
    if(k === 'rot'){ clamp(L); place(L); syncSize(L); return; }
    if(k === 'w'){ const r = (L._h || 1) / (L._w || 1); L._w = L.w; L._h = L.w * r; clamp(L); place(L); syncSize(L); return; }
    if(k === 'size' && L._rs){ const r = L.size / L._rs; L._w = L._bw * r; L._h = L._bh * r; clamp(L); place(L); syncSize(L); return; }   // stretch now, redraw sharp on release
    if(busy) return; busy = true;
    requestAnimationFrame(async () => {
      const v0 = L._v, b = await bitmapOf(L), [w, h] = dims(L, b);
      Object.assign(L, { _w: w, _h: h, _bw: w, _bh: h, _rs: L.size }); clamp(L); syncSize(L);
      const el = place(L); if(el) el.querySelector('img').src = b.url;
      busy = false; if(L._v !== v0) fastUpdate(L, k);     // catch up with anything that changed meanwhile
    });
  }
  const keepSel = () => { if(!D.layers.some(L => L.id === D.sel)) D.sel = null; const L = sel(); if(L) D.side = L.side; D.draftId = null; };
  window.dzUndo = () => { if(!D.hist.length) return; D.fut.push(snap()); D.layers = JSON.parse(D.hist.pop()); keepSel(); drawAll(); };
  window.dzRedo = () => { if(!D.fut.length) return; D.hist.push(snap()); D.layers = JSON.parse(D.fut.pop()); keepSel(); drawAll(); };

  /* ---------- editing ---------- */
  function addLayer(L, place, dy){
    remember();
    L.id = ++uid; L.side = L.side || D.side; L.rot = L.rot || 0;
    const [ax, ay, aw, ah] = areaOf(L.side);
    L.x = ax + aw / 2; L.y = ay + ah / 2;
    const pr = place && presetsOf(L.side).find(p => p.label === place);
    if(pr){ L.x = pr.box[0] + pr.box[2] / 2; L.y = pr.box[1] + pr.box[3] / 2 + (dy || 0); }
    D.layers.push(L); D.sel = L.id;
    if(L.side !== D.side) D.side = L.side;
    return L;
  }
  window.dzTab = t => { D.tab = t; document.querySelectorAll('.d-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); document.querySelectorAll('.d-tabpane').forEach(p => p.hidden = p.dataset.pane !== t); };
  /* font styles: change the selected text straight away (and set the style for new text) */
  function markFont(i){ document.querySelectorAll('#dFontPick button').forEach((b, k) => b.classList.toggle('on', k === i)); }
  window.dzPickFont = i => {
    D.font = i; markFont(i);
    const L = sel(); if(L && L.type === 'text'){ remember(); L.font = i; fitAfterDraw(L).then(drawSelBox); }
  };
  /* typing shows the text on the garment immediately; "Add another" starts a new line of text */
  window.dzTyping = v => {
    const t = v.replace(/^\s+/, '');
    let L = D.layers.find(x => x.id === D.draftId);
    if(!t){ if(L){ D.layers = D.layers.filter(x => x !== L); D.draftId = null; D.sel = null; if(D.hist.length) D.hist.pop(); drawAll(); } return; }
    if(!L){
      const [, , aw] = areaOf(D.side);
      L = addLayer({ type: 'text', text: t, font: D.font, size: Math.min(14, aw / 5), baseSize: Math.min(14, aw / 5), bold: false, italic: false, upper: false, spacing: 0, arc: 0, ink: D.inkChosen ? D.ink : contrastInk(), outline: 0, outlineInk: 1, shadow: false });
      D.draftId = L.id; drawAll();
    } else { L.text = t; D.sel = L.id; }
    fitAfterDraw(L, true);
  };
  window.dzAddText = () => {
    const box = $('#dText');
    if(!D.draftId){ if(!box.value.trim()) toast('Type some text first'); box.focus(); return; }
    D.draftId = null; box.value = ''; box.focus(); toast('Added. Type again to add another line of text.');
  };
  window.dzAddArt = id => { const [, , aw, ah] = areaOf(D.side); addLayer({ type: 'art', art: id, ink: D.ink === 0 ? 1 : D.ink, w: Math.min(aw, ah) * 0.5 }); drawAll(); };
  window.dzUpload = input => {
    const f = input.files[0]; if(!f) return;
    if(f.size > 8 * 1024 * 1024){ toast('That image is over 8MB. Please use a smaller one.'); return; }
    const rd = new FileReader();
    rd.onload = () => { const img = new Image(); img.onload = () => {
      const aid = 'a' + (++uid); assets[aid] = { dataURL: rd.result, name: f.name, file: f, ratio: img.naturalHeight / img.naturalWidth || 1, img };
      const [, , aw, ah] = areaOf(D.side); addLayer({ type: 'image', asset: aid, w: Math.min(aw * 0.7, ah * 0.7 / assets[aid].ratio), clean: false }); drawAll(); };
      img.onerror = () => toast('That file couldn’t be opened as a picture.'); img.src = rd.result; };
    rd.readAsDataURL(f); input.value = '';
  };
  window.dzTemplate = id => {
    const t = TEMPLATES.find(x => x.id === id); remember();
    const made = t.make(); const hist = D.hist.slice();
    const ci = contrastInk();
    made.forEach(L => { const { _place, _dy, ...rest } = L; if(!sidesFor().includes(rest.side)) return; if(rest.type === 'text' && rest.ink === 1) rest.ink = ci; if(rest.type === 'text' && rest.outline && rest.outlineInk === 1) rest.outlineInk = ci ? 0 : 1; addLayer(rest, _place, _dy); });
    D.hist = hist; D.side = made[0].side; drawAll(); toast('Template added. Click any part to change it.');
  };
  function leaveDraft(id){ if(D.draftId && id !== D.draftId){ D.draftId = null; const b = $('#dText'); if(b) b.value = ''; } }
  window.dzSelect = id => { leaveDraft(id); D.sel = id; drawLayers(); };
  window.dzSet = (k, v, live) => {
    const L = sel(); if(!L) return;
    if(live){ if(!pendingSnap) pendingSnap = snap(); } else remember();
    L[k] = v; if(k === 'size') L.baseSize = v;
    if(live){ fastUpdate(L, k); return; }
    drawLayers().then(() => { const L2 = sel(); if(L2){ clamp(L2); if(!live) drawSelBox(); } });
    if(!live && k !== 'text') drawSelBox();
  };
  window.dzInk = v => { if(typeof v === 'number'){ D.ink = v; D.inkChosen = true; } dzSet('ink', v); };
  window.dzOutlineInk = v => dzSet('outlineInk', v);
  window.dzClean = on => { const L = sel(); if(!L) return; remember(); L.clean = on; if(on && !assets[L.asset].clean) assets[L.asset].clean = removeWhite(assets[L.asset].img); drawLayers(); };
  window.dzPlace = i => { const L = sel(); if(!L) return; remember(); const pr = presetsOf(L.side)[i], b = pr.box.slice();
    const along = /Down the sleeve/.test(pr.label); L.rot = along ? -90 : (Math.abs(L.rot || 0) === 90 ? 0 : L.rot);
    const bw = along ? b[3] : b[2], bh = along ? b[2] : b[3];
    if(L.type === 'text'){ const s = Math.min(bw / (L._w || 1), bh / (L._h || 1)); L.size = Math.max(3, Math.min(40, L.size * s * 0.95)); }
    else { const r = (L._h || 1) / (L._w || 1); L.w = Math.min(bw, bh / r); }
    L.x = b[0] + b[2] / 2; L.y = b[1] + b[3] / 2; drawLayers(); };
  window.dzCentre = () => { const L = sel(); if(!L) return; remember(); const [x, , w] = areaOf(L.side); L.x = x + w / 2; drawLayers(); };
  window.dzFlip = () => { const L = sel(); if(!L) return; remember(); L.flip = !L.flip; drawLayers(); };
  window.dzDup = () => { const L = sel(); if(!L) return; remember(); const { _w, _h, ...rest } = L; const n = { ...rest, id: ++uid, x: L.x + 6, y: L.y + 6 }; D.layers.push(n); D.sel = n.id; clamp(n); drawAll(); };
  window.dzOrder = dir => { const L = sel(); if(!L) return; remember(); const same = D.layers.filter(x => x.side === L.side); const i = same.indexOf(L), j = i + dir;
    if(j < 0 || j >= same.length) return; const a = D.layers.indexOf(same[i]), b = D.layers.indexOf(same[j]); [D.layers[a], D.layers[b]] = [D.layers[b], D.layers[a]]; drawLayers(); };
  window.dzDelete = () => { if(!sel()) return; remember(); D.layers = D.layers.filter(L => L.id !== D.sel); D.sel = null; drawAll(); };
  window.dzClearSide = () => { if(!D.layers.some(L => L.side === D.side)) return; remember(); D.layers = D.layers.filter(L => L.side !== D.side); D.sel = null; drawAll(); toast('Cleared. Undo brings it back.'); };
  /* back to plain: keeps the words/picture, colour and position */
  window.dzResetStyle = () => {
    const L = sel(); if(!L) return; remember();
    Object.assign(L, { rot: 0, flip: false, opacity: 1 });
    if(L.type === 'text'){ Object.assign(L, { bold: false, italic: false, upper: false, spacing: 0, arc: 0, outline: 0, shadow: false }); if(L.baseSize) L.size = L.baseSize; fitAfterDraw(L).then(drawSelBox); }
    else { const [, , aw, ah] = areaOf(L.side); const r = (L._h || 1) / (L._w || 1); L.w = Math.min(aw, ah / r) * 0.5; if(L.type === 'image') L.clean = false; drawLayers().then(() => { clamp(L); drawLayers(); }); }
    toast('Style reset. Undo brings it back.');
  };
  /* clear everything on every side and go back to the default finish */
  window.dzStartAgain = () => {
    if(!D.layers.length && D.method === 'print') return;
    remember(); D.layers = []; D.sel = null; D.draftId = null; D.side = 'front'; D.method = 'print';
    const box = $('#dText'); if(box) box.value = '';
    document.querySelectorAll('input[name=dMethod]').forEach(i => i.checked = i.value === 'print');
    drawAll(); toast('Design cleared. Undo brings it back.');
  };
  window.dzSide = s => { D.side = s; D.sel = null; drawAll(); };
  window.dzColour = i => { D.colour = i; drawAll(); };
  window.dzProduct = code => { const p = (window.PRODUCTS || []).find(x => x.code === code); if(!p) return;
    D.p = p; D.colour = 0; D.sizes = {}; D.layers = D.layers.filter(L => sidesFor().includes(L.side)); D.layers.forEach(clamp); D.sel = null; drawAll(); };
  window.dzMethod = v => { D.method = v; summary(); };
  window.dzQty = el => { D.sizes[el.dataset.size] = Math.max(0, Math.min(999, parseInt(el.value, 10) || 0)); summary(); };

  /* team names: "Name, size" per line; quantities come from the list */
  function parseNames(){
    const rows = D.names.text.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const m = l.split(/\s*[,\-–]\s*(?=[^,\-–]*$)/); return { name: (m[0] || '').trim(), size: (m[1] || '').trim() }; });
    const norm = s => s.toLowerCase().replace(/\s|yrs?|years?/g, '').replace(/^xxxxxl$/, '5xl').replace(/^xxxxl$/, '4xl').replace(/^xxxl$/, '3xl').replace(/^xxl$/, '2xl').replace(/^2xs$/, 'xxs');
    rows.forEach(r => { r.match = D.p.sizeList.find(s => norm(s) === norm(r.size)); });
    return rows;
  }
  window.dzNamesOn = on => { D.names.on = on; $('#dNamesBox').hidden = !on; if(on) dzNames($('#dNames').value); else drawAll(); summary(); };
  window.dzNames = v => {
    D.names.text = v; const rows = parseNames(), bad = rows.filter(r => !r.match);
    D.sizes = {}; rows.filter(r => r.match).forEach(r => { D.sizes[r.match] = (D.sizes[r.match] || 0) + 1; });
    $('#dNamesInfo').innerHTML = `${rows.length - bad.length} name${rows.length - bad.length === 1 ? '' : 's'} ready.` + (bad.length ? ` <b>Check the size for:</b> ${bad.map(r => esc(r.name || '(blank)')).join(', ')}. Sizes for this garment: ${esc(D.p.sizeList.join(', '))}.` : '');
    document.querySelectorAll('#dSizes input').forEach(i => { i.value = D.sizes[i.dataset.size] || ''; i.disabled = true; });
    summary();
  };
  window.dzNamePlaceholder = () => { const side = sidesFor().includes('back') ? 'back' : 'front', pr = presetsOf(side)[1] ? presetsOf(side)[1].label : null;
    addLayer({ side, type: 'text', text: 'NAME', font: 2, size: 14, bold: false, italic: false, upper: true, spacing: 8, arc: 0, ink: contrastInk(), outline: 0, outlineInk: 1, shadow: false, isName: true }, pr); drawAll(); };

  /* draw, then shrink text that is wider than the print area (live typing starts from its original size each time) */
  async function fitAfterDraw(L, live){
    if(live && L.baseSize) L.size = L.baseSize;
    await drawLayers(); const [, , aw, ah] = areaOf(L.side);
    const s = Math.min(1, aw / (L._w || 1), ah / (L._h || 1)); if(s < 1){ L.size = Math.max(3, L.size * s * 0.95); await drawLayers(); }
    clamp(L); await drawLayers();
  }

  /* ---------- dragging, snapping, keys ---------- */
  function startDrag(e){
    const id = +e.currentTarget.dataset.id; leaveDraft(id); D.sel = id; const L = sel(); if(!L) return;
    e.preventDefault(); const r = $('#dStage').getBoundingClientRect(), k = VB_W / r.width;
    const sx = e.clientX, sy = e.clientY, ox = L.x, oy = L.y, before = snap(); let moved = false;
    const [ax, , aw] = areaOf(L.side), cx = ax + aw / 2, guide = $('#dGuide');
    dragging = true;
    const move = ev => { moved = true; L.x = ox + (ev.clientX - sx) * k; L.y = oy + (ev.clientY - sy) * k;
      const snapX = Math.abs(L.x - cx) < 2.5; if(snapX) L.x = cx; clamp(L);
      guide.hidden = !snapX; guide.style.left = cx / VB_W * 100 + '%';
      const el = document.querySelector(`.d-layer[data-id="${L.id}"]`); if(el){ el.style.left = (L.x - L._w / 2) / VB_W * 100 + '%'; el.style.top = (L.y - L._h / 2) / VB_H * 100 + '%'; } };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); dragging = false; guide.hidden = true;
      if(moved){ D.hist.push(before); D.fut = []; } drawLayers(); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    document.querySelectorAll('.d-layer').forEach(el => el.classList.toggle('sel', +el.dataset.id === id));
    drawSelBox(); $('#dStage').focus({ preventScroll: true });
  }
  function onKey(e){
    if(!D || !location.hash.startsWith('#/design') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? dzRedo() : dzUndo(); return; }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y'){ e.preventDefault(); dzRedo(); return; }
    const L = sel(); if(!L) return;
    const step = e.shiftKey ? 5 : 1, mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if(mv){ e.preventDefault(); if(!pendingSnap) pendingSnap = snap(); L.x += mv[0]; L.y += mv[1]; clamp(L); drawLayers(); clearTimeout(onKey._t); onKey._t = setTimeout(dzCommit, 600); }
    else if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); dzDelete(); }
  }

  /* make near-white pixels transparent (for logos saved on a white background) */
  function removeWhite(img){
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
    for(let i = 0; i < a.length; i += 4){ const m = Math.min(a[i], a[i + 1], a[i + 2]); if(m > 235) a[i + 3] = 0; else if(m > 205) a[i + 3] = Math.round(a[i + 3] * (235 - m) / 30); }
    x.putImageData(d, 0, 0); return c.toDataURL('image/png');
  }

  /* ---------- price summary ---------- */
  function decos(){
    const used = s => D.layers.some(L => L.side === s), out = [];
    if(used('front')) out.push(D.method === 'emb' ? 'frontEmb' : 'frontPrint');
    if(used('back')) out.push(D.method === 'emb' ? 'backEmb' : 'backPrint');
    if(used('left') || used('right')) out.push(D.method === 'emb' ? 'sleeveEmb' : 'sleevePrint');
    if(D.names.on) out.push('name');
    return out.filter(k => CONFIG.decoration[k]);
  }
  function summary(){
    if(!$('#dSummary')) return;
    const qty = Object.values(D.sizes).reduce((a, b) => a + b, 0), pl = priceLine(D.p, Math.max(qty, 1), decos());
    $('#dSummary').innerHTML = `<div class="line"><span>${esc(D.p.name)}</span><span>${gbp(D.p.price)}</span></div>
      ${decos().map(d => `<div class="line"><span>${esc(CONFIG.decoration[d].label)}</span><span>${CONFIG.showPrices ? '+' + gbp(CONFIG.decoration[d].each) : '✓'}</span></div>`).join('')}
      <div class="line"><span>Quantity</span><span>${qty}</span></div>
      ${pl.off && CONFIG.showPrices ? `<div class="line"><span>Bulk discount</span><span>−${Math.round(pl.off * 100)}%</span></div>` : ''}
      ${pl.setup && CONFIG.showPrices ? `<div class="line"><span>Embroidery setup (one-off)</span><span>${gbp(pl.setup)}</span></div>` : ''}
      <div class="line total"><span>Estimated total</span><span>${qty ? gbp(pl.total) : '—'}</span></div>
      <div class="note">We check every design and send you a mock-up before anything is made.</div>`;
  }

  /* ---------- pictures of the design for the basket and the order ---------- */
  async function renderSide(side, px){
    const c = D.p.colours[D.colour], k = px / VB_W;
    const cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(VB_H * k);
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#f7f3f0'; ctx.fillRect(0, 0, cv.width, cv.height);
    const load = url => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; });
    const g = await load('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(garmentFor(side, c).replace('<svg ', `<svg width="${cv.width}" height="${cv.height}" `)));
    if(g) ctx.drawImage(g, 0, 0, cv.width, cv.height);
    for(const L of D.layers.filter(L => L.side === side)){
      const b = await bitmapOf(L), [w, h] = dims(L, b);
      const src = L.type === 'text' ? b.canvas : await load(L.type === 'art' ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(artSVG(b.art, b.ink, Math.round(w * k * 2), Math.round(h * k * 2))) : b.url);
      if(!src) continue;
      ctx.save(); ctx.globalAlpha = L.opacity == null ? 1 : L.opacity; ctx.translate(L.x * k, L.y * k); ctx.rotate((L.rot || 0) * Math.PI / 180); if(L.flip) ctx.scale(-1, 1);
      ctx.drawImage(src, -w * k / 2, -h * k / 2, w * k, h * k); ctx.restore();
    }
    return cv;
  }
  function describe(){
    const inkName = i => inkOf(i).name;
    return D.layers.map(L => `${SIDE_LABEL[L.side]}: ` + (L.type === 'image' ? `picture "${assets[L.asset].name}"${L.clean ? ' (white background removed)' : ''}`
      : L.type === 'art' ? `graphic "${((window.DESIGN_ART || []).find(a => a.id === L.art) || {}).label}" in ${inkName(L.ink)}`
      : `text "${L.text}"${L.isName ? ' (each garment gets its own name)' : ''} in ${FONTS[L.font].label} (${FONTS[L.font].id})${L.bold ? ', bold' : ''}${L.italic ? ', italic' : ''}${L.upper ? ', capitals' : ''}${L.arc ? `, curved ${L.arc > 0 ? 'arch' : 'smile'}` : ''}, ${inkName(L.ink)}${L.outline ? `, ${inkName(L.outlineInk)} outline` : ''}${L.shadow ? ', shadow' : ''}`)).join('; ')
      + `. Finish: ${METHODS.find(m => m[0] === D.method)[1]}.`
      + (D.names.on ? ` Names: ${parseNames().filter(r => r.match).map(r => `${r.name} (${r.match})`).join(', ')}.` : '');
  }
  window.dzAddToBasket = async () => {
    const sizes = Object.fromEntries(Object.entries(D.sizes).filter(([, v]) => v > 0));
    const qty = Object.values(sizes).reduce((a, b) => a + b, 0);
    if(!D.layers.length){ toast('Add some text, a graphic or your logo first'); return; }
    if(!qty){ toast(D.names.on ? 'Add at least one name with a size' : 'Add a quantity for at least one size'); return; }
    const previews = {};
    for(const s of sidesFor().filter(s => D.layers.some(L => L.side === s))) previews[s] = (await renderSide(s, 320)).toDataURL('image/jpeg', 0.82);
    const c = D.p.colours[D.colour];
    basket.push({ code: D.p.code, colour: c.name, hex: c.hex, accent: c.accent, sizes, qty, decos: decos(), notes: '', design: { previews, describe: describe(), assets: [...new Set(D.layers.filter(L => L.type === 'image').map(L => L.asset))] } });
    saveBasket(); toast(`Added your design: ${qty} × ${D.p.name}`);
  };
  window.designAssets = ids => (ids || []).map(id => assets[id]).filter(Boolean);
})();
