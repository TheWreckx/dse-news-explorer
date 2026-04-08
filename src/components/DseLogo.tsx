const DseLogo = ({ size = 40 }: { size?: number }) => {
  // Keep aspect ratio: viewBox is 88 wide × 36 tall
  const width = size * (88 / 36);
  const height = size;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 88 36"
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
          <stop offset="50%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Italic "DSE" letters */}
      <text
        x="4"
        y="30"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="30"
        fontStyle="italic"
        fontWeight="bold"
        fill="url(#dse-letter)"
        letterSpacing="1"
      >
        DSE
      </text>

      {/* Orbital ring — tilted ellipse sweeping across the letters */}
      <ellipse
        cx="44"
        cy="18"
        rx="41"
        ry="9"
        transform="rotate(-28 44 18)"
        fill="none"
        stroke="url(#dse-ring)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default DseLogo;
