(() => {
  'use strict';

  const cards = Array.isArray(window.MOON_WHISPER_CARDS) ? window.MOON_WHISPER_CARDS : [];
  const positionLabels = [
    { en: 'PAST', zh: '过去' },
    { en: 'PRESENT', zh: '现在' },
    { en: 'FUTURE', zh: '未来' }
  ];
  const stepLabels = {
    hero: 'ENTER THE NIGHT',
    ask: 'ASK THE MOON',
    deck: 'CHOOSE THREE CARDS',
    reveal: 'REVEAL',
    result: 'MOON WHISPER'
  };

  const experience = document.getElementById('experience');
  const steps = [...document.querySelectorAll('.experience-step')];
  const stepIndicator = document.getElementById('stepIndicator');
  const heroStage = document.getElementById('hero');
  const heroAtmosphere = document.getElementById('heroAtmosphere');
  const heroFireflies = document.getElementById('heroFireflies');
  const moonLoading = document.getElementById('moonLoading');
  const heroIntroVideo = document.getElementById('heroIntroVideo');
  const heroLoopVideo = document.getElementById('heroLoopVideo');
  const enterExperience = document.getElementById('enterExperience');
  const askStep = document.getElementById('ask');
  const questionForm = document.getElementById('questionForm');
  const questionInput = document.getElementById('questionInput');
  const questionCount = document.getElementById('questionCount');
  const questionError = document.getElementById('questionError');
  const beginReadingButton = document.getElementById('beginReading');
  const deckQuestion = document.getElementById('deckQuestion');
  const revealQuestion = document.getElementById('revealQuestion');
  const deckEyebrow = document.getElementById('deckEyebrow');
  const deckTitle = document.getElementById('deckTitle');
  const deckSubtitle = document.getElementById('deckSubtitle');
  const deckStatus = document.getElementById('deckStatus');
  const deckStage = document.getElementById('deck');
  const ring = document.getElementById('circularDeck');
  const selectedSlots = document.getElementById('selectedSlots');
  const slots = [...document.querySelectorAll('.slot')];
  const deckCompletion = document.getElementById('deckCompletion');
  const revealCards = document.getElementById('revealCards');
  const revealStep = document.getElementById('reveal');
  const revealGrid = document.getElementById('revealGrid');
  const revealStatus = document.getElementById('revealStatus');
  const showReading = document.getElementById('showReading');
  const resultStep = document.getElementById('result');
  const resultQuestion = document.getElementById('resultQuestion');
  const readingTheme = document.getElementById('readingTheme');
  const resultCards = document.getElementById('resultCards');
  const relationshipStructure = document.getElementById('relationshipStructure');
  const relationshipElements = document.getElementById('relationshipElements');
  const relationshipCore = document.getElementById('relationshipCore');
  const relationshipText = document.getElementById('relationshipText');
  const suitableActions = document.getElementById('suitableActions');
  const cautionActions = document.getElementById('cautionActions');
  const whisperText = document.getElementById('whisperText');
  const drawAgain = document.getElementById('drawAgain');
  const musicToggle = document.getElementById('musicToggle');
  const backgroundMusic = document.getElementById('backgroundMusic');
  const cardHoverSound = document.getElementById('cardHoverSound');

  const scheduled = new Set();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const heroImageUrl = 'assets/production/hero-lake.webp';
  const loadingShownKey = 'moonWhisperLoadingShown';
  const introPlayedKey = 'moonWhisperIntroPlayed';
  const backgroundMusicMutedKey = 'moonWhisperMusicMuted';
  const backgroundMusicTargetVolume = .025;
  let activeHoverCard = null;
  let heroMotion = null;
  let heroVideoController = null;
  let askReturnWheelDistance = 0;
  let askReturnWheelResetTimer = 0;
  let cardHoverSoundUnlocked = false;
  let lastCardHoverSoundAt = 0;
  let cardHoverSoundCount = 0;
  let backgroundMusicFadeFrame = 0;
  let backgroundMusicStartPromise = null;
  let backgroundMusicStarted = false;
  let backgroundMusicPauseTimer = 0;
  let backgroundMusicMuted = readBackgroundMusicMuted();

  const state = {
    step: 'hero',
    question: '',
    deck: [],
    selected: [],
    deckPhase: 'deck',
    spreadComplete: false,
    isPicking: false,
    readyToReveal: false,
    revealInProgress: false,
    revealedCount: 0,
    runId: 0
  };

  function shuffle(source) {
    const shuffled = [...source];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  }

  function readSessionFlag(key) {
    try {
      return window.sessionStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  }

  function writeSessionFlag(key) {
    try {
      window.sessionStorage.setItem(key, 'true');
    } catch {}
  }

  function createHeroVideoController() {
    if (!heroStage || !moonLoading || !heroIntroVideo || !heroLoopVideo) {
      return { start() {}, setActive() {} };
    }

    let phase = 'idle';
    let loopReadyPromise = null;

    function sleep(delay) {
      return new Promise((resolve) => window.setTimeout(resolve, delay));
    }

    function setPhase(nextPhase) {
      phase = nextPhase;
      heroStage.dataset.videoPhase = nextPhase;
      document.documentElement.dataset.homeMediaState = nextPhase;
    }

    function preloadImage(url, timeout = 4200) {
      return new Promise((resolve) => {
        const image = new Image();
        let settled = false;
        const finish = (ready) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          image.onload = null;
          image.onerror = null;
          resolve(ready);
        };
        const timer = window.setTimeout(() => finish(false), timeout);
        image.onload = () => finish(true);
        image.onerror = () => finish(false);
        image.src = url;
        if (image.complete && image.naturalWidth > 0) finish(true);
      });
    }

    function waitForVideo(video, timeout = 5600) {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve(true);

      return new Promise((resolve) => {
        const source = video.querySelector('source');
        let settled = false;
        const finish = (ready) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          video.removeEventListener('canplay', handleReady);
          video.removeEventListener('error', handleError);
          source?.removeEventListener('error', handleError);
          resolve(ready);
        };
        const handleReady = () => finish(true);
        const handleError = () => finish(false);
        const timer = window.setTimeout(() => finish(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA), timeout);
        video.addEventListener('canplay', handleReady, { once: true });
        video.addEventListener('error', handleError, { once: true });
        source?.addEventListener('error', handleError, { once: true });
      });
    }

    async function playVideo(video) {
      video.autoplay = true;
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.dataset.playState = 'pending';
      try {
        const playRequest = video.play();
        if (playRequest) await playRequest;
        video.dataset.playState = 'playing';
        delete video.dataset.playError;
        return true;
      } catch (error) {
        video.dataset.playState = 'blocked';
        video.dataset.playError = error?.name || 'unknown';
        return false;
      }
    }

    function hideLoadingImmediately() {
      moonLoading.hidden = true;
      moonLoading.setAttribute('aria-hidden', 'true');
      moonLoading.dataset.state = 'skipped';
      document.documentElement.classList.add('moon-loading-skip');
    }

    async function leaveLoading() {
      moonLoading.dataset.state = 'ready';
      moonLoading.classList.add('is-ready');
      await sleep(reducedMotion.matches ? 20 : 320);
      moonLoading.dataset.state = 'leaving';
      moonLoading.classList.add('is-leaving');
      await sleep(reducedMotion.matches ? 20 : 740);
      moonLoading.hidden = true;
      moonLoading.setAttribute('aria-hidden', 'true');
      moonLoading.dataset.state = 'complete';
      document.documentElement.classList.add('moon-loading-skip');
    }

    function prepareIntroView() {
      document.body.classList.add('is-intro-playing');
      heroMotion?.setActive(false);
    }

    function revealHome() {
      document.body.classList.remove('is-intro-playing');
      heroStage.classList.add('is-home-ready');
      heroMotion?.setActive(state.step === 'hero');
    }

    function showStaticFallback() {
      heroIntroVideo.pause();
      heroLoopVideo.pause();
      heroIntroVideo.classList.remove('is-active');
      heroLoopVideo.classList.remove('is-active');
      heroStage.classList.remove('has-video');
      setPhase('fallback');
      revealHome();
      return false;
    }

    async function startLoop() {
      setPhase('loop-pending');
      const loopReady = await loopReadyPromise;
      if (!loopReady) return showStaticFallback();

      try {
        heroLoopVideo.currentTime = 0;
      } catch {}
      const loopStarted = await playVideo(heroLoopVideo);
      if (!loopStarted) return showStaticFallback();

      heroStage.classList.add('has-video');
      heroLoopVideo.classList.add('is-active');
      setPhase('loop');
      revealHome();
      window.setTimeout(() => {
        heroIntroVideo.pause();
        heroIntroVideo.classList.remove('is-active');
      }, reducedMotion.matches ? 0 : 820);
      return true;
    }

    function waitForIntroEnd() {
      return new Promise((resolve) => {
        let settled = false;
        const finish = (reason) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          heroIntroVideo.removeEventListener('ended', handleEnded);
          heroIntroVideo.removeEventListener('error', handleError);
          resolve(reason);
        };
        const handleEnded = () => finish('ended');
        const handleError = () => finish('error');
        const expectedDuration = Number.isFinite(heroIntroVideo.duration) ? heroIntroVideo.duration : 8.1;
        const timer = window.setTimeout(() => finish('timeout'), Math.ceil(expectedDuration * 1000) + 2400);
        heroIntroVideo.addEventListener('ended', handleEnded, { once: true });
        heroIntroVideo.addEventListener('error', handleError, { once: true });
      });
    }

    async function playIntro() {
      try {
        heroIntroVideo.currentTime = 0;
      } catch {}
      const introStarted = await playVideo(heroIntroVideo);
      if (!introStarted) return false;

      heroStage.classList.add('has-video');
      heroIntroVideo.classList.add('is-active');
      setPhase('intro');
      await leaveLoading();
      await waitForIntroEnd();
      writeSessionFlag(introPlayedKey);
      await startLoop();
      return true;
    }

    async function start() {
      heroIntroVideo.muted = true;
      heroLoopVideo.muted = true;
      heroIntroVideo.load();
      heroLoopVideo.load();

      const heroReadyPromise = preloadImage(heroImageUrl);
      const introReadyPromise = waitForVideo(heroIntroVideo);
      loopReadyPromise = waitForVideo(heroLoopVideo);

      const returningVisit = readSessionFlag(loadingShownKey) || readSessionFlag(introPlayedKey);
      if (returningVisit) {
        hideLoadingImmediately();
        await startLoop();
        return;
      }

      writeSessionFlag(loadingShownKey);
      prepareIntroView();
      moonLoading.hidden = false;
      moonLoading.removeAttribute('aria-hidden');
      moonLoading.dataset.state = 'loading';

      const minimumDisplay = sleep(reducedMotion.matches ? 300 : 900);
      const [introReady] = await Promise.all([introReadyPromise, heroReadyPromise, minimumDisplay]);

      if (introReady && await playIntro()) return;

      writeSessionFlag(introPlayedKey);
      await startLoop();
      await leaveLoading();
    }

    function setActive(nextActive) {
      if (!nextActive) {
        if (phase === 'loop') heroLoopVideo.pause();
        return;
      }
      if (phase === 'loop' && heroLoopVideo.paused) playVideo(heroLoopVideo);
    }

    return { start, setActive };
  }

  function createHeroMotion() {
    const context = heroFireflies?.getContext('2d', { alpha: true });
    if (!heroStage || !heroAtmosphere || !heroFireflies || !context) return null;

    const layerSettings = {
      far: { radius: [.45, .85], alpha: [.12, .27], speed: [.003, .008], arc: [2, 7], glow: 2 },
      middle: { radius: [.8, 1.45], alpha: [.24, .47], speed: [.005, .012], arc: [4, 11], glow: 5 },
      near: { radius: [1.45, 2.2], alpha: [.35, .62], speed: [.008, .016], arc: [6, 15], glow: 9 }
    };
    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      strength: 0,
      targetStrength: 0,
      nx: 0,
      ny: 0,
      targetNx: 0,
      targetNy: 0
    };

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let particles = [];
    let animationFrame = 0;
    let lastTime = 0;
    let lastDrawTime = 0;
    let isActive = false;
    let buttonBoost = 0;
    let buttonBoostTarget = 0;
    let buttonCenter = { x: 0, y: 0 };

    function between([minimum, maximum]) {
      return minimum + Math.random() * (maximum - minimum);
    }

    function particleCounts() {
      if (reducedMotion.matches) return { far: 6, middle: 3, near: 0 };
      if (width <= 800 || !finePointer.matches) return { far: 7, middle: 4, near: 1 };
      return { far: 12, middle: 9, near: 3 };
    }

    function createParticles() {
      const counts = particleCounts();
      particles = Object.entries(counts).flatMap(([layer, count]) => {
        const settings = layerSettings[layer];
        return Array.from({ length: count }, (_, index) => {
          const direction = (index + Math.random()) % 2 > 1 ? 1 : -1;
          return {
            layer,
            x: Math.random() * width,
            y: Math.random() * height,
            vx: between(settings.speed) * direction,
            vy: between(settings.speed) * (.35 + Math.random() * .7) * (Math.random() > .46 ? -1 : 1),
            radius: between(settings.radius),
            alpha: between(settings.alpha),
            arc: between(settings.arc),
            phase: Math.random() * Math.PI * 2,
            pulseRate: .00035 + Math.random() * .00048,
            driftRate: .00012 + Math.random() * .00024,
            pauseRate: .00006 + Math.random() * .0001,
            glow: settings.glow
          };
        });
      });

      heroFireflies.dataset.particleCount = String(particles.length);
      heroFireflies.dataset.layers = `far:${counts.far},middle:${counts.middle},near:${counts.near}`;
      heroFireflies.dataset.fpsCap = '30';
      heroAtmosphere.dataset.mode = reducedMotion.matches
        ? 'reduced'
        : width <= 800 || !finePointer.matches
          ? 'mobile'
          : 'desktop';
    }

    function resizeCanvas() {
      const rect = heroStage.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      if (nextWidth === width && nextHeight === height && particles.length) return;

      width = nextWidth;
      height = nextHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      heroFireflies.width = Math.round(width * pixelRatio);
      heroFireflies.height = Math.round(height * pixelRatio);
      heroFireflies.style.width = `${width}px`;
      heroFireflies.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      pointer.x = pointer.targetX = width / 2;
      pointer.y = pointer.targetY = height / 2;
      createParticles();
      updateButtonCenter();

      if (reducedMotion.matches || !isActive) drawParticles(0, 0, true);
    }

    function updateButtonCenter() {
      const heroRect = heroStage.getBoundingClientRect();
      const buttonRect = enterExperience.getBoundingClientRect();
      buttonCenter = {
        x: buttonRect.left - heroRect.left + buttonRect.width / 2,
        y: buttonRect.top - heroRect.top + buttonRect.height / 2
      };
    }

    function wrapParticle(particle) {
      const padding = 24;
      if (particle.x < -padding) particle.x = width + padding;
      if (particle.x > width + padding) particle.x = -padding;
      if (particle.y < -padding) particle.y = height + padding;
      if (particle.y > height + padding) particle.y = -padding;
    }

    function drawParticles(time, delta, staticFrame = false) {
      context.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        if (!staticFrame) {
          const pause = .08 + .92 * (.5 + .5 * Math.sin(time * particle.pauseRate + particle.phase));
          const activity = 1 + buttonBoost * .16;
          particle.x += particle.vx * delta * pause * activity;
          particle.y += particle.vy * delta * pause * activity;
          wrapParticle(particle);
        }

        let drawX = particle.x + Math.sin(time * particle.driftRate + particle.phase) * particle.arc;
        let drawY = particle.y + Math.cos(time * particle.driftRate * .78 + particle.phase) * particle.arc * .58;
        let localBoost = 0;

        if (pointer.strength > .01 && width > 800 && finePointer.matches && !reducedMotion.matches) {
          const dx = drawX - pointer.x;
          const dy = drawY - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          const responseRadius = particle.layer === 'near' ? 112 : particle.layer === 'middle' ? 94 : 72;
          if (distance < responseRadius) {
            const response = (1 - distance / responseRadius) * pointer.strength;
            const displacement = response * (particle.layer === 'near' ? 10 : particle.layer === 'middle' ? 7 : 3.5);
            drawX += (dx / distance) * displacement;
            drawY += (dy / distance) * displacement;
          }
        }

        if (buttonBoost > .01) {
          const buttonDistance = Math.hypot(drawX - buttonCenter.x, drawY - buttonCenter.y);
          if (buttonDistance < 210) localBoost = (1 - buttonDistance / 210) * buttonBoost;
        }

        const pulse = staticFrame ? .88 : .78 + .22 * Math.sin(time * particle.pulseRate + particle.phase);
        const alpha = Math.min(.72, particle.alpha * pulse * (1 + localBoost * .28));
        const radius = particle.radius * (1 + localBoost * .08);
        context.beginPath();
        context.arc(drawX, drawY, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(238, 218, 128, ${alpha})`;
        context.shadowColor = `rgba(218, 218, 126, ${alpha * .72})`;
        context.shadowBlur = particle.glow + localBoost * 2;
        context.fill();
      });

      context.shadowBlur = 0;
    }

    function applyParallax() {
      const nx = pointer.nx;
      const ny = pointer.ny;
      heroStage.style.setProperty('--hero-moon-x', `${(nx * 1.15).toFixed(2)}px`);
      heroStage.style.setProperty('--hero-moon-y', `${(ny * .8).toFixed(2)}px`);
      heroStage.style.setProperty('--hero-subject-x', `${(nx * 2.45).toFixed(2)}px`);
      heroStage.style.setProperty('--hero-subject-y', `${(ny * 1.65).toFixed(2)}px`);
      heroStage.style.setProperty('--hero-foreground-x', `${(nx * 4.2).toFixed(2)}px`);
      heroStage.style.setProperty('--hero-foreground-y', `${(ny * 2.8).toFixed(2)}px`);
      heroStage.style.setProperty('--hero-pointer-x', `${pointer.x.toFixed(1)}px`);
      heroStage.style.setProperty('--hero-pointer-y', `${pointer.y.toFixed(1)}px`);
      heroStage.style.setProperty('--hero-pointer-opacity', (pointer.strength * .82).toFixed(3));
    }

    function animate(time) {
      if (!isActive) return;
      const delta = Math.min(42, lastTime ? time - lastTime : 16);
      lastTime = time;
      pointer.x += (pointer.targetX - pointer.x) * .075;
      pointer.y += (pointer.targetY - pointer.y) * .075;
      pointer.nx += (pointer.targetNx - pointer.nx) * .055;
      pointer.ny += (pointer.targetNy - pointer.ny) * .055;
      pointer.strength += (pointer.targetStrength - pointer.strength) * .065;
      buttonBoost += (buttonBoostTarget - buttonBoost) * .06;
      applyParallax();
      if (!lastDrawTime || time - lastDrawTime >= 32) {
        const drawDelta = Math.min(55, lastDrawTime ? time - lastDrawTime : delta);
        drawParticles(time, drawDelta);
        lastDrawTime = time;
      }
      animationFrame = window.requestAnimationFrame(animate);
    }

    function resetParallax() {
      pointer.targetNx = 0;
      pointer.targetNy = 0;
      pointer.targetStrength = 0;
      heroStage.style.setProperty('--hero-moon-x', '0px');
      heroStage.style.setProperty('--hero-moon-y', '0px');
      heroStage.style.setProperty('--hero-subject-x', '0px');
      heroStage.style.setProperty('--hero-subject-y', '0px');
      heroStage.style.setProperty('--hero-foreground-x', '0px');
      heroStage.style.setProperty('--hero-foreground-y', '0px');
      heroStage.style.setProperty('--hero-pointer-opacity', '0');
    }

    function setActive(nextActive) {
      const shouldAnimate = Boolean(nextActive && !document.hidden && !reducedMotion.matches);
      isActive = shouldAnimate;
      heroAtmosphere.dataset.active = String(Boolean(nextActive));
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastTime = 0;
      lastDrawTime = 0;

      if (shouldAnimate) {
        updateButtonCenter();
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        buttonBoostTarget = 0;
        resetParallax();
        drawParticles(0, 0, true);
      }
    }

    function handlePointerMove(event) {
      if (width <= 800 || !finePointer.matches || reducedMotion.matches) return;
      const rect = heroStage.getBoundingClientRect();
      pointer.targetX = Math.max(0, Math.min(width, event.clientX - rect.left));
      pointer.targetY = Math.max(0, Math.min(height, event.clientY - rect.top));
      pointer.targetNx = (pointer.targetX / width - .5) * 2;
      pointer.targetNy = (pointer.targetY / height - .5) * 2;
      pointer.targetStrength = 1;
    }

    function handlePointerLeave() {
      pointer.targetX = width / 2;
      pointer.targetY = height / 2;
      pointer.targetNx = 0;
      pointer.targetNy = 0;
      pointer.targetStrength = 0;
    }

    function updateMotionPreference() {
      resizeCanvas();
      createParticles();
      setActive(state.step === 'hero');
    }

    heroStage.addEventListener('pointermove', handlePointerMove, { passive: true });
    heroStage.addEventListener('pointerleave', handlePointerLeave);
    enterExperience.addEventListener('pointerenter', () => {
      updateButtonCenter();
      buttonBoostTarget = 1;
      heroAtmosphere.dataset.buttonAwake = 'true';
    });
    enterExperience.addEventListener('pointerleave', () => {
      buttonBoostTarget = 0;
      heroAtmosphere.dataset.buttonAwake = 'false';
    });
    enterExperience.addEventListener('focus', () => {
      updateButtonCenter();
      buttonBoostTarget = 1;
    });
    enterExperience.addEventListener('blur', () => { buttonBoostTarget = 0; });
    reducedMotion.addEventListener('change', updateMotionPreference);
    finePointer.addEventListener('change', updateMotionPreference);
    document.addEventListener('visibilitychange', () => setActive(state.step === 'hero'));
    if ('ResizeObserver' in window) {
      new ResizeObserver(resizeCanvas).observe(heroStage);
    } else {
      window.addEventListener('resize', resizeCanvas, { passive: true });
    }
    resizeCanvas();

    return { setActive, resize: resizeCanvas };
  }

  function setStep(nextStep) {
    state.step = nextStep;
    experience.dataset.step = nextStep;
    stepIndicator.textContent = stepLabels[nextStep] || '';

    steps.forEach((section) => {
      const isActive = section.dataset.step === nextStep;
      section.classList.toggle('is-active', isActive);
      section.setAttribute('aria-hidden', String(!isActive));
    });

    window.scrollTo(0, 0);
    heroMotion?.setActive(nextStep === 'hero');
    heroVideoController?.setActive(nextStep === 'hero');

    if (nextStep === 'ask') {
      schedule(() => {
        if (state.step === 'ask') questionInput.focus();
      }, 320);
    }

  }

  function resetAskReturnWheelGesture() {
    askReturnWheelDistance = 0;
    if (askReturnWheelResetTimer) {
      window.clearTimeout(askReturnWheelResetTimer);
      askReturnWheelResetTimer = 0;
    }
  }

  function handleAskWheel(event) {
    if (state.step !== 'ask' || !askStep || askStep.scrollTop > 2 || event.deltaY >= 0) {
      resetAskReturnWheelGesture();
      return;
    }

    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? window.innerHeight
        : 1;

    askReturnWheelDistance += Math.abs(event.deltaY * unit);
    if (askReturnWheelResetTimer) window.clearTimeout(askReturnWheelResetTimer);
    askReturnWheelResetTimer = window.setTimeout(resetAskReturnWheelGesture, 240);

    if (askReturnWheelDistance < 56) return;

    event.preventDefault();
    resetAskReturnWheelGesture();
    questionInput.blur();
    setStep('hero');
  }

  function schedule(callback, delay, runId = state.runId) {
    const timer = window.setTimeout(() => {
      scheduled.delete(timer);
      if (runId === state.runId) callback();
    }, delay);
    scheduled.add(timer);
    return timer;
  }

  function clearScheduled() {
    scheduled.forEach((timer) => window.clearTimeout(timer));
    scheduled.clear();
  }

  function ritualDelay(delay, runId = state.runId) {
    return new Promise((resolve) => {
      window.setTimeout(() => resolve(runId === state.runId), delay);
    });
  }

  function ritualTime(normal, reduced) {
    return reducedMotion.matches ? reduced : normal;
  }

  function setDeckPhase(phase) {
    state.deckPhase = phase;
    ring.dataset.state = phase;
  }

  function layoutNoise(index, salt = 0) {
    const value = Math.sin(
      (index + 1) * 12.9898 +
      (state.runId + 1) * 78.233 +
      salt * 37.719
    ) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }

  function updateDeckHeading(mode) {
    if (mode === 'complete') {
      deckStage.classList.remove('is-choosing');
      deckEyebrow.textContent = '02 / THE CHOICE IS SEALED';
      deckTitle.textContent = '三张牌已经落定';
      deckSubtitle.innerHTML = '过去 · 现在 · 未来<span>你的选择已经完成。</span>';
      return;
    }

    const choosing = mode === 'choose';
    deckStage.classList.toggle('is-choosing', choosing);
    deckEyebrow.textContent = choosing ? '02 / FOLLOW YOUR INTUITION' : '02 / THE DECK AWAKENS';
    deckTitle.textContent = choosing ? '让直觉替你选择' : '牌阵苏醒';
    deckSubtitle.innerHTML = choosing
      ? '过去 · 现在 · 未来<span>跟随第一直觉，完成三次选择。</span>'
      : 'The cards are listening to your question.';
  }

  async function formCircularDeck(runId) {
    setDeckPhase('deck');
    deckStatus.textContent = '牌堆正在倾听你的问题…';
    ring.classList.add('is-forming', 'is-stacked');
    const buttons = [...ring.querySelectorAll('.orbit-card')];

    if (reducedMotion.matches) {
      finishCircularDeck(runId);
      return;
    }

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    schedule(() => {
      if (state.step !== 'deck' || state.spreadComplete) return;
      setDeckPhase('spreading');
      ring.classList.remove('is-stacked');
      deckStatus.textContent = '牌正在形成环形轨道…';
    }, 620, runId);

    const animations = buttons.map((button, index) => {
      const cardWidth = Number(button.dataset.width);
      const cardHeight = Number(button.dataset.height);
      const stackX = ((index % 7) - 3) * .38;
      const stackY = ((index % 9) - 4) * .18;
      const stackAngle = layoutNoise(index, 11) * 1.1;
      const stackedTransform = `translate(${-cardWidth / 2 + stackX}px, ${-cardHeight / 2 + stackY}px) rotate(${stackAngle}deg)`;
      const halfX = Number(button.dataset.x) * .48;
      const halfY = Number(button.dataset.y) * .48;
      const halfAngle = Number(button.dataset.angle) * .48;

      return button.animate([
        {
          transform: stackedTransform,
          opacity: 1
        },
        {
          transform: `translate(${halfX - cardWidth / 2}px, ${halfY - cardHeight / 2}px) rotate(${halfAngle}deg)`,
          opacity: 1,
          offset: .5
        },
        { transform: button.dataset.transform, opacity: 1 }
      ], {
        duration: 1760,
        delay: 540 + (index % 13) * 16,
        easing: 'cubic-bezier(.18,.72,.18,1)',
        fill: 'both'
      });
    });

    await Promise.race([
      Promise.all(animations.map((animation) => animation.finished.catch(() => {}))),
      new Promise((resolve) => schedule(resolve, 3600, runId))
    ]);
    animations.forEach((animation) => {
      if (animation.playState === 'finished') return;
      try {
        animation.finish();
      } catch {
        // The fallback only needs to unblock card selection if a browser pauses the timeline.
      }
    });
    if (runId === state.runId && state.step === 'deck') finishCircularDeck(runId);
  }

  function finishCircularDeck(runId) {
    if (runId !== state.runId) return;
    state.spreadComplete = true;
    setDeckPhase('idle');
    updateDeckHeading('choose');
    ring.classList.remove('is-forming', 'is-stacked');
    ring.classList.add('is-active', 'is-orbiting');
    selectedSlots.classList.add('is-active');
    updateSelectionUi();
  }

  function updateSelectionUi() {
    const selectedCount = state.selected.length;
    const complete = selectedCount === 3;

    slots.forEach((slot, index) => {
      const status = slot.querySelector('.slot-state');
      slot.classList.remove('is-current', 'is-pending', 'is-locked');

      if (index < selectedCount) {
        slot.classList.add('is-locked');
        slot.dataset.state = 'locked';
        status.textContent = '已落定';
      } else if (index === selectedCount && !complete) {
        slot.classList.add('is-current');
        slot.dataset.state = 'current';
        status.textContent = '等待选择';
      } else {
        slot.classList.add('is-pending');
        slot.dataset.state = 'pending';
        status.textContent = '尚未开始';
      }

      slot.setAttribute(
        'aria-label',
        `${positionLabels[index].en} ${positionLabels[index].zh}：${status.textContent}`
      );
    });

    if (complete) {
      deckStatus.textContent = '03 / 03 · 三张牌已经落定';
      return;
    }

    const current = positionLabels[selectedCount];
    deckStatus.textContent = `0${selectedCount + 1} / 03 · ${current.zh}正在等待`;
  }

  function cancelBackgroundMusicFade() {
    if (!backgroundMusicFadeFrame) return;
    window.cancelAnimationFrame(backgroundMusicFadeFrame);
    backgroundMusicFadeFrame = 0;
  }

  function readBackgroundMusicMuted() {
    try {
      return window.localStorage.getItem(backgroundMusicMutedKey) === 'true';
    } catch {
      return false;
    }
  }

  function writeBackgroundMusicMuted() {
    try {
      window.localStorage.setItem(backgroundMusicMutedKey, String(backgroundMusicMuted));
    } catch {}
  }

  function syncMusicToggle() {
    if (!musicToggle) return;
    const label = backgroundMusicMuted ? '开启背景音乐' : '关闭背景音乐';
    musicToggle.setAttribute('aria-pressed', String(backgroundMusicMuted));
    musicToggle.setAttribute('aria-label', label);
    musicToggle.title = label;
    musicToggle.dataset.state = backgroundMusicMuted ? 'muted' : 'audible';
  }

  function fadeBackgroundMusic(targetVolume, duration) {
    if (!backgroundMusic) return;

    cancelBackgroundMusicFade();
    const fromVolume = backgroundMusic.volume;
    const safeTarget = Math.max(0, Math.min(1, targetVolume));
    const startedAt = window.performance.now();
    const safeDuration = Math.max(1, duration);
    backgroundMusic.dataset.fadeTarget = safeTarget.toFixed(3);

    const tick = (now) => {
      const progress = Math.max(0, Math.min(1, (now - startedAt) / safeDuration));
      const eased = 1 - Math.pow(1 - progress, 3);
      backgroundMusic.volume = fromVolume + (safeTarget - fromVolume) * eased;

      if (progress < 1) {
        backgroundMusicFadeFrame = window.requestAnimationFrame(tick);
        return;
      }

      backgroundMusicFadeFrame = 0;
      backgroundMusic.volume = safeTarget;
      backgroundMusic.dataset.state = safeTarget > 0 ? 'playing' : 'silent';
    };

    backgroundMusicFadeFrame = window.requestAnimationFrame(tick);
  }

  function startBackgroundMusic(fadeDuration = 4800) {
    if (!backgroundMusic) return Promise.resolve(false);
    if (backgroundMusicMuted) {
      backgroundMusic.dataset.state = 'muted';
      return Promise.resolve(false);
    }

    if (!backgroundMusic.paused) {
      backgroundMusicStarted = true;
      fadeBackgroundMusic(backgroundMusicTargetVolume, fadeDuration);
      return Promise.resolve(true);
    }

    if (backgroundMusicStartPromise) return backgroundMusicStartPromise;

    window.clearTimeout(backgroundMusicPauseTimer);
    backgroundMusic.volume = 0;
    backgroundMusic.dataset.state = 'starting';
    const playAttempt = backgroundMusic.play();

    if (!playAttempt) {
      backgroundMusicStarted = true;
      fadeBackgroundMusic(backgroundMusicTargetVolume, fadeDuration);
      return Promise.resolve(true);
    }

    backgroundMusicStartPromise = playAttempt.then(() => {
      backgroundMusicStarted = true;
      backgroundMusic.dataset.state = 'fading-in';
      fadeBackgroundMusic(backgroundMusicTargetVolume, fadeDuration);
      return true;
    }).catch(() => {
      backgroundMusic.dataset.state = 'awaiting-interaction';
      return false;
    }).finally(() => {
      backgroundMusicStartPromise = null;
    });

    return backgroundMusicStartPromise;
  }

  function unlockBackgroundMusic() {
    if (!backgroundMusic || (backgroundMusicStarted && !backgroundMusic.paused)) return;
    startBackgroundMusic(3200);
  }

  function handleBackgroundMusicVisibility() {
    if (!backgroundMusic) return;

    window.clearTimeout(backgroundMusicPauseTimer);
    if (document.hidden) {
      fadeBackgroundMusic(0, 500);
      backgroundMusicPauseTimer = window.setTimeout(() => {
        if (!document.hidden) return;
        backgroundMusic.pause();
        backgroundMusic.dataset.state = 'paused';
      }, 560);
      return;
    }

    if (!backgroundMusicMuted) startBackgroundMusic(1400);
  }

  function toggleBackgroundMusic() {
    if (!backgroundMusic) return;

    backgroundMusicMuted = !backgroundMusicMuted;
    writeBackgroundMusicMuted();
    syncMusicToggle();
    window.clearTimeout(backgroundMusicPauseTimer);

    if (backgroundMusicMuted) {
      fadeBackgroundMusic(0, 520);
      backgroundMusicPauseTimer = window.setTimeout(() => {
        if (!backgroundMusicMuted) return;
        backgroundMusic.pause();
        backgroundMusic.dataset.state = 'muted';
      }, 580);
      return;
    }

    backgroundMusicStarted = false;
    startBackgroundMusic(1800);
  }

  function unlockCardHoverSound() {
    if (!cardHoverSound || cardHoverSoundUnlocked) return;

    const previousVolume = cardHoverSound.volume;
    cardHoverSound.volume = 0;
    const playAttempt = cardHoverSound.play();

    if (!playAttempt) return;
    playAttempt.then(() => {
      cardHoverSound.pause();
      cardHoverSound.currentTime = 0;
      cardHoverSound.volume = previousVolume;
      cardHoverSoundUnlocked = true;
      ring.dataset.hoverSoundState = 'ready';
    }).catch(() => {
      cardHoverSound.volume = previousVolume;
    });
  }

  function playCardHoverSound(button, event) {
    if (
      !cardHoverSound ||
      !finePointer.matches ||
      event.pointerType === 'touch' ||
      state.step !== 'deck' ||
      !state.spreadComplete ||
      state.isPicking ||
      button.disabled ||
      button.dataset.state !== 'deck'
    ) return;

    const now = window.performance.now();
    if (now - lastCardHoverSoundAt < 90) return;
    lastCardHoverSoundAt = now;

    cardHoverSound.pause();
    cardHoverSound.currentTime = 0;
    cardHoverSound.volume = .22;
    cardHoverSound.playbackRate = .96 + Math.random() * .08;
    cardHoverSound.play().then(() => {
      cardHoverSoundCount += 1;
      ring.dataset.hoverSoundState = 'playing';
      ring.dataset.hoverSoundCount = String(cardHoverSoundCount);
      ring.dataset.hoverSoundCard = button.dataset.cardId;
    }).catch(() => {
      ring.dataset.hoverSoundState = 'blocked';
    });
  }

  function holdSettledSelection(position) {
    slots.forEach((slot, index) => {
      const status = slot.querySelector('.slot-state');
      slot.classList.remove('is-current', 'is-pending', 'is-locked');

      if (index <= position) {
        slot.classList.add('is-locked');
        slot.dataset.state = 'locked';
        status.textContent = '已落定';
      } else {
        slot.classList.add('is-pending');
        slot.dataset.state = 'pending';
        status.textContent = '尚未开始';
      }

      slot.setAttribute(
        'aria-label',
        `${positionLabels[index].en} ${positionLabels[index].zh}：${status.textContent}`
      );
    });

    deckStatus.textContent = `0${position + 1} / 03 · ${positionLabels[position].zh}已落定`;
  }

  function clearRingFocus() {
    activeHoverCard = null;
    ring.classList.remove('is-exploring');
    ring.querySelectorAll('.orbit-card').forEach((button) => {
      button.classList.remove('is-focused');
      button.style.removeProperty('--neighbor-x');
      button.style.removeProperty('--neighbor-y');
      button.style.removeProperty('--focus-x');
      button.style.removeProperty('--focus-y');
      button.style.removeProperty('--pointer-tilt');
      button.style.zIndex = button.dataset.baseZ;
      if (button.dataset.state === 'hover') button.dataset.state = 'deck';
    });
    if (state.deckPhase === 'focus') setDeckPhase('idle');
  }

  function setRingFocus(button) {
    if (
      state.step !== 'deck' ||
      !state.spreadComplete ||
      state.isPicking ||
      button.disabled ||
      button.dataset.state !== 'deck'
    ) return;

    clearRingFocus();
    activeHoverCard = button;
    const buttons = [...ring.querySelectorAll('.orbit-card')];
    const hoverIndex = Number(button.dataset.index);
    const compact = window.innerWidth <= 800;
    const focusDistance = compact ? 7 : 11;
    const maxShift = compact ? 4 : 7;
    const focusAngle = Number(button.dataset.orbitAngle) * Math.PI / 180;

    ring.classList.add('is-exploring');
    setDeckPhase('focus');
    button.classList.add('is-focused');
    button.dataset.state = 'hover';
    button.style.zIndex = '2200';
    button.style.setProperty('--focus-x', `${(Math.cos(focusAngle) * focusDistance).toFixed(2)}px`);
    button.style.setProperty('--focus-y', `${(Math.sin(focusAngle) * focusDistance).toFixed(2)}px`);

    buttons.forEach((other) => {
      if (other === button || other.disabled) return;
      let distance = Number(other.dataset.index) - hoverIndex;
      if (distance > buttons.length / 2) distance -= buttons.length;
      if (distance < -buttons.length / 2) distance += buttons.length;
      const absoluteDistance = Math.abs(distance);
      if (!absoluteDistance || absoluteDistance > 5) return;
      const strength = (6 - absoluteDistance) / 5;
      const shift = Math.sign(distance) * maxShift * strength;
      const angle = Number(other.dataset.orbitAngle) * Math.PI / 180;
      other.style.setProperty('--neighbor-x', `${(-Math.sin(angle) * shift).toFixed(2)}px`);
      other.style.setProperty('--neighbor-y', `${(Math.cos(angle) * shift).toFixed(2)}px`);
    });
  }

  function updateHoverTilt(event, button) {
    if (button !== activeHoverCard || button.dataset.state !== 'hover') return;
    const rect = button.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    button.style.setProperty('--pointer-tilt', `${((ratio - .5) * 2).toFixed(2)}deg`);
  }

  function buildCircularDeck() {
    ring.innerHTML = '';
    const compact = window.innerWidth <= 800;
    const lowHeight = window.innerHeight <= 720 && !compact;
    const cardWidth = compact ? 52 : (lowHeight ? 74 : 82);
    const cardHeight = compact ? 93 : (lowHeight ? 132 : 146);
    const baseRadius = compact
      ? Math.min(window.innerWidth * .34, window.innerHeight * .23)
      : Math.min(window.innerWidth * .235, window.innerHeight * .3);
    const angleStep = 360 / state.deck.length;

    state.deck.forEach((card, index) => {
      const button = document.createElement('button');
      button.className = 'orbit-card';
      button.type = 'button';
      button.title = '跟随直觉选择这张牌';
      button.setAttribute('aria-label', `选择第 ${index + 1} 张牌，共 78 张`);

      const orbitAngle = -90 + index * angleStep + layoutNoise(index, 1) * .82;
      const angleInRadians = orbitAngle * Math.PI / 180;
      const radius = baseRadius + layoutNoise(index, 2) * (compact ? 2.6 : 5.2);
      const x = radius * Math.cos(angleInRadians);
      const y = radius * Math.sin(angleInRadians);
      const rotation = orbitAngle + 90 + layoutNoise(index, 3) * 1.1;
      const depth = 700 + Math.round((Math.sin(angleInRadians) + 1) * 180) + Math.round(layoutNoise(index, 4) * 7);

      const finalTransform = `translate(${x - cardWidth / 2}px, ${y - cardHeight / 2}px) rotate(${rotation}deg)`;
      button.style.transform = finalTransform;
      button.style.zIndex = String(depth);
      button.style.setProperty('--breath-delay', `${(index % 13) * -0.17}s`);
      button.dataset.cardId = String(card.id);
      button.dataset.index = String(index);
      button.dataset.angle = rotation.toFixed(3);
      button.dataset.orbitAngle = orbitAngle.toFixed(3);
      button.dataset.radius = radius.toFixed(3);
      button.dataset.position = `${x.toFixed(2)},${y.toFixed(2)}`;
      button.dataset.x = x.toFixed(3);
      button.dataset.y = y.toFixed(3);
      button.dataset.depth = String(depth);
      button.dataset.state = 'deck';
      button.dataset.baseZ = String(depth);
      button.dataset.transform = finalTransform;
      button.dataset.width = String(cardWidth);
      button.dataset.height = String(cardHeight);

      if (state.selected.some((selectedCard) => selectedCard.id === card.id)) {
        button.classList.add('is-picked');
        button.disabled = true;
        button.dataset.state = 'placed';
      } else if (state.selected.length >= 3) {
        button.disabled = true;
        button.dataset.state = 'locked';
      }

      const surface = document.createElement('span');
      surface.className = 'orbit-card-surface';
      surface.setAttribute('aria-hidden', 'true');
      button.appendChild(surface);
      button.addEventListener('pointerenter', (event) => {
        playCardHoverSound(button, event);
        setRingFocus(button);
      });
      button.addEventListener('pointermove', (event) => updateHoverTilt(event, button));
      button.addEventListener('pointerleave', () => {
        if (activeHoverCard === button) clearRingFocus();
      });
      button.addEventListener('focus', () => setRingFocus(button));
      button.addEventListener('blur', () => {
        if (activeHoverCard === button) clearRingFocus();
      });
      button.addEventListener('pointerdown', (event) => {
        if (event.isPrimary && event.button === 0) {
          event.preventDefault();
          pickCard(card, button);
        }
      });
      button.addEventListener('click', (event) => {
        if (event.detail === 0) pickCard(card, button);
      });
      ring.appendChild(button);
    });
  }

  function animateCardToSlot(button, slot) {
    const sourceRect = button.getBoundingClientRect();
    const target = slot.querySelector('.slot-card');
    const targetRect = target.getBoundingClientRect();
    const width = button.offsetWidth;
    const height = button.offsetHeight;
    const startLeft = sourceRect.left + (sourceRect.width - width) / 2;
    const startTop = sourceRect.top + (sourceRect.height - height) / 2;
    const startCenterX = startLeft + width / 2;
    const startCenterY = startTop + height / 2;
    const ringRect = ring.getBoundingClientRect();
    const centerX = ringRect.left;
    const centerY = ringRect.top;
    const radialLength = Math.max(1, Math.hypot(startCenterX - centerX, startCenterY - centerY));
    const outwardX = (startCenterX - centerX) / radialLength * 22;
    const outwardY = (startCenterY - centerY) / radialLength * 22;
    const centerDeltaX = centerX - startCenterX;
    const centerDeltaY = centerY - startCenterY;
    const deltaX = targetRect.left + targetRect.width / 2 - (startLeft + width / 2);
    const deltaY = targetRect.top + targetRect.height / 2 - (startTop + height / 2);
    const scale = Math.min(targetRect.width / width, targetRect.height / height);
    const sourceAngle = Number(button.dataset.angle) || 0;
    const flyingCard = document.createElement('div');

    flyingCard.className = 'orbit-flying-card';
    flyingCard.style.left = `${startLeft}px`;
    flyingCard.style.top = `${startTop}px`;
    flyingCard.style.width = `${width}px`;
    flyingCard.style.height = `${height}px`;
    document.body.appendChild(flyingCard);
    slot.classList.add('is-receiving');
    clearRingFocus();
    button.classList.remove('is-confirming');
    button.classList.add('is-picked');

    if (!flyingCard.animate || reducedMotion.matches) {
      flyingCard.remove();
      slot.classList.remove('is-receiving');
      return Promise.resolve();
    }

    const movement = flyingCard.animate([
      {
        transform: `translate(0, 0) scale(1) rotate(${sourceAngle}deg)`,
        filter: 'brightness(1.04)',
        opacity: 1
      },
      {
        transform: `translate(0, 0) scale(1.035) rotate(${sourceAngle * .92}deg)`,
        filter: 'brightness(1.08)',
        opacity: 1,
        offset: .2
      },
      {
        transform: `translate(${outwardX}px, ${outwardY}px) scale(1.11) rotate(${sourceAngle * .62}deg)`,
        filter: 'brightness(1.1) drop-shadow(0 10px 18px rgba(0, 0, 0, .34))',
        opacity: 1,
        offset: .47
      },
      {
        transform: `translate(${centerDeltaX}px, ${centerDeltaY}px) scale(1.14) rotate(0deg)`,
        filter: 'brightness(1.14) drop-shadow(0 0 12px rgba(224, 197, 142, .2))',
        opacity: 1,
        offset: .68
      },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scale}) rotate(0deg)`,
        filter: 'brightness(1)',
        opacity: 1
      }
    ], {
      duration: 980,
      easing: 'cubic-bezier(.24,.66,.18,1)',
      fill: 'forwards'
    });

    return Promise.race([
      movement.finished.catch(() => {}),
      new Promise((resolve) => window.setTimeout(resolve, 1320))
    ]).finally(() => {
      try {
        movement.cancel();
      } catch {}
      flyingCard.remove();
      slot.classList.remove('is-receiving');
    });
  }

  async function pickCard(card, button) {
    if (
      state.step !== 'deck' ||
      !state.spreadComplete ||
      state.isPicking ||
      state.selected.length >= 3 ||
      state.selected.some((selectedCard) => selectedCard.id === card.id)
    ) return;

    state.isPicking = true;
    const runId = state.runId;
    const position = state.selected.length;
    const slot = slots[position];
    state.selected.push(card);
    button.dataset.state = 'selected';
    button.disabled = true;
    clearRingFocus();
    button.classList.add('is-confirming');
    ring.classList.add('is-committing');
    ring.classList.remove('is-orbiting');
    setDeckPhase('pick');
    schedule(() => {
      if (state.isPicking && state.step === 'deck') setDeckPhase('center');
    }, reducedMotion.matches ? 30 : 900, runId);
    selectedSlots.classList.add('is-active');
    deckStatus.textContent = `0${position + 1} / 03 · 心念已定`;
    slot.querySelector('.slot-state').textContent = '正在回应';

    const held = await ritualDelay(ritualTime(180, 40), runId);
    if (!held) return;
    ring.classList.remove('is-committing');
    ring.classList.add('is-drawing');
    deckStatus.textContent = `0${position + 1} / 03 · ${positionLabels[position].zh}正在回应…`;
    slot.querySelector('.slot-state').textContent = '正在回应';

    await animateCardToSlot(button, slot);
    if (runId !== state.runId) return;

    button.dataset.state = 'placed';
    button.dataset.position = positionLabels[position].en.toLowerCase();
    slot.classList.add('is-filled');
    slot.dataset.cardId = String(card.id);
    setDeckPhase('settling');
    ring.classList.remove('is-drawing');
    ring.classList.add('is-settling');
    holdSettledSelection(position);

    if (state.selected.length < 3) {
      const settled = await ritualDelay(ritualTime(430, 120), runId);
      if (!settled) return;
      ring.classList.remove('is-settling');
      updateSelectionUi();
      state.isPicking = false;
      setDeckPhase('idle');
      ring.classList.add('is-orbiting');
      return;
    }

    deckStatus.textContent = '03 / 03 · 三张选择正在安静落定…';
    const thirdSettled = await ritualDelay(ritualTime(900, 220), runId);
    if (!thirdSettled) return;

    ring.querySelectorAll('.orbit-card:not(:disabled)').forEach((remainingCard) => {
      remainingCard.disabled = true;
      remainingCard.dataset.state = 'locked';
    });
    setDeckPhase('retreating');
    ring.classList.remove('is-settling', 'is-orbiting');
    ring.classList.add('is-locked', 'is-retreating');
    deckStatus.textContent = '余下的牌正在退回月夜…';

    const retreated = await ritualDelay(ritualTime(680, 140), runId);
    if (!retreated) return;
    ring.classList.remove('is-retreating');
    ring.classList.add('is-selection-complete');
    updateDeckHeading('complete');
    selectedSlots.classList.add('is-complete');
    deckStage.classList.add('is-complete');
    deckCompletion.hidden = false;
    deckCompletion.classList.remove('is-ready');
    revealCards.disabled = true;
    deckStatus.textContent = '03 / 03 · 三张牌已经落定';

    const revealReady = await ritualDelay(ritualTime(420, 140), runId);
    if (!revealReady) return;
    state.isPicking = false;
    state.readyToReveal = true;
    deckCompletion.classList.add('is-ready');
    revealCards.disabled = false;
  }

  function createFallbackFace(card, compact = false) {
    const face = document.createElement('div');
    face.className = compact ? 'fallback-face fallback-face-small' : 'fallback-face';
    const symbol = card.arcana === 'major' ? '☾' : (card.fallbackSymbol || '✦');
    face.innerHTML = `<div class="symbol">${symbol}</div><h4>${card.nameEn}</h4><p>${card.nameZh}<br>${(card.keywordsZh || []).join(' · ')}</p>`;
    return face;
  }

  function createCardFront(card, compact = false) {
    if (!card.image) return createFallbackFace(card, compact);

    const image = document.createElement('img');
    image.src = card.image;
    image.alt = `${card.nameEn} ${card.nameZh}`;
    image.addEventListener('error', () => image.replaceWith(createFallbackFace(card, compact)), { once: true });
    return image;
  }

  function renderReveal() {
    revealGrid.innerHTML = '';
    state.selected.forEach((card, index) => {
      const item = document.createElement('article');
      item.className = 'reveal-item is-waiting';
      item.dataset.position = positionLabels[index].en.toLowerCase();
      item.dataset.index = String(index);
      item.dataset.state = 'placed';

      const position = document.createElement('div');
      position.className = 'position-label';
      position.innerHTML = `<b>${positionLabels[index].en}</b><span>${positionLabels[index].zh}</span>`;

      const flip = document.createElement('div');
      flip.className = 'flip-card';
      flip.dataset.cardId = String(card.id);
      flip.dataset.state = 'placed';
      const inner = document.createElement('div');
      inner.className = 'flip-inner';
      const back = document.createElement('div');
      back.className = 'flip-face flip-back';
      const front = document.createElement('div');
      front.className = 'flip-face flip-front';
      front.appendChild(createCardFront(card));
      inner.append(back, front);
      flip.appendChild(inner);

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.innerHTML = `<h3>${card.nameEn}</h3><p>${card.nameZh}</p><small>${(card.keywordsZh || []).join(' · ')}</small>`;

      item.append(position, flip, meta);
      revealGrid.appendChild(item);
    });
  }

  function revealChapter(item, index) {
    if (!item || index !== state.revealedCount || item.dataset.state === 'revealed') return;
    const items = [...revealGrid.querySelectorAll('.reveal-item')];
    items.forEach((candidate, candidateIndex) => {
      candidate.classList.toggle('is-current', candidateIndex === index);
      candidate.classList.toggle('is-settled', candidateIndex < index);
      candidate.classList.toggle('is-waiting', candidateIndex > index);
    });
    const flip = item.querySelector('.flip-card');
    flip.classList.add('is-flipped');
    flip.dataset.state = 'revealed';
    item.dataset.state = 'revealed';
    item.classList.add('is-revealed');
    state.revealedCount += 1;

    revealStatus.textContent = `${positionLabels[index].en} / ${positionLabels[index].zh}，正在显现。`;
  }

  async function runRevealSequence(items, runId) {
    const firstReady = await ritualDelay(ritualTime(320, 80), runId);
    if (!firstReady || state.step !== 'reveal') return;
    revealChapter(items[0], 0);

    const presentReady = await ritualDelay(ritualTime(1850, 340), runId);
    if (!presentReady || state.step !== 'reveal') return;
    revealChapter(items[1], 1);

    const futureReady = await ritualDelay(ritualTime(2020, 400), runId);
    if (!futureReady || state.step !== 'reveal') return;
    revealChapter(items[2], 2);

    const completeReady = await ritualDelay(ritualTime(2200, 480), runId);
    if (!completeReady || state.step !== 'reveal') return;
    items.forEach((item) => {
      item.classList.remove('is-current', 'is-waiting');
      item.classList.add('is-settled', 'is-complete');
    });
    revealGrid.classList.add('is-complete');
    revealStatus.textContent = '过去 · 现在 · 未来已经完整显现。';
    state.revealInProgress = false;
    showReading.hidden = false;
    showReading.disabled = false;
  }

  function openReveal(runId) {
    if (runId !== state.runId || state.selected.length !== 3 || state.step !== 'deck') return;
    setDeckPhase('reveal');
    renderReveal();
    revealQuestion.textContent = `“${state.question}”`;
    revealStatus.textContent = '请保持安静，牌面即将显现。';
    state.revealedCount = 0;
    setStep('reveal');
    revealStep.scrollTop = 0;
    const items = [...revealGrid.querySelectorAll('.reveal-item')];
    runRevealSequence(items, runId);
  }

  function beginReveal() {
    if (
      !state.readyToReveal ||
      state.revealInProgress ||
      state.selected.length !== 3 ||
      state.step !== 'deck'
    ) return;
    const runId = state.runId;
    state.readyToReveal = false;
    state.revealInProgress = true;
    revealCards.disabled = true;
    deckCompletion.classList.add('is-activating');
    deckStatus.textContent = '请保持安静，答案即将显现…';
    openReveal(runId);
  }

  function createResultCard(reading, index) {
    const { card, position, text } = reading;
    const article = document.createElement('article');
    article.className = 'result-card';

    const heading = document.createElement('div');
    heading.className = 'result-card-heading';
    const visual = document.createElement('div');
    visual.className = 'result-card-visual';
    visual.appendChild(createCardFront(card, true));

    const copy = document.createElement('div');
    copy.className = 'result-card-copy';
    const positionLabel = document.createElement('small');
    positionLabel.textContent = `${position.en} / ${position.zh}`;
    const englishName = document.createElement('h3');
    englishName.textContent = card.nameEn;
    const chineseName = document.createElement('p');
    chineseName.textContent = `${card.nameZh} · ${(card.keywordsZh || []).join(' · ')}`;
    copy.append(positionLabel, englishName, chineseName);
    heading.append(visual, copy);

    const explanation = document.createElement('p');
    explanation.className = 'result-card-reading';
    explanation.textContent = text;
    article.append(heading, explanation);
    return article;
  }

  function renderList(list, items) {
    list.innerHTML = '';
    items.forEach((item) => {
      const entry = document.createElement('li');
      entry.textContent = item;
      list.appendChild(entry);
    });
  }

  function buildFallbackReading() {
    const cardReadings = state.selected.map((card, index) => ({
      card,
      position: positionLabels[index],
      text: `${card.nameZh}落在${positionLabels[index].zh}，提醒你从“${(card.keywordsZh || []).join('、')}”这些线索重新观察问题。它不是固定结果，而是一种可以继续核对的方向。`
    }));
    return {
      theme: `关于“${state.question}”，三张牌更像是在邀请你依次回看已有经验、当下选择与可能方向。先从现在能够确认的事实开始，再决定下一步，不必把任何趋势理解为唯一答案。`,
      cardReadings,
      relationshipDetails: {
        structure: '三张牌共同构成过去、现在与未来的连续线索。',
        elementFlow: '元素资料暂时不可用，仍可从三张牌的位置变化观察整体节奏。',
        core: `${state.selected[1].nameZh}位于现在，是这组牌最适合先回应的节点。`,
        connection: '过去影响现在，而现在采取的回应会为未来保留不同可能。'
      },
      advice: {
        suitable: ['从眼前可确认的事实开始', '选择一项能够验证的小行动', '为决定保留复盘空间'],
        cautions: ['把趋势理解成固定结局', '在信息不足时急于下定论', '忽略自己真实的感受与边界']
      },
      closingMessage: '答案不必一次完成。先让此刻最清楚的那一步，在现实里发生。'
    };
  }

  function showResult() {
    if (state.selected.length !== 3 || state.revealedCount !== 3 || state.revealInProgress) return;
    const engine = window.MoonWhisperReading;
    const analysis = engine?.analyzeSpread
      ? engine.analyzeSpread(state.selected, engine.classifyQuestion(state.question))
      : buildFallbackReading();

    resultQuestion.textContent = state.question;
    readingTheme.textContent = analysis.theme;
    resultCards.innerHTML = '';
    analysis.cardReadings.forEach((reading, index) => resultCards.appendChild(createResultCard(reading, index)));
    relationshipStructure.textContent = analysis.relationshipDetails.structure;
    relationshipElements.textContent = analysis.relationshipDetails.elementFlow;
    relationshipCore.textContent = analysis.relationshipDetails.core;
    relationshipText.textContent = analysis.relationshipDetails.connection;
    renderList(suitableActions, analysis.advice.suitable);
    renderList(cautionActions, analysis.advice.cautions);
    whisperText.textContent = analysis.closingMessage;
    setStep('result');
    resultStep.scrollTop = 0;
  }

  function resetReadingUi() {
    clearRingFocus();
    ring.classList.remove(
      'is-active',
      'is-forming',
      'is-stacked',
      'is-drawing',
      'is-committing',
      'is-settling',
      'is-retreating',
      'is-exploring',
      'is-locked',
      'is-selection-complete',
      'is-orbiting'
    );
    ring.innerHTML = '';
    setDeckPhase('deck');
    selectedSlots.classList.remove('is-active', 'is-complete');
    deckStage.classList.remove('is-complete');
    deckCompletion.hidden = true;
    deckCompletion.classList.remove('is-activating', 'is-ready');
    revealCards.disabled = true;
    slots.forEach((slot, index) => {
      slot.classList.remove('is-filled', 'is-receiving', 'is-current', 'is-pending', 'is-locked');
      delete slot.dataset.cardId;
      delete slot.dataset.state;
      const status = slot.querySelector('.slot-state');
      status.textContent = index === 0 ? '等待选择' : '尚未开始';
      slot.removeAttribute('aria-label');
    });
    revealGrid.innerHTML = '';
    revealGrid.classList.remove('is-complete');
    revealStep.scrollTop = 0;
    showReading.hidden = true;
    showReading.disabled = true;
    resultCards.innerHTML = '';
    readingTheme.textContent = '';
    relationshipStructure.textContent = '';
    relationshipElements.textContent = '';
    relationshipCore.textContent = '';
    relationshipText.textContent = '';
    suitableActions.innerHTML = '';
    cautionActions.innerHTML = '';
    revealStatus.textContent = '三张牌将依次揭示。';
    whisperText.textContent = '';
    updateDeckHeading('awaken');
  }

  function startReading(question) {
    state.runId += 1;
    clearScheduled();
    state.question = question;
    state.deck = shuffle(cards);
    state.selected = [];
    state.deckPhase = 'deck';
    state.spreadComplete = false;
    state.isPicking = false;
    state.readyToReveal = false;
    state.revealInProgress = false;
    state.revealedCount = 0;
    resetReadingUi();
    buildCircularDeck();

    deckQuestion.textContent = `“${question}”`;
    deckStatus.textContent = '正在唤醒牌阵…';
    setStep('deck');
    formCircularDeck(state.runId);
  }

  function resetToAsk() {
    state.runId += 1;
    clearScheduled();
    state.question = '';
    state.deck = [];
    state.selected = [];
    state.deckPhase = 'deck';
    state.spreadComplete = false;
    state.isPicking = false;
    state.readyToReveal = false;
    state.revealInProgress = false;
    state.revealedCount = 0;
    resetReadingUi();

    questionInput.value = '';
    questionCount.textContent = '0 / 240';
    questionError.textContent = '';
    beginReadingButton.disabled = true;
    setStep('ask');
  }

  document.addEventListener('pointerdown', unlockBackgroundMusic, { capture: true });
  document.addEventListener('click', unlockBackgroundMusic, { capture: true });
  document.addEventListener('keydown', unlockBackgroundMusic, { capture: true });
  document.addEventListener('visibilitychange', handleBackgroundMusicVisibility);
  musicToggle?.addEventListener('click', toggleBackgroundMusic);
  document.addEventListener('pointerdown', unlockCardHoverSound, { capture: true });
  document.addEventListener('keydown', unlockCardHoverSound, { capture: true });
  askStep?.addEventListener('wheel', handleAskWheel, { passive: false });
  enterExperience.addEventListener('click', () => setStep('ask'));

  questionInput.addEventListener('input', () => {
    const value = questionInput.value;
    questionCount.textContent = `${value.length} / 240`;
    beginReadingButton.disabled = !value.trim();
    if (value.trim()) questionError.textContent = '';
  });

  questionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = questionInput.value.trim();
    if (!question) {
      questionError.textContent = '请先写下你想问月亮的问题。';
      questionInput.focus();
      return;
    }
    startReading(question);
  });

  drawAgain.addEventListener('click', resetToAsk);
  revealCards.addEventListener('click', beginReveal);
  showReading.addEventListener('click', showResult);

  window.addEventListener('resize', () => {
    if (
      state.step !== 'deck' ||
      !state.spreadComplete ||
      !state.deck.length ||
      state.isPicking
    ) return;
    buildCircularDeck();
    ring.classList.add('is-active');
    if (state.readyToReveal || state.selected.length === 3) {
      ring.classList.add('is-locked', 'is-selection-complete');
      ring.classList.remove('is-orbiting');
    } else {
      ring.classList.add('is-orbiting');
    }
    updateSelectionUi();
  });

  if (cards.length !== 78) {
    questionError.textContent = `牌库数据异常：当前读取到 ${cards.length} 张牌。`;
    enterExperience.disabled = true;
  }

  heroMotion = createHeroMotion();
  heroVideoController = createHeroVideoController();
  if (backgroundMusic) {
    backgroundMusic.volume = 0;
    backgroundMusic.dataset.targetVolume = backgroundMusicTargetVolume.toFixed(3);
    backgroundMusic.load();
    syncMusicToggle();
    if (backgroundMusicMuted) {
      backgroundMusic.dataset.state = 'muted';
    } else {
      startBackgroundMusic();
    }
  }
  setStep('hero');
  heroVideoController.start()?.catch(() => {
    writeSessionFlag(loadingShownKey);
    writeSessionFlag(introPlayedKey);
    heroIntroVideo?.pause();
    heroLoopVideo?.pause();
    heroIntroVideo?.classList.remove('is-active');
    heroLoopVideo?.classList.remove('is-active');
    heroStage?.classList.remove('has-video');
    if (heroStage) heroStage.dataset.videoPhase = 'fallback';
    document.documentElement.dataset.homeMediaState = 'fallback';
    document.body.classList.remove('is-intro-playing');
    if (moonLoading) {
      moonLoading.hidden = true;
      moonLoading.setAttribute('aria-hidden', 'true');
      moonLoading.dataset.state = 'failed';
    }
  });
})();
