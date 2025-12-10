let totalTyped = 0;
let correctTyped = 0;
let score = 0;
let pausedAccumulated = 0;   
let pausedAt = null; 

let typingStartTime = null;  
let totalTypingTime = 0;     
let wpm = 0;    

let MasterVolume =0.5
const canvas = document.getElementById('myCanvas');
canvas.height=720;
canvas.width=480;
let last = 0;
const objects = [];
const ctx=canvas.getContext("2d");
let playerShip;
const pauseMenu = document.getElementById("pause-menu");
const pauseBtn = document.getElementById("pause-btn");
const continueBtn = document.getElementById("continue-btn");
const restartBtn = document.getElementById("restart-btn-pause");
const volumeSlider = document.getElementById("volume-slider");

// Initialize slider with stored global volume
volumeSlider.value = MasterVolume;

function showPauseMenu() {
    document.getElementById("volume-slider").value=MasterVolume;
    pauseMenu.classList.remove("display-none");
    pauseMenu.classList.add("display-flex");
}

function hidePauseMenu() {
    pauseMenu.classList.add("display-none");
}

pauseBtn.onclick = () => {
    pauseGame();
    showPauseMenu();
};

continueBtn.onclick = () => {
    hidePauseMenu();
    resumeGame();
};

restartBtn.onclick = () => {
    location.reload();
};

volumeSlider.oninput = () => {
    MasterVolume = Number(volumeSlider.value);
    backgroundMusic.volume = MasterVolume;
};
document.getElementById("restart-btn").onclick = () => {
    location.reload();
};


const hitAudio=new Audio("./sounds/hit.ogg")

const plasmeFire=new Audio("./sounds/plasma.ogg")


const clickSound=new Audio("./sounds/click.mp3")

const explosionSound=new Audio("./sounds/explosion.ogg")

const targetFocusAudio=new Audio("./sounds/target.ogg")



function showWaveStats(waveNumber, score) {
    const statsOverlay = document.getElementById("wave-stats");
    const statsContainer = document.getElementById("stats");
    const waveNum = document.getElementById("wave-num");
    const scoreEl = document.getElementById("score");
    pauseBtn.classList.add("display-none")
    waveNum.textContent = `Wave ${waveNumber} complete`;
    scoreEl.textContent = `Score ${String(score).padStart(5, '0')}`;
    statsOverlay.classList.remove("display-none");
    statsOverlay.classList.add("display-flex");
    statsContainer.classList.remove("slide-in");
    void statsContainer.offsetWidth;
    statsContainer.classList.add("slide-in");
}
function hideWaveStats() {
    pauseBtn.classList.remove("display-none")
    document.getElementById("wave-stats").classList.add("display-none");
}
let focusCircleImage = new Image();


const ENEMY_TYPES = {
    DESTROYER: {
        image: "./sprites/destroyer.png",
        width: 43,
        height: 58,
        baseSpeed: 25,
    },
    BULLET: {
        image: "./sprites/bullet.png",
        width: 20,
        height: 24,
        baseSpeed: 50
    },
    MINE:{
        image:"./sprites/mine.png",
        width:32,
        height:32,
        baseSpeed:30
    }
};


const enemyImages = {};



function loadFocusCircleImage() {
    return new Promise(resolve => {
        focusCircleImage.src = './sprites/emp.png';
        focusCircleImage.onload = () => {
            resolve();
        };
    });}

function loadEnemyTypeImages() {
    return Promise.all(
        Object.entries(ENEMY_TYPES).map(([key, type]) => {
            return new Promise(resolve => {
                const img = new Image();
                img.src = type.image;
                img.onload = () => {
                    enemyImages[key] = img;
                    resolve();
                };
            });
        })
    );
}
const backgroundMusic = new Audio('./sounds/soundtrack.mp3');
backgroundMusic.loop = true;

const idleImage = new Image();
idleImage.src = "./sprites/ship.png"; 
const enemyImage = new Image();
enemyImage.src = "./sprites/destroyer.png";
const bg = new Image();
bg.src = './sprites/background.jpg';
const aboveBg=new Image();
aboveBg.src="./sprites/bg.png";
const gridBg=new Image();
gridBg.src="./sprites/grid.png"







function loadPlayerImage() {    
  return new Promise((resolve) => {
        idleImage.onload = () => {
            playerShip = new PlayerShip(idleImage, 24, 24, 7, 40);
            objects.push(playerShip);
            resolve();
        };
      })}




class GameSettings {
    constructor() {
        this.waveCount = 1;

        this.enemiesPerWave = 5;

        this.minSpawnDelay = 300;
        this.maxSpawnDelay = 1200;
        this.DestroyerFireRate=10;
        this.enemySpeedMultiplier=1;
        this.destroyerSpawnChance = 0.2; 
        this.maxDestroyerChance = 0.50;

        this.enemiesKilled = 0;
        this.actualWaveEnemiesCount=this.enemiesPerWave;
    }
    async loadWordPool() {
    const res = await fetch("words.json");
    const data = await res.json();
    this.easyWords = data.easy;
    this.hardWords = data.hard;
    }

    nextWave() {
        this.waveCount++;
        if (this.waveCount % 5 === 0) {
            this.enemiesPerWave = Math.min(this.enemiesPerWave + 1,10);
            this.DestroyerFireRate = Math.max(this.DestroyerFireRate - 1, 5);
            this.destroyerSpawnChance = Math.min(this.destroyerSpawnChance + 0.1, this.maxDestroyerChance);
        }
        this.enemySpeedMultiplier = Math.min(this.enemySpeedMultiplier+0.05, 1.7);
        this.enemiesKilled = 0;
        this.actualWaveEnemiesCount=this.enemiesPerWave;
    }

    getRandomWord() {
        return this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    }

    getRandomWordForType(enemyType) {
    if (enemyType === "DESTROYER" && this.hardWords.length) {
        return this.hardWords[Math.floor(Math.random() * this.hardWords.length)];
    } else if (this.easyWords.length) {
        return this.easyWords[Math.floor(Math.random() * this.easyWords.length)];
    } else {
        // fallback to default pool
        return this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    }
}

    getRandomSpawnDelay() {
        return Math.random() * (this.maxSpawnDelay - this.minSpawnDelay) + this.minSpawnDelay;
    }

   initEnemy() {
    // 30% DESTROYER, 70% MINE, 0% BULLET
    let randomTypeKey;
    const roll = Math.random();

    if (roll < this.destroyerSpawnChance) {
        randomTypeKey = "DESTROYER";
    } else {
        randomTypeKey = "MINE";
    }

    const enemyType = ENEMY_TYPES[randomTypeKey];
    const enemyImage = enemyImages[randomTypeKey];
    const enemyWidth = enemyType.width;
    const enemyHeight = enemyType.height;

    const randomX = Math.random() * (canvas.width - enemyWidth);
    const randomY = -Math.random() * 200 - enemyHeight;

    const finalSpeed = enemyType.baseSpeed * this.enemySpeedMultiplier;
    const word = this.getRandomWordForType(randomTypeKey);

    const enemy = new EnemyShip(
        randomX,
        randomY,
        enemyWidth,
        enemyHeight,
        enemyImage,
        word,
        finalSpeed,
        randomTypeKey
    );

    enemies.push(enemy);
    objects.push(enemy);
}

    wait(ms) {
    return new Promise(resolve => {
        let remaining = ms;
        let lastTime = performance.now();

        const tick = (now) => {
            if (!gamePaused) {
                const delta = now - lastTime;
                remaining -= delta;
            }

            lastTime = now;

            if (remaining <= 0) {
                resolve();
            } else {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    });
}


    async initEnemySpawner() {
        for (let i = 0; i < this.enemiesPerWave; i++) {
            this.initEnemy();
            const delay = this.getRandomSpawnDelay();
            await this.wait(delay);
        }
    }

    async KillEnemy() {
        this.enemiesKilled++;

        if (this.enemiesKilled >= this.actualWaveEnemiesCount) {
            showWaveStats(this.waveCount, score);
            //show wave stats
            await this.wait(5000);
            hideWaveStats()
            await this.wait(1000)
            console.log("Starting next wave!");
            this.nextWave();

            this.initEnemySpawner();
        }
    }
}
class FocusIndicator {
    constructor(enemy) {
        this.enemy = enemy;
        this.sprite = focusCircleImage;
        this.scale = 5;
        this.targetScale = 0.1;
        this.shrinkSpeed = 15;
        this.rotation = 0;
        this.rotationSpeed = 10;
    }

    update(dt) {
        // Rotate continuously
        this.rotation += this.rotationSpeed * dt;

        // Smooth shrink animation
        if (this.scale > this.targetScale) {
            this.scale -= this.shrinkSpeed * dt;
            if (this.scale < this.targetScale) {
                this.scale = this.targetScale;
            }
        } else {
            // Remove when animation finishes
            const index = objects.indexOf(this);
            if (index > -1) objects.splice(index, 1);
        }
    }

    draw(ctx) {
        if (!this.enemy) return;

        const cx = this.enemy.x + this.enemy.width / 2;
        const cy = this.enemy.y + this.enemy.height / 2;

        const size = 150 * this.scale;

        ctx.save();
        ctx.translate(cx, cy);     // move to center of enemy
        ctx.rotate(this.rotation); // rotate around center
        ctx.filter = "hue-rotate(50deg)";

        ctx.drawImage(
            this.sprite,
            -size / 2,
            -size / 2,
            size,
            size
        );

        ctx.restore();
    }
}
let plasmaSplashSheet=new Image();
plasmaSplashSheet.src="./sprites/Effect95.png"

function spawnPlasmaSplash(x, y) {
    objects.push(new PlasmaSplash(x, y, plasmaSplashSheet, 100));
}

 
class PlasmaSplash {
    constructor(x, y, spriteSheet, frameSpeed = 20) {
        this.x = x;
        this.y = y;
        this.spriteSheet = spriteSheet;

        this.frameWidth = 128;
        this.frameHeight = 128;

        this.columns = 4;         // 4 frames per row
        this.rows = 4;            // 4 rows
        this.frameCount = 16;     // total frames

        this.currentFrame = 0;
        this.accumulator = 0;
        this.frameSpeed = frameSpeed;

        this.scale = 0.4; // you can scale it if you want
    }

    update(dt) {
        this.accumulator += dt;
        if (this.accumulator >= 1 / this.frameSpeed) {
            this.currentFrame++;
            this.accumulator = 0;

            if (this.currentFrame >= this.frameCount) {
                const index = objects.indexOf(this);
                if (index > -1) objects.splice(index, 1);
            }
        }
    }

    draw(ctx) {
        const col = this.currentFrame % this.columns;
        const row = Math.floor(this.currentFrame / this.columns);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        ctx.drawImage(
            this.spriteSheet,
            col * this.frameWidth,       // source X
            row * this.frameHeight,      // source Y
            this.frameWidth,             // source width
            this.frameHeight,            // source height
            -this.frameWidth / 2,        // center draw
            -this.frameHeight / 2,
            this.frameWidth,
            this.frameHeight
        );

        ctx.restore();
    }
}






class AudioManager {
    constructor() {
      
    }

    static playAudio(audio){
        audio.volume=MasterVolume;
        if(!audio.paused){
            audio.currentTime=0;
        }
        audio.play()
    }
    static playBackgroundMusic() {
        backgroundMusic.play();
    }
}







let plasmaSprite = new Image();
plasmaSprite.src = "./sprites/plasma.png"; // your sprite path

let explosionSprite = new Image();
explosionSprite.src = "./sprites/explosion.png"; // your explosion sprite sheet path


let enemies = [];

let focusedShip ;

class Explosion {
    constructor(x, y, spriteSheet, frameSpeed = 1) {
        this.x = x;
        this.y = y;
        this.spriteSheet = spriteSheet;

        this.frameWidth = 256;
        this.frameHeight = 256;

        this.columns =8;      // 4 frames per row
        this.rows = 8;         // 4 rows
        this.frameCount = 64;  // total frames

        this.frameSpeed = frameSpeed;
        this.currentFrame = 0;
        this.accumulator = 0;
    }

    update(dt) {
        this.accumulator += dt;

        if (this.accumulator > 1 / this.frameSpeed) {
            this.currentFrame++;
            this.accumulator = 0;

            // remove from object list when finished
            if (this.currentFrame >= this.frameCount) {
                const index = objects.indexOf(this);
                if (index !== -1) objects.splice(index, 1);
            }
        }
    }

    draw(ctx) {
        // Compute row + column based on currentFrame
        const col = this.currentFrame % this.columns;            // 0–3
        const row = Math.floor(this.currentFrame / this.columns); // 0–3

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(0.65,0.65)

        ctx.drawImage(
            this.spriteSheet,
            col * this.frameWidth,          // source X
            row * this.frameHeight,         // source Y
            this.frameWidth,                // source width
            this.frameHeight,               // source height
            -this.frameWidth / 2,           // draw centered
            -this.frameHeight / 2,
            this.frameWidth,
            this.frameHeight
        );

        ctx.restore();
    }
}





class Plasma {
    constructor(x, y, angle,enemy, speed=100 ,isLast=false ,sprite) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.enemy = enemy;
        this.isLast=isLast;
        this.sprite = sprite;
    }


    collideWithEnemy() {
        
        const dx = this.x - (this.enemy.x + this.enemy.width / 2);
        const dy = this.y - (this.enemy.y + this.enemy.height / 2);
        const distance = Math.hypot(dx, dy);
        const radius = Math.max(this.enemy.width, this.enemy.height) / 2;

        if (distance <= radius) {
            return true;
        }
        return false;
    }
    update(dt) {
      if(this.collideWithEnemy() ){
        AudioManager.playAudio(hitAudio)
          if(this.isLast){
            AudioManager.playAudio(explosionSound);
            this.enemy.initiateExplosion();
            const index = objects.indexOf(this.enemy);
            if (index > -1) {
                objects.splice(index, 1);
                gameSettings.KillEnemy();
            }
          }else{
            this.enemy.applyKnockback(5,0.2)
            spawnPlasmaSplash(this.x,this.y)
            this.enemy.isHit=true;
          }
          const plasmaIndex = objects.indexOf(this);
          if (plasmaIndex > -1) {
              objects.splice(plasmaIndex, 1);
          }
          return;
      }
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x , this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        //make plasma biger
        ctx.drawImage(
            this.sprite,
            0, 0,
            this.sprite.width, this.sprite.height,
            -this.sprite.width / 2, -this.sprite.height / 2,
            this.sprite.width, this.sprite.height
        );
      ctx.restore();
    }
}






class EnemyShip {
    constructor(x, y, width, height ,spriteSheet ,word="alien",speed=30 ,type ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.spriteSheet=spriteSheet;
        this.frameWidth = this.width;
        this.frameHeight = this.height;
        this.speed=speed;
        this.isFocused=false;
        this.word=word;
        this.expectedCharIndex=0;
        const enemyCx = this.x + this.width / 2;
        const enemyCy = this.y + this.height / 2;
        this.isDestroyed=false;
        this.knockbackVelocity = 0;  // current knockback speed
        this.knockbackDuration = 0;  // remaining time of knockback
        this.knockbackAngle = 0; 
        this.type=type;
        if (type === "DESTROYER") {
            this.spawnInterval = gameSettings.DestroyerFireRate; // seconds between bullets
            this.spawnAccumulator = 0;
        }
         if (type === "MINE") {
            this.rotation = 0;           // current rotation in radians
            this.rotationSpeed = 2;      // radians per second
        }

        const playerCx = playerShip.x + playerShip.frameWidth / 2;
        const playerCy = playerShip.y + playerShip.frameHeight / 2;

        // Vector from enemy to player center
        const dx = playerCx - enemyCx;
        const dy = playerCy - enemyCy;

        // Angle toward player
        this.angle = Math.atan2(dy, dx);
    }
    applyKnockback(force = 100, duration = 0.15) {
    this.knockbackAngle = this.angle + Math.PI; // opposite of current angle
    this.knockbackVelocity = force;             // pixels per second
    this.knockbackDuration = duration;          // seconds
}
    spawnBullet() {
        const enemyType = ENEMY_TYPES.BULLET;
        const img = enemyImages.BULLET;
        const bulletX = this.x + this.width / 2 - enemyType.width / 2;
        const bulletY = this.y + this.height;

        if(!(playerShip && bulletY < playerShip.y-10)){
            return;
        }

        const bullet = new EnemyShip(
            bulletX,
            bulletY,
            enemyType.width,
            enemyType.height,
            img,
            gameSettings.getRandomWordForType("BULLET"),
            enemyType.baseSpeed,
            "BULLET"
        );
        gameSettings.actualWaveEnemiesCount++;

        enemies.push(bullet);
        objects.push(bullet);
    }
  update(dt) {
    if (this.y > canvas.height + this.height) {
        const index = objects.indexOf(this);
        if (index > -1) objects.splice(index, 1);
        const enemyIndex = enemies.indexOf(this);
        if (enemyIndex > -1) enemies.splice(enemyIndex, 1);
        
    }
    if (this.type === "MINE") {
            this.rotation += this.rotationSpeed * dt;
        }
    if (this.type === "DESTROYER") {
            this.spawnAccumulator += dt;
            if (this.spawnAccumulator >= this.spawnInterval && !playerShip?.isDestroyed) {
                this.spawnBullet();
                this.spawnAccumulator = 0;
            }
        }
    if(this.collidedWithPlayer(playerShip)){
        playerShip.Destroy()
        this.initiateExplosion();
        let index =objects.indexOf(playerShip)
        if(index> -1) objects.splice(index, 1);
        endGame()
    }
    if (this.knockbackDuration > 0) {
        const dx = Math.cos(this.knockbackAngle) * this.knockbackVelocity * dt;
        const dy = Math.sin(this.knockbackAngle) * this.knockbackVelocity * dt;

        this.x += dx;
        this.y += dy;

        this.knockbackDuration -= dt;
        if (this.knockbackDuration <= 0) {
            this.knockbackVelocity = 0;
        }
        return; // skip normal movement while being knocked back
    }


    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
  }
  initiateExplosion() {
    const explosion = new Explosion(
        this.x + this.width / 2,
        this.y + this.height / 2,
        explosionSprite,
        75
    );
    objects.push(explosion);
  }






  collidedWithPlayer() {
    if(playerShip.isDestroyed)
        return false
    const circle1 = {
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        radius: Math.max(this.width, this.height) / 2 - 4
    };
    const circle2 = {
        x: playerShip.x + playerShip.frameWidth / 2,
        y: playerShip.y + playerShip.frameHeight / 2,
        radius: Math.max(playerShip.frameWidth, playerShip.frameHeight) / 2  - 2 
    };
    
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= circle1.radius + circle2.radius) {
        return true;
    }
    return false;
    
  }




   draw(ctx) {
  // Calculate angle to player

  ctx.save();

  // Move origin to enemy center
  const cx = this.x + this.width / 2;
  const cy = this.y + this.height / 2;
  ctx.translate(cx, cy);

  // Rotate toward player (if you want rotation)
  if (this.type === "MINE") {
            ctx.rotate(this.rotation);
        } else {
            ctx.rotate(this.angle - Math.PI / 2);
        }

  // Draw the sprite centered
  ctx.drawImage(
    this.spriteSheet,
    0, 0,
    this.frameWidth, this.frameHeight,
    -this.width / 2, -this.height / 2,
    this.width, this.height
  );
  ctx.rotate(-(this.angle - Math.PI / 2));
  // Draw a circle instead of a rectangle
  ctx.restore();
  this.drawTextWithBackground(ctx, this.word.substring(this.expectedCharIndex), this.x - 20, this.y +this.height + 5, "white", "#00000059", 7);

}
  drawTextWithBackground(ctx, text, x, y, textColor, bgColor, padding = 7) {
    if (!text || text.length === 0) return;

    const canvas = ctx.canvas;
    ctx.font = "15px 'Roboto Mono'";  
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding * 2;

    let bgX;
    if (ctx.textAlign === 'center') {
        bgX = x - bgWidth / 2;
    } else if (ctx.textAlign === 'right' || ctx.textAlign === 'end') {
        bgX = x - bgWidth;
    } else {
        bgX = x - padding;
    }

    let bgY = y - metrics.actualBoundingBoxAscent - padding;

    // ➜ SHIFT EVERYTHING TO THE RIGHT BY 100% OF ITS OWN WIDTH
    const shiftX = bgWidth/2 - 10;
    bgX -= shiftX;
    bgY +=13; // No vertical shift

    // Clamp
    if (bgX < 0) bgX = 0;
    if (bgY < 0) bgY = 0;
    if (bgX + bgWidth > canvas.width) bgX = canvas.width - bgWidth;
    if (bgY + bgHeight > canvas.height) bgY = canvas.height - bgHeight;

    let correctedTextX;
    if (ctx.textAlign === 'center') {
        correctedTextX = bgX + bgWidth / 2;
    } else if (ctx.textAlign === 'right' || ctx.textAlign === 'end') {
        correctedTextX = bgX + bgWidth;
    } else {
        correctedTextX = bgX + padding;
    }

    const correctedTextY = bgY + padding + metrics.actualBoundingBoxAscent;

    // Apply same shift to text

    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

    ctx.fillStyle = this?.isFocused ? "red" : textColor;
    ctx.fillText(text, correctedTextX, correctedTextY);
    ctx.restore();
}



} 

class PlayerShip {
  constructor( spriteSheet, frameWidth, frameHeight, frameCount, frameSpeed=300) {
    this.x=(canvas.width-frameHeight)/2;
    this.y=canvas.height - frameHeight -10;
    this.spriteSheet = spriteSheet;  
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;   
    this.frameSpeed = frameSpeed;    
    this.currentFrame = 0;
    this.rotation = 0;
    this.accumulator = 0;     
    this.state="idle";   
    this.isDestroyed=false;
    
  }
  Destroy(){
    AudioManager.playAudio(explosionSound);
    this.isDestroyed=true;
  }

  firePlasma(enemy ,isLast=false) {

    const playerCx = this.x + this.frameWidth / 2;
    const playerCy = this.y + this.frameHeight / 2;
    const enemyCx = enemy.x + enemy.width / 2;
    const enemyCy = enemy.y + enemy.height / 2;
    const dx = enemyCx - playerCx;
    const dy = enemyCy - playerCy;
    const angle = Math.atan2(dy, dx) ;

    const plasma = new Plasma(playerCx, playerCy, angle,enemy ,1500 ,isLast ,plasmaSprite);
    AudioManager.playAudio(plasmeFire)
    objects.push(plasma);
  }




  getConeXRange(y1) {
    const x_c = this.x;  // apex x
    const y_c = this.y;  // apex y
    const W = canvas.width;

    // Left edge (line to top-left corner)
    const x_left = x_c + (x_c / y_c) * (y1 - y_c);

    // Right edge (line to top-right corner)
    const x_right = x_c - ((W - x_c) / y_c) * (y1 - y_c);

    // Return min and max x for this y
    return {
      xMin: x_right,  // smaller x
      xMax: x_left    // larger x
    };
  }

  update(dt) {
    // update animation frame
    this.accumulator += dt;
    switch(this.state){
        case "idle":
            this.playIdleAnimation();
            break;
        case "shooting":
            this.playshootingAnimation();
            break;
    }

  }
  playIdleAnimation(){
    this.currentFrame=0;
  }
  resetAnimation(){
    this.currentFrame=0;
  }

  playshootingAnimation(){
    if (this.accumulator > 1 / this.frameSpeed) 
    {
        if(!(this.currentFrame < this.frameCount -1)){
            this.resetAnimation();
            this.state="idle";
            return;
        }
        this.currentFrame = this.currentFrame + 1;
        this.accumulator = 0;
    }
  }

  draw(ctx) {
  ctx.save();

  // Translate to the **center** of the sprite
  const cx = this.x + this.frameWidth / 2;
  const cy = this.y + this.frameHeight / 2;
  ctx.translate(cx, cy);

  // Apply rotation
  ctx.rotate(this.rotation || 0);

  // Draw the sprite centered at the origin
  ctx.drawImage(
    this.spriteSheet,
    this.currentFrame * this.frameWidth, 0,
    this.frameWidth, this.frameHeight,
    -this.frameWidth / 2, -this.frameHeight / 2,  // center it
    this.frameWidth, this.frameHeight
  );

  // Draw circle hitbox centered at origin

  ctx.restore();
}
}









let scrollSpeed = 0.08; // How many pixels to move per frame
let gridscrollSpeed= 0.6
let backgroundY = 0;
let gridbackgroundY=0;



window.addEventListener('keyup', (e) => {
    if (gamePaused || playerShip.isDestroyed) return;
    const key = e.key.toLocaleLowerCase();
    if (focusedShip) {
    const expectedChar = focusedShip.word.charAt(focusedShip.expectedCharIndex);

    if (typingStartTime === null) {
        // Start the global timer when typing first letter of a word
        typingStartTime = performance.now();
        pausedAccumulated = 0;
    }

    if (key === expectedChar) {
        correctTyped++;
        totalTyped++;
        score += 10;
        focusedShip.expectedCharIndex++;

        if (focusedShip.expectedCharIndex >= focusedShip.word.length) {
            // Word fully typed, update total typing time
            const wordEndTime = performance.now();
            totalTypingTime += (wordEndTime - typingStartTime - pausedAccumulated);
            typingStartTime = null; // reset for next word

            // Update global WPM
            const totalMinutes = totalTypingTime / 1000 / 60;
            wpm = (correctTyped / 5) / totalMinutes;

            focusedShip.isDestroyed = true;
            playerShip.firePlasma(focusedShip, true);
            focusedShip = null;
        } else {
            playerShip.firePlasma(focusedShip);
        }
    } else {
        totalTyped++;
        AudioManager.playAudio(clickSound);
        if (playerShip.state !== "shooting") playerShip.state = "shooting";
        else playerShip.resetAnimation();
    }
} else {
    // No focused ship, start typing first correct letter for new word
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const expectedChar = enemy.word.charAt(enemy.expectedCharIndex);
        if (key === expectedChar) {
            if (typingStartTime === null) typingStartTime = performance.now();

            correctTyped++;
            totalTyped++;
            focusedShip = enemies.splice(i, 1)[0]; 

            // Rotate player and focus enemy
            const enemyCx = enemy.x + enemy.width / 2;
            const enemyCy = enemy.y + enemy.height / 2;
            const playerCx = playerShip.x + playerShip.frameWidth / 2;
            const playerCy = playerShip.y + playerShip.frameHeight / 2;
            const dx = enemyCx - playerCx;
            const dy = enemyCy - playerCy;
            playerShip.rotation = Math.atan2(dy, dx) + Math.PI / 2;
            playerShip.firePlasma(enemy);
            enemy.isFocused = true;
            enemy.expectedCharIndex++;
            AudioManager.playAudio(targetFocusAudio);
            objects.push(new FocusIndicator(enemy));
            return;
        }
    }

    // Wrong key pressed
    AudioManager.playAudio(clickSound);
    totalTyped++;
    if (playerShip.state !== "shooting") playerShip.state = "shooting";
    else playerShip.resetAnimation();
}


});


let gamePaused=false;

function gameLoop(timestamp) {

  const dt = (timestamp - last) / 1000;
  last = timestamp;


    if(!gamePaused)
        for (const obj of objects) obj.update(dt);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move background DOWN instead of UP
  backgroundY += scrollSpeed;

  // Wrap when going down
  if (backgroundY >= bg.height) {
      backgroundY = 0;
  }
  

  ctx.drawImage(bg, 0, backgroundY - bg.height, canvas.width, bg.height);
  ctx.drawImage(bg, 0, backgroundY, canvas.width, bg.height);

  gridbackgroundY += gridscrollSpeed;

// reset every image height to loop cleanly
if (gridbackgroundY >= gridBg.height) {
    gridbackgroundY = 0;
}

if (gridBg.complete) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    

    // create repeat pattern
    const pattern = ctx.createPattern(gridBg, "repeat");

    // move canvas so the pattern scrolls
    ctx.translate(0, gridbackgroundY);

    ctx.fillStyle = pattern;

    // fill more than needed so scrolling has no gaps
    ctx.fillRect(
        0,
        -gridBg.height,
        canvas.width,
        canvas.height + gridBg.height * 2
    );

    ctx.restore();
}




  
  ctx.globalAlpha = 0.8;
  ctx.drawImage(aboveBg,0,0,canvas.width,canvas.height)
  ctx.globalAlpha=1;
  

    for (const obj of objects) obj.draw(ctx);


    requestAnimationFrame(gameLoop);
  
}
function pauseGame() {
    gamePaused = true;
    if (typingStartTime !== null) pausedAt = performance.now();
}
function resumeGame() {
    gamePaused = false;
    if (typingStartTime !== null && pausedAt !== null) {
        pausedAccumulated += performance.now() - pausedAt;
        pausedAt = null;
    }
}
function endGame() {
    pauseBtn.classList.add("display-none")
    if (typingStartTime !== null) {
        const now = performance.now();
        totalTypingTime += now - typingStartTime - pausedAccumulated;
    }

    const totalMinutes = totalTypingTime / 1000 / 60;
    const wpm = totalMinutes > 0 ? (correctTyped / 5) / totalMinutes : 0;

    // SHOW GAME OVER SCREEN
    document.getElementById("game-over").classList.remove("display-none");
    document.getElementById("game-over").classList.add("display-flex");
    // UPDATE UI
    document.getElementById("go-correct").textContent = `Score: ${score}`;
    document.getElementById("go-total").textContent = `Accuracy : ${
  totalTyped === 0 ? "0.00" : ((correctTyped / totalTyped) * 100).toFixed(2)
}%`;
    document.getElementById("go-wpm").textContent = `WPM: ${wpm.toFixed(1)}`;
}


const  gameSettings = new GameSettings();

async function startGame() {
    // await gameSettings.loadWordPool()
  await loadPlayerImage()
  await loadEnemyTypeImages();
  await loadFocusCircleImage();
  await gameSettings.loadWordPool();
  requestAnimationFrame(gameLoop);
  gameSettings.initEnemySpawner();
}

startGame();