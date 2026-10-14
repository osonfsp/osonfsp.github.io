// Yagona uslubdagi chiziqli ikonlar (Lucide uslubida, 24×24, stroke).
// Emoji har qurilmada har xil ko‘rinadi — menyu va tugmalarda shular ishlatiladi.
const P = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 3H4a1 1 0 0 0-1 1v5a5 5 0 0 0 10 0V4a1 1 0 0 0-1-1h-1" />
      <path d="M8 14v1a6 6 0 0 0 12 0v-3" />
      <circle cx="20" cy="10" r="2" />
    </>
  ),
  chat: (
    <>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth="2.6" />
    </>
  ),
  pen: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
      <path d="M8 13h5M8 17h8" />
      <path d="M19.5 2.5a1.6 1.6 0 0 1 2.3 2.3L15 11.5l-3 .8.8-3 6.7-6.8Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 22h13v-4" />
      <path d="M9 7h6" />
    </>
  ),
  quote: (
    <>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  swap: (
    <>
      <path d="M17 3l4 4-4 4" />
      <path d="M21 7H8a4 4 0 0 0-4 4" />
      <path d="M7 21l-4-4 4-4" />
      <path d="M3 17h13a4 4 0 0 0 4-4" />
    </>
  ),
  info: (
    <>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />
      <path d="M12 8h.01" strokeWidth="2.6" />
      <path d="M12 11v4.5" />
    </>
  ),
  headphones: (
    <>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1v-6h3v4ZM3 19a2 2 0 0 0 2 2h1v-6H3v4Z" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M6 15h4" />
    </>
  ),
  landmark: (
    <>
      <path d="M3 21h18M5 18V10M9.5 18V10M14.5 18V10M19 18V10" />
      <path d="M12 3l9 5H3l9-5Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  send: (
    <>
      <path d="M21.5 2.5 10.5 13.5" />
      <path d="M21.5 2.5 14.5 21.5l-4-8-8-4 19-7Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  login: (
    <>
      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </>
  ),
  flame: (
    <path d="M12 22c4 0 7-2.7 7-6.8 0-3.2-2-5.6-3.6-7.4-.4 1.8-1.4 3-2.6 3.4.3-3.4-1.3-6.6-4.3-8.7.2 3.3-1.6 5.5-3.1 7.3C4.3 11.1 5 13 5 15.2 5 19.3 8 22 12 22Z" />
  ),
  mic: (
    <>
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="11" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21.5h4" />
      <path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.6.5 1 1.3 1 2.1V16h6v-.2c0-.8.4-1.6 1-2.1A6.5 6.5 0 0 0 12 2.5Z" />
    </>
  ),
  bug: (
    <>
      <rect x="7" y="8" width="10" height="13" rx="5" />
      <path d="M12 12v9M9 8V7a3 3 0 0 1 6 0v1M3 13.5h4M17 13.5h4M4 7l3 2.5M20 7l-3 2.5M4 20l3-2.5M20 20l-3-2.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 6-6M15 7h5v5" />
    </>
  ),
  volume: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 6 6M22 9l-6 6" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.6 3.5M6.6 6.6C3.8 8.3 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L3.5 8.5M3.5 3.5v5h5" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9l2.2-2.4M20.5 20.5v-5h-5" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </>
  ),
  sparkles: (
    <>
      <path d="M11 3l1.8 4.7 4.7 1.8-4.7 1.8L11 16l-1.8-4.7-4.7-1.8 4.7-1.8Z" />
      <path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
      <path d="M12 17h.01" strokeWidth="2.6" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 2.4 17.5a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4" />
      <path d="M12 17h.01" strokeWidth="2.6" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16 10" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  star: <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  doctor: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      <path d="M12 15v4M10 17h4" />
    </>
  ),
  dice: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01" strokeWidth="2.8" />
    </>
  ),
  cards: (
    <>
      <rect x="3" y="7" width="14" height="14" rx="2" />
      <path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="2.5" width="8" height="4" rx="1" />
      <path d="M16 4.5h2a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2" />
      <path d="M8.5 12h7M8.5 16h5" />
    </>
  ),
  file: (
    <>
      <path d="M14 2.5H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5Z" />
      <path d="M14 2.5v6h6M8 13h8M8 17h6" />
    </>
  ),
  pointer: (
    <path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10m0-.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6.5 6.5 0 0 1-6.5 6.5h-.8a6 6 0 0 1-4.6-2.1L4.4 16a1.6 1.6 0 0 1 2.4-2.1L9 16" />
  ),
  translate: (
    <>
      <path d="M3 5h9M7.5 3v2M5 5c.7 3 3 5.5 6 6.5M10 5c-.6 3.5-3 6.5-6.5 8" />
      <path d="m12 21 4.5-10 4.5 10M13.5 17.5h6" />
    </>
  ),
  waves: <path d="M3 12h1M7 8v8M11 5v14M15 8v8M19 10.5v3" />,
  heart: <path d="M12 20.5s-8.5-5-8.5-11A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.5 3c0 6-8.5 11-8.5 11Z" />,
  wind: <path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7" />,
  utensils: (
    <>
      <path d="M7 2.5v19M4 2.5v5a3 3 0 0 0 6 0v-5" />
      <path d="M17 21.5V2.5c-2.5 1.5-4 4.5-4 8v3h4" />
    </>
  ),
  droplet: <path d="M12 2.5s-7 7.6-7 12.5a7 7 0 0 0 14 0c0-4.9-7-12.5-7-12.5Z" />,
  flask: (
    <>
      <path d="M9 2.5h6M10 2.5V9l-5.6 9.7a2 2 0 0 0 1.7 2.8h11.8a2 2 0 0 0 1.7-2.8L14 9V2.5" />
      <path d="M7 15h10" />
    </>
  ),
  virus: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 2.5V7M12 17v4.5M2.5 12H7M17 12h4.5M5.3 5.3l3.2 3.2M15.5 15.5l3.2 3.2M5.3 18.7l3.2-3.2M15.5 8.5l3.2-3.2" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.1 8.1 20 20M8.1 15.9 20 4" />
    </>
  ),
  bone: (
    <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" />
  ),
  brain: (
    <>
      <path d="M12 5.5A2.5 2.5 0 0 0 9.5 3a3 3 0 0 0-3 3A3 3 0 0 0 4 10.5a3.5 3.5 0 0 0 1 6A3 3 0 0 0 9.5 20a2.5 2.5 0 0 0 2.5-2Z" />
      <path d="M12 5.5A2.5 2.5 0 0 1 14.5 3a3 3 0 0 1 3 3 3 3 0 0 1 2.5 4.5 3.5 3.5 0 0 1-1 6A3 3 0 0 1 14.5 20a2.5 2.5 0 0 1-2.5-2" />
    </>
  ),
  kidney: (
    <>
      <path d="M15 3c3.5 0 5.5 3.6 5.5 8.7s-2 8.8-5.5 8.8c-3 0-5-2.1-5-4.6 0-2 2-2.6 2-4.1s-2-2.1-2-4.1C10 5.1 12 3 15 3Z" />
      <path d="M11.5 12H8a4 4 0 0 0-4 4v5.5" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  hospital: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2.5 21h19" />
      <path d="M12 7v6M9 10h6M10 21v-4h4v4" />
    </>
  ),
};

// Matn ichidagi kichik ikon (emoji o‘rniga): shrift o‘lchamiga moslashadi
export function Ic({ name, className = "" }) {
  return (
    <Icon name={name} className={`inline-block h-[1.1em] w-[1.1em] shrink-0 align-[-0.18em] ${className}`} />
  );
}

export function Icon({ name, className = "h-5 w-5", strokeWidth = 1.8, title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {P[name]}
    </svg>
  );
}

// Brend belgisi: stetoskop halqasi + gap pufakchasi (shifokor nutqi)
export function LogoMark({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0e7490" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lm-g)" />
      <path
        d="M30 19.5a9.5 9.5 0 0 1-13.8 8.5L10 29.5l1.6-5.6A9.5 9.5 0 1 1 30 19.5Z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 19.5h2.6l1.6-3.6 2.6 7.2 1.6-3.6h2.6"
        fill="none"
        stroke="#ccfbf1"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
