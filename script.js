/**
 * ==============================================================================
 * ROMANTIC PROPOSAL WEBSITE - JAVASCRIPT
 * Features:
 *  - Floating heart background particles (Canvas)
 *  - Interactive cursor sparkle/heart trail (Canvas)
 *  - Confetti & Fireworks celebration engine (Canvas)
 *  - Procedural Web Audio API romantic music box & sound effects
 *  - Typewriter effect for romantic intro
 *  - Evasive "No" button with funny speech bubbles & progressive "Yes" scaling
 *  - Real-time love counter (Days, Hours, Minutes, Seconds)
 *  - Love letter modal & personalization modal
 *  - Dark/Light mode theme switcher
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================================
  // 1. STATE & CONFIGURATION
  // ============================================================================
  const state = {
    partnerName: 'My Special Someone',
    senderName: 'Yours Always',
    partnerType: 'Girlfriend', // 'Girlfriend' | 'Boyfriend' | 'Soulmate'
    noEscapeCount: 0,
    accepted: false,
    relationshipStartDate: new Date(),
    theme: localStorage.getItem('proposal_theme') || 'light',
    musicPlaying: false,
    timerInterval: null
  };

  // Playful phrases when user tries to touch or click "No"
  const noEscapeMessages = [
    "Hey, you can't click this! 😜",
    "Are you really sure? Think again! 🥺",
    "Wrong button, silly! Look at the shiny pink one! 👉",
    "You're trying too hard! Just say yes! 🥰",
    "Resistance is futile, my heart chose you! 💘",
    "Nice try, but I won't let you say no! 🏃💨",
    "The 'Yes' button is getting lonely! 🥺💖",
    "I'll keep running away forever! 🏃‍♀️💨",
    "You know you want to say yes! 😘",
    "Look how big the 'Yes' button is now! 💖",
    "Destiny has already decided! Just click Yes! ✨",
    "Nope! Still not an option! 💕"
  ];

  // DOM Elements
  const loader = document.getElementById('loader');
  const typewriterElement = document.getElementById('typewriter-text');
  const startBtn = document.getElementById('start-btn');
  const gotoProposalBtn = document.getElementById('goto-proposal-btn');
  const yesBtn = document.getElementById('yes-btn');
  const noBtn = document.getElementById('no-btn');
  const noSpeechBubble = document.getElementById('no-speech-bubble');
  const speechText = document.getElementById('speech-text');
  const rejectionCounter = document.getElementById('rejection-counter');
  const buttonsArena = document.getElementById('buttons-arena');
  const partnerTitle = document.getElementById('partner-title');
  const partnerPills = document.querySelectorAll('.partner-pill');
  
  // Celebration & Modals
  const celebrationOverlay = document.getElementById('celebration-overlay');
  const foreverBtn = document.getElementById('forever-btn');
  const replayFireworksBtn = document.getElementById('replay-fireworks-btn');
  const letterModal = document.getElementById('letter-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const sealLetterBtn = document.getElementById('seal-letter-btn');
  
  // Customization Modal
  const customizeBtn = document.getElementById('customize-btn');
  const customizeModal = document.getElementById('customize-modal');
  const custCloseBtn = document.getElementById('cust-close-btn');
  const custBackdrop = document.getElementById('cust-backdrop');
  const customizeForm = document.getElementById('customize-form');
  const inputRecipient = document.getElementById('input-recipient');
  const inputSender = document.getElementById('input-sender');
  const selectRole = document.getElementById('select-role');
  const signatureText = document.getElementById('signature-text');

  // Nav & Audio
  const musicBtn = document.getElementById('music-btn');
  const musicIcon = document.getElementById('music-icon');
  const musicWave = document.getElementById('music-wave');
  const themeBtn = document.getElementById('theme-btn');
  const themeIcon = document.getElementById('theme-icon');

  // Helper: Haptic feedback for Android devices
  function triggerHaptic(pattern = 30) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        // Silently continue if permissions are restricted
      }
    }
  }

  // Helper: Check if running on mobile / Android
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

  // Global one-touch unlocker for Android Chrome Web Audio
  function unlockAudioOnFirstGesture() {
    soundEngine.init();
    window.removeEventListener('touchstart', unlockAudioOnFirstGesture);
    window.removeEventListener('touchend', unlockAudioOnFirstGesture);
    window.removeEventListener('click', unlockAudioOnFirstGesture);
  }
  window.addEventListener('touchstart', unlockAudioOnFirstGesture, { passive: true });
  window.addEventListener('touchend', unlockAudioOnFirstGesture, { passive: true });
  window.addEventListener('click', unlockAudioOnFirstGesture);

  // ============================================================================
  // 2. PRELOADER & INITIAL SETUP (NON-BLOCKING ON ALL BROWSERS)
  // ============================================================================
  let typewriterStarted = false;

  function dismissLoader() {
    if (loader && !loader.dataset.dismissed) {
      loader.dataset.dismissed = "true";
      loader.classList.add('fade-out');
      loader.style.pointerEvents = 'none';
      setTimeout(() => {
        if (loader && loader.parentNode) loader.remove();
      }, 400);
    }
    // Only trigger the typewriter once so text never overlaps or jumbles
    if (!typewriterStarted) {
      typewriterStarted = true;
      initTypewriter();
    }
  }

  // Dismiss loader reliably without waiting on slow mobile networks
  if (document.readyState === 'complete') {
    setTimeout(dismissLoader, 150);
  } else {
    window.addEventListener('load', () => setTimeout(dismissLoader, 150));
    // Safe fallback: never let loader block phone screen for more than 600ms
    setTimeout(dismissLoader, 600);
  }

  // Tap anywhere on loader to dismiss instantly
  if (loader) {
    loader.addEventListener('click', dismissLoader);
    loader.addEventListener('touchstart', dismissLoader, { passive: true });
  }

  // Apply Initial Theme
  document.body.className = `theme-${state.theme}`;
  updateThemeIcon();

  themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.body.className = `theme-${state.theme}`;
    localStorage.setItem('proposal_theme', state.theme);
    updateThemeIcon();
    triggerHaptic(25);
    soundEngine.playChime(587.33, 'sine', 0.2); // D5 chime
  });

  function updateThemeIcon() {
    if (state.theme === 'dark') {
      themeIcon.textContent = '☀️';
      themeBtn.querySelector('.btn-tooltip').textContent = 'Daylight Glow';
    } else {
      themeIcon.textContent = '🌙';
      themeBtn.querySelector('.btn-tooltip').textContent = 'Starlight Mode';
    }
  }

  // ============================================================================
  // 3. PROCEDURAL WEB AUDIO SYNTHESIZER (ROMANTIC MUSIC & SOUND FX)
  // No external files needed - 100% reliable everywhere!
  // ============================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMusicRunning = false;
      this.musicInterval = null;
      this.step = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // Gentle Bell / Synth Note
    playTone(freq, type = 'sine', duration = 1.2, gainLevel = 0.15) {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(gainLevel, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Fallback silently if audio context is blocked
      }
    }

    playChime(freq = 523.25, type = 'sine', dur = 0.4) {
      this.init();
      this.playTone(freq, type, dur, 0.2);
    }

    // Playful Boing / Whoosh when "No" button dashes away
    playDodge() {
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.25);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } catch (e) {}
    }

    // Grand Romantic Celebration Fanfare when "Yes" is clicked
    playCelebrationFanfare() {
      this.init();
      if (!this.ctx) return;
      // Arpeggio notes: C4, E4, G4, C5, E5, G5, C6 (Lush harmonic cascade)
      const fanfare = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.30 }, // E5
        { f: 783.99, d: 0.45 }, // G5
        { f: 1046.50, d: 0.65 }, // C6
        { f: 1318.51, d: 0.90 }  // E6
      ];
      fanfare.forEach((item, idx) => {
        setTimeout(() => {
          this.playTone(item.f, 'sine', 1.8, 0.25);
          this.playTone(item.f * 0.5, 'triangle', 2.0, 0.12); // rich warmth
        }, idx * 160);
      });
    }

    // Romantic Lo-fi Music Box Melody Loop
    startRomanticMusic() {
      this.init();
      if (this.isMusicRunning) return;
      this.isMusicRunning = true;
      state.musicPlaying = true;
      updateMusicUI(true);

      // Romantic chord progression arpeggio: Cmaj9 - Am9 - Fmaj7 - G6
      const melodyNotes = [
        // Cmaj9
        261.63, 329.63, 392.00, 493.88, 523.25, 392.00,
        // Am9
        220.00, 261.63, 329.63, 440.00, 493.88, 329.63,
        // Fmaj7
        174.61, 261.63, 329.63, 349.23, 440.00, 329.63,
        // G6/Gsus4
        196.00, 293.66, 392.00, 440.00, 523.25, 392.00
      ];

      this.step = 0;
      this.musicInterval = setInterval(() => {
        if (!this.isMusicRunning) return;
        const note = melodyNotes[this.step % melodyNotes.length];
        
        // Bell tone with smooth soft attack
        this.playTone(note, 'sine', 1.6, 0.08);

        // Every 6 notes, play a soft bass foundation
        if (this.step % 6 === 0) {
          this.playTone(note * 0.5, 'triangle', 2.4, 0.09);
        }

        this.step++;
      }, 500); // 120 bpm gentle lofi tempo
    }

    stopRomanticMusic() {
      this.isMusicRunning = false;
      state.musicPlaying = false;
      if (this.musicInterval) {
        clearInterval(this.musicInterval);
        this.musicInterval = null;
      }
      updateMusicUI(false);
    }

    toggleMusic() {
      if (this.isMusicRunning) {
        this.stopRomanticMusic();
      } else {
        this.startRomanticMusic();
      }
    }
  }

  const soundEngine = new SoundEngine();

  function updateMusicUI(isPlaying) {
    if (isPlaying) {
      musicWave.classList.add('active');
      musicIcon.textContent = '💖';
      musicBtn.querySelector('.btn-tooltip').textContent = 'Music: Playing';
    } else {
      musicWave.classList.remove('active');
      musicIcon.textContent = '🎵';
      musicBtn.querySelector('.btn-tooltip').textContent = 'Music: Off';
    }
  }

  musicBtn.addEventListener('click', () => {
    soundEngine.toggleMusic();
  });

  // ============================================================================
  // 4. TYPEWRITER EFFECT (LANDING PAGE - CLEAN SINGLE LOOP)
  // ============================================================================
  let typewriterTimer = null;

  function initTypewriter(customText) {
    // Clear any existing typing loop to prevent double typing
    if (typewriterTimer) {
      clearTimeout(typewriterTimer);
      typewriterTimer = null;
    }

    const textToType = customText || "Hi ❤️, I have something special to ask you...";
    let charIndex = 0;
    typewriterElement.textContent = "";

    function typeNextChar() {
      if (charIndex < textToType.length) {
        typewriterElement.textContent += textToType.charAt(charIndex);
        charIndex++;
        const prevChar = textToType.charAt(charIndex - 1);
        const typingDelay = prevChar === ',' ? 280 : (55 + Math.random() * 35);
        typewriterTimer = setTimeout(typeNextChar, typingDelay);
      }
    }

    typeNextChar();
  }

  // Universal smooth scroll helper
  function scrollToTarget(el) {
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      const top = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // Smooth scroll & sound on "Start"
  startBtn.addEventListener('click', (e) => {
    e.preventDefault();
    triggerHaptic(30);
    soundEngine.startRomanticMusic();
    soundEngine.playChime(659.25, 'sine', 0.4);
    scrollToTarget(document.getElementById('story'));
  });

  gotoProposalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    triggerHaptic(30);
    soundEngine.playChime(783.99, 'sine', 0.4);
    scrollToTarget(document.getElementById('proposal'));
  });

  // ============================================================================
  // 5. MEMORY CARDS INTERSECTION OBSERVER
  // ============================================================================
  const memoryCards = document.querySelectorAll('.memory-card');
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.25 });

  memoryCards.forEach(card => cardObserver.observe(card));

  // ============================================================================
  // 6. BACKGROUND FLOATING HEARTS (CANVAS)
  // ============================================================================
  const bgCanvas = document.getElementById('bg-canvas');
  const bgCtx = bgCanvas.getContext('2d');
  let bgWidth = (bgCanvas.width = window.innerWidth);
  let bgHeight = (bgCanvas.height = window.innerHeight);

  function handleResize() {
    bgWidth = bgCanvas.width = window.innerWidth;
    bgHeight = bgCanvas.height = window.innerHeight;
    if (cursorCanvas) {
      cursorCanvas.width = window.innerWidth;
      cursorCanvas.height = window.innerHeight;
    }
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 150);
  });

  class FloatingHeart {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * bgWidth;
      this.y = initial ? Math.random() * bgHeight : bgHeight + 20;
      this.size = Math.random() * 16 + 8;
      this.speedY = Math.random() * 0.9 + 0.4;
      this.swingSpeed = Math.random() * 0.02 + 0.01;
      this.swingRange = Math.random() * 30 + 10;
      this.angle = Math.random() * Math.PI * 2;
      this.opacity = Math.random() * 0.5 + 0.2;
      this.rotation = (Math.random() - 0.5) * 0.4;
      
      // Romantic pink, soft gold & red tones
      const colors = ['#ff4d6d', '#ff758f', '#ffccd5', '#d4af37', '#e63946', '#ffffff'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.y -= this.speedY;
      this.angle += this.swingSpeed;
      this.currentX = this.x + Math.sin(this.angle) * this.swingRange;

      if (this.y < -30) {
        this.reset();
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.currentX, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;

      // Draw Heart Path
      ctx.beginPath();
      const topCurveHeight = this.size * 0.3;
      ctx.moveTo(0, topCurveHeight);
      // top left curve
      ctx.bezierCurveTo(0, 0, -this.size / 2, 0, -this.size / 2, topCurveHeight);
      // bottom left curve
      ctx.bezierCurveTo(-this.size / 2, (this.size + topCurveHeight) / 2, 0, this.size, 0, this.size * 1.2);
      // bottom right curve
      ctx.bezierCurveTo(0, this.size, this.size / 2, (this.size + topCurveHeight) / 2, this.size / 2, topCurveHeight);
      // top right curve
      ctx.bezierCurveTo(this.size / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  const bgHeartsCount = window.innerWidth < 768 ? 22 : 45;
  const bgHearts = Array.from({ length: bgHeartsCount }, () => new FloatingHeart());

  function animateBg() {
    bgCtx.clearRect(0, 0, bgWidth, bgHeight);
    bgHearts.forEach(heart => {
      heart.update();
      heart.draw(bgCtx);
    });
    requestAnimationFrame(animateBg);
  }
  animateBg();

  // ============================================================================
  // 7. FLOATING HEART CURSOR TRAIL EFFECT
  // ============================================================================
  const cursorCanvas = document.getElementById('cursor-canvas');
  const cursorCtx = cursorCanvas.getContext('2d');
  cursorCanvas.width = window.innerWidth;
  cursorCanvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
  });

  const cursorParticles = [];

  class CursorSparkle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 12 + 6;
      this.speedX = (Math.random() - 0.5) * 1.6;
      this.speedY = -Math.random() * 1.8 - 0.6;
      this.life = 1;
      this.decay = Math.random() * 0.03 + 0.02;
      this.color = Math.random() > 0.4 ? '#ff4d6d' : (Math.random() > 0.5 ? '#ffd700' : '#ffffff');
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;
    }

    draw(ctx) {
      if (this.life <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;

      // Draw Mini Heart
      ctx.beginPath();
      const s = this.size * this.life;
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(0, 0, -s / 2, 0, -s / 2, s * 0.3);
      ctx.bezierCurveTo(-s / 2, (s + s * 0.3) / 2, 0, s, 0, s * 1.2);
      ctx.bezierCurveTo(0, s, s / 2, (s + s * 0.3) / 2, s / 2, s * 0.3);
      ctx.bezierCurveTo(s / 2, 0, 0, 0, 0, s * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  let lastCursorSpawn = 0;
  function handlePointerMove(e) {
    const now = Date.now();
    if (now - lastCursorSpawn > 35) { // Throttle particle creation
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (clientX !== undefined && clientY !== undefined) {
        cursorParticles.push(new CursorSparkle(clientX, clientY));
        lastCursorSpawn = now;
      }
    }
  }

  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('touchmove', handlePointerMove, { passive: true });

  function animateCursorTrail() {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    for (let i = cursorParticles.length - 1; i >= 0; i--) {
      const p = cursorParticles[i];
      p.update();
      p.draw(cursorCtx);
      if (p.life <= 0) {
        cursorParticles.splice(i, 1);
      }
    }
    requestAnimationFrame(animateCursorTrail);
  }
  animateCursorTrail();

  // ============================================================================
  // 8. EVASIVE "NO" BUTTON & GROWING "YES" BUTTON (SCREEN-BOUND GUARANTEED)
  // ============================================================================
  let lastDodgeTime = 0;

  function moveNoButton() {
    const now = Date.now();
    if (now - lastDodgeTime < 130) return; // Prevent excessive rapid triggers
    lastDodgeTime = now;

    state.noEscapeCount++;
    soundEngine.playDodge();
    triggerHaptic([40, 25, 40]); // Android haptic vibration

    // CRUCIAL: Attach noBtn and noSpeechBubble directly to document.body
    // This prevents parent containers with backdrop-filter or transform from hijacking
    // the position:fixed coordinates, guaranteeing it stays 100% inside the visible screen!
    if (noBtn.parentElement !== document.body) {
      document.body.appendChild(noBtn);
      document.body.appendChild(noSpeechBubble);
    }

    // Measure exact button dimensions
    const btnRect = noBtn.getBoundingClientRect();
    const btnWidth = Math.max(btnRect.width || 0, isMobile ? 95 : 115);
    const btnHeight = Math.max(btnRect.height || 0, isMobile ? 44 : 50);

    // Safe boundaries from edges of the screen
    const safeMarginX = 16;
    const safeMarginTop = 80; // Keep below top navigation bar
    const safeMarginBottom = isMobile ? 95 : 85; // Keep above bottom navigation bar

    const minX = safeMarginX;
    const maxX = Math.max(minX + 20, window.innerWidth - btnWidth - safeMarginX);
    const minY = safeMarginTop;
    const maxY = Math.max(minY + 30, window.innerHeight - btnHeight - safeMarginBottom);

    // Pick random position strictly within screen boundaries
    let randomX = Math.floor(Math.random() * (maxX - minX)) + minX;
    let randomY = Math.floor(Math.random() * (maxY - minY)) + minY;

    // Hard clamp to ensure button NEVER goes off screen
    randomX = Math.min(maxX, Math.max(minX, randomX));
    randomY = Math.min(maxY, Math.max(minY, randomY));

    // Avoid overlapping the Yes button
    const yesRect = yesBtn.getBoundingClientRect();
    const buffer = 24;
    const isOverlappingYes = (
      randomX < yesRect.right + buffer &&
      randomX + btnWidth > yesRect.left - buffer &&
      randomY < yesRect.bottom + buffer &&
      randomY + btnHeight > yesRect.top - buffer
    );

    if (isOverlappingYes) {
      if (yesRect.top > window.innerHeight / 2) {
        randomY = Math.max(minY, yesRect.top - btnHeight - 35);
      } else {
        randomY = Math.min(maxY, yesRect.bottom + 35);
      }
      randomY = Math.min(maxY, Math.max(minY, randomY));
    }

    // Apply fixed coordinates (relative to viewport)
    noBtn.classList.add('running');
    noBtn.style.left = `${randomX}px`;
    noBtn.style.top = `${randomY}px`;

    // Display speech bubble above or below the fleeing "No" button
    const messageIndex = (state.noEscapeCount - 1) % noEscapeMessages.length;
    speechText.textContent = noEscapeMessages[messageIndex];
    noSpeechBubble.classList.remove('hidden');

    // Clamp speech bubble safely on screen
    const bubbleWidth = Math.min(220, window.innerWidth - 32);
    noSpeechBubble.style.maxWidth = `${bubbleWidth}px`;
    noSpeechBubble.style.width = 'max-content';

    let bubbleTop = randomY - 50;
    if (bubbleTop < safeMarginTop) {
      bubbleTop = randomY + btnHeight + 12; // place below button if near top
    }
    let bubbleLeft = randomX + (btnWidth / 2) - (bubbleWidth / 2);
    bubbleLeft = Math.max(16, Math.min(window.innerWidth - bubbleWidth - 16, bubbleLeft));

    noSpeechBubble.style.top = `${bubbleTop}px`;
    noSpeechBubble.style.left = `${bubbleLeft}px`;

    // Grow "Yes" Button dynamically!
    const maxScale = isMobile ? 1.45 : 2.25;
    const scaleStep = isMobile ? 0.06 : 0.12;
    const newScale = Math.min(maxScale, 1 + state.noEscapeCount * scaleStep);
    yesBtn.style.transform = `scale(${newScale})`;
    yesBtn.style.boxShadow = `0 ${10 + state.noEscapeCount * 3}px ${30 + state.noEscapeCount * 4}px rgba(217, 4, 41, ${0.4 + state.noEscapeCount * 0.05})`;

    // Update rejection feedback note
    if (rejectionCounter) {
      rejectionCounter.textContent = `Attempts to resist: ${state.noEscapeCount} 😜 (The 'Yes' button is taking over!)`;
    }
  }

  // Keep button inside screen on resize or phone orientation change
  function keepNoInsideScreen() {
    if (!noBtn.classList.contains('running')) return;
    const btnWidth = noBtn.offsetWidth || 100;
    const btnHeight = noBtn.offsetHeight || 44;
    const currentLeft = parseFloat(noBtn.style.left) || 16;
    const currentTop = parseFloat(noBtn.style.top) || 80;
    const safeLeft = Math.min(Math.max(16, currentLeft), window.innerWidth - btnWidth - 16);
    const safeTop = Math.min(Math.max(70, currentTop), window.innerHeight - btnHeight - 80);
    noBtn.style.left = `${safeLeft}px`;
    noBtn.style.top = `${safeTop}px`;
  }
  window.addEventListener('resize', keepNoInsideScreen);
  window.addEventListener('orientationchange', keepNoInsideScreen);

  // Intercept touch & hover directly on the "No" button
  noBtn.addEventListener('mouseenter', moveNoButton);
  noBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    moveNoButton();
  });
  noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveNoButton();
  }, { passive: false });
  noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    moveNoButton();
  });

  // Partner title selector pills
  partnerPills.forEach(pill => {
    pill.addEventListener('click', () => {
      partnerPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.partnerType = pill.dataset.type;
      partnerTitle.textContent = state.partnerType;
      triggerHaptic(20);
      soundEngine.playChime(523.25, 'sine', 0.2);
    });
  });

  // ============================================================================
  // 9. CELEBRATION ENGINE (CONFETTI, FIREWORKS & SPARKLES)
  // ============================================================================
  const confettiCanvas = document.getElementById('confetti-canvas');
  const confCtx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  });

  const celebrationParticles = [];

  class ConfettiPiece {
    constructor(x, y, isFirework = false) {
      this.x = x;
      this.y = y;
      this.isFirework = isFirework;
      
      const angle = isFirework ? Math.random() * Math.PI * 2 : Math.random() * Math.PI - Math.PI / 2;
      const speed = isFirework ? Math.random() * 8 + 3 : Math.random() * 5 + 2;
      
      this.vx = Math.cos(angle) * speed;
      this.vy = isFirework ? Math.sin(angle) * speed : Math.random() * -6 - 2;
      
      this.gravity = isFirework ? 0.08 : 0.12;
      this.drag = isFirework ? 0.96 : 0.98;
      
      this.size = Math.random() * 10 + 6;
      this.shape = Math.random() > 0.4 ? 'heart' : (Math.random() > 0.5 ? 'circle' : 'ribbon');
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.2;
      this.life = 1;
      this.decay = isFirework ? Math.random() * 0.015 + 0.008 : Math.random() * 0.008 + 0.004;

      const colors = ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#ffd700', '#ffffff', '#ffb703'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.vx *= this.drag;
      this.vy *= this.drag;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      this.life -= this.decay;
    }

    draw(ctx) {
      if (this.life <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;

      if (this.shape === 'heart') {
        const s = this.size;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(0, 0, -s / 2, 0, -s / 2, s * 0.3);
        ctx.bezierCurveTo(-s / 2, (s + s * 0.3) / 2, 0, s, 0, s * 1.2);
        ctx.bezierCurveTo(0, s, s / 2, (s + s * 0.3) / 2, s / 2, s * 0.3);
        ctx.bezierCurveTo(s / 2, 0, 0, 0, 0, s * 0.3);
        ctx.closePath();
        ctx.fill();
      } else if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ribbon / Confetti strip
        ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      }

      ctx.restore();
    }
  }

  function launchFirework(x, y) {
    const count = 50;
    for (let i = 0; i < count; i++) {
      celebrationParticles.push(new ConfettiPiece(x, y, true));
    }
  }

  function rainConfetti() {
    const count = 8;
    for (let i = 0; i < count; i++) {
      celebrationParticles.push(new ConfettiPiece(Math.random() * confettiCanvas.width, -10, false));
    }
  }

  let celebrationActive = false;
  function animateCelebration() {
    confCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    if (celebrationActive && Math.random() < 0.4) {
      rainConfetti();
    }

    for (let i = celebrationParticles.length - 1; i >= 0; i--) {
      const p = celebrationParticles[i];
      p.update();
      p.draw(confCtx);
      if (p.life <= 0 || p.y > confettiCanvas.height + 30) {
        celebrationParticles.splice(i, 1);
      }
    }
    requestAnimationFrame(animateCelebration);
  }
  animateCelebration();

  function triggerCelebration() {
    celebrationActive = true;
    confettiCanvas.classList.add('active');
    soundEngine.playCelebrationFanfare();

    // Fire fireworks in sequence across the screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.4;
    
    launchFirework(centerX, centerY);
    setTimeout(() => launchFirework(centerX - 240, centerY - 60), 250);
    setTimeout(() => launchFirework(centerX + 240, centerY - 60), 450);
    setTimeout(() => launchFirework(centerX - 120, centerY + 100), 700);
    setTimeout(() => launchFirework(centerX + 120, centerY + 100), 950);

    // Show celebration overlay modal
    celebrationOverlay.classList.remove('hidden');
    startLoveTimer();
  }

  // ============================================================================
  // 10. "YES" CLICK EVENT & LOVE TIMER
  // ============================================================================
  yesBtn.addEventListener('click', () => {
    state.accepted = true;
    noBtn.style.display = 'none'; // Hide fleeing No button when accepted
    noSpeechBubble.classList.add('hidden');
    triggerHaptic([120, 60, 120, 60, 300]); // Android romantic heartbeat vibration
    triggerCelebration();
  });

  function startLoveTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);

    // Start timer from the current moment
    const startDate = new Date();

    const daysEl = document.getElementById('count-days');
    const hoursEl = document.getElementById('count-hours');
    const minsEl = document.getElementById('count-minutes');
    const secsEl = document.getElementById('count-seconds');

    function updateCounter() {
      const now = new Date();
      const diffMs = now - startDate;

      const totalSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      daysEl.textContent = days;
      hoursEl.textContent = String(hours).padStart(2, '0');
      minsEl.textContent = String(mins).padStart(2, '0');
      secsEl.textContent = String(secs).padStart(2, '0');
    }

    updateCounter();
    state.timerInterval = setInterval(updateCounter, 1000);
  }

  // "Forever Together" Button - Opens Love Letter Modal
  foreverBtn.addEventListener('click', () => {
    triggerHaptic([60, 40, 100]);
    soundEngine.playChime(1046.50, 'sine', 0.6); // High C6 sparkle
    letterModal.classList.remove('hidden');
    // Fire another set of celebratory fireworks!
    launchFirework(window.innerWidth / 2, window.innerHeight * 0.45);
  });

  replayFireworksBtn.addEventListener('click', () => {
    triggerHaptic([50, 50, 50]);
    soundEngine.playCelebrationFanfare();
    launchFirework(window.innerWidth * 0.3, window.innerHeight * 0.35);
    launchFirework(window.innerWidth * 0.7, window.innerHeight * 0.35);
  });

  // Close letter modal
  modalCloseBtn.addEventListener('click', () => letterModal.classList.add('hidden'));
  modalBackdrop.addEventListener('click', () => letterModal.classList.add('hidden'));
  sealLetterBtn.addEventListener('click', () => {
    soundEngine.playChime(880, 'sine', 0.4);
    letterModal.classList.add('hidden');
  });

  // ============================================================================
  // 11. PERSONALIZATION / NAME CUSTOMIZER
  // ============================================================================
  customizeBtn.addEventListener('click', () => {
    customizeModal.classList.remove('hidden');
  });

  custCloseBtn.addEventListener('click', () => customizeModal.classList.add('hidden'));
  custBackdrop.addEventListener('click', () => customizeModal.classList.add('hidden'));

  customizeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const recipient = inputRecipient.value.trim();
    const sender = inputSender.value.trim();
    const role = selectRole.value;

    if (recipient) {
      state.partnerName = recipient;
      // Update typewriter greeting
      typewriterElement.textContent = `Hi ${recipient} ❤️, I have something special to ask you...`;
    }

    if (sender) {
      state.senderName = sender;
      signatureText.textContent = `Yours Always, ${sender} ❤️`;
    }

    if (role) {
      state.partnerType = role;
      partnerTitle.textContent = role;
      partnerPills.forEach(p => {
        p.classList.toggle('active', p.dataset.type === role);
      });
    }

    soundEngine.playChime(659.25, 'sine', 0.3);
    customizeModal.classList.add('hidden');
  });

});
