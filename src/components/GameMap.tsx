import type { PathCell } from "../utils/path";
import { pathCoordinates } from "../utils/path";
import PlayerToken from "./PlayerToken";
import BuildMenu from "./BuildMenu";
import { useState } from "react";
import type { BuildingType } from "../data/buildings";


interface GameMapProps {
  playerPos: { row: number; col: number };
  built: Record<string, BuildingType>;
  canBuildHere: () => boolean;
  buildAtCurrent: (type: BuildingType) => void;
}

const GameMap: React.FC<GameMapProps> = ({ playerPos, built, canBuildHere, buildAtCurrent }) => {
  const boardSize = 11; // 11x11 网格，适合大富翁循环布局
  const totalCells = 40; // 大富翁标准40格
  const [showBuildMenu, setShowBuildMenu] = useState(false);

  const getCellType = (index: number): string => {
    // 特殊格子
    if (index === 0) return 'start'; // 起点
    if (index === 10) return 'jail'; // 监狱
    if (index === 20) return 'parking'; // 免费停车
    if (index === 30) return 'police'; // 警察局
    
    // 其他格子类型
    const types = ['build', 'event', 'tax', 'nature', 'policy', 'chance'];
    const hash = (index * 7 + 13) % types.length;
    return types[hash];
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
      chance: '🎲'
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
      chance: 'from-orange-500/70 via-yellow-400/60 to-amber-500/70 border-orange-400/80 shadow-orange-400/40'
    };
    return colors[type as keyof typeof colors] || 'from-gray-500/70 via-slate-400/60 to-gray-500/70 border-gray-400/80 shadow-gray-400/40';
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
    const colorClass = getCellColor(type);
    const isPlayerHere = playerPos === index;
    const hasBuilding = built[index];
    const canBuild = canBuildHere && isPlayerHere && type === 'build' && !hasBuilding;
    const { row, col } = getMonopolyPosition(index);
    
    const isCorner = index === 0 || index === 10 || index === 20 || index === 30;
    const cellSize = isCorner ? 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32' : 'w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 lg:w-24 lg:h-28 xl:w-28 xl:h-32';

    const builtIcon =
      hasBuilding === "factory"
        ? "🏭"
        : hasBuilding === "residential"
        ? "🏘️"
        : hasBuilding === "green"
        ? "🌳"
        : "";

    return (
      <div
        key={index}
        className={`
          relative ${cellSize} ${isCorner ? 'rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl' : 'rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl'} border-2 sm:border-3 transition-all duration-500 ease-out
          bg-gradient-to-br ${colorClass}
          ${isPlayerHere ? 'ring-6 ring-cyan-400/90 ring-offset-4 ring-offset-slate-900/50 scale-110 shadow-2xl shadow-cyan-400/50 z-20' : 'shadow-xl'}
          ${canBuild ? 'animate-pulse ring-4 ring-yellow-400/90 cursor-pointer hover:scale-110 z-10' : ''}

          backdrop-blur-sm hover:shadow-2xl transform hover:scale-105 hover:z-10
          before:absolute before:inset-0 ${isCorner ? 'before:rounded-lg sm:before:rounded-xl md:before:rounded-2xl lg:before:rounded-3xl' : 'before:rounded-md sm:before:rounded-lg md:before:rounded-xl lg:before:rounded-2xl'} before:bg-gradient-to-br before:from-white/15 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
        `}
        style={{
          gridRow: row + 1,
          gridColumn: col + 1
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
          {/* 主图标 */}
          <div className={`${isCorner ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl' : 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl'} drop-shadow-2xl mb-1 sm:mb-2`}>
            {icon}
          </div>
          
          {/* 格子编号 */}
          <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-100 font-mono bg-black/70 rounded-md sm:rounded-lg md:rounded-xl px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 font-bold shadow-xl border border-white/20">
            {index}
          </div>
        </div>
        
        {/* 建筑显示 */}
        {hasBuilding && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3">
            <div className="bg-black/90 backdrop-blur-md rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-2 md:py-3 border-2 sm:border-3 border-white/50 shadow-2xl">
              <span className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold text-white drop-shadow-lg">
                {builtIcon}
              </span>
            </div>
          </div>
        )}
        
        {/* 玩家标记 */}
        {isPlayerHere && (
          <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 md:-top-4 md:-right-4 z-30">
            <div className="animate-bounce transform scale-75 sm:scale-100 md:scale-125 lg:scale-150">
              <PlayerToken size="large" />
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
  
  // 渲染中央装饰区域
  const renderCenterArea = () => {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 xl:w-[28rem] xl:h-[28rem] bg-gradient-to-br from-slate-800/80 via-blue-800/60 to-emerald-800/80 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 sm:border-3 md:border-4 border-white/30 backdrop-blur-lg shadow-2xl">
          <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10">
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
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">
      {showBuildMenu && (
        <BuildMenu
          onBuild={(type) => {
            buildAtCurrent(type);
            setShowBuildMenu(false);
          }}
          onClose={() => setShowBuildMenu(false)}
        />
      )}

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
          {Array.from({ length: totalCells }, (_, index) => renderMonopolyCell(index))}
          
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
