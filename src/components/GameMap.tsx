import React, { useState, useMemo } from "react";
import type { PathCell } from "../utils/path";
import { pathCoordinates } from "../utils/path";
import PlayerToken from "./PlayerToken";
import type { BuildingType } from "../data/buildings";
import { buildingData } from "../data/buildings";



interface Player {
  id: number;
  type: 'human' | 'ai-income' | 'ai-eco';
  name: string;
  position: number;
  money: number;
  co2: number;
  eco: number;
  built: Record<string, BuildingType>;
  passedStart: boolean;
  skipTurns: number;
}

interface GameMapProps {
  playerIndex: number; // 当前玩家的位置
  built: Record<string, BuildingType>;
  canBuildHere: () => boolean;
  buildAtCurrent: (type: BuildingType) => void;
  // 移除升级相关接口
  currentEvent?: {
    id: string;
    name: string;
    description: string;
    icon: string;
    effects: {
      money?: number;
      co2?: number;
      eco?: number;
      skipTurns?: number;
    };
  } | null;
  onCloseEvent?: () => void;
  players?: Player[];
  currentPlayerId?: number; // 当前玩家的ID
  getBuildingOwner?: (position: number) => Player | null; // 获取建筑所有者
}

/**
 * 玩家颜色主题配置
 * 为不同玩家提供独特的视觉标识
 */
const PLAYER_COLORS = {
  1: {
    border: 'border-blue-400',
    bg: 'bg-blue-500/40',
    ring: 'ring-blue-300',
    textBg: 'bg-blue-600/80',
    textColor: 'text-blue-100'
  },
  2: {
    border: 'border-green-400',
    bg: 'bg-green-500/40',
    ring: 'ring-green-300',
    textBg: 'bg-green-600/80',
    textColor: 'text-green-100'
  },
  3: {
    border: 'border-purple-400',
    bg: 'bg-purple-500/40',
    ring: 'ring-purple-300',
    textBg: 'bg-purple-600/80',
    textColor: 'text-purple-100'
  },
  4: {
    border: 'border-orange-400',
    bg: 'bg-orange-500/40',
    ring: 'ring-orange-300',
    textBg: 'bg-orange-600/80',
    textColor: 'text-orange-100'
  }
} as const;

// 默认颜色
const DEFAULT_COLORS = {
  border: 'border-white/50',
  bg: 'bg-black/90',
  ring: '',
  textBg: 'bg-black/60',
  textColor: 'text-white'
};

const GameMap: React.FC<GameMapProps> = ({ playerIndex, built, canBuildHere, buildAtCurrent, currentEvent, onCloseEvent, players, currentPlayerId, getBuildingOwner }) => {
  const boardSize = 11; // 11x11 网格，适合大富翁循环布局
  const totalCells = 40; // 大富翁标准40格
  const [showBuildMenu, setShowBuildMenu] = useState(false);

  // 获取玩家颜色配置
  const getPlayerColors = (playerId: number) => {
    return PLAYER_COLORS[playerId as keyof typeof PLAYER_COLORS] || DEFAULT_COLORS;
  };

  /**
   * 性能优化：缓存格子位置计算
   * 避免每次渲染时重复计算格子的网格位置
   */
  const cellPositions = useMemo(() => {
    return Array.from({ length: totalCells }, (_, index) => {
      const coord = pathCoordinates[index];
      return {
        index,
        coord,
        style: {
          gridColumn: coord.col + 1,
          gridRow: coord.row + 1,
        }
      };
    });
  }, [totalCells]);

  /**
   * 性能优化：缓存建筑图标映射
   * 避免每次渲染时重新创建图标对象
   */
  const buildingIcons = useMemo(() => {
    const icons: Record<BuildingType, string> = {
      factory: '🏭',
      residential: '🏘️',
      green: '🌳'
    };
    return icons;
  }, []);

  /**
   * 优化的建筑显示组件
   * 使用 React.memo 进行性能优化，避免不必要的重渲染
   * 统一管理建筑的视觉样式和颜色主题
   */
  const BuildingDisplay = React.memo(({ index, building, owner }: { index: number, building: BuildingType, owner: any }) => {
    const colors = owner ? getPlayerColors(owner.id) : DEFAULT_COLORS;
    const ringClass = colors.ring ? `ring-2 ${colors.ring}` : '';
    const icon = buildingIcons[building] || '🏗️';
    
    return (
      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3 z-50">
        <div className={`backdrop-blur-md rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-2 md:py-3 border-2 sm:border-3 shadow-2xl ${colors.border} ${colors.bg} ${ringClass}`}>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold text-white drop-shadow-lg">
              {icon}
            </span>
            {owner && (
              <div className={`text-xs font-bold rounded px-1 py-0.5 whitespace-nowrap ${colors.textColor} ${colors.textBg}`}>
                {owner.name.length > 4 ? owner.name.substring(0, 4) + '...' : owner.name}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });

  const getCellType = (index: number): string => {
    // 特殊格子
    if (index === 0) return 'start'; // 起点
    if (index === 10) return 'jail'; // 监狱
    if (index === 20) return 'parking'; // 免费停车
    if (index === 30) return 'police'; // 警察局
    
    // 使用pathCoordinates中的真实类型
    if (index < pathCoordinates.length) {
      return pathCoordinates[index].type;
    }
    
    // 备用类型（不应该到达这里）
    return 'build';
  };

  const getCellIcon = (type: string): string => {
    const icons = {
      start: '🏠',
      jail: '🔒',
      parking: '🅿️',
      police: '👮',
      build: '🏗️',
      event: '⚡',
      tax: '💸',
      nature: '🌳',
      policy: '📋',
      trap: '⚠️'
    };
    return icons[type as keyof typeof icons] || '❓';
  };

  const getCellColor = (type: string): string => {
    const colors = {
      start: 'from-emerald-500/80 via-green-400/70 to-teal-500/80 border-emerald-400/90 shadow-emerald-400/50',
      jail: 'from-gray-600/80 via-slate-500/70 to-gray-700/80 border-gray-500/90 shadow-gray-500/50',
      parking: 'from-blue-500/80 via-cyan-400/70 to-blue-600/80 border-blue-400/90 shadow-blue-400/50',
      police: 'from-red-600/80 via-rose-500/70 to-red-700/80 border-red-500/90 shadow-red-500/50',
      build: 'from-blue-500/70 via-cyan-400/60 to-indigo-500/70 border-blue-400/80 shadow-blue-400/40',
      event: 'from-purple-500/70 via-pink-400/60 to-violet-500/70 border-purple-400/80 shadow-purple-400/40',
      tax: 'from-red-500/70 via-rose-400/60 to-pink-500/70 border-red-400/80 shadow-red-400/40',
      nature: 'from-green-500/70 via-lime-400/60 to-emerald-500/70 border-green-400/80 shadow-green-400/40',
      policy: 'from-indigo-500/70 via-blue-400/60 to-cyan-500/70 border-indigo-400/80 shadow-indigo-400/40',
      trap: 'from-orange-500/70 via-yellow-400/60 to-amber-500/70 border-orange-400/80 shadow-orange-400/40'
    };
    return colors[type as keyof typeof colors] || 'from-gray-500/70 via-slate-400/60 to-gray-500/70 border-gray-400/80 shadow-gray-400/40';
  };

  // 获取建筑所有者的颜色主题
  const getBuildingOwnerColor = (owner: Player | null): string => {
    if (!owner) return '';
    
    const playerColors = {
      0: 'from-blue-500/80 via-blue-400/70 to-blue-600/80 border-blue-400/90 shadow-blue-400/50',
      1: 'from-yellow-500/80 via-yellow-400/70 to-yellow-600/80 border-yellow-400/90 shadow-yellow-400/50',
      2: 'from-green-500/80 via-green-400/70 to-green-600/80 border-green-400/90 shadow-green-400/50',
      3: 'from-orange-500/80 via-orange-400/70 to-orange-600/80 border-orange-400/90 shadow-orange-400/50'
    };
    
    return playerColors[owner.id as keyof typeof playerColors] || 'from-gray-500/80 via-gray-400/70 to-gray-600/80 border-gray-400/90 shadow-gray-400/50';
  };

  // 获取玩家渐变颜色的CSS值
  const getPlayerGradientColors = (playerId: number): string => {
    const playerGradients = {
      0: 'rgba(59, 130, 246, 0.8), rgba(96, 165, 250, 0.7), rgba(37, 99, 235, 0.8)', // blue
      1: 'rgba(234, 179, 8, 0.8), rgba(250, 204, 21, 0.7), rgba(202, 138, 4, 0.8)', // yellow
      2: 'rgba(34, 197, 94, 0.8), rgba(74, 222, 128, 0.7), rgba(22, 163, 74, 0.8)', // green
      3: 'rgba(249, 115, 22, 0.8), rgba(251, 146, 60, 0.7), rgba(234, 88, 12, 0.8)' // orange
    };
    
    return playerGradients[playerId as keyof typeof playerGradients] || 'rgba(107, 114, 128, 0.8), rgba(156, 163, 175, 0.7), rgba(75, 85, 99, 0.8)';
  };

  // 获取默认格子类型的CSS渐变颜色
  const getDefaultGradientColors = (type: string): string => {
    const typeGradients = {
      start: 'rgba(16, 185, 129, 0.8), rgba(52, 211, 153, 0.7), rgba(20, 184, 166, 0.8)',
      jail: 'rgba(75, 85, 99, 0.8), rgba(100, 116, 139, 0.7), rgba(55, 65, 81, 0.8)',
      parking: 'rgba(59, 130, 246, 0.8), rgba(34, 211, 238, 0.7), rgba(37, 99, 235, 0.8)',
      police: 'rgba(220, 38, 38, 0.8), rgba(244, 63, 94, 0.7), rgba(185, 28, 28, 0.8)',
      build: 'rgba(107, 114, 128, 0.7), rgba(156, 163, 175, 0.6), rgba(107, 114, 128, 0.7)', // 建筑格子默认灰色
      event: 'rgba(168, 85, 247, 0.7), rgba(244, 114, 182, 0.6), rgba(139, 92, 246, 0.7)',
      tax: 'rgba(239, 68, 68, 0.7), rgba(251, 113, 133, 0.6), rgba(236, 72, 153, 0.7)',
      nature: 'rgba(34, 197, 94, 0.7), rgba(132, 204, 22, 0.6), rgba(16, 185, 129, 0.7)',
      policy: 'rgba(99, 102, 241, 0.7), rgba(59, 130, 246, 0.6), rgba(34, 211, 238, 0.7)',
      trap: 'rgba(249, 115, 22, 0.7), rgba(251, 191, 36, 0.6), rgba(245, 158, 11, 0.7)'
    };
    
    return typeGradients[type as keyof typeof typeGradients] || 'rgba(107, 114, 128, 0.7), rgba(156, 163, 175, 0.6), rgba(107, 114, 128, 0.7)';
  };

  // 获取玩家边框颜色
  const getPlayerBorderColor = (playerId: number): string => {
    const borderColors = {
      0: 'rgba(96, 165, 250, 0.9)', // blue
      1: 'rgba(250, 204, 21, 0.9)', // yellow
      2: 'rgba(74, 222, 128, 0.9)', // green
      3: 'rgba(251, 146, 60, 0.9)' // orange
    };
    
    return borderColors[playerId as keyof typeof borderColors] || 'rgba(156, 163, 175, 0.9)';
  };

  // 大富翁棋盘位置映射 (40格环形布局)
  const getMonopolyPosition = (index: number): { row: number; col: number } => {
    const positions: { row: number; col: number }[] = [];
    
    // 底边 (0-10): 从右下角到左下角 - 11个格子
    for (let i = 10; i >= 0; i--) {
      positions.push({ row: 10, col: i });
    }
    
    // 左边 (11-19): 从下到上 - 9个格子
    for (let i = 9; i >= 1; i--) {
      positions.push({ row: i, col: 0 });
    }
    
    // 顶边 (20-30): 从左上角到右上角 - 11个格子
    for (let i = 0; i <= 10; i++) {
      positions.push({ row: 0, col: i });
    }
    
    // 右边 (31-39): 从上到下 - 9个格子
    for (let i = 1; i <= 9; i++) {
      positions.push({ row: i, col: 10 });
    }
    
    return positions[index] || { row: 0, col: 0 };
  };

  const renderMonopolyCell = (index: number) => {
    const type = getCellType(index);
    const icon = getCellIcon(type);
    const playersHere = players ? players.filter(player => player.position === index) : [];
    const currentHumanPlayer = players ? players.find(p => p.type === 'human') : null;
    const isCurrentPlayerHere = currentHumanPlayer ? currentHumanPlayer.position === index : playerIndex === index;
    const hasAnyPlayerHere = playersHere.length > 0;
    const cellPosition = cellPositions[index];
    // 使用pathCoordinates来获取正确的坐标，与useMultiPlayerGameState保持一致
    const pathCoord = pathCoordinates[index];
    const posKey = pathCoord ? `${pathCoord.row}-${pathCoord.col}` : `${cellPosition.coord.row}-${cellPosition.coord.col}`;
    const hasBuilding = built[posKey];
    const buildingOwner = hasBuilding && getBuildingOwner ? getBuildingOwner(index) : null;
    
    // 直接从players数据中找到建筑所有者
    const directBuildingOwner = hasBuilding && players ? 
      players.find(player => player.built[posKey]) : null;
    
    const finalBuildingOwner = directBuildingOwner || buildingOwner;
    
    // 调试日志：显示建筑信息
    if (hasBuilding) {
      console.log(`🏗️ 格子 ${index} (${posKey}) 有建筑: ${hasBuilding}, 所有者: ${finalBuildingOwner?.name || 'unknown'}`);
    }
    
    const colorClass = hasBuilding && finalBuildingOwner ? getBuildingOwnerColor(finalBuildingOwner) : getCellColor(type);
    
    // 检查是否可以建造
    const canBuild = canBuildHere && isCurrentPlayerHere && canBuildHere();
    
    const isCorner = index === 0 || index === 10 || index === 20 || index === 30;
    const cellSize = isCorner ? 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36' : 'w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 lg:w-28 lg:h-32 xl:w-32 xl:h-36';

    const builtIcon = hasBuilding ? buildingIcons[hasBuilding] || "🏗️" : "";

    return (
      <div
        key={index}
        className={`
          relative ${cellSize} ${isCorner ? 'rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl' : 'rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl'} border-2 sm:border-3 transition-all duration-500 ease-out
          ${isCurrentPlayerHere ? 'ring-6 ring-cyan-400/90 ring-offset-4 ring-offset-slate-900/50 scale-110 shadow-2xl shadow-cyan-400/50 z-20' : hasAnyPlayerHere ? 'ring-4 ring-purple-400/70 ring-offset-2 ring-offset-slate-900/30 shadow-xl shadow-purple-400/30 z-15' : 'shadow-xl'}
          ${canBuild ? 'animate-pulse ring-4 ring-yellow-400/90 cursor-pointer hover:scale-110 z-10' : ''}
          hover:shadow-2xl transform hover:scale-105 hover:z-10
        `}
        style={{
          ...cellPosition.style,
          background: hasBuilding && finalBuildingOwner 
            ? `linear-gradient(135deg, ${getPlayerGradientColors(finalBuildingOwner.id)})`
            : `linear-gradient(135deg, ${getDefaultGradientColors(type)})`,
          borderColor: hasBuilding && finalBuildingOwner 
            ? getPlayerBorderColor(finalBuildingOwner.id)
            : undefined
        }}
        onClick={() => {
          if (canBuild) {
            setShowBuildMenu(true);
          }
        }}
      >
        {/* 3D效果背景 */}
        <div className={`absolute inset-1 sm:inset-2 ${isCorner ? 'rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl' : 'rounded-sm sm:rounded-md md:rounded-lg lg:rounded-xl'} bg-gradient-to-br from-white/10 to-black/30 backdrop-blur-sm`} />
        
        {/* 格子内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-1 sm:p-2">
          {/* 主图标 - 当有建筑时隐藏原本图标 */}
          {!hasBuilding && (
            <div className={`${isCorner ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl' : 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl'} drop-shadow-2xl mb-1 sm:mb-2`}>
              {icon}
            </div>
          )}
          
          {/* 格子编号 */}
          <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-100 font-mono bg-black/70 rounded-md sm:rounded-lg md:rounded-xl px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 font-bold shadow-xl border border-white/20">
            {index}
          </div>
        </div>
        
        {/* 建筑显示 */}
        {hasBuilding && (
          <BuildingDisplay 
            index={index}
            building={hasBuilding}
            owner={getBuildingOwner ? getBuildingOwner(index) : null}
          />
        )}
        

        
        {/* 玩家标记 - 叠加显示 */}
        {playersHere.length > 0 && (
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 md:-top-3 md:-right-3 z-30">
            <div className="relative">
              {playersHere.map((player, idx) => {
                 const isCurrentPlayer = currentPlayerId ? player.id === currentPlayerId : player.position === playerIndex;
                
                return (
                  <div 
                    key={player.id}
                    className={`absolute transform scale-75 sm:scale-90 md:scale-100 lg:scale-110 ${
                      isCurrentPlayer ? 'animate-bounce' : 'animate-pulse'
                    } flex flex-col items-center`}
                    style={{
                      transform: `translate(${idx * 8}px, ${idx * 8}px)`,
                      zIndex: isCurrentPlayer ? 40 : 35 - idx
                    }}
                  >
                    <div className={`${
                      isCurrentPlayer ? 'ring-3 ring-cyan-400 ring-opacity-90' : 'ring-2 ring-white/50'
                    } rounded-full drop-shadow-xl`}>
                      <PlayerToken 
                        size="medium"
                        playerType={player.type}
                        playerId={player.id}
                      />
                    </div>
                    {/* 只为当前玩家显示标签，避免重叠 */}
                    {isCurrentPlayer && (
                      <div className={`text-xs font-bold mt-1 px-2 py-1 rounded-full ${
                        player.type === 'human' ? 'bg-blue-500' : 
                        player.type === 'ai-income' ? 'bg-yellow-500' : 
                        player.type === 'ai-eco' ? 'bg-green-500' : 'bg-gray-500'
                      } text-white shadow-lg whitespace-nowrap`}>
                        {player.type === 'human' ? '人类' : 
                         player.type === 'ai-income' ? '商业AI' : 
                         player.type === 'ai-eco' ? '环保AI' : '未知'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 可建造提示 */}
        {canBuild && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-yellow-400/50 backdrop-blur-sm rounded-full p-1 sm:p-2 md:p-3 lg:p-4 border-2 sm:border-3 md:border-4 border-yellow-400/90 animate-pulse shadow-2xl shadow-yellow-400/50">
              <span className="text-yellow-100 text-xs sm:text-sm md:text-lg lg:text-2xl xl:text-3xl drop-shadow-lg animate-bounce">🔨</span>
            </div>
          </div>
        )}
        
        {/* 特殊效果光晕 */}
        {isCorner && (
          <div className={`absolute inset-0 ${isCorner ? 'rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl' : 'rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl'} animate-pulse`}>
            <div className={`absolute inset-0 ${isCorner ? 'rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl' : 'rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl'} blur-sm sm:blur-md opacity-30 ${
              type === 'start' ? 'bg-emerald-400' :
              type === 'jail' ? 'bg-gray-500' :
              type === 'parking' ? 'bg-blue-400' :
              type === 'police' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
          </div>
        )}
      </div>
    );
  };
  
  // 获取事件效果文本
  const getEffectText = (effects: any) => {
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

  // 渲染中央装饰区域
  const renderCenterArea = () => {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
        <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 xl:w-[32rem] xl:h-[32rem] bg-gradient-to-br from-slate-800/80 via-blue-800/60 to-emerald-800/80 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 sm:border-3 md:border-4 border-white/30 backdrop-blur-lg shadow-2xl">
          <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10">
            {showBuildMenu && (
              // 显示建筑选择菜单
              <>
                <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 md:mb-4 drop-shadow-2xl">🏗️</div>
                <h3 className="text-sm sm:text-lg md:text-xl font-bold text-white text-center mb-2 sm:mb-3 md:mb-4 drop-shadow-lg">
                  选择建造类型
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6 max-h-48 sm:max-h-64 md:max-h-80 overflow-y-auto pointer-events-auto">
                  {Object.entries(buildingData).map(([type, data]) => (
                    <button
                      key={type}
                      onClick={() => {
                        buildAtCurrent(type as BuildingType);
                        setShowBuildMenu(false);
                      }}
                      className="group relative p-2 sm:p-3 md:p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-white/20 hover:border-cyan-400 hover:bg-black/60 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                        {data.icon}
                      </div>
                      <h4 className="text-xs sm:text-sm md:text-base font-bold text-white mb-1 sm:mb-2">{data.name}</h4>
                      <div className="text-xs text-yellow-300 mb-1">💰 {data.cost}</div>
                      <div className="text-xs text-gray-300">
                        <div>🏭 {data.co2} 🌱 {data.eco}</div>
                        <div>📈 +{data.income}/回合</div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    setShowBuildMenu(false);
                  }}
                  className="pointer-events-auto px-3 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  取消
                </button>
              </>
            )}
            {currentEvent && (
              // 显示事件信息
              <>
                <div className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl mb-2 sm:mb-4 animate-bounce drop-shadow-2xl">{currentEvent.icon}</div>
                <h3 className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-white text-center mb-1 sm:mb-2 md:mb-3 drop-shadow-lg">
                  {currentEvent.name}
                </h3>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-200 text-center leading-relaxed mb-2 sm:mb-3 md:mb-4 px-2">
                  {currentEvent.description}
                </p>
                <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2 sm:px-3 md:px-4 py-1 sm:py-2 md:py-3 mb-2 sm:mb-3 md:mb-4 border border-white/20">
                  <p className="text-xs sm:text-sm md:text-base text-cyan-300 font-medium text-center">
                    {getEffectText(currentEvent.effects)}
                  </p>
                </div>
                {onCloseEvent && (
                  <button
                    onClick={onCloseEvent}
                    className="pointer-events-auto px-3 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 font-semibold text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    确定
                  </button>
                )}
              </>
            )}
            {!showBuildMenu && !currentEvent && (
              // 显示游戏标题
              <>
                <div className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl xl:text-9xl mb-2 sm:mb-4 md:mb-6 lg:mb-8 animate-pulse drop-shadow-2xl">🌍</div>
                <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent text-center mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6 drop-shadow-lg">
                  Carbon Clash
                </h2>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-100 text-center leading-relaxed font-medium">
                  环保策略棋盘游戏
                </p>
                <div className="mt-2 sm:mt-4 md:mt-6 lg:mt-8 flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-200 bg-black/40 rounded-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-1 sm:py-2 md:py-3 border border-white/20">
                  <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">🎯</span>
                  <span className="font-semibold">大富翁模式</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">

      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/70 to-emerald-900/90 rounded-3xl backdrop-blur-xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.15),transparent_50%)] rounded-3xl" />
      
      {/* 大富翁棋盘容器 */}
      <div className="relative z-10 w-full h-full max-w-[95vw] max-h-[85vh] aspect-square mx-auto">
        <div 
          className="relative grid gap-1 sm:gap-2 md:gap-3 lg:gap-4 w-full h-full p-2 sm:p-4 md:p-6 lg:p-8"
          style={{
            gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`
          }}
        >
          {/* 渲染40个大富翁格子 */}
          {cellPositions.map(({ index }) => renderMonopolyCell(index))}
          
          {/* 中央装饰区域 */}
          {renderCenterArea()}
        </div>
      </div>
      
      {/* 装饰性边框 */}
      <div className="absolute inset-0 rounded-3xl border-3 border-white/20 shadow-2xl" />
      <div className="absolute inset-4 rounded-2xl border-2 border-white/10" />
    </div>
  );
};

export default GameMap;
