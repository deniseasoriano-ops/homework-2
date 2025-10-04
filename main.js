class Input {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this._onKeyDown = this.onKeyDown.bind(this); // bind #1
        this._onKeyUp = this.onKeyUp.bind(this); // bind #2
        // Q1. Language Features.
        // (b) .bind(this) is required instead of an arrow function because "onKeyDown" and "onKeyUp" are 
        // being passed as callbacks to "window.addEventListener" which calls the functions and sets "this"
        // to be the "window" object. ".bind(this)" ensures that the methords are always bound to the current
        // Input object.
        // (c) In an event listener callback, "this" usually refers to the elemet that is attached to the listener,
        // which is "window" in this case. ".bind(this)" is used to force "this" to refer to the Input instance instead.
        window.addEventListener("keyup", this._onKeyUp);
        window.addEventListener("keydown", this._onKeyDown);
    }
    onKeyDown(e) {
        if (e.key === "p" || e.key === "P") this.game.togglePause();
        this.keys.add(e.key);
    }
    onKeyUp(e) { this.keys.delete(e.key); }
    dispose() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }
}

// ---- Game ----
class Game {
    constructor(canvas) {
        if (!canvas) {
            console.error("Canvas #game not found. Check index.html IDs.");
            return;
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.state = State.MENU;

        // world
        this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
        this.crops = [];
        this.obstacles = [];
        this.powerUps = [];

        // timing
        this.lastTime = 0;
        this.timeLeft = GAME_LEN;
        this.spawnEvery = 0.8;
        this._accumSpawn = 0;
        this.powerUpSpawnEvery = 8;
        this._accumPowerUpSpawn = 0;

        // score & goal
        this.score = 0;
        this.goal = GOAL;

        // input & resize
        this.input = new Input(this);
        this._onResize = this.onResize.bind(this);
        window.addEventListener("resize", this._onResize);
        // Q1. Language Features.
        // (b) Like the Input class above, "this.onResize" is passed as a callback to "window.addEventListener,"
        // so without ".bind(this)," it will refer to the "window" object instead of the "Game" instance, which
        // is needed to access "this.canvas" or "this.player" inside the method.
        window.addEventListener("resize", this._onResize);

        // UI
        const get = id => document.getElementById(id) || console.error(`#${id} not found`);
        this.ui = {
            score: get("score"),
            time: get("time"),
            goal: get("goal"),
            status: get("status"),
            start: get("btnStart"),
            reset: get("btnReset"),
        };
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
        if (this.ui.start) this.ui.start.addEventListener("click", () => this.start());
        if (this.ui.reset) this.ui.reset.addEventListener("click", () => this.reset());

        // RAF loop
        this.tick = (ts) => {
            // Q1. Language Features.
            // (c) In the context of the RAF loop, "this" inherits from the game constructor. This makes sure
            // that "this" refers to the Game instance inside the animation loop.
            const dt = Math.min((ts - this.lastTime) / 1000, 0.033); // ~30ms cap
            this.lastTime = ts;
            this.update(dt);
            this.render();
            requestAnimationFrame(this.tick);
            // Q1. Language Features.
            // (c) "this.tick" here is a method reference, and since "tick" is an arrow function, it is already
            // bound to the "Game" instance. This prevents incorrect reassignment by "requestAnimationFrame."
        };
    }

    onResize() {
        // fixed canvas size for simplicity; handle DPR here if desired
    }

    start() {
        if (this.state === State.MENU || this.state === State.GAME_OVER || this.state === State.WIN) {
            this.reset();
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
            requestAnimationFrame(this.tick);
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    reset() {
        this.state = State.MENU;
        this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
        this.crops.length = 0;
        this.obstacles.length = 0;
        this.powerUps.length = 0;
        this.score = 0;
        this.timeLeft = GAME_LEN;
        this._accumSpawn = 0;
        this.lastTime = performance.now();
        // place a couple of scarecrows
        this.obstacles.push(new Scarecrow(200, 220), new Scarecrow(650, 160));
        // place a couple of crows
        this.obstacles.push(new Crow(100, 100));
        this.obstacles.push(new Crow(700, 300));
        this.syncUI();
        if (this.ui.status) this.ui.status.textContent = "Menu";
    }

    togglePause() {
        if (this.state === State.PLAYING) {
            this.state = State.PAUSED;
            if (this.ui.status) this.ui.status.textContent = "Paused";
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    syncUI() {
        if (this.ui.score) this.ui.score.textContent = String(this.score);
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
    }

    spawnCrop() {
        const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
        const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
        this.crops.push(new Crop(gx, gy));
    }

    // Q1. Language Features. 
    // (a) The filter and forEach methods below all already use arrow functions. I could not find any non-arrow 
    // anonymous callbacks to convert.
    // Arrow functions do not have their own "this" binding. They inherit "this" from whatever lexical context surrounds them.
    // In this case, the surrounding context is the Game class, so "this" inside the arrow functions refers to the Game instance.

    update(dt) {
        if (this.state !== State.PLAYING) return;

        // countdown
        this.timeLeft = clamp(this.timeLeft - dt, 0, GAME_LEN);
        if (this.timeLeft <= 0) {
            this.state = (this.score >= this.goal) ? State.WIN : State.GAME_OVER;
            if (this.ui.status) this.ui.status.textContent = (this.state === State.WIN) ? "You Win!" : "Game Over";
            this.syncUI();
            return;
        }

        // player
        this.player.handleInput(this.input);
        this.player.update(dt, this);

        // spawn power ups
        this._accumPowerUpSpawn += dt;
        if (this._accumPowerUpSpawn >= this.powerUpSpawnEvery && this.powerUps.length === 0) {
            this._accumPowerUpSpawn = 0;
            const gx = Math.floor(Math.random() * (WIDTH / TILE)) * TILE;
            const gy = Math.floor(Math.random() * (HEIGHT / TILE)) * TILE;
            this.powerUps.push(new SpeedBoost(gx, gy));
        }

        // collect power ups
        const collectedPowerUp = this.powerUps.find(p => aabb(this.player, p)); 
        if (collectedPowerUp) {
            collectedPowerUp.dead = true;
            this.player.speed = this.player.baseSpeed * 1.5; // speed increase
            this.player.boostTimeLeft = 5; // time limit for boost
        }
        this.powerUps = this.powerUps.filter(p => !p.dead);

        // power up countdown
        if (this.player.boostTimeLeft > 0) {
            this.player.boostTimeLeft -= dt;
            if (this.player.boostTimeLeft <= 0) {
                this.player.speed = this.player.baseSpeed;
            }
        }

        // spawn crops
        this._accumSpawn += dt;
        while (this._accumSpawn >= this.spawnEvery) {
            this._accumSpawn -= this.spawnEvery;
            this.spawnCrop();
        }

        // collect crops
        const collected = this.crops.filter(c => aabb(this.player, c)); // arrow #1
        if (collected.length) {
            collected.forEach(c => c.dead = true); // arrow #2
            this.score += collected.length;
            if (this.ui.score) this.ui.score.textContent = String(this.score);
            if (this.score >= this.goal) {
                this.state = State.WIN;
                if (this.ui.status) this.ui.status.textContent = "You Win!";
            }
        }
        this.crops = this.crops.filter(c => !c.dead); // arrow #3
        this.crops.forEach(c => c.update(dt, this)); // arrow #4

        // obstacles
        this.obstacles.forEach(o => o.update(dt, this));
        const hitCrow = this.obstacles.find(o => o instanceof Crow && aabb(this.player, o));
        if (hitCrow) {
            this.timeLeft = clamp(this.timeLeft - 5, 0, GAME_LEN);
            this.syncUI();
            hitCrow.x = Math.random() * WIDTH;
            hitCrow.y = Math.random() * HEIGHT;
        }

        // timer UI
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
    }

    render() {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // background
        ctx.fillStyle = "#dff0d5";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.strokeStyle = "#c7e0bd";
        ctx.lineWidth = 1;
        for (let y = TILE; y < HEIGHT; y += TILE) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
        }
        for (let x = TILE; x < WIDTH; x += TILE) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
        }

        // entities
        this.crops.forEach(c => c.draw(ctx)); // arrow #5
        this.obstacles.forEach(o => o.draw(ctx)); // arrow #6

        this.powerUps.forEach(p => p.draw(ctx));
        this.player.draw(ctx);
        
        // state labels
        ctx.fillStyle = "#333";
        ctx.font = "16px system-ui, sans-serif";
        if (this.state === State.MENU) {
            ctx.fillText("Press Start to play", 20, 28);
        } else if (this.state === State.PAUSED) {
            ctx.fillText("Paused (press P to resume)", 20, 28);
        } else if (this.state === State.GAME_OVER) {
            ctx.fillText("Time up! Press Reset to return to Menu", 20, 28);
        } else if (this.state === State.WIN) {
            ctx.fillText("Harvest complete! Press Reset for another round", 20, 28);
        }
    }

    dispose() {
        this.input.dispose();
        window.removeEventListener("resize", this._onResize);
    }
}

// ---- Boot ----
const canvas = document.getElementById("game");
const game = new Game(canvas);
// Click "Start" in the UI to begin.
