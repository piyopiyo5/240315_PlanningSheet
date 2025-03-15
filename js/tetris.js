class TetrisGame {
    constructor(canvas, nextCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nextCanvas = nextCanvas;
        this.nextCtx = nextCanvas.getContext('2d');
        
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.canvas.width = this.blockSize * this.cols;
        this.canvas.height = this.blockSize * this.rows;
        this.nextCanvas.width = this.blockSize * 4;
        this.nextCanvas.height = this.blockSize * 4;
        
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.isPlaying = false;
        this.startTime = null;
        
        this.currentPiece = null;
        this.nextPiece = null;

        this.difficulties = {
            EASY: { speed: 1000, nextPieces: 3 },
            NORMAL: { speed: 750, nextPieces: 2 },
            HARD: { speed: 500, nextPieces: 1 }
        };
    }

    static get SHAPES() {
        return [
            [[1, 1, 1, 1]], // I
            [[1, 1], [1, 1]], // O
            [[1, 1, 1], [0, 1, 0]], // T
            [[1, 1, 1], [1, 0, 0]], // L
            [[1, 1, 1], [0, 0, 1]], // J
            [[1, 1, 0], [0, 1, 1]], // S
            [[0, 1, 1], [1, 1, 0]]  // Z
        ];
    }

    static get COLORS() {
        return [
            '#00f0f0', // シアン (I)
            '#f0f000', // イエロー (O)
            '#f000f0', // マゼンタ (T)
            '#f0a000', // オレンジ (L)
            '#0000f0', // ブルー (J)
            '#00f000', // グリーン (S)
            '#f00000'  // レッド (Z)
        ];
    }

    init(difficulty, playerName) {
        this.difficulty = difficulty;
        this.playerName = playerName;
        this.speed = this.difficulties[difficulty].speed;
        this.nextPiecesCount = this.difficulties[difficulty].nextPieces;
        
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.isPlaying = true;
        this.startTime = Date.now();
        
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.gameLoop();
    }

    createPiece() {
        const shapeIndex = Math.floor(Math.random() * TetrisGame.SHAPES.length);
        return {
            shape: TetrisGame.SHAPES[shapeIndex],
            color: TetrisGame.COLORS[shapeIndex],
            x: Math.floor((this.cols - TetrisGame.SHAPES[shapeIndex][0].length) / 2),
            y: 0
        };
    }

    handleKeyPress(event) {
        if (!this.isPlaying || this.gameOver) return;

        switch (event.key) {
            case 'ArrowLeft':
                if (this.isValidMove(this.currentPiece.x - 1, this.currentPiece.y, this.currentPiece.shape)) {
                    this.currentPiece.x--;
                }
                break;
            case 'ArrowRight':
                if (this.isValidMove(this.currentPiece.x + 1, this.currentPiece.y, this.currentPiece.shape)) {
                    this.currentPiece.x++;
                }
                break;
            case 'ArrowDown':
                if (this.isValidMove(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
                    this.currentPiece.y++;
                    this.score += 1;
                }
                break;
            case 'ArrowUp':
                const rotated = this.rotate(this.currentPiece.shape);
                if (this.isValidMove(this.currentPiece.x, this.currentPiece.y, rotated)) {
                    this.currentPiece.shape = rotated;
                }
                break;
            case ' ':
                while (this.isValidMove(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
                    this.currentPiece.y++;
                    this.score += 2;
                }
                break;
        }
        this.draw();
    }

    rotate(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                rotated[col][rows - 1 - row] = shape[row][col];
            }
        }
        return rotated;
    }

    isValidMove(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return false;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    mergePiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardY = this.currentPiece.y + row;
                    if (boardY < 0) {
                        this.gameOver = true;
                        return;
                    }
                    this.board[boardY][this.currentPiece.x + col] = this.currentPiece.color;
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                row++; // 同じ行を再チェック
            }
        }
        
        if (linesCleared > 0) {
            this.score += [40, 100, 300, 1200][linesCleared - 1] * (this.difficulty === 'HARD' ? 3 : this.difficulty === 'NORMAL' ? 2 : 1);
        }
    }

    async saveScore() {
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        try {
            const response = await fetch('http://localhost:5000/tetris/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: this.playerName,
                    score: this.score,
                    difficulty: this.difficulty,
                    play_time: playTime
                })
            });
            
            if (!response.ok) {
                throw new Error('スコアの保存に失敗しました');
            }
        } catch (error) {
            console.error('スコアの保存に失敗しました:', error);
        }
    }

    draw() {
        // メインボードのクリア
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 固定されたブロックの描画
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(this.ctx, col, row, this.board[row][col]);
                }
            }
        }
        
        // 現在のピースの描画
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    this.drawBlock(
                        this.ctx,
                        this.currentPiece.x + col,
                        this.currentPiece.y + row,
                        this.currentPiece.color
                    );
                }
            }
        }
        
        // 次のピースの表示エリアのクリア
        this.nextCtx.fillStyle = '#fff';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        // 次のピースの描画
        const offsetX = Math.floor((4 - this.nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((4 - this.nextPiece.shape.length) / 2);
        
        for (let row = 0; row < this.nextPiece.shape.length; row++) {
            for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                if (this.nextPiece.shape[row][col]) {
                    this.drawBlock(
                        this.nextCtx,
                        offsetX + col,
                        offsetY + row,
                        this.nextPiece.color
                    );
                }
            }
        }
    }

    drawBlock(context, x, y, color) {
        const bx = x * this.blockSize;
        const by = y * this.blockSize;
        
        context.fillStyle = color;
        context.fillRect(bx, by, this.blockSize, this.blockSize);
        
        context.strokeStyle = '#fff';
        context.strokeRect(bx, by, this.blockSize, this.blockSize);
        
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        context.fillRect(bx, by, this.blockSize / 4, this.blockSize / 4);
    }

    update() {
        if (this.isValidMove(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
        } else {
            this.mergePiece();
            if (this.gameOver) {
                this.isPlaying = false;
                this.saveScore();
                document.dispatchEvent(new CustomEvent('gameOver', { 
                    detail: { score: this.score }
                }));
                return;
            }
            
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.createPiece();
            
            if (!this.isValidMove(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
                this.gameOver = true;
                this.isPlaying = false;
                this.saveScore();
                document.dispatchEvent(new CustomEvent('gameOver', { 
                    detail: { score: this.score }
                }));
                return;
            }
        }
        
        this.draw();
    }

    gameLoop() {
        if (!this.isPlaying) return;
        
        this.update();
        setTimeout(() => this.gameLoop(), this.speed);
    }
}

// UIの制御
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('tetrisModal');
    const setupScreen = document.getElementById('tetrisSetup');
    const gameScreen = document.getElementById('tetrisGame');
    const rankingScreen = document.getElementById('tetrisRanking');
    const playerNameInput = document.getElementById('playerNameInput');
    const startButton = document.getElementById('startButton');
    const rankingTabs = document.getElementById('rankingTabs');
    const rankingTable = document.getElementById('rankingTable');
    const gameCanvas = document.getElementById('tetrisCanvas');
    const nextCanvas = document.getElementById('nextPieceCanvas');
    const scoreDisplay = document.getElementById('scoreDisplay');
    let selectedDifficulty = null;
    let game = null;

    // 難易度ボタンのイベントリスナー
    document.querySelectorAll('.tetris-difficulty button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tetris-difficulty button').forEach(b => 
                b.classList.remove('active'));
            button.classList.add('active');
            selectedDifficulty = button.dataset.difficulty;
        });
    });

    // テトリス開始ボタンのイベントリスナー
    document.getElementById('tetrisStartBtn').addEventListener('click', () => {
        modal.style.display = 'block';
        setupScreen.style.display = 'block';
        gameScreen.style.display = 'none';
        rankingScreen.style.display = 'none';
    });

    // ゲーム開始ボタンのイベントリスナー
    startButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (!playerName || !selectedDifficulty) {
            alert('名前と難易度を選択してください');
            return;
        }
        
        setupScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        
        game = new TetrisGame(gameCanvas, nextCanvas);
        game.init(selectedDifficulty, playerName);
        
        // スコア表示の更新
        const updateScore = () => {
            if (game && game.isPlaying) {
                scoreDisplay.textContent = game.score;
                requestAnimationFrame(updateScore);
            }
        };
        updateScore();
    });

    // ゲームオーバー時の処理
    document.addEventListener('gameOver', async (event) => {
        gameScreen.style.display = 'none';
        rankingScreen.style.display = 'block';
        await loadRanking(selectedDifficulty);
    });

    // ランキングの読み込みと表示
    async function loadRanking(difficulty) {
        try {
            const response = await fetch(`http://localhost:5000/tetris/scores/${difficulty}`);
            const scores = await response.json();
            
            const tableHTML = `
                <thead>
                    <tr>
                        <th>順位</th>
                        <th>名前</th>
                        <th>スコア</th>
                        <th>プレイ時間</th>
                        <th>日時</th>
                    </tr>
                </thead>
                <tbody>
                    ${scores.map((score, index) => `
                        <tr ${game && score.player_name === game.playerName ? 'class="highlight"' : ''}>
                            <td>${index + 1}</td>
                            <td>${score.player_name}</td>
                            <td>${score.score}</td>
                            <td>${Math.floor(score.play_time / 60)}分${score.play_time % 60}秒</td>
                            <td>${new Date(score.played_at).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            rankingTable.innerHTML = tableHTML;
        } catch (error) {
            console.error('ランキングの取得に失敗しました:', error);
            rankingTable.innerHTML = '<tr><td colspan="5">ランキングの取得に失敗しました</td></tr>';
        }
    }

    // 難易度タブの切り替え
    rankingTabs.addEventListener('click', async (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#rankingTabs button').forEach(btn => 
                btn.classList.remove('active'));
            e.target.classList.add('active');
            await loadRanking(e.target.dataset.difficulty);
        }
    });

    // モーダルを閉じる
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none';
            if (game) {
                game.isPlaying = false;
            }
        });
    });
});
