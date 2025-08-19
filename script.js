const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const checkButton = document.getElementById('check-button');
const numberPrompt = document.getElementById('number-prompt');
const feedbackContainer = document.getElementById('feedback-container');
const scoreContainer = document.getElementById('score-container');
const startContainer = document.getElementById('start-container');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container');
const replaySoundButton = document.getElementById('replay-sound-button');
const clearButton = document.getElementById('clear-button');
const statsButton = document.getElementById('stats-button');
const statsModal = document.getElementById('stats-modal');
const statsContainer = document.getElementById('stats-container');
const closeButton = document.querySelector('.close-button');
const modeSwitchButton = document.getElementById('mode-switch-button');

let isDrawing = false;
let isChecking = false;
let currentCharacter = 0;
let currentColor = '#ff69b4';
let gameMode = 'numbers'; // 'numbers' or 'letters'

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'];

let attempts = 0;
let score = 0;
let numberScores = {};
let letterScores = {};
let sessionCorrectAnswers = 0;
let numbersExpanded = false;

function loadStats() {
    const savedNumberScores = localStorage.getItem('numberScores');
    const savedLetterScores = localStorage.getItem('letterScores');
    const savedScore = localStorage.getItem('totalScore');

    if (savedNumberScores) {
        numberScores = JSON.parse(savedNumberScores);
    } else {
        numberScores = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    }

    if (savedLetterScores) {
        letterScores = JSON.parse(savedLetterScores);
    } else {
        letterScores = {};
        letters.forEach(l => letterScores[l] = 0);
    }

    if (savedScore) {
        score = parseInt(savedScore, 10);
    } else {
        score = 0;
    }
    scoreContainer.textContent = `Score: ${score}`;
}

function saveStats() {
    localStorage.setItem('numberScores', JSON.stringify(numberScores));
    localStorage.setItem('letterScores', JSON.stringify(letterScores));
    localStorage.setItem('totalScore', score.toString());
}

function initGame() {
    startContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    loadStats();
    startLevel();
}

function startLevel() {
    isChecking = false;
    const characterSet = gameMode === 'numbers' ? numbers : letters;
    currentCharacter = characterSet[Math.floor(Math.random() * characterSet.length)];
    currentColor = colors[Math.floor(Math.random() * colors.length)];
    numberPrompt.textContent = `Draw the ${gameMode === 'numbers' ? 'number' : 'letter'}`;
    speak(currentCharacter.toString());
    clearCanvas();
    attempts = 0;
    drawGuide();
    feedbackContainer.textContent = '';
    checkButton.disabled = false;
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('Female') && voice.lang.startsWith('en'));
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    speechSynthesis.speak(utterance);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGuide() {
    const scores = gameMode === 'numbers' ? numberScores : letterScores;
    if (scores[currentCharacter] < 4 || attempts >= 2) {
        // Simple guide for now - just show the number transparently
        ctx.save();
        const fontSize = currentCharacter > 9 ? '150px' : '200px';
        ctx.font = `${fontSize} "Comic Sans MS"`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentCharacter, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }
}

function startDrawing(e) {
    if (isChecking) return;
    e.preventDefault();
    isDrawing = true;
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    e.preventDefault();
    if (!isDrawing || isChecking) return;
    const pos = getMousePos(e);
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    return { x, y };
}

function isCanvasEmpty() {
    const pixelBuffer = new Uint32Array(
        ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !pixelBuffer.some(color => color !== 0);
}

async function checkCharacter() {
    if (isCanvasEmpty()) {
        feedbackContainer.textContent = "Please draw something first!";
        feedbackContainer.style.color = '#ff6347'; // Use the 'try again' color
        return;
    }

    isChecking = true;
    checkButton.disabled = true;
    feedbackContainer.textContent = "Checking...";
    feedbackContainer.style.color = '#888';

    const whitelist = gameMode === 'numbers' ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const { data } = await Tesseract.recognize(
        canvas,
        'eng',
        {
            logger: m => console.log(m),
            tessedit_char_whitelist: whitelist,
        }
    );

    const recognizedText = data.text.trim().toUpperCase();
    let recognizedChar;
    if (gameMode === 'numbers') {
        recognizedChar = parseInt(recognizedText);
    } else {
        recognizedChar = recognizedText.length > 0 ? recognizedText[0] : '';
    }

    let isCorrect = (recognizedChar === currentCharacter);

    // Relax the check by looking at other choices from Tesseract
    if (!isCorrect && data.symbols) {
        for (const symbol of data.symbols) {
            for (const choice of symbol.choices) {
                let choiceChar;
                const choiceText = choice.text.trim().toUpperCase();
                if (gameMode === 'numbers') {
                    choiceChar = parseInt(choiceText);
                } else {
                    choiceChar = choiceText.length > 0 ? choiceText[0] : '';
                }

                if (choiceChar === currentCharacter && choice.confidence > 40) {
                    isCorrect = true;
                    break;
                }
            }
            if (isCorrect) break;
        }
    }

    if (isCorrect) {
        score++;
        const scores = gameMode === 'numbers' ? numberScores : letterScores;
        scores[currentCharacter]++;
        if (gameMode === 'numbers') {
            sessionCorrectAnswers++;
        }
        scoreContainer.textContent = `Score: ${score}`;
        saveStats();
        feedbackContainer.textContent = "Great job!";
        feedbackContainer.style.color = '#4caf50';

        if (gameMode === 'numbers' && sessionCorrectAnswers === 4 && !numbersExpanded) {
            numbersExpanded = true;
            for (let i = 10; i <= 20; i++) {
                numbers.push(i);
                if (!numberScores.hasOwnProperty(i)) {
                    numberScores[i] = 0;
                }
            }
            feedbackContainer.textContent = "Great! Now for bigger numbers!";
        }

        setTimeout(startLevel, 1500);
    } else {
        attempts++;
        const displayedChar = (gameMode === 'numbers' && isNaN(recognizedChar)) || (gameMode === 'letters' && !recognizedChar)
            ? "something else"
            : `a ${recognizedChar}`;
        feedbackContainer.textContent = `I see ${displayedChar}. Try again!`;
        feedbackContainer.style.color = '#ff6347';
        checkButton.disabled = false;
        setTimeout(() => {
            clearCanvas();
            drawGuide();
            feedbackContainer.textContent = '';
            isChecking = false;
        }, 2000);
    }
}



function showStats() {
    statsContainer.innerHTML = '';
    const scores = gameMode === 'numbers' ? numberScores : letterScores;
    for (const char in scores) {
        const statItem = document.createElement('div');
        statItem.classList.add('stat-item');
        statItem.textContent = `${char}: ${scores[char]}`;
        statsContainer.appendChild(statItem);
    }
    statsModal.style.display = 'block';
}

function hideStats() {
    statsModal.style.display = 'none';
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

function switchMode() {
    if (gameMode === 'numbers') {
        gameMode = 'letters';
        modeSwitchButton.textContent = 'Switch to Numbers';
    } else {
        gameMode = 'numbers';
        modeSwitchButton.textContent = 'Switch to Letters';
    }
    startLevel();
}

checkButton.addEventListener('click', checkCharacter);
startButton.addEventListener('click', initGame);
replaySoundButton.addEventListener('click', () => speak(currentCharacter.toString()));
clearButton.addEventListener('click', () => {
    clearCanvas();
    drawGuide();
});
statsButton.addEventListener('click', showStats);
modeSwitchButton.addEventListener('click', switchMode);
closeButton.addEventListener('click', hideStats);
window.addEventListener('click', (event) => {
    if (event.target == statsModal) {
        hideStats();
    }
});
loadStats();