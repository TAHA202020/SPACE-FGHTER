
const canvas = document.getElementById('myCanvas');
let last = 0;
const objects = [];
const ctx=canvas.getContext("2d");
let playerShip;



class EnemyShip {
    constructor(x, y, width, height ,spriteSheet ,word,speed=30) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.spriteSheet=spriteSheet;
        this.frameWidth = 43;
        this.frameHeight = 58;
        this.word=word;
        this.speed=speed;
        
        const enemyCx = this.x + this.width / 2;
        const enemyCy = this.y + this.height / 2;

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
        console.log("you lost");
        return;
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

  collidedWithPlayer() {


    const circle1 = {
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        radius: Math.max(this.width, this.height) / 2 - 3
    };
    const circle2 = {
        x: playerShip.x + playerShip.frameWidth / 2,
        y: playerShip.y + playerShip.frameHeight / 2,
        radius: Math.max(playerShip.frameWidth, playerShip.frameHeight) / 2  + 2 
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

  // Draw a circle instead of a rectangle
  ctx.beginPath();
  const radius = Math.max(this.width, this.height) / 2 - 2; // circle radius
  ctx.arc(0, 0, radius, 0, Math.PI * 2); // center at origin
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

} 

class PlayerShip {
  constructor( spriteSheet, frameWidth, frameHeight, frameCount, frameSpeed) {
    this.x=(canvas.width-frameHeight)/2;
    this.y=canvas.height - frameHeight;
    this.spriteSheet = spriteSheet;  
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;   
    this.frameSpeed = frameSpeed;    
    this.currentFrame = 0;
    this.accumulator = 0;     
    this.state="idle";   
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
    console.log("playing shooting animation");
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
  ctx.beginPath();
  const radius = Math.max(this.frameWidth, this.frameHeight) / 2 +2;
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

}

const idleImage = new Image();
idleImage.src = "ship.png"; // your sprite sheet path
idleImage.onload = () => {
  console.log("Image loaded");
  const sprite = new PlayerShip(      // initial x, y
  idleImage,       // your sprite sheet
  24, 24,          // frameWidth, frameHeight
  7,               // total frames
  2               // frames per second (adjust as needed)
);

playerShip=sprite;
objects.push(sprite);
};
const enemyImage = new Image();
enemyImage.src = "destroyer.png";

enemyImage.onload = () => {
    console.log("Enemy Image loaded");

    const enemyCount = 5;           // number of enemies
    const enemyWidth = 43;
    const enemyHeight = 58;

    for (let i = 0; i < enemyCount; i++) {
        // Random Y between -15 and -5
        const randomY = Math.random() * ( -10 - (-15) ) + (-15); // = [-15, -10]

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

        objects.push(enemy);
    }
};


function gameLoop(timestamp) {
  const dt = (timestamp - last) / 1000;
  last = timestamp;

  for (const obj of objects) obj.update(dt);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const obj of objects) obj.draw(ctx);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
