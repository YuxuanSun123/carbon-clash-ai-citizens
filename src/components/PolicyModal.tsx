import type { PolicyChoice } from "../data/events";

interface PolicyModalProps {
  policy: PolicyChoice;
  onChoice: (choiceIndex: number) => void;
  onClose: () => void;
}

const PolicyModal = ({ policy, onChoice, onClose }: PolicyModalProps) => {
  const getEffectText = (effects: any) => {
    const parts = [];
    if (effects.money) {
      parts.push(`💰 ${effects.money > 0 ? '+' : ''}${effects.money}`);
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
    if (effects.moneyPerTurn) {
      parts.push(`💸 ${effects.moneyPerTurn > 0 ? '+' : ''}${effects.moneyPerTurn}/回合`);
    }
    return parts.join(' | ') || '无变化';
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
          <h2 className="text-2xl font-bold text-white mb-2">{policy.name}</h2>
          <p className="text-gray-300 text-sm leading-relaxed">{policy.description}</p>
        </div>
        
        <div className="space-y-3 mb-6">
          {policy.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => onChoice(index)}
              className="w-full p-4 text-left border-2 border-white/20 rounded-xl hover:border-purple-400 hover:bg-purple-500/20 transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
            >
              <div className="font-medium text-white mb-2">{choice.text}</div>
              <div className="text-sm text-cyan-300">
                效果: {getEffectText(choice.effects)}
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          跳过选择
        </button>
      </div>
    </div>
  );
};

export default PolicyModal;