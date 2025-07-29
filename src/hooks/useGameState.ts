import { useState } from "react";
import { pathCoordinates } from "../utils/path";
import type { BuildingType } from "../data/buildings";
import { buildingData } from "../data/buildings";
import type { GameEvent, PolicyChoice } from "../data/events";
import { 
  randomEvents, 
  taxEvents, 
  trapEvents, 
  natureRewards, 
  policyChoices,
  getRandomEvent,
  getRandomPolicyChoice 
} from "../data/events";

// 记录格子的建造情况
type BuildMap = Record<string, BuildingType>;

export const useGameState = () => {
  const [playerIndex, setPlayerIndex] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);

  // 玩家资源状态
  const [money, setMoney] = useState(1000);
  const [co2, setCO2] = useState(0);
  const [eco, setEco] = useState(0);

  // 记录已建造格子
  const [built, setBuilt] = useState<BuildMap>({});

  // 起点是否已经第一次经过
  const [passedStart, setPassedStart] = useState(false);

  // 回合系统
  const [turnCount, setTurnCount] = useState(0);

  // 事件系统状态
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [currentPolicy, setCurrentPolicy] = useState<PolicyChoice | null>(null);
  const [skipTurns, setSkipTurns] = useState(0);
  const [eventHistory, setEventHistory] = useState<string[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const movePlayer = (steps: number) => {
    // 检查是否需要跳过回合
    if (skipTurns > 0) {
      setSkipTurns(prev => prev - 1);
      setDiceRoll(steps);
      setTurnCount(prev => prev + 1);
      return;
    }

    setDiceRoll(steps);
    setTurnCount(prev => prev + 1);
    
    // 计算建筑每回合效果
    calculateBuildingEffects();
    
    setPlayerIndex((prev) => {
      const newIndex = (prev + steps) % pathCoordinates.length;
      if (newIndex === 0 && prev !== 0) setPassedStart(true); // 再次经过起点
      
      // 触发格子事件
      const currentCell = pathCoordinates[newIndex];
      triggerCellEvent(currentCell.type);
      
      return newIndex;
    });
  };

  // 计算建筑每回合效果
  const calculateBuildingEffects = () => {
    let totalIncome = 0;
    let totalCO2 = 0;
    let totalEco = 0;
    
    Object.values(built).forEach(buildingType => {
      const building = buildingData[buildingType];
      totalIncome += building.income;
      totalCO2 += building.co2PerTurn;
      totalEco += building.ecoPerTurn;
    });
    
    // 应用效果
    if (totalIncome > 0) {
      setMoney(prev => prev + totalIncome);
    }
    if (totalCO2 !== 0) {
      setCO2(prev => Math.max(0, prev + totalCO2));
    }
    if (totalEco !== 0) {
      setEco(prev => Math.max(0, prev + totalEco));
    }
  };

  // 应用事件效果
  const applyEventEffects = (effects: GameEvent['effects']) => {
    if (effects.money) setMoney(prev => Math.max(0, prev + effects.money));
    if (effects.co2) setCO2(prev => Math.max(0, prev + effects.co2));
    if (effects.eco) setEco(prev => Math.max(0, prev + effects.eco));
    if (effects.skipTurns) setSkipTurns(prev => prev + effects.skipTurns);
  };

  // 触发格子事件
  const triggerCellEvent = (cellType: string) => {
    let event: GameEvent | null = null;
    
    switch (cellType) {
      case 'event':
        event = getRandomEvent(randomEvents);
        break;
      case 'tax':
        event = getRandomEvent(taxEvents);
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
        setShowPolicyModal(true);
        return;
      default:
        return;
    }
    
    if (event) {
      setCurrentEvent(event);
      setEventHistory(prev => [...prev, event.name]);
      applyEventEffects(event.effects);
      setShowEventModal(true);
    }
  };

  // 处理政策选择
  const handlePolicyChoice = (choiceIndex: number) => {
    if (currentPolicy) {
      const choice = currentPolicy.choices[choiceIndex];
      applyEventEffects(choice.effects);
      setEventHistory(prev => [...prev, `${currentPolicy.name}: ${choice.text}`]);
    }
    setCurrentPolicy(null);
    setShowPolicyModal(false);
  };

  // 关闭事件弹窗
  const closeEventModal = () => {
    setCurrentEvent(null);
    setShowEventModal(false);
  };

  // 关闭政策弹窗
  const closePolicyModal = () => {
    setCurrentPolicy(null);
    setShowPolicyModal(false);
  };

  const currentPosition = pathCoordinates[playerIndex];
  const posKey = `${currentPosition.row}-${currentPosition.col}`;

  const canBuildHere = (): boolean => {
    if (built[posKey]) return false; // 已建造
    if (playerIndex === 0 && !passedStart) return false; // 起点第一次不能建
    return true;
  };

  const buildAtCurrent = (type: BuildingType) => {
    if (!canBuildHere()) return;
    const costMap = {
      factory: 300,
      residential: 200,
      green: 150,
    };
    const cost = costMap[type];
    if (money < cost) return; // 钱不够

    setBuilt((prev) => ({ ...prev, [posKey]: type }));
    setMoney((prev) => prev - cost);

    if (type === "factory") {
      setCO2((c) => c + 80);
      setEco((e) => e - 10);
    } else if (type === "residential") {
      setCO2((c) => c + 30);
    } else if (type === "green") {
      setCO2((c) => c - 20);
      setEco((e) => e + 30);
    }
  };

  // 计算总收入
  const getTotalIncome = () => {
    return Object.values(built).reduce((total, buildingType) => {
      return total + buildingData[buildingType].income;
    }, 0);
  };

  // 计算每回合CO2排放
  const getTotalCO2PerTurn = () => {
    return Object.values(built).reduce((total, buildingType) => {
      return total + buildingData[buildingType].co2PerTurn;
    }, 0);
  };

  // 计算每回合生态效果
  const getTotalEcoPerTurn = () => {
    return Object.values(built).reduce((total, buildingType) => {
      return total + buildingData[buildingType].ecoPerTurn;
    }, 0);
  };

  return {
    playerIndex,
    diceRoll,
    movePlayer,
    currentPosition,
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
  };
};
