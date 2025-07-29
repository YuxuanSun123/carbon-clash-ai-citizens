interface PlayerTokenProps {
  size?: "small" | "medium" | "large";
}

const PlayerToken = ({ size = "medium" }: PlayerTokenProps) => {
  const sizeClasses = {
    small: "w-6 h-6 text-sm",
    medium: "w-8 h-8 text-lg",
    large: "w-10 h-10 text-xl"
  };

  return (
    <div className={`
      ${sizeClasses[size]}
      bg-gradient-to-br from-blue-400 to-blue-600
      rounded-full flex items-center justify-center
      shadow-lg border-2 border-white
      animate-pulse
      transform transition-transform duration-300
    `}>
      <span className="text-white font-bold">🧍</span>
    </div>
  );
};

export default PlayerToken;
