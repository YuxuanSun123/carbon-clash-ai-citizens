interface DiceRollerProps {
  onRoll: (value: number) => void;
}

const DiceRoller = ({ onRoll }: DiceRollerProps) => {
  const handleRoll = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    onRoll(roll);
  };

  return (
    <button
      onClick={handleRoll}
      className="relative px-6 py-3 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 text-cyan-300 font-bold rounded-xl shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm overflow-hidden group"
    >
      {/* 光效动画 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="relative flex items-center gap-3">
        <span className="text-2xl transition-transform duration-300 filter drop-shadow-lg group-hover:rotate-12">
          🎲
        </span>
        <span className="text-base font-semibold">
          掷骰子
        </span>
      </div>
    </button>
  );
};

export default DiceRoller;
