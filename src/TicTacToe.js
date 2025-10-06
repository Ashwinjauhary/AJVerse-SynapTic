import React, { useState, useEffect, useCallback } from 'react';
import './TicTacToe.css';
import Confetti from 'react-confetti';

function TicTacToe() {
  const [board, setBoard] = useState(() => {
    return JSON.parse(localStorage.getItem('board')) || Array(9).fill(null);
  });
  const [xIsNext, setXIsNext] = useState(() => {
    return JSON.parse(localStorage.getItem('xIsNext')) ?? true;
  });
  const [winner, setWinner] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scores, setScores] = useState(() => {
    return JSON.parse(localStorage.getItem('scores')) || { X: 0, O: 0 };
  });
  const [gameMode, setGameMode] = useState('player');
  const [difficulty, setDifficulty] = useState(() => {
    return localStorage.getItem('difficulty') || 'medium';
  });
  const [winningLine, setWinningLine] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [history, setHistory] = useState(() => {
    return JSON.parse(localStorage.getItem('history')) || [{ board: Array(9).fill(null), xIsNext: true }];
  });
  const [step, setStep] = useState(() => {
    return JSON.parse(localStorage.getItem('step')) || 0;
  });
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [showHistory, setShowHistory] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('board', JSON.stringify(board));
    localStorage.setItem('xIsNext', JSON.stringify(xIsNext));
    localStorage.setItem('scores', JSON.stringify(scores));
    localStorage.setItem('history', JSON.stringify(history));
    localStorage.setItem('step', JSON.stringify(step));
    localStorage.setItem('difficulty', difficulty);
  }, [board, xIsNext, scores, history, step, difficulty]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setIsGameOver(true);
    } else if (board.every(square => square !== null)) {
      setWinner(null);
      setWinningLine([]);
      setIsGameOver(true);
    } else {
      setWinner(null);
      setWinningLine([]);
      setIsGameOver(false);
    }
  }, [board]);

  useEffect(() => {
    if (winner) {
      setScores(prev => ({ ...prev, [winner]: prev[winner] + 1 }));
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [winner]);

  const minimax = useCallback((squares, depth, isMaximizing) => {
    const aiPlayer = 'O';
    const humanPlayer = 'X';
    const result = calculateWinner(squares);
    if (result?.winner === aiPlayer) return 10 - depth;
    if (result?.winner === humanPlayer) return depth - 10;
    if (squares.every(square => square !== null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = aiPlayer;
          const score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(bestScore, score);
        }
      }
      return bestScore;
    }

    let bestScore = Infinity;
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        squares[i] = humanPlayer;
        const score = minimax(squares, depth + 1, true);
        squares[i] = null;
        bestScore = Math.min(bestScore, score);
      }
    }
    return bestScore;
  }, []);

  const findBestMove = useCallback(() => {
    const aiPlayer = 'O';
    const humanPlayer = 'X';
    const emptySquares = board
      .map((value, index) => (value === null ? index : null))
      .filter((value) => value !== null);

    if (emptySquares.length === 0) return -1;

    if (difficulty === 'easy') {
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    if (difficulty === 'medium') {
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          const newBoard = [...board];
          newBoard[i] = aiPlayer;
          if (calculateWinner(newBoard)?.winner === aiPlayer) return i;
        }
      }

      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          const newBoard = [...board];
          newBoard[i] = humanPlayer;
          if (calculateWinner(newBoard)?.winner === humanPlayer) return i;
        }
      }

      if (board[4] === null) return 4;

      const corners = [0, 2, 6, 8];
      const availableCorners = corners.filter(i => board[i] === null);
      if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
      }

      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    let bestScore = -Infinity;
    let bestMove = -1;
    const boardCopy = [...board];

    for (const index of emptySquares) {
      boardCopy[index] = aiPlayer;
      const score = minimax(boardCopy, 0, false);
      boardCopy[index] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = index;
      }
    }

    return bestMove;
  }, [board, difficulty, minimax]);

  const handleClick = useCallback((index) => {
    if (board[index] || winner || isGameOver) return;

    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);

    const newHistory = history.slice(0, step + 1);
    setHistory([...newHistory, { board: newBoard, xIsNext: !xIsNext }]);
    setStep(newHistory.length);
  }, [board, winner, isGameOver, xIsNext, history, step]);

  const makeAIMove = useCallback(() => {
    const bestMove = findBestMove();
    if (bestMove !== -1) handleClick(bestMove);
  }, [findBestMove, handleClick]);

  useEffect(() => {
    if (gameMode === 'ai' && !xIsNext && !isGameOver && !winner) {
      const timeout = setTimeout(makeAIMove, 500);
      return () => clearTimeout(timeout);
    }
  }, [xIsNext, gameMode, isGameOver, winner, makeAIMove]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
    setIsGameOver(false);
    setWinningLine([]);
    setHistory([{ board: Array(9).fill(null), xIsNext: true }]);
    setStep(0);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0 });
  };

  const toggleGameMode = () => {
    setGameMode(prev => (prev === 'player' ? 'ai' : 'player'));
    resetGame();
  };

  const handleDifficultyChange = (level) => {
    if (level === difficulty) return;
    setDifficulty(level);
    resetGame();
  };

  const toggleHistory = () => {
    setShowHistory(prev => !prev);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const jumpToStep = (move) => {
    setStep(move);
    setBoard(history[move].board);
    setXIsNext(history[move].xIsNext);
    setWinner(null);
    setIsGameOver(false);
    setWinningLine([]);
  };

  const renderSquare = (index) => {
    const isWinningSquare = winningLine.includes(index);
    return (
      <button
        key={index}
        className={`square ${board[index] ? `player-${board[index].toLowerCase()}` : ''} ${isWinningSquare ? 'winning' : ''}`}
        onClick={() => handleClick(index)}
        disabled={isGameOver || (gameMode === 'ai' && !xIsNext)}
      >
        {board[index]}
      </button>
    );
  };

  const getStatusMessage = () => {
    if (winner) return `Player ${winner} Wins!`;
    if (isGameOver) return "It's a Draw!";
    return gameMode === 'ai'
      ? `${xIsNext ? 'Your Turn' : 'AI Thinking...'}`
      : `Player ${xIsNext ? 'X' : 'O'}'s Turn`;
  };

  const moves = history.map((stepObj, move) => {
    const desc = move ? `Go to move #${move}` : 'Go to game start';
    return (
      <li key={move}>
        <button className="history-btn" onClick={() => jumpToStep(move)}>
          {desc}
        </button>
      </li>
    );
  });

  return (
    <div className="tic-tac-toe">
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <div className="floating-shapes"></div>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <header className="header">
        <h1>AJVerse: SynapTic</h1>
        <p className="tagline">You can't beat the AI… but you'll love trying.</p>
      </header>

      <div className="game-info">
        <div className="status">{getStatusMessage()}</div>
        <div className="score-board">
          <div className="score player-o">{gameMode === 'ai' ? `AI (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})` : 'Player O'}: {scores.O}</div>
        </div>
      </div>

      <div className="board">
        <div className="board-row">{renderSquare(0)}{renderSquare(1)}{renderSquare(2)}</div>
        <div className="board-row">{renderSquare(3)}{renderSquare(4)}{renderSquare(5)}</div>
        <div className="board-row">{renderSquare(6)}{renderSquare(7)}{renderSquare(8)}</div>
      </div>

      <div className="controls">
        <button className="control-btn reset-btn" onClick={resetGame}>New Game</button>
        <button className="control-btn mode-btn" onClick={toggleGameMode}>{gameMode === 'player' ? 'Play vs AI' : 'Play vs Player'}</button>
        <button className="control-btn score-btn" onClick={resetScores}>Reset Scores</button>
        <div className="control-select-wrapper">
          <span className="control-label">Difficulty</span>
          <div className="difficulty-button-group">
            {['easy', 'medium', 'impossible'].map(level => (
              <button
                key={level}
                type="button"
                className={`control-btn difficulty-btn ${difficulty === level ? 'active' : ''}`}
                onClick={() => handleDifficultyChange(level)}
                disabled={gameMode !== 'ai'}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button className="control-btn mode-btn" onClick={toggleHistory}>{showHistory ? 'Hide History' : 'Show History'}</button>
        <button className="control-btn mode-btn" onClick={toggleTheme}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</button>
      </div>

      {showHistory && (
        <div className="game-history">
          <h3>Game History</h3>
          <ol>{moves}</ol>
        </div>
      )}

      <footer className="footer">Powered by AJVerse: SynapTic 🚀</footer>
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

export default TicTacToe;