// src/data/buildings.ts
export type BuildingType = "factory" | "residential" | "green";

export interface Building {
  name: string;
  icon: string;
  cost: number;
  co2: number; // 建造时的一次性效果
  eco: number; // 建造时的一次性效果
  income: number; // 每回合收入
  co2PerTurn: number; // 每回合CO2排放
  ecoPerTurn: number; // 每回合生态效果
}

// 建筑等级数据
export interface BuildingLevel {
  level: number;
  name: string;
  icon: string;
  cost: number; // 建造/升级成本
  upgradeCost?: number; // 升级到下一级的成本
  co2: number; // 建造/升级时的一次性效果
  eco: number; // 建造/升级时的一次性效果
  income: number; // 每回合收入
  co2PerTurn: number; // 每回合CO2排放
  ecoPerTurn: number; // 每回合生态效果
  maxLevel: number; // 最大等级
}

// 建筑升级数据
export interface BuildingUpgradeData {
  levels: BuildingLevel[];
}

// 建筑升级数据
export const buildingUpgradeData: Record<BuildingType, BuildingUpgradeData> = {
  factory: {
    levels: [
      {
        level: 1,
        name: "小型工厂",
        icon: "🏭",
        cost: 300,
        upgradeCost: 400,
        co2: 80,
        eco: -10,
        income: 120,
        co2PerTurn: 15,
        ecoPerTurn: -2,
        maxLevel: 3
      },
      {
        level: 2,
        name: "中型工厂",
        icon: "🏭",
        cost: 400,
        upgradeCost: 600,
        co2: 60, // 升级时的增量效果
        eco: -5,
        income: 180,
        co2PerTurn: 20,
        ecoPerTurn: -3,
        maxLevel: 3
      },
      {
        level: 3,
        name: "大型工厂",
        icon: "🏭",
        cost: 600,
        co2: 40,
        eco: 0,
        income: 250,
        co2PerTurn: 25,
        ecoPerTurn: -2, // 高级工厂环保技术更好
        maxLevel: 3
      }
    ]
  },
  residential: {
    levels: [
      {
        level: 1,
        name: "普通住宅",
        icon: "🏘️",
        cost: 200,
        upgradeCost: 300,
        co2: 30,
        eco: 0,
        income: 80,
        co2PerTurn: 8,
        ecoPerTurn: 1,
        maxLevel: 3
      },
      {
        level: 2,
        name: "高档住宅",
        icon: "🏘️",
        cost: 300,
        upgradeCost: 500,
        co2: 20,
        eco: 5,
        income: 140,
        co2PerTurn: 10,
        ecoPerTurn: 2,
        maxLevel: 3
      },
      {
        level: 3,
        name: "豪华住宅",
        icon: "🏘️",
        cost: 500,
        co2: 10,
        eco: 10,
        income: 220,
        co2PerTurn: 12,
        ecoPerTurn: 3,
        maxLevel: 3
      }
    ]
  },
  green: {
    levels: [
      {
        level: 1,
        name: "小型绿建",
        icon: "🌳",
        cost: 150,
        upgradeCost: 250,
        co2: -20,
        eco: 30,
        income: 60,
        co2PerTurn: -5,
        ecoPerTurn: 8,
        maxLevel: 3
      },
      {
        level: 2,
        name: "生态园区",
        icon: "🌳",
        cost: 250,
        upgradeCost: 400,
        co2: -30,
        eco: 40,
        income: 100,
        co2PerTurn: -8,
        ecoPerTurn: 12,
        maxLevel: 3
      },
      {
        level: 3,
        name: "绿色科技园",
        icon: "🌳",
        cost: 400,
        co2: -40,
        eco: 50,
        income: 160,
        co2PerTurn: -12,
        ecoPerTurn: 18,
        maxLevel: 3
      }
    ]
  }
};

// 保持向后兼容的建筑数据（使用1级建筑数据）
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

// 获取建筑等级数据的辅助函数
export function getBuildingLevelData(type: BuildingType, level: number): BuildingLevel | null {
  const upgradeData = buildingUpgradeData[type];
  if (!upgradeData || level < 1 || level > upgradeData.levels.length) {
    return null;
  }
  return upgradeData.levels[level - 1];
}

// 获取建筑最大等级
export function getMaxBuildingLevel(type: BuildingType): number {
  const upgradeData = buildingUpgradeData[type];
  return upgradeData ? upgradeData.levels[0].maxLevel : 1;
}

// 获取升级成本
export function getUpgradeCost(type: BuildingType, currentLevel: number): number | null {
  const currentLevelData = getBuildingLevelData(type, currentLevel);
  return currentLevelData?.upgradeCost || null;
}
