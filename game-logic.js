/* Tic-Tac-Toe core logic — pure functions, no DOM.
   Board: array of 9, values 'X' | 'O' | null. Used by index.html and headless-tested in Node. */
(function (root) {
  'use strict';

  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  function emptyBoard() { return [null, null, null, null, null, null, null, null, null]; }

  function createGame(playerMark, difficulty) {
    return {
      board: emptyBoard(),
      player: playerMark || 'X',
      cpu: (playerMark || 'X') === 'X' ? 'O' : 'X',
      turn: 'X', // X always moves first
      difficulty: difficulty || 'hard',
      over: false,
      winner: null,   // 'X' | 'O' | 'draw'
      winLine: null
    };
  }

  // Returns { winner: 'X'|'O'|'draw'|null, line: [a,b,c]|null }
  function checkWinner(board) {
    for (var i = 0; i < LINES.length; i++) {
      var l = LINES[i];
      var a = board[l[0]];
      if (a && a === board[l[1]] && a === board[l[2]]) return { winner: a, line: l };
    }
    for (var j = 0; j < 9; j++) if (!board[j]) return { winner: null, line: null };
    return { winner: 'draw', line: null };
  }

  function freeCells(board) {
    var out = [];
    for (var i = 0; i < 9; i++) if (!board[i]) out.push(i);
    return out;
  }

  // Player (human or cpu) claims cell; returns true if the move was legal.
  function move(state, cell) {
    if (state.over || state.board[cell]) return false;
    state.board[cell] = state.turn;
    var r = checkWinner(state.board);
    if (r.winner) {
      state.over = true;
      state.winner = r.winner;
      state.winLine = r.line;
    } else {
      state.turn = state.turn === 'X' ? 'O' : 'X';
    }
    return true;
  }

  // ---- AI ----

  // Find a cell that lets `mark` complete a line this move, or null.
  function winningCell(board, mark) {
    var cells = freeCells(board);
    for (var i = 0; i < cells.length; i++) {
      board[cells[i]] = mark;
      var w = checkWinner(board).winner === mark;
      board[cells[i]] = null;
      if (w) return cells[i];
    }
    return null;
  }

  function minimax(board, turn, cpu, depth) {
    var r = checkWinner(board);
    if (r.winner === cpu) return 10 - depth;
    if (r.winner === 'draw') return 0;
    if (r.winner) return depth - 10;
    var cells = freeCells(board);
    var best = turn === cpu ? -Infinity : Infinity;
    for (var i = 0; i < cells.length; i++) {
      board[cells[i]] = turn;
      var score = minimax(board, turn === 'X' ? 'O' : 'X', cpu, depth + 1);
      board[cells[i]] = null;
      best = turn === cpu ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
  }

  function bestMoveMinimax(board, cpu) {
    var cells = freeCells(board);
    var bestScore = -Infinity, bestCell = cells[0];
    for (var i = 0; i < cells.length; i++) {
      board[cells[i]] = cpu;
      var score = minimax(board, cpu === 'X' ? 'O' : 'X', cpu, 0);
      board[cells[i]] = null;
      if (score > bestScore) { bestScore = score; bestCell = cells[i]; }
    }
    return bestCell;
  }

  // Returns the cell the CPU plays. rng injectable for tests.
  function cpuMove(state, rng) {
    rng = rng || Math.random;
    var board = state.board, cpu = state.cpu, player = state.player;
    var cells = freeCells(board);
    if (!cells.length) return null;
    if (state.difficulty === 'easy') {
      return cells[Math.floor(rng() * cells.length)];
    }
    if (state.difficulty === 'medium') {
      // take a win, block a loss, else random
      var win = winningCell(board, cpu);
      if (win !== null) return win;
      var block = winningCell(board, player);
      if (block !== null) return block;
      return cells[Math.floor(rng() * cells.length)];
    }
    return bestMoveMinimax(board, cpu);
  }

  var api = {
    LINES: LINES,
    emptyBoard: emptyBoard, createGame: createGame,
    checkWinner: checkWinner, freeCells: freeCells,
    move: move, cpuMove: cpuMove,
    winningCell: winningCell, bestMoveMinimax: bestMoveMinimax
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TicTacLogic = api;
})(typeof window !== 'undefined' ? window : global);
