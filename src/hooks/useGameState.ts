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
  getRandomEvent,
  getRandomPolicyChoice 
} from "../data/events";

export const useGameState = () => {
  const [playerIndex, setPlayerIndex] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);

  // Player resource state
  const [money, setMoney] = useState(1000);
  const [co2, setCO2] = useState(0);
  const [eco, setEco] = useState(0);

  // Record built cells
  const [built, setBuilt] = useState<Record<string, BuildingType>>({});

  // Whether the starting point has been passed for the first time
  const [passedStart, setPassedStart] = useState(false);

  // Turn system
  const [turnCount, setTurnCount] = useState(0);

  // Event system state
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [currentPolicy, setCurrentPolicy] = useState<PolicyChoice | null>(null);
  const [skipTurns, setSkipTurns] = useState(0);
  const [eventHistory, setEventHistory] = useState<string[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const movePlayer = (steps: number) => {
    // Check if need to skip turn
    if (skipTurns > 0) {
      setSkipTurns(prev => prev - 1);
      setDiceRoll(steps);
      setTurnCount(prev => prev + 1);
      return;
    }

    setDiceRoll(steps);
    setTurnCount(prev => prev + 1);
    
    // Calculate building effects per turn
    calculateBuildingEffects();
    
    setPlayerIndex((prev) => {
      const newIndex = (prev + steps) % pathCoordinates.length;
      if (newIndex === 0 && prev !== 0) setPassedStart(true); // Pass starting point again
      
      // Trigger cell event
      const currentCell = pathCoordinates[newIndex];
      triggerCellEvent(currentCell.type);
      
      return newIndex;
    });
  };

  // Calculate building effects per turn
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
    
    // Apply effects
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

  // Apply event effects
  const applyEventEffects = (effects: GameEvent['effects']) => {
    if (effects.money) setMoney(prev => Math.max(0, prev + effects.money!));
    if (effects.co2) setCO2(prev => Math.max(0, prev + effects.co2!));
    if (effects.eco) setEco(prev => Math.max(0, prev + effects.eco!));
    if (effects.skipTurns) setSkipTurns(prev => prev + effects.skipTurns!);
  };

  // Trigger cell event
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

  // Handle policy choice
  const handlePolicyChoice = (choiceIndex: number) => {
    if (currentPolicy) {
      const choice = currentPolicy.choices[choiceIndex];
      applyEventEffects(choice.effects);
      setEventHistory(prev => [...prev, `${currentPolicy.name}: ${choice.text}`]);
    }
    setCurrentPolicy(null);
    setShowPolicyModal(false);
  };

  // Close event modal
  const closeEventModal = () => {
    setCurrentEvent(null);
    setShowEventModal(false);
  };

  // Close policy modal
  const closePolicyModal = () => {
    setCurrentPolicy(null);
    setShowPolicyModal(false);
  };

  const currentPosition = pathCoordinates[playerIndex];
  const posKey = `${currentPosition.row}-${currentPosition.col}`;

  const canBuildHere = (): boolean => {
    if (built[posKey]) return false; // Already built
    if (playerIndex === 0 && !passedStart) return false; // Cannot build at starting point on first visit
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
    if (money < cost) return; // Not enough money

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

  // Calculate total income
  const getTotalIncome = () => {
    return Object.values(built).reduce((total, buildingType) => {
      return total + buildingData[buildingType].income;
    }, 0);
  };

  // Calculate CO2 emissions per turn
  const getTotalCO2PerTurn = () => {
    return Object.values(built).reduce((total, buildingType) => {
      return total + buildingData[buildingType].co2PerTurn;
    }, 0);
  };

  // Calculate ecological effects per turn
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
    // Event system
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
