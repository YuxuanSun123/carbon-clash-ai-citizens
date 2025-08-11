interface PlayerTokenProps {
  size?: "small" | "medium" | "large";
  playerType?: 'human' | 'ai-income' | 'ai-eco';
  playerId?: number;
}

const PlayerToken = ({ size = "medium", playerType = 'human' }: PlayerTokenProps) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-10 h-10"
  };

  const svgSize = {
    small: 24,
    medium: 32,
    large: 40
  };

  // Render different SVG shapes based on player type
  const renderPlayerSVG = () => {
    const currentSize = svgSize[size];
    
    if (playerType === 'human') {
      // Human: Round head with semicircle body, blue
      return (
        <svg width={currentSize} height={currentSize} viewBox="0 0 32 32" className="drop-shadow-lg">
          {/* Body - semicircle */}
          <path
            d="M8 20 Q8 16 16 16 Q24 16 24 20 L24 28 Q24 30 22 30 L10 30 Q8 30 8 28 Z"
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth="1"
          />
          {/* Head - circle */}
          <circle
            cx="16"
            cy="12"
            r="6"
            fill="#60A5FA"
            stroke="#1E40AF"
            strokeWidth="1"
          />
          {/* Eyes */}
          <circle cx="13" cy="10" r="1" fill="white" />
          <circle cx="19" cy="10" r="1" fill="white" />
          {/* Mouth */}
          <path d="M13 14 Q16 16 19 14" stroke="white" strokeWidth="1" fill="none" />
        </svg>
      );
    } else if (playerType === 'ai-income') {
      // Business AI: Square head with rectangle body, yellow
      return (
        <svg width={currentSize} height={currentSize} viewBox="0 0 32 32" className="drop-shadow-lg">
          {/* Body - rectangle */}
          <rect
            x="10"
            y="18"
            width="12"
            height="12"
            rx="2"
            fill="#EAB308"
            stroke="#A16207"
            strokeWidth="1"
          />
          {/* Head - square */}
          <rect
            x="11"
            y="6"
            width="10"
            height="10"
            rx="1"
            fill="#FDE047"
            stroke="#A16207"
            strokeWidth="1"
          />
          {/* Eyes - square */}
          <rect x="13" y="9" width="2" height="2" fill="#A16207" />
          <rect x="17" y="9" width="2" height="2" fill="#A16207" />
          {/* Mouth - line */}
          <rect x="14" y="13" width="4" height="1" fill="#A16207" />
          {/* Antenna */}
          <line x1="16" y1="6" x2="16" y2="3" stroke="#A16207" strokeWidth="1" />
          <circle cx="16" cy="3" r="1" fill="#EAB308" />
        </svg>
      );
    } else if (playerType === 'ai-eco') {
      // Eco AI: Square head with rectangle body, green
      return (
        <svg width={currentSize} height={currentSize} viewBox="0 0 32 32" className="drop-shadow-lg">
          {/* 身体 - 长方形 */}
          <rect
            x="10"
            y="18"
            width="12"
            height="12"
            rx="2"
            fill="#16A34A"
            stroke="#14532D"
            strokeWidth="1"
          />
          {/* 头部 - 正方形 */}
          <rect
            x="11"
            y="6"
            width="10"
            height="10"
            rx="1"
            fill="#22C55E"
            stroke="#14532D"
            strokeWidth="1"
          />
          {/* 眼睛 - 方形 */}
          <rect x="13" y="9" width="2" height="2" fill="#14532D" />
          <rect x="17" y="9" width="2" height="2" fill="#14532D" />
          {/* 嘴巴 - 直线 */}
          <rect x="14" y="13" width="4" height="1" fill="#14532D" />
          {/* 天线 */}
          <line x1="16" y1="6" x2="16" y2="3" stroke="#14532D" strokeWidth="1" />
          <circle cx="16" cy="3" r="1" fill="#16A34A" />
          {/* Leaf decoration */}
          <path d="M14 4 Q12 2 14 1 Q16 2 14 4" fill="#22C55E" />
        </svg>
      );
    }
    
    return null;
  };

  return (
    <div className={`
      ${sizeClasses[size]}
      flex items-center justify-center
      transform transition-transform duration-300
    `}>
      {renderPlayerSVG()}
    </div>
  );
};

export default PlayerToken;
