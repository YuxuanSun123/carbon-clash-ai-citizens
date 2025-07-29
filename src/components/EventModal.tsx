import type { GameEvent } from "../data/events";

interface EventModalProps {
  event: GameEvent;
  onClose: () => void;
}

const EventModal = ({ event, onClose }: EventModalProps) => {
  const getEffectText = (effects: GameEvent['effects']) => {
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
    if (effects.skipTurns) {
      parts.push(`⏸️ 跳过 ${effects.skipTurns} 回合`);
    }
    
    return parts.join(' | ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4 animate-pulse">
        <div className="text-center mb-4">
          <div className="text-6xl mb-2">{event.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{event.name}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">效果：</h3>
          <p className="text-sm text-gray-800">{getEffectText(event.effects)}</p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  );
};

export default EventModal;