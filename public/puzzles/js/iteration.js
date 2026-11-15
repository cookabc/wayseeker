'use strict';
/* 黑白迭代：点击翻转十字区域，拼出由可解操作生成的目标图形。 */
(function () {
  const boardEl = document.getElementById('board');
  const targetEl = document.getElementById('target');
  const movesEl = document.getElementById('moves');
  const msgEl = document.getElementById('msg');
  const sizeSel = document.getElementById('size');
  let n = 4, board, target, moves, done, cellEls = [];
  const keyboard = PuzzleGrid(boardEl, () => cellEls, () => n);

  function flip(g, i) {
    g[i] ^= 1;
    const x = i % n, y = Math.floor(i / n);
    if (x > 0) g[i - 1] ^= 1;
    if (x < n - 1) g[i + 1] ^= 1;
    if (y > 0) g[i - n] ^= 1;
    if (y < n - 1) g[i + n] ^= 1;
  }

  function newGame() {
    n = +sizeSel.value;
    board = new Array(n * n).fill(0);
    moves = 0; done = false;
    boardEl.classList.remove('won');
    do {
      target = new Array(n * n).fill(0);
      for (let t = 0; t < n + 3; t++) flip(target, Math.floor(Math.random() * n * n));
    } while (target.every(v => v === 0));
    render();
    update();
  }

  function move(i) {
    if (done) return;
    flip(board, i);
    moves++;
    update();
  }

  function render() {
    boardEl.innerHTML = '';
    targetEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = targetEl.style.gridTemplateColumns = 'repeat(' + n + ',1fr)';
    cellEls = board.map((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.addEventListener('pointerdown', () => keyboard.focus(i));
      d.addEventListener('click', () => move(i));
      boardEl.appendChild(d);
      return d;
    });
    target.forEach(v => {
      const d = document.createElement('div');
      d.className = 'ic' + (v ? ' on' : '');
      d.setAttribute('aria-hidden', 'true');
      targetEl.appendChild(d);
    });
    const rows = Array.from({ length: n }, (_, r) => '第 ' + (r + 1) + ' 行：'
      + target.slice(r * n, (r + 1) * n).map(v => v ? '黑' : '白').join('、'));
    targetEl.setAttribute('role', 'img');
    targetEl.setAttribute('aria-label', '目标图形，' + n + ' 行 ' + n + ' 列。' + rows.join('；'));
    keyboard.refresh();
  }

  function update() {
    done = board.every((v, i) => v === target[i]);
    boardEl.classList.toggle('won', done);
    cellEls.forEach((d, i) => {
      d.className = 'ic' + (board[i] ? ' on' : '');
      d.setAttribute('aria-label', '第 ' + (Math.floor(i / n) + 1) + ' 行，第 ' + (i % n + 1)
        + ' 列，' + (board[i] ? '黑色' : '白色') + '，目标' + (target[i] ? '黑色' : '白色')
        + '；操作会翻转本格及上下左右格');
      d.setAttribute('aria-disabled', String(done));
    });
    movesEl.textContent = moves + ' 步';
    msgEl.textContent = done ? '✓ 完成 · ' + moves + ' 步' : '已匹配 '
      + board.filter((v, i) => v === target[i]).length + ' / ' + board.length + ' 格';
  }

  document.getElementById('new').onclick = newGame;
  document.getElementById('reset').onclick = () => {
    board = new Array(n * n).fill(0);
    moves = 0; done = false;
    update();
  };
  sizeSel.onchange = newGame;
  newGame();
})();
