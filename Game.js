// =========================
// Game Setup & Entities
// =========================

// ---- Config & helpers ----
const WIDTH = 900, HEIGHT = 540;
const TILE = 30;           // for a subtle grid
const GAME_LEN = 60;       // seconds
const GOAL = 15;           // crops to win

const State = Object.freeze({ MENU: "MENU", PLAYING: "PLAYING", PAUSED: "PAUSED", GAME_OVER: "GAME_OVER", WIN: "WIN" });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ---- Base Entity ----
class Entity {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
    update(dt, game) { }
    draw(ctx) { }
}

// ---- Scarecrow (obstacle) ----
class Scarecrow extends Entity {
    constructor(x, y) { super(x, y, 26, 46); }
    draw(ctx) {
        const { x, y, w, h } = this;
        ctx.fillStyle = "#9b7653";
        ctx.fillRect(x + w / 2 - 3, y, 6, h); // pole
        ctx.fillStyle = "#c28e0e";
        ctx.beginPath(); ctx.arc(x + w / 2, y + 10, 10, 0, Math.PI * 2); ctx.fill(); // head
        ctx.strokeStyle = "#6b4f2a"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + w, y + 18); ctx.stroke(); // arms
    }
}

// ---- Crow (obstacle) ----
class Crow extends Entity {
    constructor(x,y) {
        super(x, y, 40, 25);
        this.vx = (Math.random() - 0.5) * 350;
        this.vy = (Math.random() - 0.5) * 350;
    }
    update(dt) {
        this.x += this.vx *dt;
        this.y += this.vy * dt;
        
        // bound crow to screen
        if (this.x <= 0) { this.vx *= -1; this.x = 0; }
        if (this.x + this.w >= WIDTH) { this.vx *= -1; this.x = WIDTH - this.w; }
        if (this.y <= 0) { this.vy *= -1; this.y = 0; }
        if (this.y + this.h >= HEIGHT) { this.vy *= -1; this.y = HEIGHT - this.h; }
    }
    draw(ctx) {
        // crow body
        ctx.fillStyle = "#473131ff";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.h / 2);
        ctx.lineTo(this.x + this.w / 2, this.y);
        ctx.lineTo(this.x + this.w, this.y + this.h / 2);
        ctx.lineTo(this.x + this.w / 2, this.y + this.h);
        ctx.closePath();
        ctx.fill();
        // crow eyes
        ctx.fillStyle = "#fff"
        ctx.beginPath();
        ctx.arc(this.x + this.w * 0.65, this.y + this.h / 2 - 4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.w * 0.65, this.y + this.h / 2 + 4, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ---- Speed Boost (power up) ----
class SpeedBoost extends Entity {
    constructor(x,y) {
        super(x, y, 25, 25)
    }
    draw(ctx) {
        ctx.fillStyle = "#2f80ddff"
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI *2);
        ctx.fill();
    }
}