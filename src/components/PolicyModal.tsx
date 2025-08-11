import type { PolicyChoice } from "../data/events";

interface PolicyModalProps {
  policy: PolicyChoice;
  onChoice: (choiceIndex: number) => void;
  onClose: () => void;
  // Multi-player voting related props
  votingInProgress?: boolean;
  playerVotes?: Record<number, number>;
  votedPlayers?: Set<number>;
  totalPlayers?: number;
  currentPlayerId?: number;
  players?: Array<{id: number, name: string, type: string}>;
  currentVotingPlayerId?: number;
}

const PolicyModal = ({ 
  policy, 
  onChoice, 
  onClose, 
  votingInProgress = false,
  playerVotes = {},
  votedPlayers = new Set(),
  totalPlayers = 1,
  currentPlayerId = 0,
  players = [],
  currentVotingPlayerId
}: PolicyModalProps) => {
  const getEffectText = (effects: any) => {
    const parts = [];
    if (effects.money !== undefined) {
      if (effects.money === -0.1) {
        parts.push(`💰 -10%`);
      } else {
        parts.push(`💰 ${effects.money > 0 ? '+' : ''}${effects.money}`);
      }
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
      parts.push(`🔄 ${effects.co2PerTurn > 0 ? '+' : ''}${effects.co2PerTurn}/turn`);
    }
    if (effects.moneyPerTurn !== undefined) {
      if (effects.moneyPerTurn === 0.15) {
        parts.push(`💸 +15% income/turn`);
      } else {
        parts.push(`💸 ${effects.moneyPerTurn > 0 ? '+' : ''}${effects.moneyPerTurn}/turn`);
      }
    }
    return parts.join(' | ') || 'No change';
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{
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
      }}
    >
      <div className="bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 p-6 rounded-2xl shadow-2xl max-w-lg mx-4 border border-white/20 backdrop-blur-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 animate-pulse">{policy.icon}</div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ color: '#ffffff' }}>{policy.name}</h2>
          <p className="text-gray-300 text-sm leading-relaxed" style={{ color: '#d1d5db' }}>{policy.description}</p>
          
          {/* Voting progress display */}
          {votingInProgress && (
            <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-400/30" style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgba(96, 165, 250, 0.4)'
            }}>
              <div className="text-blue-300 text-sm font-medium mb-2" style={{ color: '#93c5fd' }}>
                🗳️ Multi-player voting in progress
              </div>
              <div className="text-blue-200 text-xs" style={{ color: '#bfdbfe' }}>
                Voted: {votedPlayers.size} / {totalPlayers} players
              </div>
              <div className="w-full bg-blue-800 rounded-full h-2 mt-2" style={{ backgroundColor: '#1e40af' }}>
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(votedPlayers.size / totalPlayers) * 100}%`,
                    backgroundColor: '#60a5fa'
                  }}
                ></div>
              </div>
              
              {/* Display current voting player */}
              {currentVotingPlayerId !== undefined && (
                <div className="mt-2 p-2 bg-yellow-900/30 rounded border border-yellow-400/30" style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  borderColor: 'rgba(251, 191, 36, 0.4)'
                }}>
                  <div className="text-yellow-300 text-xs font-medium" style={{ color: '#fcd34d' }}>
                    ⏳ Turn to vote: {players.find(p => p.id === currentVotingPlayerId)?.name || `Player ${currentVotingPlayerId}`}
                  </div>
                </div>
              )}
              
              {votedPlayers.has(currentPlayerId) && (
                <div className="text-green-300 text-xs mt-2" style={{ color: '#86efac' }}>
                  ✅ You have completed voting
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-3 mb-6">
          {policy.choices.map((choice, index) => {
            const voteCount = playerVotes[index] || 0;
            const isDisabled = votingInProgress && votedPlayers.has(currentPlayerId);
            
            return (
              <button
                key={index}
                onClick={() => onChoice(index)}
                disabled={isDisabled}
                className={`w-full p-4 text-left border-2 rounded-xl transition-all duration-300 backdrop-blur-sm ${
                  isDisabled 
                    ? 'border-gray-500/50 bg-gray-500/20 cursor-not-allowed opacity-60'
                    : 'border-white/20 hover:border-purple-400 hover:bg-purple-500/20 transform hover:scale-105'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-white" style={{ color: '#000000' }}>{choice.text}</div>
                  {votingInProgress && (
                    <div className="text-yellow-300 font-bold text-sm" style={{ color: '#b45309' }}>
                      🗳️ {voteCount}
                    </div>
                  )}
                </div>
                <div className="text-sm text-cyan-300" style={{ color: '#0891b2' }}>
                  Effects: {getEffectText(choice.effects)}
                </div>
              </button>
            );
          })}
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          style={{ backgroundColor: '#4b5563', color: '#ffffff' }}
        >
          Skip Choice
        </button>
      </div>
    </div>
  );
};

export default PolicyModal;