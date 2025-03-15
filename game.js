const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const jumpButton = document.getElementById('jumpButton');

// Make canvas responsive
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const containerWidth = container.clientWidth;
    const scale = containerWidth / 320;
    canvas.style.height = (480 * scale) + 'px';
    
    // Update canvas rendering context
    canvas.width = 320;
    canvas.height = 480;
    ctx.scale(1, 1); // Reset scale
}

// Call resize on load and window resize
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Game variables
let coins = parseInt(localStorage.getItem('coins')) || 0;
const CONTINUE_COST = 10; // Changed continue cost to 10 coins
const COINS_PER_PIPE = 5; // Coins earned per pipe
const COINS_PER_POINT = 0; // Removed score-based coins

const bird = {
    x: 50,
    y: canvas.height / 2,
    velocity: 0,
    gravity: 0.2,  // Reduced gravity further
    jump: -5,      // Reduced jump power for smoother motion
    size: 30,      // Bird size
    rotation: 0,   // Bird rotation
    wingAngle: 0   // Added wing animation
};

const pipes = [];
const pipeWidth = 60;    // Increased pipe width
const pipeGap = 160;     // Increased gap slightly
const pipeSpeed = 1.5;   // Reduced pipe speed
let score = 0;
let gameOver = false;
let frames = 0;
let highScore = localStorage.getItem('highScore') || 0;
let canContinue = false; // Flag to check if player can continue
let gameOverAnimation = 0;
let scoreCountAnimation = 0;
let finalScoreDisplay = 0;
let popUpScale = 0;

// Add this function at the top of the file, after canvas initialization
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Event listeners
function handleJump(e) {
    if (e.type === 'touchstart') {
        e.preventDefault();
    }
    
    if (!gameOver) {
        bird.velocity = bird.jump;
        bird.rotation = -45;
    }
}

// Handle keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOver) {
        if (e.key === '1') {
            resetGame();
        } else if (e.key === '2' && coins >= CONTINUE_COST) {
            continueGame();
        }
    } else if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleJump(e);
    }
});

// Handle touch controls
function handleTouch(e) {
    if (e.type === 'touchstart') {
        e.preventDefault();
    }
    
    if (gameOver) {
        // Get touch position
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const y = touch.clientY - rect.top;
        
        // Check if touch is in the options area
        if (y > canvas.height/2 && y < canvas.height/2 + 100) {
            if (y < canvas.height/2 + 50) {
                resetGame();
            } else if (coins >= CONTINUE_COST) {
                continueGame();
            }
        }
    } else {
        handleJump(e);
    }
}

// Mobile touch controls
jumpButton.addEventListener('touchstart', handleJump);
jumpButton.addEventListener('mousedown', handleJump);

// Canvas touch controls
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', (e) => e.preventDefault());
canvas.addEventListener('touchend', (e) => e.preventDefault());

// Game functions
function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: height,
        passed: false
    });
}

function resetGame() {
    // Reset bird position and physics
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    
    // Clear all pipes
    pipes.length = 0;
    
    // Reset game state
    gameOver = false;
    frames = 0;
    canContinue = false;
    
    // Reset only the score, keep coins
    score = 0;
    
    // Create initial pipe
    createPipe();
}

function continueGame() {
    coins -= CONTINUE_COST;
    localStorage.setItem('coins', coins);
    
    // Save current score
    const currentScore = score;
    
    // Reset everything like a new game
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes.length = 0;
    gameOver = false;
    frames = 0;
    canContinue = false;
    
    // Create initial pipe setup
    createPipe();
    
    // Restore the score
    score = currentScore;
}

function update() {
    if (gameOver) return;
    frames++;

    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    // Update bird rotation
    if (bird.velocity >= 0) {
        bird.rotation += 2;
        if (bird.rotation > 70) bird.rotation = 70;  // Reduced max rotation
    }

    // Update wing animation
    bird.wingAngle = Math.sin(frames * 0.3) * 15;  // Wing flapping animation

    // Create new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 220) {
        createPipe();
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;

        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
            continue;
        }

        // Check collision
        if (
            bird.x + bird.size - 5 > pipes[i].x &&
            bird.x + 5 < pipes[i].x + pipeWidth &&
            (bird.y + 5 < pipes[i].topHeight || bird.y + bird.size - 5 > pipes[i].topHeight + pipeGap)
        ) {
            gameOver = true;
            canContinue = true;
            
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
        }

        // Update score and coins
        if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
            pipes[i].passed = true;
            score++;
            // Add coins for passing pipe
            coins += COINS_PER_PIPE;
            localStorage.setItem('coins', coins);
        }
    }

    // Check boundaries
    if (bird.y < 0 || bird.y + bird.size > canvas.height) {
        gameOver = true;
        canContinue = true;
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
    }

    if (gameOver) {
        gameOverAnimation = Math.min(gameOverAnimation + 0.15, 1);
        if (gameOverAnimation > 0.1) {
            popUpScale = Math.min(popUpScale + 0.25, 1);
        }
        if (gameOverAnimation > 0.2) {
            finalScoreDisplay = Math.min(finalScoreDisplay + 2, score);
        }
        return;
    }
}

function draw() {
    // Draw sky gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds (simple background elements)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    let cloudX = (frames * 0.3) % canvas.width;
    drawCloud(cloudX, 50);
    drawCloud((cloudX + 200) % canvas.width, 100);

    // Draw pipes with 3D effect
    pipes.forEach(pipe => {
        // Draw pipe shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(pipe.x + 5, 0, pipeWidth, pipe.topHeight);
        ctx.fillRect(pipe.x + 5, pipe.topHeight + pipeGap, pipeWidth, canvas.height - pipe.topHeight - pipeGap);

        // Draw main pipe
        const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        pipeGradient.addColorStop(0, '#2ECC71');
        pipeGradient.addColorStop(0.5, '#27AE60');
        pipeGradient.addColorStop(1, '#229954');
        ctx.fillStyle = pipeGradient;

        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.topHeight + pipeGap, pipeWidth, canvas.height - pipe.topHeight - pipeGap);

        // Pipe caps
        ctx.fillStyle = '#229954';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.topHeight + pipeGap, pipeWidth + 10, 20);
    });

    // Draw bird with rotation and 3D effect
    ctx.save();
    ctx.translate(bird.x + bird.size/2, bird.y + bird.size/2);
    ctx.rotate(bird.rotation * Math.PI/180);
    
    // Bird shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    drawBirdShape(2, 2, 0.95);  // Offset shadow
    ctx.fill();
    
    // Bird body gradient
    const birdGradient = ctx.createLinearGradient(-bird.size/2, -bird.size/2, bird.size/2, bird.size/2);
    birdGradient.addColorStop(0, '#F1C40F');  // Main yellow
    birdGradient.addColorStop(0.5, '#F4D03F');  // Lighter yellow
    birdGradient.addColorStop(1, '#D4AC0D');  // Darker yellow
    ctx.fillStyle = birdGradient;
    
    // Draw main bird body
    ctx.beginPath();
    drawBirdShape(0, 0, 1);
    ctx.fill();
    
    // Draw wing with animation
    ctx.save();
    ctx.rotate(bird.wingAngle * Math.PI/180);  // Animate wing
    const wingGradient = ctx.createLinearGradient(-bird.size/3, 0, bird.size/3, 0);
    wingGradient.addColorStop(0, '#D4AC0D');
    wingGradient.addColorStop(1, '#F4D03F');
    ctx.fillStyle = wingGradient;
    ctx.beginPath();
    ctx.ellipse(-bird.size/4, 0, bird.size/3, bird.size/4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Bird details
    // Eye
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(bird.size/4, -bird.size/6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.size/4, -bird.size/6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = '#E67E22';
    ctx.beginPath();
    ctx.moveTo(bird.size/2, -bird.size/8);
    ctx.lineTo(bird.size/2 + 10, 0);
    ctx.lineTo(bird.size/2, bird.size/8);
    ctx.closePath();
    ctx.fill();
    
    // Beak highlight
    ctx.fillStyle = '#D35400';
    ctx.beginPath();
    ctx.moveTo(bird.size/2, -bird.size/8);
    ctx.lineTo(bird.size/2 + 10, 0);
    ctx.lineTo(bird.size/2 + 5, -bird.size/16);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();

    // Draw coins
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`🪙 ${coins}`, 12, 122);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🪙 ${coins}`, 10, 120);

    // Draw score and high score with shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Score: ${score}`, 12, 42);
    ctx.fillText(`Best: ${highScore}`, 12, 82);
    
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, 10, 40);
    ctx.fillText(`Best: ${highScore}`, 10, 80);

    if (gameOver) {
        // Animate background overlay with fade
        ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * gameOverAnimation})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Game over panel animation with pop-up effect
        const panelHeight = 240;
        const panelWidth = 280;
        const panelY = canvas.height/2 - panelHeight/2;
        const panelX = canvas.width/2 - panelWidth/2;
        
        // Calculate scale and position for pop-up effect
        const currentScale = 0.5 + (0.5 * popUpScale);
        
        // Panel background with gradient and glow effect
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.scale(currentScale, currentScale);
        ctx.translate(-canvas.width/2, -canvas.height/2);
        
        // Outer glow effect
        ctx.shadowColor = 'rgba(52, 152, 219, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw panel background
        roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);
        const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        panelGradient.addColorStop(0, '#2C3E50');
        panelGradient.addColorStop(1, '#34495E');
        ctx.fillStyle = panelGradient;
        ctx.fill();
        
        // Add decorative border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        roundRect(ctx, panelX + 5, panelY + 5, panelWidth - 10, panelHeight - 10, 12);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        if (popUpScale > 0.5) {
            // Game Over text with gradient and bounce effect
            const bounceOffset = Math.sin(popUpScale * Math.PI) * 10;
            const textGradient = ctx.createLinearGradient(
                panelX, panelY + 40 + bounceOffset,
                panelX + panelWidth, panelY + 80 + bounceOffset
            );
            textGradient.addColorStop(0, '#FF6B6B');
            textGradient.addColorStop(1, '#FF8E8E');
            
            // Add text glow
            ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
            ctx.shadowBlur = 10;
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = textGradient;
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width/2, panelY + 60 + bounceOffset);
            ctx.shadowBlur = 0;
            
            // Score counter with fade in
            const fadeIn = Math.min((popUpScale - 0.5) * 2, 1);
            ctx.font = 'bold 32px Arial';
            ctx.fillStyle = `rgba(236, 240, 241, ${fadeIn})`;
            ctx.fillText(`Score: ${Math.floor(finalScoreDisplay)}`, canvas.width/2, panelY + 110);
            
            // High score display with shine effect
            if (score >= highScore) {
                const shine = Math.sin(Date.now() / 500) * 0.3 + 0.7;
                ctx.shadowColor = 'rgba(241, 196, 15, 0.5)';
                ctx.shadowBlur = 10;
                ctx.font = '24px Arial';
                ctx.fillStyle = `rgba(241, 196, 15, ${shine})`;
                ctx.fillText('New High Score!', canvas.width/2, panelY + 140);
                ctx.shadowBlur = 0;
            }
            
            // Options container with glass effect
            roundRect(ctx, panelX + 20, panelY + 160, panelWidth - 40, 50, 10);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
            
            // Option buttons
            const buttonY = panelY + 185;
            const buttonHeight = 26;
            const buttonWidth = 90;
            const buttonSpacing = 20;
            const buttonRadius = 12; // Increased border radius
            
            // Center calculation for both buttons
            const totalWidth = (buttonWidth * 2) + buttonSpacing;
            const startX = panelX + (panelWidth - totalWidth) / 2;
            
            // Restart button with glow
            ctx.save(); // Save context before clip
            roundRect(ctx, startX, buttonY - 25, buttonWidth, buttonHeight, buttonRadius);
            ctx.clip(); // Clip to button shape
            
            ctx.shadowColor = 'rgba(52, 152, 219, 0.5)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#3498DB';
            ctx.fillRect(startX, buttonY - 25, buttonWidth, buttonHeight);
            ctx.restore(); // Restore context after clip
            
            // Button text
            ctx.font = '16px Arial'; // Slightly smaller font
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillText('Restart', startX + buttonWidth/2, buttonY - 7);
            ctx.fillStyle = '#FFF';
            ctx.fillText('Restart', startX + buttonWidth/2, buttonY - 8);
            
            // Continue button
            if (coins >= CONTINUE_COST) {
                ctx.save(); // Save context before clip
                roundRect(ctx, startX + buttonWidth + buttonSpacing, buttonY - 25, buttonWidth, buttonHeight, buttonRadius);
                ctx.clip(); // Clip to button shape
                
                ctx.shadowColor = 'rgba(46, 204, 113, 0.5)';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#2ECC71';
                ctx.fillRect(startX + buttonWidth + buttonSpacing, buttonY - 25, buttonWidth, buttonHeight);
                ctx.restore(); // Restore context after clip
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillText('Resume', startX + buttonWidth + buttonSpacing + buttonWidth/2, buttonY - 7);
                ctx.fillStyle = '#FFF';
                ctx.fillText('Resume', startX + buttonWidth + buttonSpacing + buttonWidth/2, buttonY - 8);
                ctx.font = '14px Arial';
                ctx.fillText(`${CONTINUE_COST} 🪙`, startX + buttonWidth + buttonSpacing + buttonWidth/2, buttonY + 12);
            } else {
                ctx.save(); // Save context before clip
                roundRect(ctx, startX + buttonWidth + buttonSpacing, buttonY - 25, buttonWidth, buttonHeight, buttonRadius);
                ctx.clip(); // Clip to button shape
                
                ctx.fillStyle = '#7F8C8D';
                ctx.fillRect(startX + buttonWidth + buttonSpacing, buttonY - 25, buttonWidth, buttonHeight);
                ctx.restore(); // Restore context after clip
                
                ctx.fillStyle = '#BDC3C7';
                ctx.font = '14px Arial';
                ctx.fillText(`Need ${CONTINUE_COST}🪙`, startX + buttonWidth + buttonSpacing + buttonWidth/2, buttonY - 7);
            }
            
            ctx.textAlign = 'left'; // Reset text alignment
        }
        
        ctx.restore();
        ctx.textAlign = 'left'; // Reset text alignment
    }
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
    ctx.arc(x + 30, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();

// Helper function to draw bird shape
function drawBirdShape(offsetX, offsetY, scale) {
    const s = bird.size * scale;
    ctx.moveTo(-s/2 + offsetX, -s/3 + offsetY);
    ctx.quadraticCurveTo(
        -s/4 + offsetX, -s/2 + offsetY,
        0 + offsetX, -s/3 + offsetY
    );
    ctx.quadraticCurveTo(
        s/3 + offsetX, -s/3 + offsetY,
        s/2 + offsetX, 0 + offsetY
    );
    ctx.quadraticCurveTo(
        s/3 + offsetX, s/3 + offsetY,
        0 + offsetX, s/3 + offsetY
    );
    ctx.quadraticCurveTo(
        -s/4 + offsetX, s/2 + offsetY,
        -s/2 + offsetX, s/3 + offsetY
    );
    ctx.closePath();
} 