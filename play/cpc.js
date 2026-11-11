/* =====================================================================
   cpc.js – a small Amstrad CPC emulation for the browser
   Runs the original Locomotive BASIC listings of the 1kB games:
   screen (MODE 0/1/2, 27-colour palette, INK/PEN/PAPER/BORDER), text
   windows, PRINT/INPUT with control codes, graphics (PLOT/DRAW/TEST,
   TAG, XOR mode), SOUND with queue, EVERY/AFTER timers, INKEY with the
   CPC key numbers and a speed similar to the real machine.
   ===================================================================== */
(function () {
'use strict';

/* ---------- Hardware ---------- */
const HW = ['000000','000080','0000FF','800000','800080','8000FF','FF0000','FF0080','FF00FF',
  '008000','008080','0080FF','808000','808080','8080FF','FF8000','FF8080','FF80FF',
  '00FF00','00FF80','00FFFF','80FF00','80FF80','80FFFF','FFFF00','FFFF80','FFFFFF']
  .map(h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
const DEFAULT_INKS = [1, 24, 20, 6, 26, 0, 2, 8, 10, 12, 14, 16, 18, 22, 1, 16];
const SW = 640, SH = 200;                  // hi-res pixel grid (MODE 2 resolution)
const RATE = 1.0;                          // BASIC "work units" per millisecond (≈ CPC speed)

// physical key -> CPC key number
const KEYNUM = {
  ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, Numpad9: 3, Numpad6: 4, Numpad3: 5, NumpadEnter: 6, NumpadDecimal: 7,
  ArrowLeft: 8, AltLeft: 9, Numpad7: 10, Numpad8: 11, Numpad5: 12, Numpad1: 13, Numpad2: 14, Numpad0: 15,
  Delete: 16, BracketRight: 17, Enter: 18, Backslash: 22, ControlLeft: 23, ControlRight: 23,
  ShiftLeft: 21, ShiftRight: 21, Equal: 24, Minus: 25, BracketLeft: 26, KeyP: 27, Quote: 28, Semicolon: 29,
  Slash: 30, Period: 31, Digit0: 32, Digit9: 33, KeyO: 34, KeyI: 35, KeyL: 36, KeyK: 37, KeyM: 38, Comma: 39,
  Digit8: 40, Digit7: 41, KeyU: 42, KeyY: 43, KeyH: 44, KeyJ: 45, KeyN: 46, Space: 47,
  Digit6: 48, Digit5: 49, KeyR: 50, KeyT: 51, KeyG: 52, KeyF: 53, KeyB: 54, KeyV: 55,
  Digit4: 56, Digit3: 57, KeyE: 58, KeyW: 59, KeyS: 60, KeyD: 61, KeyC: 62, KeyX: 63,
  Digit1: 64, Digit2: 65, Escape: 66, KeyQ: 67, Tab: 68, KeyA: 69, CapsLock: 70, KeyZ: 71, Backspace: 79 };

/* ---------- Character set ----------
   The original CPC character set (chars 0-255, 8 bytes each, top row first). */
const CHARSET = (
  'ffc3c3c3c3c3c3ffffc0c0c0c0c0c0c018181818181818ff03030303030303ff0c18307e0c183000ffc3e7dbdbe7c3ff00010306cc7830003c66c3c3ff24e700' +
  '00003060ff60300000000c06ff060c0018181818db7e3c18183c7edb18181818185a3c99db7e3c1800033363fe6030003c66ffdbdbff663c3c66c3dbdbc3663c' +
  'ffc3c3ffc3c3c3ff3c7edbdbdfc3663c3c66c3dfdbdb7e3c3c66c3fbdbdb7e3c3c7edbdbfbc3663c0001331ece7b31007e666666666666e7030303ff03030300' +
  'ff663c18183c66ff18183c3c3c3c18183c666630180018003c66c3ffc3c3663cffdbdbdbfbc3c3ffffc3c3fbdbdbdbffffc3c3dfdbdbdbffffdbdbdbdfc3c3ff' +
  '000000000000000018181818180018006c6c6c00000000006c6cfe6cfe6c6c00183e583c1a7c180000c6cc183066c600386c3876dccc76001818300000000000' +
  '0c18303030180c0030180c0c0c18300000663cff3c6600000018187e1818000000000000001818300000007e000000000000000000181800060c183060c08000' +
  '7cc6ced6e6c67c001838181818187e003c66063c60667e003c66061c06663c001c3c6cccfe0c1e007e62607c06663c003c66607c66663c007e66060c18181800' +
  '3c66663c66663c003c66663e06663c00000018180018180000001818001818300c18306030180c0000007e00007e00006030180c183060003c66660c18001800' +
  '7cc6dededec07c00183c66667e666600fc66667c6666fc003c66c0c0c0663c00f86c6666666cf800fe6268786862fe00fe6268786860f0003c66c0c0ce663e00' +
  '6666667e666666007e18181818187e001e0c0c0ccccc7800e6666c786c66e600f06060606266fe00c6eefefed6c6c600c6e6f6decec6c600386cc6c6c66c3800' +
  'fc66667c6060f000386cc6c6dacc7600fc66667c6c66e6003c66603c06663c007e5a181818183c006666666666663c0066666666663c1800c6c6c6d6feeec600' +
  'c66c38386cc6c6006666663c18183c00fec68c183266fe003c30303030303c00c06030180c0602003c0c0c0c0c0c3c00183c7e181818180000000000000000ff' +
  '30180c00000000000000780c7ccc7600e0607c666666dc0000003c6660663c001c0c7ccccccc760000003c667e603c001c3630783030780000003e66663e067c' +
  'e0606c766666e6001800381818183c0006000e060666663ce060666c786ce6003818181818183c0000006cfed6d6c6000000dc666666660000003c6666663c00' +
  '0000dc66667c60f0000076cccc7c0c1e0000dc766060f00000003c603c067c0030307c3030361c000000666666663e0000006666663c18000000c6d6d6fe6c00' +
  '0000c66c386cc60000006666663e067c00007e4c18327e000e18187018180e0018181818181818007018180e1818700076dc000000000000cc33cc33cc33cc33' +
  '0000000000000000f0f0f0f0000000000f0f0f0f00000000ffffffff0000000000000000f0f0f0f0f0f0f0f0f0f0f0f00f0f0f0ff0f0f0f0fffffffff0f0f0f0' +
  '000000000f0f0f0ff0f0f0f00f0f0f0f0f0f0f0f0f0f0f0fffffffff0f0f0f0f00000000fffffffff0f0f0f0ffffffff0f0f0f0fffffffffffffffffffffffff' +
  '000000181800000018181818180000000000001f1f0000001818181f0f000000000000181818181818181818181818180000000f1f1818181818181f1f181818' +
  '000000f8f8000000181818f8f0000000000000ffff000000181818ffff000000000000f0f8181818181818f8f8181818000000ffff181818181818ffff181818' +
  '10386cc6000000000c1830000000000066660000000000003c6660f86066fe003844baa2ba4438007ef4f474343434001e30386c3818f00018180c0000000000' +
  '40c0444c541e040040c04c5244081e00e0106216ea0f02000018187e18187e001818007e001818000000007e060600001800183066663c001800181818181800' +
  '000073deccde73007cc6c6fcc6c6f8c00066663c66663c003c60603c66663c0000001e307c301e00386cc6fec66c380000c06030386cc60000006666667c6060' +
  '000000fe6c6c6c000000007ed8d8700003060c3c663c60c003060c66663c60c000e63c18386cc700000066c3dbdb7e00fec6603060c6fe00007cc6c6c66cee00' +
  '183060c080000000180c0603010000000000000103060c1800000080c0603018183c66c381000000180c060303060c1800000081c3663c18183060c0c0603018' +
  '183060c183060c18180c0683c1603018183c66c3c3663c18c3e77e3c3c7ee7c303070e1c3870e0c0c0e070381c0e0703cccc3333cccc3333aa55aa55aa55aa55' +
  'ffff0000000000000303030303030303000000000000ffffc0c0c0c0c0c0c0c0fffefcf8f0e0c080ff7f3f1f0f0703010103070f1f3f7fff80c0e0f0f8fcfeff' +
  'aa55aa55000000000a050a050a050a0500000000aa55aa55a050a050a050a050aa54a850a0408000aa552a150a0502010102050a152a55aa008040a050a854aa' +
  '7eff99ffbdc3ff7e7eff99ffc3bdff7e3838fefefe10380010387cfe7c3810006cfefefe7c38100010387cfefe103800003c66c3c3663c00003c7effff7e3c00' +
  '007e666666667e00007e7e7e7e7e7e000f070d78cccccc783c6666663c187e180c0c0c0c0c3c7c38181c1e1b1878f870995a24c3c3245a991038383838387cd6' +
  '183c7eff1818181818181818ff7e3c18103070ffff703010080c0effff0e0c080000183c7effff000000ffff7e3c180080e0f8fef8e08000020e3efe3e0e0200' +
  '3838927c10282828383810fe102844823838127c902824223838907c12284888003c183c3c3c18003cffff180c183018183c7e18187e3c18002466ff66240000'
).match(/../g).map(h => parseInt(h, 16));

/* ---------- Tokenizer ---------- */
const KEYWORDS = new Set(('PRINT INPUT IF THEN ELSE GOTO GOSUB RETURN FOR TO STEP NEXT WHILE WEND END STOP RUN DIM ' +
  'DEFINT DEFREAL DEFSTR LET REM CLS MODE INK BORDER PEN PAPER LOCATE SYMBOL AFTER SOUND ENT ENV PLOT PLOTR DRAW ' +
  'DRAWR MOVE MOVER TAG TAGOFF WINDOW CALL POKE RANDOMIZE DEG RAD EVERY DI EI FRAME ORIGIN CLG DATA READ RESTORE ' +
  'ON CLEAR ERASE SPEED KEY LINE AND OR XOR NOT MOD SPC TAB USING RND INT FIX ABS SGN SQR SIN COS TAN ATN LOG ' +
  'EXP CINT LEN ASC VAL CHR$ STR$ LEFT$ RIGHT$ MID$ UPPER$ LOWER$ SPACE$ STRING$ INKEY INKEY$ TEST TESTR REMAIN ' +
  'PI TIME XPOS YPOS POS VPOS PEEK INSTR MAX MIN JOY HEX$ BIN$ ROUND').split(' '));

function tokenize(text) {
  const t = []; let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c === '"') {
      let j = i + 1; while (j < text.length && text[j] !== '"') j++;
      t.push({ t: 'str', v: text.slice(i + 1, j) }); i = j + 1; continue;
    }
    if (c === "'") { t.push({ t: 'kw', v: 'REM' }); break; }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d*\.?\d*)(E[+-]?\d+)?/i.exec(text.slice(i));
      t.push({ t: 'num', v: parseFloat(m[0]) || 0 }); i += m[0].length || 1; continue;
    }
    if (c === '&') {
      let m = /^&X([01]+)/i.exec(text.slice(i));
      if (m) { t.push({ t: 'num', v: parseInt(m[1], 2) }); i += m[0].length; continue; }
      m = /^&H?([0-9A-F]+)/i.exec(text.slice(i));
      if (m) { t.push({ t: 'num', v: parseInt(m[1], 16) }); i += m[0].length; continue; }
    }
    if (/[A-Za-z]/.test(c)) {
      const m = /^[A-Za-z][A-Za-z0-9.]*[$%!]?/.exec(text.slice(i));
      let w = m[0], up = w.toUpperCase();
      // a keyword may be glued to the following text (e.g. "DRAWR-634"): take the longest keyword prefix
      if (!KEYWORDS.has(up)) {
        let kw = null;
        for (let k = up.length - 1; k >= 2; k--) if (KEYWORDS.has(up.slice(0, k)) && !/[A-Z]/.test(up[k] || '')) { kw = up.slice(0, k); break; }
        if (kw) { w = w.slice(0, kw.length); up = kw; }
      }
      i += w.length;
      if (KEYWORDS.has(up)) {
        t.push({ t: 'kw', v: up });
        if (up === 'REM') break;
        if (up === 'DATA') { t.push({ t: 'data', v: text.slice(i) }); break; }
      } else t.push({ t: 'id', v: w.toLowerCase() });
      continue;
    }
    const two = text.slice(i, i + 2);
    if (['<>', '<=', '>=', '=<', '=>'].includes(two)) { t.push({ t: 'op', v: two === '=<' ? '<=' : two === '=>' ? '>=' : two }); i += 2; continue; }
    t.push({ t: 'op', v: c }); i++;
  }
  return t;
}
function parseProgram(src) {
  const raw = src.replace(/\r/g, '').split('\n');
  const joined = [];
  for (const l of raw) {
    if (!l.trim()) continue;
    if (/^\s*\d+/.test(l)) joined.push(l.trim());
    else if (joined.length) joined[joined.length - 1] += ' ' + l.trim();   // wrapped listing line
  }
  return joined.map(l => {
    const m = /^(\d+)\s?(.*)$/.exec(l);
    return { num: +m[1], toks: tokenize(m[2]) };
  }).sort((a, b) => a.num - b.num);
}

class BasicError extends Error {}

/* =====================================================================
   The machine
   ===================================================================== */
class CPC {
  constructor(canvas, frame) {
    this.cv = canvas; this.frame = frame;
    this.ctx = canvas.getContext('2d');
    this.img = this.ctx.createImageData(SW, SH);
    this.fb = new Uint8Array(SW * SH);
    this.inks = DEFAULT_INKS.slice(); this.border = 1;
    this.mode = 1;
    this.keys = new Set(); this.keyBuf = [];
    this.symbols = {};
    this.dirty = true;
    this.audio = null; this.chanEnd = [0, 0, 0]; this.chanQueue = [[], [], []];
    this.setupInput();
    this.modeReset(1);
    requestAnimationFrame(() => this.render());
  }

  /* ---------- screen ---------- */
  get cols() { return [20, 40, 80][this.mode]; }
  get xs() { return [4, 2, 1][this.mode]; }      // hi-res columns per pixel
  get pmask() { return [15, 3, 1][this.mode]; }
  modeReset(m) {
    this.mode = m;
    this.fb.fill(0);
    this.streams = [];
    for (let s = 0; s < 8; s++) this.streams.push({ l: 1, r: this.cols, t: 1, b: 25, x: 1, y: 1, pen: 1, paper: 0, trans: false, pend: null });
    this.gx = 0; this.gy = 0; this.gpen = 1; this.gpaper = 0; this.gmode = 0; this.ox = 0; this.oy = 0;
    this.tag = false;
    this.dirty = true;
  }
  setPix(px, py, pen) {
    if (px < 0 || py < 0 || py >= SH) return;
    const xs = this.xs, o = py * SW + px * xs;
    if (px * xs >= SW) return;
    for (let k = 0; k < xs; k++) this.fb[o + k] = pen;
    this.dirty = true;
  }
  getPix(px, py) {
    if (px < 0 || py < 0 || py >= SH || px * this.xs >= SW) return -1;
    return this.fb[py * SW + px * this.xs];
  }
  // graphics: user coordinates (0..639, 0..399, origin bottom left)
  gpx(x) { return Math.floor((Math.round(x) + this.ox) / this.xs); }
  gpy(y) { return SH - 1 - Math.floor((Math.round(y) + this.oy) / 2); }
  gplot(px, py, pen) {
    const cur = this.getPix(px, py);
    if (cur < 0) return;
    pen &= this.pmask;
    let v = pen;
    if (this.gmode === 1) v = cur ^ pen; else if (this.gmode === 2) v = cur & pen; else if (this.gmode === 3) v = cur | pen;
    this.setPix(px, py, v);
  }
  gline(x0, y0, x1, y1, pen) {
    let px0 = this.gpx(x0), py0 = this.gpy(y0);
    const px1 = this.gpx(x1), py1 = this.gpy(y1);
    const dx = Math.abs(px1 - px0), dy = -Math.abs(py1 - py0);
    const sx = px0 < px1 ? 1 : -1, sy = py0 < py1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.gplot(px0, py0, pen);
      if (px0 === px1 && py0 === py1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; px0 += sx; }
      if (e2 <= dx) { err += dx; py0 += sy; }
    }
  }
  glyph(ch) {
    return this.symbols[ch] || CHARSET.slice(ch * 8, ch * 8 + 8);
  }
  drawCell(col, row, ch, pen, paper, trans) {
    const g = this.glyph(ch), px0 = (col - 1) * 8, py0 = (row - 1) * 8;
    for (let r = 0; r < 8; r++) for (let b = 0; b < 8; b++) {
      if ((g[r] << b) & 128) this.setPix(px0 + b, py0 + r, pen & this.pmask);
      else if (!trans) this.setPix(px0 + b, py0 + r, paper & this.pmask);
    }
  }
  tagChar(ch) {                             // TAG: character at the graphics cursor
    const g = this.glyph(ch), px0 = this.gpx(this.gx), py0 = this.gpy(this.gy);
    for (let r = 0; r < 8; r++) for (let b = 0; b < 8; b++) {
      if ((g[r] << b) & 128) this.gplot(px0 + b, py0 + r, this.gpen);
      else this.gplot(px0 + b, py0 + r, this.gpaper);
    }
    this.gx += 8 * this.xs;
  }
  scroll(s, dir) {
    const w = (s.r - s.l + 1) * 8 * this.xs, x0 = (s.l - 1) * 8 * this.xs;
    const rows = (s.b - s.t + 1) * 8, y0 = (s.t - 1) * 8;
    const line = (y) => this.fb.subarray((y0 + y) * SW + x0, (y0 + y) * SW + x0 + w);
    if (dir > 0) { for (let y = 0; y < rows - 8; y++) line(y).set(line(y + 8)); for (let y = rows - 8; y < rows; y++) line(y).fill(s.paper & this.pmask); }
    else { for (let y = rows - 1; y >= 8; y--) line(y).set(line(y - 8)); for (let y = 0; y < 8; y++) line(y).fill(s.paper & this.pmask); }
    this.dirty = true;
  }
  clsStream(s) {
    for (let r = s.t; r <= s.b; r++) {
      const y0 = (r - 1) * 8;
      for (let y = 0; y < 8; y++) this.fb.fill(s.paper & this.pmask, (y0 + y) * SW + (s.l - 1) * 8 * this.xs, (y0 + y) * SW + s.r * 8 * this.xs);
    }
    s.x = 1; s.y = 1; this.dirty = true;
  }
  validate(s) {
    const w = s.r - s.l + 1, h = s.b - s.t + 1;
    if (s.x > w) { s.x = 1; s.y++; }
    if (s.x < 1) { s.x = w; s.y--; }
    if (s.y > h) { this.scroll(s, 1); s.y = h; }
    if (s.y < 1) { this.scroll(s, -1); s.y = 1; }
  }
  // output of one character code to a stream (with control codes)
  out(si, code) {
    const s = this.streams[si];
    if (s.pend) {
      s.pend.args.push(code);
      if (s.pend.args.length < s.pend.n) return;
      const { op, args } = s.pend; s.pend = null;
      switch (op) {
        case 1: this.putc(si, args[0]); break;
        case 14: s.paper = args[0] & 15; break;
        case 15: s.pen = args[0] & 15; break;
        case 22: s.trans = !!(args[0] & 1); break;
        case 23: this.gmode = args[0] & 3; break;
        case 28: this.inks[args[0] & 15] = args[1] % 27; this.dirty = true; break;
        case 29: this.border = args[0] % 27; this.dirty = true; break;
        case 31: s.x = args[0]; s.y = args[1]; break;
      }
      return;
    }
    if (code < 32 && !this.tag) {
      const N = { 1: 1, 4: 1, 14: 1, 15: 1, 22: 1, 23: 1, 25: 9, 26: 4, 28: 3, 29: 2, 31: 2 };
      if (N[code]) { s.pend = { op: code, n: N[code], args: [] }; return; }
      switch (code) {
        case 7: this.beep(); break;
        case 8: s.x--; break;
        case 9: s.x++; break;
        case 10: s.y++; this.validate(s); break;
        case 11: s.y--; this.validate(s); break;
        case 12: this.clsStream(s); break;
        case 13: s.x = 1; break;
        case 24: { const p = s.pen; s.pen = s.paper; s.paper = p; break; }
        case 30: s.x = 1; s.y = 1; break;
      }
      return;
    }
    this.putc(si, code);
  }
  putc(si, code) {
    if (this.tag && si === 0) { this.tagChar(code); return; }
    const s = this.streams[si];
    this.validate(s);
    this.drawCell(s.l + s.x - 1, s.t + s.y - 1, code, s.pen, s.paper, s.trans);
    s.x++;
  }
  outStr(si, str) { for (let i = 0; i < str.length; i++) this.out(si, str.charCodeAt(i) & 255); }
  newline(si) { if (this.tag && si === 0) return; const s = this.streams[si]; s.x = 1; s.y++; this.validate(s); }

  render() {
    if (this.dirty) {
      this.dirty = false;
      const pal = this.inks.map(i => HW[i]);
      const d = this.img.data, fb = this.fb;
      for (let i = 0, j = 0; i < fb.length; i++, j += 4) { const p = pal[fb[i]]; d[j] = p[0]; d[j + 1] = p[1]; d[j + 2] = p[2]; d[j + 3] = 255; }
      this.ctx.putImageData(this.img, 0, 0);
      const b = HW[this.border];
      this.frame.style.background = `rgb(${b[0]},${b[1]},${b[2]})`;
    }
    requestAnimationFrame(() => this.render());
  }

  /* ---------- keyboard ---------- */
  setupInput() {
    const down = e => {
      this.initAudio();
      const k = KEYNUM[e.code];
      if (k !== undefined) this.keys.add(k);
      if (e.code === 'Enter') this.keys.add(6);
      let ch = null;
      if (e.key === 'Enter') ch = 13; else if (e.key === 'Backspace') ch = 127; else if (e.key === 'Escape') ch = 27;
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) ch = e.key.charCodeAt(0) & 255;
      if (ch !== null && this.keyBuf.length < 32) this.keyBuf.push(ch);
      if (e.key === 'Escape') this.breakReq = true;
      if (k !== undefined || ch !== null) e.preventDefault();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', e => { const k = KEYNUM[e.code]; if (k !== undefined) this.keys.delete(k); if (e.code === 'Enter') this.keys.delete(6); });
    window.addEventListener('blur', () => this.keys.clear());
    this.cv.addEventListener('pointerdown', () => { this.initAudio(); this.clicked = true; });
  }
  inkey(n) { return this.keys.has(n) ? (this.keys.has(21) ? 32 : 0) : -1; }

  /* ---------- sound ---------- */
  initAudio() {
    if (this.audio || !window.AudioContext) return;
    try { this.audio = new AudioContext(); } catch (_) { this.audio = null; }
  }
  beep() { this.sound(7, 239, 20, 12, 0); }
  // returns false when the queue of a channel is full (BASIC has to wait)
  sound(chans, period, dur, vol, noise) {
    const now = performance.now() / 1000;
    const list = [0, 1, 2].filter(c => chans & (1 << c));
    for (const c of list) {
      this.chanQueue[c] = this.chanQueue[c].filter(t => t > now);
      if (this.chanQueue[c].length >= 4) return false;
    }
    const len = Math.max(0.02, (dur > 0 ? dur : 20) / 100);
    for (const c of list) {
      const start = Math.max(now, this.chanEnd[c]);
      this.chanEnd[c] = start + len;
      this.chanQueue[c].push(start);
      this.play(start - now, len, period, vol, noise);
    }
    return true;
  }
  play(delay, len, period, vol, noise) {
    const a = this.audio;
    if (!a || vol <= 0) return;
    const t0 = a.currentTime + delay, g = a.createGain();
    g.gain.value = Math.min(15, vol) / 15 * 0.08;
    g.connect(a.destination);
    if (period > 0) {
      const o = a.createOscillator(); o.type = 'square';
      o.frequency.value = Math.min(20000, 125000 / period);
      o.connect(g); o.start(t0); o.stop(t0 + len);
    }
    if (noise > 0) {
      const n = Math.floor(a.sampleRate * len), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
      const hold = Math.max(1, noise);
      let v = 0; for (let i = 0; i < n; i++) { if (i % hold === 0) v = Math.random() * 2 - 1; ch[i] = v; }
      const src = a.createBufferSource(); src.buffer = buf;
      const ng = a.createGain(); ng.gain.value = 1.5; src.connect(ng); ng.connect(g);
      src.start(t0);
    }
  }
}

/* =====================================================================
   The BASIC interpreter
   ===================================================================== */
class Basic {
  constructor(m, src) {
    this.m = m;
    this.prog = parseProgram(src);
    this.lineIdx = new Map(this.prog.map((l, i) => [l.num, i]));
  }
  reset() {
    this.vars = new Map(); this.arrays = new Map(); this.intLetters = new Set();
    this.forStack = []; this.gosubStack = []; this.whileStack = [];
    this.li = 0; this.pos = 0; this.deg = false;
    this.timers = [null, null, null, null]; this.di = false; this.inIrq = 0;
    this.dataPtr = { li: 0, items: [], k: 0 };
    this.wait = null; this.ended = false;
  }
  start() { this.reset(); this.m.keyBuf = []; this.state = 'run'; }
  ticks() { return Math.floor(performance.now() / 20); }

  /* ---------- token cursor ---------- */
  peek() { return this.toks[this.p]; }
  next() { return this.toks[this.p++]; }
  isOp(v) { const t = this.peek(); return t && t.t === 'op' && t.v === v; }
  isKw(v) { const t = this.peek(); return t && t.t === 'kw' && t.v === v; }
  expectOp(v) { if (!this.isOp(v)) throw new BasicError('Syntax error'); this.p++; }
  atEnd() { const t = this.peek(); return !t || (t.t === 'op' && t.v === ':') || (t.t === 'kw' && t.v === 'ELSE'); }

  /* ---------- variables ---------- */
  isStr(name) { return name.endsWith('$'); }
  isInt(name) { return name.endsWith('%') || (!/[$!]$/.test(name) && this.intLetters.has(name[0])); }
  conv(name, v) {
    if (this.isStr(name)) { if (typeof v !== 'string') throw new BasicError('Type mismatch'); return v; }
    if (typeof v === 'string') throw new BasicError('Type mismatch');
    return this.isInt(name) ? cint(v) : v;
  }
  getVar(name) { return this.vars.has(name) ? this.vars.get(name) : (this.isStr(name) ? '' : 0); }
  array(name, n) {
    let a = this.arrays.get(name);
    if (!a) { a = this.dim(name, new Array(n).fill(10)); }
    return a;
  }
  dim(name, dims) {
    if (this.arrays.has(name)) throw new BasicError('Array already dimensioned');
    const size = dims.reduce((s, d) => s * (d + 1), 1);
    const a = { dims, data: new Array(size).fill(this.isStr(name) ? '' : 0) };
    this.arrays.set(name, a); return a;
  }
  index(a, idx) {
    if (idx.length !== a.dims.length) throw new BasicError('Subscript out of range');
    let o = 0;
    for (let k = 0; k < idx.length; k++) {
      const i = cint(idx[k]);
      if (i < 0 || i > a.dims[k]) throw new BasicError('Subscript out of range');
      o = o * (a.dims[k] + 1) + i;
    }
    return o;
  }
  // target of an assignment / INPUT / FOR
  lvalue() {
    const t = this.next();
    if (!t || t.t !== 'id') throw new BasicError('Syntax error');
    if (this.isOp('(')) {
      this.p++;
      const idx = [this.num(this.expr())];
      while (this.isOp(',')) { this.p++; idx.push(this.num(this.expr())); }
      this.expectOp(')');
      const a = this.array(t.v, idx.length), o = this.index(a, idx);
      return { name: t.v, set: v => { a.data[o] = this.conv(t.v, v); }, get: () => a.data[o] };
    }
    return { name: t.v, set: v => { this.vars.set(t.v, this.conv(t.v, v)); }, get: () => this.getVar(t.v) };
  }

  /* ---------- expressions ---------- */
  num(v) { if (typeof v === 'string') throw new BasicError('Type mismatch'); return v; }
  str(v) { if (typeof v !== 'string') throw new BasicError('Type mismatch'); return v; }
  expr() { return this.eXor(); }
  eXor() { let a = this.eOr(); while (this.isKw('XOR')) { this.p++; a = cint(this.num(a)) ^ cint(this.num(this.eOr())); } return a; }
  eOr() { let a = this.eAnd(); while (this.isKw('OR')) { this.p++; a = cint(this.num(a)) | cint(this.num(this.eAnd())); } return a; }
  eAnd() { let a = this.eNot(); while (this.isKw('AND')) { this.p++; a = cint(this.num(a)) & cint(this.num(this.eNot())); } return a; }
  eNot() { if (this.isKw('NOT')) { this.p++; return ~cint(this.num(this.eNot())); } return this.eRel(); }
  eRel() {
    let a = this.eAdd();
    for (;;) {
      const t = this.peek();
      if (!t || t.t !== 'op' || !['=', '<>', '<', '>', '<=', '>='].includes(t.v)) return a;
      this.p++;
      const b = this.eAdd();
      if ((typeof a === 'string') !== (typeof b === 'string')) throw new BasicError('Type mismatch');
      const r = { '=': a === b, '<>': a !== b, '<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b }[t.v];
      a = r ? -1 : 0;
    }
  }
  eAdd() {
    let a = this.eMod();
    for (;;) {
      if (this.isOp('+')) { this.p++; const b = this.eMod(); if (typeof a === 'string' || typeof b === 'string') a = this.str(a) + this.str(b); else a = a + b; }
      else if (this.isOp('-')) { this.p++; a = this.num(a) - this.num(this.eMod()); }
      else return a;
    }
  }
  eMod() { let a = this.eIdiv(); while (this.isKw('MOD')) { this.p++; const b = cint(this.num(this.eIdiv())); if (!b) throw new BasicError('Division by zero'); a = cint(this.num(a)) % b; } return a; }
  eIdiv() { let a = this.eMul(); while (this.isOp('\\')) { this.p++; const b = cint(this.num(this.eMul())); if (!b) throw new BasicError('Division by zero'); a = Math.trunc(cint(this.num(a)) / b); } return a; }
  eMul() {
    let a = this.eUnary();
    for (;;) {
      if (this.isOp('*')) { this.p++; a = this.num(a) * this.num(this.eUnary()); }
      else if (this.isOp('/')) { this.p++; const b = this.num(this.eUnary()); if (!b) throw new BasicError('Division by zero'); a = this.num(a) / b; }
      else return a;
    }
  }
  eUnary() {
    if (this.isOp('-')) { this.p++; return -this.num(this.eUnary()); }
    if (this.isOp('+')) { this.p++; return this.num(this.eUnary()); }
    return this.ePow();
  }
  ePow() { let a = this.atom(); while (this.isOp('^')) { this.p++; a = Math.pow(this.num(a), this.num(this.eUnaryPow())); } return a; }
  eUnaryPow() { if (this.isOp('-')) { this.p++; return -this.num(this.atom()); } return this.atom(); }
  args() {
    this.expectOp('(');
    const a = [];
    if (!this.isOp(')')) { a.push(this.expr()); while (this.isOp(',')) { this.p++; a.push(this.expr()); } }
    this.expectOp(')');
    return a;
  }
  atom() {
    const t = this.next();
    if (!t) throw new BasicError('Syntax error');
    if (t.t === 'num') return t.v;
    if (t.t === 'str') return t.v;
    if (t.t === 'op' && t.v === '(') { const v = this.expr(); this.expectOp(')'); return v; }
    if (t.t === 'id') {
      if (this.isOp('(')) {
        this.p--;
        return this.lvalue().get();
      }
      return this.getVar(t.v);
    }
    if (t.t === 'kw') return this.func(t.v);
    throw new BasicError('Syntax error');
  }
  func(f) {
    const m = this.m;
    const A = () => this.args();
    const n1 = () => this.num(A()[0]);
    const ang = v => this.deg ? v * Math.PI / 180 : v;
    switch (f) {
      case 'RND': if (this.isOp('(')) A(); return Math.random();
      case 'PI': return Math.PI;
      case 'TIME': return Math.floor(performance.now() * 0.3);
      case 'INT': return Math.floor(n1());
      case 'FIX': return Math.trunc(n1());
      case 'CINT': case 'ROUND': { const a = A(); return a.length > 1 ? Math.round(a[0] * 10 ** a[1]) / 10 ** a[1] : cint(a[0]); }
      case 'ABS': return Math.abs(n1());
      case 'SGN': return Math.sign(n1());
      case 'SQR': return Math.sqrt(n1());
      case 'SIN': return Math.sin(ang(n1()));
      case 'COS': return Math.cos(ang(n1()));
      case 'TAN': return Math.tan(ang(n1()));
      case 'ATN': { const v = Math.atan(n1()); return this.deg ? v * 180 / Math.PI : v; }
      case 'LOG': return Math.log(n1());
      case 'EXP': return Math.exp(n1());
      case 'LEN': return this.str(A()[0]).length;
      case 'ASC': { const s = this.str(A()[0]); if (!s) throw new BasicError('Improper argument'); return s.charCodeAt(0); }
      case 'VAL': return parseFloat(this.str(A()[0])) || 0;
      case 'CHR$': return String.fromCharCode(cint(n1()) & 255);
      case 'STR$': return fmtNum(n1());
      case 'HEX$': return cint(n1()).toString(16).toUpperCase();
      case 'BIN$': return cint(n1()).toString(2);
      case 'LEFT$': { const a = A(); return this.str(a[0]).slice(0, cint(a[1])); }
      case 'RIGHT$': { const a = A(); const s = this.str(a[0]); return s.slice(Math.max(0, s.length - cint(a[1]))); }
      case 'MID$': { const a = A(); const s = this.str(a[0]); const st = cint(a[1]) - 1; return a.length > 2 ? s.substr(st, cint(a[2])) : s.slice(st); }
      case 'UPPER$': return this.str(A()[0]).toUpperCase();
      case 'LOWER$': return this.str(A()[0]).toLowerCase();
      case 'SPACE$': return ' '.repeat(Math.max(0, cint(n1())));
      case 'STRING$': { const a = A(); const c = typeof a[1] === 'string' ? a[1][0] || '' : String.fromCharCode(cint(a[1]) & 255); return c.repeat(Math.max(0, cint(a[0]))); }
      case 'INSTR': { const a = A(); if (a.length === 3) return this.str(a[1]).indexOf(this.str(a[2]), cint(a[0]) - 1) + 1; return this.str(a[0]).indexOf(this.str(a[1])) + 1; }
      case 'MAX': return Math.max(...A().map(v => this.num(v)));
      case 'MIN': return Math.min(...A().map(v => this.num(v)));
      case 'INKEY': return m.inkey(cint(n1()));
      case 'INKEY$': { const c = m.keyBuf.shift(); return c === undefined ? '' : String.fromCharCode(c); }
      case 'JOY': A(); return 0;
      case 'PEEK': A(); return 0;
      case 'TEST': { const a = A(); m.gx = this.num(a[0]); m.gy = this.num(a[1]); this.cost += 1; return Math.max(0, m.getPix(m.gpx(m.gx), m.gpy(m.gy))); }
      case 'TESTR': { const a = A(); m.gx += this.num(a[0]); m.gy += this.num(a[1]); this.cost += 1; return Math.max(0, m.getPix(m.gpx(m.gx), m.gpy(m.gy))); }
      case 'XPOS': return m.gx;
      case 'YPOS': return m.gy;
      case 'POS': { this.expectOp('('); this.expectOp('#'); const s = cint(this.num(this.expr())); this.expectOp(')'); return m.streams[s].x; }
      case 'VPOS': { this.expectOp('('); this.expectOp('#'); const s = cint(this.num(this.expr())); this.expectOp(')'); return m.streams[s].y; }
      case 'REMAIN': { const n = cint(n1()); const t = this.timers[n]; this.timers[n] = null; return t ? Math.max(0, t.due - this.ticks()) : 0; }
    }
    throw new BasicError('Syntax error');
  }

  /* ---------- flow ---------- */
  gotoLine(n) {
    const i = this.lineIdx.get(cint(n));
    if (i === undefined) throw new BasicError('Line does not exist');
    this.li = i; this.pos = 0; this.jumped = true;
  }
  // skips forward to the matching keyword (NEXT for FOR, WEND for WHILE)
  skipTo(open, close) {
    let depth = 0, li = this.li, p = this.p;
    while (li < this.prog.length) {
      const toks = this.prog[li].toks;
      for (; p < toks.length; p++) {
        const t = toks[p];
        if (t.t !== 'kw') continue;
        if (t.v === open) depth++;
        else if (t.v === close) {
          if (depth === 0) { this.li = li; this.toks = toks; this.p = p + 1; this.pos = this.p; this.jumped = true; return; }
          depth--;
        }
      }
      li++; p = 0;
    }
    throw new BasicError(close === 'WEND' ? 'WHILE missing' : 'NEXT missing');
  }

  /* ---------- one statement ---------- */
  step() {
    const prog = this.prog;
    for (;;) {
      if (this.li >= prog.length) { this.endProgram(); return; }
      const toks = prog[this.li].toks;
      while (this.pos < toks.length && toks[this.pos].t === 'op' && toks[this.pos].v === ':') this.pos++;
      if (this.pos >= toks.length) { this.li++; this.pos = 0; continue; }
      break;
    }
    // timer interrupts (EVERY / AFTER) between statements
    if (!this.di && !this.inIrq) {
      const now = this.ticks();
      for (let n = 3; n >= 0; n--) {
        const t = this.timers[n];
        if (t && now >= t.due) {
          if (t.every) t.due += t.every; else this.timers[n] = null;
          this.gosubStack.push({ li: this.li, pos: this.pos, irq: true });
          this.inIrq++;
          this.gotoLine(t.line);
          this.cost += 2;
          return;
        }
      }
    }
    this.toks = prog[this.li].toks; this.p = this.pos;
    const start = this.p;
    this.jumped = false;
    this.statement();
    this.cost += 1 + 0.08 * (this.p - start);
    if (this.jumped || this.wait) { if (this.wait && !this.jumped) this.pos = this.p; return; }
    // after the statement: ":" or end of line or ELSE (= end of the THEN branch)
    const t = this.toks[this.p];
    if (t && t.t === 'kw' && t.v === 'ELSE') { this.li++; this.pos = 0; return; }
    if (t && !(t.t === 'op' && t.v === ':')) throw new BasicError('Syntax error');
    this.pos = this.p;
  }
  statement() {
    const t = this.next(), m = this.m;
    if (t.t === 'id') { this.p--; const lv = this.lvalue(); this.expectOp('='); lv.set(this.expr()); return; }
    if (t.t !== 'kw') throw new BasicError('Syntax error');
    const I = () => cint(this.num(this.expr()));
    const N = () => this.num(this.expr());
    const stream = () => { if (this.isOp('#')) { this.p++; const s = I(); if (this.isOp(',')) this.p++; return s & 7; } return 0; };
    const opt = () => { if (this.isOp(',')) { this.p++; if (this.isOp(',') || this.atEnd()) return undefined; return N(); } return undefined; };
    switch (t.v) {
      case 'REM': this.p = this.toks.length; return;
      case 'LET': { const lv = this.lvalue(); this.expectOp('='); lv.set(this.expr()); return; }
      case 'PRINT': return this.print();
      case 'INPUT': return this.input();
      case 'IF': return this.ifStmt();
      case 'ELSE': this.p = this.toks.length; return;
      case 'GOTO': return this.gotoLine(this.next().v);
      case 'GOSUB': { const n = this.next().v; this.gosubStack.push({ li: this.li, pos: this.p }); return this.gotoLine(n); }
      case 'RETURN': {
        const r = this.gosubStack.pop();
        if (!r) throw new BasicError('Unexpected RETURN');
        if (r.irq) this.inIrq--;
        this.li = r.li; this.pos = r.pos; this.jumped = true;
        // continue after the GOSUB statement (or at the interrupted statement)
        if (!r.irq) { this.toks = this.prog[this.li].toks; this.p = r.pos; this.skipStatement(); this.pos = this.p; }
        return;
      }
      case 'FOR': {
        const lv = this.lvalue(); this.expectOp('=');
        lv.set(this.expr());
        if (!this.isKw('TO')) throw new BasicError('Syntax error');
        this.p++;
        const end = N(); let stp = 1;
        if (this.isKw('STEP')) { this.p++; stp = N(); }
        this.forStack = this.forStack.filter(f => f.name !== lv.name);
        const v = lv.get();
        if (stp >= 0 ? v > end : v < end) { this.skipTo('FOR', 'NEXT'); while (!this.atEnd()) this.p++; this.pos = this.p; return; }
        this.forStack.push({ name: lv.name, lv, end, stp, li: this.li, pos: this.p });
        return;
      }
      case 'NEXT': {
        do {
          if (this.isOp(',')) this.p++;
          let f;
          if (!this.atEnd()) {
            const name = this.next().v;
            while (this.forStack.length && this.forStack[this.forStack.length - 1].name !== name) this.forStack.pop();
          }
          f = this.forStack[this.forStack.length - 1];
          if (!f) throw new BasicError('Unexpected NEXT');
          const v = f.lv.get() + f.stp; f.lv.set(v);
          if (f.stp >= 0 ? f.lv.get() <= f.end : f.lv.get() >= f.end) {
            this.li = f.li; this.pos = f.pos; this.jumped = true; return;
          }
          this.forStack.pop();
        } while (this.isOp(','));
        return;
      }
      case 'WHILE': {
        const at = { li: this.li, pos: this.p - 1 };
        const c = N();
        if (c) { const top = this.whileStack[this.whileStack.length - 1]; if (!top || top.li !== at.li || top.pos !== at.pos) this.whileStack.push(at); }
        else { const top = this.whileStack[this.whileStack.length - 1]; if (top && top.li === at.li && top.pos === at.pos) this.whileStack.pop(); this.skipTo('WHILE', 'WEND'); }
        return;
      }
      case 'WEND': {
        const w = this.whileStack[this.whileStack.length - 1];
        if (!w) throw new BasicError('Unexpected WEND');
        this.li = w.li; this.pos = w.pos; this.jumped = true; return;
      }
      case 'END': case 'STOP': this.endProgram(); this.jumped = true; return;
      case 'RUN': this.reset(); this.jumped = true; return;
      case 'DIM': {
        do {
          if (this.isOp(',')) this.p++;
          const name = this.next().v; this.expectOp('(');
          const dims = [I()]; while (this.isOp(',')) { this.p++; dims.push(I()); }
          this.expectOp(')'); this.dim(name, dims);
        } while (this.isOp(','));
        return;
      }
      case 'DEFINT': case 'DEFREAL': case 'DEFSTR': {
        do {
          if (this.isOp(',')) this.p++;
          const a = this.next().v[0]; let b = a;
          if (this.isOp('-')) { this.p++; b = this.next().v[0]; }
          for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) { const l = String.fromCharCode(c); if (t.v === 'DEFINT') this.intLetters.add(l); else this.intLetters.delete(l); }
        } while (this.isOp(','));
        return;
      }
      case 'CLS': { const s = this.isOp('#') ? (this.p++, I()) : 0; m.clsStream(m.streams[s]); this.cost += 3; return; }
      case 'CLG': m.fb.fill(m.gpaper & m.pmask); m.dirty = true; return;
      case 'MODE': m.modeReset(I() % 3); this.cost += 5; return;
      case 'INK': { const p = I(); this.expectOp(','); const c = I(); opt(); m.inks[p & 15] = ((c % 27) + 27) % 27; m.dirty = true; return; }
      case 'BORDER': { const c = I(); opt(); m.border = ((c % 27) + 27) % 27; m.dirty = true; return; }
      case 'PEN': { const s = stream(); m.streams[s].pen = I() & 15; return; }
      case 'PAPER': { const s = stream(); m.streams[s].paper = I() & 15; return; }
      case 'LOCATE': { const s = stream(); const x = I(); this.expectOp(','); const y = I(); m.streams[s].x = x; m.streams[s].y = y; return; }
      case 'WINDOW': {
        const s = stream(); const l = I(); this.expectOp(','); const r = I(); this.expectOp(','); const tp = I(); this.expectOp(','); const b = I();
        Object.assign(m.streams[s], { l: Math.min(l, r), r: Math.max(l, r), t: Math.min(tp, b), b: Math.max(tp, b), x: 1, y: 1 });
        return;
      }
      case 'SYMBOL': {
        if (this.isKw('AFTER')) { this.p++; I(); return; }
        const c = I(); const rows = [];
        while (this.isOp(',')) { this.p++; rows.push(I() & 255); }
        while (rows.length < 8) rows.push(0);
        m.symbols[c] = rows; return;
      }
      case 'TAG': if (this.isOp('#')) { this.p++; I(); } m.tag = true; return;
      case 'TAGOFF': if (this.isOp('#')) { this.p++; I(); } m.tag = false; return;
      case 'MOVE': { m.gx = N(); this.expectOp(','); m.gy = N(); opt(); return; }
      case 'MOVER': { m.gx += N(); this.expectOp(','); m.gy += N(); opt(); return; }
      case 'PLOT': case 'PLOTR': case 'DRAW': case 'DRAWR': {
        let x = N(); this.expectOp(','); let y = N();
        const ink = opt(); const gm = opt();
        if (ink !== undefined) m.gpen = cint(ink);
        if (gm !== undefined) m.gmode = cint(gm) & 3;
        if (t.v === 'PLOTR' || t.v === 'DRAWR') { x += m.gx; y += m.gy; }
        if (t.v.startsWith('PLOT')) m.gplot(m.gpx(x), m.gpy(y), m.gpen);
        else { m.gline(m.gx, m.gy, x, y, m.gpen); this.cost += Math.max(Math.abs(x - m.gx), Math.abs(y - m.gy)) / 200; }
        m.gx = x; m.gy = y; this.cost += 1;
        return;
      }
      case 'ORIGIN': { m.ox = I(); this.expectOp(','); m.oy = I(); while (this.isOp(',')) { this.p++; I(); } m.gx = 0; m.gy = 0; return; }
      case 'SOUND': {
        const a = [I()];
        while (this.isOp(',')) { this.p++; a.push(this.isOp(',') || this.atEnd() ? undefined : I()); }
        const chans = a[0] & 7, period = a[1] ?? 0, dur = a[2] ?? 20, vol = a[3] ?? 12, noise = a[6] ?? 0;
        if (!m.sound(chans, period, dur, vol, noise)) {        // queue full: wait and repeat the statement
          this.p = this.pos; this.wait = { type: 'sound' };
        }
        return;
      }
      case 'ENT': case 'ENV': case 'POKE': case 'SPEED': case 'KEY': case 'ERASE':
        while (!this.atEnd()) this.p++; return;
      case 'RANDOMIZE': if (!this.atEnd()) N(); return;
      case 'DEG': this.deg = true; return;
      case 'RAD': this.deg = false; return;
      case 'DI': this.di = true; return;
      case 'EI': this.di = false; return;
      case 'FRAME': this.wait = { type: 'frame', until: this.ticks() + 1 }; return;
      case 'EVERY': case 'AFTER': {
        const time = I(); let n = 0;
        if (this.isOp(',')) { this.p++; n = I(); }
        if (!this.isKw('GOSUB')) throw new BasicError('Syntax error');
        this.p++; const line = this.next().v;
        this.timers[n & 3] = { due: this.ticks() + time, every: t.v === 'EVERY' ? time : 0, line };
        return;
      }
      case 'CALL': {
        const a = I(); while (this.isOp(',')) { this.p++; this.expr(); }
        if (a === 0xBC02) { m.inks = DEFAULT_INKS.slice(); m.border = 1; m.dirty = true; }
        else if (a === 0xBD19) this.wait = { type: 'frame', until: this.ticks() + 1 };
        else if (a === 0xBB00 || a === 0xBB03) m.keyBuf = [];
        else if (a === 0xBB18 || a === 0xBB06) this.wait = { type: 'key' };
        return;
      }
      case 'DATA': this.p = this.toks.length; return;
      case 'RESTORE': { this.dataPtr = { li: this.atEnd() ? 0 : this.lineIdx.get(I()) ?? 0, items: [], k: 0 }; return; }
      case 'READ': {
        do {
          if (this.isOp(',')) this.p++;
          const lv = this.lvalue(); const v = this.readData();
          lv.set(this.isStr(lv.name) ? v : (parseFloat(v) || 0));
        } while (this.isOp(','));
        return;
      }
      case 'ON': {
        const v = I();
        const kind = this.next().v; const targets = [this.next().v];
        while (this.isOp(',')) { this.p++; targets.push(this.next().v); }
        if (v >= 1 && v <= targets.length) {
          if (kind === 'GOSUB') this.gosubStack.push({ li: this.li, pos: this.p });
          this.gotoLine(targets[v - 1]);
        }
        return;
      }
      case 'CLEAR': this.vars.clear(); this.arrays.clear(); return;
    }
    throw new BasicError('Syntax error');
  }
  skipStatement() {
    // moves the cursor behind the current statement (used after RETURN)
    let depthParen = 0;
    while (this.p < this.toks.length) {
      const t = this.toks[this.p];
      if (t.t === 'op' && t.v === '(') depthParen++;
      if (t.t === 'op' && t.v === ')') depthParen--;
      if (depthParen <= 0 && ((t.t === 'op' && t.v === ':') || (t.t === 'kw' && t.v === 'ELSE'))) break;
      this.p++;
    }
    const t = this.toks[this.p];
    if (t && t.t === 'kw' && t.v === 'ELSE') { this.li++; this.p = 0; this.toks = this.prog[this.li] ? this.prog[this.li].toks : []; this.jumped = true; }
  }
  readData() {
    const d = this.dataPtr;
    while (d.k >= d.items.length) {
      let found = false;
      for (; d.li < this.prog.length; d.li++) {
        const toks = this.prog[d.li].toks;
        const i = toks.findIndex(t => t.t === 'data');
        if (i >= 0) { d.items = toks[i].v.split(',').map(s => s.trim().replace(/^"|"$/g, '')); d.k = 0; d.li++; found = true; break; }
      }
      if (!found) throw new BasicError('DATA exhausted');
    }
    return d.items[d.k++];
  }
  ifStmt() {
    const c = this.num(this.expr());
    let thenGoto = false;
    if (this.isKw('THEN')) this.p++;
    else if (this.isKw('GOTO')) { this.p++; thenGoto = true; }
    else throw new BasicError('Syntax error');
    if (c) {
      const t = this.peek();
      if (t && t.t === 'num') { this.gotoLine(t.v); return; }
      if (thenGoto) throw new BasicError('Syntax error');
      this.pos = this.p; this.jumped = true;    // continue with the statements after THEN
      return;
    }
    // false: find the matching ELSE in this line
    let depth = 0;
    for (let p = this.p; p < this.toks.length; p++) {
      const t = this.toks[p];
      if (t.t !== 'kw') continue;
      if (t.v === 'IF') depth++;
      else if (t.v === 'ELSE') {
        if (depth === 0) {
          const n = this.toks[p + 1];
          if (n && n.t === 'num') { this.gotoLine(n.v); return; }
          this.p = p + 1; this.pos = this.p; this.jumped = true; return;
        }
        depth--;
      }
    }
    this.li++; this.pos = 0; this.jumped = true;
  }
  print() {
    const m = this.m;
    let si = 0;
    if (this.isOp('#')) { this.p++; si = cint(this.num(this.expr())) & 7; if (this.isOp(',')) this.p++; }
    let newline = true;
    while (!this.atEnd()) {
      newline = true;
      if (this.isOp(';')) { this.p++; newline = false; continue; }
      if (this.isOp(',')) {
        this.p++; newline = false;
        const s = m.streams[si], w = s.r - s.l + 1;
        const nx = Math.floor((s.x - 1) / 13 + 1) * 13 + 1;
        if (nx + 1 > w) m.newline(si); else s.x = nx;
        continue;
      }
      if (this.isKw('SPC')) { this.p++; this.expectOp('('); const n = cint(this.num(this.expr())); this.expectOp(')'); m.outStr(si, ' '.repeat(Math.max(0, n))); newline = false; continue; }
      if (this.isKw('TAB')) { this.p++; this.expectOp('('); const n = cint(this.num(this.expr())); this.expectOp(')'); const s = m.streams[si]; if (s.x > n) m.newline(si); while (s.x < n) m.out(si, 32); newline = false; continue; }
      if (this.isKw('USING')) { this.p++; this.expr(); this.expectOp(';'); }
      const v = this.expr();
      const s = typeof v === 'string' ? v : fmtNum(v) + ' ';
      m.outStr(si, s);
      this.cost += s.length * 0.06;
      if (this.isOp(';') || this.isOp(',')) continue;
      newline = true;
    }
    if (newline) m.newline(si);
  }
  input() {
    const m = this.m;
    let si = 0;
    if (this.isOp('#')) { this.p++; si = cint(this.num(this.expr())) & 7; if (this.isOp(',')) this.p++; }
    let noNl = false;
    if (this.isOp(';')) { this.p++; noNl = true; }
    let prompt = '? ';
    const t = this.peek();
    if (t && t.t === 'str') {
      this.p++;
      if (this.isOp(';')) { this.p++; prompt = t.v + '? '; }
      else { this.expectOp(','); prompt = t.v; }
    }
    const targets = [];
    const save = this.p;
    do { if (this.isOp(',')) this.p++; targets.push(this.lvalueInfo()); } while (this.isOp(','));
    this.p = save; do { if (this.isOp(',')) this.p++; this.lvalue(); } while (this.isOp(','));
    m.outStr(si, prompt);
    this.wait = { type: 'input', si, prompt, targets, buf: '', noNl, startPos: this.pos, stmtEnd: this.p };
  }
  lvalueInfo() { const name = this.toks[this.p].v; return name; }
  finishInput() {
    const w = this.wait, m = this.m;
    const parts = w.buf.split(',');
    const vals = [];
    let ok = parts.length >= w.targets.length;
    for (let k = 0; k < w.targets.length && ok; k++) {
      const name = w.targets[k], s = (parts[k] || '').trim();
      if (this.isStr(name)) vals.push(parts[k] ?? '');
      else { if (!/^[-+]?(\d+\.?\d*|\.\d+)(E[-+]?\d+)?$/i.test(s)) ok = false; else vals.push(parseFloat(s)); }
    }
    if (!w.noNl || !ok) m.newline(w.si);
    if (!ok) { m.outStr(w.si, '?Redo from start'); m.newline(w.si); m.outStr(w.si, w.prompt); w.buf = ''; return; }
    // assign by re-parsing the targets
    this.toks = this.prog[this.li].toks; this.p = w.startPos;
    while (!(this.isKw('INPUT'))) this.p++;
    this.p++;
    if (this.isOp('#')) { this.p++; this.expr(); if (this.isOp(',')) this.p++; }
    if (this.isOp(';')) this.p++;
    if (this.peek() && this.peek().t === 'str') { this.p += 2; }
    let k = 0;
    do { if (this.isOp(',')) this.p++; this.lvalue().set(vals[k++]); } while (this.isOp(','));
    this.pos = this.p;
    this.wait = null;
  }
  endProgram(msg) {
    const m = this.m;
    m.tag = false;
    const s = m.streams[0];
    if (s.x > 1) m.newline(0);
    if (msg) { m.outStr(0, msg); m.newline(0); }
    m.outStr(0, 'Ready'); m.newline(0);
    this.ended = true; this.wait = { type: 'ended' };
  }

  /* ---------- main loop ---------- */
  run() {
    let last = performance.now(), budget = 0, blink = 0;
    const loop = () => {
      const now = performance.now();
      budget = Math.min(budget + (now - last) * RATE, 60);
      last = now;
      const m = this.m;
      if (m.breakReq) {
        m.breakReq = false;
        if (!this.ended) { this.endProgram('Break in ' + (this.prog[this.li] ? this.prog[this.li].num : '')); m.keyBuf = []; }
      }
      // waiting states
      const w = this.wait;
      if (w) {
        if (w.type === 'ended') {
          const k = m.keyBuf.shift();
          if (k === 13 || k === 32 || m.clicked) { m.clicked = false; m.keyBuf = []; this.start(); }
        } else if (w.type === 'input') {
          const s = m.streams[w.si];
          while (m.keyBuf.length) {
            const k = m.keyBuf.shift();
            this.hideCursor(w);
            if (k === 13) { this.finishInput(); break; }
            else if (k === 127) { if (w.buf.length) { w.buf = w.buf.slice(0, -1); m.out(w.si, 8); m.out(w.si, 32); m.out(w.si, 8); } }
            else if (k >= 32 && w.buf.length < 255) { w.buf += String.fromCharCode(k); m.out(w.si, k); }
          }
          if (this.wait === w) { blink = (blink + 1) % 40; this.showCursor(w, blink < 20); }
        } else if (w.type === 'sound') { this.wait = null; }
        else if (w.type === 'frame') { if (this.ticks() >= w.until) this.wait = null; }
        else if (w.type === 'key') { if (m.keyBuf.length) { m.keyBuf.shift(); this.wait = null; } }
      }
      try {
        while (!this.wait && budget > 0) {
          this.cost = 0;
          this.step();
          budget -= this.cost;
        }
      } catch (e) {
        if (e instanceof BasicError) this.endProgram(e.message + ' in ' + (this.prog[this.li] ? this.prog[this.li].num : ''));
        else { console.error(e); this.endProgram('Error'); }
      }
      if (this.wait && this.wait.type === 'sound') budget = Math.min(budget, 0);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  showCursor(w, on) {
    const m = this.m, s = m.streams[w.si];
    const x = Math.min(s.x, s.r - s.l + 1), y = Math.min(Math.max(s.y, 1), s.b - s.t + 1);
    m.drawCell(s.l + x - 1, s.t + y - 1, on ? 143 : 32, s.pen, s.paper, false);
    w.cur = { col: s.l + x - 1, row: s.t + y - 1 };
  }
  hideCursor(w) { if (w.cur) { const s = this.m.streams[w.si]; this.m.drawCell(w.cur.col, w.cur.row, 32, s.pen, s.paper, false); w.cur = null; } }
}

function cint(v) { if (typeof v !== 'number') throw new BasicError('Type mismatch'); return v < 0 ? -Math.floor(-v + 0.5) : Math.floor(v + 0.5); }
function fmtNum(v) {
  let s;
  if (Number.isInteger(v) && Math.abs(v) < 1e9) s = String(Math.abs(v));
  else { s = Math.abs(v).toPrecision(9).replace(/\.?0+(?=$|E)/i, ''); if (s.includes('e')) s = s.toUpperCase(); if (s.startsWith('0.')) s = s.slice(1); }
  return (v < 0 ? '-' : ' ') + s;
}

/* =====================================================================
   Page setup
   ===================================================================== */
const CSS = `
:root { --bg:#111; --fg:#bbb; --dim:#777; }
html,body { margin:0; min-height:100%; background:var(--bg); color:var(--fg); font:13px/1.45 system-ui, sans-serif; }
body { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:16px; box-sizing:border-box; min-height:100vh; }
.cpc { padding:4.5% 5.5%; box-shadow:0 0 0 2px #333, 0 10px 40px #000; width:min(92vw, calc((100vh - 170px) * 1.35), 900px); box-sizing:border-box; }
.cpc canvas { display:block; width:100%; aspect-ratio:8/5; image-rendering:pixelated; image-rendering:crisp-edges; }
.info { color:var(--dim); text-align:center; max-width:900px; }
.info b { color:var(--fg); font-weight:600; }
.info kbd { border:1px solid #444; border-radius:3px; padding:0 4px; color:var(--fg); font:inherit; }
.info a { color:#8ab4ff; }
`;
function boot(opts) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const frame = document.createElement('div'); frame.className = 'cpc';
  const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; frame.appendChild(cv);
  const info = document.createElement('div'); info.className = 'info'; info.innerHTML = opts.info || '';
  document.body.append(frame, info);
  const m = new CPC(cv, frame);
  const b = new Basic(m, opts.source);
  b.start();
  b.run();
  window.cpc = { machine: m, basic: b };
}
window.CPC = { boot, Machine: CPC, Basic };   // Machine/Basic: for tests
})();
