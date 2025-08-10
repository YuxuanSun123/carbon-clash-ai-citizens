// 游戏事件系统数据
export interface GameEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  effects: {
    money?: number;
    co2?: number;
    eco?: number;
    skipTurns?: number;
  };
}

// 随机事件（事件格触发）
export const randomEvents: GameEvent[] = [
  {
    id: "natural_disaster",
    name: "自然灾害",
    description: "极端天气导致建筑损坏，需要支付维修费用",
    icon: "🌪️",
    effects: { money: -200, co2: 50 }
  },
  {
    id: "green_subsidy",
    name: "绿色补贴",
    description: "政府发放环保补贴，鼓励绿色发展",
    icon: "💚",
    effects: { money: 150, eco: 20 }
  },
  {
    id: "carbon_tax",
    name: "碳税政策",
    description: "新的碳税政策实施，高排放企业需要缴税",
    icon: "📋",
    effects: { money: -100, co2: -30 }
  },
  {
    id: "tech_breakthrough",
    name: "技术突破",
    description: "清洁技术突破，降低了生产成本和排放",
    icon: "🔬",
    effects: { money: 100, co2: -40, eco: 15 }
  },
  {
    id: "economic_boom",
    name: "经济繁荣",
    description: "经济增长带来额外收入，但也增加了排放",
    icon: "📈",
    effects: { money: 250, co2: 60 }
  },
  {
    id: "environmental_protest",
    name: "环保抗议",
    description: "环保组织抗议，迫使企业改善环境表现",
    icon: "✊",
    effects: { money: -50, co2: -20, eco: 25 }
  },
  {
    id: "vehicle_choice_event",
    name: "个人交通工具选择",
    description: "你需要选择主要出行方式，这将影响你的移动能力和环境影响",
    icon: "🚲",
    effects: { money: 0, co2: 0, eco: 0 }
  }
];

// 税收事件（税收格触发）
export const taxEvents: GameEvent[] = [
  {
    id: "income_tax",
    name: "所得税",
    description: "缴纳基础所得税",
    icon: "💰",
    effects: { money: -150 }
  },
  {
    id: "carbon_penalty",
    name: "碳排放罚款",
    description: "因超标排放被罚款",
    icon: "🏭",
    effects: { money: -200, co2: -10 }
  },
  {
    id: "eco_reward",
    name: "环保奖励",
    description: "因环保表现优秀获得税收减免",
    icon: "🌱",
    effects: { money: 100, eco: 10 }
  }
];

// 政策选择（政策格触发）
export interface PolicyChoice {
  id: string;
  name: string;
  description: string;
  icon: string;
  choices: {
    text: string;
    effects: {
      money?: number;
      co2?: number;
      eco?: number;
      diceModifier?: number; // 骰子点数修改器
      co2PerTurn?: number; // 每回合额外CO2排放
      moneyPerTurn?: number;
    };
  }[];
}

export const policyChoices: PolicyChoice[] = [
  {
    id: "energy_policy",
    name: "能源政策选择",
    description: "选择城市的主要能源政策方向",
    icon: "⚡",
    choices: [
      {
        text: "投资煤电厂（便宜但污染大）",
        effects: { money: 200, co2: 100, eco: -20 }
      },
      {
        text: "发展可再生能源（贵但环保）",
        effects: { money: -100, co2: -50, eco: 40 }
      },
      {
        text: "维持现状",
        effects: { money: 0, co2: 0, eco: 0 }
      }
    ]
  },
  {
    id: "transport_policy",
    name: "交通政策选择",
    description: "制定城市交通发展策略",
    icon: "🚗",
    choices: [
      {
        text: "大力发展公共交通",
        effects: { money: -150, co2: -40, eco: 30 }
      },
      {
        text: "鼓励电动汽车",
        effects: { money: -100, co2: -30, eco: 20 }
      },
      {
        text: "不做改变",
        effects: { money: 50, co2: 20, eco: -10 }
      }
    ]
  },
  {
    id: "carbon_cap_policy",
    name: "实施碳排放上限",
    description: "市议会提议为所有新建工厂设定年度CO₂排放上限",
    icon: "🏭",
    choices: [
      {
        text: "赞成",
        effects: { money: -0.1, eco: 15 }
      },
      {
        text: "反对",
        effects: { money: 0, eco: -10 }
      }
    ]
  },
  {
    id: "construction_tax_policy",
    name: "提高城市建设税",
    description: "为了资助绿色公共基础设施，政府计划提高所有建筑的建设税",
    icon: "🏗️",
    choices: [
      {
        text: "赞成",
        effects: { money: -200, eco: 10 }
      },
      {
        text: "反对",
        effects: { money: 0, eco: -5 }
      }
    ]
  },
  {
    id: "highway_expansion_policy",
    name: "高速公路扩建",
    description: "提议扩建城市高速公路网络，以促进贸易和人口流动",
    icon: "🛣️",
    choices: [
      {
        text: "赞成",
        effects: { moneyPerTurn: 0.15, co2PerTurn: 10 }
      },
      {
        text: "反对",
        effects: { money: 0, co2: 0, eco: 0 }
      }
    ]
  }
];

// 陷阱事件（陷阱格触发）
export const trapEvents: GameEvent[] = [
  {
    id: "pollution_scandal",
    name: "污染丑闻",
    description: "企业污染丑闻曝光，声誉和资金受损",
    icon: "💀",
    effects: { money: -300, co2: 30, eco: -30 }
  },
  {
    id: "equipment_failure",
    name: "设备故障",
    description: "关键设备故障，需要大量维修费用",
    icon: "⚙️",
    effects: { money: -250, skipTurns: 1 }
  },
  {
    id: "legal_trouble",
    name: "法律纠纷",
    description: "卷入环境法律纠纷，需要支付律师费",
    icon: "⚖️",
    effects: { money: -200, skipTurns: 1 }
  }
];

// 自然奖励（自然格触发）
export const natureRewards: GameEvent[] = [
  {
    id: "forest_blessing",
    name: "森林馈赠",
    description: "森林生态系统为城市带来清新空气和生态效益",
    icon: "🌲",
    effects: { co2: -30, eco: 40, money: 50 }
  },
  {
    id: "clean_air",
    name: "清洁空气",
    description: "优质的空气环境提升了居民健康和幸福感",
    icon: "💨",
    effects: { co2: -20, eco: 30 }
  },
  {
    id: "biodiversity_bonus",
    name: "生物多样性奖励",
    description: "丰富的生物多样性带来生态平衡奖励",
    icon: "🦋",
    effects: { eco: 50, money: 100 }
  }
];

// 获取随机事件的工具函数
export const getRandomEvent = (events: GameEvent[]): GameEvent => {
  const randomIndex = Math.floor(Math.random() * events.length);
  return events[randomIndex];
};

export const getRandomPolicyChoice = (): PolicyChoice => {
  const randomIndex = Math.floor(Math.random() * policyChoices.length);
  return policyChoices[randomIndex];
};