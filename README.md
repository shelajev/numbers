# Learn Numbers Game

A fun and interactive game for kids to learn how to write numbers. The game uses your browser's speech synthesis to announce a number, and you draw it on the canvas. An OCR (Optical Character Recognition) engine then checks your drawing.

**Play the game here: [shelajev.github.io/numbers](https://shelajev.github.io/numbers)**

## Features

- **Intelligent OCR Checking**: Uses Tesseract.js to recognize the numbers you draw.
- **Voice Prompts**: The game speaks the number you need to draw.
- **Replay Sound**: A button to replay the voice prompt if you miss it.
- **Adaptive Hints**: A transparent guide of the number is shown to help you. This guide disappears after you've successfully drawn a number four times.
- **Helpful Re-Hinting**: If you get stuck on a number you've already mastered, the hint will reappear after two incorrect attempts.
- **Score Tracking**: Keeps track of your total score.
- **Persistent Stats**: Your scores for each number are saved in your browser's `localStorage`, so you can pick up where you left off.
- **Distraction-Free Drawing**: The canvas is locked while the game is checking your answer.

## How to Play

1.  Click the "Start Game" button.
2.  Listen to the voice prompt to know which number to draw.
3.  Use your mouse or finger (on touch devices) to draw the number on the canvas.
4.  Click the "Check" button to have your drawing recognized.
5.  If you're correct, you'll get a point and a new number.
6.  If you're incorrect, you can try again.
7.  Click the speaker icon (🔊) at any time to hear the prompt again.