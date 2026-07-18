// v0.2.0 適性數學引擎（IRT 動態難度）
// 依玩家 currentRank(0~4) 與基礎難度(baseGrade) 產生題目。
// 升降階邏輯在 store.reportAnswer；本檔僅負責「依 rank 出對應難度的題」。

// 基礎難度：玩家初始選擇（幼兒園~高年級）對應的數字範圍與可用運算
export const GRADES = {
  kindergarten: { label: 'Kindergarten', maxNum: 5, ops: ['+'] },
  grade1: { label: 'Grade 1-2', maxNum: 20, ops: ['+', '-'] },
  grade3: { label: 'Grade 3-4', maxNum: 100, ops: ['+', '-', '×'] },
  grade5: { label: 'Grade 5-6', maxNum: 999, ops: ['+', '-', '×', '÷'] },
};

// 運算子 → 學習報表維度對應
const OP_DIMENSION = {
  '+': 'Addition',
  '-': 'Subtraction',
  '×': 'Multiplication',
  '÷': 'Division',
};

// 亂數整數 [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 產生一題。
 * @param {string} baseGrade GRADES 的鍵
 * @param {number} rank 目前 IRT 階級 0~4（越高數字越大、越可能進位/含乘除）
 * @param {boolean} showVisualHint 是否附視覺提示（小數量才顯示蘋果圖）
 * @returns {{question, answer, options, dimension, visualHint}}
 */
export function generateQuestion(baseGrade = 'grade1', rank = 0, showVisualHint = false) {
  const grade = GRADES[baseGrade] || GRADES.grade1;

  // rank 影響：以 1 + rank*0.4 放大數字上限（上限仍受年級 maxNum 約束的 3 倍內）
  const scale = 1 + rank * 0.4;
  const maxNum = Math.min(grade.maxNum * 3, Math.round(grade.maxNum * scale));

  // rank 高時，若年級允許，優先挑較難運算（乘/除）
  let ops = grade.ops;
  if (rank >= 3 && grade.ops.includes('×')) ops = grade.ops.filter((o) => o === '×' || o === '÷');
  const op = pick(ops);

  let a;
  let b;
  let answer;

  switch (op) {
    case '+':
      a = randInt(1, maxNum);
      b = randInt(1, maxNum);
      answer = a + b;
      break;
    case '-':
      a = randInt(1, maxNum);
      b = randInt(1, a); // 確保不為負
      answer = a - b;
      break;
    case '×': {
      // 乘法用較小的因數，避免超出年級認知
      const cap = Math.max(2, Math.min(12, Math.round(3 + rank * 2)));
      a = randInt(2, cap);
      b = randInt(2, cap);
      answer = a * b;
      break;
    }
    case '÷': {
      // 除法用整除：先造答案與除數，回推被除數
      const divisor = randInt(2, Math.max(2, Math.min(12, 3 + rank)));
      answer = randInt(2, Math.max(2, Math.min(12, 3 + rank)));
      a = divisor * answer;
      b = divisor;
      break;
    }
    default:
      a = 1;
      b = 1;
      answer = 2;
  }

  const question = `${a} ${op} ${b} = ?`;
  const dimension = OP_DIMENSION[op] || 'Advanced';

  // 產生 4 個選項（含正解 + 3 個相近誤答）
  const options = buildOptions(answer);

  // 視覺提示：只有在數量小（≤10）且觸發降階時才給，避免畫面爆炸
  const visualHint =
    showVisualHint && answer <= 10 && op === '+'
      ? { a, b, op }
      : null;

  return { question, answer, options, dimension, visualHint };
}

// 產生不重複的 4 選項並洗牌
function buildOptions(answer) {
  const set = new Set([answer]);
  let guard = 0;
  while (set.size < 4 && guard < 50) {
    guard += 1;
    // 誤答落在 answer ±(1~5) 或 ±10% 範圍
    const delta = randInt(1, Math.max(3, Math.round(answer * 0.2) + 2));
    const wrong = Math.random() < 0.5 ? answer + delta : answer - delta;
    if (wrong >= 0 && wrong !== answer) set.add(wrong);
  }
  // 補齊（極端情況）
  let filler = answer + 1;
  while (set.size < 4) {
    if (!set.has(filler) && filler >= 0) set.add(filler);
    filler += 1;
  }
  return shuffle([...set]);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// 農場情境題產生器。
// 題目不只顯示算式，而是將乘法、除法、面積、金錢與產量放入實際農場操作。
export function generateContextQuestion(context = 'farm_yield', rank = 0) {
  const level = Math.max(0, Math.min(4, rank));
  const templates = {
    forest_sequence: () => {
      const start = randInt(1, 4 + level);
      const step = randInt(2, 3 + Math.min(level, 2));
      const a = start;
      const b = a + step;
      const c = b + step;
      const answer = c + step;
      return {
        title: '古樹數列符文',
        prompt: `樹上的發光符文依固定規律增加：${a}、${b}、${c}，下一個數字是多少？`,
        question: `${a} → ${b} → ${c} → ?`,
        answer,
        options: buildOptions(answer),
        dimension: 'Logic',
        explanation: `每次增加 ${step}，所以 ${c} + ${step} = ${answer}。`,
      };
    },
    forest_pattern: () => {
      const sides = randInt(3, 5);
      const answer = sides + 1;
      return {
        title: '石門圖形規律',
        prompt: `石門依序刻著 ${sides - 2} 邊形、${sides - 1} 邊形、${sides} 邊形，下一個圖形應該有幾條邊？`,
        question: `${sides - 2}、${sides - 1}、${sides}、?`,
        answer,
        options: buildOptions(answer),
        dimension: 'Geometry',
        explanation: `圖形每次增加 1 條邊，所以下一個是 ${answer} 邊形。`,
      };
    },
    forest_path: () => {
      const first = randInt(4, 8 + level);
      const second = randInt(3, 7 + level);
      const answer = first + second;
      return {
        title: '瀑布橋梁路徑',
        prompt: `從古樹走到木橋需要 ${first} 步，過橋再走到瀑布需要 ${second} 步，一共要走幾步？`,
        question: `${first} + ${second} = ?`,
        answer,
        options: buildOptions(answer),
        dimension: 'Addition',
        explanation: `兩段路程相加，${first} + ${second} = ${answer} 步。`,
      };
    },
    forest_addition: () => {
      const fireflies = randInt(5, 9 + level);
      const sprites = randInt(3, 6 + level);
      const answer = fireflies + sprites;
      return {
        title: '森林光點計算',
        prompt: `神殿周圍有 ${fireflies} 隻螢火蟲，又飛來 ${sprites} 隻小精靈，總共有多少個發光夥伴？`,
        question: `${fireflies} + ${sprites} = ?`,
        answer,
        options: buildOptions(answer),
        dimension: 'Addition',
        explanation: `${fireflies} + ${sprites} = ${answer}。`,
      };
    },
    farm_yield: () => {
      const rows = randInt(2, 3 + level);
      const each = randInt(2, 5 + level);
      const answer = rows * each;
      return {
        title: '收成計算',
        prompt: `有 ${rows} 排作物，每排成熟 ${each} 株，一共可以收成幾株？`,
        question: `${rows} × ${each} = ?`,
        answer,
        options: buildOptions(answer),
        dimension: 'Multiplication',
        explanation: `${rows} 排，每排 ${each} 株，所以 ${rows} × ${each} = ${answer}。`,
      };
    },
    farm_area: () => {
      const width = randInt(2, 4 + level);
      const height = randInt(2, 4 + level);
      const answer = width * height;
      return {
        title: '田地面積',
        prompt: `一塊長 ${width} 公尺、寬 ${height} 公尺的田地，面積是多少平方公尺？`,
        question: `${width} × ${height} = ?`,
        answer,
        options: buildOptions(answer),
        dimension: 'Geometry',
        explanation: `長方形面積是長 × 寬，所以 ${width} × ${height} = ${answer} 平方公尺。`,
      };
    },
    farm_market: () => {
      const unitPrice = randInt(4, 8 + level * 2);
      const quantity = randInt(2, 5 + level);
      const answer = unitPrice * quantity;
      return {
        title: '農產售價',
        prompt: `每顆果實售價 ${unitPrice}G，賣出 ${quantity} 顆可以得到多少金幣？`,
        question: `${unitPrice} × ${quantity} = ?`,
        answer,
        options: buildOptions(answer),
        dimension: 'Money',
        explanation: `每顆 ${unitPrice}G，共 ${quantity} 顆，所以得到 ${answer}G。`,
      };
    },
    animal_feed: () => {
      const total = randInt(3, 6 + level) * 2;
      const animals = 2;
      const answer = total / animals;
      return {
        title: '平均分配飼料',
        prompt: `把 ${total} 份飼料平均分給 ${animals} 隻動物，每隻可以得到幾份？`,
        question: `${total} ÷ ${animals} = ?`,
        answer,
        options: buildOptions(answer),
        dimension: 'Division',
        explanation: `平均分配使用除法，${total} ÷ ${animals} = ${answer}。`,
      };
    },
  };
  const factory = templates[context] || templates.farm_yield;
  return factory();
}

// ── Skill Graph 題目產生器 ─────────────────────────────────────
import { SKILL_BY_ID } from '../data/skillGraph.js';

export function generateSkillQuestion(skillId, rank = 0) {
  const skill = SKILL_BY_ID[skillId];
  if (!skill) return generateQuestion('grade1', rank, false);
  const difficulty = Math.max(1, Math.min(5, skill.difficulty + Math.floor(rank / 2)));
  const base = generateByDomain(skill.domainId, difficulty);
  return {
    ...base,
    skillId: skill.id,
    skillLabel: skill.topic,
    domainLabel: skill.domainLabel,
    dimension: skill.dimension,
    hintSteps: skill.hintSteps,
    misconceptionCodes: skill.misconceptionCodes,
  };
}

function generateByDomain(domainId, difficulty) {
  switch (domainId) {
    case 'numberSense': {
      const place = 10 ** Math.min(3, Math.max(1, difficulty - 1));
      const answer = randInt(2, 9) * place;
      const number = answer + randInt(1, place - 1);
      return withMeta(`在 ${number} 中，${Math.floor(answer / place)} 位於哪個位值？`, answer, buildOptions(answer), `把數字依個位、十位、百位逐位拆開。`);
    }
    case 'addSub': {
      const max = 20 * difficulty;
      const a = randInt(5, max);
      const b = randInt(2, Math.min(a, max / 2));
      const subtract = difficulty % 2 === 0;
      const answer = subtract ? a - b : a + b;
      return withMeta(`${a} ${subtract ? '-' : '+'} ${b} = ?`, answer, buildOptions(answer), subtract ? `從 ${a} 移走 ${b}。` : `把兩組數量合起來。`);
    }
    case 'mulDiv': {
      const a = randInt(2, Math.min(12, 3 + difficulty * 2));
      const b = randInt(2, Math.min(12, 3 + difficulty));
      if (difficulty >= 3 && Math.random() > 0.5) {
        const total = a * b;
        return withMeta(`${total} ÷ ${a} = ?`, b, buildOptions(b), `${total} 平均分成 ${a} 組，每組是 ${b}。`);
      }
      return withMeta(`${a} × ${b} = ?`, a * b, buildOptions(a * b), `${a} 組，每組 ${b} 個。`);
    }
    case 'fractions': {
      const denominator = pick([4, 5, 6, 8]);
      const left = randInt(1, Math.max(1, Math.floor(denominator / 2)));
      const right = randInt(1, Math.max(1, denominator - left));
      const numerator = left + right;
      const answer = `${numerator}/${denominator}`;
      const options = shuffleUnique([answer, `${Math.max(1, numerator - 1)}/${denominator}`, `${Math.min(denominator, numerator + 1)}/${denominator}`, `${numerator}/${denominator + 1}`]);
      return withMeta(`${left}/${denominator} + ${right}/${denominator} = ?`, answer, options, `分母相同時，保留分母並把分子相加。`);
    }
    case 'decimalsMoney': {
      const price = randInt(5, 20) + (difficulty >= 3 ? 0.5 : 0);
      const quantity = randInt(2, 5);
      const answer = +(price * quantity).toFixed(1);
      return withMeta(`每份 ${price}G，買 ${quantity} 份需要多少 G？`, answer, buildDecimalOptions(answer), `單價 × 數量 = 總價。`);
    }
    case 'geometry': {
      const width = randInt(2, 5 + difficulty);
      const height = randInt(2, 5 + difficulty);
      const useArea = difficulty >= 2;
      const answer = useArea ? width * height : 2 * (width + height);
      return withMeta(`長 ${width}、寬 ${height} 的長方形，${useArea ? '面積' : '周長'}是多少？`, answer, buildOptions(answer), useArea ? `長方形面積 = 長 × 寬。` : `周長 = 兩個長加兩個寬。`);
    }
    case 'measurement': {
      const meters = randInt(2, 9);
      const answer = meters * 100;
      return withMeta(`${meters} 公尺等於多少公分？`, answer, buildOptions(answer), `1 公尺 = 100 公分。`);
    }
    case 'ratioPercent': {
      const total = pick([20, 40, 50, 80, 100]);
      const percent = pick([10, 20, 25, 50]);
      const answer = total * percent / 100;
      return withMeta(`${total} 的 ${percent}% 是多少？`, answer, buildOptions(answer), `先把 ${percent}% 寫成 ${percent}/100，再乘以 ${total}。`);
    }
    case 'dataLogic': {
      const start = randInt(1, 5);
      const step = randInt(2, 3 + difficulty);
      const seq = [start, start + step, start + step * 2];
      const answer = start + step * 3;
      return withMeta(`${seq.join('、')}、?`, answer, buildOptions(answer), `每次增加 ${step}。`);
    }
    case 'wordProblems': {
      const baskets = randInt(2, 5);
      const apples = randInt(3, 8);
      const given = randInt(1, Math.max(1, apples - 1));
      const answer = baskets * apples - given;
      return withMeta(`${baskets} 籃蘋果，每籃 ${apples} 顆，送出 ${given} 顆後還剩多少？`, answer, buildOptions(answer), `先算總數 ${baskets} × ${apples}，再減去送出的 ${given}。`);
    }
    case 'timeWeather': {
      const startHour = randInt(7, 14);
      const duration = randInt(2, 5);
      const answer = startHour + duration;
      return withMeta(`作物 ${startHour}:00 種下，${duration} 小時成熟，幾點可收成？`, `${answer}:00`, shuffleUnique([`${answer}:00`, `${answer - 1}:00`, `${answer + 1}:00`, `${duration}:00`]), `開始時間加上經過的 ${duration} 小時。`);
    }
    case 'preAlgebra': {
      const x = randInt(2, 12);
      const add = randInt(2, 10);
      return withMeta(`x + ${add} = ${x + add}，x = ?`, x, buildOptions(x), `等式兩邊同時減去 ${add}。`);
    }
    default:
      return generateQuestion('grade1', difficulty - 1, false);
  }
}

function withMeta(question, answer, options, explanation) {
  return { question, answer, options, explanation, prompt: null, title: null, visualHint: null };
}

function buildDecimalOptions(answer) {
  const values = [answer, +(answer + 0.5).toFixed(1), +Math.max(0, answer - 0.5).toFixed(1), +(answer + 1).toFixed(1)];
  return shuffleUnique(values);
}

function shuffleUnique(values) {
  const unique = [...new Set(values)];
  let filler = 1;
  while (unique.length < 4) {
    const candidate = typeof unique[0] === 'number' ? Number(unique[0]) + filler : `${unique[0]}${filler}`;
    if (!unique.includes(candidate)) unique.push(candidate);
    filler += 1;
  }
  return shuffle(unique.slice(0, 4));
}
