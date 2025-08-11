// src/data/buildings.ts
export type BuildingType = "factory" | "residential" | "green";

export interface Building {
  name: string;
  icon: string;
  cost: number;
  co2: number; // One-time effect when building
  eco: number; // One-time effect when building
  income: number; // Income per turn
  co2PerTurn: number; // CO2 emission per turn
  ecoPerTurn: number; // Ecological effect per turn
}

// Building level data
export interface BuildingLevel {
  level: number;
  name: string;
  icon: string;
  cost: number; // Build/upgrade cost
  upgradeCost?: number; // Cost to upgrade to next level
  co2: number; // One-time effect when building/upgrading
  eco: number; // One-time effect when building/upgrading
  income: number; // Income per turn
  co2PerTurn: number; // CO2 emission per turn
  ecoPerTurn: number; // Ecological effect per turn
  maxLevel: number; // Maximum level
}

// Building upgrade data
export interface BuildingUpgradeData {
  levels: BuildingLevel[];
}

// Building upgrade data
export const buildingUpgradeData: Record<BuildingType, BuildingUpgradeData> = {
  factory: {
    levels: [
      {
        level: 1,
        name: "Small Factory",
        icon: "🏭",
        cost: 300,
        upgradeCost: 150,
        co2: 80,
        eco: -10,
        income: 120,
        co2PerTurn: 15,
        ecoPerTurn: -2,
        maxLevel: 2
      },
      {
        level: 2,
        name: "Large Factory",
        icon: "🏭",
        cost: 400,
        co2: 60,
        eco: -5,
        income: 180,
        co2PerTurn: 20,
        ecoPerTurn: -3,
        maxLevel: 2
      }
    ]
  },
  residential: {
    levels: [
      {
        level: 1,
        name: "Standard Residential",
        icon: "🏘️",
        cost: 200,
        upgradeCost: 100,
        co2: 30,
        eco: 0,
        income: 80,
        co2PerTurn: 8,
        ecoPerTurn: 1,
        maxLevel: 2
      },
      {
        level: 2,
        name: "Luxury Residential",
        icon: "🏘️",
        cost: 300,
        co2: 20,
        eco: 5,
        income: 140,
        co2PerTurn: 10,
        ecoPerTurn: 2,
        maxLevel: 2
      }
    ]
  },
  green: {
    levels: [
      {
        level: 1,
        name: "Small Green Building",
        icon: "🌳",
        cost: 150,
        upgradeCost: 75,
        co2: -20,
        eco: 30,
        income: 60,
        co2PerTurn: -5,
        ecoPerTurn: 8,
        maxLevel: 2
      },
      {
        level: 2,
        name: "Green Tech Park",
        icon: "🌳",
        cost: 250,
        co2: -30,
        eco: 40,
        income: 100,
        co2PerTurn: -8,
        ecoPerTurn: 12,
        maxLevel: 2
      }
    ]
  }
};

// Backward compatible building data (using level 1 building data)
export const buildingData: Record<BuildingType, Building> = {
  factory: {
    name: buildingUpgradeData.factory.levels[0].name,
    icon: buildingUpgradeData.factory.levels[0].icon,
    cost: buildingUpgradeData.factory.levels[0].cost,
    co2: buildingUpgradeData.factory.levels[0].co2,
    eco: buildingUpgradeData.factory.levels[0].eco,
    income: buildingUpgradeData.factory.levels[0].income,
    co2PerTurn: buildingUpgradeData.factory.levels[0].co2PerTurn,
    ecoPerTurn: buildingUpgradeData.factory.levels[0].ecoPerTurn,
  },
  residential: {
    name: buildingUpgradeData.residential.levels[0].name,
    icon: buildingUpgradeData.residential.levels[0].icon,
    cost: buildingUpgradeData.residential.levels[0].cost,
    co2: buildingUpgradeData.residential.levels[0].co2,
    eco: buildingUpgradeData.residential.levels[0].eco,
    income: buildingUpgradeData.residential.levels[0].income,
    co2PerTurn: buildingUpgradeData.residential.levels[0].co2PerTurn,
    ecoPerTurn: buildingUpgradeData.residential.levels[0].ecoPerTurn,
  },
  green: {
    name: buildingUpgradeData.green.levels[0].name,
    icon: buildingUpgradeData.green.levels[0].icon,
    cost: buildingUpgradeData.green.levels[0].cost,
    co2: buildingUpgradeData.green.levels[0].co2,
    eco: buildingUpgradeData.green.levels[0].eco,
    income: buildingUpgradeData.green.levels[0].income,
    co2PerTurn: buildingUpgradeData.green.levels[0].co2PerTurn,
    ecoPerTurn: buildingUpgradeData.green.levels[0].ecoPerTurn,
  },
};

// Helper function to get building level data
export function getBuildingLevelData(type: BuildingType, level: number): BuildingLevel | null {
  const upgradeData = buildingUpgradeData[type];
  if (!upgradeData || level < 1 || level > upgradeData.levels.length) {
    return null;
  }
  return upgradeData.levels[level - 1];
}

// Get maximum building level
export function getMaxBuildingLevel(type: BuildingType): number {
  const upgradeData = buildingUpgradeData[type];
  return upgradeData ? upgradeData.levels[0].maxLevel : 1;
}

// Get upgrade cost
export function getUpgradeCost(type: BuildingType, currentLevel: number): number | null {
  const currentLevelData = getBuildingLevelData(type, currentLevel);
  return currentLevelData?.upgradeCost || null;
}
