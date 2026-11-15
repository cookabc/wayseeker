'use strict';
/* Takuzu 通用引擎：0h h1（方块皮肤）与 Simon Tatham Binary（数字皮肤）共用。
 * 规则：填满方阵；每行/列黑白各半；无三连相同；无重复行/列。
 * opt: { key, skin:'blocks'|'digits', sizes:[...], def:n, rules:'...' }
 */
function mountTakuzu(opt) {
  const sizeSel = document.getElementById('size');
  const gridEl = document.getElementById('grid');
  const msgEl = document.getElementById('msg');
  const timerEl = document.getElementById('timer');
  document.getElementById('rules').textContent = opt.rules;

  opt.sizes.forEach(s => {
    const o = document.createElement('option');
    o.value = s; o.textContent = s + ' × ' + s;
    sizeSel.appendChild(o);
  });
  let n = +localStorage.getItem(opt.key + '-n') || opt.def;
  if (!opt.sizes.includes(n)) n = opt.def;
  sizeSel.value = n;

  let sol, given, cells, cellEls = [], startAt, timerId, done;
  const keyboard = PuzzleGrid(gridEl, () => cellEls, () => n);

  /* ---- 求解网格生成（回溯） ---- */
  function allRows(n) {
    const out = [], m = n / 2;
    function rec(pos, ones, row) {
      if (pos === n) { if (ones === m) out.push(row.slice()); return; }
      if (ones > m) return;
      if (n - pos < m - ones) return;
      row.push(1);
      if (!(pos >= 2 && row[pos - 1] === 1 && row[pos - 2] === 1)) rec(pos + 1, ones + 1, row);
      row.pop();
      row.push(0);
      if (!(pos >= 2 && row[pos - 1] === 0 && row[pos - 2] === 0)) rec(pos + 1, ones, row);
      row.pop();
    }
    rec(0, 0, []);
    return out;
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function genSolved(n) {
    const cand = shuffle(allRows(n));
    const sol = [], colCount = new Array(n).fill(0);
    function bt() {
      const r = sol.length;
      if (r === n) {
        if (colCount.some(c => c !== n / 2)) return false;
        const seen = new Set();
        for (let c = 0; c < n; c++) {
          let s = '';
          for (let rr = 0; rr < n; rr++) s += sol[rr][c];
          if (seen.has(s)) return false;
          seen.add(s);
        }
        return true;
      }
      for (const row of cand) {
        const key = row.join('');
        if (sol.some(x => x.key === key)) continue;
        let ok = true;
        for (let c = 0; c < n && ok; c++) {
          if (colCount[c] + row[c] > n / 2) ok = false;
          else if (r >= 2 && sol[r - 1][c] === row[c] && sol[r - 2][c] === row[c]) ok = false;
        }
        if (!ok) continue;
        row.key = key;
        sol.push(row);
        for (let c = 0; c < n; c++) colCount[c] += row[c];
        if (bt()) return true;
        sol.pop();
        for (let c = 0; c < n; c++) colCount[c] -= row[c];
      }
      return false;
    }
    bt();
    return sol;
  }

  function givenRatio(n) { return n <= 4 ? 0.5 : n <= 6 ? 0.45 : n <= 8 ? 0.4 : 0.36; }

  function newGame() {
    done = false;
    sol = genSolved(n);
    given = []; cells = [];
    const ratio = givenRatio(n);
    let givCount = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const g = Math.random() < ratio;
      given.push(g); cells.push(g ? sol[r][c] + 1 : 0);
      if (g) givCount++;
    }
    if (givCount < n) { // 保底
      for (let i = 0; givCount < n; i++, givCount++) {
        if (!given[i]) { given[i] = true; cells[i] = sol[(i / n) | 0][i % n] + 1; }
      }
    }
    msgEl.textContent = '';
    gridEl.classList.remove('won');
    startAt = performance.now();
    clearInterval(timerId);
    timerId = setInterval(showTime, 500);
    showTime();
    render();
    update();
  }

  function fmt(ms) {
    const s = (ms / 1000) | 0;
    return String((s / 60) | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function showTime() { timerEl.textContent = fmt(performance.now() - startAt); }

  function render() {
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = 'repeat(' + n + ',1fr)';
    cellEls = [];
    for (let i = 0; i < n * n; i++) {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'tc e';
      d.addEventListener('pointerdown', () => keyboard.focus(i));
      const change = reverse => {
        if (done || given[i]) return;
        cells[i] = (cells[i] + (reverse ? 2 : 1)) % 3;
        update();
      };
      d.addEventListener('click', e => change(e.shiftKey));
      d.addEventListener('contextmenu', e => { e.preventDefault(); change(true); });
      gridEl.appendChild(d);
      cellEls.push(d);
    }
    keyboard.refresh();
  }

  function lineErr(line, base, stride, errSet) {
    // 三连
    let run = 1;
    for (let i = 1; i <= line.length; i++) {
      if (i < line.length && line[i] !== 0 && line[i] === line[i - 1]) run++;
      else { if (run >= 3) for (let k = i - run; k < i; k++) errSet.add(base + k * stride); run = 1; }
    }
    // 超半数
    const c1 = line.filter(v => v === 1).length, c2 = line.filter(v => v === 2).length;
    if (c1 > n / 2) line.forEach((v, k) => { if (v === 1) errSet.add(base + k * stride); });
    if (c2 > n / 2) line.forEach((v, k) => { if (v === 2) errSet.add(base + k * stride); });
  }

  function computeErr() {
    const err = new Set();
    const rows = [], cols = [];
    for (let r = 0; r < n; r++) {
      const line = [];
      for (let c = 0; c < n; c++) line.push(cells[r * n + c]);
      rows.push(line);
      lineErr(line, r * n, 1, err);
    }
    for (let c = 0; c < n; c++) {
      const line = [];
      for (let r = 0; r < n; r++) line.push(cells[r * n + c]);
      cols.push(line);
      lineErr(line, c, n, err);
    }
    // 重复完整行/列
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (!rows[i].includes(0) && rows[i].join() === rows[j].join()) {
        for (let c = 0; c < n; c++) { err.add(i * n + c); err.add(j * n + c); }
      }
      if (!cols[i].includes(0) && cols[i].join() === cols[j].join()) {
        for (let r = 0; r < n; r++) { err.add(r * n + i); err.add(r * n + j); }
      }
    }
    return err;
  }

  function update() {
    const err = computeErr();
    const filled = cells.filter(v => v !== 0).length;
    if (!done && filled === cells.length && err.size === 0) {
      done = true;
      clearInterval(timerId);
      gridEl.classList.add('won');
    }
    for (let i = 0; i < n * n; i++) {
      const d = cellEls[i], v = cells[i];
      d.className = 'tc ' + (v === 0 ? 'e' : v === 1 ? 'b' : 'w')
        + (given[i] ? ' given' : '') + (err.has(i) ? ' err' : '');
      d.textContent = opt.skin === 'digits' ? (v === 1 ? '1' : v === 2 ? '0' : '') : '';
      const value = v === 0 ? '空格' : opt.skin === 'digits' ? (v === 1 ? '数字 1' : '数字 0') : (v === 1 ? '黑色' : '白色');
      d.setAttribute('aria-label', '第 ' + (Math.floor(i / n) + 1) + ' 行，第 ' + (i % n + 1) + ' 列，' + value
        + (given[i] ? '，给定格，不可更改' : '') + (err.has(i) ? '，存在规则冲突' : ''));
      d.setAttribute('aria-disabled', String(given[i] || done));
      d.setAttribute('aria-invalid', String(err.has(i)));
    }
    msgEl.textContent = done ? '✓ 完成！用时 ' + fmt(performance.now() - startAt)
      : '已填 ' + filled + ' / ' + cells.length + ' 格' + (err.size ? '；' + err.size + ' 格存在规则冲突，请继续修改。' : '');
  }

  sizeSel.onchange = () => {
    n = +sizeSel.value;
    localStorage.setItem(opt.key + '-n', n);
    newGame();
  };
  document.getElementById('new').onclick = newGame;
  newGame();
}
