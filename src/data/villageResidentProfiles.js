// v0.28 村莊居民 Canonical Profile。
// 所有姓名、關係、送禮、每週日程、事件與對話條件集中於單一資料源，避免散落在 JSX。

const DAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

function createDialogueBank(profile) {
  const weatherLines = {
    sunny: [`今天陽光很好，${profile.outdoorTopic}最適合慢慢進行。`, '晴天讓村裡每個人的腳步都輕快了一點。'],
    lightRain: ['雨聲會讓人更專心，也提醒我們別忘了照顧土地。', '下雨時走路要慢一點，屋簷下也有不少小故事。'],
    mist: ['霧裡的星光村看起來像藏著祕密。', '今天視線比較短，記得沿著路燈走。'],
  };
  const segmentLines = {
    morning: [`早安！${profile.morningTopic}`, '新的一天先想好最重要的一件事吧。'],
    afternoon: [`下午好，${profile.afternoonTopic}`, '忙完一半後稍微休息，反而能走得更遠。'],
    evening: [`傍晚了，${profile.eveningTopic}`, '今天發生的事，晚上回想時會變成明天的線索。'],
    night: ['夜深了，明天再繼續也沒關係。', '星光會替努力了一天的人守夜。'],
  };
  const seasonLines = {
    spring: [`春天最適合重新安排${profile.outdoorTopic}。`],
    summer: [`夏天雖然忙碌，但${profile.afternoonTopic}`],
    autumn: [`秋天的收穫會記錄每一次耐心照顧。`],
    winter: [`冬天可以放慢腳步，把今年學到的事整理好。`],
  };
  const relationLines = [
    ['stranger', `我們還在認識彼此，不過我已經記住你的名字了。`],
    ['acquainted', `最近常看到你，村裡也開始有了你的生活痕跡。`],
    ['friend', `你願意聽我說話，我也願意把重要的事告訴你。`],
    ['close', `你已經是我很信任的朋友，遇到困難別一個人扛。`],
    ['bond', `每次看到你回到村裡，我都會覺得這裡更像一個家。`],
  ];
  return { weatherLines, segmentLines, seasonLines, relationLines };
}

function resident(config) {
  const base = {
    giftPreferences: { loved: [], liked: [], disliked: [] },
    closedWeekdays: [],
    weeklyNotes: {},
    events: [],
    ...config,
  };
  const weeklyNotes = Object.keys(base.weeklyNotes || {}).length ? base.weeklyNotes : {
    0: `週一先把本週的${base.outdoorTopic}排好順序。`,
    1: `週二適合檢查昨天的做法，有需要就調整。`,
    2: `週三已走到一週中間，記得留意身邊需要幫助的人。`,
    3: `週四可以嘗試一個不同的方法，不必害怕第一次失敗。`,
    4: `週五把尚未完成的事情收尾，週末會更輕鬆。`,
    5: `週六村裡比較熱鬧，很多生活線索會出現在街上。`,
    6: `週日適合休息，也適合回想這週最值得記住的事。`,
  };
  const events = (base.events || []).map((event) => ({
    ...event,
    steps: event.steps || [
      `${base.name}邀請你一起參與「${event.title}」。`,
      event.summary,
      `你們完成了這段經歷，${base.name}把它記成共同回憶。`,
    ],
  }));
  const normalized = { ...base, weeklyNotes, events };
  return { ...normalized, dialogue: createDialogueBank(normalized) };
}

export const VILLAGE_RESIDENT_PROFILES = {
  chief: resident({
    id: 'chief', name: '村長莉亞', role: '星光村村長', emoji: '🌟', personality: ['沉穩', '鼓勵', '重視學習'],
    homePosition: [-7, 0, 19], workPosition: [-3, 0, 3], leisurePosition: [2, 0, 3], rainPosition: [-6, 0, 17],
    outdoorTopic: '整理冒險手冊', morningTopic: '先看看今天最重要的任務。', afternoonTopic: '有不懂的地方可以回學習館整理。', eveningTopic: '完成比完美更重要。',
    giftPreferences: { loved: ['item_01', 'seed_09'], liked: ['seed_08', 'mat_lake_crystal'], disliked: ['mat_stone'] },
    events: [
      { id: 'chief_event_1', affinity: 20, title: '星光村的第一頁', summary: '莉亞帶你把第一段冒險寫進村史。' },
      { id: 'chief_event_2', affinity: 50, title: '大家的地圖', summary: '你們一起標記村民真正需要幫助的地方。' },
      { id: 'chief_event_3', affinity: 80, title: '守護者的名字', summary: '莉亞正式承認你是星光村的守護夥伴。' },
    ],
  }),
  merchant: resident({
    id: 'merchant', name: '商人米洛', role: '旅行商人', emoji: '🧺', personality: ['精明', '健談', '喜歡新奇商品'],
    homePosition: [24, 0, 20], workPosition: [14, 0, 0], leisurePosition: [4, 0, 3], rainPosition: [18, 0, 1],
    outdoorTopic: '比較市場價格', morningTopic: '早市的第一批商品最能看出今天的需求。', afternoonTopic: '出貨紀錄會改變下週的市場。', eveningTopic: '收攤前要把帳目算清楚。',
    closedWeekdays: [3], giftPreferences: { loved: ['fish_rainbow_spirit', 'seed_10'], liked: ['mat_cheese', 'seed_07'], disliked: ['mat_animal_feed'] },
    events: [
      { id: 'merchant_event_1', affinity: 20, title: '第一次議價', summary: '米洛教你比較價格，而不是只看稀有度。' },
      { id: 'merchant_event_2', affinity: 50, title: '農產品新貨架', summary: '你的出貨開始改變村莊商店的供應。' },
      { id: 'merchant_event_3', affinity: 80, title: '旅行商隊的邀請', summary: '米洛把遠方的稀有商品管道交給你。' },
    ],
  }),
  blacksmith: resident({
    id: 'blacksmith', name: '鐵匠柏克', role: '裝備工匠', emoji: '🔨', personality: ['直接', '可靠', '重視實作'],
    homePosition: [-19, 0, -4], workPosition: [-15, 0, -1], leisurePosition: [-6, 0, 3], rainPosition: [-18, 0, -2],
    outdoorTopic: '觀察金屬受力', morningTopic: '先檢查工具再點火。', afternoonTopic: '每一次敲擊都要知道原因。', eveningTopic: '好裝備不只是數值，而是能保護使用者。',
    closedWeekdays: [6], giftPreferences: { loved: ['mat_sun_ore', 'mat_ancient_gear'], liked: ['mat_stone', 'mat_lake_crystal'], disliked: ['seed_08'] },
    events: [
      { id: 'blacksmith_event_1', affinity: 20, title: '合手的重量', summary: '柏克為你調整武器重心。' },
      { id: 'blacksmith_event_2', affinity: 50, title: '失敗的作品', summary: '你看見柏克如何面對鍛造失敗。' },
      { id: 'blacksmith_event_3', affinity: 80, title: '守護鍛造', summary: '柏克開放專屬裝備外觀與工匠記憶。' },
    ],
  }),
  carpenter: resident({
    id: 'carpenter', name: '木匠艾妲', role: '建築工匠', emoji: '🪚', personality: ['細心', '務實', '喜歡規劃'],
    homePosition: [-27, 0, 3], workPosition: [-23, 0, 4], leisurePosition: [-10, 0, 12], rainPosition: [-24, 0, 4],
    outdoorTopic: '量尺寸與安排空間', morningTopic: '動工前先確認材料和尺寸。', afternoonTopic: '好的配置能讓每天少走很多冤枉路。', eveningTopic: '房子會記住住在裡面的人。',
    closedWeekdays: [1], giftPreferences: { loved: ['mat_wood', 'mat_glow_spore'], liked: ['seed_06', 'mat_cloth'], disliked: ['fish_sparkle_carp'] },
    events: [
      { id: 'carpenter_event_1', affinity: 20, title: '一張農場草圖', summary: '艾妲協助你重新規劃農場動線。' },
      { id: 'carpenter_event_2', affinity: 50, title: '舊木頭的故事', summary: '你們用回收木材修復村莊長椅。' },
      { id: 'carpenter_event_3', affinity: 80, title: '家的形狀', summary: '艾妲開放專屬家具與夥伴住所設計。' },
    ],
  }),
  child_01: resident({
    id: 'child_01', name: '小晴', role: '學習館學生', emoji: '📚', personality: ['好奇', '認真', '喜歡植物'],
    homePosition: [-10, 0, 14], workPosition: [17, 0, 18], leisurePosition: [12, 0, 13], rainPosition: [17, 0, 18],
    outdoorTopic: '觀察花朵排列', morningTopic: '我今天想學會一個新的圖形。', afternoonTopic: '花園裡可以找到很多數學規律。', eveningTopic: '我要把今天的發現畫下來。',
    giftPreferences: { loved: ['seed_08', 'item_01'], liked: ['seed_09', 'seed_02'], disliked: ['mat_ancient_gear'] },
    events: [
      { id: 'child_01_event_1', affinity: 20, title: '花瓣的規律', summary: '與小晴完成花園排列遊戲。' },
      { id: 'child_01_event_2', affinity: 50, title: '答錯也沒關係', summary: '你陪小晴重新理解一道難題。' },
      { id: 'child_01_event_3', affinity: 80, title: '一起教別人', summary: '小晴開始協助其他孩子學習。' },
    ],
  }),
  child_02: resident({
    id: 'child_02', name: '阿洛', role: '冒險練習生', emoji: '🧭', personality: ['活潑', '勇敢', '容易衝動'],
    homePosition: [8, 0, 16], workPosition: [3, 0, 4], leisurePosition: [0, 0, 10], rainPosition: [9, 0, 16],
    outdoorTopic: '練習辨認方向', morningTopic: '今天我要比昨天更快找到目的地。', afternoonTopic: '我發現快不等於亂跑。', eveningTopic: '明天我想挑戰更遠的路。',
    giftPreferences: { loved: ['item_05', 'seed_05'], liked: ['fish_prism_trout', 'item_03'], disliked: ['mat_cloth'] },
    events: [
      { id: 'child_02_event_1', affinity: 20, title: '迷路練習', summary: '你教阿洛使用路標，而不是只靠速度。' },
      { id: 'child_02_event_2', affinity: 50, title: '勇敢與小心', summary: '阿洛學會在峽谷前停下觀察。' },
      { id: 'child_02_event_3', affinity: 80, title: '小小嚮導', summary: '阿洛成為新手冒險者的村莊嚮導。' },
    ],
  }),
  traveler_01: resident({
    id: 'traveler_01', name: '旅人諾亞', role: '旅行故事家', emoji: '🎒', personality: ['隨和', '博聞', '喜歡收集故事'],
    homePosition: [0, 0, 25], workPosition: [4, 0, 3], leisurePosition: [0, 0, -10], rainPosition: [1, 0, 24],
    outdoorTopic: '整理不同區域的故事', morningTopic: '每條路在早晨看起來都像新的。', afternoonTopic: '旅行的價值不是走多遠，而是記住了什麼。', eveningTopic: '晚上的故事最適合配一盞燈。',
    giftPreferences: { loved: ['mat_wind_feather', 'mat_ice_crystal'], liked: ['fish_rainbow_spirit', 'mat_lake_crystal'], disliked: ['mat_animal_feed'] },
    events: [
      { id: 'traveler_event_1', affinity: 20, title: '一張舊車票', summary: '諾亞分享第一次旅行失敗的故事。' },
      { id: 'traveler_event_2', affinity: 50, title: '八區見聞錄', summary: '你的探索資料被整理成旅行筆記。' },
      { id: 'traveler_event_3', affinity: 80, title: '下一站同行', summary: '諾亞交給你一份隱藏路線名單。' },
    ],
  }),
  resident_01: resident({
    id: 'resident_01', name: '烘焙師梅兒', role: '村莊烘焙師', emoji: '🥖', personality: ['溫柔', '講究', '喜歡分享'],
    homePosition: [-21, 0, 18], workPosition: [18, 0, 3], leisurePosition: [-8, 0, 8], rainPosition: [18, 0, 3],
    outdoorTopic: '挑選今日食材', morningTopic: '剛出爐的香味會把大家叫醒。', afternoonTopic: '好食材的品質真的吃得出來。', eveningTopic: '剩下的麵包會分給需要的人。',
    giftPreferences: { loved: ['mat_milk', 'mat_egg'], liked: ['seed_03', 'seed_06'], disliked: ['mat_sun_ore'] },
    events: [
      { id: 'resident_01_event_1', affinity: 20, title: '第一盤點心', summary: '梅兒使用你的農產品製作點心。' },
      { id: 'resident_01_event_2', affinity: 50, title: '星級食材', summary: '高品質作物開始出現在村莊餐桌。' },
      { id: 'resident_01_event_3', affinity: 80, title: '大家的早餐', summary: '你們為全村準備節慶早餐。' },
    ],
  }),
  resident_02: resident({
    id: 'resident_02', name: '花匠露露', role: '花園照護員', emoji: '🌷', personality: ['安靜', '敏銳', '喜歡小動物'],
    homePosition: [23, 0, 22], workPosition: [13, 0, 20], leisurePosition: [18, 0, 15], rainPosition: [17, 0, 19],
    outdoorTopic: '照顧花園與小動物', morningTopic: '早上的露水會告訴我植物昨晚過得好不好。', afternoonTopic: '別急著修剪，先看植物想往哪裡長。', eveningTopic: '晚霞的顏色很適合記錄花期。',
    giftPreferences: { loved: ['seed_09', 'seed_08'], liked: ['seed_10', 'mat_glow_spore'], disliked: ['mat_ancient_gear'] },
    events: [
      { id: 'resident_02_event_1', affinity: 20, title: '受傷的小兔', summary: '你和露露照顧一隻迷路的小兔子。' },
      { id: 'resident_02_event_2', affinity: 50, title: '四季花圃', summary: '花園依季節換上不同植物。' },
      { id: 'resident_02_event_3', affinity: 80, title: '守護夥伴花園', summary: '露露為你的動物夥伴建立專屬休息區。' },
    ],
  }),
  vendor_helper: resident({
    id: 'vendor_helper', name: '市場助手凱伊', role: '市場管理員', emoji: '📦', personality: ['勤快', '精準', '擅長整理'],
    homePosition: [14, 0, 3], workPosition: [21, 0, 1], leisurePosition: [18, 0, 7], rainPosition: [19, 0, 2],
    outdoorTopic: '整理今日貨架', morningTopic: '先進先出，商品才不會浪費。', afternoonTopic: '你的出貨會影響明天的貨架。', eveningTopic: '收攤前最後一次盤點最重要。',
    giftPreferences: { loved: ['mat_cloth', 'mat_cheese'], liked: ['seed_04', 'seed_05'], disliked: ['mat_stone'] },
    events: [
      { id: 'vendor_helper_event_1', affinity: 20, title: '第一次盤點', summary: '凱伊教你用分類提高整理速度。' },
      { id: 'vendor_helper_event_2', affinity: 50, title: '市場缺貨', summary: '你協助補足村民真正需要的商品。' },
      { id: 'vendor_helper_event_3', affinity: 80, title: '週末大市集', summary: '凱伊邀請你共同規劃大型市集。' },
    ],
  }),
};

export const VILLAGE_RESIDENT_IDS = Object.freeze(Object.keys(VILLAGE_RESIDENT_PROFILES));

export function getVillageResidentProfile(id) {
  return VILLAGE_RESIDENT_PROFILES[id] || null;
}

export function getVillageWeekday(dayIndex = 1) {
  const index = ((Math.max(1, Number(dayIndex) || 1) - 1) % 7 + 7) % 7;
  return { index, label: DAYS[index] };
}
