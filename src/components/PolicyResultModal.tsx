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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)'
    }}>
      <div className="bg-gradient-to-br from-green-800 via-emerald-900 to-green-800 p-6 rounded-2xl shadow-2xl max-w-lg mx-4 border border-green-400/30 backdrop-blur-md animate-bounce">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 animate-pulse">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ color: '#ffffff' }}>政策投票结果</h2>
          <div className="text-green-300 text-lg font-semibold mb-2" style={{ color: '#059669' }}>{policy.name}</div>
          <p className="text-gray-300 text-sm leading-relaxed" style={{ color: '#6b7280' }}>{policy.description}</p>
        </div>
        
        {/* 获胜选项 */}
        <div className="bg-green-900/40 backdrop-blur-sm p-4 rounded-xl mb-4 border border-green-400/30" style={{
          backgroundColor: 'rgba(220, 252, 231, 0.9)',
          borderColor: 'rgba(34, 197, 94, 0.5)'
        }}>
          <div className="flex items-center justify-center mb-3">
            <div className="text-yellow-400 text-2xl mr-2">👑</div>
            <h3 className="text-lg font-bold text-green-300" style={{ color: '#059669' }}>获胜政策</h3>
          </div>
          
          <div className="bg-green-800/50 p-4 rounded-lg border border-green-400/20" style={{
            backgroundColor: 'rgba(240, 253, 244, 0.8)',
            borderColor: 'rgba(34, 197, 94, 0.3)'
          }}>
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium text-white text-lg" style={{ color: '#1f2937' }}>{winningChoice.text}</div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-300 font-bold text-lg" style={{ color: '#ea580c' }}>🗳️ {winningVotes}</span>
                <span className="text-green-400 text-lg" style={{ color: '#059669' }}>👑</span>
              </div>
            </div>
            <div className="text-cyan-300 font-medium" style={{ color: '#0891b2' }}>
              效果: {getEffectText(winningChoice.effects)}
            </div>
            <div className="mt-2">
              <div className="w-full bg-green-700 rounded-full h-2" style={{ backgroundColor: '#d1d5db' }}>
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(winningVotes / totalPlayers) * 100}%`,
                    backgroundColor: '#f97316'
                  }}
                ></div>
              </div>
              <div className="text-green-200 text-sm mt-1 text-center" style={{ color: '#374151' }}>
                {winningVotes} / {totalPlayers} 票 ({Math.round((winningVotes / totalPlayers) * 100)}%)
              </div>
            </div>
          </div>
        </div>
        
        {/* 所有选项的投票结果 */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl mb-4 border border-gray-300/50" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(156, 163, 175, 0.6)'
        }}>
          <h3 className="text-sm font-semibold text-gray-800 mb-3" style={{ color: '#1f2937' }}>完整投票结果：</h3>
          <div className="space-y-2">
            {policy.choices.map((choice, index) => {
              const choiceVotes = votes[index] || 0;
              const isWinner = index === winningChoiceIndex;
              
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isWinner 
                      ? 'border-green-500/70 bg-green-100/80' 
                      : 'border-gray-400/50 bg-gray-100/60'
                  }`}
                  style={{
                    backgroundColor: isWinner ? 'rgba(220, 252, 231, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                    borderColor: isWinner ? 'rgba(34, 197, 94, 0.7)' : 'rgba(156, 163, 175, 0.5)'
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className={`font-medium ${
                      isWinner ? 'text-green-600' : 'text-gray-800'
                    }`} style={{
                      color: isWinner ? '#059669' : '#1f2937'
                    }}>
                      {isWinner && '👑 '}{choice.text}
                    </div>
                    <span className={`font-bold ${
                      isWinner ? 'text-orange-600' : 'text-gray-700'
                    }`} style={{
                      color: isWinner ? '#ea580c' : '#374151'
                    }}>
                      🗳️ {choiceVotes}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-1" style={{ backgroundColor: '#d1d5db' }}>
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${
                        isWinner ? 'bg-orange-500' : 'bg-gray-600'
                      }`}
                      style={{ 
                        width: `${totalPlayers > 0 ? (choiceVotes / totalPlayers) * 100 : 0}%`,
                        backgroundColor: isWinner ? '#f97316' : '#4b5563'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="text-center mb-4">
          <div className="text-green-300 text-sm" style={{ color: '#059669' }}>
            💫 政策效果已应用到所有玩家
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          style={{ backgroundColor: '#059669', color: '#ffffff' }}
        >
          继续游戏
        </button>
      </div>
    </div>
  );
};

export default PolicyResultModal;