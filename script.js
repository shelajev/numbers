const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const checkButton = document.getElementById('check-button');
const numberPrompt = document.getElementById('number-prompt');
const feedbackContainer = document.getElementById('feedback-container');

let isDrawing = false;
let currentNumber = 0;
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
let attempts = 0;

function startLevel() {
    currentNumber = numbers[Math.floor(Math.random() * numbers.length)];
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
    if (attempts < 5) {
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
    e.preventDefault();
    isDrawing = true;
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getMousePos(e);
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ff69b4';
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

async function checkNumber() {
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

window.onload = startLevel;
