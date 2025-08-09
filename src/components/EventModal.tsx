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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 via-blue-900 to-slate-800 p-6 rounded-2xl shadow-2xl max-w-md mx-4 border border-white/20 backdrop-blur-md animate-bounce">
        <div className="text-center mb-4">
          <div className="text-6xl mb-2 animate-pulse">{event.icon}</div>
          <h2 className="text-2xl font-bold text-white mb-2">{event.name}</h2>
          <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
        </div>
        
        <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl mb-4 border border-white/10">
          <h3 className="text-sm font-semibold text-cyan-400 mb-2">效果：</h3>
          <p className="text-sm text-white font-medium">{getEffectText(event.effects)}</p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          确定
        </button>
      </div>
    </div>
  );
};

export default EventModal;