'use strict';

/* One Tab stop per board; every cell remains inspectable with arrow keys. */
window.PuzzleGrid = function (container, getCells, getColumns) {
  let current = 0;

  function refresh() {
    const cells = getCells();
    current = Math.max(0, Math.min(current, cells.length - 1));
    cells.forEach((cell, index) => {
      cell.dataset.cellIndex = index;
      cell.tabIndex = index === current ? 0 : -1;
    });
  }

  function focus(index) {
    current = index;
    refresh();
    const cell = getCells()[current];
    cell?.focus({ preventScroll: true });
    cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  container.addEventListener('pointerdown', () => container.classList.remove('keyboard-navigation'));

  container.addEventListener('focusin', event => {
    const index = Number(event.target.dataset.cellIndex);
    if (Number.isInteger(index) && getCells()[index] === event.target) {
      current = index;
      refresh();
    }
  });

  container.addEventListener('keydown', event => {
    const cells = getCells();
    const index = Number(event.target.dataset.cellIndex);
    if (!Number.isInteger(index) || cells[index] !== event.target) return;
    container.classList.add('keyboard-navigation');
    const columns = getColumns();
    const row = Math.floor(index / columns);
    const column = index % columns;
    let next = index;
    switch (event.key) {
      case 'ArrowLeft': next -= column > 0 ? 1 : 0; break;
      case 'ArrowRight': next += column < columns - 1 ? 1 : 0; break;
      case 'ArrowUp': next -= row > 0 ? columns : 0; break;
      case 'ArrowDown': next += index + columns < cells.length ? columns : 0; break;
      case 'Home': next = event.ctrlKey ? 0 : row * columns; break;
      case 'End': next = event.ctrlKey ? cells.length - 1 : Math.min((row + 1) * columns - 1, cells.length - 1); break;
      default: return;
    }
    event.preventDefault();
    focus(next);
  });

  return { refresh, focus };
};
