// じゃんけんの手の定義
const HANDS = {
    ROCK: 'rock',
    PAPER: 'paper',
    SCISSORS: 'scissors'
};

// 勝敗の定義
const RESULT = {
    WIN: 'win',
    LOSE: 'lose',
    TIE: 'tie'
};

// ゲームの状態管理
const gameState = {
    history: [],
    winCount: 0,
    tieCount: 0,
    loseCount: 0,
    totalGames: 0,
    lastResult: null,
    lastPlayerHand: null,
    lastAIHand: null,
    aiHandCounts: {
        [HANDS.ROCK]: 0,
        [HANDS.PAPER]: 0,
        [HANDS.SCISSORS]: 0
    }
};

// AIの手を決定する関数
function decideAIHand() {
    // 初手の場合
    if (gameState.history.length === 0) {
        const rand = Math.random();
        if (rand < 0.35) return HANDS.ROCK;
        if (rand < 0.667) return HANDS.PAPER;
        return HANDS.SCISSORS;
    }

    const lastGame = gameState.history[gameState.history.length - 1];
    let probabilities = {};

    // Win-Stay/Lose-Shift の実装
    if (lastGame.result === RESULT.WIN) {
        // 勝った場合は同じ手を50%で出す
        probabilities[lastGame.aiHand] = 0.5;
        const otherHands = Object.values(HANDS).filter(h => h !== lastGame.aiHand);
        probabilities[otherHands[0]] = 0.25;
        probabilities[otherHands[1]] = 0.25;
    } else if (lastGame.result === RESULT.LOSE) {
        // 負けた場合は「負けた手に勝つ手」を60%で出す
        const winningHand = getWinningHand(lastGame.aiHand);
        probabilities[winningHand] = 0.6;
        const otherHands = Object.values(HANDS).filter(h => h !== winningHand);
        probabilities[otherHands[0]] = 0.2;
        probabilities[otherHands[1]] = 0.2;
    } else {
        // 引き分けの場合は同じ手を40%で出す
        probabilities[lastGame.aiHand] = 0.4;
        const otherHands = Object.values(HANDS).filter(h => h !== lastGame.aiHand);
        probabilities[otherHands[0]] = 0.3;
        probabilities[otherHands[1]] = 0.3;
    }

    // 3連続同手を避ける補正
    if (gameState.history.length >= 2) {
        const lastTwoHands = gameState.history.slice(-2).map(game => game.aiHand);
        if (lastTwoHands[0] === lastTwoHands[1]) {
            probabilities[lastTwoHands[0]] = 0.05;
            const otherHands = Object.values(HANDS).filter(h => h !== lastTwoHands[0]);
            probabilities[otherHands[0]] = 0.475;
            probabilities[otherHands[1]] = 0.475;
        }
    }

    // 確率に基づいて手を選択
    const rand = Math.random();
    let cumulative = 0;
    for (const [hand, prob] of Object.entries(probabilities)) {
        cumulative += prob;
        if (rand < cumulative) return hand;
    }
    return HANDS.ROCK; // フォールバック
}

// 勝つ手を取得する関数
function getWinningHand(hand) {
    switch (hand) {
        case HANDS.ROCK: return HANDS.PAPER;
        case HANDS.PAPER: return HANDS.SCISSORS;
        case HANDS.SCISSORS: return HANDS.ROCK;
    }
}

// 勝敗を判定する関数
function judgeResult(playerHand, aiHand) {
    if (playerHand === aiHand) return RESULT.TIE;
    if (getWinningHand(aiHand) === playerHand) return RESULT.WIN;
    return RESULT.LOSE;
}

// 結果メッセージを取得する関数
function getResultMessage(result, playerHand, aiHand) {
    const handNames = {
        [HANDS.ROCK]: 'グー',
        [HANDS.PAPER]: 'パー',
        [HANDS.SCISSORS]: 'チョキ'
    };
    
    const messages = {
        [RESULT.WIN]: 'YOU WIN!',
        [RESULT.LOSE]: 'YOU LOSE!',
        [RESULT.TIE]: 'DRAW'
    };

    return `${handNames[playerHand]} vs ${handNames[aiHand]} - ${messages[result]}`;
}

// 結果表示を更新する関数
function updateResultDisplay(result, playerHand, aiHand) {
    const resultElement = document.getElementById('result-message');
    resultElement.textContent = getResultMessage(result, playerHand, aiHand);
    
    // 既存のクラスを削除
    resultElement.classList.remove('win', 'lose', 'tie', 'show');
    
    // 新しいクラスを追加
    resultElement.classList.add(result);
    
    // アニメーションを開始
    requestAnimationFrame(() => {
        resultElement.classList.add('show');
    });
}

// 履歴を更新する関数
function updateHistory(result, playerHand, aiHand) {
    gameState.history.push({ result, playerHand, aiHand });
    
    // 結果カウントの更新
    if (result === RESULT.WIN) gameState.winCount++;
    else if (result === RESULT.TIE) gameState.tieCount++;
    else gameState.loseCount++;
    
    gameState.totalGames++;
    gameState.lastResult = result;
    gameState.lastPlayerHand = playerHand;
    gameState.lastAIHand = aiHand;
    
    // AIの手のカウントを更新
    gameState.aiHandCounts[aiHand]++;

    // 履歴表示を更新
    const historyElement = document.getElementById('history');
    historyElement.innerHTML = gameState.history.slice(-10).map(game => {
        const iconClass = `history-icon ${game.result}`;
        const handIcon = game.playerHand === HANDS.ROCK ? '✊️' :
                        game.playerHand === HANDS.PAPER ? '✋️' : '✌️';
        return `<div class="${iconClass}">${handIcon}</div>`;
    }).join('');

    // 統計情報を更新
    updateStats();
}

// 統計情報を更新する関数
function updateStats() {
    // 勝敗カウントの更新
    document.getElementById('win-count').textContent = gameState.winCount;
    document.getElementById('tie-count').textContent = gameState.tieCount;
    document.getElementById('lose-count').textContent = gameState.loseCount;
    document.getElementById('total-count').textContent = gameState.totalGames;

    // 勝率（引き分け含む）の更新
    const winRateWithTies = gameState.totalGames > 0 ? 
        (gameState.winCount / gameState.totalGames) * 100 : 0;
    document.getElementById('win-rate-with-ties').textContent = 
        `${winRateWithTies.toFixed(1)}%`;

    // 勝率（引き分け除く）の更新
    const winRateWithoutTies = (gameState.winCount + gameState.loseCount) > 0 ?
        (gameState.winCount / (gameState.winCount + gameState.loseCount)) * 100 : 0;
    document.getElementById('win-rate-without-ties').textContent = 
        `${winRateWithoutTies.toFixed(1)}%`;

    // 勝率バーの更新（引き分け含む勝率を使用）
    document.getElementById('win-rate-bar').style.width = `${winRateWithTies}%`;

    // AIの手の出現割合を更新
    const total = gameState.totalGames;
    if (total > 0) {
        const rockRate = (gameState.aiHandCounts[HANDS.ROCK] / total) * 100;
        const paperRate = (gameState.aiHandCounts[HANDS.PAPER] / total) * 100;
        const scissorsRate = (gameState.aiHandCounts[HANDS.SCISSORS] / total) * 100;

        document.getElementById('rock-rate').textContent = `${rockRate.toFixed(1)}%`;
        document.getElementById('paper-rate').textContent = `${paperRate.toFixed(1)}%`;
        document.getElementById('scissors-rate').textContent = `${scissorsRate.toFixed(1)}%`;
    }
}

// 次のおすすめの手を提案する関数
function suggestNextHand() {
    if (gameState.history.length === 0) {
        return HANDS.PAPER; // 初手はパーが有利
    }

    const lastGame = gameState.history[gameState.history.length - 1];
    
    // Win-Stay/Lose-Shift に基づく提案
    if (lastGame.result === RESULT.WIN) {
        // 勝った場合は、AIが同じ手を出す確率が高いので、それに勝つ手を提案
        return getWinningHand(lastGame.aiHand);
    } else if (lastGame.result === RESULT.LOSE) {
        // 負けた場合は、AIが「負けた手に勝つ手」を出す確率が高いので、それに勝つ手を提案
        const aiNextHand = getWinningHand(lastGame.aiHand);
        return getWinningHand(aiNextHand);
    } else {
        // 引き分けの場合は、AIが同じ手を出す確率が高いので、それに勝つ手を提案
        return getWinningHand(lastGame.aiHand);
    }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    // じゃんけんボタンのイベントリスナー
    document.querySelectorAll('.janken-btn').forEach(button => {
        button.addEventListener('click', () => {
            const playerHand = button.dataset.hand;
            const aiHand = decideAIHand();
            const result = judgeResult(playerHand, aiHand);
            
            updateResultDisplay(result, playerHand, aiHand);
            updateHistory(result, playerHand, aiHand);
        });
    });

    // おすすめの手ボタンのイベントリスナー
    document.getElementById('suggest-btn').addEventListener('click', () => {
        const suggestedHand = suggestNextHand();
        const handNames = {
            [HANDS.ROCK]: 'グー',
            [HANDS.PAPER]: 'パー',
            [HANDS.SCISSORS]: 'チョキ'
        };
        alert(`次は${handNames[suggestedHand]}を出してみましょう！`);
    });

    // 詳しく読むボタンのイベントリスナー
    document.querySelectorAll('#strategy button').forEach(button => {
        button.addEventListener('click', () => {
            // モーダルの実装は省略（必要に応じて追加）
            alert('論文や記事の詳細は準備中です。');
        });
    });
}); 