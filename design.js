/* "Design your own": pick a garment and colour, add logos and text to the front
   and back, drag and resize them, then add to the basket with a picture of the
   design. Everything happens in the browser; nothing is uploaded until the
   customer sends their order. */
(function(){
  const VB_W = 240, VB_H = 260;
  const FONTS = [
    { id: 'Jost', label: 'Clean', css: "'Jost', Arial, sans-serif", weight: 500 },
    { id: 'Bebas Neue', label: 'Varsity', css: "'Bebas Neue', Impact, sans-serif", weight: 400 },
    { id: 'Pacifico', label: 'Script', css: "'Pacifico', cursive", weight: 400 },
    { id: 'Playfair Display', label: 'Elegant', css: "'Playfair Display', Georgia, serif", weight: 600 },
  ];
  const INKS = [['White', '#ffffff'], ['Black', '#141414'], ['Pink', '#e0457b'], ['Gold', '#c9a227'], ['Silver', '#bfc3c8'], ['Navy', '#1f2a56'], ['Lilac', '#b9a8e0'], ['Red', '#c62828']];
  const assets = {};          // uploaded images kept in memory: id -> { dataURL, name }
  let D = null, uid = 0;      // current design

  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const area = () => PRINT_AREAS[designShape(D.p.shape)][D.side];
  const clampLayer = L => {
    const [ax, ay, aw, ah] = PRINT_AREAS[designShape(D.p.shape)][L.side];
    const hw = Math.min(L.w, aw) / 2, hh = Math.min(L.h(), ah) / 2;
    L.x = Math.max(ax + hw, Math.min(ax + aw - hw, L.x)); L.y = Math.max(ay + hh, Math.min(ay + ah - hh, L.y));
  };

  window.designView = function(code){
    const list = (window.PRODUCTS || []).filter(p => PRINT_AREAS[designShape(p.shape)]);
    const p = list.find(x => x.code === code) || list.find(x => x.code === 'JH001') || list[0];
    D = { p, colour: 0, side: 'front', layers: [], sel: null, sizes: {}, method: 'print' };
    return `<div class="page-head"><div class="wrap"><h1>Design your own</h1><p>Add your logo and text, drag them into place, and see your kit come to life.</p></div></div>
    <div class="wrap designer">
      <div class="d-stage-col">
        <div class="side-tabs"><button class="on" data-side="front" onclick="dzSide('front')">Front</button><button data-side="back" onclick="dzSide('back')">Back</button></div>
        <div class="d-stage" id="dStage"><div id="dGarment"></div><div class="d-area" id="dArea"></div><div class="d-layers" id="dLayers"></div></div>
        <p class="meta" style="text-align:center;margin-top:8px">Drag to move. Use the sliders to resize and rotate. The dashed box is the print area.</p>
      </div>
      <div class="d-panel">
        <div class="opt" style="margin-top:0"><h4>1. Garment</h4>
          <select id="dProduct" class="d-select" onchange="dzProduct(this.value)">${list.map(x => `<option value="${esc(x.code)}"${x === p ? ' selected' : ''}>${esc(x.name)} (${esc(x.code)})</option>`).join('')}</select></div>
        <div class="opt"><h4>2. Colour <small id="dColName"></small></h4><div class="swatches" id="dSwatches"></div></div>
        <div class="opt"><h4>3. Add your logo or picture</h4>
          <label class="btn ghost" style="width:100%">Upload an image<input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden onchange="dzUpload(this)"></label>
          <p class="meta" style="margin:6px 0 0">A PNG with a see-through background looks best.</p></div>
        <div class="opt"><h4>4. Add text</h4>
          <div class="d-row"><input id="dText" class="d-input" maxlength="30" placeholder="e.g. Starlight Dance Academy"><button class="btn" type="button" onclick="dzAddText()">Add</button></div>
          <div class="d-fonts">${FONTS.map((f, i) => `<button type="button" class="${i ? '' : 'on'}" data-font="${i}" style="font-family:${f.css};font-weight:${f.weight}" onclick="dzFont(${i})">${f.label}</button>`).join('')}</div>
          <div class="d-inks">${INKS.map(([n, h], i) => `<button type="button" class="${i ? '' : 'on'}" title="${n}" aria-label="${n}" style="background:${h}" onclick="dzInk(${i})"></button>`).join('')}</div></div>
        <div class="opt" id="dSelBox" hidden><h4>Selected item</h4>
          <label class="d-slider">Size<input type="range" id="dSize" min="10" max="100" oninput="dzResize(this.value)"></label>
          <label class="d-slider">Rotate<input type="range" id="dRot" min="-45" max="45" oninput="dzRotate(this.value)"></label>
          <div class="d-row"><button class="btn ghost" type="button" onclick="dzCentre()">Centre</button><button class="btn ghost" type="button" onclick="dzDelete()">Remove</button></div></div>
        <div class="opt"><h4>5. Print or embroidery</h4><div class="deco">
          <label class="row"><input type="radio" name="dMethod" value="print" checked onchange="dzMethod(this.value)"><div><b>Print</b><small>Best for colourful logos and big back designs</small></div></label>
          <label class="row"><input type="radio" name="dMethod" value="emb" onchange="dzMethod(this.value)"><div><b>Embroidery</b><small>A premium stitched finish for smaller front logos</small></div></label></div></div>
        <div class="opt"><h4>6. Sizes and quantities <small id="dSizeRange"></small></h4><div class="size-grid" id="dSizes"></div></div>
        <div class="summary" id="dSummary"></div>
        <div class="actions"><button class="btn" type="button" onclick="dzAddToBasket()">Add design to basket</button></div>
      </div>
    </div>`;
  };

  window.initDesign = function(){ drawAll(); window.addEventListener('resize', drawLayers); };

  function drawAll(){
    const c = D.p.colours[D.colour];
    $('#dColName').textContent = c.name;
    $('#dSwatches').innerHTML = D.p.colours.map((x, i) => `<button type="button" class="${i === D.colour ? 'on' : ''}" title="${esc(x.name)}" aria-label="${esc(x.name)}" style="background:${x.accent ? `linear-gradient(135deg, ${x.hex} 50%, ${x.accent} 50%)` : x.hex}" onclick="dzColour(${i})"></button>`).join('');
    $('#dSizeRange').textContent = D.p.sizes;
    $('#dSizes').innerHTML = D.p.sizeList.map(s => `<label>${esc(s)}<input type="number" min="0" max="999" inputmode="numeric" placeholder="0" value="${D.sizes[s] || ''}" data-size="${esc(s)}" onfocus="this.select()" oninput="dzQty(this)"></label>`).join('');
    drawGarment(); drawLayers(); summary();
  }
  function drawGarment(){
    const c = D.p.colours[D.colour];
    $('#dGarment').innerHTML = garmentSVG(designShape(D.p.shape), c.hex, { accent: c.accent, plain: true, back: D.side === 'back', label: D.p.name });
    const [x, y, w, h] = area();
    Object.assign($('#dArea').style, { left: x / VB_W * 100 + '%', top: y / VB_H * 100 + '%', width: w / VB_W * 100 + '%', height: h / VB_H * 100 + '%' });
    document.querySelectorAll('.side-tabs button').forEach(b => b.classList.toggle('on', b.dataset.side === D.side));
  }
  function drawLayers(){
    const st = $('#dStage'); if(!st || !D) return;
    const scale = st.clientWidth / VB_W;
    $('#dLayers').innerHTML = D.layers.filter(L => L.side === D.side).map(L => {
      const style = `left:${(L.x - L.w / 2) / VB_W * 100}%;top:${(L.y - L.h() / 2) / VB_H * 100}%;width:${L.w / VB_W * 100}%;height:${L.h() / VB_H * 100}%;transform:rotate(${L.rot}deg)`;
      const inner = L.type === 'image' ? `<img src="${assets[L.asset].dataURL}" alt="" draggable="false">`
        : `<span style="font-family:${FONTS[L.font].css};font-weight:${FONTS[L.font].weight};color:${L.ink};font-size:${L.size * scale}px">${esc(L.text)}</span>`;
      return `<div class="d-layer${L.id === D.sel ? ' sel' : ''}" data-id="${L.id}" style="${style}">${inner}</div>`;
    }).join('');
    document.querySelectorAll('.d-layer').forEach(el => el.addEventListener('pointerdown', startDrag));
    const L = selLayer(); $('#dSelBox').hidden = !L;
    if(L){ $('#dSize').value = L.type === 'image' ? Math.round(L.w / area()[2] * 100) : Math.round(L.size / 40 * 100); $('#dRot').value = L.rot; }
  }
  const selLayer = () => D.layers.find(L => L.id === D.sel && L.side === D.side);

  /* ---- measuring text in drawing units, so text boxes fit their words ---- */
  const mctx = document.createElement('canvas').getContext('2d');
  function textWidth(L){ const f = FONTS[L.font]; mctx.font = `${f.weight} ${L.size * 10}px ${f.css}`; return mctx.measureText(L.text).width / 10 + L.size * 0.3; }

  function startDrag(e){
    const id = +e.currentTarget.dataset.id; D.sel = id; const L = selLayer(); if(!L) return;
    e.preventDefault(); const st = $('#dStage'), r = st.getBoundingClientRect(), k = VB_W / r.width;
    const sx = e.clientX, sy = e.clientY, ox = L.x, oy = L.y;
    const move = ev => { L.x = ox + (ev.clientX - sx) * k; L.y = oy + (ev.clientY - sy) * k; clampLayer(L); drawLayers(); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    drawLayers();
  }

  window.dzSide = s => { D.side = s; D.sel = null; drawGarment(); drawLayers(); };
  window.dzColour = i => { D.colour = i; drawAll(); };
  window.dzProduct = code => {
    const p = (window.PRODUCTS || []).find(x => x.code === code); if(!p) return;
    D.p = p; D.colour = 0; D.sizes = {};
    D.layers.forEach(clampLayer); location.hash = '#/design/' + encodeURIComponent(code).replace(/%2F/g, '%2F'); // keeps the link shareable
  };
  window.dzUpload = input => {
    const f = input.files[0]; if(!f) return;
    if(f.size > 8 * 1024 * 1024){ toast('That image is over 8MB. Please use a smaller one.'); return; }
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const aid = 'a' + (++uid); assets[aid] = { dataURL: rd.result, name: f.name, file: f };
        const [x, y, w, h] = area(), ratio = img.naturalHeight / img.naturalWidth || 1;
        const L = { id: ++uid, side: D.side, type: 'image', asset: aid, ratio, x: x + w / 2, y: y + h / 2, w: Math.min(w * 0.6, h * 0.6 / ratio), rot: 0 };
        L.h = () => L.w * L.ratio; clampLayer(L); D.layers.push(L); D.sel = L.id; drawLayers(); summary();
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(f); input.value = '';
  };
  let curFont = 0, curInk = 0;
  window.dzFont = i => { curFont = i; document.querySelectorAll('.d-fonts button').forEach((b, k) => b.classList.toggle('on', k === i)); const L = selLayer(); if(L && L.type === 'text'){ L.font = i; L.w = textWidth(L); clampLayer(L); drawLayers(); } };
  window.dzInk = i => { curInk = i; document.querySelectorAll('.d-inks button').forEach((b, k) => b.classList.toggle('on', k === i)); const L = selLayer(); if(L && L.type === 'text'){ L.ink = INKS[i][1]; L.inkName = INKS[i][0]; drawLayers(); } };
  window.dzAddText = () => {
    const t = $('#dText').value.trim(); if(!t){ toast('Type some text first'); return; }
    const [x, y, w, h] = area();
    const L = { id: ++uid, side: D.side, type: 'text', text: t, font: curFont, ink: INKS[curInk][1], inkName: INKS[curInk][0], size: 14, x: x + w / 2, y: y + h / 2, rot: 0 };
    L.w = textWidth(L); while(L.w > w && L.size > 5){ L.size -= 1; L.w = textWidth(L); }
    L.h = () => L.size * 1.35; clampLayer(L); D.layers.push(L); D.sel = L.id; $('#dText').value = ''; drawLayers(); summary();
  };
  window.dzResize = v => {
    const L = selLayer(); if(!L) return; const [, , w, h] = area();
    if(L.type === 'image'){ L.w = Math.max(8, Math.min(w, h / L.ratio) * v / 100); }
    else { L.size = Math.max(4, 40 * v / 100); L.w = textWidth(L); if(L.w > w){ L.size *= w / L.w; L.w = textWidth(L); } }
    clampLayer(L); drawLayers();
  };
  window.dzRotate = v => { const L = selLayer(); if(L){ L.rot = +v; drawLayers(); } };
  window.dzCentre = () => { const L = selLayer(); if(L){ const [x, , w] = area(); L.x = x + w / 2; clampLayer(L); drawLayers(); } };
  window.dzDelete = () => { D.layers = D.layers.filter(L => L.id !== D.sel); D.sel = null; drawLayers(); summary(); };
  window.dzMethod = v => { D.method = v; summary(); };
  window.dzQty = el => { D.sizes[el.dataset.size] = Math.max(0, Math.min(999, parseInt(el.value, 10) || 0)); summary(); };

  function decos(){
    const out = [], front = D.layers.some(L => L.side === 'front'), back = D.layers.some(L => L.side === 'back');
    if(front) out.push(D.method === 'emb' ? 'frontEmb' : 'frontPrint');
    if(back) out.push('backPrint');
    return out;
  }
  function summary(){
    const qty = Object.values(D.sizes).reduce((a, b) => a + b, 0), pl = priceLine(D.p, Math.max(qty, 1), decos());
    $('#dSummary').innerHTML = `<div class="line"><span>${esc(D.p.name)}</span><span>${gbp(D.p.price)}</span></div>
      ${decos().map(d => `<div class="line"><span>${esc(CONFIG.decoration[d].label)}</span><span>${CONFIG.showPrices ? '+' + gbp(CONFIG.decoration[d].each) : '✓'}</span></div>`).join('')}
      <div class="line"><span>Quantity</span><span>${qty}</span></div>
      ${pl.off && CONFIG.showPrices ? `<div class="line"><span>Bulk discount</span><span>−${Math.round(pl.off * 100)}%</span></div>` : ''}
      ${pl.setup && CONFIG.showPrices ? `<div class="line"><span>Embroidery setup (one-off)</span><span>${gbp(pl.setup)}</span></div>` : ''}
      <div class="line total"><span>Estimated total</span><span>${qty ? gbp(pl.total) : '—'}</span></div>
      <div class="note">We check every design and send you a mock-up before anything is made.</div>`;
  }

  /* ---- render one side of the design to a picture (for the basket and the order) ---- */
  async function renderSide(side, px){
    const c = D.p.colours[D.colour], k = px / VB_W;
    const cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(VB_H * k);
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#f7f3f0'; ctx.fillRect(0, 0, cv.width, cv.height);
    const svg = garmentSVG(designShape(D.p.shape), c.hex, { accent: c.accent, plain: true, back: side === 'back' }).replace('<svg ', `<svg width="${cv.width}" height="${cv.height}" `);
    await new Promise(res => { const im = new Image(); im.onload = () => { ctx.drawImage(im, 0, 0, cv.width, cv.height); res(); }; im.onerror = res; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    for(const L of D.layers.filter(L => L.side === side)){
      ctx.save(); ctx.translate(L.x * k, L.y * k); ctx.rotate(L.rot * Math.PI / 180);
      if(L.type === 'image'){
        await new Promise(res => { const im = new Image(); im.onload = () => { ctx.drawImage(im, -L.w * k / 2, -L.h() * k / 2, L.w * k, L.h() * k); res(); }; im.onerror = res; im.src = assets[L.asset].dataURL; });
      } else {
        const f = FONTS[L.font]; try { await document.fonts.load(`${f.weight} ${L.size * k}px "${f.id}"`); } catch(e){}
        ctx.font = `${f.weight} ${L.size * k}px ${f.css}`; ctx.fillStyle = L.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(L.text, 0, 0);
      }
      ctx.restore();
    }
    return cv;
  }
  window.dzAddToBasket = async () => {
    const sizes = Object.fromEntries(Object.entries(D.sizes).filter(([, v]) => v > 0));
    const qty = Object.values(sizes).reduce((a, b) => a + b, 0);
    if(!D.layers.length){ toast('Add a logo or some text first'); return; }
    if(!qty){ toast('Add a quantity for at least one size'); return; }
    const sides = ['front', 'back'].filter(s => D.layers.some(L => L.side === s));
    const previews = {};
    for(const s of sides) previews[s] = (await renderSide(s, 320)).toDataURL('image/jpeg', 0.82);
    const c = D.p.colours[D.colour];
    const describe = D.layers.map(L => `${L.side}: ` + (L.type === 'image' ? `image "${assets[L.asset].name}"` : `text "${L.text}" in ${FONTS[L.font].label} (${FONTS[L.font].id}), ${L.inkName}`)).join('; ');
    basket.push({ code: D.p.code, colour: c.name, hex: c.hex, accent: c.accent, sizes, qty, decos: decos(), notes: '', design: { previews, describe, assets: [...new Set(D.layers.filter(L => L.type === 'image').map(L => L.asset))] } });
    saveBasket(); toast(`Added your design: ${qty} × ${D.p.name}`);
  };

  /* uploaded images for the order email (kept in memory for this visit only) */
  window.designAssets = ids => (ids || []).map(id => assets[id]).filter(Boolean);
})();
