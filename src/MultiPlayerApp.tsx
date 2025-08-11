import GameMap from "./components/GameMap";
import DiceRoller from "./components/DiceRoller";
import PolicyModal from "./components/PolicyModal";
import PolicyResultModal from "./components/PolicyResultModal";
import TransportModal from "./components/TransportModal";
import EventHistory from "./components/EventHistory";
import GameEndModal from "./components/GameEndModal";
import DebugPanel from "./components/DebugPanel";
import { useMultiPlayerGameState } from "./hooks/useMultiPlayerGameState";
import { useState, useCallback } from "react";

interface MultiPlayerAppProps {
  onBackToMenu?: () => void;
}

function MultiPlayerApp({ onBackToMenu }: MultiPlayerAppProps) {
  const {
    players,
    currentPlayer,
    currentPlayerIndex,
    diceRoll,
    turnCount,
    gamePhase,
    aiThinking,
    getAllBuildings,
    canBuildHere,
    buildAtCurrent,
    canUpgradeHere,
    upgradeAtCurrent,
    movePlayer,
    nextTurn,
    getTotalIncome,
    getTotalCO2PerTurn,
    getTotalEcoPerTurn,
    currentEvent,
    currentPolicy,
    eventHistory,
    showEventModal,
    showPolicyModal,
    handlePolicyChoice,
    closeEventModal,
    closePolicyModal,
    // 多人投票系统
    votingInProgress,
    playerVotes,
    votedPlayers,
    currentVotingPlayerId,
    policyResult,
    showPolicyResult,
    // handlePolicyVote,
    closePolicyResult,
    showTransportModal,
    setShowTransportModal,
    handleTransportChoice,
    gameResult,
    restartGame,
    MAX_TURNS,
    MAX_CO2,
    GLOBAL_CO2_LIMIT,
    BANKRUPTCY_THRESHOLD,
    debugAddMoney,
    debugAddCO2,
    debugAddEco,
    debugSetTurn,
    debugTriggerGameEnd,
    debugTestAIChoice,
    getBuildingOwnerAtPosition,
  } = useMultiPlayerGameState();

  const [showHistory, setShowHistory] = useState(false);

  // 暴露调试函数到全局对象（仅开发环境）
  if (import.meta.env.DEV) {
    (window as any).debugTestAIChoice = debugTestAIChoice;
    console.log('🔧 调试函数已暴露: window.debugTestAIChoice()');
  }

  // 获取玩家颜色
  const getPlayerColor = (playerId: number) => {
    const colors = ['text-blue-400', 'text-yellow-400', 'text-green-400'];
    return colors[playerId] || 'text-gray-400';
  };

  // 获取玩家图标
  const getPlayerIcon = (playerId: number) => {
    const icons = ['👤', '💼', '🌱'];
    return icons[playerId] || '❓';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 text-white relative">
      {/* Top navigation bar */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🌍</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Carbon Clash - Multiplayer
              </h1>
              <p className="text-sm text-gray-300">Carbon Clash</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="bg-gray-600/50 hover:bg-gray-600/70 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                ← Back to Main Menu
              </button>
            )}
            <div className="flex items-center gap-4 text-sm">
              {/* Turn progress */}
              <div className="text-gray-300">
                Turn <span className="text-cyan-400 font-bold">{turnCount}</span>
                <span className="text-gray-500">/{MAX_TURNS}</span>
              </div>
              
              {/* Global CO2 warning */}
              {(() => {
                const totalCO2 = players.reduce((total, p) => total + p.co2, 0);
                const warningThreshold = GLOBAL_CO2_LIMIT * 0.8;
                if (totalCO2 > warningThreshold) {
                  return (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-2 py-1">
                      <span className="text-red-300 text-xs font-medium">
                        🌍 Global CO2 Crisis: {totalCO2}/{GLOBAL_CO2_LIMIT}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Bankruptcy warning */}
              {currentPlayer.money < BANKRUPTCY_THRESHOLD && (
                <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg px-2 py-1">
                  <span className="text-orange-300 text-xs font-medium">
                    ⚠️ Insufficient Funds
                  </span>
                </div>
              )}
            </div>
            {currentPlayer.skipTurns > 0 && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1">
                <span className="text-red-300 text-sm font-medium">⏸️ Skip {currentPlayer.skipTurns} turn(s)</span>
              </div>
            )}
            {aiThinking && (
              <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-3 py-1">
                <span className="text-purple-300 text-sm font-medium">🤖 AI Thinking...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main game area */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left map area */}
        <div className="flex-1 p-2 flex flex-col items-center justify-center min-h-0">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Current player indicator */}
            <div className="mb-4 bg-black/40 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getPlayerIcon(currentPlayer.id)}</span>
                <div>
                  <div className={`text-lg font-bold ${getPlayerColor(currentPlayer.id)}`}>
                    {currentPlayer.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {gamePhase === 'rolling' && currentPlayer.type === 'human' && 'Please roll dice'}
                    {gamePhase === 'rolling' && currentPlayer.type !== 'human' && 'AI Turn'}
                    {gamePhase === 'building' && currentPlayer.type === 'human' && 'Can build structures'}
                    {gamePhase === 'building' && currentPlayer.type !== 'human' && 'AI Deciding'}
                    {gamePhase === 'waiting' && 'Waiting'}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <GameMap
                playerIndex={currentPlayer.position}
                built={getAllBuildings()}
                canBuildHere={canBuildHere}
                buildAtCurrent={buildAtCurrent}
                canUpgradeHere={useCallback(() => canUpgradeHere(currentPlayer.id), [canUpgradeHere, currentPlayer.id])}
                upgradeAtCurrent={useCallback(() => upgradeAtCurrent(currentPlayer.id), [upgradeAtCurrent, currentPlayer.id])}
                currentEvent={showEventModal ? currentEvent : null}
                onCloseEvent={closeEventModal}
                players={players}
                currentPlayerId={currentPlayer.id}
                getBuildingOwner={getBuildingOwnerAtPosition}
              />
            </div>
            
            {/* Map bottom control area */}
            <div className="mt-4 flex justify-center gap-4 flex-shrink-0">
              {currentPlayer.type === 'human' && gamePhase === 'rolling' && (
                <DiceRoller onRoll={movePlayer} diceModifier={currentPlayer.diceModifier} />
              )}
              {gamePhase === 'building' && currentPlayer.type === 'human' && (
                <button
                  onClick={nextTurn}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  End Turn
                </button>
              )}
              {diceRoll !== null && (
                <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                  <span className="text-purple-300 font-semibold">
                    🎯 Rolled: {diceRoll} points
                  </span>
                  {currentPlayer.skipTurns > 0 && (
                    <span className="text-red-400 ml-2">(Skipped)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right data panel */}
        <div className="w-80 bg-black/20 backdrop-blur-md border-l border-white/10 p-4 overflow-y-auto flex-shrink-0">
          {/* All players status */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              👥 Player Status
            </h2>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`rounded-xl p-4 border transition-all ${
                    index === currentPlayerIndex 
                      ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg' 
                      : 'bg-gray-500/10 border-gray-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getPlayerIcon(player.id)}</span>
                    <span className={`font-bold ${getPlayerColor(player.id)}`}>
                      {player.name}
                    </span>
                    {index === currentPlayerIndex && (
                      <span className="text-xs bg-cyan-500 text-white px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold">{player.money}</div>
                      <div className="text-gray-400 text-xs">💰</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 font-bold">{player.co2}</div>
                      <div className="text-gray-400 text-xs">🏭</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-400 font-bold">{player.eco}</div>
                      <div className="text-gray-400 text-xs">🌱</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current player detailed resource status */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              📊 {currentPlayer.name} Detailed Status
            </h2>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-gray-300">Money</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-400">{currentPlayer.money}</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏭</span>
                    <span className="text-gray-300">CO2 Emissions</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{currentPlayer.co2}</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <span className="text-gray-300">Eco Greening</span>
                  </div>
                  <span className="text-2xl font-bold text-green-400">{currentPlayer.eco}</span>
                </div>
              </div>
              
              {/* Global CO2 total display */}
              <div className={`bg-gradient-to-r rounded-xl p-4 border ${
                players.reduce((total, p) => total + p.co2, 0) > GLOBAL_CO2_LIMIT * 0.8
                  ? 'from-red-600/30 to-red-500/30 border-red-500/50'
                  : 'from-blue-500/20 to-purple-500/20 border-blue-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌍</span>
                    <span className="text-gray-300">Global CO2 Total</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      players.reduce((total, p) => total + p.co2, 0) > GLOBAL_CO2_LIMIT * 0.8
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}>
                      {players.reduce((total, p) => total + p.co2, 0)}
                    </div>
                    <div className="text-xs text-gray-400">Limit: {GLOBAL_CO2_LIMIT}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Per turn effects */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              ⚡ {currentPlayer.name} Per Turn Effects
            </h2>
            <div className="space-y-2">
              {getTotalIncome() > 0 && (
                <div className="flex items-center justify-between bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                  <span className="text-gray-300 flex items-center gap-2">
                    <span>📈</span> Income
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
                    <span>🏭</span> Emissions
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
                    <span>🌱</span> Eco
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

          {/* Event history */}
          <div>
            <EventHistory 
              eventHistory={eventHistory}
              isOpen={showHistory}
              onToggle={() => setShowHistory(!showHistory)}
            />
          </div>
        </div>
      </div>
      
      {/* Policy selection modal */}
      {showPolicyModal && currentPolicy && (
        <PolicyModal
          policy={currentPolicy}
          onChoice={handlePolicyChoice}
          onClose={closePolicyModal}
          votingInProgress={votingInProgress}
          playerVotes={playerVotes}
          votedPlayers={votedPlayers}
          totalPlayers={players.length}
          currentPlayerId={currentPlayer.id}
          players={players}
          currentVotingPlayerId={currentVotingPlayerId}
        />
      )}
      
      {/* Policy voting result modal */}
      {(() => {
        console.log(`🔍 MultiPlayerApp 渲染检查: showPolicyResult=${showPolicyResult}, policyResult=`, policyResult);
        return showPolicyResult && policyResult && (
          <PolicyResultModal
            policy={policyResult.policy}
            winningChoiceIndex={policyResult.winningChoiceIndex}
            votes={policyResult.votes}
            totalPlayers={players.length}
            onClose={closePolicyResult}
          />
        );
      })()}
      
      {/* Transport mode selection modal */}
      {showTransportModal && (
        <TransportModal
          isOpen={showTransportModal}
          onClose={() => setShowTransportModal(false)}
          onChoose={handleTransportChoice}
          playerName={currentPlayer.name}
        />
      )}
      
      {/* Game end modal */}
       <GameEndModal
         isOpen={gameResult.isEnded}
         winner={gameResult.winner}
         reason={gameResult.reason}
         scores={gameResult.scores}
         players={players}
         onRestart={restartGame}
         onBackToMenu={onBackToMenu}
       />
       
       {/* Debug panel */}
       <DebugPanel
         players={players}
         turnCount={turnCount}
         maxTurns={MAX_TURNS}
         maxCO2={MAX_CO2}
         bankruptcyThreshold={BANKRUPTCY_THRESHOLD}
         onAddMoney={debugAddMoney}
         onAddCO2={debugAddCO2}
         onAddEco={debugAddEco}
         onSetTurn={debugSetTurn}
         onTriggerGameEnd={debugTriggerGameEnd}
       />
     </div>
   );
}

export default MultiPlayerApp;