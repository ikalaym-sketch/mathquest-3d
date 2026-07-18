// 正式 UI SVG 圖示集：取代主要操作上的 Emoji，確保跨平台尺寸與語意一致。
const PATHS = {
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></>,
  bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6l-7-3Z" /></>,
  book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></>,
  spark: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" /></>,
  coin: <><circle cx="12" cy="12" r="9" /><path d="M9 8h4.5a2.5 2.5 0 0 1 0 5H10a2.5 2.5 0 0 0 0 5h5M12 6v12" /></>,
  tower: <><path d="M6 21V8l2-2 2 2 2-2 2 2 2-2 2 2v13H6Z" /><path d="M9 21v-5h6v5M8 12h2M14 12h2" /></>,
  accessibility: <><circle cx="12" cy="4" r="2" /><path d="M5 8h14M12 6v7M8 21l4-8 4 8M7 11l5 2 5-2" /></>,
  companion: <><path d="M8 13c-2.6 0-4.5 1.8-4.5 4S5.3 21 8 21c1.7 0 3-.8 4-2 1 1.2 2.3 2 4 2 2.7 0 4.5-1.8 4.5-4S18.6 13 16 13c-1.5 0-2.8.6-4 1.7C10.8 13.6 9.5 13 8 13Z"/><circle cx="7" cy="8" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="17" cy="8" r="2"/></>,
  people: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M14 15.5A5 5 0 0 1 21 20v1"/></>,
};

export default function GameIcon({ name, size = 24, className = '', label = null }) {
  return (
    <svg role={label ? 'img' : 'presentation'} aria-label={label || undefined} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[name] || PATHS.spark}
    </svg>
  );
}
