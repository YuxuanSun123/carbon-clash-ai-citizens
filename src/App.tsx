import GameMap from "./components/GameMap";
import DiceRoller from "./components/DiceRoller";
import PlayerToken from "./components/PlayerToken";
import EventModal from "./components/EventModal";
import PolicyModal from "./components/PolicyModal";
import EventHistory from "./components/EventHistory";
import { useGameState } from "./hooks/useGameState";
import MultiPlayerApp from "./MultiPlayerApp";
import { useState } from "react";

function App() {
  const [gameMode, setGameMode] = useState<'menu' | 'single' | 'multi'>('menu');
  
  const {
    playerIndex,
    currentPosition,
    movePlayer,
    diceRoll,
    built,
    canBuildHere,
    buildAtCurrent,
    money,
    co2,
    eco,
    turnCount,
    getTotalIncome,
    getTotalCO2PerTurn,
    getTotalEcoPerTurn,
    // 事件系统
    currentEvent,
    currentPolicy,
    skipTurns,
    eventHistory,
    showEventModal,
    showPolicyModal,
    handlePolicyChoice,
    closeEventModal,
    closePolicyModal,
  } = useGameState();

  const [showHistory, setShowHistory] = useState(false);

  // 如果选择多人模式，渲染多人游戏组件
  if (gameMode === 'multi') {
    return <MultiPlayerApp onBackToMenu={() => setGameMode('menu')} />;
  }

  // 游戏模式选择菜单
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-8 animate-pulse">🌍</div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            Carbon Clash
          </h1>
          <p className="text-xl text-gray-300 mb-12">环保策略棋盘游戏</p>
          
          <div className="space-y-6">
            <button
              onClick={() => setGameMode('single')}
              className="block w-80 mx-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">👤</span>
                <div className="text-left">
                  <div className="text-lg">单人模式</div>
                  <div className="text-sm text-blue-200">经典单人游戏体验</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setGameMode('multi')}
              className="block w-80 mx-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🤖</span>
                <div className="text-left">
                  <div className="text-lg">多人模式 (含AI)</div>
                  <div className="text-sm text-purple-200">与AI商业家和AI环保家对战</div>
                </div>
              </div>
            </button>
          </div>
          
          <div className="mt-12 text-sm text-gray-400">
            <p>选择游戏模式开始你的环保之旅</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 text-white">
      {/* 顶部导航栏 */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🌍</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Carbon Clash
              </h1>
              <p className="text-sm text-gray-300">环保策略棋盘游戏</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setGameMode('menu')}
              className="bg-gray-600/50 hover:bg-gray-600/70 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              ← 返回主菜单
            </button>
            <div className="text-sm text-gray-300">
              回合 <span className="text-cyan-400 font-bold">{turnCount}</span>
            </div>
            {skipTurns > 0 && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1">
                <span className="text-red-300 text-sm font-medium">⏸️ 跳过 {skipTurns} 回合</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主游戏区域 */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 左侧地图区域 */}
        <div className="flex-1 p-2 flex flex-col items-center justify-center min-h-0">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <GameMap
          playerIndex={playerIndex}
          built={built}
          canBuildHere={canBuildHere}
          buildAtCurrent={buildAtCurrent}
          currentEvent={showEventModal ? currentEvent : null}
          onCloseEvent={closeEventModal}
        />
            </div>
            
            {/* 地图底部控制区 */}
            <div className="mt-4 flex justify-center gap-4 flex-shrink-0">
              <DiceRoller onRoll={movePlayer} />
              {diceRoll !== null && (
                <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                  <span className="text-purple-300 font-semibold">
                    🎯 掷出：{diceRoll} 点
                  </span>
                  {skipTurns > 0 && (
                    <span className="text-red-400 ml-2">(被跳过)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧数据面板 */}
        <div className="w-72 bg-black/20 backdrop-blur-md border-l border-white/10 p-4 overflow-y-auto flex-shrink-0">
          {/* 资源状态 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              📊 资源状态
            </h2>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-gray-300">金钱</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-400">{money}</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏭</span>
                    <span className="text-gray-300">CO2排放</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{co2}</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <span className="text-gray-300">生态绿化</span>
                  </div>
                  <span className="text-2xl font-bold text-green-400">{eco}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 每回合效果 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              ⚡ 每回合效果
            </h2>
            <div className="space-y-2">
              {getTotalIncome() > 0 && (
                <div className="flex items-center justify-between bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                  <span className="text-gray-300 flex items-center gap-2">
                    <span>📈</span> 收入
                  </span>
                  <span className="text-emerald-400 font-bold">+{getTotalIncome()}</span>
                </div>
              )}
              
              {getTotalCO2PerTurn() !== 0 && (
                <div className={`flex items-center justify-between rounded-lg p-3 border ${
                  getTotalCO2PerTurn() > 0 
                    ? 'bg-red-500/10 border-red-500/20' 
                    : 'bg-teal-500/10 border-teal-500/20'
                }`}>
                  <span className="text-gray-300 flex items-center gap-2">
                    <span>🏭</span> 排放
                  </span>
                  <span className={`font-bold ${
                    getTotalCO2PerTurn() > 0 ? 'text-red-400' : 'text-teal-400'
                  }`}>
                    {getTotalCO2PerTurn() > 0 ? '+' : ''}{getTotalCO2PerTurn()}
                  </span>
                </div>
              )}
              
              {getTotalEcoPerTurn() !== 0 && (
                <div className={`flex items-center justify-between rounded-lg p-3 border ${
                  getTotalEcoPerTurn() > 0 
                    ? 'bg-lime-500/10 border-lime-500/20' 
                    : 'bg-rose-500/10 border-rose-500/20'
                }`}>
                  <span className="text-gray-300 flex items-center gap-2">
                    <span>🌱</span> 生态
                  </span>
                  <span className={`font-bold ${
                    getTotalEcoPerTurn() > 0 ? 'text-lime-400' : 'text-rose-400'
                  }`}>
                    {getTotalEcoPerTurn() > 0 ? '+' : ''}{getTotalEcoPerTurn()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 事件历史 */}
          <div>
            <EventHistory 
              eventHistory={eventHistory}
              isOpen={showHistory}
              onToggle={() => setShowHistory(!showHistory)}
            />
          </div>
        </div>
      </div>
      
      
      
      {/* 政策选择弹窗 */}
      {showPolicyModal && currentPolicy && (
        <PolicyModal
          policy={currentPolicy}
          onChoice={handlePolicyChoice}
          onClose={closePolicyModal}
        />
      )}
    </div>
  );
}

export default App;
