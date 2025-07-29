import type { PolicyChoice } from "../data/events";

interface PolicyModalProps {
  policy: PolicyChoice;
  onChoice: (choiceIndex: number) => void;
  onClose: () => void;
}

const PolicyModal = ({ policy, onChoice, onClose }: PolicyModalProps) => {
  const getEffectText = (effects: { money?: number; co2?: number; eco?: number }) => {
    const parts: string[] = [];
    
    if (effects.money) {
      parts.push(`💰 ${effects.money > 0 ? '+' : ''}${effects.money}`);
    }
    if (effects.co2) {
      parts.push(`🏭 ${effects.co2 > 0 ? '+' : ''}${effects.co2}`);
    }
    if (effects.eco) {
      parts.push(`🌱 ${effects.eco > 0 ? '+' : ''}${effects.eco}`);
    }
    
    return parts.join(' | ') || '无变化';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg mx-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{policy.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{policy.name}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{policy.description}</p>
        </div>
        
        <div className="space-y-3 mb-6">
          {policy.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => onChoice(index)}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="font-medium text-gray-800 mb-2">{choice.text}</div>
              <div className="text-sm text-gray-600">
                效果: {getEffectText(choice.effects)}
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          跳过选择
        </button>
      </div>
    </div>
  );
};

export default PolicyModal;