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
  const enterExperience = document.getElementById('enterExperience');
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
  const resultQuestion = document.getElementById('resultQuestion');
  const resultCards = document.getElementById('resultCards');
  const whisperText = document.getElementById('whisperText');
  const drawAgain = document.getElementById('drawAgain');

  const scheduled = new Set();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeHoverCard = null;
  let revealObserver = null;

  const state = {
    step: 'hero',
    question: '',
    deck: [],
    selected: [],
    deckPhase: 'deck',
    spreadComplete: false,
    isPicking: false,
    readyToReveal: false,
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

    if (nextStep === 'ask') {
      schedule(() => questionInput.focus(), 320);
    }

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
      deckSubtitle.textContent = 'Past · Present · Future｜你的选择已经完成。';
      return;
    }

    const choosing = mode === 'choose';
    deckStage.classList.toggle('is-choosing', choosing);
    deckEyebrow.textContent = choosing ? '02 / FOLLOW YOUR INTUITION' : '02 / THE DECK AWAKENS';
    deckTitle.textContent = choosing ? 'Choose Three Cards' : '牌阵苏醒';
    deckSubtitle.textContent = choosing
      ? 'Past · Present · Future｜跟随直觉，选择三张牌。'
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
        status.textContent = '✓ 已选择';
      } else if (index === selectedCount && !complete) {
        slot.classList.add('is-current');
        slot.dataset.state = 'current';
        status.textContent = '等待选择';
      } else {
        slot.classList.add('is-pending');
        slot.dataset.state = 'pending';
        status.textContent = '未开始';
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
    const settled = selectedCount > 0
      ? ` · ${positionLabels[selectedCount - 1].zh}已落定`
      : ' · 跟随直觉选择一张牌';
    deckStatus.textContent = `0${selectedCount + 1} / 03 · 当前目标：${current.zh}${settled}`;
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
      button.addEventListener('pointerenter', () => setRingFocus(button));
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
    button.classList.add('is-picked');

    if (!flyingCard.animate || reducedMotion.matches) {
      flyingCard.remove();
      slot.classList.remove('is-receiving');
      return Promise.resolve();
    }

    return flyingCard.animate([
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
      duration: 1180,
      easing: 'cubic-bezier(.2,.74,.18,1)',
      fill: 'forwards'
    }).finished.catch(() => {}).finally(() => {
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
    setDeckPhase('pick');
    schedule(() => {
      if (state.isPicking && state.step === 'deck') setDeckPhase('center');
    }, reducedMotion.matches ? 30 : 900, runId);
    selectedSlots.classList.add('is-active');
    ring.classList.add('is-drawing');
    ring.classList.remove('is-orbiting');
    deckStatus.textContent = `0${position + 1} / 03 · ${positionLabels[position].zh}正在落位…`;
    slot.querySelector('.slot-state').textContent = '正在落位';

    await animateCardToSlot(button, slot);
    if (runId !== state.runId) return;

    button.dataset.state = 'placed';
    button.dataset.position = positionLabels[position].en.toLowerCase();
    slot.classList.add('is-filled');
    slot.dataset.cardId = String(card.id);
    setDeckPhase('placed');
    ring.classList.remove('is-drawing');
    updateSelectionUi();

    if (state.selected.length < 3) {
      state.isPicking = false;
      setDeckPhase('idle');
      ring.classList.add('is-orbiting');
      return;
    }

    state.isPicking = false;
    state.readyToReveal = true;
    ring.querySelectorAll('.orbit-card:not(:disabled)').forEach((remainingCard) => {
      remainingCard.disabled = true;
      remainingCard.dataset.state = 'locked';
    });
    ring.classList.add('is-locked', 'is-selection-complete');
    ring.classList.remove('is-orbiting');
    updateDeckHeading('complete');
    selectedSlots.classList.add('is-complete');
    deckStage.classList.add('is-complete');
    deckCompletion.hidden = false;
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

      const cue = document.createElement('p');
      cue.className = 'reveal-chapter-cue';
      cue.textContent = index < 2
        ? `SCROLL FOR ${positionLabels[index + 1].en} · 继续滚动`
        : 'THE THREE CARDS HAVE SPOKEN · 三张牌已经显现';
      meta.appendChild(cue);

      if (index === 2) {
        const resultButton = document.createElement('button');
        resultButton.type = 'button';
        resultButton.className = 'gold-button reveal-result-button';
        resultButton.innerHTML = 'VIEW THE READING <span>查看月亮的解读</span>';
        resultButton.hidden = true;
        resultButton.addEventListener('click', showResult);
        meta.appendChild(resultButton);
      }

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

    const next = positionLabels[index + 1];
    revealStatus.textContent = next
      ? `继续滚动，揭示 ${next.en} / ${next.zh}`
      : '三张牌已经全部显现。';

    if (index === 2) {
      const resultButton = item.querySelector('.reveal-result-button');
      resultButton.hidden = false;
    }
  }

  function openReveal(runId) {
    if (runId !== state.runId || state.selected.length !== 3 || state.step !== 'deck') return;
    setDeckPhase('reveal');
    renderReveal();
    revealQuestion.textContent = `“${state.question}”`;
    revealStatus.textContent = 'Past / 过去，正在回应。向下滚动继续揭示。';
    state.revealedCount = 0;
    setStep('reveal');
    revealStep.scrollTop = 0;

    const items = [...revealGrid.querySelectorAll('.reveal-item')];
    revealObserver?.disconnect();
    revealObserver = new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= .55)
        .sort((a, b) => Number(a.target.dataset.index) - Number(b.target.dataset.index))
        .forEach((entry) => revealChapter(entry.target, Number(entry.target.dataset.index)));
    }, {
      root: revealStep,
      threshold: [.55, .7]
    });
    items.forEach((item) => revealObserver.observe(item));
    schedule(() => revealChapter(items[0], 0), reducedMotion.matches ? 80 : 420, runId);
  }

  function beginReveal() {
    if (!state.readyToReveal || state.selected.length !== 3 || state.step !== 'deck') return;
    const runId = state.runId;
    state.readyToReveal = false;
    revealCards.disabled = true;
    deckCompletion.classList.add('is-activating');
    deckStatus.textContent = '三张牌正在回应…';
    schedule(() => openReveal(runId), reducedMotion.matches ? 80 : 420, runId);
  }

  function createResultCard(card, index) {
    const article = document.createElement('article');
    article.className = 'result-card';
    const visual = document.createElement('div');
    visual.className = 'result-card-visual';
    visual.appendChild(createCardFront(card, true));
    const copy = document.createElement('div');
    copy.className = 'result-card-copy';
    copy.innerHTML = `<small>${positionLabels[index].en} / ${positionLabels[index].zh}</small><h3>${card.nameEn}</h3><p>${card.nameZh} · ${(card.keywordsZh || []).join(' · ')}</p>`;
    article.append(visual, copy);
    return article;
  }

  function buildGuidance() {
    const [past, present, future] = state.selected;
    const pastKey = past.keywordsZh?.[0] || past.nameZh;
    const presentKey = present.keywordsZh?.[0] || present.nameZh;
    const futureKey = future.keywordsZh?.[0] || future.nameZh;
    const shared = state.selected.flatMap((card) => card.keywordsZh || []).slice(0, 6).join('、');

    return `关于“${state.question}”，${past.nameZh}把过去的线索带向“${pastKey}”，${present.nameZh}提醒你在当下留意“${presentKey}”，而${future.nameZh}让未来的可能性朝向“${futureKey}”。三张牌共同指向：${shared}。不必急着寻找唯一答案，先回应那个在你心里反复出现、却一直被轻轻搁置的选择。`;
  }

  function showResult() {
    if (state.selected.length !== 3) return;
    revealObserver?.disconnect();
    resultQuestion.textContent = state.question;
    resultCards.innerHTML = '';
    state.selected.forEach((card, index) => resultCards.appendChild(createResultCard(card, index)));
    whisperText.textContent = buildGuidance();
    setStep('result');
  }

  function resetReadingUi() {
    clearRingFocus();
    revealObserver?.disconnect();
    revealObserver = null;
    ring.classList.remove(
      'is-active',
      'is-forming',
      'is-stacked',
      'is-drawing',
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
    deckCompletion.classList.remove('is-activating');
    revealCards.disabled = true;
    slots.forEach((slot, index) => {
      slot.classList.remove('is-filled', 'is-receiving', 'is-current', 'is-pending', 'is-locked');
      delete slot.dataset.cardId;
      delete slot.dataset.state;
      const status = slot.querySelector('.slot-state');
      status.textContent = index === 0 ? '等待选择' : '未开始';
      slot.removeAttribute('aria-label');
    });
    revealGrid.innerHTML = '';
    revealStep.scrollTop = 0;
    resultCards.innerHTML = '';
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
    state.revealedCount = 0;
    resetReadingUi();

    questionInput.value = '';
    questionCount.textContent = '0 / 240';
    questionError.textContent = '';
    beginReadingButton.disabled = true;
    setStep('ask');
  }

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

  window.addEventListener('resize', () => {
    if (state.step !== 'deck' || !state.spreadComplete || !state.deck.length) return;
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

  setStep('hero');
})();
