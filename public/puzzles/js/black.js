'use strict';
/* black · 黑 —— Bart Bonte 风格复刻，50 关，每关一种机制。
 * 每关是一个对象：{ hint, make(), draw(s,t), down(s,p), move(s,p,drag), up(s,p), key(s,k), tick(s,dt), solved(s) }
 */
const W = 750, H = 750;
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const hintEl = document.getElementById('hint'), levelEl = document.getElementById('lvl');
const mapPanel = document.getElementById('mapPanel');
cv.width = W; cv.height = H;

let canvasCssWidth = W;
function fit() {
  canvasCssWidth = cv.getBoundingClientRect().width || W;
}
new ResizeObserver(fit).observe(cv); fit();

const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function txt(t, x, y, s, c, w) {
  ctx.fillStyle = c || '#fff';
  ctx.font = (w || 700) + ' ' + Math.max(s, Math.ceil(12 * W / canvasCssWidth)) + 'px -apple-system,"PingFang SC",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(t, x, y);
}

/* ================= 关卡机制工厂 ================= */

// 1. 点一下
function fTap() {
  return { hint: '点击屏幕任意处',
    make: () => ({ done: false }),
    draw() { txt('●', 375, 375, 120); txt('点 我', 375, 530, 28, 'rgba(255,255,255,.5)'); },
    down(s) { s.done = true; },
    solved: s => s.done };
}

// 2. 点掉所有白方块（可选移动）
function fSquares(n, moving) {
  return { hint: moving ? '点掉所有白色方块（它们在动）' : '点掉所有白色方块',
    make() {
      const sqs = []; let g = 0;
      const r = n > 10 ? 44 : 58;
      while (sqs.length < n && g++ < 600) {
        const x = rnd(90, 660), y = rnd(120, 660);
        if (sqs.every(q => Math.hypot(q.x - x, q.y - y) > r * 2.4))
          sqs.push({ x, y, r, hit: false, vx: rnd(-0.07, 0.07), vy: rnd(-0.07, 0.07) });
      }
      return { sqs, moving };
    },
    draw(s) { for (const q of s.sqs) if (!q.hit) { ctx.fillStyle = '#fff'; ctx.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); } },
    tick(s, dt) { if (!s.moving) return;
      for (const q of s.sqs) { if (q.hit) continue;
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.x < 70 || q.x > 680) q.vx *= -1;
        if (q.y < 110 || q.y > 680) q.vy *= -1; } },
    down(s, p) { for (const q of s.sqs) if (!q.hit && Math.abs(p.x - q.x) < q.r && Math.abs(p.y - q.y) < q.r) { q.hit = true; return; } },
    solved: s => s.sqs.every(q => q.hit) };
}

// 3. 按住
function fHold(ms) {
  return { hint: '按住屏幕，不要松开',
    make: () => ({ prog: 0, hold: false }),
    draw(s) {
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.arc(375, 375, 150, 0, 7); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.beginPath();
      ctx.arc(375, 375, 150, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(s.prog / ms, 0, 1)); ctx.stroke();
      txt('按 住', 375, 375, 44);
    },
    tick(s, dt) { if (s.hold) s.prog += dt; },
    down(s) { s.hold = true; },
    up(s) { s.hold = false; s.prog = 0; },
    solved: s => s.prog >= ms };
}

// 4. 涂黑
function fPaint(need) {
  const N = 26, CS = W / N;
  function paintAt(s, p) {
    const cx = (p.x / CS) | 0, cy = (p.y / CS) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dy * dy > 5) continue;
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const i = y * N + x;
      if (!s.g[i]) { s.g[i] = 1; s.done++; }
    }
  }
  return { hint: '按住拖动，把整个屏幕涂黑',
    make: () => ({ g: new Uint8Array(N * N), done: 0 }),
    draw(s) {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#000';
      for (let i = 0; i < N * N; i++) if (s.g[i]) ctx.fillRect((i % N) * CS, ((i / N) | 0) * CS, CS + 1, CS + 1);
    },
    down(s, p) { paintAt(s, p); },
    move(s, p, d) { if (d) paintAt(s, p); },
    solved: s => s.done >= N * N * need };
}

// 5. 翻转灯（Lights Out）
function fLights(n, k) {
  return { hint: '点击方块会十字翻转黑白，让全部变黑',
    make() {
      const b = new Uint8Array(n * n).fill(1);
      const flip = i => {
        b[i] ^= 1; const x = i % n, y = (i / n) | 0;
        if (x > 0) b[i - 1] ^= 1; if (x < n - 1) b[i + 1] ^= 1;
        if (y > 0) b[i - n] ^= 1; if (y < n - 1) b[i + n] ^= 1;
      };
      let g = 0;
      do { for (let t = 0; t < k; t++) flip(ri(0, n * n - 1)); } while (b.every(v => v) && g++ < 10);
      return { b, n, flip };
    },
    draw(s) {
      const m = 70, cs = (W - 2 * m) / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        ctx.fillStyle = s.b[y * n + x] ? '#000' : '#fff';
        ctx.fillRect(m + x * cs + 3, m + y * cs + 3, cs - 6, cs - 6);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.strokeRect(m + x * cs + 3, m + y * cs + 3, cs - 6, cs - 6);
      }
    },
    down(s, p) {
      const m = 70, cs = (W - 2 * m) / s.n;
      const x = ((p.x - m) / cs) | 0, y = ((p.y - m) / cs) | 0;
      if (x < 0 || y < 0 || x >= s.n || y >= s.n) return;
      s.flip(y * s.n + x);
    },
    solved: s => s.b.every(v => v === 1) };
}

// 6. 顺序点击
function fOrder(k) {
  return { hint: '按 1 到 ' + k + ' 的顺序点击',
    make() {
      const sqs = []; let g = 0;
      const r = k > 8 ? 42 : 54;
      while (sqs.length < k && g++ < 900) {
        const x = rnd(90, 660), y = rnd(130, 650);
        if (sqs.every(q => Math.hypot(q.x - x, q.y - y) > r * 2.5))
          sqs.push({ x, y, r, n: sqs.length + 1, hit: false });
      }
      return { sqs, next: 1 };
    },
    draw(s) {
      for (const q of s.sqs) {
        if (q.hit) continue;
        ctx.fillStyle = '#fff'; ctx.fillRect(q.x - q.r, q.y - q.r, 2 * q.r, 2 * q.r);
        txt(q.n, q.x, q.y, q.r, '#000');
      }
    },
    down(s, p) {
      for (const q of s.sqs) {
        if (q.hit) continue;
        if (Math.abs(p.x - q.x) < q.r && Math.abs(p.y - q.y) < q.r) {
          if (q.n === s.next) { q.hit = true; s.next++; } else s.flash = 180;
          return;
        }
      }
    },
    solved: s => s.next > s.sqs.length };
}

// 7. 凑数
function fSum(nums, target) {
  return { hint: '选中若干方块，使数字之和 = ' + target,
    make() { return { sqs: nums.map(v => ({ v, sel: false })), target, sum: 0 }; },
    draw(s) {
      const n = s.sqs.length, perRow = n > 4 ? Math.ceil(n / 2) : n;
      const cs = n > 6 ? 128 : 148, rows = Math.ceil(n / perRow);
      s.sqs.forEach((q, i) => {
        const row = (i / perRow) | 0, col = i % perRow;
        const inRow = Math.min(perRow, n - row * perRow);
        const x = 375 + (col - (inRow - 1) / 2) * (cs + 22), y = 360 + (row - (rows - 1) / 2) * (cs + 30);
        q.x = x; q.y = y; q.cs = cs;
        ctx.fillStyle = q.sel ? '#000' : '#fff';
        ctx.fillRect(x - cs / 2, y - cs / 2, cs, cs);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = q.sel ? 5 : 1;
        ctx.strokeRect(x - cs / 2, y - cs / 2, cs, cs);
        txt(q.v, x, y, cs * 0.42, q.sel ? '#fff' : '#000');
      });
      txt('目标 ' + s.target + '　·　当前 ' + s.sum, 375, 640, 28, 'rgba(255,255,255,.7)');
    },
    down(s, p) {
      for (const q of s.sqs) {
        if (q.x === undefined) break;
        if (Math.abs(p.x - q.x) < q.cs / 2 && Math.abs(p.y - q.y) < q.cs / 2) {
          q.sel = !q.sel;
          s.sum = s.sqs.reduce((a, z) => a + (z.sel ? z.v : 0), 0);
          if (s.sum > s.target) { s.flash = 220; s.sqs.forEach(z => z.sel = false); s.sum = 0; }
          return;
        }
      }
    },
    solved: s => s.sum === s.target && s.sqs.some(q => q.sel) };
}

// 8. 滑块
function fSliders(m) {
  return { hint: '把所有滑块推到最右端',
    make: () => ({ vals: new Array(m).fill(0), act: -1, m }),
    draw(s) {
      for (let i = 0; i < m; i++) {
        const y = 375 + (i - (m - 1) / 2) * (m > 3 ? 100 : 120);
        ctx.fillStyle = '#333'; ctx.fillRect(120, y - 8, 510, 16);
        ctx.fillStyle = '#fff'; ctx.fillRect(120, y - 8, 510 * s.vals[i], 16);
        const kx = 120 + 510 * s.vals[i];
        ctx.fillStyle = '#fff'; ctx.fillRect(kx - 26, y - 34, 52, 68);
        ctx.fillStyle = '#000'; ctx.fillRect(kx - 8, y - 20, 16, 40);
      }
    },
    down(s, p) {
      for (let i = 0; i < m; i++) {
        const y = 375 + (i - (m - 1) / 2) * (m > 3 ? 100 : 120);
        if (Math.abs(p.y - y) < 50 && p.x > 90 && p.x < 665) { s.act = i; s.vals[i] = clamp((p.x - 120) / 510, 0, 1); return; }
      }
    },
    move(s, p, d) { if (d && s.act >= 0) s.vals[s.act] = clamp((p.x - 120) / 510, 0, 1); },
    up(s) { s.act = -1; },
    solved: s => s.vals.every(v => v >= 0.985) };
}

// 9. 色词干扰（Stroop）
function fStroop(word, rounds) {
  const other = word === '黑' ? '白' : '黑';
  function genRound(s) {
    const cs = 190, xs = [90, 280, 470], ys = [225, 440];
    const spots = shuffle(xs.flatMap(x => ys.map(y => ({ x, y }))));
    const wi = ri(0, 5);
    s.cells = spots.map((sp, i) => ({ x: sp.x, y: sp.y, cs, ch: i === wi ? word : other, fill: Math.random() < 0.5 ? 1 : 0 }));
  }
  return { hint: '点击写着「' + word + '」的方块，别被颜色迷惑（共 ' + rounds + ' 轮）',
    make() { const s = { round: 0, cells: [] }; genRound(s); return s; },
    draw(s) {
      txt('点击写着「' + word + '」的方块', 375, 120, 34);
      for (const c of s.cells) {
        ctx.fillStyle = c.fill ? '#fff' : '#000';
        ctx.fillRect(c.x, c.y, c.cs, c.cs);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(c.x, c.y, c.cs, c.cs);
        txt(c.ch, c.x + c.cs / 2, c.y + c.cs / 2, 66, c.fill ? '#000' : '#fff');
      }
      txt('第 ' + Math.min(s.round + 1, rounds) + ' / ' + rounds + ' 轮', 375, 680, 22, 'rgba(255,255,255,.5)');
    },
    down(s, p) {
      for (const c of s.cells) {
        if (p.x > c.x && p.x < c.x + c.cs && p.y > c.y && p.y < c.y + c.cs) {
          if (c.ch === word) { s.round++; if (s.round < rounds) genRound(s); }
          else s.flash = 220;
          return;
        }
      }
    },
    solved: s => s.round >= rounds };
}

// 10. 时机
function fTiming(w0, speed0, hits) {
  return { hint: '白条进入方框瞬间点击（×' + hits + '）',
    make: () => ({ pos: rnd(0, 1), dir: 1, speed: speed0, w: w0, hit: 0, need: hits }),
    tick(s, dt) {
      s.pos += s.dir * s.speed * dt / 1000;
      if (s.pos > 1) { s.pos = 1; s.dir = -1; }
      if (s.pos < 0) { s.pos = 0; s.dir = 1; }
    },
    draw(s) {
      const zx = 375 - s.w * 270;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.strokeRect(zx, 180, s.w * 540, 390);
      const x = 105 + s.pos * 540;
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 9, 150, 18, 450);
      for (let i = 0; i < s.need; i++) {
        ctx.fillStyle = i < s.hit ? '#fff' : '#333';
        ctx.beginPath(); ctx.arc(375 + (i - (s.need - 1) / 2) * 46, 665, 13, 0, 7); ctx.fill();
      }
    },
    down(s) {
      if (Math.abs(s.pos - 0.5) <= s.w / 2) { s.hit++; s.speed *= 1.3; s.w *= 0.85; }
      else s.flash = 200;
    },
    solved: s => s.hit >= s.need };
}

// 11. 拼字
function fType(word) {
  const letters = word.split('');
  const extra = shuffle(['E', 'R', 'T', 'S', 'O', 'N'].filter(x => !letters.includes(x))).slice(0, Math.max(0, 6 - letters.length));
  const pool = shuffle([...letters, ...extra]).map(c => ({ c, x: 0, y: 0 }));
  function press(s, c) { if (c === letters[s.prog]) s.prog++; else s.flash = 200; }
  return { hint: '依次点击字母，拼出 ' + word,
    make: () => ({ prog: 0 }),
    draw(s) {
      txt(letters.map((c, i) => i < s.prog ? c : '·').join(' '), 375, 220, 64);
      pool.forEach((t, i) => {
        const col = i % 3, row = (i / 3) | 0;
        const x = 375 + (col - 1) * 150, y = 400 + row * 140;
        t.x = x; t.y = y;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x - 52, y - 52, 104, 104);
        txt(t.c, x, y, 46);
      });
    },
    down(s, p) { for (const t of pool) if (Math.abs(p.x - t.x) < 52 && Math.abs(p.y - t.y) < 52) { press(s, t.c); return; } },
    key(s, k) { const c = k.toUpperCase(); if (/^[A-Z]$/.test(c)) press(s, c); },
    solved: s => s.prog >= letters.length };
}

// 12. 记忆
function fMemory(len) {
  return { hint: '记住方块闪烁的顺序，然后按同样顺序点一遍',
    make() {
      const seq = []; for (let i = 0; i < len; i++) seq.push(ri(0, 8));
      return { seq, phase: 'show', si: 0, timer: 900, input: 0, lit: -1, litT: 0 };
    },
    tick(s, dt) {
      if (s.litT > 0) { s.litT -= dt; if (s.litT <= 0) s.lit = -1; }
      if (s.phase === 'show') {
        s.timer -= dt;
        if (s.timer <= 0) {
          if (s.si < s.seq.length) { s.lit = s.seq[s.si]; s.litT = 420; s.timer = 620; s.si++; }
          else s.phase = 'input';
        }
      }
    },
    draw(s) {
      txt(s.phase === 'show' ? '看 清 顺 序' : '换 你 了', 375, 105, 30, 'rgba(255,255,255,.6)');
      const cs = 150, m = 375 - cs * 1.5 - 28;
      for (let i = 0; i < 9; i++) {
        const x = m + (i % 3) * (cs + 28) + cs / 2, y = 250 + ((i / 3) | 0) * (cs + 28) + cs / 2 - 30;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.strokeRect(x - cs / 2, y - cs / 2, cs, cs);
        if (i === s.lit) { ctx.fillStyle = '#fff'; ctx.fillRect(x - cs / 2, y - cs / 2, cs, cs); }
      }
    },
    down(s, p) {
      if (s.phase !== 'input') return;
      const cs = 150, m = 375 - cs * 1.5 - 28;
      for (let i = 0; i < 9; i++) {
        const x = m + (i % 3) * (cs + 28) + cs / 2, y = 250 + ((i / 3) | 0) * (cs + 28) + cs / 2 - 30;
        if (Math.abs(p.x - x) < cs / 2 && Math.abs(p.y - y) < cs / 2) {
          if (i === s.seq[s.input]) { s.input++; s.lit = i; s.litT = 250; }
          else { s.flash = 250; s.phase = 'show'; s.si = 0; s.input = 0; s.timer = 800; }
          return;
        }
      }
    },
    solved: s => s.input >= s.seq.length };
}

// 13. 追逐（有限速度逃跑，可逼到角落；触屏直接点）
function fChase(speed) {
  speed = speed || 1;
  return { hint: '白色方块会逃跑，把它逼到角落点中它',
    make: () => ({ x: 375, y: 400, r: 58, got: false, px: -9999, py: -9999 }),
    draw(s) {
      txt('抓 住 它', 375, 105, 28, 'rgba(255,255,255,.5)');
      ctx.fillStyle = '#fff'; ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    },
    tick(s, dt) {
      const dx = s.x - s.px, dy = s.y - s.py;
      const d = Math.hypot(dx, dy);
      if (d < 180 && d > 0.01) {
        const v = 0.25 * speed * dt;
        s.x = clamp(s.x + dx / d * v, s.r + 12, W - s.r - 12);
        s.y = clamp(s.y + dy / d * v, s.r + 92, H - s.r - 12);
      }
    },
    move(s, p) { s.px = p.x; s.py = p.y; },
    down(s, p) {
      s.px = p.x; s.py = p.y;
      if (Math.hypot(p.x - s.x, p.y - s.y) < s.r) s.got = true;
    },
    solved: s => s.got };
}

// 14. 灌水填充
function countComps(walls, N) {
  const seen = new Uint8Array(N * N); let n = 0;
  for (let i = 0; i < N * N; i++) {
    if (walls[i] || seen[i]) continue;
    n++; const st = [i]; seen[i] = 1;
    while (st.length) {
      const c = st.pop(), cx = c % N, cy = (c / N) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const j = ny * N + nx;
        if (!walls[j] && !seen[j]) { seen[j] = 1; st.push(j); }
      }
    }
  }
  return n;
}
function fFlood(wallP) {
  const N = 13;
  return { hint: '点击白色区域将其灌黑，全部变黑',
    make() {
      let walls, g = 0;
      do {
        walls = new Uint8Array(N * N);
        for (let i = 0; i < N * N; i++) walls[i] = Math.random() < wallP ? 1 : 0;
      } while (countComps(walls, N) < 3 && g++ < 50);
      return { walls, filled: new Uint8Array(N * N), total: walls.reduce((a, w) => a + (w ? 0 : 1), 0), done: 0 };
    },
    draw(s) {
      const cs = W / N;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < N * N; i++) {
        if (s.walls[i] || s.filled[i]) { ctx.fillStyle = '#000'; ctx.fillRect((i % N) * cs, ((i / N) | 0) * cs, cs + 1, cs + 1); }
        else { ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.strokeRect((i % N) * cs, ((i / N) | 0) * cs, cs, cs); }
      }
    },
    down(s, p) {
      const x = (p.x / W * N) | 0, y = (p.y / W * N) | 0;
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      const i = y * N + x;
      if (s.walls[i] || s.filled[i]) return;
      const st = [i]; s.filled[i] = 1; s.done++;
      while (st.length) {
        const c = st.pop(), cx = c % N, cy = (c / N) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          const j = ny * N + nx;
          if (!s.walls[j] && !s.filled[j]) { s.filled[j] = 1; s.done++; st.push(j); }
        }
      }
    },
    solved: s => s.done >= s.total };
}

// 15. 旋转表盘
function fDial(turns) {
  const ang = p => Math.atan2(p.y - 375, p.x - 375);
  return { hint: '绕着圆心拖动，转满 ' + turns + ' 圈',
    make: () => ({ acc: 0, last: null }),
    draw(s) {
      ctx.lineWidth = 26;
      ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.arc(375, 375, 190, 0, 7); ctx.stroke();
      const p = clamp(s.acc / (turns * 2 * Math.PI), 0, 1);
      ctx.strokeStyle = '#fff'; ctx.beginPath();
      ctx.arc(375, 375, 190, -Math.PI / 2, -Math.PI / 2 + p * 2 * Math.PI); ctx.stroke();
      txt('↻', 375, 365, 90);
      txt(((p * 100) | 0) + '%', 375, 540, 26, 'rgba(255,255,255,.6)');
    },
    down(s, p) { s.last = ang(p); },
    move(s, p, d) {
      if (!d || s.last === null) return;
      const a = ang(p); let da = a - s.last;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      s.acc += Math.abs(da); s.last = a;
    },
    up(s) { s.last = null; },
    solved: s => s.acc >= turns * 2 * Math.PI };
}

// 16. 计数
function fCount(n) {
  return { hint: '点击实心大方块 ' + n + ' 次，千万别点右下角空心方块',
    make: () => ({ c: 0 }),
    draw(s) {
      ctx.fillStyle = '#fff'; ctx.fillRect(215, 220, 320, 320);
      txt(Math.max(0, n - s.c), 375, 380, 96, '#000');
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.strokeRect(600, 580, 80, 80);
    },
    down(s, p) {
      if (p.x > 215 && p.x < 535 && p.y > 220 && p.y < 540) s.c++;
      else if (p.x > 600 && p.x < 680 && p.y > 580 && p.y < 660) { s.c = 0; s.flash = 260; }
    },
    solved: s => s.c >= n };
}

// 17. 拖出屏幕
function fDragOff() {
  return { hint: '按住白色圆盘，把它拖出屏幕外',
    make: () => ({ x: 375, y: 400, r: 82, drag: false, dx: 0, dy: 0, done: false }),
    draw(s) {
      txt('拖 出 屏 幕', 375, 105, 26, 'rgba(255,255,255,.5)');
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
    },
    down(s, p) { if (Math.hypot(p.x - s.x, p.y - s.y) < s.r) { s.drag = true; s.dx = s.x - p.x; s.dy = s.y - p.y; } },
    move(s, p) { if (s.drag) { s.x = p.x + s.dx; s.y = p.y + s.dy; } },
    up(s) {
      if (!s.drag) return; s.drag = false;
      if (s.x < -s.r * 0.4 || s.x > W + s.r * 0.4 || s.y < -s.r * 0.4 || s.y > H + s.r * 0.4) s.done = true;
      else { s.x = 375; s.y = 400; }
    },
    solved: s => s.done };
}

// 18. 配对
function fPairs(np) {
  const syms = '0123456789ABCDEFGH'.split('');
  return { hint: '翻出两个相同图案即配对变黑，全部配完',
    make() {
      const cards = shuffle([...syms.slice(0, np), ...syms.slice(0, np)]).map(ch => ({ ch, x: 0, y: 0, cs: 0 }));
      return { cards, st: new Array(2 * np).fill(0), open: -1, open2: -1, hideAt: 0 };
    },
    tick(s) {
      if (s.hideAt && performance.now() > s.hideAt) {
        s.st[s.open] = 0; s.st[s.open2] = 0;
        s.open = -1; s.open2 = -1; s.hideAt = 0;
      }
    },
    draw(s) {
      txt('找 相 同 的', 375, 85, 26, 'rgba(255,255,255,.5)');
      const n = s.cards.length, cols = 4, rows = Math.ceil(n / 4);
      const cs = np > 6 ? 118 : 148, gap = 16;
      const w = cols * (cs + gap) - gap, h = rows * (cs + gap) - gap;
      const ox = (W - w) / 2, oy = (H - h) / 2 + 30;
      s.cards.forEach((c, i) => {
        const x = ox + (i % cols) * (cs + gap), y = oy + ((i / cols) | 0) * (cs + gap);
        c.x = x; c.y = y; c.cs = cs;
        if (s.st[i] === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, cs, cs); }
        else {
          ctx.fillStyle = '#000'; ctx.fillRect(x, y, cs, cs);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, cs, cs);
          txt(c.ch, x + cs / 2, y + cs / 2, cs * 0.45);
        }
      });
    },
    down(s, p) {
      if (s.hideAt) return;
      for (let i = 0; i < s.cards.length; i++) {
        const c = s.cards[i];
        if (p.x > c.x && p.x < c.x + c.cs && p.y > c.y && p.y < c.y + c.cs) {
          if (s.st[i] !== 0) return;
          s.st[i] = 1;
          if (s.open < 0) s.open = i;
          else if (s.cards[s.open].ch === c.ch) { s.st[s.open] = 2; s.st[i] = 2; s.open = -1; }
          else { s.open2 = i; s.hideAt = performance.now() + 700; }
          return;
        }
      }
    },
    solved: s => s.st.every(v => v === 2) };
}

// 19. 收官
function fFinal() {
  return { hint: '最后一关', make: () => ({ done: false }),
    draw() {
      txt('50', 375, 330, 160);
      txt('感谢游玩 · 点一下收尾', 375, 500, 26, 'rgba(255,255,255,.55)');
    },
    down(s) { s.done = true; },
    solved: s => s.done };
}

/* ================= 50 关 ================= */
const LEVELS = [
  fTap(),
  fSquares(3), fSquares(8),
  fHold(1500),
  fPaint(0.97),
  fLights(3, 4),
  fOrder(5),
  fSum([1, 2, 3, 4, 5, 6], 10),
  fSliders(2),
  fStroop('黑', 3),
  fTiming(0.16, 0.5, 3),
  fType('BLACK'),
  fMemory(3),
  fChase(1),
  fFlood(0.26),
  fDial(1),
  fCount(7),
  fDragOff(),
  fPairs(6),
  fLights(5, 6),
  fOrder(8),
  fSum([2, 3, 5, 7, 8, 9], 15),
  fSliders(3),
  fHold(3000),
  fSquares(12, true),
  fTiming(0.12, 0.7, 3),
  fMemory(4),
  fFlood(0.30),
  fDial(2),
  fCount(12),
  fStroop('白', 3),
  fSum([4, 5, 6, 7, 9, 11], 21),
  fSliders(4),
  fOrder(10),
  fLights(4, 5),
  fChase(1.6),
  fPaint(0.995),
  fMemory(5),
  fTiming(0.09, 0.9, 4),
  fPairs(8),
  fCount(20),
  fFlood(0.34),
  fDial(3),
  fType('WHITE'),
  fSum([3, 6, 8, 9, 12, 14], 30),
  fSliders(5),
  fOrder(12),
  fLights(5, 9),
  fMemory(6),
  fFinal(),
];

/* ================= 运行器 ================= */
let idx = 0, L = null, S = null, pdown = false;
let keyboardMode = false;
const cursor = { x: W / 2, y: H / 2 };
const positionEl = document.getElementById('keyboard-position');
const saveNotice = document.getElementById('save-notice');
const saveStatus = document.getElementById('save-status');
const mapButton = document.getElementById('map');
const resetProgress = document.getElementById('reset-progress');
let progressReadable = true, corruptProgress = false;
function storageNotice(message) {
  saveStatus.textContent = message;
  saveNotice.hidden = false;
  resetProgress.hidden = !corruptProgress;
}
function parseProgress(raw) {
  const value = JSON.parse(raw || '{}');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid progress');
  return Object.fromEntries(Object.entries(value).filter(([key, completed]) => /^\d+$/.test(key) && Number(key) < LEVELS.length && completed === 1));
}
function readStoredProgress() {
  let raw;
  try {
    raw = localStorage.getItem('bw-black');
  } catch {
    progressReadable = false; corruptProgress = false;
    storageNotice('无法读取浏览器进度，本次记录暂存于页面中。请允许存储后重试，不会覆盖原记录。');
    return null;
  }
  try {
    const value = parseProgress(raw);
    progressReadable = true; corruptProgress = false;
    return value;
  } catch {
    progressReadable = false; corruptProgress = true;
    storageNotice('已存进度无法识别，本次仍可游玩。重置前不会覆盖原记录。');
    return null;
  }
}
const prog = readStoredProgress() || {};
function saveProg() {
  if (!progressReadable) return false;
  try {
    localStorage.setItem('bw-black', JSON.stringify(prog));
    saveNotice.hidden = true;
    return true;
  } catch {
    storageNotice('进度未保存，本次仍可继续。请允许浏览器存储后重试保存。');
    return false;
  }
}
document.getElementById('retry-save').onclick = () => {
  if (!progressReadable) {
    const stored = readStoredProgress();
    if (!stored) return;
    Object.assign(prog, stored);
  }
  if (saveProg()) {
    positionEl.textContent = '当前关卡进度已保存。';
    cv.focus();
  }
};
resetProgress.onclick = () => {
  if (!confirm('重置无法读取的关卡记录，并保存本次已完成的关卡？此操作会替换浏览器中的原记录。')) return;
  progressReadable = true; corruptProgress = false;
  if (saveProg()) { positionEl.textContent = '本次关卡进度已保存。'; cv.focus(); }
};
function cursorStatus() {
  positionEl.textContent = S.won
    ? (idx < LEVELS.length - 1 ? '本关已完成，按 Enter 或空格继续。' : '第 50 关已完成，可选关或重玩。')
    : '光标 ' + Math.round(cursor.x / W * 100) + '%，' + Math.round(cursor.y / H * 100) + '% · ' + (pdown ? '已按住，再按空格松开' : '已松开');
}

function load(i) {
  pdown = false;
  cursor.x = W / 2; cursor.y = H / 2;
  idx = clamp(i, 0, LEVELS.length - 1);
  L = LEVELS[idx]; S = L.make();
  S.won = false; S.wonT = 0; S.flash = 0;
  levelEl.textContent = (idx + 1) + ' / ' + LEVELS.length;
  hintEl.textContent = L.hint;
  document.getElementById('prev').disabled = idx === 0;
  document.getElementById('next').disabled = idx === LEVELS.length - 1;
  buildMap();
  positionEl.textContent = '第 ' + (idx + 1) + ' 关 · ' + L.hint;
}

function win() {
  S.won = true; S.wonT = performance.now();
  pdown = false;
  prog[idx] = 1; saveProg(); buildMap();
  cursorStatus();
}
const after = () => { if (!S.won && L.solved && L.solved(S)) win(); };

function pos(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}

cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  keyboardMode = false;
  cv.focus({ preventScroll: true });
  if (S.won) { if (idx < LEVELS.length - 1) load(idx + 1); return; }
  pdown = true;
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  if (L.down) L.down(S, pos(e));
  after();
});
cv.addEventListener('pointermove', e => {
  if (S.won) return;
  if (L.move) L.move(S, pos(e), pdown);
  after();
});
cv.addEventListener('pointerup', e => {
  if (S.won) { pdown = false; return; }
  pdown = false;
  if (L.up) L.up(S, pos(e));
  after();
});
function release() {
  if (!pdown) return;
  pdown = false;
  if (!S.won && L.up) L.up(S, cursor);
  after();
  cursor.x = clamp(cursor.x, 0, W); cursor.y = clamp(cursor.y, 0, H);
  if (keyboardMode) cursorStatus();
}
cv.addEventListener('pointercancel', release);
cv.addEventListener('lostpointercapture', release);
cv.addEventListener('blur', release);
cv.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.key === 'Tab') return;
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape'].includes(e.key) && !L.key) return;
  e.preventDefault();
  keyboardMode = true;
  if (S.won) {
    if (!e.repeat && (e.key === 'Enter' || e.key === ' ') && idx < LEVELS.length - 1) load(idx + 1);
    return;
  }
  if (e.key.startsWith('Arrow')) {
    const step = e.shiftKey ? 60 : 15;
    const margin = pdown ? 120 : 0;
    cursor.x = clamp(cursor.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0), -margin, W + margin);
    cursor.y = clamp(cursor.y + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0), -margin, H + margin);
    if (L.move) L.move(S, cursor, pdown);
  } else if (e.key === 'Escape') release();
  else if (e.key === ' ' && !e.repeat) {
    if (pdown) release();
    else { pdown = true; if (L.down) L.down(S, cursor); }
  } else if (e.key === 'Enter' && !e.repeat) {
    if (pdown) release();
    if (L.down) L.down(S, cursor);
    after();
    if (!S.won && L.up) L.up(S, cursor);
  } else if (L.key) L.key(S, e.key);
  after(); cursorStatus();
});

function openLevel(i) { load(i); cv.focus(); }
document.getElementById('prev').onclick = () => openLevel(idx - 1);
document.getElementById('next').onclick = () => openLevel(idx + 1);
document.getElementById('re').onclick = () => openLevel(idx);
function closeMap() { mapPanel.hidden = true; mapButton.setAttribute('aria-expanded', 'false'); }
mapButton.onclick = () => {
  const open = mapPanel.hidden;
  mapPanel.hidden = !open;
  mapButton.setAttribute('aria-expanded', String(open));
  if (open) mapPanel.querySelector('[aria-current="true"]').focus();
};
mapPanel.addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeMap(); mapButton.focus(); }
});

function buildMap() {
  LEVELS.forEach((_, i) => {
    let b = mapPanel.children[i];
    if (!b) {
      b = document.createElement('button');
      b.type = 'button'; b.textContent = i + 1;
      b.onclick = () => { closeMap(); openLevel(i); };
      mapPanel.appendChild(b);
    }
    b.classList.toggle('done', Boolean(prog[i]));
    b.classList.toggle('cur', i === idx);
    b.setAttribute('aria-current', String(i === idx));
    b.setAttribute('aria-label', '第 ' + (i + 1) + ' 关，' + (prog[i] ? '已完成' : '未完成'));
  });
}

let last = performance.now();
function loop(t) {
  const dt = Math.min(50, t - last); last = t;
  if (!S.won && L.tick) { L.tick(S, dt); after(); }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  L.draw(S, t);
  if (S.flash > 0) {
    S.flash -= dt;
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(0, 0, W, H);
  }
  if (S.won) {
    const a = clamp((t - S.wonT) / 400, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,' + 0.55 * a + ')'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a;
    txt('✓', 375, 320, 160);
    txt('屏 幕 黑 了', 375, 460, 36);
    if (idx < LEVELS.length - 1) txt('点击屏幕继续 →', 375, 570, 24, 'rgba(255,255,255,.6)');
    else txt('50 关全部完成！', 375, 570, 26, 'rgba(255,255,255,.8)');
    ctx.globalAlpha = 1;
  }
  if (keyboardMode && document.activeElement === cv && !S.won) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cursor.x - 28, cursor.y); ctx.lineTo(cursor.x + 28, cursor.y);
    ctx.moveTo(cursor.x, cursor.y - 28); ctx.lineTo(cursor.x, cursor.y + 28);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }
  requestAnimationFrame(loop);
}

const startAt = +(new URLSearchParams(location.search).get('lv') || 1) - 1;
load(isNaN(startAt) ? 0 : startAt);
requestAnimationFrame(loop);
