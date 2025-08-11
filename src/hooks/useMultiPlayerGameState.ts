import { useState, useCallback, useEffect } from "react";
import { pathCoordinates } from "../utils/path";
import type { BuildingType } from "../data/buildings";
import { buildingData, getBuildingLevelData, getUpgradeCost } from "../data/buildings";
import type { GameEvent, PolicyChoice } from "../data/events";
import { 
  randomEvents, 
  trapEvents, 
  natureRewards, 
  getRandomEvent,
  getRandomPolicyChoice 
} from "../data/events";
import { getAIChoiceFromDeepSeek, getAIPolicyChoiceFromDeepSeek, getAIUpgradeChoiceFromDeepSeek } from "../services/deepseekApi";

// Player types
export type PlayerType = 'human' | 'ai-income' | 'ai-eco';

// Building information structure
export interface BuildingInfo {
  type: BuildingType;
  level: number;
}

// Player data structure
export interface Player {
  id: number;
  type: PlayerType;
  name: string;
  position: number;
  money: number;
  co2: number;
  eco: number;
  built: Record<string, BuildingInfo>;
  passedStart: boolean;
  skipTurns: number;
  diceModifier: number; // Dice roll modifier
  co2PerTurn: number; // Additional CO2 emissions per turn
  moneyPerTurn: number; // Money consumption per turn (negative for consumption)
}



export const useMultiPlayerGameState = () => {
  // Initialize three players
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 0,
      type: 'human',
      name: 'Player',
      position: 0,
      money: 1000,
      co2: 0,
      eco: 0,
      built: {},
      passedStart: false,
      skipTurns: 0,
      diceModifier: 0,
      co2PerTurn: 0,
      moneyPerTurn: 0
    },
    {
      id: 1,
      type: 'ai-income',
      name: 'AI Business',
      position: 0,
      money: 1000,
      co2: 0,
      eco: 0,
      built: {},
      passedStart: false,
      skipTurns: 0,
      diceModifier: 0,
      co2PerTurn: 0,
      moneyPerTurn: 0
    },
    {
      id: 2,
      type: 'ai-eco',
      name: 'AI Environmentalist',
      position: 0,
      money: 1000,
      co2: 0,
      eco: 0,
      built: {},
      passedStart: false,
      skipTurns: 0,
      diceModifier: 0,
      co2PerTurn: 0,
      moneyPerTurn: 0
    }
  ]);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [gamePhase, setGamePhase] = useState<'rolling' | 'building' | 'waiting' | 'ended'>('rolling');

  // Game end state
  const [gameResult, setGameResult] = useState<{
    isEnded: boolean;
    winner: Player | null;
    reason: string;
    scores: { playerId: number; score: number; rank: number }[];
  }>({ isEnded: false, winner: null, reason: '', scores: [] });

  // Event system state
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [currentPolicy, setCurrentPolicy] = useState<PolicyChoice | null>(null);
  const [eventHistory, setEventHistory] = useState<string[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  // const [pendingPolicyPlayer, setPendingPolicyPlayer] = useState<number | null>(null);
  
  // Multiplayer voting system state
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [playerVotes, setPlayerVotes] = useState<Record<number, number>>({});
  const [votedPlayers, setVotedPlayers] = useState<Set<number>>(new Set());
  const [currentVotingPlayerId, setCurrentVotingPlayerId] = useState<number | undefined>(undefined);
  const [policyResult, setPolicyResult] = useState<{
    policy: PolicyChoice;
    winningChoiceIndex: number;
    votes: Record<number, number>;
  } | null>(null);
  const [showPolicyResult, setShowPolicyResult] = useState(false);
  
  // Transport mode selection state
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [pendingTransportPlayer, setPendingTransportPlayer] = useState<number | null>(null);
  
  // Game constants
  const CO2_JAIL_THRESHOLD = 300; // CO2 emission jail threshold
  const START_BONUS = 500; // Bonus for reaching start again

  const currentPlayer = players[currentPlayerIndex];

  // Game constants
  const MAX_TURNS = 60; // Maximum number of turns
  const MAX_CO2 = Infinity; // No CO2 limit for individual players
  const GLOBAL_CO2_LIMIT = 1000; // Global CO2 total limit
  const BANKRUPTCY_THRESHOLD = -500; // Bankruptcy threshold

  // AI decision delay
  const [aiThinking, setAiThinking] = useState(false);

  // AI automatic action logic
  useEffect(() => {
    if (aiThinking && currentPlayer.type !== 'human' && gamePhase === 'rolling') {
      console.log(`AI player ${currentPlayer.name} automatically rolls dice`);
      const timer = setTimeout(() => {
        let finalRoll;
        
        if (currentPlayer.diceModifier === -999) {
          // Bus travel: can only roll 1,3,5,7 points
          const busRolls = [1, 3, 5, 7];
          finalRoll = busRolls[Math.floor(Math.random() * busRolls.length)];
          console.log(`AI player ${currentPlayer.name} uses bus travel, rolled ${finalRoll} points`);
        } else {
          const baseRoll = Math.floor(Math.random() * 6) + 1;
          finalRoll = Math.max(1, Math.min(6, baseRoll + currentPlayer.diceModifier)); // Apply dice modifier, limit to 1-6 range
          console.log(`AI player ${currentPlayer.name} rolled ${baseRoll} points (modifier: ${currentPlayer.diceModifier > 0 ? '+' : ''}${currentPlayer.diceModifier}) = ${finalRoll} points`);
        }
        
        setAiThinking(false);
        movePlayerById(currentPlayer.id, finalRoll);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [aiThinking, currentPlayer, gamePhase]);

  // Calculate player score
  const calculatePlayerScore = (player: Player): number => {
    // Scoring system as specified: 1 point per 100 coins, 1 point per 10 eco points, -1 point per 10 CO2 points, building bonuses
    const moneyScore = Math.floor(player.money / 100); // 1 point per 100 coins
    const ecoScore = Math.floor(player.eco / 10); // 1 point per 10 ecological points
    const co2Penalty = Math.floor(player.co2 / 10) * -1; // -1 point per 10 CO2 points
    const buildingBonus = Object.keys(player.built).length * 50; // 50 points bonus per building
    
    return moneyScore + ecoScore + co2Penalty + buildingBonus;
  };

  // Check game end conditions
  const checkGameEnd = useCallback(() => {
    if (gameResult.isEnded) return;

    // Check turn limit
    if (turnCount >= MAX_TURNS) {
      endGame('Turn limit reached', 'Time up');
      return;
    }

    // Check bankruptcy conditions
    const bankruptPlayers = players.filter(p => p.money <= BANKRUPTCY_THRESHOLD);
    if (bankruptPlayers.length > 0) {
      const survivingPlayers = players.filter(p => p.money > BANKRUPTCY_THRESHOLD);
      if (survivingPlayers.length === 1) {
        endGame('Other players bankrupt', `${survivingPlayers[0].name} wins`);
        return;
      }
    }

    // Check global CO2 total limit
    const totalCO2 = players.reduce((sum, player) => sum + player.co2, 0);
    if (totalCO2 >= GLOBAL_CO2_LIMIT) {
      endGame('Global Environmental Crisis', `Global CO2 emissions reached ${GLOBAL_CO2_LIMIT}, environmental collapse!`);
      return;
    }

    // Check if any player reached super high score (early victory)
    const scores = players.map(p => calculatePlayerScore(p));
    const maxScore = Math.max(...scores);
    if (maxScore >= 3000) {
      const winner = players[scores.indexOf(maxScore)];
      endGame('Victory Score Reached', `${winner.name} wins early`);
      return;
    }
  }, [players, turnCount, gameResult.isEnded]);

  // Listen to voting status changes, automatically trigger next player vote or end voting
  useEffect(() => {
    if (!votingInProgress || !currentPolicy) return;
    
    console.log(`🔄 Voting status check: ${votedPlayers.size}/${players.length} players voted`);
    
    // Check if all players have voted
    if (votedPlayers.size >= players.length) {
      console.log(`🏁 All players voted, preparing to end voting`);
      setTimeout(() => {
        finalizePolicyVoting();
      }, 1000);
    } else if (votedPlayers.size > 0) {
      // Only trigger next player vote after someone has voted
      console.log(`➡️ Continue to next player vote`);
      setTimeout(() => {
        triggerNextPlayerVote();
      }, 500);
    }
  }, [votedPlayers, votingInProgress, currentPolicy, players.length]);

  // 自动导出游戏数据
  const autoExportGameData = (winner: Player | null, reason: string, scores: any[], players: Player[]) => {
    const gameData = {
      gameInfo: {
        endTime: new Date().toISOString(),
        totalTurns: turnCount,
        endReason: reason,
        winner: winner ? {
          id: winner.id,
          name: winner.name,
          type: winner.type
        } : null
      },
      finalScores: scores,
      playerDetails: players.map(player => ({
        id: player.id,
        name: player.name,
        type: player.type,
        finalStats: {
          money: player.money,
          co2: player.co2,
          eco: player.eco,
          buildings: Object.keys(player.built).length,
          buildingDetails: player.built
        }
      })),
      eventHistory: eventHistory,
      exportTime: new Date().toLocaleString('zh-CN')
    };

    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `carbon-clash-auto-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('🎯 Game data auto-exported successfully!');
  };

  // End game
  const endGame = (reason: string, message: string) => {
    const scores = players.map(player => ({
      playerId: player.id,
      score: calculatePlayerScore(player)
    }));
    
    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    const rankedScores = scores.map((score, index) => ({
      ...score,
      rank: index + 1
    }));
    
    const winner = players.find(p => p.id === rankedScores[0].playerId) || null;
    
    setGameResult({
      isEnded: true,
      winner,
      reason: `${reason}: ${message}`,
      scores: rankedScores
    });
    
    setGamePhase('ended');
    console.log(`Game ended: ${reason} - ${message}`);
    
    // 自动导出游戏数据
    setTimeout(() => {
      autoExportGameData(winner, `${reason}: ${message}`, rankedScores, players);
    }, 1000); // 延迟1秒导出，确保游戏状态已完全更新
  };

  // Restart game
  const restartGame = () => {
    // Reset all states
    setPlayers([
      {
        id: 0,
        type: 'human',
        name: 'Player',
        position: 0,
        money: 1000,
        co2: 0,
        eco: 0,
        built: {},
        passedStart: false,
        skipTurns: 0,
        diceModifier: 0,
        co2PerTurn: 0,
        moneyPerTurn: 0
      },
      {
        id: 1,
        type: 'ai-income',
        name: 'AI Business',
        position: 0,
        money: 1000,
        co2: 0,
        eco: 0,
        built: {},
        passedStart: false,
        skipTurns: 0,
        diceModifier: 0,
        co2PerTurn: 0,
        moneyPerTurn: 0
      },
      {
        id: 2,
        type: 'ai-eco',
        name: 'AI Eco',
        position: 0,
        money: 1000,
        co2: 0,
        eco: 0,
        built: {},
        passedStart: false,
        skipTurns: 0,
        diceModifier: 0,
        co2PerTurn: 0,
        moneyPerTurn: 0
      }
    ]);
    
    setCurrentPlayerIndex(0);
    setDiceRoll(null);
    setTurnCount(0);
    setGamePhase('rolling');
    setGameResult({ isEnded: false, winner: null, reason: '', scores: [] });
    setCurrentEvent(null);
    setCurrentPolicy(null);
    setEventHistory([]);
    setShowEventModal(false);
    setShowPolicyModal(false);
    // setPendingPolicyPlayer(null);
    // Reset voting status
     setVotingInProgress(false);
     setPlayerVotes({});
     setVotedPlayers(new Set());
     setCurrentVotingPlayerId(undefined);
     setPolicyResult(null);
     setShowPolicyResult(false);
     setAiThinking(false);
  };

  // Calculate building effects per turn
  const calculateBuildingEffects = (player: Player) => {
    let totalIncome = 0;
    let totalCO2 = 0;
    let totalEco = 0;
    
    Object.values(player.built).forEach(buildingInfo => {
      const buildingLevelData = getBuildingLevelData(buildingInfo.type, buildingInfo.level);
      if (buildingLevelData) {
        totalIncome += buildingLevelData.income;
        totalCO2 += buildingLevelData.co2PerTurn;
        totalEco += buildingLevelData.ecoPerTurn;
      }
    });
    
    // Add persistent CO2 effects from policies
    totalCO2 += player.co2PerTurn;
    
    // Add persistent coin effects from policies
    totalIncome += player.moneyPerTurn;
    
    return { totalIncome, totalCO2, totalEco };
  };

  // Apply event effects
  const applyEventEffects = (playerId: number, effects: any) => {
    setPlayers(prev => prev.map(player => {
      if (player.id !== playerId) return player;
      
      let newMoney = player.money;
      let newMoneyPerTurn = player.moneyPerTurn;
      
      // Handle fixed money changes
      if (effects.money !== undefined) {
        if (effects.money === -0.1) {
          // 特殊处理：-10%金钱
          newMoney = Math.max(0, player.money * 0.9);
        } else {
          newMoney = Math.max(0, player.money + effects.money);
        }
      }
      
      // 处理每回合金钱变化
      if (effects.moneyPerTurn !== undefined) {
        if (effects.moneyPerTurn === 0.15) {
          // 特殊处理：+15%每回合金钱产出
          const currentIncome = getTotalIncomeForPlayer(player);
          newMoneyPerTurn = player.moneyPerTurn + Math.floor(currentIncome * 0.15);
        } else {
          newMoneyPerTurn = player.moneyPerTurn + effects.moneyPerTurn;
        }
      }
      
      return {
        ...player,
        money: newMoney,
        co2: Math.max(0, player.co2 + (effects.co2 || 0)),
        eco: Math.max(0, player.eco + (effects.eco || 0)),
        skipTurns: player.skipTurns + (effects.skipTurns || 0),
        diceModifier: player.diceModifier + (effects.diceModifier || 0),
        co2PerTurn: player.co2PerTurn + (effects.co2PerTurn || 0),
        moneyPerTurn: newMoneyPerTurn
      };
    }));
  };
  
  // 计算指定玩家的总收入
  const getTotalIncomeForPlayer = (player: Player) => {
    return Object.values(player.built).reduce((total, buildingInfo) => {
      const levelData = getBuildingLevelData(buildingInfo.type, buildingInfo.level);
      return total + (levelData?.income || 0);
    }, 0);
  };

  // Calculate dynamic tax based on CO2 emissions
  const calculateDynamicTaxEvent = (playerId: number): GameEvent => {
    const player = players[playerId];
    const baseTax = 100; // Base tax
    const co2Tax = Math.floor(player.co2 * 1.5); // 1.5 coins tax per CO2 emission point
    const totalTax = baseTax + co2Tax;
    
    // Choose different tax events based on CO2 emissions
    if (player.co2 <= 50) {
      return {
        id: "low_emission_tax",
        name: "Low Emission Tax",
        description: `Base tax ${baseTax} + CO2 tax ${co2Tax} = ${totalTax} coins`,
        icon: "💰",
        effects: { money: -totalTax }
      };
    } else if (player.co2 <= 150) {
      return {
        id: "medium_emission_tax",
        name: "Medium Emission Tax",
        description: `Base tax ${baseTax} + CO2 tax ${co2Tax} = ${totalTax} coins`,
        icon: "🏭",
        effects: { money: -totalTax }
      };
    } else {
      return {
        id: "high_emission_penalty",
        name: "High Emission Heavy Tax",
        description: `Base tax ${baseTax} + CO2 heavy tax ${co2Tax} = ${totalTax} coins`,
        icon: "💀",
        effects: { money: -totalTax, co2: -5 } // High emissions also force a reduction of 5 CO2 points
      };
    }
  };

  // 触发格子事件
  const triggerCellEvent = (cellType: string, playerId: number) => {
    let event: GameEvent | null = null;
    
    switch (cellType) {
      case 'event':
        event = getRandomEvent(randomEvents);
        break;
      case 'tax':
        event = calculateDynamicTaxEvent(playerId); // Use dynamic tax calculation
        break;
      case 'trap':
        event = getRandomEvent(trapEvents);
        break;
      case 'nature':
        event = getRandomEvent(natureRewards);
        break;
      case 'policy':
        const policy = getRandomPolicyChoice();
        startPolicyVoting(policy);
        return;
      default:
        return;
    }
    
    if (event) {
      // 特殊处理个人交通工具选择事件
      if (event.id === 'vehicle_choice_event') {
        setPendingTransportPlayer(playerId);
        setEventHistory(prev => [...prev, `${players[playerId].name}: ${event.name}`]);
        
        if (players[playerId].type === 'human') {
          setShowTransportModal(true);
        } else {
          // AI automatically chooses transport mode
          setTimeout(() => {
            const aiChoice = players[playerId].type === 'ai-eco' ? 1 : // 环保AI选择自行车
                           players[playerId].type === 'ai-income' ? 2 : // 商业AI选择汽车
                           0; // 默认步行
            handleTransportChoice(aiChoice);
          }, 1000);
        }
        return;
      }
      
      setCurrentEvent(event);
      setEventHistory(prev => [...prev, `${players[playerId].name}: ${event.name}`]);
      applyEventEffects(playerId, event.effects);
      
      if (players[playerId].type === 'human') {
        setShowEventModal(true);
      } else {
        // AI自动关闭事件
        setTimeout(() => {
          setCurrentEvent(null);
          setShowEventModal(false);
        }, 1500);
      }
    }
  };

  // AI政策选择逻辑（带30秒超时）
  // const handleAIPolicyChoice = async (playerId: number, policy: PolicyChoice) => {
  //   const player = players[playerId];
  //   
  //   // 创建30秒超时的Promise
  //   const timeoutPromise = new Promise<number>((_, reject) => {
  //     setTimeout(() => {
  //       reject(new Error('DeepSeek政策选择API调用超时（30秒）'));
  //     }, 30000); // 30秒超时
  //   });

  //   // 创建API调用Promise
  //   const apiPromise = async (): Promise<number> => {
  //     // 使用DeepSeek API进行政策选择
  //     const choiceIndex = await getAIPolicyChoiceFromDeepSeek(player, policy.choices);
  //     console.log(`DeepSeek AI (${player.name}) 政策选择: ${choiceIndex}`);
  //     return choiceIndex;
  //   };

  //   try {
  //     // 使用Promise.race实现超时机制
  //     console.log(`⏰ 开始政策选择API调用，最大等待时间30秒...`);
  //     const choiceIndex = await Promise.race([apiPromise(), timeoutPromise]);
  //     handlePolicyChoice(choiceIndex);
  //   } catch (error) {
  //     if (error instanceof Error && error.message.includes('超时')) {
  //       console.warn('⏰ DeepSeek政策选择API调用超时（30秒），使用备用逻辑:', error.message);
  //     } else {
  //       console.error('❌ DeepSeek政策选择失败，使用备用逻辑:', error);
  //     }
  //     
  //     // 备用逻辑：原有的简单AI决策
  //     let choiceIndex = 0;
  //     
  //     if (player.type === 'ai-income') {
  //       // 商业AI优先选择增加金钱的选项
  //       choiceIndex = policy.choices.findIndex(choice => (choice.effects.money || 0) > 0);
  //       if (choiceIndex === -1) {
  //         // 如果没有增加金钱的选项，选择损失最少的
  //         choiceIndex = policy.choices.reduce((bestIdx, choice, idx) => {
  //           const currentMoney = choice.effects.money || 0;
  //           const bestMoney = policy.choices[bestIdx].effects.money || 0;
  //           return currentMoney > bestMoney ? idx : bestIdx;
  //         }, 0);
  //       }
  //     } else if (player.type === 'ai-eco') {
  //       // 环保AI优先选择增加生态或减少CO2的选项
  //       choiceIndex = policy.choices.findIndex(choice => 
  //         (choice.effects.eco || 0) > 0 || (choice.effects.co2 || 0) < 0
  //       );
  //       if (choiceIndex === -1) {
  //         // 如果没有环保选项，选择对环境影响最小的
  //         choiceIndex = policy.choices.reduce((bestIdx, choice, idx) => {
  //           const currentEcoScore = (choice.effects.eco || 0) - (choice.effects.co2 || 0);
  //           const bestEcoScore = (policy.choices[bestIdx].effects.eco || 0) - (policy.choices[bestIdx].effects.co2 || 0);
  //           return currentEcoScore > bestEcoScore ? idx : bestIdx;
  //         }, 0);
  //       }
  //     }
  //     
  //     handlePolicyChoice(choiceIndex);
  //   }
  // };

  // AI升级选择逻辑（使用DeepSeek API，带30秒超时）
  const getAIUpgradeChoice = async (player: Player): Promise<boolean> => {
    console.log(`🤖 Starting AI upgrade decision - Player: ${player.name}, Money: ${player.money}`);
    console.log(`🔍 Current game phase: ${gamePhase}, turn count: ${turnCount}`);
    
    // Check all player buildings and find upgradeable ones
    const upgradableBuildings: Array<{position: number, buildingType: BuildingType, upgradeCost: number}> = [];
    
    Object.entries(player.built).forEach(([posKey, buildingInfo]) => {
      // 找到建筑对应的位置
      const position = pathCoordinates.findIndex(coord => `${coord.row}-${coord.col}` === posKey);
      if (position !== -1 && canUpgradeHereForPlayer(player.id, position)) {
        const upgradeCost = getUpgradeCost(buildingInfo.type, buildingInfo.level);
        if (upgradeCost) {
          upgradableBuildings.push({
            position,
            buildingType: buildingInfo.type,
            upgradeCost
          });
        }
      }
    });
    
    console.log(`🏗️ Found ${upgradableBuildings.length} upgradable buildings:`, upgradableBuildings);
    
    // If no upgradeable buildings, return false directly
    if (upgradableBuildings.length === 0) {
      console.log(`❌ AI player ${player.name} has no upgradeable buildings`);
      return false;
    }
    
    // 创建30秒超时的Promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => {
        reject(new Error('DeepSeek API升级决策调用超时（30秒）'));
      }, 30000); // 30秒超时
    });
    
    // 创建API调用Promise
    const apiPromise = async (): Promise<boolean> => {
      console.log(`🌐 Trying to use DeepSeek API for upgrade decision...`);
      console.log(`🔑 API configuration check:`, {
        hasApiKey: !!import.meta.env.VITE_DEEPSEEK_API_KEY,
        apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL,
        model: import.meta.env.VITE_DEEPSEEK_MODEL
      });
      
      // 使用DeepSeek API进行升级选择
      const apiGamePhase: 'rolling' | 'building' | 'waiting' = gamePhase === 'ended' ? 'building' : gamePhase;
      const shouldUpgrade = await getAIUpgradeChoiceFromDeepSeek(player, upgradableBuildings, players, turnCount, apiGamePhase);
      console.log(`✅ DeepSeek API upgrade decision successful! Player ${player.name} decided: ${shouldUpgrade ? 'upgrade' : 'no upgrade'}`);
      console.log(`📊 Decision source: DeepSeek AI (intelligent decision)`);
      return shouldUpgrade;
    };
    
    try {
      // 使用Promise.race来实现超时机制
      const shouldUpgrade = await Promise.race([apiPromise(), timeoutPromise]);
      return shouldUpgrade;
    } catch (error) {
      console.error(`❌ DeepSeek API升级决策失败或超时:`, error);
      console.log(`🔧 Switching to fallback upgrade logic...`);
      
      // 备用升级逻辑
      if (player.type === 'ai-income') {
        // 商业AI：如果有工厂且钱够，优先升级工厂
        const factoryToUpgrade = upgradableBuildings.find(b => b.buildingType === 'factory' && player.money >= b.upgradeCost);
        if (factoryToUpgrade) {
          console.log(`🏭 Fallback logic: Business AI chooses to upgrade factory`);
          return true;
        }
        // 如果钱很多（超过400），升级任何建筑
        if (player.money >= 400) {
          console.log(`💰 Fallback logic: Business AI has sufficient funds, chooses to upgrade`);
          return true;
        }
      } else if (player.type === 'ai-eco') {
        // 环保AI：优先升级绿色建筑
        const greenToUpgrade = upgradableBuildings.find(b => b.buildingType === 'green' && player.money >= b.upgradeCost);
        if (greenToUpgrade) {
          console.log(`🌱 Fallback logic: Eco AI chooses to upgrade green building`);
          return true;
        }
        // 如果钱很多（超过350），升级非工厂建筑
        if (player.money >= 350) {
          const nonFactoryToUpgrade = upgradableBuildings.find(b => b.buildingType !== 'factory' && player.money >= b.upgradeCost);
          if (nonFactoryToUpgrade) {
            console.log(`💰 Fallback logic: Eco AI has sufficient funds, chooses to upgrade non-factory building`);
            return true;
          }
        }
      }
      
      console.log(`❌ Fallback logic: No upgrade`);
      return false;
    }
  };

  // AI建筑选择逻辑（使用DeepSeek API，带30秒超时）
  const getAIBuildingChoice = async (player: Player, actualPosition?: number): Promise<BuildingType | null> => {
    // 使用传入的实际位置，如果没有传入则使用玩家当前位置
    const currentPosition = actualPosition !== undefined ? actualPosition : player.position;
    const playerWithCorrectPosition = { ...player, position: currentPosition };
    
    console.log(`🤖 Starting AI decision - Player: ${player.name}, Position: ${currentPosition}, Money: ${player.money}`);
    console.log(`🔍 Current game phase: ${gamePhase}, turn count: ${turnCount}`);
    console.log(`📍 Complete player state:`, playerWithCorrectPosition);
    
    // 创建30秒超时的Promise
    const timeoutPromise = new Promise<BuildingType | null>((_, reject) => {
      setTimeout(() => {
        reject(new Error('DeepSeek API调用超时（30秒）'));
      }, 30000); // 30秒超时
    });
    
    // 创建API调用Promise
    const apiPromise = async (): Promise<BuildingType | null> => {
      console.log(`🌐 Trying to use DeepSeek API for decision...`);
      console.log(`🔑 API configuration check:`, {
        hasApiKey: !!import.meta.env.VITE_DEEPSEEK_API_KEY,
        apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL,
        model: import.meta.env.VITE_DEEPSEEK_MODEL
      });
      
      // 使用DeepSeek API进行建筑选择（传入位置修正后的玩家信息）
      const apiGamePhase: 'rolling' | 'building' | 'waiting' = gamePhase === 'ended' ? 'building' : gamePhase;
      const choice = await getAIChoiceFromDeepSeek(playerWithCorrectPosition, players, apiGamePhase, turnCount);
      console.log(`✅ DeepSeek API decision successful! Player ${player.name} chose: ${choice || 'none'}`);
      console.log(`📊 Decision source: DeepSeek AI (intelligent decision)`);
      return choice;
    };
    
    try {
      // 使用Promise.race实现超时机制
      console.log(`⏰ Starting API call, maximum wait time 30 seconds...`);
      const choice = await Promise.race([apiPromise(), timeoutPromise]);
      return choice;
    } catch (error) {
      if (error instanceof Error && error.message.includes('超时')) {
        console.warn('⏰ DeepSeek API调用超时（30秒），切换到备用逻辑:', error.message);
      } else {
        console.error('❌ DeepSeek API调用失败，切换到备用逻辑:', error);
      }
      console.log(`🔄 Using local fallback logic for decision making...`);
      
      // 备用逻辑：原有的简单AI决策（使用位置修正后的玩家信息）
      const currentPosition = pathCoordinates[playerWithCorrectPosition.position];
      const posKey = `${currentPosition.row}-${currentPosition.col}`;
      
      // 检查格子类型：只有可建造格子才能建造
      if (currentPosition.type !== 'build') {
        console.log(`⚠️ Fallback logic decision: Current cell type is ${currentPosition.type}, not a buildable cell, cannot build`);
        return null;
      }
      
      // 检查是否可以建造
      if (playerWithCorrectPosition.built[posKey]) {
        console.log(`⚠️ Fallback logic decision: Position already has building, cannot build`);
        return null;
      }
      if (playerWithCorrectPosition.position === 0 && !playerWithCorrectPosition.passedStart) {
        console.log(`⚠️ Fallback logic decision: At starting point and haven't passed start, cannot build`);
        return null;
      }
      
      let choice: BuildingType | null = null;
      
      if (playerWithCorrectPosition.type === 'ai-income') {
        // 商业AI优先建造工厂（高收入）
        if (playerWithCorrectPosition.money >= 300) choice = 'factory';
        else if (playerWithCorrectPosition.money >= 200) choice = 'residential';
        else if (playerWithCorrectPosition.money >= 150) choice = 'green';
      } else if (playerWithCorrectPosition.type === 'ai-eco') {
        // 环保AI优先建造绿色建筑
        if (playerWithCorrectPosition.money >= 150) choice = 'green';
        else if (playerWithCorrectPosition.money >= 200) choice = 'residential';
        // 环保AI避免建造工厂，除非钱太多
        else if (playerWithCorrectPosition.money >= 500) choice = 'factory';
      }
      
      console.log(`🔧 Fallback logic decision completed! Player ${playerWithCorrectPosition.name} chose: ${choice || 'none'}`);
      console.log(`📊 Decision source: Local fallback logic (simple rules)`);
      return choice;
    }
  };

  // 检查指定位置是否有任何玩家建造了建筑
  const getBuildingOwnerAtPosition = (position: number): Player | null => {
    const currentPosition = pathCoordinates[position];
    const posKey = `${currentPosition.row}-${currentPosition.col}`;
    
    for (const player of players) {
      if (player.built[posKey]) {
        return player;
      }
    }
    return null;
  };
  
  // 检查指定玩家是否可以在其位置建造
  const canBuildHereForPlayer = (playerId: number, actualPosition?: number): boolean => {
    const player = players.find(p => p.id === playerId);
    if (!player) return false;
    
    // 只有人类玩家在建造阶段才能建造（AI有自己的建造逻辑）
    if (player.type !== 'human' && gamePhase !== 'building') {
      // AI可以在任何时候建造（由AI逻辑控制）
    } else if (player.type === 'human' && gamePhase !== 'building') {
      return false;
    }
    
    // 使用传入的实际位置，如果没有传入则使用玩家当前位置
    const checkPosition = actualPosition !== undefined ? actualPosition : player.position;
    
    // 检查格子类型，只有'build'类型的格子才能建造
    const currentCell = pathCoordinates[checkPosition];
    if (!currentCell || currentCell.type !== 'build') {
      console.log(`🚫 Position ${checkPosition} is not a build cell, type: ${currentCell?.type || 'unknown'}`);
      return false;
    }
    
    // 检查是否有任何玩家在此位置建造了建筑
    const buildingOwner = getBuildingOwnerAtPosition(checkPosition);
    if (buildingOwner) return false; // 已有建筑，无法建造
    
    if (checkPosition === 0 && !player.passedStart) return false;
    return true;
  };

  // 检查指定玩家是否可以在其位置升级建筑
  const canUpgradeHereForPlayer = (playerId: number, actualPosition?: number): boolean => {
    const player = players.find(p => p.id === playerId);
    if (!player) return false;
    
    // 使用传入的实际位置，如果没有传入则使用玩家当前位置
    const checkPosition = actualPosition !== undefined ? actualPosition : player.position;
    const currentPosition = pathCoordinates[checkPosition];
    const posKey = `${currentPosition.row}-${currentPosition.col}`;
    
    // 检查是否有该玩家的建筑
    const buildingInfo = player.built[posKey];
    if (!buildingInfo) return false;
    
    // 检查是否已达到最大等级（限制为只能升级一次，即等级2）
    if (buildingInfo.level >= 2) return false;
    
    // 检查升级锁定状态
    const upgradeKey = `${playerId}-${posKey}`;
    if ((window as any).upgradeInProgress && (window as any).upgradeInProgress.has(upgradeKey)) {
      return false;
    }
    
    // 检查是否有足够金钱升级
    const upgradeCost = getUpgradeCost(buildingInfo.type, buildingInfo.level);
    if (!upgradeCost || player.money < upgradeCost) return false;
    
    return true;
  };

  // 在当前位置建造建筑
  const buildAtCurrentForPlayer = (playerId: number, type: BuildingType, actualPosition?: number) => {
    if (!canBuildHereForPlayer(playerId, actualPosition)) return;
    
    const building = buildingData[type];
    if (!building) return;
    
    const cost = building.cost;

    setPlayers(prev => {
      const player = prev.find(p => p.id === playerId);
      if (!player) {
        console.log(`Build error: Player ID ${playerId} not found`);
        return prev;
      }
      
      if (player.money < cost) {
        console.log(`Build failed: Player ${player.name} insufficient funds, needs ${cost}, currently has ${player.money}`);
        return prev;
      }

      // 使用传入的实际位置，如果没有传入则使用玩家当前位置
      const buildingPosition = actualPosition !== undefined ? actualPosition : player.position;
      const currentPosition = pathCoordinates[buildingPosition];
      const posKey = `${currentPosition.row}-${currentPosition.col}`;
      
      console.log(`🏗️ Player ${player.name} builds ${building.name} at position ${buildingPosition} (${posKey})`);

      return prev.map(p => {
        if (p.id !== playerId) return p;
        
        // 应用建造时的一次性效果
        let newCO2 = Math.max(0, p.co2 + building.co2);
        let newEco = Math.max(0, p.eco + building.eco);
        
        const updatedPlayer = {
          ...p,
          built: { ...p.built, [posKey]: { type, level: 1 } },
          money: p.money - cost,
          co2: newCO2,
          eco: newEco
        };
        
        console.log(`✅ Building completed! Player ${p.name}'s buildings:`, updatedPlayer.built);
        return updatedPlayer;
      });
    });
  };

  // 升级建筑函数
  const upgradeAtCurrentForPlayer = (playerId: number, actualPosition?: number) => {
    if (!canUpgradeHereForPlayer(playerId, actualPosition)) return;
    
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // 使用传入的实际位置，如果没有传入则使用玩家当前位置
    const buildingPosition = actualPosition !== undefined ? actualPosition : player.position;
    const currentPosition = pathCoordinates[buildingPosition];
    const posKey = `${currentPosition.row}-${currentPosition.col}`;
    
    const buildingInfo = player.built[posKey];
    if (!buildingInfo) return;
    
    const upgradeCost = getUpgradeCost(buildingInfo.type, buildingInfo.level);
    if (!upgradeCost) return;
    
    const nextLevelData = getBuildingLevelData(buildingInfo.type, buildingInfo.level + 1);
    if (!nextLevelData) return;
    

    
    // 添加升级锁定机制，防止重复升级
    const upgradeKey = `${playerId}-${posKey}`;
    if ((window as any).upgradeInProgress && (window as any).upgradeInProgress.has(upgradeKey)) {
      console.log(`⚠️ Upgrade already in progress, skipping duplicate request: ${upgradeKey}`);
      return;
    }
    
    // 初始化升级进行中的集合
    if (!(window as any).upgradeInProgress) {
      (window as any).upgradeInProgress = new Set();
    }
    
    // 添加升级锁定
    (window as any).upgradeInProgress.add(upgradeKey);
    
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      
      // 再次检查建筑等级，确保没有被其他地方修改
      const currentBuilding = p.built[posKey];
      if (!currentBuilding || currentBuilding.level >= 2) {
        return p;
      }
      
      // 应用升级时的一次性效果（按照用户要求，升级效果为原建筑的一半）
      const baseBuilding = buildingData[buildingInfo.type];
      const upgradeCO2Effect = Math.floor(baseBuilding.co2 / 2);
      const upgradeEcoEffect = Math.floor(baseBuilding.eco / 2);
      
      let newCO2 = Math.max(0, p.co2 + upgradeCO2Effect);
      let newEco = Math.max(0, p.eco + upgradeEcoEffect);
      
      const updatedPlayer = {
        ...p,
        built: { ...p.built, [posKey]: { type: buildingInfo.type, level: 2 } }, // 直接设为最大等级
        money: p.money - upgradeCost,
        co2: newCO2,
        eco: newEco
      };
      
      return updatedPlayer;
    }));
    
    // 延迟清除升级锁定
    setTimeout(() => {
      if ((window as any).upgradeInProgress) {
        (window as any).upgradeInProgress.delete(upgradeKey);
      }
    }, 1000);
  };

  // 移动玩家（使用当前玩家）
  const movePlayer = (steps: number) => {
    movePlayerById(currentPlayer.id, steps);
  };

  // 移动指定玩家
  const movePlayerById = useCallback((playerId: number, steps: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) {
      return;
    }
    
    // 检查是否需要跳过回合
    if (player.skipTurns > 0) {
      setPlayers(prev => prev.map(p => 
        p.id === player.id ? { ...p, skipTurns: p.skipTurns - 1 } : p
      ));
      setDiceRoll(steps);
      console.log(`Player ${player.name} skips turn, remaining skip turns: ${player.skipTurns - 1}`);
      // 使用nextTurn函数来确保正确的回合切换
      nextTurn();
      return;
    }

    setDiceRoll(steps);
    
    // 计算建筑每回合效果
    const effects = calculateBuildingEffects(player);
    
    const newPosition = (player.position + steps) % pathCoordinates.length;
    const passedStart = newPosition === 0 && player.position !== 0;
    
    // 检查新位置是否有其他玩家的建筑（租金收取）
    const buildingOwner = getBuildingOwnerAtPosition(newPosition);
    let rentAmount = 0;
    let rentPaidTo = null;
    
    if (buildingOwner && buildingOwner.id !== player.id) {
      // 计算租金（建筑成本的30%）
      const currentPosition = pathCoordinates[newPosition];
      const posKey = `${currentPosition.row}-${currentPosition.col}`;
      const buildingInfo = buildingOwner.built[posKey];
      
      const rentMap = {
        factory: 90,    // 300 * 0.3
        residential: 60, // 200 * 0.3
        green: 45,      // 150 * 0.3
      };
      
      rentAmount = rentMap[buildingInfo.type] || 0;
      rentPaidTo = buildingOwner.id;
      
      // Add event history record
      setEventHistory(prev => [...prev, `${player.name} paid rent ${rentAmount} coins to ${buildingOwner.name} (${buildingInfo.type === 'factory' ? 'Factory' : buildingInfo.type === 'residential' ? 'Residential' : 'Green Building'})`]);
    }
    
    setPlayers(prev => prev.map(p => {
      if (p.id === player.id) {
        // 移动玩家并扣除租金
        return {
          ...p,
          position: newPosition,
          passedStart: passedStart || p.passedStart,
          money: Math.max(0, p.money + effects.totalIncome - rentAmount),
          co2: Math.max(0, p.co2 + effects.totalCO2),
          eco: Math.max(0, p.eco + effects.totalEco)
        };
      } else if (p.id === rentPaidTo) {
        // 给建筑所有者增加租金收入
        return {
          ...p,
          money: p.money + rentAmount
        };
      }
      return p;
    }));
    
    // 触发格子事件
    const currentCell = pathCoordinates[newPosition];
    
    setTimeout(() => {
      // 先检查碳排放监狱
      if (!checkCO2Jail(player.id)) {
        // 如果没有被送入监狱，处理特殊格子效果
        handleSpecialCell(newPosition, player.id);
        
        // 然后触发普通格子事件
        triggerCellEvent(currentCell.type, player.id);
      } else {
        // 如果被送入监狱，直接切换回合
        if (player.type !== 'human') {
          setTimeout(() => {
            nextTurn();
          }, 2000);
        } else {
          setGamePhase('waiting');
        }
        return;
      }
      
      triggerCellEvent(currentCell.type, player.id);
      
      // 检查格子类型，只有可建造格子才进入建造阶段
      const canBuildOnThisCell = currentCell.type === 'build';
      
      if (canBuildOnThisCell) {
        setGamePhase('building');
        
        // AI自动建造（仅在可建造格子上）
        if (player.type !== 'human') {
          console.log(`AI player ${player.name} is on a buildable cell, preparing to enter building phase`);
          // 传入新位置参数，确保AI建造决策使用移动后的实际位置
          setTimeout(() => {
            handleAIBuildingById(player.id, newPosition);
          }, 500);
        } else {
          console.log(`Human player ${player.name} is on a buildable cell, entering building phase`);
        }
      } else {
        // 事件格子：只处理事件效果，不进入建造阶段
        console.log(`Player ${player.name} is on an event cell, only processing event effects, no building`);
        
        // 检查是否是政策格子，政策格子的回合切换由handlePolicyChoice处理
        const isPolicyCell = currentCell.type === 'policy';
        
        if (player.type !== 'human') {
          // AI player on event cell: only switch turns directly for non-policy cells
          if (!isPolicyCell) {
            setTimeout(() => {
              console.log(`AI player ${player.name} event processing completed, switching to next turn directly`);
              nextTurn();
            }, 2000); // 给事件处理一些时间
          } else {
            console.log(`AI player ${player.name} is on a policy cell, waiting for policy selection to complete before switching turns`);
          }
        } else {
          // Human player on event cell: wait for user to close event popup before manually switching turns
          console.log(`Human player ${player.name} is on an event cell, waiting for user to handle event`);
          setGamePhase('waiting'); // 设置为等待状态
        }
      }
    }, 1000);
  }, [players, setPlayers, setGamePhase, triggerCellEvent, getAIBuildingChoice, buildAtCurrentForPlayer, setCurrentPlayerIndex, setTurnCount, setAiThinking]);

  // 下一回合
  const nextTurn = useCallback(() => {
    setCurrentPlayerIndex(prevIndex => {
      const nextPlayerIndex = (prevIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];
      
      console.log(`Turn switch: from player ${prevIndex}(${players[prevIndex]?.name}) to player ${nextPlayerIndex}(${nextPlayer?.name})`);
      
      setGamePhase('rolling');
      setTurnCount(prev => {
        const newTurnCount = prev + 1;
        // 延迟检查游戏结束条件，确保状态更新完成
        setTimeout(() => checkGameEnd(), 100);
        return newTurnCount;
      });
      
      // 如果下一个玩家是AI，设置AI思考状态
      if (nextPlayer.type !== 'human') {
        console.log(`AI player ${nextPlayer.name} starts turn`);
        setAiThinking(true);
      } else {
        console.log(`Human player ${nextPlayer.name} starts turn`);
      }
      
      return nextPlayerIndex;
    });
  }, [players, triggerCellEvent, setCurrentPlayerIndex, setGamePhase, setTurnCount, setAiThinking, setPlayers, getAIBuildingChoice, buildAtCurrentForPlayer]);

  // AI建造状态锁，防止重复调用
  const [aiBuildingInProgress, setAiBuildingInProgress] = useState<Set<number>>(new Set());

  // AI建造逻辑（指定玩家）
  const handleAIBuildingById = useCallback(async (playerId: number, actualPosition?: number) => {
    // 检查是否已经在处理这个玩家的建造
    if (aiBuildingInProgress.has(playerId)) {
      console.log(`⚠️ AI player ${playerId} building already in progress, skipping duplicate call`);
      return;
    }
    
    // 设置建造锁
    setAiBuildingInProgress(prev => new Set(prev).add(playerId));
    
    // 清除建造锁的辅助函数
    const clearBuildingLock = () => {
      setAiBuildingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    };
    
    try {
      // 获取最新的玩家状态
      const currentPlayers = players;
      const player = currentPlayers.find(p => p.id === playerId);
      if (!player) {
        console.log(`AI build error: Player ID ${playerId} not found`);
        clearBuildingLock(); // 清除建造锁
        return;
      }
      
      // 使用传入的实际位置，如果没有传入则使用玩家当前位置
      const buildingPosition = actualPosition !== undefined ? actualPosition : player.position;
      console.log(`AI player ${player.name} starts building decision, player state position: ${player.position}, actual building position: ${buildingPosition}`);
      
      // 在调用AI决策之前，先检查是否可以建造，避免不必要的API调用
      if (!canBuildHereForPlayer(playerId, buildingPosition)) {
        console.log(`AI player ${player.name} cannot build at position ${buildingPosition}, skipping AI decision`);
        setTimeout(() => {
          console.log(`AI player ${player.name} building phase ended, switching to next turn`);
          nextTurn();
          clearBuildingLock(); // 清除建造锁
        }, 1000);
        return;
      }
      
      // 传入实际位置参数，确保AI决策使用正确的位置信息
      const buildingChoice = await getAIBuildingChoice(player, buildingPosition);
      
      if (buildingChoice) {
        console.log(`AI player ${player.name} chose to build ${buildingChoice}`);
        buildAtCurrentForPlayer(playerId, buildingChoice, buildingPosition);
      } else {
        console.log(`AI player ${player.name} chose not to build`);
      }
      
      // 建造完成后，检查是否有可升级的建筑
      setTimeout(async () => {
        console.log(`AI player ${player.name} building phase completed, checking upgrade opportunities...`);
        
        try {
          // 获取最新的玩家状态
          const updatedPlayers = players;
          const updatedPlayer = updatedPlayers.find(p => p.id === playerId);
          
          if (updatedPlayer) {
            const shouldUpgrade = await getAIUpgradeChoice(updatedPlayer);
            
            if (shouldUpgrade) {
              console.log(`AI player ${updatedPlayer.name} decides to upgrade building`);
              
              // 找到第一个可升级的建筑并升级
              const upgradableBuildings: Array<{position: number, buildingType: BuildingType, upgradeCost: number}> = [];
              
              Object.entries(updatedPlayer.built).forEach(([posKey, buildingInfo]) => {
                const position = pathCoordinates.findIndex(coord => `${coord.row}-${coord.col}` === posKey);
                if (position !== -1 && canUpgradeHereForPlayer(updatedPlayer.id, position)) {
                  const upgradeCost = getUpgradeCost(buildingInfo.type, buildingInfo.level);
                  if (upgradeCost) {
                    upgradableBuildings.push({
                      position,
                      buildingType: buildingInfo.type,
                      upgradeCost
                    });
                  }
                }
              });
              
              // 选择要升级的建筑（优先级：工厂 > 绿色建筑 > 住宅）
              let buildingToUpgrade = null;
              if (updatedPlayer.type === 'ai-income') {
                // 商业AI优先升级工厂
                buildingToUpgrade = upgradableBuildings.find(b => b.buildingType === 'factory') ||
                                  upgradableBuildings.find(b => b.buildingType === 'residential') ||
                                  upgradableBuildings.find(b => b.buildingType === 'green');
              } else {
                // 环保AI优先升级绿色建筑
                buildingToUpgrade = upgradableBuildings.find(b => b.buildingType === 'green') ||
                                  upgradableBuildings.find(b => b.buildingType === 'residential') ||
                                  upgradableBuildings.find(b => b.buildingType === 'factory');
              }
              
              if (buildingToUpgrade) {
                console.log(`AI player ${updatedPlayer.name} upgrades ${buildingToUpgrade.buildingType} building at position ${buildingToUpgrade.position}`);
                upgradeAtCurrentForPlayer(playerId, buildingToUpgrade.position);
              }
            } else {
              console.log(`AI player ${updatedPlayer.name} decided not to upgrade buildings`);
            }
          }
        } catch (error) {
          console.error(`AI upgrade decision failed:`, error);
        }
        
        // 延迟后切换到下一回合
        setTimeout(() => {
          console.log(`AI player ${player.name} turn ended, switching to next turn`);
          nextTurn();
          clearBuildingLock(); // 清除建造锁
        }, 1500);
      }, 1000);
    } catch (error) {
      console.error(`AI建造决策失败:`, error);
      setTimeout(() => {
        console.log(`AI player build failed, switching to next turn`);
        nextTurn();
        clearBuildingLock(); // 清除建造锁
      }, 1000);
    }
  }, [players, getAIBuildingChoice, getAIUpgradeChoice, buildAtCurrentForPlayer, nextTurn, aiBuildingInProgress, canUpgradeHereForPlayer, upgradeAtCurrentForPlayer]);



  // 检查当前位置是否可以建造
  const canBuildHere = (): boolean => {
    return canBuildHereForPlayer(currentPlayer.id);
  };

  // 测试AI建筑选择（调试用）
  const testAIBuildingChoice = async () => {
    console.log('🧪 Manual testing AI building selection...');
    const aiPlayer = players.find(p => p.type !== 'human');
    if (aiPlayer) {
      console.log('🎯 Found AI player:', aiPlayer.name);
      const choice = await getAIBuildingChoice(aiPlayer);
      console.log('🎲 Test result:', choice);
    } else {
      console.log('❌ AI player not found');
    }
  };

  // 在当前位置建造
  const buildAtCurrent = (type: BuildingType) => {
    buildAtCurrentForPlayer(currentPlayer.id, type);
  };

  // 开始政策投票
  const startPolicyVoting = (policy: PolicyChoice) => {
    setCurrentPolicy(policy);
    setVotingInProgress(true);
    setPlayerVotes({});
    setVotedPlayers(new Set());
    setShowPolicyModal(true);
    
    // Initialize vote count for each option
    const initialVotes: Record<number, number> = {};
    policy.choices.forEach((_, index) => {
      initialVotes[index] = 0;
    });
    setPlayerVotes(initialVotes);
    
    console.log(`🗳️ Starting policy vote: ${policy.name}`);
    
    // 开始按顺序投票，从第一个玩家开始
    setTimeout(() => {
      triggerNextPlayerVote();
    }, 500);
  };
  
  // 触发下一个玩家投票（不接受参数，直接使用状态中的votedPlayers）
  const triggerNextPlayerVote = () => {
    if (!currentPolicy) return;
    
    console.log(`🔍 triggerNextPlayerVote called`);
    console.log(`📋 Voted players:`, Array.from(votedPlayers));
    console.log(`👥 All players:`, players.map(p => `${p.id}:${p.name}(${p.type})`));
    
    // 按顺序查找下一个未投票的玩家: 人类玩家(0) -> 商业AI(1) -> 环保AI(2)
    const playerOrder = [0, 1, 2]; // 投票顺序
    
    let foundNextPlayer = false;
    for (const playerId of playerOrder) {
      const hasVoted = votedPlayers.has(playerId);
      const playerExists = !!players[playerId];
      const player = players[playerId];
      
      console.log(`🔍 Checking player ${playerId}: voted=${hasVoted}, exists=${playerExists}, name=${player?.name}`);
      
      if (!hasVoted && playerExists) {
        console.log(`✅ Found next voting player: ${player.name} (ID: ${playerId}, type: ${player.type})`);
        
        // 设置当前投票玩家
        setCurrentVotingPlayerId(playerId);
        foundNextPlayer = true;
        
        if (player.type === 'human') {
          console.log(`🗳️ Human player ${player.name}'s turn to vote`);
          // 人类玩家通过UI投票，不需要自动触发
          break;
        } else {
          console.log(`🗳️ AI ${player.name}'s turn to vote, auto-voting in 1 second`);
          // AI玩家自动投票，延迟1秒让用户看到顺序
          setTimeout(() => {
            handleAIVote(playerId, currentPolicy!);
          }, 1000);
          break;
        }
      }
    }
    
    if (!foundNextPlayer) {
      console.log(`❌ No next voting player found!`);
    }
    
    console.log(`📊 Current voting status: ${votedPlayers.size}/${players.length} players voted`);
  };
  
  // 处理玩家投票（主要用于人类玩家）
  const handlePolicyVote = (playerId: number, choiceIndex: number) => {
    console.log(`👤 handlePolicyVote started: player ${playerId} (${players[playerId]?.name}) chose ${choiceIndex}`);
    
    if (!votingInProgress || votedPlayers.has(playerId)) {
      console.log(`❌ Human voting blocked: votingInProgress=${votingInProgress}, already voted=${votedPlayers.has(playerId)}`);
      return;
    }
    
    setPlayerVotes(prev => ({
      ...prev,
      [choiceIndex]: (prev[choiceIndex] || 0) + 1
    }));
    
    // Create new set of voted players
    const newVotedPlayers = new Set([...votedPlayers, playerId]);
    setVotedPlayers(newVotedPlayers);
    
    // 清除当前投票玩家ID
    setCurrentVotingPlayerId(undefined);
    
    console.log(`🗳️ Player ${players[playerId].name} voted for option ${choiceIndex}`);
    console.log(`📈 Post-vote status: ${newVotedPlayers.size}/${players.length} players voted`);
  };
  
  // AI投票逻辑
  const handleAIVote = async (playerId: number, policy: PolicyChoice) => {
    console.log(`🤖 handleAIVote started: player ${playerId} (${players[playerId]?.name})`);
    
    if (!votingInProgress || votedPlayers.has(playerId)) {
      console.log(`❌ AI voting blocked: votingInProgress=${votingInProgress}, already voted=${votedPlayers.has(playerId)}`);
      return;
    }
    
    const player = players[playerId];
    let choiceIndex = 0;
    
    try {
      // 使用DeepSeek API进行政策选择
      choiceIndex = await getAIPolicyChoiceFromDeepSeek(player, policy.choices);
      console.log(`🤖 AI ${player.name} chose via DeepSeek: ${choiceIndex}`);
    } catch (error) {
      console.error('AI voting failed, using fallback logic:', error);
      
      // 备用逻辑
      if (player.type === 'ai-income') {
        choiceIndex = policy.choices.findIndex(choice => (choice.effects.money || 0) > 0);
        if (choiceIndex === -1) {
          choiceIndex = policy.choices.reduce((bestIdx, choice, idx) => {
            const currentMoney = choice.effects.money || 0;
            const bestMoney = policy.choices[bestIdx].effects.money || 0;
            return currentMoney > bestMoney ? idx : bestIdx;
          }, 0);
        }
      } else if (player.type === 'ai-eco') {
        choiceIndex = policy.choices.findIndex(choice => 
          (choice.effects.eco || 0) > 0 || (choice.effects.co2 || 0) < 0
        );
        if (choiceIndex === -1) {
          choiceIndex = policy.choices.reduce((bestIdx, choice, idx) => {
            const currentEcoScore = (choice.effects.eco || 0) - (choice.effects.co2 || 0);
            const bestEcoScore = (policy.choices[bestIdx].effects.eco || 0) - (policy.choices[bestIdx].effects.co2 || 0);
            return currentEcoScore > bestEcoScore ? idx : bestIdx;
          }, 0);
        }
      }
    }
    
    // 直接处理AI投票，不通过handlePolicyVote避免递归调用
    setPlayerVotes(prev => ({
      ...prev,
      [choiceIndex]: (prev[choiceIndex] || 0) + 1
    }));
    
    setVotedPlayers(prev => new Set([...prev, playerId]));
    
    // 清除当前投票玩家ID
    setCurrentVotingPlayerId(undefined);
    
    console.log(`🗳️ AI ${player.name} voted for option ${choiceIndex}`);
    console.log(`📈 AI voting completed`);
  };
  
  // 完成政策投票并显示结果
  const finalizePolicyVoting = () => {
    console.log(`🔍 finalizePolicyVoting started executing`);
    console.log(`🔍 currentPolicy:`, currentPolicy);
    console.log(`🔍 votingInProgress:`, votingInProgress);
    console.log(`🔍 playerVotes:`, playerVotes);
    
    if (!currentPolicy || !votingInProgress) {
      console.log(`❌ finalizePolicyVoting early return: currentPolicy=${!!currentPolicy}, votingInProgress=${votingInProgress}`);
      return;
    }
    
    // Calculate winning option
    let winningChoiceIndex = 0;
    let maxVotes = 0;
    
    Object.entries(playerVotes).forEach(([choiceIndex, votes]) => {
      console.log(`🔍 Option ${choiceIndex}: ${votes} votes`);
      if (votes > maxVotes) {
        maxVotes = votes;
        winningChoiceIndex = parseInt(choiceIndex);
      }
    });
    
    console.log(`🏆 Winning option: ${winningChoiceIndex} (${maxVotes} votes)`);
    
    const winningChoice = currentPolicy.choices[winningChoiceIndex];
    
    // Apply policy effects to all players
    players.forEach(player => {
      applyEventEffects(player.id, winningChoice.effects);
    });
    
    // Record event history
    setEventHistory(prev => [
      ...prev, 
      `Policy Vote: ${currentPolicy.name} - ${winningChoice.text} (${maxVotes} votes won)`
    ]);
    
    // 设置结果状态
    const resultData = {
      policy: currentPolicy,
      winningChoiceIndex,
      votes: playerVotes
    };
    console.log(`🔍 Setting policyResult:`, resultData);
    setPolicyResult(resultData);
    
    // 清理投票状态
    setVotingInProgress(false);
    setShowPolicyModal(false);
    setCurrentPolicy(null);
    setCurrentVotingPlayerId(undefined);
    
    // 显示结果弹窗
    console.log(`🔍 Setting showPolicyResult to true`);
    setShowPolicyResult(true);
    
    console.log(`🏆 Policy voting result: Option ${winningChoiceIndex} wins (${maxVotes} votes)`);
    
    // 移除自动关闭，让用户手动关闭结果弹窗
  };
  
  // Close policy result modal
  const closePolicyResult = () => {
    setShowPolicyResult(false);
    setPolicyResult(null);
    
    // Continue game flow
    setTimeout(() => {
      nextTurn();
    }, 500);
  };
  
  // Handle policy choice (compatible with old interface)
  const handlePolicyChoice = (choiceIndex: number) => {
    const humanPlayer = players.find(p => p.type === 'human');
    if (humanPlayer && votingInProgress) {
      handlePolicyVote(humanPlayer.id, choiceIndex);
    }
  };

  // Handle transport choice
  const handleTransportChoice = (choiceIndex: number) => {
    if (pendingTransportPlayer !== null) {
      const transportChoices = [
        { name: "Walking", effects: { diceModifier: 0 } },
        { name: "Bicycle", effects: { diceModifier: 1, moneyPerTurn: -5 } },
        { name: "Car", effects: { diceModifier: 2, co2PerTurn: 5, moneyPerTurn: -10 } },
        { name: "Bus", effects: { diceModifier: -999, moneyPerTurn: -3 } }
      ];
      
      const choice = transportChoices[choiceIndex];
      
      setPlayers(prev => prev.map(p => {
        if (p.id === pendingTransportPlayer) {
          // Reset previous transport effects
          const resetPlayer = {
            ...p,
            diceModifier: 0,
            co2PerTurn: 0,
            moneyPerTurn: 0
          };
          
          // Apply new transport effects
          return {
            ...resetPlayer,
            diceModifier: choice.effects.diceModifier || 0,
            co2PerTurn: choice.effects.co2PerTurn || 0,
            moneyPerTurn: choice.effects.moneyPerTurn || 0
          };
        }
        return p;
      }));
      
      setEventHistory(prev => [...prev, `${players[pendingTransportPlayer].name} chose ${choice.name}`]);
    }
    
    setShowTransportModal(false);
    setPendingTransportPlayer(null);
  };


  
  // Check CO2 jail
  const checkCO2Jail = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (player && player.co2 >= CO2_JAIL_THRESHOLD) {
      // Transport to jail cell (position 10) and skip 2 turns
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, position: 10, skipTurns: 2 } : p
      ));
      setEventHistory(prev => [...prev, `${player.name} sent to jail for excessive CO2 emissions, skip 2 turns!`]);
      return true;
    }
    return false;
  };
  
  // Handle special cell effects
  const handleSpecialCell = (position: number, playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    switch (position) {
      case 0: // Start
        if (player.passedStart) {
          setPlayers(prev => prev.map(p => 
            p.id === playerId ? { ...p, money: p.money + START_BONUS } : p
          ));
          setEventHistory(prev => [...prev, `${player.name} reached start again, received ${START_BONUS} coin bonus!`]);
        }
        break;
        
      case 10: // Jail
        // Arriving at jail cell directly skips 2 turns
        setPlayers(prev => prev.map(p => 
          p.id === playerId ? { ...p, skipTurns: p.skipTurns + 2 } : p
        ));
        setEventHistory(prev => [...prev, `${player.name} arrived at jail, imprisoned for 2 turns!`]);
        break;
        
      case 20: // Free parking
        setPendingTransportPlayer(playerId);
        if (player.type === 'human') {
          setShowTransportModal(true);
        } else {
          // AI自动选择交通方式
          setTimeout(() => {
            const aiChoice = player.type === 'ai-eco' ? 1 : // Eco AI chooses bicycle
                           player.type === 'ai-income' ? 2 : // Business AI chooses car
                           0; // Default walking
            handleTransportChoice(aiChoice);
          }, 1000);
        }
        break;
        
      case 30: // Police station
        // CO2 emission check: if CO2 exceeds 300, detain for one turn
        if (player.co2 > 300) {
          setPlayers(prev => prev.map(p => 
            p.id === playerId ? { ...p, skipTurns: p.skipTurns + 1 } : p
          ));
          setEventHistory(prev => [...prev, `${player.name} detained by police for excessive CO2 emissions (${player.co2}), skip next turn!`]);
        } else {
          setEventHistory(prev => [...prev, `${player.name} arrived at police station, CO2 emission check passed (${player.co2}/300)`]);
        }
        break;
    }
  };
  
  // Close event modal
  const closeEventModal = () => {
    setCurrentEvent(null);
    setShowEventModal(false);
    
    // If current is human player and game phase is waiting, automatically enter next turn after closing event modal
    if (currentPlayer.type === 'human' && gamePhase === 'waiting') {
      setTimeout(() => {
        nextTurn();
      }, 300); // Give user some time to see modal close
    }
  };

  // Close policy modal
  const closePolicyModal = () => {
    setCurrentPolicy(null);
    setShowPolicyModal(false);
    // setPendingPolicyPlayer(null);
  };

  // Get current player position
  const getCurrentPosition = () => pathCoordinates[currentPlayer.position];

  // Get all buildings (for map display)
  const getAllBuildings = (): Record<string, BuildingInfo> => {
    const allBuildings: Record<string, BuildingInfo> = {};
    players.forEach(player => {
      Object.entries(player.built).forEach(([key, building]) => {
        allBuildings[key] = building;
      });
    });
    console.log(`📊 getAllBuildings returns:`, allBuildings);
    return allBuildings;
  };

  // Calculate total income
  const getTotalIncome = () => {
    return Object.values(currentPlayer.built).reduce((total, buildingInfo) => {
      const levelData = getBuildingLevelData(buildingInfo.type, buildingInfo.level);
      return total + (levelData?.income || 0);
    }, 0);
  };

  // Calculate CO2 emissions per turn
  const getTotalCO2PerTurn = () => {
    return Object.values(currentPlayer.built).reduce((total, buildingInfo) => {
      const levelData = getBuildingLevelData(buildingInfo.type, buildingInfo.level);
      return total + (levelData?.co2 || 0);
    }, 0);
  };

  // Calculate ecological effects per turn
  const getTotalEcoPerTurn = () => {
    return Object.values(currentPlayer.built).reduce((total, buildingInfo) => {
      const levelData = getBuildingLevelData(buildingInfo.type, buildingInfo.level);
      return total + (levelData?.eco || 0);
    }, 0);
  };

  // Wrapper functions for current player
  const canUpgradeHere = (playerId?: number) => {
    const targetPlayerId = playerId || currentPlayer.id;
    return canUpgradeHereForPlayer(targetPlayerId);
  };

  const upgradeAtCurrent = (playerId?: number) => {
    const targetPlayerId = playerId || currentPlayer.id;
    return upgradeAtCurrentForPlayer(targetPlayerId);
  };

  return {
    // Player related
    players,
    currentPlayer,
    currentPlayerIndex,
    
    // Game state
    diceRoll,
    turnCount,
    gamePhase,
    aiThinking,
    
    // Position and buildings
    getCurrentPosition,
    getAllBuildings,
    canBuildHere,
    buildAtCurrent,
    canUpgradeHere,
    upgradeAtCurrent,
    
    // Game control
    movePlayer,
    nextTurn,
    
    // Resource calculation
    getTotalIncome,
    getTotalCO2PerTurn,
    getTotalEcoPerTurn,
    
    // Event system
    currentEvent,
    currentPolicy,
    eventHistory,
    showEventModal,
    showPolicyModal,
    handlePolicyChoice,
    closeEventModal,
    closePolicyModal,
    
    // Multiplayer voting system
    votingInProgress,
    playerVotes,
    votedPlayers,
    currentVotingPlayerId,
    policyResult,
    showPolicyResult,
    handlePolicyVote,
    closePolicyResult,
    
    // Transport mode selection
    showTransportModal,
    setShowTransportModal,
    handleTransportChoice,
    
    // Game end system
    gameResult,
    calculatePlayerScore,
    checkGameEnd,
    restartGame,
    MAX_TURNS,
    MAX_CO2,
    GLOBAL_CO2_LIMIT,
    BANKRUPTCY_THRESHOLD,
    
    // Debug functions
    debugAddMoney: (playerId: number, amount: number) => {
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, money: Math.max(0, p.money + amount) } : p
      ));
    },
    debugAddCO2: (playerId: number, amount: number) => {
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, co2: Math.max(0, p.co2 + amount) } : p
      ));
    },
    debugAddEco: (playerId: number, amount: number) => {
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, eco: Math.max(0, p.eco + amount) } : p
      ));
    },
    debugSetTurn: (turn: number) => {
      setTurnCount(Math.max(1, Math.min(MAX_TURNS, turn)));
    },
    debugTriggerGameEnd: () => {
      checkGameEnd();
    },
    debugTestAIChoice: testAIBuildingChoice,
    getBuildingOwnerAtPosition,
  };
};