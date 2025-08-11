// Game event system data
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

// Random events (triggered by event tiles)
export const randomEvents: GameEvent[] = [
  {
    id: "natural_disaster",
    name: "Natural Disaster",
    description: "Extreme weather damages buildings, requiring repair costs",
    icon: "🌪️",
    effects: { money: -200, co2: 50 }
  },
  {
    id: "green_subsidy",
    name: "Green Subsidy",
    description: "Government provides environmental subsidies to encourage green development",
    icon: "💚",
    effects: { money: 150, eco: 20 }
  },
  {
    id: "carbon_tax",
    name: "Carbon Tax Policy",
    description: "New carbon tax policy implemented, high-emission companies must pay taxes",
    icon: "📋",
    effects: { money: -100, co2: -30 }
  },
  {
    id: "tech_breakthrough",
    name: "Technology Breakthrough",
    description: "Clean technology breakthrough reduces production costs and emissions",
    icon: "🔬",
    effects: { money: 100, co2: -40, eco: 15 }
  },
  {
    id: "economic_boom",
    name: "Economic Boom",
    description: "Economic growth brings additional income but also increases emissions",
    icon: "📈",
    effects: { money: 250, co2: 60 }
  },
  {
    id: "environmental_protest",
    name: "Environmental Protest",
    description: "Environmental groups protest, forcing companies to improve environmental performance",
    icon: "✊",
    effects: { money: -50, co2: -20, eco: 25 }
  },
  {
    id: "vehicle_choice_event",
    name: "Personal Transportation Choice",
    description: "You need to choose your primary mode of transportation, which will affect your mobility and environmental impact",
    icon: "🚲",
    effects: { money: 0, co2: 0, eco: 0 }
  }
];

// Tax events (triggered by tax tiles)
export const taxEvents: GameEvent[] = [
  {
    id: "income_tax",
    name: "Income Tax",
    description: "Pay basic income tax",
    icon: "💰",
    effects: { money: -150 }
  },
  {
    id: "carbon_penalty",
    name: "Carbon Emission Penalty",
    description: "Fined for excessive emissions",
    icon: "🏭",
    effects: { money: -200, co2: -10 }
  },
  {
    id: "eco_reward",
    name: "Environmental Reward",
    description: "Tax reduction for excellent environmental performance",
    icon: "🌱",
    effects: { money: 100, eco: 10 }
  }
];

// Policy choices (triggered by policy tiles)
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
      diceModifier?: number; // Dice roll modifier
      co2PerTurn?: number; // Additional CO2 emission per turn
      moneyPerTurn?: number;
    };
  }[];
}

export const policyChoices: PolicyChoice[] = [
  {
    id: "energy_policy",
    name: "Energy Policy Choice",
    description: "Choose the city's main energy policy direction",
    icon: "⚡",
    choices: [
      {
        text: "Invest in coal power plants (cheap but highly polluting)",
        effects: { money: 200, co2: 100, eco: -20 }
      },
      {
        text: "Develop renewable energy (expensive but eco-friendly)",
        effects: { money: -100, co2: -50, eco: 40 }
      },
      {
        text: "Maintain status quo",
        effects: { money: 0, co2: 0, eco: 0 }
      }
    ]
  },
  {
    id: "transport_policy",
    name: "Transportation Policy Choice",
    description: "Develop urban transportation strategy",
    icon: "🚗",
    choices: [
      {
        text: "Vigorously develop public transportation",
        effects: { money: -150, co2: -40, eco: 30 }
      },
      {
        text: "Encourage electric vehicles",
        effects: { money: -100, co2: -30, eco: 20 }
      },
      {
        text: "No changes",
        effects: { money: 50, co2: 20, eco: -10 }
      }
    ]
  },
  {
    id: "carbon_cap_policy",
    name: "Implement Carbon Emission Cap",
    description: "City council proposes to set annual CO₂ emission limits for all new factories",
    icon: "🏭",
    choices: [
      {
        text: "Support",
        effects: { money: -0.1, eco: 15 }
      },
      {
        text: "Oppose",
        effects: { money: 0, eco: -10 }
      }
    ]
  },
  {
    id: "construction_tax_policy",
    name: "Increase Urban Construction Tax",
    description: "To fund green public infrastructure, the government plans to increase construction taxes on all buildings",
    icon: "🏗️",
    choices: [
      {
        text: "Agree",
        effects: { money: -200, eco: 10 }
      },
      {
        text: "Oppose",
        effects: { money: 0, eco: -5 }
      }
    ]
  },
  {
    id: "highway_expansion_policy",
    name: "Highway Expansion",
    description: "Proposal to expand the city's highway network to promote trade and population mobility",
    icon: "🛣️",
    choices: [
      {
        text: "Support",
        effects: { moneyPerTurn: 0.15, co2PerTurn: 10 }
      },
      {
        text: "Oppose",
        effects: { money: 0, co2: 0, eco: 0 }
      }
    ]
  }
];

// Trap events (triggered by trap tiles)
export const trapEvents: GameEvent[] = [
  {
    id: "pollution_scandal",
    name: "Pollution Scandal",
    description: "Corporate pollution scandal exposed, reputation and funds damaged",
    icon: "💀",
    effects: { money: -300, co2: 30, eco: -30 }
  },
  {
    id: "equipment_failure",
    name: "Equipment Failure",
    description: "Critical equipment failure requires substantial repair costs",
    icon: "⚙️",
    effects: { money: -250, skipTurns: 1 }
  },
  {
    id: "legal_trouble",
    name: "Legal Dispute",
    description: "Involved in environmental legal dispute, need to pay legal fees",
    icon: "⚖️",
    effects: { money: -200, skipTurns: 1 }
  }
];

// Nature rewards (triggered by nature tiles)
export const natureRewards: GameEvent[] = [
  {
    id: "forest_blessing",
    name: "Forest Blessing",
    description: "Forest ecosystem brings fresh air and ecological benefits to the city",
    icon: "🌲",
    effects: { co2: -30, eco: 40, money: 50 }
  },
  {
    id: "clean_air",
    name: "Clean Air",
    description: "High-quality air environment improves residents' health and well-being",
    icon: "💨",
    effects: { co2: -20, eco: 30 }
  },
  {
    id: "biodiversity_bonus",
    name: "Biodiversity Bonus",
    description: "Rich biodiversity brings ecological balance rewards",
    icon: "🦋",
    effects: { eco: 50, money: 100 }
  }
];

// Utility functions for getting random events
export const getRandomEvent = (events: GameEvent[]): GameEvent => {
  const randomIndex = Math.floor(Math.random() * events.length);
  return events[randomIndex];
};

export const getRandomPolicyChoice = (): PolicyChoice => {
  const randomIndex = Math.floor(Math.random() * policyChoices.length);
  return policyChoices[randomIndex];
};