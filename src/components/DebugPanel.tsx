import React, { useState } from 'react';
import type { Player } from '../hooks/useMultiPlayerGameState';

interface DebugPanelProps {
  players: Player[];
  turnCount: number;
  maxTurns: number;
  maxCO2: number;
  bankruptcyThreshold: number;
  onAddMoney: (playerId: number, amount: number) => void;
  onAddCO2: (playerId: number, amount: number) => void;
  onAddEco: (playerId: number, amount: number) => void;
  onSetTurn: (turn: number) => void;
  onTriggerGameEnd: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  players,
  turnCount,
  maxTurns,
  maxCO2,
  bankruptcyThreshold,
  onAddMoney,
  onAddCO2,
  onAddEco,
  onSetTurn,
  onTriggerGameEnd
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(0);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-purple-600/80 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium z-40 backdrop-blur-sm border border-purple-500/50"
      >
        🔧 调试面板
      </button>
    );
  }

  const totalCO2 = players.reduce((sum, p) => sum + p.co2, 0);

  return (
    <div className="fixed top-4 right-4 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl p-4 z-40 w-80 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">🔧 调试面板</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 游戏状态 */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-2">游戏状态</h4>
        <div className="space-y-1 text-xs text-gray-300">
          <div>回合: {turnCount}/{maxTurns}</div>
          <div>全球CO2: {totalCO2}/{maxCO2}</div>
          <div>破产线: {bankruptcyThreshold}</div>
        </div>
      </div>

      {/* 快速测试按钮 */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-2">快速测试</h4>
        <div className="space-y-2">
          <button
            onClick={() => onSetTurn(maxTurns)}
            className="w-full bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs transition-colors"
          >
            ⏰ 跳到最后回合
          </button>
          <button
            onClick={() => {
              players.forEach(p => {
                onAddCO2(p.id, Math.max(0, maxCO2 - totalCO2 + 10));
              });
            }}
            className="w-full bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded text-xs transition-colors"
          >
            💨 触发CO2超标
          </button>
          <button
            onClick={() => {
              const humanPlayer = players.find(p => p.type === 'human');
              if (humanPlayer) {
                onAddMoney(humanPlayer.id, -(humanPlayer.money - bankruptcyThreshold + 100));
              }
            }}
            className="w-full bg-orange-600/80 hover:bg-orange-600 text-white px-3 py-2 rounded text-xs transition-colors"
          >
            💸 触发破产
          </button>
          <button
            onClick={onTriggerGameEnd}
            className="w-full bg-purple-600/80 hover:bg-purple-600 text-white px-3 py-2 rounded text-xs transition-colors"
          >
            🏁 强制结束游戏
          </button>
        </div>
      </div>

      {/* 玩家选择 */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-white mb-2">选择玩家</label>
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(Number(e.target.value))}
          className="w-full bg-slate-800 border border-white/20 rounded px-3 py-2 text-white text-sm"
        >
          {players.map(player => (
            <option key={player.id} value={player.id}>
              {player.name} ({player.type})
            </option>
          ))}
        </select>
      </div>

      {/* 资源调整 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-300 mb-1">💰 金钱</label>
          <div className="flex gap-2">
            <button
              onClick={() => onAddMoney(selectedPlayer, -1000)}
              className="flex-1 bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              -1000
            </button>
            <button
              onClick={() => onAddMoney(selectedPlayer, 1000)}
              className="flex-1 bg-green-600/80 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              +1000
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">💨 CO2</label>
          <div className="flex gap-2">
            <button
              onClick={() => onAddCO2(selectedPlayer, -50)}
              className="flex-1 bg-green-600/80 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              -50
            </button>
            <button
              onClick={() => onAddCO2(selectedPlayer, 50)}
              className="flex-1 bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              +50
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">🌱 生态</label>
          <div className="flex gap-2">
            <button
              onClick={() => onAddEco(selectedPlayer, -10)}
              className="flex-1 bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              -10
            </button>
            <button
              onClick={() => onAddEco(selectedPlayer, 10)}
              className="flex-1 bg-green-600/80 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              +10
            </button>
          </div>
        </div>
      </div>

      {/* 当前选中玩家状态 */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-2">当前玩家状态</h4>
        {(() => {
          const player = players.find(p => p.id === selectedPlayer);
          if (!player) return null;
          return (
            <div className="space-y-1 text-xs text-gray-300">
              <div>💰 金钱: {player.money.toLocaleString()}</div>
              <div>💨 CO2: {player.co2}</div>
              <div>🌱 生态: {player.eco}</div>
              <div>🏗️ 建筑: {Object.keys(player.built).length}</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default DebugPanel;