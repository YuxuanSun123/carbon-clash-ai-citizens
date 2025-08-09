import React from 'react';

interface TransportChoice {
  id: string;
  name: string;
  description: string;
  icon: string;
  effects: {
    diceModifier: number;
    co2PerTurn?: number;
    moneyPerTurn?: number;
  };
}

interface TransportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (choiceIndex: number) => void;
  playerName: string;
}

const transportChoices: TransportChoice[] = [
  {
    id: "walking",
    name: "步行出行",
    description: "最基础的出行方式，无额外效果",
    icon: "🚶",
    effects: { diceModifier: 0 }
  },
  {
    id: "bicycle",
    name: "自行车出行",
    description: "灵活的出行方式，稍微提升移动能力",
    icon: "🚲",
    effects: { diceModifier: 1, moneyPerTurn: -5 }
  },
  {
    id: "car",
    name: "汽车出行",
    description: "快速但高污染的出行方式",
    icon: "🚗",
    effects: { diceModifier: 2, co2PerTurn: 5, moneyPerTurn: -10 }
  },
  {
    id: "bus",
    name: "公交出行",
    description: "特殊移动模式，只能移动奇数步数",
    icon: "🚌",
    effects: { diceModifier: -999, moneyPerTurn: -3 }
  }
];

const TransportModal: React.FC<TransportModalProps> = ({ isOpen, onClose, onChoose, playerName }) => {
  if (!isOpen) return null;

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
      <div className="bg-gradient-to-br from-slate-800 via-blue-900 to-slate-800 p-6 rounded-2xl shadow-2xl max-w-2xl mx-4 border border-white/20 backdrop-blur-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🅿️</div>
          <h2 className="text-2xl font-bold text-white mb-2">免费停车场</h2>
          <p className="text-gray-300">{playerName}，选择你的出行方式</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {transportChoices.map((choice, index) => (
            <button
              key={choice.id}
              onClick={() => onChoose(index)}
              className="p-4 bg-gradient-to-br from-slate-700/80 to-slate-800/80 rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-lg text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl group-hover:scale-110 transition-transform">{choice.icon}</span>
                <h3 className="text-lg font-semibold text-white">{choice.name}</h3>
              </div>
              
              <p className="text-gray-300 text-sm mb-3">{choice.description}</p>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">移动能力:</span>
                  <span className={`font-semibold ${
                    choice.effects.diceModifier > 0 ? 'text-green-400' :
                    choice.effects.diceModifier < 0 ? 'text-blue-400' : 'text-gray-300'
                  }`}>
                    {choice.effects.diceModifier === -999 ? '特殊模式' :
                     choice.effects.diceModifier > 0 ? `+${choice.effects.diceModifier}` :
                     choice.effects.diceModifier === 0 ? '标准' : choice.effects.diceModifier}
                  </span>
                </div>
                
                {choice.effects.co2PerTurn && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">每回合CO2:</span>
                    <span className="text-red-400 font-semibold">+{choice.effects.co2PerTurn}</span>
                  </div>
                )}
                
                {choice.effects.moneyPerTurn && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">每回合费用:</span>
                    <span className="text-yellow-400 font-semibold">{choice.effects.moneyPerTurn}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div className="text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransportModal;
export { transportChoices };
export type { TransportChoice };