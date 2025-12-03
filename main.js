
const canvas = document.getElementById('myCanvas');
let last = 0;
const objects = [];
const ctx=canvas.getContext("2d");





class NormalSprite {
    constructor(x, y, width, height, color ,image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.image = image;
    }
} 

class AnimatedSprite {
  constructor(x, y, spriteSheet, frameWidth, frameHeight, frameCount, frameSpeed) {
    this.x = x;
    this.y = y;
    this.spriteSheet = spriteSheet;  
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;   
    this.frameSpeed = frameSpeed;    
    this.currentFrame = 0;
    this.accumulator = 0;     
    this.state="idle";   
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
    ctx.drawImage(
      this.spriteSheet,
      this.currentFrame * this.frameWidth, 0,  // source x, y
      this.frameWidth, this.frameHeight,       // source width, height
      this.x, this.y,                          // destination x, y
      this.frameWidth, this.frameHeight        // destination width, height
    );
    ctx.strokeStyle = "red"; // border color
    ctx.lineWidth = 3;       // border thickness
    ctx.strokeRect(this.x, this.y, this.frameWidth, this.frameHeight);
  }
}

const idleImage = new Image();
idleImage.src = "ship.png"; // your sprite sheet path
idleImage.onload = () => {
    console.log("Image loaded");
  const sprite = new AnimatedSprite(
  50, 50,          // initial x, y
  idleImage,       // your sprite sheet
  24, 24,          // frameWidth, frameHeight
  7,               // total frames
  2               // frames per second (adjust as needed)
);

objects.push(sprite);
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
