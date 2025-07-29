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

export const buildingData: Record<BuildingType, Building> = {
  factory: {
    name: "工厂",
    icon: "🏭",
    cost: 300,
    co2: 80, // 建造时排放
    eco: -10, // 建造时生态损失
    income: 120, // 每回合收入
    co2PerTurn: 15, // 每回合持续排放
    ecoPerTurn: -2, // 每回合生态损失
  },
  residential: {
    name: "住宅",
    icon: "🏘️",
    cost: 200,
    co2: 30, // 建造时排放
    eco: 0, // 建造时无生态影响
    income: 80, // 每回合收入
    co2PerTurn: 8, // 每回合中等排放
    ecoPerTurn: 1, // 每回合轻微生态改善
  },
  green: {
    name: "绿色建筑",
    icon: "🌳",
    cost: 150,
    co2: -20, // 建造时减排
    eco: 30, // 建造时生态提升
    income: 60, // 每回合收入
    co2PerTurn: -5, // 每回合减排
    ecoPerTurn: 8, // 每回合生态提升
  },
};
