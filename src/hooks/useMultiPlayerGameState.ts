import { useState, useCallback, useEffect } from "react";
import { pathCoordinates } from "../utils/path";
import type { BuildingType } from "../data/buildings";
import { buildingData } from "../data/buildings";
import type { GameEvent, PolicyChoice } from "../data/events";
import { 
  randomEvents, 
  trapEvents, 
  natureRewards, 
  getRandomEvent,
  getRandomPolicyChoice 
} from "../data/events";
import { getAIBuildingChoiceFromDeepSeek, getAIPolicyChoiceFromDeepSeek } from "../services/deepseekApi";

// 玩家类型
export type PlayerType = 'human' | 'ai-income' | 'ai-eco';

// 建筑信息结构
// 移除 BuildingInfo 接口，恢复到原始的建筑存储方式

// 玩家数据结构
export interface Player {
  id: number;
  type: PlayerType;
  name: string;
  position: number;
  money: number;
  co2: number;
  eco: number;
  built: Record<string, BuildingType>;
  passedStart: boolean;
  skipTurns: number;
  diceModifier: number; // 骰子点数修改器
  co2PerTurn: number; // 每回合额外CO2排放
  moneyPerTurn: number; // 每回合金币消耗（负数为消耗）
}



export const useMultiPlayerGameState = () => {
  // 初始化三个玩家
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 0,
      type: 'human',
      name: '玩家',
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
      name: 'AI商业家',
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
      name: 'AI环保家',
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

  // 游戏结束状态
  const [gameResult, setGameResult] = useState<{
    isEnded: boolean;
    winner: Player | null;
    reason: string;
    scores: { playerId: number; score: number; rank: number }[];
  }>({ isEnded: false, winner: null, reason: '', scores: [] });

  // 事件系统状态
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [currentPolicy, setCurrentPolicy] = useState<PolicyChoice | null>(null);
  const [eventHistory, setEventHistory] = useState<string[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [pendingPolicyPlayer, setPendingPolicyPlayer] = useState<number | null>(null);
  
  // 交通方式选择状态
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [pendingTransportPlayer, setPendingTransportPlayer] = useState<number | null>(null);
  
  // 游戏常量
  const CO2_JAIL_THRESHOLD = 300; // 碳排放监狱阈值
  const START_BONUS = 500; // 再次到达起点的奖励

  const currentPlayer = players[currentPlayerIndex];

  // 游戏常量
  const MAX_TURNS = 30; // 最大回合数
  const MAX_CO2 = 1000; // 单个玩家CO2上限
  const GLOBAL_CO2_LIMIT = 2000; // 全球CO2总和上限
  const BANKRUPTCY_THRESHOLD = -500; // 破产阈值

  // AI决策延迟
  const [aiThinking, setAiThinking] = useState(false);

  // AI自动行动逻辑
  useEffect(() => {
    if (aiThinking && currentPlayer.type !== 'human' && gamePhase === 'rolling') {
      console.log(`AI玩家 ${currentPlayer.name} 自动掷骰子`);
      const timer = setTimeout(() => {
        let finalRoll;
        
        if (currentPlayer.diceModifier === -999) {
          // 公交出行：只能投出1,3,5,7点数
          const busRolls = [1, 3, 5, 7];
          finalRoll = busRolls[Math.floor(Math.random() * busRolls.length)];
          console.log(`AI玩家 ${currentPlayer.name} 使用公交出行，掷出 ${finalRoll} 点`);
        } else {
          const baseRoll = Math.floor(Math.random() * 6) + 1;
          finalRoll = Math.max(1, Math.min(6, baseRoll + currentPlayer.diceModifier)); // 应用骰子修改器，限制在1-6范围内
          console.log(`AI玩家 ${currentPlayer.name} 掷出 ${baseRoll} 点 (修改器: ${currentPlayer.diceModifier > 0 ? '+' : ''}${currentPlayer.diceModifier}) = ${finalRoll} 点`);
        }
        
        setAiThinking(false);
        movePlayerById(currentPlayer.id, finalRoll);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [aiThinking, currentPlayer, gamePhase]);

  // 计算玩家得分
  const calculatePlayerScore = (player: Player): number => {
    // 综合评分系统：金钱 + 生态效益 - CO2惩罚 + 建筑数量奖励
    const moneyScore = player.money * 0.5; // 金钱权重0.5
    const ecoScore = player.eco * 10; // 生态效益权重10
    const co2Penalty = player.co2 * -2; // CO2惩罚权重-2
    const buildingBonus = Object.keys(player.built).length * 50; // 每个建筑50分奖励
    
    return Math.round(moneyScore + ecoScore + co2Penalty + buildingBonus);
  };

  // 检查游戏结束条件
  const checkGameEnd = useCallback(() => {
    if (gameResult.isEnded) return;

    // 检查回合数限制
    if (turnCount >= MAX_TURNS) {
      endGame('回合数达到上限', '时间结束');
      return;
    }

    // 检查破产条件
    const bankruptPlayers = players.filter(p => p.money <= BANKRUPTCY_THRESHOLD);
    if (bankruptPlayers.length > 0) {
      const survivingPlayers = players.filter(p => p.money > BANKRUPTCY_THRESHOLD);
      if (survivingPlayers.length === 1) {
        endGame('其他玩家破产', `${survivingPlayers[0].name} 获胜`);
        return;
      }
    }

    // 检查环境崩溃条件
    const highCO2Players = players.filter(p => p.co2 >= MAX_CO2);
    if (highCO2Players.length > 0) {
      endGame('环境崩溃', `CO2排放过高，游戏结束`);
      return;
    }

    // 检查全球CO2总和限制
    const totalCO2 = players.reduce((sum, player) => sum + player.co2, 0);
    if (totalCO2 >= GLOBAL_CO2_LIMIT) {
      endGame('全球环境危机', `全球CO2总排放量达到${GLOBAL_CO2_LIMIT}，环境崩溃！`);
      return;
    }

    // 检查是否有玩家达到超高分数（提前胜利）
    const scores = players.map(p => calculatePlayerScore(p));
    const maxScore = Math.max(...scores);
    if (maxScore >= 3000) {
      const winner = players[scores.indexOf(maxScore)];
      endGame('达到胜利分数', `${winner.name} 提前获胜`);
      return;
    }
  }, [players, turnCount, gameResult.isEnded]);

  // 结束游戏
  const endGame = (reason: string, message: string) => {
    const scores = players.map(player => ({
      playerId: player.id,
      score: calculatePlayerScore(player)
    }));
    
    // 按分数排序
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
    console.log(`游戏结束: ${reason} - ${message}`);
  };

  // 重新开始游戏
  const restartGame = () => {
    // 重置所有状态
    setPlayers([
      {
        id: 0,
        type: 'human',
        name: '玩家',
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
        name: 'AI商业家',
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
        name: 'AI环保家',
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
    setPendingPolicyPlayer(null);
    setAiThinking(false);
  };

  // 计算建筑每回合效果
  const calculateBuildingEffects = (player: Player) => {
    let totalIncome = 0;
    let totalCO2 = 0;
    let totalEco = 0;
    
    Object.values(player.built).forEach(buildingType => {
      const building = buildingData[buildingType];
      totalIncome += building.income;
      totalCO2 += building.co2PerTurn;
      totalEco += building.ecoPerTurn;
    });
    
    // 添加政策产生的持续性CO2效果
    totalCO2 += player.co2PerTurn;
    
    // 添加政策产生的持续性金币效果
    totalIncome += player.moneyPerTurn;
    
    return { totalIncome, totalCO2, totalEco };
  };

  // 应用事件效果
  const applyEventEffects = (playerId: number, effects: any) => {
    setPlayers(prev => prev.map(player => {
      if (player.id !== playerId) return player;
      
      return {
        ...player,
        money: Math.max(0, player.money + (effects.money || 0)),
        co2: Math.max(0, player.co2 + (effects.co2 || 0)),
        eco: Math.max(0, player.eco + (effects.eco || 0)),
        skipTurns: player.skipTurns + (effects.skipTurns || 0),
        diceModifier: player.diceModifier + (effects.diceModifier || 0),
        co2PerTurn: player.co2PerTurn + (effects.co2PerTurn || 0),
        moneyPerTurn: player.moneyPerTurn + (effects.moneyPerTurn || 0)
      };
    }));
  };

  // 计算基于CO2排放量的动态税收
  const calculateDynamicTaxEvent = (playerId: number): GameEvent => {
    const player = players[playerId];
    const baseTax = 100; // 基础税收
    const co2Tax = Math.floor(player.co2 * 1.5); // 每点CO2排放收取1.5金币税收
    const totalTax = baseTax + co2Tax;
    
    // 根据CO2排放量选择不同的税收事件
    if (player.co2 <= 50) {
      return {
        id: "low_emission_tax",
        name: "低排放税收",
        description: `基础税收 ${baseTax} + CO2税收 ${co2Tax} = ${totalTax} 金币`,
        icon: "💰",
        effects: { money: -totalTax }
      };
    } else if (player.co2 <= 150) {
      return {
        id: "medium_emission_tax",
        name: "中等排放税收",
        description: `基础税收 ${baseTax} + CO2税收 ${co2Tax} = ${totalTax} 金币`,
        icon: "🏭",
        effects: { money: -totalTax }
      };
    } else {
      return {
        id: "high_emission_penalty",
        name: "高排放重税",
        description: `基础税收 ${baseTax} + CO2重税 ${co2Tax} = ${totalTax} 金币`,
        icon: "💀",
        effects: { money: -totalTax, co2: -5 } // 高排放还会强制减少5点CO2
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
        event = calculateDynamicTaxEvent(playerId); // 使用动态税收计算
        break;
      case 'trap':
        event = getRandomEvent(trapEvents);
        break;
      case 'nature':
        event = getRandomEvent(natureRewards);
        break;
      case 'policy':
        const policy = getRandomPolicyChoice();
        setCurrentPolicy(policy);
        setPendingPolicyPlayer(playerId);
        
        // AI自动选择政策
        if (players[playerId].type !== 'human') {
          // 直接调用AI政策选择，不使用setTimeout，让API有足够时间响应
          handleAIPolicyChoice(playerId, policy);
        } else {
          setShowPolicyModal(true);
        }
        return;
      default:
        return;
    }
    
    if (event) {
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
  const handleAIPolicyChoice = async (playerId: number, policy: PolicyChoice) => {
    const player = players[playerId];
    
    // 创建30秒超时的Promise
    const timeoutPromise = new Promise<number>((_, reject) => {
      setTimeout(() => {
        reject(new Error('DeepSeek政策选择API调用超时（30秒）'));
      }, 30000); // 30秒超时
    });
    
    // 创建API调用Promise
    const apiPromise = async (): Promise<number> => {
      // 使用DeepSeek API进行政策选择
      const choiceIndex = await getAIPolicyChoiceFromDeepSeek(player, policy.choices);
      console.log(`DeepSeek AI (${player.name}) 政策选择: ${choiceIndex}`);
      return choiceIndex;
    };
    
    try {
      // 使用Promise.race实现超时机制
      console.log(`⏰ 开始政策选择API调用，最大等待时间30秒...`);
      const choiceIndex = await Promise.race([apiPromise(), timeoutPromise]);
      handlePolicyChoice(choiceIndex);
    } catch (error) {
      if (error instanceof Error && error.message.includes('超时')) {
        console.warn('⏰ DeepSeek政策选择API调用超时（30秒），使用备用逻辑:', error.message);
      } else {
        console.error('❌ DeepSeek政策选择失败，使用备用逻辑:', error);
      }
      
      // 备用逻辑：原有的简单AI决策
      let choiceIndex = 0;
      
      if (player.type === 'ai-income') {
        // 商业AI优先选择增加金钱的选项
        choiceIndex = policy.choices.findIndex(choice => (choice.effects.money || 0) > 0);
        if (choiceIndex === -1) {
          // 如果没有增加金钱的选项，选择损失最少的
          choiceIndex = policy.choices.reduce((bestIdx, choice, idx) => {
            const currentMoney = choice.effects.money || 0;
            const bestMoney = policy.choices[bestIdx].effects.money || 0;
            return currentMoney > bestMoney ? idx : bestIdx;
          }, 0);
        }
      } else if (player.type === 'ai-eco') {
        // 环保AI优先选择增加生态或减少CO2的选项
        choiceIndex = policy.choices.findIndex(choice => 
          (choice.effects.eco || 0) > 0 || (choice.effects.co2 || 0) < 0
        );
        if (choiceIndex === -1) {
          // 如果没有环保选项，选择对环境影响最小的
          choiceIndex = policy.choices.reduce((bestIdx, choice, idx) => {
            const currentEcoScore = (choice.effects.eco || 0) - (choice.effects.co2 || 0);
            const bestEcoScore = (policy.choices[bestIdx].effects.eco || 0) - (policy.choices[bestIdx].effects.co2 || 0);
            return currentEcoScore > bestEcoScore ? idx : bestIdx;
          }, 0);
        }
      }
      
      handlePolicyChoice(choiceIndex);
    }
  };

  // AI建筑选择逻辑（使用DeepSeek API，带30秒超时）
  const getAIBuildingChoice = async (player: Player, actualPosition?: number): Promise<BuildingType | null> => {
    // 使用传入的实际位置，如果没有传入则使用玩家当前位置
    const currentPosition = actualPosition !== undefined ? actualPosition : player.position;
    const playerWithCorrectPosition = { ...player, position: currentPosition };
    
    console.log(`🤖 开始AI决策 - 玩家: ${player.name}, 位置: ${currentPosition}, 金钱: ${player.money}`);
    console.log(`🔍 当前游戏阶段: ${gamePhase}, 回合数: ${turnCount}`);
    console.log(`📍 玩家完整状态:`, playerWithCorrectPosition);
    
    // 创建30秒超时的Promise
    const timeoutPromise = new Promise<BuildingType | null>((_, reject) => {
      setTimeout(() => {
        reject(new Error('DeepSeek API调用超时（30秒）'));
      }, 30000); // 30秒超时
    });
    
    // 创建API调用Promise
    const apiPromise = async (): Promise<BuildingType | null> => {
      console.log(`🌐 尝试使用DeepSeek API进行决策...`);
      console.log(`🔑 API配置检查:`, {
        hasApiKey: !!import.meta.env.VITE_DEEPSEEK_API_KEY,
        apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL,
        model: import.meta.env.VITE_DEEPSEEK_MODEL
      });
      
      // 使用DeepSeek API进行建筑选择（传入位置修正后的玩家信息）
      const apiGamePhase: 'rolling' | 'building' | 'waiting' = gamePhase === 'ended' ? 'building' : gamePhase;
      const choice = await getAIBuildingChoiceFromDeepSeek(playerWithCorrectPosition, players, apiGamePhase, turnCount);
      console.log(`✅ DeepSeek API决策成功! 玩家 ${player.name} 选择: ${choice || 'none'}`);
      console.log(`📊 决策来源: DeepSeek AI (智能决策)`);
      return choice;
    };
    
    try {
      // 使用Promise.race实现超时机制
      console.log(`⏰ 开始API调用，最大等待时间30秒...`);
      const choice = await Promise.race([apiPromise(), timeoutPromise]);
      return choice;
    } catch (error) {
      if (error instanceof Error && error.message.includes('超时')) {
        console.warn('⏰ DeepSeek API调用超时（30秒），切换到备用逻辑:', error.message);
      } else {
        console.error('❌ DeepSeek API调用失败，切换到备用逻辑:', error);
      }
      console.log(`🔄 使用本地备用逻辑进行决策...`);
      
      // 备用逻辑：原有的简单AI决策（使用位置修正后的玩家信息）
      const currentPosition = pathCoordinates[playerWithCorrectPosition.position];
      const posKey = `${currentPosition.row}-${currentPosition.col}`;
      
      // 检查格子类型：只有可建造格子才能建造
      if (currentPosition.type !== 'build') {
        console.log(`⚠️ 备用逻辑决策: 当前格子类型为 ${currentPosition.type}，不是可建造格子，无法建造`);
        return null;
      }
      
      // 检查是否可以建造
      if (playerWithCorrectPosition.built[posKey]) {
        console.log(`⚠️ 备用逻辑决策: 位置已有建筑，无法建造`);
        return null;
      }
      if (playerWithCorrectPosition.position === 0 && !playerWithCorrectPosition.passedStart) {
        console.log(`⚠️ 备用逻辑决策: 在起点且未经过起点，无法建造`);
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
      
      console.log(`🔧 备用逻辑决策完成! 玩家 ${playerWithCorrectPosition.name} 选择: ${choice || 'none'}`);
      console.log(`📊 决策来源: 本地备用逻辑 (简单规则)`);
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
    // 检查是否有任何玩家在此位置建造了建筑
    const buildingOwner = getBuildingOwnerAtPosition(checkPosition);
    if (buildingOwner) return false; // 已有建筑，无法建造
    
    if (checkPosition === 0 && !player.passedStart) return false;
    return true;
  };

  // 检查指定玩家是否可以在其位置进行建造或升级
  // 移除 canBuildOrUpgradeHereForPlayer 函数，恢复到原始状态

  // 在当前位置建造建筑
  const buildAtCurrentForPlayer = (playerId: number, type: BuildingType, actualPosition?: number) => {
    if (!canBuildHereForPlayer(playerId, actualPosition)) return;
    
    const building = buildingData[type];
    if (!building) return;
    
    const cost = building.cost;

    setPlayers(prev => {
      const player = prev.find(p => p.id === playerId);
      if (!player) {
        console.log(`建造错误: 找不到玩家ID ${playerId}`);
        return prev;
      }
      
      if (player.money < cost) {
        console.log(`建造失败: 玩家 ${player.name} 金钱不足，需要 ${cost}，当前有 ${player.money}`);
        return prev;
      }

      // 使用传入的实际位置，如果没有传入则使用玩家当前位置
      const buildingPosition = actualPosition !== undefined ? actualPosition : player.position;
      const currentPosition = pathCoordinates[buildingPosition];
      const posKey = `${currentPosition.row}-${currentPosition.col}`;
      
      console.log(`🏗️ 玩家 ${player.name} 在位置 ${buildingPosition} (${posKey}) 建造 ${building.name}`);

      return prev.map(p => {
        if (p.id !== playerId) return p;
        
        // 应用建造时的一次性效果
        let newCO2 = Math.max(0, p.co2 + building.co2);
        let newEco = Math.max(0, p.eco + building.eco);
        
        const updatedPlayer = {
          ...p,
          built: { ...p.built, [posKey]: type },
          money: p.money - cost,
          co2: newCO2,
          eco: newEco
        };
        
        console.log(`✅ 建造完成! 玩家 ${p.name} 的建筑:`, updatedPlayer.built);
        return updatedPlayer;
      });
    });
  };

  // 移除升级相关函数

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
      console.log(`玩家 ${player.name} 跳过回合，剩余跳过次数: ${player.skipTurns - 1}`);
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
      const buildingType = buildingOwner.built[posKey];
      
      const rentMap = {
        factory: 90,    // 300 * 0.3
        residential: 60, // 200 * 0.3
        green: 45,      // 150 * 0.3
      };
      
      rentAmount = rentMap[buildingType] || 0;
      rentPaidTo = buildingOwner.id;
      
      // 添加事件历史记录
      setEventHistory(prev => [...prev, `${player.name} 向 ${buildingOwner.name} 支付租金 ${rentAmount} 金币（${buildingType === 'factory' ? '工厂' : buildingType === 'residential' ? '住宅' : '绿色建筑'}）`]);
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
          console.log(`AI玩家 ${player.name} 在可建造格子上，准备进入建造阶段`);
          // 传入新位置参数，确保AI建造决策使用移动后的实际位置
          setTimeout(() => {
            handleAIBuildingById(player.id, newPosition);
          }, 500);
        } else {
          console.log(`人类玩家 ${player.name} 在可建造格子上，进入建造阶段`);
        }
      } else {
        // 事件格子：只处理事件效果，不进入建造阶段
        console.log(`玩家 ${player.name} 在事件格子上，只处理事件效果，不进行建造`);
        
        // 检查是否是政策格子，政策格子的回合切换由handlePolicyChoice处理
        const isPolicyCell = currentCell.type === 'policy';
        
        if (player.type !== 'human') {
          // AI玩家在事件格子上：只有非政策格子才直接切换回合
          if (!isPolicyCell) {
            setTimeout(() => {
              console.log(`AI玩家 ${player.name} 事件处理完成，直接切换到下一回合`);
              nextTurn();
            }, 2000); // 给事件处理一些时间
          } else {
            console.log(`AI玩家 ${player.name} 在政策格子上，等待政策选择完成后切换回合`);
          }
        } else {
          // 人类玩家在事件格子上：等待用户关闭事件弹窗后手动切换回合
          console.log(`人类玩家 ${player.name} 在事件格子上，等待用户处理事件`);
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
      
      console.log(`回合切换: 从玩家${prevIndex}(${players[prevIndex]?.name}) 到玩家${nextPlayerIndex}(${nextPlayer?.name})`);
      
      setGamePhase('rolling');
      setTurnCount(prev => {
        const newTurnCount = prev + 1;
        // 延迟检查游戏结束条件，确保状态更新完成
        setTimeout(() => checkGameEnd(), 100);
        return newTurnCount;
      });
      
      // 如果下一个玩家是AI，设置AI思考状态
      if (nextPlayer.type !== 'human') {
        console.log(`AI玩家 ${nextPlayer.name} 开始回合`);
        setAiThinking(true);
      } else {
        console.log(`人类玩家 ${nextPlayer.name} 开始回合`);
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
      console.log(`⚠️ AI玩家 ${playerId} 建造已在进行中，跳过重复调用`);
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
        console.log(`AI建造错误: 找不到玩家ID ${playerId}`);
        clearBuildingLock(); // 清除建造锁
        return;
      }
      
      // 使用传入的实际位置，如果没有传入则使用玩家当前位置
      const buildingPosition = actualPosition !== undefined ? actualPosition : player.position;
      console.log(`AI玩家 ${player.name} 开始建造决策，玩家状态位置: ${player.position}, 实际建造位置: ${buildingPosition}`);
      
      // 在调用AI决策之前，先检查是否可以建造，避免不必要的API调用
      if (!canBuildHereForPlayer(playerId, buildingPosition)) {
        console.log(`AI玩家 ${player.name} 无法在位置 ${buildingPosition} 建造，跳过AI决策`);
        setTimeout(() => {
          console.log(`AI玩家 ${player.name} 建造阶段结束，切换到下一回合`);
          nextTurn();
          clearBuildingLock(); // 清除建造锁
        }, 1000);
        return;
      }
      
      // 传入实际位置参数，确保AI决策使用正确的位置信息
      const buildingChoice = await getAIBuildingChoice(player, buildingPosition);
      
      if (buildingChoice) {
        console.log(`AI玩家 ${player.name} 选择建造 ${buildingChoice}`);
        buildAtCurrentForPlayer(playerId, buildingChoice, buildingPosition);
      } else {
        console.log(`AI玩家 ${player.name} 选择不建造`);
      }
      
      setTimeout(() => {
        console.log(`AI玩家 ${player.name} 建造阶段结束，切换到下一回合`);
        nextTurn();
        clearBuildingLock(); // 清除建造锁
      }, 1000);
    } catch (error) {
      console.error(`AI建造决策失败:`, error);
      setTimeout(() => {
        console.log(`AI玩家建造失败，切换到下一回合`);
        nextTurn();
        clearBuildingLock(); // 清除建造锁
      }, 1000);
    }
  }, [players, getAIBuildingChoice, buildAtCurrentForPlayer, nextTurn, aiBuildingInProgress]);



  // 检查当前位置是否可以建造
  const canBuildHere = (): boolean => {
    return canBuildHereForPlayer(currentPlayer.id);
  };

  // 测试AI建筑选择（调试用）
  const testAIBuildingChoice = async () => {
    console.log('🧪 手动测试AI建筑选择...');
    const aiPlayer = players.find(p => p.type !== 'human');
    if (aiPlayer) {
      console.log('🎯 找到AI玩家:', aiPlayer.name);
      const choice = await getAIBuildingChoice(aiPlayer);
      console.log('🎲 测试结果:', choice);
    } else {
      console.log('❌ 未找到AI玩家');
    }
  };

  // 在当前位置建造
  const buildAtCurrent = (type: BuildingType) => {
    buildAtCurrentForPlayer(currentPlayer.id, type);
  };

  // 处理政策选择
  const handlePolicyChoice = (choiceIndex: number) => {
    if (currentPolicy && pendingPolicyPlayer !== null) {
      const choice = currentPolicy.choices[choiceIndex];
      applyEventEffects(pendingPolicyPlayer, choice.effects);
      setEventHistory(prev => [...prev, `${players[pendingPolicyPlayer].name}: ${currentPolicy.name} - ${choice.text}`]);
      
      const isHuman = players[pendingPolicyPlayer].type === 'human';
      
      // 清理状态
      setCurrentPolicy(null);
      setShowPolicyModal(false);
      setPendingPolicyPlayer(null);
      
      // 政策选择完成后自动进入下一回合
      if (isHuman) {
        setTimeout(() => {
          nextTurn();
        }, 500); // 给用户一点时间看到选择结果
      } else {
        // AI玩家立即切换到下一回合
        setTimeout(() => {
          nextTurn();
        }, 1000); // 给AI一点时间显示选择结果
      }
    }
  };

  // 处理交通方式选择
  const handleTransportChoice = (choiceIndex: number) => {
    if (pendingTransportPlayer !== null) {
      const transportChoices = [
        { name: "步行出行", effects: { diceModifier: 0 } },
        { name: "自行车出行", effects: { diceModifier: 1, moneyPerTurn: -5 } },
        { name: "汽车出行", effects: { diceModifier: 2, co2PerTurn: 5, moneyPerTurn: -10 } },
        { name: "公交出行", effects: { diceModifier: -999, moneyPerTurn: -3 } }
      ];
      
      const choice = transportChoices[choiceIndex];
      
      setPlayers(prev => prev.map(p => {
        if (p.id === pendingTransportPlayer) {
          // 重置之前的交通方式效果
          const resetPlayer = {
            ...p,
            diceModifier: 0,
            co2PerTurn: 0,
            moneyPerTurn: 0
          };
          
          // 应用新的交通方式效果
          return {
            ...resetPlayer,
            diceModifier: choice.effects.diceModifier || 0,
            co2PerTurn: choice.effects.co2PerTurn || 0,
            moneyPerTurn: choice.effects.moneyPerTurn || 0
          };
        }
        return p;
      }));
      
      setEventHistory(prev => [...prev, `${players[pendingTransportPlayer].name} 选择了 ${choice.name}`]);
    }
    
    setShowTransportModal(false);
    setPendingTransportPlayer(null);
  };


  
  // 检查碳排放监狱
  const checkCO2Jail = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (player && player.co2 >= CO2_JAIL_THRESHOLD) {
      // 传送到监狱格子（位置10）并跳过2回合
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, position: 10, skipTurns: 2 } : p
      ));
      setEventHistory(prev => [...prev, `${player.name} 因碳排放超标被送入监狱，跳过2回合！`]);
      return true;
    }
    return false;
  };
  
  // 处理特殊格子效果
  const handleSpecialCell = (position: number, playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    switch (position) {
      case 0: // 起点
        if (player.passedStart) {
          setPlayers(prev => prev.map(p => 
            p.id === playerId ? { ...p, money: p.money + START_BONUS } : p
          ));
          setEventHistory(prev => [...prev, `${player.name} 再次到达起点，获得 ${START_BONUS} 金币奖励！`]);
        }
        break;
        
      case 10: // 监狱
        // 监狱格子本身不做特殊处理，只是作为传送目标
        break;
        
      case 20: // 免费停车
        setPendingTransportPlayer(playerId);
        if (player.type === 'human') {
          setShowTransportModal(true);
        } else {
          // AI自动选择交通方式
          setTimeout(() => {
            const aiChoice = player.type === 'ai-eco' ? 1 : // 环保AI选择自行车
                           player.type === 'ai-income' ? 2 : // 商业AI选择汽车
                           0; // 默认步行
            handleTransportChoice(aiChoice);
          }, 1000);
        }
        break;
        
      case 30: // 警察局
        // 暂时保留，后续可以添加执法功能
        break;
    }
  };
  
  // 关闭事件弹窗
  const closeEventModal = () => {
    setCurrentEvent(null);
    setShowEventModal(false);
    
    // 如果当前是人类玩家且游戏阶段为等待，关闭事件弹窗后自动进入下一回合
    if (currentPlayer.type === 'human' && gamePhase === 'waiting') {
      setTimeout(() => {
        nextTurn();
      }, 300); // 给用户一点时间看到弹窗关闭
    }
  };

  // 关闭政策弹窗
  const closePolicyModal = () => {
    setCurrentPolicy(null);
    setShowPolicyModal(false);
    setPendingPolicyPlayer(null);
  };

  // 获取当前玩家位置
  const getCurrentPosition = () => pathCoordinates[currentPlayer.position];

  // 获取所有建筑（用于地图显示）
  const getAllBuildings = (): Record<string, BuildingType> => {
    const allBuildings: Record<string, BuildingType> = {};
    players.forEach(player => {
      Object.entries(player.built).forEach(([key, building]) => {
        allBuildings[key] = building;
      });
    });
    console.log(`📊 getAllBuildings 返回:`, allBuildings);
    return allBuildings;
  };

  // 计算总收入
  const getTotalIncome = () => {
    return Object.values(currentPlayer.built).reduce((total, buildingType) => {
      const data = buildingData[buildingType];
      return total + data.income;
    }, 0);
  };

  // 计算每回合CO2排放
  const getTotalCO2PerTurn = () => {
    return Object.values(currentPlayer.built).reduce((total, buildingType) => {
      const data = buildingData[buildingType];
      return total + data.co2;
    }, 0);
  };

  // 计算每回合生态效果
  const getTotalEcoPerTurn = () => {
    return Object.values(currentPlayer.built).reduce((total, buildingType) => {
      const data = buildingData[buildingType];
      return total + data.eco;
    }, 0);
  };

  return {
    // 玩家相关
    players,
    currentPlayer,
    currentPlayerIndex,
    
    // 游戏状态
    diceRoll,
    turnCount,
    gamePhase,
    aiThinking,
    
    // 位置和建筑
    getCurrentPosition,
    getAllBuildings,
    canBuildHere,
    buildAtCurrent,
    // 移除升级相关导出
    
    // 游戏控制
    movePlayer,
    nextTurn,
    
    // 资源计算
    getTotalIncome,
    getTotalCO2PerTurn,
    getTotalEcoPerTurn,
    
    // 事件系统
    currentEvent,
    currentPolicy,
    eventHistory,
    showEventModal,
    showPolicyModal,
    handlePolicyChoice,
    closeEventModal,
    closePolicyModal,
    
    // 交通方式选择
    showTransportModal,
    setShowTransportModal,
    handleTransportChoice,
    
    // 游戏结束系统
    gameResult,
    calculatePlayerScore,
    checkGameEnd,
    restartGame,
    MAX_TURNS,
    MAX_CO2,
    GLOBAL_CO2_LIMIT,
    BANKRUPTCY_THRESHOLD,
    
    // 调试功能
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