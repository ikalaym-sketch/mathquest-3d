// 正式繁體中文介面字典。Runtime 介面不得再直接混用英文操作詞。
const ZH_TW = {
  common: { close: '關閉', confirm: '確認', cancel: '取消', continue: '繼續', retry: '再試一次', completed: '已完成', locked: '尚未解鎖' },
  boss: { sealTitle: '守護者封印', sealHint: '三題中答對指定題數即可完成封印', sealed: '封印成功', stunned: '破綻出現', attackHint: '閃避預警範圍，趁技能結束後反擊' },
  tower: { title: '試煉之塔', floor: '第 {floor} 層', highest: '最高 {floor} 層', portalOpen: '傳送門已開啟', inProgress: '挑戰進行中', exit: '離開並保存', milestone: '下一個里程碑：第 {floor} 層' },
  report: { title: '學習成長報告', noData: '完成場景挑戰後，這裡會顯示你的學習紀錄。', weakest: '建議加強', attempts: '次練習' },
};

export function t(path, params = {}) {
  const value = path.split('.').reduce((current, key) => current?.[key], ZH_TW) || path;
  return String(value).replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
}

export default ZH_TW;
