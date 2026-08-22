(function attachReadingEngine(root, factory) {
  const engine = factory();
  root.MoonWhisperReading = engine;
  if (typeof module === 'object' && module.exports) module.exports = engine;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';

  const POSITIONS = [
    { key: 'past', en: 'PAST', zh: '过去' },
    { key: 'present', en: 'PRESENT', zh: '现在' },
    { key: 'future', en: 'FUTURE', zh: '未来' }
  ];

  const CONTEXTS = {
    career: {
      label: '工作与事业',
      focus: '推进方式、职责边界与可持续的专业积累',
      suitable: ['把最重要的任务拆成可检查的下一步', '在推进前确认分工、期限与判断依据'],
      cautions: ['同时承诺过多任务，让优先级变得模糊', '只凭忙碌感判断事情是否真的有进展']
    },
    love: {
      label: '感情与关系',
      focus: '真实需要、彼此回应与关系中的行动证据',
      suitable: ['用具体感受和需要代替猜测', '观察关系里的承诺是否有双向行动支持'],
      cautions: ['替对方补写没有被说出的答案', '为了维持表面和谐而忽略自己的边界']
    },
    money: {
      label: '金钱与资源',
      focus: '资源分配、风险边界与长期可持续性',
      suitable: ['先核对数字、期限和真实成本', '为重要资源留出清楚的安全边界'],
      cautions: ['把短期情绪当成投入或消费的依据', '只看可能收益而忽略持续投入的代价']
    },
    study: {
      label: '学习',
      focus: '理解、练习、反馈与可以被验证的进步',
      suitable: ['把知识转成一次有反馈的实际练习', '优先补齐最影响后续理解的基础环节'],
      cautions: ['收集很多资料却迟迟不开始练习', '用一时状态否定已经累积的能力']
    },
    decision: {
      label: '选择与决策',
      focus: '信息完整度、价值排序与愿意承担的代价',
      suitable: ['写下每个选项真正需要承担的成本', '为尚未确定的部分找一项可以验证的事实'],
      cautions: ['因为害怕错过而仓促选择', '把拖延误认为仍在认真比较']
    },
    daily: {
      label: '今日运势',
      focus: '今天的精力落点、现实节奏与可完成之事',
      suitable: ['先完成一件能让今天更稳的小事', '在行动前做一次简短而必要的核对'],
      cautions: ['一兴奋就同时开启许多事情', '高估今天可以使用的时间或精力']
    },
    growth: {
      label: '个人成长',
      focus: '旧模式、内在需要与新的现实练习',
      suitable: ['记录一次与旧习惯不同的新回应', '把觉察落实成一项可以重复的小练习'],
      cautions: ['只理解道理，却不给改变留下练习空间', '因为偶尔退回旧模式就否定整个过程']
    },
    general: {
      label: '综合',
      focus: '眼前真正重要的矛盾、资源与下一步',
      suitable: ['把最反复出现的线索写成一个具体问题', '先回应自己能够影响的那一部分'],
      cautions: ['急着寻找唯一答案而忽略现实反馈', '让担忧或期待替事实作出结论']
    }
  };

  const QUESTION_RULES = [
    ['career', /工作|事业|职场|职业|上班|老板|同事|客户|项目|升职|跳槽|辞职|面试|offer|创业|生意|业绩|岗位/gi],
    ['love', /感情|爱情|恋爱|关系|复合|暧昧|伴侣|对象|喜欢|前任|婚姻|结婚|分手|他对我|她对我|我们之间|桃花/gi],
    ['money', /金钱|财务|收入|工资|奖金|投资|理财|存款|债务|负债|消费|买房|预算|赚钱|财富|资金/gi],
    ['study', /学习|考试|考研|高考|作业|课程|论文|学校|成绩|复习|读书|留学|申请|证书|知识|技能/gi],
    ['decision', /选择|决定|决策|要不要|是否应该|该不该|哪个|哪条路|取舍|犹豫|怎么办|如何选|方向/gi],
    ['daily', /今日|今天|今夜|本日|一天|日运|运势|最近状态|当下状态/gi],
    ['growth', /成长|自我|内心|人生|习惯|疗愈|改变自己|突破|意义|情绪模式|个人状态/gi]
  ];

  const ELEMENT_NAMES = {
    fire: '火',
    water: '水',
    air: '风',
    earth: '土',
    spirit: '大阿卡纳'
  };

  const ELEMENT_ENERGY = {
    fire: '行动、热情与主动意愿',
    water: '感受、连结与情绪流动',
    air: '思考、判断与沟通',
    earth: '现实、资源与稳定执行',
    spirit: '较深层的生命课题'
  };

  const CONTEXT_ELEMENT_LENSES = {
    career: {
      fire: '在事业语境里，它对应主动推进、影响力与出手时机',
      water: '在事业语境里，它涉及合作感受、团队关系与工作认同',
      air: '在事业语境里，它要求厘清信息、标准与沟通方式',
      earth: '在事业语境里，它应当落到资源、流程与可交付成果',
      spirit: '在事业语境里，它触及你对方向、责任与长期价值的选择'
    },
    love: {
      fire: '放进关系里，它表现为主动靠近、热度与表达意愿',
      water: '放进关系里，它直接关乎感受流动、信任与彼此回应',
      air: '放进关系里，它要求把猜测变成坦诚而有边界的沟通',
      earth: '放进关系里，它更看重稳定投入、实际照料与可持续性',
      spirit: '放进关系里，它触及价值选择与更深层的相处模式'
    },
    money: {
      fire: '对应财务问题，它提醒你观察行动冲动与风险偏好',
      water: '对应财务问题，它提示情绪安全感也在影响资源选择',
      air: '对应财务问题，它要求用信息、条款和数字校正判断',
      earth: '对应财务问题，它直接落在成本、储备与长期经营上',
      spirit: '对应财务问题，它把资源选择连接到更长期的价值排序'
    },
    study: {
      fire: '放进学习里，它对应兴趣启动、探索动力与实践意愿',
      water: '放进学习里，它提醒你照顾状态、兴趣与反馈带来的感受',
      air: '放进学习里，它强调理解、提问与清楚表达知识',
      earth: '放进学习里，它要求通过练习、复盘和成果检验理解',
      spirit: '放进学习里，它触及你为何学习以及这段成长想通向哪里'
    },
    decision: {
      fire: '对应选择，它让行动意愿和机会窗口变得更突出',
      water: '对应选择，它提醒你辨认真实感受与情绪投射',
      air: '对应选择，它要求补齐事实、比较依据并说清立场',
      earth: '对应选择，它把注意力拉回成本、资源与执行条件',
      spirit: '对应选择，它触及哪条路更符合你的长期价值'
    },
    daily: {
      fire: '放到今天，它对应精力投入、主动安排与行动节奏',
      water: '放到今天，它提醒你关注情绪变化与关系回应',
      air: '放到今天，它要求先理清信息、沟通和优先顺序',
      earth: '放到今天，它需要用时间、细节和可完成结果来衡量',
      spirit: '放到今天，它把日常事件连接到一个更值得反思的主题'
    },
    growth: {
      fire: '放进个人成长里，它关乎主动性、自我表达与行动勇气',
      water: '放进个人成长里，它关乎情绪容纳、连结方式与内在需要',
      air: '放进个人成长里，它要求辨认旧想法并建立新的理解',
      earth: '放进个人成长里，它强调把觉察变成可重复的现实练习',
      spirit: '放进个人成长里，它指向一段较深的价值与身份转变'
    },
    general: {
      fire: '它让行动意愿、创造冲动与推进节奏更值得关注',
      water: '它让真实感受、关系回应与情绪边界更值得关注',
      air: '它让事实、判断与沟通方式更值得关注',
      earth: '它让现实条件、资源和执行细节更值得关注',
      spirit: '它把眼前事件连接到一项更深层的选择或成长主题'
    }
  };

  const SUIT_NAMES = {
    wands: '权杖',
    cups: '圣杯',
    swords: '宝剑',
    pentacles: '星币'
  };

  const RANK_NAMES = {
    ace: '王牌',
    page: '侍从',
    knight: '骑士',
    queen: '皇后',
    king: '国王'
  };

  function clean(text) {
    return String(text || '').replace(/[。；;，,\s]+$/g, '');
  }

  function ensureSentence(text) {
    const value = clean(text);
    return value ? `${value}。` : '';
  }

  function countBy(values) {
    return values.reduce((counts, value) => {
      if (!value) return counts;
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {});
  }

  function unique(items) {
    return [...new Set(items.filter(Boolean))];
  }

  function classifyQuestion(question) {
    const normalizedQuestion = clean(String(question || '').trim()) || '我现在需要把注意力放在哪里';
    const scores = {};
    const matchedKeywords = {};

    QUESTION_RULES.forEach(([type, pattern]) => {
      const matches = normalizedQuestion.match(pattern) || [];
      scores[type] = matches.length;
      matchedKeywords[type] = unique(matches.map((item) => item.toLowerCase()));
    });

    let type = 'general';
    let highestScore = 0;
    QUESTION_RULES.forEach(([candidate]) => {
      if (scores[candidate] > highestScore) {
        type = candidate;
        highestScore = scores[candidate];
      }
    });

    return {
      question: normalizedQuestion,
      type,
      label: CONTEXTS[type].label,
      focus: CONTEXTS[type].focus,
      confidence: highestScore > 0 ? Math.min(1, 0.58 + highestScore * 0.14) : 0,
      matchedKeywords: matchedKeywords[type] || []
    };
  }

  function fallbackCard(card, index) {
    const source = card && typeof card === 'object' ? card : {};
    const nameZh = source.nameZh || `第${index + 1}张牌`;
    const keywordText = (source.keywordsZh || []).join('、') || '尚待理解的线索';
    const coreMeaning = source.coreMeaning || `${keywordText}正在成为这次问题里需要被认真看见的部分`;
    return {
      ...source,
      id: source.id ?? `fallback-${index}`,
      nameEn: source.nameEn || 'Unknown Card',
      nameZh,
      arcana: source.arcana || 'minor',
      suit: source.suit || null,
      suitZh: source.suitZh || SUIT_NAMES[source.suit] || '未分类',
      rank: source.rank || null,
      number: source.number ?? null,
      element: source.element || 'neutral',
      coreMeaning,
      pastMeaning: source.pastMeaning || `它留在过去的影响与${keywordText}有关，这份经验仍在塑造你理解当前问题的方式`,
      presentMeaning: source.presentMeaning || `它落在现在，提醒你先看清${keywordText}如何真实影响此刻的判断与行动`,
      futureMeaning: source.futureMeaning || `它落在未来，更像是当前节奏延续后可能出现的${keywordText}方向，而非固定结果`,
      strength: source.strength || '愿意观察并重新理解现状',
      shadow: source.shadow || '在信息不足时只凭第一反应作出结论',
      advice: source.advice || '回到事实，并完成一项可以验证的小行动',
      generalMeaning: source.generalMeaning || `放进你正在询问的事情里，${coreMeaning}`
    };
  }

  function rankValue(card) {
    if (!card) return null;
    const courtValues = { ace: 1, page: 11, knight: 12, queen: 13, king: 14 };
    if (courtValues[card.rank]) return courtValues[card.rank];
    const numeric = Number(card.rank);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function describeElementFlow(elements) {
    return elements.map((element) => ELEMENT_NAMES[element] || '中性').join(' → ');
  }

  function transitionPhrase(from, to) {
    if (from === to) return `${ELEMENT_ENERGY[from] || '同类能量'}继续累积`;
    const transitions = {
      'fire-earth': '从热情推进转入现实准备',
      'earth-fire': '在准备之后重新加速行动',
      'fire-water': '从主动推进转向感受与关系回应',
      'water-fire': '把感受转成更直接的行动',
      'water-air': '从情绪经验转向厘清事实与表达',
      'air-water': '让理性判断重新接触真实感受',
      'air-earth': '把判断落到方法、资源与执行',
      'earth-air': '从现实条件转向重新判断与沟通',
      'water-earth': '让感受获得现实承接',
      'earth-water': '从务实安排转向情绪与关系流动',
      'fire-air': '热情开始寻找清楚方向与表达',
      'air-fire': '想法开始转成直接行动'
    };
    return transitions[`${from}-${to}`] || `能量从${ELEMENT_NAMES[from] || '前一阶段'}转向${ELEMENT_NAMES[to] || '后一阶段'}`;
  }

  function describeTrajectory(cards, diagnostics) {
    const [past, present, future] = cards;
    const [firstElement, middleElement, lastElement] = diagnostics.elements;

    if (firstElement === 'fire' && middleElement === 'earth' && lastElement === 'fire') {
      return '热情与自信先被拉回现实准备，再转成更有速度的行动';
    }
    if (firstElement === 'water' && middleElement === 'air' && lastElement === 'water') {
      return '感受经过一次理性澄清，再回到更清楚的情绪回应';
    }
    if (firstElement === 'air' && middleElement === 'earth' && lastElement === 'fire') {
      return '想法先落成方法与资源，之后才获得行动推力';
    }
    if (firstElement === 'fire' && middleElement === 'water' && lastElement === 'earth') {
      return '主动意愿经过情感校准，逐步落到稳定现实';
    }
    if (diagnostics.majorCount >= 2) {
      return `从${past.nameZh}揭示的深层课题，经由${present.nameZh}重新选择回应方式，再走向${future.nameZh}带来的整合`;
    }

    return `${transitionPhrase(firstElement, middleElement)}，随后${transitionPhrase(middleElement, lastElement)}`;
  }

  function chooseCoreCard(cards, diagnostics) {
    const scores = cards.map((card, index) => {
      let score = index === 1 ? 5 : 1;
      if (card.arcana === 'major') score += 4;
      if (diagnostics.majorCount === 1 && card.arcana === 'major') score += 2;
      if (index === 1 && diagnostics.outerElementMatch && diagnostics.elements[1] !== diagnostics.elements[0]) score += 5;
      if (index === 1 && diagnostics.outerSuitMatch && cards[1].suit !== cards[0].suit) score += 3;
      return score;
    });
    const highest = Math.max(...scores);
    const index = scores.indexOf(highest);
    const card = cards[index];

    let role = index === 1 ? '当前牌阵的关键节点' : '整组牌的核心主题牌';
    let reason = index === 1
      ? `${card.nameZh}位于现在，直接连接过去留下的惯性与未来可能形成的方向`
      : `${card.nameZh}作为本组中权重更高的大阿卡纳，把其余两张牌收拢到同一个深层主题`;

    if (index === 1 && diagnostics.outerElementMatch && diagnostics.elements[1] !== diagnostics.elements[0]) {
      role = '中间的转折与锚点';
      reason = `前后都是${ELEMENT_NAMES[diagnostics.elements[0]]}元素，而${card.nameZh}带来${ELEMENT_NAMES[diagnostics.elements[1]]}元素，使它成为打断惯性、改变节奏的现实锚点`;
    } else if (index === 1 && card.arcana === 'major') {
      role = '现在的核心转折牌';
      reason = `${card.nameZh}既位于现在，又属于大阿卡纳，说明眼前的回应方式比单一事件结果更值得关注`;
    }

    return { card, index, position: POSITIONS[index], role, reason, score: highest };
  }

  function analyzeRelationships(cards) {
    const suits = cards.map((card) => card.suit).filter(Boolean);
    const elements = cards.map((card) => card.element || 'neutral');
    const suitCounts = countBy(suits);
    const elementCounts = countBy(elements.filter((element) => element !== 'spirit' && element !== 'neutral'));
    const dominantSuitEntry = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0] || null;
    const dominantElementEntry = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0] || null;
    const majorCards = cards.filter((card) => card.arcana === 'major');
    const courtCards = cards.filter((card) => ['page', 'knight', 'queen', 'king'].includes(card.rank));
    const outerElementMatch = elements[0] === elements[2] && elements[0] !== 'neutral';
    const outerSuitMatch = Boolean(cards[0].suit && cards[0].suit === cards[2].suit);
    const rankValues = cards.map(rankValue);
    const diagnostics = {
      suits,
      elements,
      suitCounts,
      elementCounts,
      dominantSuit: dominantSuitEntry?.[1] >= 2 ? dominantSuitEntry[0] : null,
      dominantElement: dominantElementEntry?.[1] >= 2 ? dominantElementEntry[0] : null,
      majorCount: majorCards.length,
      majorCards,
      courtCards,
      outerElementMatch,
      outerSuitMatch,
      rankValues
    };
    diagnostics.trajectory = describeTrajectory(cards, diagnostics);
    diagnostics.coreCard = chooseCoreCard(cards, diagnostics);

    const structureParts = [];
    if (diagnostics.dominantSuit) {
      const count = suitCounts[diagnostics.dominantSuit];
      structureParts.push(`${SUIT_NAMES[diagnostics.dominantSuit]}出现${count}次，${ELEMENT_ENERGY[diagnostics.dominantElement]}因此成为牌阵的主导语言`);
    } else {
      structureParts.push('三张牌没有由单一花色主导，问题需要同时照顾不同层面的需求');
    }

    if (majorCards.length === 1) {
      structureParts.push(`${majorCards[0].nameZh}是唯一的大阿卡纳，为眼前事件加入了更深一层的价值或成长主题`);
    } else if (majorCards.length >= 2) {
      structureParts.push(`${majorCards.length}张大阿卡纳提高了整组牌的重量，这次问题更像牵动一段较长期的内在课题，而不是一次孤立的小事件`);
    } else {
      structureParts.push('三张都是小阿卡纳，重点更靠近此刻可观察、可调整的日常行动');
    }

    if (courtCards.length === 3) {
      const courtFlow = courtCards.map((card) => RANK_NAMES[card.rank]).join(' → ');
      structureParts.push(`三张都是宫廷牌（${courtFlow}），牌阵特别强调你采用何种姿态行动：掌控、学习或推进，比抽象结果更关键`);
    } else if (courtCards.length >= 2) {
      structureParts.push(`${courtCards.length}张宫廷牌让“如何行动与回应”比单纯事件本身更突出`);
    }

    const numericRanks = cards.every((card) => card.arcana === 'minor' && Number.isFinite(rankValue(card))) ? rankValues : [];
    if (numericRanks.length === 3 && cards.every((card) => /^\d+$/.test(String(card.rank)))) {
      const increasing = numericRanks[0] < numericRanks[1] && numericRanks[1] < numericRanks[2];
      const decreasing = numericRanks[0] > numericRanks[1] && numericRanks[1] > numericRanks[2];
      if (increasing) structureParts.push(`数字从 ${numericRanks.join(' → ')} 递进，显示事情正在累积复杂度与经验`);
      if (decreasing) structureParts.push(`数字从 ${numericRanks.join(' → ')} 回落，显示牌阵在引导你简化问题、返回基础`);
    }

    const elementFlow = `${describeElementFlow(elements)}。${diagnostics.trajectory}。`;
    let middleRole = `作为中间牌，${cards[1].nameZh}把${clean(cards[0].coreMeaning)}留下的影响，转成对“${clean(cards[1].coreMeaning)}”的当下回应；这一步再影响${cards[2].nameZh}可能展开的方向。`;
    if (outerElementMatch && elements[1] !== elements[0]) {
      middleRole = `前后两张牌都由${ELEMENT_NAMES[elements[0]]}元素推动，中间的${cards[1].nameZh}却带来${ELEMENT_NAMES[elements[1]]}元素。它不是偏离主线，而是在两段相似能量之间加入必要的校准，使后续行动不只是重复过去。`;
    }

    return {
      diagnostics,
      structure: structureParts.slice(0, 3).map(ensureSentence).join(''),
      elementFlow,
      core: `${diagnostics.coreCard.card.nameZh}是${diagnostics.coreCard.role}。${ensureSentence(diagnostics.coreCard.reason)}`,
      connection: middleRole
    };
  }

  function contextMeaning(card, contextType) {
    return card[`${contextType}Meaning`] || card.contextMeanings?.[contextType] || card.generalMeaning || card.coreMeaning;
  }

  function contextLens(card, contextType) {
    const lenses = CONTEXT_ELEMENT_LENSES[contextType] || CONTEXT_ELEMENT_LENSES.general;
    return lenses[card.element] || CONTEXT_ELEMENT_LENSES.general[card.element] || `放进这次问题里，它需要结合${CONTEXTS[contextType]?.focus || CONTEXTS.general.focus}来理解`;
  }

  function buildCardReadings(cards, context, relationship) {
    const question = context.question;
    const coreIndex = relationship.diagnostics.coreCard.index;
    return cards.map((card, index) => {
      const position = POSITIONS[index];
      let connection;

      if (index === 0) {
        connection = `这份基础正在被${cards[1].nameZh}要求转成更适合当下的回应；过去提供的是起点，不必成为今天的固定剧本。`;
      } else if (index === 1) {
        connection = index === coreIndex
          ? `它也是本组${relationship.diagnostics.coreCard.role}：真正值得处理的不是催促结果，而是完成这张牌指出的中间步骤。`
          : `它承接过去并改变后续方向，是眼前最适合观察和调整的位置。`;
      } else {
        connection = `这不是确定预言，而是前两张牌的节奏继续发展时较可能靠近的状态。${clean(card.advice)}，会让趋势更有选择余地。`;
      }

      const intro = index === 0
        ? `在“${question}”这件事里，${card.nameZh}落在过去，说明你并不是从零开始进入此刻。`
        : index === 1
          ? `${card.nameZh}位于现在，是此刻最需要被直接回应的一步。`
          : `${card.nameZh}落在未来，描述的是一种正在形成的倾向。`;

      let body;
      if (index === 0) {
        body = `它说明${clean(card.coreMeaning)}。${clean(card.strength)}是你带到此刻的资源；同时，${clean(card.shadow)}也可能留下惯性。`;
      } else if (index === 1) {
        body = `它把当前任务指向${clean(card.coreMeaning)}。可以借助${clean(card.strength)}，并观察${clean(card.shadow)}是否正在干扰判断。`;
      } else {
        body = `当前节奏若继续发展，可能更接近${clean(card.coreMeaning)}。其中可用的是${clean(card.strength)}，需要留意的是${clean(card.shadow)}。`;
      }

      return {
        position,
        card,
        text: `${intro}${body}${ensureSentence(contextLens(card, context.type))}${connection}`
      };
    });
  }

  function buildTheme(cards, context, relationship) {
    const [past, present, future] = cards;
    const diagnostics = relationship.diagnostics;
    const isFireEarthFire = diagnostics.elements.join('-') === 'fire-earth-fire';

    if (isFireEarthFire) {
      return `关于“${context.question}”，这组三张牌没有把重点放在你是否有行动力，而是放在行动之前能否把眼前环节做实。${past.nameZh}带来已经形成的信心与主动性，${present.nameZh}把节奏拉回学习、核对和准备，${future.nameZh}才让能量重新加速。真正决定事情是否顺畅的，是中间这一步能否落地，而不是更用力地催促自己。`;
    }

    const variants = [
      `关于“${context.question}”，整组牌呈现的是${diagnostics.trajectory}。${past.nameZh}说明你带着${clean(past.strength)}进入问题，${present.nameZh}要求把注意力放到${clean(present.coreMeaning)}，而${future.nameZh}展示了这一步继续发展后可能靠近的方向。关键不是提前确定结果，而是先回应${diagnostics.coreCard.card.nameZh}指出的核心步骤。`,
      `这组三张牌把“${context.question}”的重点收拢到${context.focus}。过去的${past.nameZh}留下${clean(past.strength)}，现在的${present.nameZh}正在改变节奏，未来的${future.nameZh}则把这种改变带向${clean(future.coreMeaning)}。目前最有价值的不是追问事情是否按预期发生，而是看清中间的选择如何连接前因与后续。`,
      `面对“${context.question}”，牌阵更像在描述一条可调整的过程：${diagnostics.trajectory}。${past.nameZh}提供既有经验，${present.nameZh}标出眼前的转折，${future.nameZh}提示当前方式延续时的可能走向。若先把${clean(diagnostics.coreCard.card.advice)}落到现实，后面的变化会更有空间，而不必被理解为固定结局。`
    ];
    return variants[Math.abs(Number(present.id) || 0) % variants.length];
  }

  function buildAdvice(cards, context, relationship) {
    const [past, present, future] = cards;
    const contextConfig = CONTEXTS[context.type] || CONTEXTS.general;
    const suitable = unique([
      present.advice,
      `把${clean(past.strength)}用在一个范围明确、今天可以推进的事项上`,
      `在靠近${future.nameZh}描述的方向前，先完成一次事实与资源核对`,
      ...contextConfig.suitable
    ]).slice(0, 4);

    const cautions = unique([
      `过去的优势也可能变成惯性：${clean(past.shadow)}`,
      `当前尤其需要观察：${clean(present.shadow)}`,
      `未来位置需要留意：${clean(future.shadow)}`,
      ...contextConfig.cautions
    ]).slice(0, 4);

    if (relationship.diagnostics.outerElementMatch && relationship.diagnostics.elements[1] !== relationship.diagnostics.elements[0]) {
      suitable[0] = present.advice;
      cautions[0] = '跳过中间的校准步骤，直接重复过去熟悉的推进方式';
    }

    return { suitable, cautions };
  }

  function buildClosing(cards, context, relationship) {
    const elements = relationship.diagnostics.elements.join('-');
    if (elements === 'fire-earth-fire') {
      return '热情已经在前后呼应。今夜真正需要的，只是让中间那一步准备，成为火焰可以落地的地方。';
    }
    if (relationship.diagnostics.dominantElement === 'water') {
      return '让感受成为信使，而不是结论。真正愿意被听见的心，也需要现实中的回应。';
    }
    if (relationship.diagnostics.dominantElement === 'air') {
      return '答案未必藏在更多思绪里。把最清楚的那一句，轻轻放回现实。';
    }
    if (relationship.diagnostics.dominantElement === 'earth') {
      return '不必急着看见整条路。今夜先把下一步放稳，方向会在脚下慢慢清楚。';
    }
    if (relationship.diagnostics.dominantElement === 'fire') {
      return '火光已经指出想去的方向。给它边界与节奏，它才会照亮而不是灼伤。';
    }
    return `${cards[1].nameZh}把月光停在此刻：${clean(cards[1].advice)}。答案不必一次完成，它会在你的回应里逐渐清楚。`;
  }

  function analyzeSpread(inputCards, questionContext) {
    const cards = Array.from({ length: 3 }, (_, index) => fallbackCard(inputCards?.[index], index));
    const context = typeof questionContext === 'string'
      ? classifyQuestion(questionContext)
      : questionContext?.type && CONTEXTS[questionContext.type]
        ? { ...classifyQuestion(questionContext.question), ...questionContext }
        : classifyQuestion(questionContext?.question || '');
    const relationship = analyzeRelationships(cards);
    const cardReadings = buildCardReadings(cards, context, relationship);
    const relationshipAnalysis = `${relationship.elementFlow}${relationship.connection}${relationship.core}`;

    return {
      theme: buildTheme(cards, context, relationship),
      cardReadings,
      relationshipAnalysis,
      relationshipDetails: {
        structure: relationship.structure,
        elementFlow: relationship.elementFlow,
        core: relationship.core,
        connection: relationship.connection
      },
      coreCard: relationship.diagnostics.coreCard,
      advice: buildAdvice(cards, context, relationship),
      closingMessage: buildClosing(cards, context, relationship),
      questionContext: context,
      diagnostics: {
        suits: relationship.diagnostics.suits,
        elements: relationship.diagnostics.elements,
        suitCounts: relationship.diagnostics.suitCounts,
        elementCounts: relationship.diagnostics.elementCounts,
        majorCount: relationship.diagnostics.majorCount,
        courtCount: relationship.diagnostics.courtCards.length,
        dominantSuit: relationship.diagnostics.dominantSuit,
        dominantElement: relationship.diagnostics.dominantElement,
        trajectory: relationship.diagnostics.trajectory
      }
    };
  }

  return {
    POSITIONS,
    CONTEXTS,
    classifyQuestion,
    analyzeSpread
  };
});
