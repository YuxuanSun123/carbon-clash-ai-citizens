import type { PolicyChoice } from '../data/events';

interface PolicyResultModalProps {
  policy: PolicyChoice;
  winningChoiceIndex: number;
  votes: Record<number, number>;
  totalPlayers: number;
  onClose: () => void;
}

const PolicyResultModal = ({ 
  policy, 
  winningChoiceIndex, 
  votes, 
  totalPlayers, 
  onClose 
}: PolicyResultModalProps) => {
  const winningChoice = policy.choices[winningChoiceIndex];
  const winningVotes = votes[winningChoiceIndex] || 0;

  const getEffectText = (effects: any) => {
    const parts = [];
    if (effects.money !== undefined) {
      if (effects.money === -0.1) {
        parts.push(`💰 -10%`);
      } else {
        parts.push(`💰 ${effects.money > 0 ? '+' : ''}${effects.money}`);
      }
    }
    if (effects.moneyPercentage) {
      parts.push(`💰 ${effects.moneyPercentage > 0 ? '+' : ''}${effects.moneyPercentage}%`);
    }
    if (effects.co2) {
      parts.push(`🏭 ${effects.co2 > 0 ? '+' : ''}${effects.co2}`);
    }
    if (effects.eco) {
      parts.push(`🌱 ${effects.eco > 0 ? '+' : ''}${effects.eco}`);
    }
    if (effects.diceModifier) {
      parts.push(`🎲 ${effects.diceModifier > 0 ? '+' : ''}${effects.diceModifier}`);
    }
    if (effects.co2PerTurn) {
      parts.push(`🔄 ${effects.co2PerTurn > 0 ? '+' : ''}${effects.co2PerTurn}/回合`);
    }
    if (effects.moneyPerTurn !== undefined) {
      if (effects.moneyPerTurn === 0.15) {
        parts.push(`💸 +15%收入/回合`);
      } else {
        parts.push(`💸 ${effects.moneyPerTurn > 0 ? '+' : ''}${effects.moneyPerTurn}/回合`);
      }
    }
    return parts.join(' | ') || '无变化';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-green-800 via-emerald-900 to-green-800 p-6 rounded-2xl shadow-2xl max-w-lg mx-4 border border-green-400/30 backdrop-blur-md animate-bounce">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 animate-pulse">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-2">政策投票结果</h2>
          <div className="text-green-300 text-lg font-semibold mb-2">{policy.name}</div>
          <p className="text-gray-300 text-sm leading-relaxed">{policy.description}</p>
        </div>
        
        {/* 获胜选项 */}
        <div className="bg-green-900/40 backdrop-blur-sm p-4 rounded-xl mb-4 border border-green-400/30">
          <div className="flex items-center justify-center mb-3">
            <div className="text-yellow-400 text-2xl mr-2">👑</div>
            <h3 className="text-lg font-bold text-green-300">获胜政策</h3>
          </div>
          
          <div className="bg-green-800/50 p-4 rounded-lg border border-green-400/20">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium text-white text-lg">{winningChoice.text}</div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-300 font-bold text-lg">🗳️ {winningVotes}</span>
                <span className="text-green-400 text-lg">👑</span>
              </div>
            </div>
            <div className="text-cyan-300 font-medium">
              效果: {getEffectText(winningChoice.effects)}
            </div>
            <div className="mt-2">
              <div className="w-full bg-green-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(winningVotes / totalPlayers) * 100}%` }}
                ></div>
              </div>
              <div className="text-green-200 text-sm mt-1 text-center">
                {winningVotes} / {totalPlayers} 票 ({Math.round((winningVotes / totalPlayers) * 100)}%)
              </div>
            </div>
          </div>
        </div>
        
        {/* 所有选项的投票结果 */}
        <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl mb-4 border border-white/10">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3">完整投票结果：</h3>
          <div className="space-y-2">
            {policy.choices.map((choice, index) => {
              const choiceVotes = votes[index] || 0;
              const isWinner = index === winningChoiceIndex;
              
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isWinner 
                      ? 'border-green-400/50 bg-green-500/20' 
                      : 'border-gray-500/30 bg-gray-500/10'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className={`font-medium ${
                      isWinner ? 'text-green-300' : 'text-gray-300'
                    }`}>
                      {isWinner && '👑 '}{choice.text}
                    </div>
                    <span className={`font-bold ${
                      isWinner ? 'text-yellow-300' : 'text-gray-400'
                    }`}>
                      🗳️ {choiceVotes}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${
                        isWinner ? 'bg-yellow-400' : 'bg-gray-500'
                      }`}
                      style={{ width: `${totalPlayers > 0 ? (choiceVotes / totalPlayers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="text-center mb-4">
          <div className="text-green-300 text-sm">
            💫 政策效果已应用到所有玩家
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          继续游戏
        </button>
      </div>
    </div>
  );
};

export default PolicyResultModal;