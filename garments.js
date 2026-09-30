/* Flat garment drawings, one per garment shape, recoloured to the chosen colour.
   Every product on the site points at one of these shapes. Original artwork,
   drawn here, so no supplier photos are needed (or copied). */
(function(){
  const S = 'stroke="#1a1a1a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  function shade(hex, amt){           // darker/lighter version of a colour for seams and cuffs
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v + amt * (amt < 0 ? v : 255 - v)))));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  const logo = (x, y, w, h) => `<g class="logo-zone"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="LOGOCOL" stroke-opacity=".75" stroke-dasharray="4 3"/><text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-family="Jost, Arial" font-size="${Math.min(11, w / 4.6).toFixed(1)}" fill="LOGOCOL" fill-opacity=".85" letter-spacing="1">YOUR LOGO</text></g>`;
  const SHAPES = {
    hoodie: (c, d) => `
      <path d="M70 70 L48 80 L22 190 L44 196 L66 118 L66 240 L174 240 L174 118 L196 196 L218 190 L192 80 L170 70 Z" fill="${c}" ${S}/>
      <path d="M92 64 Q120 18 148 64 Q146 96 120 102 Q94 96 92 64 Z" fill="${d}" ${S}/>
      <path d="M100 66 Q120 40 140 66 Q138 88 120 92 Q102 88 100 66 Z" fill="${shade(d, -0.35)}" ${S}/>
      <path d="M86 200 L154 200 L160 226 L80 226 Z" fill="${d}" ${S}/>
      <path d="M66 232 L174 232" ${S}/><path d="M112 96 L110 130 M128 96 L130 130" ${S}/>
      ${logo(96, 130, 48, 30)}`,
    cropHoodie: (c, d) => `
      <path d="M70 70 L48 80 L22 170 L44 176 L66 118 L66 196 L174 196 L174 118 L196 176 L218 170 L192 80 L170 70 Z" fill="${c}" ${S}/>
      <path d="M92 64 Q120 18 148 64 Q146 96 120 102 Q94 96 92 64 Z" fill="${d}" ${S}/>
      <path d="M100 66 Q120 40 140 66 Q138 88 120 92 Q102 88 100 66 Z" fill="${shade(d, -0.35)}" ${S}/>
      <path d="M66 186 L174 186" ${S}/><path d="M112 96 L110 124 M128 96 L130 124" ${S}/>
      ${logo(96, 128, 48, 30)}`,
    zoodie: (c, d) => `
      <path d="M70 70 L48 80 L22 190 L44 196 L66 118 L66 240 L174 240 L174 118 L196 196 L218 190 L192 80 L170 70 Z" fill="${c}" ${S}/>
      <path d="M92 64 Q120 18 148 64 Q146 96 120 102 Q94 96 92 64 Z" fill="${d}" ${S}/>
      <path d="M100 66 Q120 40 140 66 Q138 88 120 92 Q102 88 100 66 Z" fill="${shade(d, -0.35)}" ${S}/>
      <path d="M120 100 L120 240" stroke="#1a1a1a" stroke-width="3"/><path d="M120 100 L120 240" stroke="#bbb" stroke-width="1.2" stroke-dasharray="2 2"/>
      <path d="M78 196 L104 196 M136 196 L162 196" ${S}/><path d="M66 232 L174 232" ${S}/>
      ${logo(134, 128, 30, 22)}`,
    cropZoodie: (c, d) => `
      <path d="M70 70 L48 80 L22 170 L44 176 L66 118 L66 196 L174 196 L174 118 L196 176 L218 170 L192 80 L170 70 Z" fill="${c}" ${S}/>
      <path d="M92 64 Q120 18 148 64 Q146 96 120 102 Q94 96 92 64 Z" fill="${d}" ${S}/>
      <path d="M100 66 Q120 40 140 66 Q138 88 120 92 Q102 88 100 66 Z" fill="${shade(d, -0.35)}" ${S}/>
      <path d="M120 100 L120 196" stroke="#1a1a1a" stroke-width="3"/><path d="M66 186 L174 186" ${S}/>
      ${logo(134, 124, 30, 22)}`,
    cropSweat: (c, d) => `
      <path d="M78 58 L48 72 L22 170 L44 176 L66 118 L66 196 L174 196 L174 118 L196 176 L218 170 L192 72 L162 58 Q120 74 78 58 Z" fill="${c}" ${S}/>
      <path d="M92 52 L148 52 L150 66 Q120 78 90 66 Z" fill="${d}" ${S}/>
      <path d="M120 66 L120 110" stroke="#1a1a1a" stroke-width="3"/><circle cx="120" cy="110" r="3" fill="#1a1a1a"/>
      <path d="M66 186 L174 186" ${S}/>
      ${logo(96, 124, 48, 30)}`,
    tee: (c, d) => `
      <path d="M84 50 L48 66 L24 112 L52 126 L68 104 L68 236 L172 236 L172 104 L188 126 L216 112 L192 66 L156 50 Q120 76 84 50 Z" fill="${c}" ${S}/>
      <path d="M84 50 Q120 76 156 50" fill="none" ${S}/><path d="M92 52 Q120 70 148 52" fill="none" ${S}/>
      ${logo(96, 110, 48, 34)}`,
    cropTop: (c, d) => `
      <path d="M90 40 Q84 70 68 92 L64 170 L176 170 L172 92 Q156 70 150 40 Q138 70 120 72 Q102 70 90 40 Z" fill="${c}" ${S}/>
      <path d="M64 156 L176 156" ${S}/>
      ${logo(98, 104, 44, 28)}`,
    sportsBra: (c, d) => `
      <path d="M88 40 Q86 74 70 96 L68 160 L172 160 L170 96 Q154 74 152 40 L140 40 Q134 84 120 90 Q106 84 100 40 Z" fill="${c}" ${S}/>
      <path d="M68 138 L172 138" ${S}/><path d="M68 150 L172 150" stroke="${d}" stroke-width="6"/>
      ${logo(102, 104, 36, 22)}`,
    leggings: (c, d) => `
      <path d="M72 34 L168 34 L172 60 L162 250 L130 250 L122 104 L118 104 L110 250 L78 250 L68 60 Z" fill="${c}" ${S}/>
      <path d="M72 34 L168 34 L169 52 L71 52 Z" fill="${d}" ${S}/>
      ${logo(80, 66, 32, 20)}`,
    joggers: (c, d) => `
      <path d="M70 34 L170 34 L178 70 L168 236 L132 236 L122 106 L118 106 L108 236 L72 236 L62 70 Z" fill="${c}" ${S}/>
      <path d="M70 34 L170 34 L171 52 L69 52 Z" fill="${d}" ${S}/>
      <path d="M72 228 L108 228 L108 250 L72 250 Z M132 228 L168 228 L168 250 L132 250 Z" fill="${d}" ${S}/>
      <path d="M112 52 L108 72 M128 52 L132 72" ${S}/>
      ${logo(78, 70, 30, 20)}`,
    leotard: (c, d) => `
      <path d="M96 30 L84 30 Q86 70 76 96 Q72 130 90 176 L112 214 L128 214 L150 176 Q168 130 164 96 Q154 70 156 30 L144 30 Q140 70 120 74 Q100 70 96 30 Z" fill="${c}" ${S}/>
      <path d="M96 30 L120 18 L144 30" fill="none" ${S}/>
      ${logo(100, 112, 40, 26)}`,
    bag: (c, d) => `
      <path d="M86 70 Q86 30 120 30 Q154 30 154 70" fill="none" stroke="#1a1a1a" stroke-width="7"/>
      <path d="M86 70 Q86 30 120 30 Q154 30 154 70" fill="none" stroke="${d}" stroke-width="4"/>
      <path d="M50 70 L190 70 L200 232 L40 232 Z" fill="${c}" ${S}/>
      <path d="M44 120 L196 120" ${S}/>
      ${logo(92, 150, 56, 36)}`,
    shorts: (c, d) => `
      <path d="M64 70 L176 70 L190 184 L130 194 L120 128 L110 194 L50 184 Z" fill="${c}" ${S}/>
      <path d="M64 70 L176 70 L177 92 L63 92 Z" fill="${d}" ${S}/>
      ${logo(72, 104, 38, 24)}`,
    gymsac: (c, d) => `
      <path d="M66 44 L174 44 L178 234 L62 234 Z" fill="${c}" ${S}/>
      <path d="M66 58 L174 58" ${S}/>
      <path d="M70 50 Q60 150 64 230 M170 50 Q180 150 176 230" fill="none" stroke="${d}" stroke-width="4"/>
      ${logo(88, 100, 64, 44)}`,
    shoeBag: (c, d) => `
      <path d="M78 74 L162 74 L166 226 L74 226 Z" fill="${c}" ${S}/>
      <path d="M78 88 L162 88" ${S}/>
      <path d="M100 74 Q120 40 140 74" fill="none" stroke="${d}" stroke-width="4"/>
      ${logo(94, 128, 52, 36)}`,
    barrel: (c, d) => `
      <path d="M92 104 Q92 62 120 62 Q148 62 148 104" fill="none" stroke="#1a1a1a" stroke-width="7"/>
      <path d="M92 104 Q92 62 120 62 Q148 62 148 104" fill="none" stroke="${d}" stroke-width="4"/>
      <rect x="34" y="100" width="172" height="120" rx="58" fill="${c}" ${S}/>
      <path d="M58 104 Q44 160 58 216 M182 104 Q196 160 182 216" fill="none" stroke="${d}" stroke-width="6"/>
      ${logo(84, 138, 72, 42)}`,
    holdall: (c, d) => `
      <path d="M84 104 Q84 64 120 64 Q156 64 156 104" fill="none" stroke="#1a1a1a" stroke-width="7"/>
      <path d="M84 104 Q84 64 120 64 Q156 64 156 104" fill="none" stroke="${d}" stroke-width="4"/>
      <path d="M30 104 L210 104 Q222 104 220 118 L214 216 Q212 226 200 226 L40 226 Q28 226 26 216 L20 118 Q18 104 30 104 Z" fill="${c}" ${S}/>
      <path d="M22 132 L218 132" ${S}/>
      ${logo(80, 150, 80, 44)}`,
    tracksuit: (c, d) => `
      <g transform="translate(-6 8) scale(.62)">
        <path d="M78 58 L48 72 L22 190 L44 196 L66 118 L66 240 L174 240 L174 118 L196 196 L218 190 L192 72 L162 58 L140 50 L120 70 L100 50 Z" fill="${c}" ${S}/>
        <path d="M48 72 L22 190 L32 193 L58 76 Z M192 72 L218 190 L208 193 L182 76 Z" fill="${d}"/>
        <path d="M100 50 L120 70 L140 50 L150 30 L90 30 Z" fill="${d}" ${S}/>
        <path d="M120 70 L120 240" stroke="#1a1a1a" stroke-width="3"/><path d="M66 228 L174 228" ${S}/>
        ${logo(134, 104, 30, 22)}</g>
      <g transform="translate(112 34) scale(.6)">
        <path d="M70 34 L170 34 L178 70 L168 236 L132 236 L122 106 L118 106 L108 236 L72 236 L62 70 Z" fill="${c}" ${S}/>
        <path d="M66 52 L60 70 L70 236 L80 236 Z M174 52 L180 70 L170 236 L160 236 Z" fill="${d}"/>
        <path d="M70 34 L170 34 L171 50 L69 50 Z" fill="${c}" ${S}/></g>`,

    trackJacket: (c, d) => `
      <path d="M78 58 L48 72 L22 190 L44 196 L66 118 L66 240 L174 240 L174 118 L196 196 L218 190 L192 72 L162 58 L140 50 L120 70 L100 50 Z" fill="${c}" ${S}/>
      <path d="M48 72 L22 190 L32 193 L58 76 Z M192 72 L218 190 L208 193 L182 76 Z" fill="${d}"/>
      <path d="M100 50 L120 70 L140 50 L150 30 L90 30 Z" fill="${d}" ${S}/>
      <path d="M120 70 L120 240" stroke="#1a1a1a" stroke-width="3"/><path d="M66 228 L174 228" ${S}/>
      ${logo(134, 104, 30, 22)}`,
  };
  const HOOD_BACK = (c, d) => `<path d="M88 72 Q84 22 120 20 Q156 22 152 72 Q120 84 88 72 Z" fill="${d}" ${S}/>`;
  const BACKS = {
    hoodie: (c, d) => `<path d="M70 70 L48 80 L22 190 L44 196 L66 118 L66 240 L174 240 L174 118 L196 196 L218 190 L192 80 L170 70 Z" fill="${c}" ${S}/>${HOOD_BACK(c, d)}<path d="M66 232 L174 232" ${S}/>`,
    zoodie: (c, d) => BACKS.hoodie(c, d),
    cropHoodie: (c, d) => `<path d="M70 70 L48 80 L22 170 L44 176 L66 118 L66 196 L174 196 L174 118 L196 176 L218 170 L192 80 L170 70 Z" fill="${c}" ${S}/>${HOOD_BACK(c, d)}<path d="M66 186 L174 186" ${S}/>`,
    cropZoodie: (c, d) => BACKS.cropHoodie(c, d),
    cropSweat: (c, d) => `<path d="M78 58 L48 72 L22 170 L44 176 L66 118 L66 196 L174 196 L174 118 L196 176 L218 170 L192 72 L162 58 Q120 64 78 58 Z" fill="${c}" ${S}/><path d="M90 54 Q120 60 150 54 L150 62 Q120 68 90 62 Z" fill="${d}" ${S}/><path d="M66 186 L174 186" ${S}/>`,
    tee: (c, d) => `<path d="M84 50 L48 66 L24 112 L52 126 L68 104 L68 236 L172 236 L172 104 L188 126 L216 112 L192 66 L156 50 Q120 60 84 50 Z" fill="${c}" ${S}/><path d="M90 52 Q120 60 150 52" fill="none" ${S}/>`,
    trackJacket: (c, d) => `<path d="M78 58 L48 72 L22 190 L44 196 L66 118 L66 240 L174 240 L174 118 L196 196 L218 190 L192 72 L162 58 Q120 64 78 58 Z" fill="${c}" ${S}/><path d="M48 72 L22 190 L32 193 L58 76 Z M192 72 L218 190 L208 193 L182 76 Z" fill="${d}"/><path d="M90 30 L150 30 L160 58 Q120 66 80 58 Z" fill="${d}" ${S}/><path d="M66 228 L174 228" ${S}/>`,
    shorts: (c, d) => `<path d="M64 70 L176 70 L190 184 L130 194 L120 128 L110 194 L50 184 Z" fill="${c}" ${S}/><path d="M64 70 L176 70 L177 92 L63 92 Z" fill="${d}" ${S}/>`,
    joggers: (c, d) => `<path d="M70 34 L170 34 L178 70 L168 236 L132 236 L122 106 L118 106 L108 236 L72 236 L62 70 Z" fill="${c}" ${S}/><path d="M70 34 L170 34 L171 52 L69 52 Z" fill="${d}" ${S}/><path d="M72 228 L108 228 L108 250 L72 250 Z M132 228 L168 228 L168 250 L132 250 Z" fill="${d}" ${S}/>`,
  };
  /* where a customer may place artwork, per shape and side, in drawing units (240 x 260) */
  window.PRINT_AREAS = {
    hoodie: { front: [74, 104, 92, 90], back: [72, 80, 96, 140] }, zoodie: { front: [128, 104, 40, 44], back: [72, 80, 96, 140] },
    cropHoodie: { front: [74, 104, 92, 74], back: [72, 80, 96, 98] }, cropZoodie: { front: [128, 104, 40, 40], back: [72, 80, 96, 98] },
    cropSweat: { front: [74, 116, 92, 64], back: [72, 68, 96, 110] }, tee: { front: [76, 70, 88, 150], back: [76, 64, 88, 156] },
    cropTop: { front: [78, 86, 84, 62], back: [78, 80, 84, 70] }, sportsBra: { front: [82, 96, 76, 38], back: [72, 100, 96, 50] },
    leggings: { front: [74, 56, 92, 50], back: [74, 34, 92, 70] }, joggers: { front: [66, 54, 108, 70], back: [66, 54, 108, 70] },
    bag: { front: [52, 76, 136, 150], back: [52, 76, 136, 150] }, shorts: { front: [60, 96, 120, 60], back: [66, 72, 108, 60] },
    gymsac: { front: [80, 72, 80, 150], back: [80, 72, 80, 150] }, shoeBag: { front: [86, 96, 68, 118], back: [86, 96, 68, 118] },
    barrel: { front: [66, 118, 108, 86], back: [66, 118, 108, 86] }, holdall: { front: [44, 138, 152, 78], back: [44, 138, 152, 78] }, trackJacket: { front: [128, 78, 40, 46], back: [72, 64, 96, 156] },
  };
  window.designShape = shape => shape === 'tracksuit' ? 'trackJacket' : shape;
  window.garmentSVG = function(shape, hex, opts = {}){
    const d = opts.accent || shade(hex, -0.18);
    const n = parseInt(hex.slice(1), 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    const fn = opts.back ? (BACKS[shape] || SHAPES[shape]) : (SHAPES[shape] || SHAPES.tee);
    let body = fn(hex, d).replace(/LOGOCOL/g, lum > 0.62 ? '#1a1a1a' : '#ffffff');
    if(opts.plain || opts.noLogo || opts.back) body = body.replace(/<g class="logo-zone">[\s\S]*?<\/g>/g, '');
    const cls = opts.noLogo ? ' class="nologo"' : '';
    return `<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.label || shape}"${cls}>${body}</svg>`;
  };
})();
