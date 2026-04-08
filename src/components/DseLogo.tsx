const DseLogo = ({ size = 36 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="DSE Explorer logo"
  >
    <defs>
      <linearGradient id="dse-letter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="dse-ring" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="60%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Italic "e" letter — Explorer, IE-style */}
    <text
      x="5"
      y="40"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="38"
      fontStyle="italic"
      fontWeight="bold"
      fill="url(#dse-letter)"
    >
      e
    </text>

    {/* Orbital ring — tilted ellipse cutting across the letter */}
    <ellipse
      cx="23"
      cy="25"
      rx="21"
      ry="7.5"
      transform="rotate(-32 23 25)"
      fill="none"
      stroke="url(#dse-ring)"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>
);

export default DseLogo;
