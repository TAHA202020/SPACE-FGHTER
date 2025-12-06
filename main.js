
const canvas = document.getElementById('myCanvas');
canvas.height=720;
canvas.width=480;
let last = 0;
const objects = [];
const ctx=canvas.getContext("2d");
let playerShip;

let focusCircleImage = new Image();

const ENEMY_TYPES = {
    DESTROYER: {
        image: "destroyer.png",
        width: 43,
        height: 58,
        baseSpeed: 25
    },
    BULLET: {
        image: "bullet.png",
        width: 20,
        height: 24,
        baseSpeed: 50
    },
};
const enemyImages = {};



function loadFocusCircleImage() {
    return new Promise(resolve => {
        focusCircleImage.src = 'emp.png';
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
const backgroundMusic = new Audio('soundtrack.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Set volume (0.0 to 1.0)


const idleImage = new Image();
idleImage.src = "ship.png"; // your sprite sheet path
const enemyImage = new Image();
enemyImage.src = "destroyer.png";

const bg = new Image();

// IMPORTANT: Use a tileable image!
bg.src = 'background.jpg';


const aboveBg=new Image();

aboveBg.src="bg.png";



const gridBg=new Image();
gridBg.src="grid.png"







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
        this.enemiesPerWaveIncrement = 2;

        this.baseEnemySpeed = 50;
        this.enemySpeedIncrement = 20;

        this.minSpawnDelay = 300;
        this.maxSpawnDelay = 1200;

        this.enemiesKilled = 0;

        // pool of random words
        this.wordPool = ["alien", "meteor", "attack", "orbit", "galaxy", "laser", "nova", "comet"];
    }

    nextWave() {
        this.waveCount++;
        this.enemiesPerWave += this.enemiesPerWaveIncrement;
        this.baseEnemySpeed += this.enemySpeedIncrement;
        this.enemiesKilled = 0;
    }

    getRandomWord() {
        return this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    }

    getRandomSpawnDelay() {
        return Math.random() * (this.maxSpawnDelay - this.minSpawnDelay) + this.minSpawnDelay;
    }

    initEnemy() {
        const enemyTypeKeys = Object.keys(ENEMY_TYPES);
        const randomTypeKey = enemyTypeKeys[Math.floor(Math.random() * enemyTypeKeys.length)];
        const enemyType = ENEMY_TYPES[randomTypeKey];
        const enemyImage = enemyImages[randomTypeKey];
        const enemyWidth = enemyType.width;
        const enemyHeight = enemyType.height;
        const randomX = Math.random() * (canvas.width - enemyWidth);
        const randomY = -Math.random() * 200 - enemyHeight;
        const finalSpeed = ENEMY_TYPES[randomTypeKey].baseSpeed;

        const enemy = new EnemyShip(
            randomX,
            randomY,
            enemyWidth,
            enemyHeight,
            enemyImage,
            this.getRandomWord(),
            finalSpeed
        );
        enemies.push(enemy);
        objects.push(enemy);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initEnemySpawner() {
        for (let i = 0; i < this.enemiesPerWave; i++) {
            this.initEnemy();

            // RANDOM SPAWN DELAY each enemy
            const delay = this.getRandomSpawnDelay();
            await this.wait(500);
        }
    }

    async KillEnemy() {
        this.enemiesKilled++;

        if (this.enemiesKilled >= this.enemiesPerWave) {
            console.log("Wave Completed!");

            await this.wait(1500);

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
        this.shrinkSpeed = 16;  
    }

    update(dt) {
        console.log(dt);
        // Smooth shrink animation
        if (this.scale > this.targetScale) {
            
            this.scale -= this.shrinkSpeed * dt;
            if (this.scale < this.targetScale) {
                this.scale = this.targetScale;
            }
        }else
        {
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
        ctx.translate(cx, cy);
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
plasmaSplashSheet.src="Effect95.png"

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






class AudioManager{
    constructor() {
      
    }
 
    static playBackgroundMusic() {
        backgroundMusic.play();
    }
}
const soundBtn =document.getElementById('sound-btn');

soundBtn.addEventListener('click', () => {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
        soundBtn.classList.remove('sound-off');
        soundBtn.classList.add('sound-on');
    } else {
        backgroundMusic.pause();
        soundBtn.classList.remove('sound-on');
        soundBtn.classList.add('sound-off');
    }
});








let plasmaSprite = new Image();
plasmaSprite.src = "plasma.png"; // your sprite path

let explosionSprite = new Image();
explosionSprite.src = "exp2_0.png"; // your explosion sprite sheet path


let enemies = [];

let focusedShip ;

class Explosion {
    constructor(x, y, spriteSheet, frameSpeed = 1) {
        this.x = x;
        this.y = y;
        this.spriteSheet = spriteSheet;

        this.frameWidth = 64;
        this.frameHeight = 64;

        this.columns = 4;      // 4 frames per row
        this.rows = 4;         // 4 rows
        this.frameCount = 16;  // total frames

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
        ctx.scale(1.5,1.5)

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
        


          if(this.isLast){
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
    constructor(x, y, width, height ,spriteSheet ,word="alien",speed=30 ) {
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
  update(dt) {
    if(this.collidedWithPlayer(playerShip)){
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


    const dx = playerShip.x  - this.x;
    const dy = playerShip.y - this.y;

    const length = Math.hypot(dx, dy);

    // normalize
    const nx = dx / length;
    const ny = dy / length;

    // move toward player
    this.x += nx * this.speed * dt;
    this.y += ny * this.speed * dt;
  }
  initiateExplosion() {
    const explosion = new Explosion(
        this.x + this.width / 2,
        this.y + this.height / 2,
        explosionSprite,
        18
    );
    objects.push(explosion);
  }






  collidedWithPlayer() {


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
  ctx.rotate(this.angle - Math.PI / 2);

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
  this.drawTextWithBackground(ctx, this.word.substring(this.expectedCharIndex), this.x - 20, this.y +this.height + 5, "white", "black", 7);

}
  drawTextWithBackground(ctx, text, x, y, textColor, bgColor, padding = 7) {
    if (!text || text.length === 0) return;

    const canvas = ctx.canvas;
    ctx.font = "16px Helvetica";    
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
let gridscrollSpeed= 0.5
let backgroundY = 0;
let gridbackgroundY=0;



window.addEventListener('keyup', (e) => {
    const key = e.key.toLocaleLowerCase();
    if (focusedShip) {
        const expectedChar = focusedShip.word.charAt(focusedShip.expectedCharIndex);
        if (key === expectedChar) {
            focusedShip.expectedCharIndex++;
            if (focusedShip.expectedCharIndex >= focusedShip.word.length) {
                focusedShip.isDestroyed=true;
                playerShip.firePlasma(focusedShip, true);
                focusedShip = null;
            }else{
                playerShip.firePlasma(focusedShip);
            }
        }else{
            if(playerShip.state!=="shooting")
                playerShip.state="shooting"
            else
                playerShip.resetAnimation();
        }
    }
    else{
        for (const enemy of enemies) {
            const expectedChar = enemy.word.charAt(enemy.expectedCharIndex);
            if (key === expectedChar) {
                focusedShip = enemy;
                //Calculate rotate angle of player towards enemy
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
                objects.push(new FocusIndicator(enemy));
                return;
            }
        }
        if(playerShip.state!=="shooting"){
            playerShip.state="shooting"
        }else{
            playerShip.resetAnimation();
        }

    }


});


function gameLoop(timestamp) {
  const dt = (timestamp - last) / 1000;
  last = timestamp;

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




const  gameSettings = new GameSettings();

async function startGame() {
  await loadPlayerImage()
  await loadEnemyTypeImages();
  await loadFocusCircleImage();
  requestAnimationFrame(gameLoop);
  gameSettings.initEnemySpawner();
}

startGame();


