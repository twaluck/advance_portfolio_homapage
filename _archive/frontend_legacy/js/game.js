/**
 * Kanji Bubble Blast
 * Tap the bubbles in the correct component order to build the Kanji!
 */

const PUZZLES = [
  { target: "休", meaning: "やすむ", parts: ["人", "木"], extras: ["日", "口", "土", "田"] },
  { target: "林", meaning: "はやし", parts: ["木", "木"], extras: ["人", "日", "大"] },
  { target: "森", meaning: "もり", parts: ["木", "木", "木"], extras: ["林", "人", "水"] },
  { target: "明", meaning: "あかるい", parts: ["日", "月"], extras: ["目", "田", "力"] },
  { target: "男", meaning: "おとこ", parts: ["田", "力"], extras: ["日", "木", "口"] },
  { target: "好", meaning: "すき", parts: ["女", "子"], extras: ["人", "日", "小"] },
  { target: "品", meaning: "しな", parts: ["口", "口", "口"], extras: ["日", "月", "山"] },
  { target: "炎", meaning: "ほのお", parts: ["火", "火"], extras: ["木", "日", "土"] },
  { target: "岩", meaning: "いわ", parts: ["山", "石"], extras: ["口", "田", "水"] },
  { target: "泉", meaning: "いずみ", parts: ["白", "水"], extras: ["日", "月", "夕"] },
  { target: "雷", meaning: "かみなり", parts: ["雨", "田"], extras: ["日", "月", "雲"] },
  { target: "雪", meaning: "ゆき", parts: ["雨", "ヨ"], extras: ["水", "冰", "山"] },
  { target: "鳴", meaning: "なく", parts: ["口", "鳥"], extras: ["日", "月", "羽"] },
  { target: "話", meaning: "はなし", parts: ["言", "舌"], extras: ["口", "心", "五"] },
  { target: "早", meaning: "はやい", parts: ["日", "十"], extras: ["月", "一", "草"] },
];

class SoundManager {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.bgmOscillators = [];
    this.bgmGain = null;
  }

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  play(type) {
    if (!this.enabled) return;
    this.init();

    // Create new temporary nodes for SFX
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.type = "sine";
    const now = this.context.currentTime;

    if (type === "pop") {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "success") {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === "fly") {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.3);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  startBGM() {
    if (!this.enabled || this.bgmOscillators.length > 0) return;
    this.init();

    this.bgmGain = this.context.createGain();
    this.bgmGain.gain.value = 0.05; // Very subtle
    this.bgmGain.connect(this.context.destination);

    // Create a simple ambient chord (C major 7th)
    const freqs = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4

    freqs.forEach(f => {
      const osc = this.context.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.connect(this.bgmGain);
      osc.start();
      this.bgmOscillators.push(osc);
    });
  }

  stopBGM() {
    this.bgmOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) { }
    });
    this.bgmOscillators = [];
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (enabled) {
      if (this.context && this.context.state === 'suspended') this.context.resume();
      this.startBGM();
    } else {
      this.stopBGM();
      if (this.context) this.context.suspend();
    }
  }
}

class KanjiGame {
  constructor() {
    this.state = {
      score: 0,
      lives: 3,
      currentIndex: 0,
      currentStep: 0,
      isPlaying: false,
      isPaused: false,
      bubbles: []
    };

    this.elements = {
      startBtn: document.getElementById("startGame"),
      pauseBtn: document.getElementById("pauseGame"),
      pauseIcon: document.getElementById("pauseIcon"),
      playIcon: document.getElementById("playIcon"),
      gameOver: document.getElementById("gameOver"),
      restartBtn: document.getElementById("restartGame"),
      buildArea: document.getElementById("buildArea"),
      buildContainer: document.querySelector(".build-area-container"),
      gameLayer: document.getElementById("gameLayer"),
      targetKanji: document.getElementById("targetKanji"),
      targetHint: document.getElementById("targetHint"),
      scoreText: document.getElementById("scoreText"),
      livesText: document.getElementById("livesText"),
      progressText: document.getElementById("progressText"),
      feedback: document.getElementById("feedbackText")
    };

    this.sound = new SoundManager();
    this.animationId = null;
    this.lastFrameTime = 0;

    this.bindEvents();
    this.toggleOverlay(false);
    this.setFeedback("Tap Start to play!");
  }

  bindEvents() {
    this.elements.startBtn?.addEventListener("click", () => {
      this.sound.init(); // Important: first interaction
      this.sound.startBGM();
      this.start();
    });

    this.elements.pauseBtn?.addEventListener("click", () => this.togglePause());

    this.elements.restartBtn?.addEventListener("click", () => this.start());

    this.elements.gameLayer.addEventListener("pointerdown", (e) => {
      if (!this.state.isPlaying || this.state.isPaused) return;
      const bubble = e.target.closest(".bubble");
      if (bubble) {
        this.handleBubbleTap(bubble);
      }
    });

    document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  }

  togglePause() {
    if (!this.state.isPlaying) return;

    this.state.isPaused = !this.state.isPaused;

    if (this.state.isPaused) {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      this.elements.pauseIcon.classList.add("hidden");
      this.elements.playIcon.classList.remove("hidden");
      this.setFeedback("PAUSED");
      this.elements.gameLayer.style.opacity = "0.5";
      if (this.sound.context) this.sound.context.suspend();
    } else {
      this.lastFrameTime = performance.now();
      this.gameLoop(this.lastFrameTime);
      this.elements.pauseIcon.classList.remove("hidden");
      this.elements.playIcon.classList.add("hidden");
      this.setFeedback("RESUMED");
      this.elements.gameLayer.style.opacity = "1";
      if (this.sound.context) this.sound.context.resume();
    }
  }

  toggleOverlay(show) {
    if (show) {
      this.elements.gameOver.classList.remove("hidden");
      this.elements.gameOver.style.display = "grid";
    } else {
      this.elements.gameOver.classList.add("hidden");
      this.elements.gameOver.style.display = "none";
    }
  }

  start() {
    this.state = {
      score: 0,
      lives: 3,
      currentIndex: 0,
      currentStep: 0,
      isPlaying: true,
      isPaused: false,
      bubbles: []
    };

    // Reset visual states
    this.elements.startBtn.textContent = "Restart";
    this.elements.buildContainer.classList.remove("merged");
    this.elements.pauseIcon.classList.remove("hidden");
    this.elements.playIcon.classList.add("hidden");
    this.elements.gameLayer.style.opacity = "1";
    this.elements.targetKanji.style.transform = "";
    this.elements.targetKanji.style.color = "";

    this.shuffle(PUZZLES);
    this.updateUI();
    this.loadLevel();
    this.toggleOverlay(false);
    this.setFeedback("Tap the components in order!");

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }

  loadLevel() {
    if (this.state.currentIndex >= PUZZLES.length) {
      this.gameOver("Victory!", "You completed all levels!");
      return;
    }

    const puzzle = PUZZLES[this.state.currentIndex];
    this.currentPuzzle = puzzle;
    this.state.currentStep = 0;

    this.elements.targetKanji.textContent = puzzle.target;
    this.elements.targetHint.textContent = `Reading: 「${puzzle.meaning}」`;

    this.renderSlots();
    this.spawnBubbles();
    this.elements.buildContainer.classList.remove("merged");

    // Ensure loop is running if it was stopped
    if (this.state.isPlaying && !this.state.isPaused) {
      this.lastFrameTime = performance.now();
      if (!this.animationId) this.gameLoop(this.lastFrameTime);
    }
  }

  renderSlots() {
    this.elements.buildArea.innerHTML = "";
    this.currentPuzzle.parts.forEach((_, i) => {
      const slot = document.createElement("div");
      slot.className = "part-slot";
      slot.dataset.index = i;
      this.elements.buildArea.appendChild(slot);
    });
  }

  spawnBubbles() {
    this.elements.gameLayer.innerHTML = "";
    this.state.bubbles = [];

    const parts = [...this.currentPuzzle.parts, ...this.currentPuzzle.extras];
    const pool = this.shuffle([...parts, ...parts, ...parts]);

    pool.forEach((char, i) => {
      this.createBubble(char);
    });
  }

  createBubble(char) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = char;
    bubble.dataset.char = char;

    const x = Math.random() * 90;
    const y = Math.random() * 80 + 10;

    const levelSpeed = 0.2 + (this.state.currentIndex * 0.05);
    const speedX = (Math.random() - 0.5) * levelSpeed;
    const speedY = (Math.random() - 0.5) * levelSpeed;

    bubble.style.left = `${x}%`;
    bubble.style.top = `${y}%`;

    this.elements.gameLayer.appendChild(bubble);

    this.state.bubbles.push({
      element: bubble,
      x, y,
      vx: speedX,
      vy: speedY
    });
  }

  gameLoop(timestamp) {
    if (!this.state.isPlaying || this.state.isPaused) {
      this.animationId = null;
      return;
    }

    // Keep loop running
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));

    // const delta = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    this.state.bubbles.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;

      if (b.x <= 0 || b.x >= 90) b.vx *= -1;
      if (b.y <= 5 || b.y >= 85) b.vy *= -1;

      b.element.style.left = `${b.x}%`;
      b.element.style.top = `${b.y}%`;
    });
  }

  handleBubbleTap(bubble) {
    if (!this.state.isPlaying || this.state.isPaused) return;

    const char = bubble.dataset.char;
    const targetChar = this.currentPuzzle.parts[this.state.currentStep];

    if (char === targetChar) {
      this.sound.play("pop");

      const idx = this.state.bubbles.findIndex(b => b.element === bubble);
      if (idx > -1) this.state.bubbles.splice(idx, 1);

      // Animate Soul Flight
      this.animateSoulFlight(bubble, this.state.currentStep);
      bubble.remove(); // Remove immediately mostly, visual takes over

      this.state.currentStep++;
      this.state.score += 50;
      this.updateUI();

      if (this.state.currentStep >= this.currentPuzzle.parts.length) {
        // Wait for flight animation to finish? No, just trigger complete after short delay
        setTimeout(() => this.handleLevelComplete(), 600);
      }

    } else {
      this.sound.play("error");
      this.state.lives--;
      this.updateUI();

      bubble.style.backgroundColor = "#fca5a5";
      setTimeout(() => bubble.style.backgroundColor = "", 200);

      this.elements.gameLayer.classList.add("shake");
      setTimeout(() => this.elements.gameLayer.classList.remove("shake"), 300);

      if (this.state.lives <= 0) {
        this.gameOver("Game Over", `Final Score: ${this.state.score}`);
      }
    }
  }

  animateSoulFlight(bubbleElement, slotIndex) {
    const rect = bubbleElement.getBoundingClientRect();
    const slots = this.elements.buildArea.children;
    const targetSlot = slots[slotIndex];
    if (!targetSlot) return;
    const targetRect = targetSlot.getBoundingClientRect();

    const soul = document.createElement("div");
    soul.className = "soul-particle";
    soul.textContent = bubbleElement.textContent;
    soul.style.left = `${rect.left}px`;
    soul.style.top = `${rect.top}px`;
    document.body.appendChild(soul);

    this.sound.play("fly");

    // Force reflow
    soul.getBoundingClientRect();

    soul.style.transform = `translate(${targetRect.left - rect.left}px, ${targetRect.top - rect.top}px)`;
    soul.style.opacity = "0";

    setTimeout(() => {
      soul.remove();
      targetSlot.textContent = bubbleElement.textContent;
      targetSlot.classList.add("filled");
    }, 500);
  }

  handleLevelComplete() {
    this.sound.play("success");
    this.state.score += 100;
    this.state.currentIndex++;
    this.updateUI();

    // Animate parts flying to target
    const startRect = this.elements.buildContainer.getBoundingClientRect();
    const targetRect = this.elements.targetKanji.getBoundingClientRect();

    const flyingGroup = this.elements.buildArea.cloneNode(true);
    flyingGroup.style.position = "fixed";
    flyingGroup.style.left = startRect.left + "px";
    flyingGroup.style.top = startRect.top + "px";
    flyingGroup.style.width = startRect.width + "px";
    flyingGroup.style.height = startRect.height + "px";
    flyingGroup.style.pointerEvents = "none";
    flyingGroup.style.transition = "all 0.8s cubic-bezier(0.19, 1, 0.22, 1)";
    flyingGroup.style.zIndex = "100";
    document.body.appendChild(flyingGroup);

    // Hide original
    this.elements.buildContainer.style.opacity = "0";

    // Trigger fly
    requestAnimationFrame(() => {
      flyingGroup.style.transform = `translate(${targetRect.left - startRect.left}px, ${targetRect.top - startRect.top}px) scale(0.2)`;
      flyingGroup.style.opacity = "0";
    });

    const target = this.elements.targetKanji;
    target.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s, color 0.5s ease 0.6s";
    target.style.transform = "scale(1.8)";
    target.style.color = "#fbbf24";

    setTimeout(() => {
      flyingGroup.remove();
      this.elements.buildContainer.style.opacity = "1";
      target.style.transform = "";
      target.style.color = "";
      this.loadLevel();
    }, 1200);
  }

  updateUI() {
    this.elements.scoreText.textContent = this.state.score;
    let hearts = "";
    for (let i = 0; i < 3; i++) {
      hearts += i < this.state.lives ? "❤️" : "🖤";
    }
    this.elements.livesText.textContent = hearts;
    this.elements.progressText.textContent = `${this.state.currentIndex + 1} / ${PUZZLES.length}`;
  }

  setFeedback(msg) {
    if (this.elements.feedback) this.elements.feedback.textContent = msg;
  }

  gameOver(title, msg) {
    this.state.isPlaying = false;
    cancelAnimationFrame(this.animationId);
    this.animationId = null;

    this.toggleOverlay(true);
    document.getElementById("gameOverTitle").textContent = title;
    document.getElementById("gameOverText").textContent = msg;

    // Reset button text
    this.elements.startBtn.textContent = "Start";
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  new KanjiGame();
});
