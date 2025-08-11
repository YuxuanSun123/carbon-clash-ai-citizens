// import { useState } from 'react';

interface DiceRollerProps {
  onRoll: (value: number) => void;
  diceModifier?: number;
}

const DiceRoller = ({ onRoll, diceModifier = 0 }: DiceRollerProps) => {
  // const [customSteps, setCustomSteps] = useState<string>('');

  const handleRoll = () => {
    let finalRoll;
    
    if (diceModifier === -999) {
      // 公交出行：只能投出1,3,5,7点数
      const busRolls = [1, 3, 5, 7];
      finalRoll = busRolls[Math.floor(Math.random() * busRolls.length)];
      console.log(`人类玩家使用公交出行，掷出 ${finalRoll} 点`);
    } else {
      const baseRoll = Math.floor(Math.random() * 6) + 1;
      finalRoll = Math.max(1, Math.min(6, baseRoll + diceModifier)); // 应用骰子修改器，限制在1-6范围内
      console.log(`人类玩家掷出 ${baseRoll} 点 (修改器: ${diceModifier > 0 ? '+' : ''}${diceModifier}) = ${finalRoll} 点`);
    }
    
    onRoll(finalRoll);
  };

  // const handleCustomMove = () => {
  //   const steps = parseInt(customSteps);
  //   if (steps >= 1 && steps <= 40) {
  //     onRoll(steps);
  //     setCustomSteps('');
  //   }
  // };

  return (
    <div className="flex items-center gap-4">
      {/* 骰子按钮 */}
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
            Roll Dice
          </span>
        </div>
      </button>

      {/* 自定义步数输入 - 已注释 */}
      {/* <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="40"
          value={customSteps}
          onChange={(e) => setCustomSteps(e.target.value)}
          placeholder="步数"
          className="w-16 px-2 py-1 bg-slate-800/50 border border-slate-600/50 text-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/25"
        />
        <button
          onClick={handleCustomMove}
          disabled={!customSteps || parseInt(customSteps) < 1 || parseInt(customSteps) > 40}
          className="px-3 py-1 bg-gradient-to-r from-purple-500/30 to-pink-600/30 border border-purple-400/50 text-purple-300 font-semibold rounded-lg text-sm hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          移动
        </button>
      </div> */}
    </div>
  );
};

export default DiceRoller;
