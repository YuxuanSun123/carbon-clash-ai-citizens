import React from 'react';
import type { Player } from '../hooks/useMultiPlayerGameState';

interface GameEndModalProps {
  isOpen: boolean;
  winner: Player | null;
  reason: string;
  scores: { playerId: number; score: number; rank: number }[];
  players: Player[];
  onRestart: () => void;
  onBackToMenu?: () => void;
}

const GameEndModal: React.FC<GameEndModalProps> = ({
  isOpen,
  winner,
  reason,
  scores,
  players,
  onRestart,
  onBackToMenu
}) => {
  if (!isOpen) return null;

  const getPlayerIcon = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return '❓';
    
    switch (player.type) {
      case 'human': return '👤';
      case 'ai-income': return '💼';
      case 'ai-eco': return '🌱';
      default: return '❓';
    }
  };

  const getPlayerColor = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return 'text-gray-400';
    
    switch (player.type) {
      case 'human': return 'text-blue-400';
      case 'ai-income': return 'text-yellow-400';
      case 'ai-eco': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400 bg-yellow-400/20';
      case 2: return 'text-gray-300 bg-gray-300/20';
      case 3: return 'text-orange-400 bg-orange-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {winner ? '🎉' : '⏰'}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {winner ? 'Game Over!' : 'Game Over'}
            </h2>
            <p className="text-lg text-gray-300">
              {reason}
            </p>
            {winner && (
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">{getPlayerIcon(winner.id)}</span>
                  <div>
                    <div className={`text-xl font-bold ${getPlayerColor(winner.id)}`}>
                      {winner.name}
                    </div>
                    <div className="text-yellow-400 font-semibold">
                      Wins!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🏆 Final Leaderboard
          </h3>
          <div className="space-y-3">
            {scores.map((scoreData) => {
              const player = players.find(p => p.id === scoreData.playerId);
              if (!player) return null;
              
              return (
                <div 
                  key={scoreData.playerId}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    scoreData.rank === 1 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        getRankColor(scoreData.rank)
                      }`}>
                        {getRankIcon(scoreData.rank)}
                      </div>
                      
                      {/* Player Info */}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPlayerIcon(scoreData.playerId)}</span>
                        <div>
                          <div className={`font-bold text-lg ${getPlayerColor(scoreData.playerId)}`}>
                            {player.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {player.type === 'human' ? '人类玩家' : 
                             player.type === 'ai-income' ? '商业AI' : 
                             player.type === 'ai-eco' ? '环保AI' : '未知'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 分数 */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {scoreData.score.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">总分</div>
                    </div>
                  </div>
                  
                  {/* 详细数据 */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-green-400 font-semibold">
                          💰 {player.money.toLocaleString()}
                        </div>
                        <div className="text-gray-400">金钱</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-semibold">
                          🌱 {player.eco}
                        </div>
                        <div className="text-gray-400">生态</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-semibold">
                          💨 {player.co2}
                        </div>
                        <div className="text-gray-400">CO2</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-semibold">
                          🏗️ {Object.keys(player.built).length}
                        </div>
                        <div className="text-gray-400">建筑</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="p-6 border-t border-white/10">
          <div className="flex gap-4 justify-center">
            <button
              onClick={onRestart}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🔄 再来一局
            </button>
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🏠 返回主菜单
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameEndModal;