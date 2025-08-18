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

let isDrawing = false;
let isChecking = false;
let currentNumber = 0;
let currentColor = '#ff69b4';
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'];
let attempts = 0;
let score = 0;
let numberScores = {};

function loadStats() {
    const savedScores = localStorage.getItem('numberScores');
    const savedScore = localStorage.getItem('totalScore');

    if (savedScores) {
        numberScores = JSON.parse(savedScores);
    } else {
        numberScores = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
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
    currentNumber = numbers[Math.floor(Math.random() * numbers.length)];
    currentColor = colors[Math.floor(Math.random() * colors.length)];
    numberPrompt.textContent = `Draw the number`;
    speak(currentNumber.toString());
    clearCanvas();
    attempts = 0;
    drawGuide();
    feedbackContainer.textContent = '';
    checkButton.disabled = false;
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGuide() {
    if (numberScores[currentNumber] < 4 || attempts >= 2) {
        // Simple guide for now - just show the number transparently
        ctx.save();
        ctx.font = '200px "Comic Sans MS"';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentNumber, canvas.width / 2, canvas.height / 2);
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

async function checkNumber() {
    if (isCanvasEmpty()) {
        feedbackContainer.textContent = "Please draw a number first!";
        feedbackContainer.style.color = '#ff6347'; // Use the 'try again' color
        return;
    }

    isChecking = true;
    checkButton.disabled = true;
    feedbackContainer.textContent = "Checking...";
    feedbackContainer.style.color = '#888';

    const { data: { text } } = await Tesseract.recognize(
        canvas,
        'eng',
        {
            logger: m => console.log(m),
            tessedit_char_whitelist: '0123456789',
        }
    );

    const recognizedNumber = parseInt(text.trim());

    if (recognizedNumber === currentNumber) {
        score++;
        numberScores[currentNumber]++;
        scoreContainer.textContent = `Score: ${score}`;
        saveStats();
        feedbackContainer.textContent = "Great job!";
        feedbackContainer.style.color = '#4caf50';
        setTimeout(startLevel, 1500);
    } else {
        attempts++;
        feedbackContainer.textContent = `I see a ${recognizedNumber}. Try again!`;
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


canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

checkButton.addEventListener('click', checkNumber);
startButton.addEventListener('click', initGame);
replaySoundButton.addEventListener('click', () => speak(currentNumber.toString()));
clearButton.addEventListener('click', () => {
    clearCanvas();
    drawGuide();
});
loadStats();