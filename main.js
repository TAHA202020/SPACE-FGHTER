
const canvas = document.getElementById('myCanvas');
canvas.height=document.body.clientHeight;
canvas.width=600;
let last = 0;
const objects = [];
const ctx=canvas.getContext("2d");
let playerShip;











let plasmaSprite = new Image();
plasmaSprite.src = "plasma.png"; // your sprite path

let explosionSprite = new Image();
explosionSprite.src = "explosion.png"; // your explosion sprite sheet path


let enemies = [];

let focusedShip ;

class Explosion{
  //plays ones
    constructor(x, y, spriteSheet, frameSpeed=1) {
        this.x = x;
        this.y = y;
        this.spriteSheet = spriteSheet;
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.frameCount = 7;
        this.frameSpeed = frameSpeed;
        this.currentFrame = 0;
        this.accumulator = 0;
    }
    update(dt) {
        this.accumulator += dt;
        if (this.accumulator > 1 / this.frameSpeed) {
            this.currentFrame = this.currentFrame + 1;
            this.accumulator = 0;
            if (this.currentFrame >= this.frameCount) {
                const index = objects.indexOf(this);
                if (index > -1) {
                    objects.splice(index, 1);
                }
            }
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(5,5);
        ctx.drawImage(
            this.spriteSheet,
            this.currentFrame * this.frameWidth, 0,
            this.frameWidth, this.frameHeight,
            -this.frameWidth / 2, -this.frameHeight / 2,
            this.frameWidth, this.frameHeight
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
          console.log("hit enemy");
          console.log(this.isLast);
          if(this.isLast){
            this.enemy.initiateExplosion();
            const index = objects.indexOf(this.enemy);
            if (index > -1) {
                objects.splice(index, 1);
            }
          }else{
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
        ctx.translate(this.x, this.y);
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
    constructor(x, y, width, height ,spriteSheet ,word="aliefffffffffffffn",speed=30 ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.spriteSheet=spriteSheet;
        this.frameWidth = 43;
        this.frameHeight = 58;
        this.speed=speed;
        this.isFocused=false;
        this.word=word;
        this.expectedCharIndex=0;
        const enemyCx = this.x + this.width / 2;
        const enemyCy = this.y + this.height / 2;
        this.isDestroyed=false;

        const playerCx = playerShip.x + playerShip.frameWidth / 2;
        const playerCy = playerShip.y + playerShip.frameHeight / 2;

        // Vector from enemy to player center
        const dx = playerCx - enemyCx;
        const dy = playerCy - enemyCy;

        // Angle toward player
        this.angle = Math.atan2(dy, dx);
    }
  update(dt) {
    if(this.collidedWithPlayer(playerShip)){
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
        25
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
  this.drawTextWithBackground(ctx, this.word.substring(this.expectedCharIndex), this.x - 20, this.y +this.frameHeight + 5, "white", "#0000004d", 4);

}
  drawTextWithBackground(ctx, text, x, y, textColor, bgColor, padding = 7) {
    if (!text || text.length === 0) return;

    const canvas = ctx.canvas;

    // 1. Measure text
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    // 2. Compute background dimensions
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding * 2;

    // 3. Compute initial bg X position based on alignment
    let bgX;
    if (ctx.textAlign === 'center') {
        bgX = x - bgWidth / 2;
    } else if (ctx.textAlign === 'right' || ctx.textAlign === 'end') {
        bgX = x - bgWidth;
    } else { // left or start
        bgX = x - padding;
    }

    // 4. Compute bg Y position (baseline-based)
    let bgY = y - metrics.actualBoundingBoxAscent - padding;

    // 5. Clamp background box inside canvas boundaries
    if (bgX < 0) bgX = 0;
    if (bgY < 0) bgY = 0;
    if (bgX + bgWidth > canvas.width) bgX = canvas.width - bgWidth;
    if (bgY + bgHeight > canvas.height) bgY = canvas.height - bgHeight;

    // 6. Adjust text position to align with corrected bg box
    let correctedTextX = x;
    if (ctx.textAlign === 'center') {
        correctedTextX = bgX + bgWidth / 2;
    } else if (ctx.textAlign === 'right' || ctx.textAlign === 'end') {
        correctedTextX = bgX + bgWidth;
    } else {
        correctedTextX = bgX + padding;
    }

    // Move baseline Y to match the corrected background top
    const correctedTextY = bgY + padding + metrics.actualBoundingBoxAscent;

    // 7. Draw background + text
    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

    ctx.fillStyle = this?.isFocused ? "yellow" : textColor;
    ctx.font = "bold 20px Helvetica";

    ctx.fillText(text, correctedTextX, correctedTextY);
    ctx.restore();
}


} 

class PlayerShip {
  constructor( spriteSheet, frameWidth, frameHeight, frameCount, frameSpeed=300) {
    this.x=(canvas.width-frameHeight)/2;
    this.y=canvas.height - frameHeight;
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

    const plasma = new Plasma(playerCx, playerCy, angle,enemy ,300 ,isLast ,plasmaSprite);
    objects.push(plasma);

    if(this.state!=="shooting"){
      this.state="shooting";
    }
    else{
      this.resetAnimation();
    }
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

const idleImage = new Image();
idleImage.src = "ship.png"; // your sprite sheet path
idleImage.onload = () => {
  const sprite = new PlayerShip(      // initial x, y
  idleImage,       // your sprite sheet
  24, 24,          // frameWidth, frameHeight
  7,               // total frames
  20               // frames per second (adjust as needed)
);

playerShip=sprite;
objects.push(sprite);
const enemyImage = new Image();
enemyImage.src = "destroyer.png";

enemyImage.onload = () => {

    const enemyCount = 5;           // number of enemies
    const enemyWidth = 43;
    const enemyHeight = 58;

    for (let i = 0; i < enemyCount; i++) {

         // = [-70, -100]
        const randomY = Math.random() * -150 - 50;

        // Get the cone range from playerShip for this Y
        const range = playerShip.getConeXRange(randomY);

        // Random X inside that cone
        const randomX = Math.random() * (range.xMax - range.xMin) + range.xMin;

        // Create enemy
        const enemy = new EnemyShip(
            randomX, randomY,   
            enemyWidth, enemyHeight,
            enemyImage,
            "alien"
        );
        enemies.push(enemy);

        objects.push(enemy);
    }
};
};


const bg = new Image();

// IMPORTANT: Use a tileable image!
bg.src = 'background.jpg';
let scrollSpeed = 0.1; // How many pixels to move per frame
let backgroundY = 0;



window.addEventListener('keyup', (e) => {
    const key = e.key;
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
                break;
            }
        }
    }


});


function gameLoop(timestamp) {
  const dt = (timestamp - last) / 1000;
  last = timestamp;

  for (const obj of objects) obj.update(dt);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  backgroundY -= scrollSpeed;
    if (backgroundY <= -bg.height) {
        backgroundY = 0;
    }

    ctx.drawImage(bg, 0, backgroundY, canvas.width, bg.height);
    ctx.drawImage(bg, 0 , backgroundY+bg.height -1, canvas.width,bg.height);
  for (const obj of objects) obj.draw(ctx);

  requestAnimationFrame(gameLoop);
}


bg.onload = () =>requestAnimationFrame(gameLoop);


