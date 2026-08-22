'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

global.window = {};
require(path.join(__dirname, '..', 'data', 'cards-data.js'));
require(path.join(__dirname, '..', 'data', 'reading-data.js'));
const engine = require(path.join(__dirname, '..', 'reading-engine.js'));

const cards = window.MOON_WHISPER_CARDS;
const byName = (name) => {
  const card = cards.find((item) => item.nameEn === name);
  assert.ok(card, `找不到测试牌：${name}`);
  return card;
};

const requiredCardFields = [
  'arcana', 'element', 'coreMeaning', 'pastMeaning', 'presentMeaning', 'futureMeaning',
  'careerMeaning', 'loveMeaning', 'moneyMeaning', 'studyMeaning', 'decisionMeaning',
  'dailyMeaning', 'growthMeaning', 'generalMeaning', 'strength', 'shadow', 'advice'
];

assert.equal(cards.length, 78, '必须保留完整 78 张牌');
cards.forEach((card) => {
  requiredCardFields.forEach((field) => {
    assert.ok(String(card[field] ?? '').trim(), `${card.nameEn} 缺少 ${field}`);
  });
  assert.notEqual(card.pastMeaning, card.presentMeaning, `${card.nameEn} 的过去与现在含义不能相同`);
  assert.notEqual(card.presentMeaning, card.futureMeaning, `${card.nameEn} 的现在与未来含义不能相同`);
});

const cases = [
  {
    name: '指定案例｜今日运势｜火土火宫廷牌',
    question: '今日运势',
    expectedContext: 'daily',
    spread: ['Queen of Wands', 'Page of Pentacles', 'Knight of Wands']
  },
  {
    name: '事业｜目标推进与完成',
    question: '这个工作项目接下来应该如何推进？',
    expectedContext: 'career',
    spread: ['The Chariot', 'Eight of Pentacles', 'The World']
  },
  {
    name: '感情｜连结、冲突与调和',
    question: '我和伴侣最近的关系应该如何理解？',
    expectedContext: 'love',
    spread: ['Two of Cups', 'Five of Swords', 'Temperance']
  },
  {
    name: '财务｜同花色数字递进',
    question: '未来一段时间的财务和存款该注意什么？',
    expectedContext: 'money',
    spread: ['Four of Pentacles', 'Six of Pentacles', 'Nine of Pentacles']
  },
  {
    name: '学习｜风土风与宫廷关系',
    question: '这次考试复习应该把重点放在哪里？',
    expectedContext: 'study',
    spread: ['Page of Swords', 'Eight of Pentacles', 'King of Swords']
  },
  {
    name: '决策｜不确定到清晰',
    question: '两个选择之间，我该如何作出决定？',
    expectedContext: 'decision',
    spread: ['The Moon', 'Two of Swords', 'The Sun']
  },
  {
    name: '成长｜三张大阿卡纳',
    question: '个人成长中，我正在经历怎样的改变？',
    expectedContext: 'growth',
    spread: ['Death', 'Temperance', 'The Star']
  }
];

const bannedCertainty = /你一定会|未来肯定|命中注定|这件事一定成功|这个人就是/;
const outputs = [];

cases.forEach((testCase) => {
  const context = engine.classifyQuestion(testCase.question);
  assert.equal(context.type, testCase.expectedContext, `${testCase.name} 的问题分类错误`);
  const analysis = engine.analyzeSpread(testCase.spread.map(byName), context);
  const serialized = JSON.stringify(analysis);

  assert.ok(analysis.theme.length >= 90, `${testCase.name} 的主线过短`);
  assert.equal(analysis.cardReadings.length, 3, `${testCase.name} 必须有三张单牌解读`);
  analysis.cardReadings.forEach((reading) => {
    assert.ok(reading.text.length >= 120, `${testCase.name} 的 ${reading.position.zh} 解读过短`);
    assert.ok(reading.text.length <= 260, `${testCase.name} 的 ${reading.position.zh} 解读过长`);
  });
  assert.ok(analysis.relationshipAnalysis.length >= 120, `${testCase.name} 的关系分析过短`);
  assert.ok(analysis.relationshipDetails.structure, `${testCase.name} 缺少结构分析`);
  assert.ok(analysis.relationshipDetails.elementFlow, `${testCase.name} 缺少元素变化`);
  assert.ok(analysis.relationshipDetails.core, `${testCase.name} 缺少核心牌说明`);
  assert.ok(analysis.relationshipDetails.connection, `${testCase.name} 缺少三牌连接说明`);
  assert.ok(analysis.coreCard.card.nameZh, `${testCase.name} 缺少核心牌`);
  assert.ok(analysis.advice.suitable.length >= 3, `${testCase.name} 的适合建议不足`);
  assert.ok(analysis.advice.cautions.length >= 3, `${testCase.name} 的注意建议不足`);
  assert.ok(analysis.closingMessage.length >= 20, `${testCase.name} 缺少有效收尾`);
  assert.ok(!serialized.includes('undefined'), `${testCase.name} 出现 undefined`);
  assert.ok(!bannedCertainty.test(serialized), `${testCase.name} 出现绝对宿命表达`);
  outputs.push(analysis);
});

const target = outputs[0];
assert.equal(target.diagnostics.suitCounts.wands, 2, '指定案例必须识别两张权杖');
assert.equal(target.diagnostics.elementCounts.fire, 2, '指定案例必须识别前后火元素');
assert.deepEqual(target.diagnostics.elements, ['fire', 'earth', 'fire'], '指定案例必须识别火 → 土 → 火');
assert.equal(target.coreCard.card.nameEn, 'Page of Pentacles', '星币侍从应是指定案例的核心锚点');
assert.match(target.relationshipDetails.core, /转折|锚点/, '指定案例必须解释中间牌的转折作用');
assert.match(target.relationshipAnalysis, /准备|校准|落地/, '指定案例必须呈现准备后再行动的逻辑');
assert.match(target.theme, /行动力/, '指定案例主线必须回应行动力并非真正短板');

assert.match(outputs[3].relationshipDetails.structure, /星币出现3次/, '财务案例必须识别同花色主导');
assert.match(outputs[3].relationshipDetails.structure, /4 → 6 → 9/, '财务案例必须识别数字递进');
assert.equal(outputs[6].diagnostics.majorCount, 3, '成长案例必须识别三张大阿卡纳');
assert.equal(outputs[4].diagnostics.courtCount, 2, '学习案例必须识别两张宫廷牌');

assert.equal(new Set(outputs.map((item) => item.theme)).size, outputs.length, '不同牌组的主线不应重复');
assert.equal(new Set(outputs.map((item) => item.relationshipAnalysis)).size, outputs.length, '不同牌组的关系分析不应重复');

const sameSpreadCareer = engine.analyzeSpread(cases[0].spread.map(byName), engine.classifyQuestion('我的工作项目怎么推进？'));
assert.notEqual(sameSpreadCareer.cardReadings[1].text, target.cardReadings[1].text, '同一牌组应随问题类别改变解读');
assert.notEqual(sameSpreadCareer.advice.suitable.join('|'), target.advice.suitable.join('|'), '同一牌组应随问题类别改变建议');

const fallback = engine.analyzeSpread([
  { nameEn: 'Local Symbol', nameZh: '未知之牌', keywordsZh: ['观察'] },
  null,
  {}
], engine.classifyQuestion('这是一段无法分类的自由问题'));
assert.equal(fallback.questionContext.type, 'general', '无法分类的问题必须回退到 general');
assert.equal(fallback.cardReadings.length, 3, 'fallback 仍必须返回三张牌解读');
assert.ok(!JSON.stringify(fallback).includes('undefined'), 'fallback 不能出现 undefined');
assert.ok(fallback.theme && fallback.relationshipAnalysis && fallback.closingMessage, 'fallback 不能返回空结果');

console.log(`✓ 78 张牌结构完整`);
cases.forEach((testCase) => console.log(`✓ ${testCase.name}`));
console.log('✓ 问题语境变化、非宿命表达、无 undefined 与 fallback 均通过');
