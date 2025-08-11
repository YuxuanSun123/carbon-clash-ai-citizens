// DeepSeek API Service
import type { Player, PlayerType } from '../hooks/useMultiPlayerGameState';
import type { BuildingType } from '../data/buildings';
import { pathCoordinates } from '../utils/path';

// DeepSeek API Configuration
// Support local ollama deployment and remote API
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';

// API Request Interface
interface DeepSeekRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

// API Response Interface
interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Game State Information
interface GameContext {
  currentPlayer: Player;
  allPlayers: Player[];
  gamePhase: 'rolling' | 'building' | 'waiting';
  turnCount: number;
  availableBuildings: BuildingType[];
  currentPosition: {
    row: number;
    col: number;
    type: string;
  };
}

// Build system prompt
function buildSystemPrompt(playerType: PlayerType): string {
  const basePrompt = `You are an intelligent game AI playing a Monopoly-like city building game.

Game Rules:
- Players move on the board and can build buildings on tiles
- Building types: Factory (300 coins, high income +80CO2 -10 eco), Residential (200 coins, medium income +30CO2), Green Building (150 coins, low income -20CO2 +30 eco)
- Buildings generate income and environmental impact each turn
- Game goal is to balance economic development and environmental protection

Your character traits:`;

  if (playerType === 'ai-income') {
    return basePrompt + `
- You are a business AI, prioritizing economic benefit maximization
- Prefer building high-income buildings (factories)
- Between economic benefits and environmental protection, lean towards economy
- But also consider long-term sustainable development

Please make optimal decisions based on current game state, only return building type (factory/residential/green) or none (don't build).`;
  } else {
    return basePrompt + `
- You are an eco AI, prioritizing environmental protection and sustainable development
- Prefer building green buildings, avoid high-pollution buildings
- Between economic benefits and environmental protection, lean towards environment
- But also ensure basic economic development needs

Please make optimal decisions based on current game state, only return building type (factory/residential/green) or none (don't build).`;
  }
}

// Build user message
function buildUserMessage(context: GameContext): string {
  const { currentPlayer, allPlayers, currentPosition } = context;
  
  const playerStatus = `Current Status:
- Money: ${currentPlayer.money}
- CO2 Emissions: ${currentPlayer.co2}
- Eco Value: ${currentPlayer.eco}
- Position: Grid ${currentPlayer.position} (${currentPosition.type} type)
- Built Buildings: ${Object.keys(currentPlayer.built).length}`;
  
  const buildingOptions = `Available Buildings:
- Factory: 300 coins, high income, +80CO2, -10 eco
- Residential: 200 coins, medium income, +30CO2
- Green Building: 150 coins, low income, -20CO2, +30 eco`;
  
  const otherPlayers = allPlayers
    .filter(p => p.id !== currentPlayer.id)
    .map(p => `${p.name}: Money${p.money}, CO2${p.co2}, Eco${p.eco}`)
    .join('\n');
  
  const posKey = `${currentPosition.row}-${currentPosition.col}`;
  const hasBuilding = currentPlayer.built[posKey];
  
  let message = `${playerStatus}

${buildingOptions}

Other Players:
${otherPlayers}

`;
  
  if (hasBuilding) {
    message += `Current position already has a building. Cannot build here.`;
  } else if (currentPosition.type !== 'build') {
    message += `Current position type is ${currentPosition.type}, not buildable.`;
  } else if (currentPlayer.position === 0 && !currentPlayer.passedStart) {
    message += `At start position but haven't passed start yet, cannot build.`;
  } else {
    message += `Current position is buildable. What would you like to build?`;
  }
  
  return message;
}

// Call DeepSeek API
async function callDeepSeekAPI(request: DeepSeekRequest): Promise<string> {
  console.log('🤖 Calling DeepSeek API');
  
  // Check if it's ollama local deployment (by URL)
  const isOllama = DEEPSEEK_API_URL.includes('localhost') || DEEPSEEK_API_URL.includes('127.0.0.1');
  
  // If not ollama and no API key, throw error
  if (!isOllama && !DEEPSEEK_API_KEY) {
    console.warn('⚠️ DeepSeek API Key not configured, using default AI logic');
    throw new Error('API key not configured');
  }
  
  console.log('🚀 Starting AI API call...');
  console.log('📍 API URL:', DEEPSEEK_API_URL);
  console.log('🎯 Using model:', request.model);
  console.log('📤 Request data:', JSON.stringify(request, null, 2));
  
  // Build request headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  // Only add Authorization header in non-ollama environment
  if (!isOllama) {
    headers['Authorization'] = `Bearer ${DEEPSEEK_API_KEY}`;
  }
  
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    
    console.log('📊 API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed details:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data: DeepSeekResponse = await response.json();
    console.log('✅ API response success');
    
    const aiReply = data.choices[0]?.message?.content || '';
    console.log('🎭 AI reply content:', aiReply);
    
    return aiReply;
    
  } catch (error) {
    console.error('💥 DeepSeek API call failed:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network connection issue, please check network connection');
    }
    throw error;
  }
}

// Parse AI response
function parseAIResponse(response: string): BuildingType | null {
  if (!response) {
    console.log('🔍 Parse AI response: Empty response, return null (don\'t build)');
    return null;
  }
  
  const lowerResponse = response.toLowerCase().trim();
  console.log('🔍 Parse AI response:', lowerResponse);
  
  if (lowerResponse.includes('factory')) return 'factory';
  if (lowerResponse.includes('residential')) return 'residential';
  if (lowerResponse.includes('green')) return 'green';
  
  // If unable to parse, return null (don't build)
  console.log('❓ Unable to parse AI response:', response);
  return null;
}

// AI upgrade decision function
export async function getAIUpgradeChoiceFromDeepSeek(
  player: Player,
  upgradableBuildings: Array<{position: number, buildingType: BuildingType, upgradeCost: number}>,
  allPlayers: Player[],
  turnCount: number,
  gamePhase: string
): Promise<boolean> {
  try {
    console.log(`🤖 DeepSeek API: Starting upgrade decision generation for player ${player.name}`);
    console.log(`👤 Player status: Position=${player.position}, Money=${player.money}, CO2=${player.co2}, Eco=${player.eco}`);
    console.log(`🏗️ Upgradable buildings:`, upgradableBuildings);
    
    if (upgradableBuildings.length === 0) {
      console.log('🚫 DeepSeek API: No upgradable buildings');
      return false;
    }
    
    // Build upgrade decision system prompt
    const systemPrompt = buildUpgradeSystemPrompt(player.type);
    
    // Build user message
    const userMessage = buildUpgradeUserMessage(
      player,
      upgradableBuildings,
      allPlayers,
      turnCount,
      gamePhase
    );
    
    console.log('📝 Upgrade decision system prompt:', systemPrompt);
    console.log('💬 Upgrade decision user message:', userMessage);
    
    const request: DeepSeekRequest = {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 100
    };
    
    console.log('📤 Sending upgrade decision request to DeepSeek API...');
    const response = await callDeepSeekAPI(request);
    
    if (!response) {
      console.error('❌ DeepSeek API upgrade decision request failed:', 'Empty response');
      return getFallbackUpgradeChoice(player, upgradableBuildings);
    }
    
    console.log('📥 DeepSeek API upgrade decision raw response:', response);
    
    const shouldUpgrade = parseUpgradeResponse(response);
    console.log(`✅ DeepSeek API upgrade decision success! Player ${player.name} decision: ${shouldUpgrade ? 'Upgrade' : 'No upgrade'}`);
    
    // Add detailed explanation for the AI's upgrade decision
    const aiType = player.type === 'ai-income' ? 'Business AI' : 'Eco AI';
    const firstBuilding = upgradableBuildings[0];
    
    console.log(`🏗️ ${aiType} Upgrade Decision Analysis:`);
    console.log(`   💰 Available Funds: ${player.money} coins`);
    console.log(`   💸 Upgrade Cost: ${firstBuilding.upgradeCost} coins`);
    console.log(`   📍 Building Location: Position ${firstBuilding.position}`);
    console.log(`   🏢 Building Type: ${firstBuilding.buildingType}`);
    
    console.log(`💭 ${aiType} Upgrade Reasoning:`);
    
    if (shouldUpgrade) {
      console.log(`   ✅ Decision: UPGRADE`);
      
      if (player.type === 'ai-income') {
        if (firstBuilding.buildingType === 'factory') {
          console.log(`   🎯 Reasoning: Upgrading factory significantly boosts income generation. Enhanced factory will provide even higher returns on investment.`);
        } else if (firstBuilding.buildingType === 'residential') {
          console.log(`   🎯 Reasoning: Upgrading residential building improves income efficiency. Better housing generates more revenue per turn.`);
        } else if (firstBuilding.buildingType === 'green') {
          console.log(`   🎯 Reasoning: While green buildings aren't my priority, upgrading improves both income and environmental balance, creating long-term value.`);
        }
        console.log(`   💡 Strategic Value: Upgraded buildings provide better ROI and strengthen my economic position for future expansion.`);
      } else {
        if (firstBuilding.buildingType === 'green') {
          console.log(`   🎯 Reasoning: Upgrading green building maximizes environmental benefits. Enhanced eco-friendly infrastructure is core to my mission.`);
        } else if (firstBuilding.buildingType === 'residential') {
          console.log(`   🎯 Reasoning: Upgrading residential building improves living standards while maintaining moderate environmental impact.`);
        } else if (firstBuilding.buildingType === 'factory') {
          console.log(`   🎯 Reasoning: Though not ideal environmentally, upgrading existing factory is more efficient than building new polluting structures.`);
        }
        console.log(`   🌱 Environmental Value: Upgraded buildings often have better efficiency and reduced environmental impact per unit of output.`);
      }
      
      console.log(`   📈 Expected Benefits: Enhanced building performance, improved resource efficiency, and better long-term sustainability.`);
    } else {
      console.log(`   ❌ Decision: NO UPGRADE`);
      
      if (player.money < firstBuilding.upgradeCost) {
        console.log(`   💸 Reasoning: Insufficient funds (need ${firstBuilding.upgradeCost}, have ${player.money}). Preserving capital for other strategic opportunities.`);
      } else {
        console.log(`   💰 Reasoning: While funds are available, current building performance is adequate. Saving resources for new construction or better opportunities.`);
        
        if (player.type === 'ai-income') {
          console.log(`   📊 Business Strategy: Capital preservation allows for building new income-generating structures instead of incremental improvements.`);
        } else {
          console.log(`   🌍 Eco Strategy: Resources better allocated to building new green infrastructure rather than upgrading existing structures.`);
        }
      }
    }
    
    return shouldUpgrade;
    
  } catch (error) {
    console.error('💥 DeepSeek API upgrade decision failed:', error);
    console.log('🔄 Fallback logic result:', getFallbackUpgradeChoice(player, upgradableBuildings));
    return getFallbackUpgradeChoice(player, upgradableBuildings);
  }
}

// Main AI decision function
export async function getAIChoiceFromDeepSeek(
  player: Player,
  allPlayers: Player[],
  gamePhase: 'rolling' | 'building' | 'waiting',
  turnCount: number
): Promise<BuildingType | null> {
  try {
    console.log(`🤖 DeepSeek API: Starting building decision generation for player ${player.name}`);
    console.log(`👤 Player status: Position=${player.position}, Money=${player.money}, CO2=${player.co2}, Eco=${player.eco}`);
    
    // Build game context
    const currentPosition = pathCoordinates[player.position];
    console.log(`🎮 Game context: Turn=${turnCount}, Phase=${gamePhase}, Position type=${currentPosition.type}`);
    
    // Check basic building conditions
    if (currentPosition.type !== 'build') {
      console.log(`🚫 DeepSeek API: Current grid type is ${currentPosition.type}, not a buildable grid, cannot build`);
      return null;
    }
    
    const posKey = `${currentPosition.row}-${currentPosition.col}`;
    if (player.built[posKey]) {
      console.log('🏠 DeepSeek API: Position already has building, cannot build');
      return null;
    }
    
    if (player.position === 0 && !player.passedStart) {
      console.log('🏁 DeepSeek API: At start and haven\'t passed start, cannot build');
      return null;
    }
    
    // Build API request...
    const context: GameContext = {
      currentPlayer: player,
      allPlayers,
      gamePhase,
      turnCount,
      availableBuildings: ['factory', 'residential', 'green'],
      currentPosition
    };
    
    const systemPrompt = buildSystemPrompt(player.type);
    const userMessage = buildUserMessage(context);
    
    console.log(`🎯 AI type: ${player.type === 'ai-income' ? 'Business AI' : 'Eco AI'}`);
    
    const request: DeepSeekRequest = {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 50
    };
    
    console.log('📤 Sending request to DeepSeek API');
    console.log('🎯 Using model:', DEEPSEEK_MODEL);
    console.log('🤖 Calling API...');
    
    const response = await callDeepSeekAPI(request);
    console.log('📥 DeepSeek API response:', response);
    
    const choice = parseAIResponse(response);
    console.log('🔍 Parse result:', choice);
    
    // Verify if choice is feasible (check money)
    if (choice) {
      console.log('💰 Building cost check');
      const costs = { factory: 300, residential: 200, green: 150 };
      if (player.money < costs[choice]) {
        console.log(`💸 Insufficient money: need ${costs[choice]}, have ${player.money}`);
        return null;
      }
      console.log(`✅ Sufficient money, can build`);
    }
    
    // Add detailed explanation for the AI's decision
    console.log(`🎯 DeepSeek AI final decision: ${choice || 'none'}`);
    
    // Generate explanation based on AI type and choice
    if (choice) {
      const aiType = player.type === 'ai-income' ? 'Business AI' : 'Eco AI';
      const buildingNames = { factory: 'Factory', residential: 'Residential', green: 'Green Building' };
      const costs = { factory: 300, residential: 200, green: 150 };
      
      console.log(`💭 ${aiType} Decision Explanation:`);
      console.log(`   📍 Current Position: ${player.position} (${currentPosition.type} cell)`);
      console.log(`   💰 Available Funds: ${player.money} coins`);
      console.log(`   🏗️ Chosen Building: ${buildingNames[choice]} (Cost: ${costs[choice]} coins)`);
      
      if (player.type === 'ai-income') {
        if (choice === 'factory') {
          console.log(`   🎯 Reasoning: As a business-focused AI, I prioritize high-income buildings. Factory provides the highest return on investment with +80 income per turn.`);
        } else if (choice === 'residential') {
          console.log(`   🎯 Reasoning: Factory is too expensive right now. Residential building offers good income (+50/turn) at a reasonable cost.`);
        } else if (choice === 'green') {
          console.log(`   🎯 Reasoning: Limited budget forces me to choose Green Building. While income is lower (+30/turn), it's still profitable and helps with environmental balance.`);
        }
      } else {
        if (choice === 'green') {
          console.log(`   🎯 Reasoning: As an eco-focused AI, I prioritize environmental protection. Green Building reduces CO2 (-20) and increases eco score (+30) while providing sustainable income.`);
        } else if (choice === 'residential') {
          console.log(`   🎯 Reasoning: Green Building not affordable right now. Residential offers moderate environmental impact while maintaining economic development.`);
        } else if (choice === 'factory') {
          console.log(`   🎯 Reasoning: Despite environmental concerns, my funds are substantial enough to afford the economic boost. Will balance this with green investments later.`);
        }
      }
      
      console.log(`   📊 Expected Impact: Income +${choice === 'factory' ? '80' : choice === 'residential' ? '50' : '30'}/turn, CO2 ${choice === 'factory' ? '+80' : choice === 'residential' ? '+30' : '-20'}, Eco ${choice === 'factory' ? '-10' : choice === 'residential' ? '0' : '+30'}`);
    } else {
      const aiType = player.type === 'ai-income' ? 'Business AI' : 'Eco AI';
      console.log(`💭 ${aiType} Decision Explanation:`);
      console.log(`   🚫 Reasoning: After analyzing current situation, building is not optimal right now.`);
      console.log(`   💰 Available Funds: ${player.money} coins`);
      console.log(`   📍 Position Analysis: Either insufficient funds, position already occupied, or strategic decision to save resources for better opportunities.`);
    }
    
    return choice;
    
  } catch (error) {
    console.error('💥 DeepSeek API call failed:', error);
    console.log('🔄 Fallback to backup logic');
    return getFallbackAIChoice(player);
  }
}

// Build upgrade decision system prompt
function buildUpgradeSystemPrompt(playerType: PlayerType): string {
  const basePrompt = `You are an intelligent game AI playing a Monopoly-like city building game.

Game Rules:
- Players can upgrade their buildings to get better effects
- Upgrading costs 150 coins, upgraded buildings have enhanced effects
- Upgraded buildings generate more income and environmental impact
- Each building can only be upgraded once (from level 1 to level 2)
- The game goal is to balance economic development and environmental protection

Your character traits:`;

  if (playerType === 'ai-income') {
    return basePrompt + `
- You are a business AI, prioritizing economic benefit maximization
- Prefer upgrading high-income buildings (like factories)
- Between economic benefits and environmental protection, lean towards economics
- But also consider long-term sustainable development and fund management

Please decide whether to upgrade buildings based on current game state, only return yes (upgrade) or no (don't upgrade).`;
  } else {
    return basePrompt + `
- You are an eco AI, prioritizing environmental protection and sustainable development
- Prefer upgrading green buildings, cautiously upgrade high-pollution buildings
- Between economic benefits and environmental protection, lean towards environment
- But also ensure basic economic development needs

Please decide whether to upgrade buildings based on current game state, only return yes (upgrade) or no (don't upgrade).`;
  }
}

// Build upgrade decision user message
function buildUpgradeUserMessage(
  player: Player,
  upgradableBuildings: Array<{position: number, buildingType: BuildingType, upgradeCost: number}>,
  allPlayers: Player[],
  turnCount: number,
  gamePhase: string
): string {
  const currentPosition = pathCoordinates[player.position];
  
  let message = `Current Game Status:
`;
  message += `Turn Count: ${turnCount}
`;
  message += `Game Phase: ${gamePhase}

`;
  
  message += `Your Status:
`;
  message += `- Money: ${player.money}
`;
  message += `- CO2 Emissions: ${player.co2}
`;
  message += `- Eco Index: ${player.eco}
`;
  message += `- Current Position: Grid ${player.position} (${currentPosition.row}, ${currentPosition.col})
`;
  
  message += `Upgradable Buildings:
`;
  upgradableBuildings.forEach((building, index) => {
    const pos = pathCoordinates[building.position];
    message += `${index + 1}. Position ${building.position} (${pos.row}, ${pos.col}) - ${building.buildingType} building, upgrade cost: ${building.upgradeCost} coins
`;
  });
  
  message += `
Other Players Status:
`;
  allPlayers.filter(p => p.id !== player.id).forEach(p => {
    message += `- ${p.name}: Money ${p.money}, CO2=${p.co2}, Eco=${p.eco}
`;
  });
  
  message += `
Please decide whether to upgrade buildings (only return yes or no):`;
  
  return message;
}

// Parse upgrade response
function parseUpgradeResponse(response: string): boolean {
  if (!response) return false;
  
  const lowerResponse = response.toLowerCase().trim();
  
  // Check explicit yes/no answers
  if (lowerResponse.includes('yes') || lowerResponse.includes('upgrade')) {
    return true;
  }
  if (lowerResponse.includes('no') || lowerResponse.includes('no upgrade')) {
    return false;
  }
  
  // Default to no upgrade
  return false;
}

// Fallback upgrade logic
function getFallbackUpgradeChoice(
  player: Player,
  upgradableBuildings: Array<{position: number, buildingType: BuildingType, upgradeCost: number}>
): boolean {
  console.log(`🔧 Using fallback upgrade logic - Player: ${player.name}`);
  
  // If no upgradable buildings, return false
  if (upgradableBuildings.length === 0) {
    return false;
  }
  
  // Check if there's enough money to upgrade
  const canAffordUpgrade = upgradableBuildings.some(building => player.money >= building.upgradeCost);
  if (!canAffordUpgrade) {
    console.log(`💰 Fallback logic: Insufficient money, cannot upgrade`);
    return false;
  }
  
  if (player.type === 'ai-income') {
    // Business AI: If there's a factory and enough money, prioritize upgrading factory
    const factoryToUpgrade = upgradableBuildings.find(b => b.buildingType === 'factory' && player.money >= b.upgradeCost);
    if (factoryToUpgrade) {
      console.log(`🏭 Fallback logic: Business AI chooses to upgrade factory`);
      return true;
    }
    // If lots of money (over 400), upgrade any building
    if (player.money >= 400) {
      console.log(`💰 Fallback logic: Business AI has sufficient funds, chooses to upgrade`);
      return true;
    }
  } else if (player.type === 'ai-eco') {
    // Eco AI: Prioritize upgrading green buildings
    const greenToUpgrade = upgradableBuildings.find(b => b.buildingType === 'green' && player.money >= b.upgradeCost);
    if (greenToUpgrade) {
      console.log(`🌱 Fallback logic: Eco AI chooses to upgrade green building`);
      return true;
    }
    // If lots of money (over 350), upgrade non-factory buildings
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

// Fallback AI logic (original simple logic)
function getFallbackAIChoice(player: Player): BuildingType | null {
  const currentPosition = pathCoordinates[player.position];
  const posKey = `${currentPosition.row}-${currentPosition.col}`;
  
  // Check grid type: only buildable grids can be built on
  if (currentPosition.type !== 'build') {
    console.log(`❌ Fallback logic: Current grid type is ${currentPosition.type}, not a buildable grid, cannot build`);
    return null;
  }
  
  // Check if building is possible
  if (player.built[posKey]) return null;
  if (player.position === 0 && !player.passedStart) return null;
  
  if (player.type === 'ai-income') {
    // Business AI prioritizes building factories (high income)
    if (player.money >= 300) return 'factory';
    if (player.money >= 200) return 'residential';
    if (player.money >= 150) return 'green';
  } else if (player.type === 'ai-eco') {
    // Eco AI prioritizes building green buildings
    if (player.money >= 150) return 'green';
    if (player.money >= 200) return 'residential';
    // Eco AI avoids building factories unless too much money
    if (player.money >= 500) return 'factory';
  }
  
  return null;
}

// Policy choice AI (optional feature)
export async function getAIPolicyChoiceFromDeepSeek(
  player: Player,
  policyChoices: Array<{ text: string; effects: any }>
): Promise<number> {
  try {
    const systemPrompt = buildSystemPrompt(player.type) + '\n\nNow you need to choose a policy option, please return the option number (0, 1, 2, etc.).';
    
    const userMessage = `Current Policy Choices:\n${policyChoices.map((choice, idx) => 
      `${idx}: ${choice.text} (Effects: ${JSON.stringify(choice.effects)})`
    ).join('\n')}\n\nPlease choose the option number that best fits your character traits.`;
    
    const request: DeepSeekRequest = {
    model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.5,
      max_tokens: 50
    };
    
    const response = await callDeepSeekAPI(request);
    const choiceIndex = parseInt(response.trim());
    
    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= policyChoices.length) {
      throw new Error('Invalid choice index');
    }
    
    // Add detailed explanation for the AI's policy decision
    const aiType = player.type === 'ai-income' ? 'Business AI' : 'Eco AI';
    const selectedPolicy = policyChoices[choiceIndex];
    
    console.log(`🏛️ ${aiType} Policy Decision:`);
    console.log(`   📋 Selected Option ${choiceIndex}: "${selectedPolicy.text}"`);
    console.log(`   📊 Policy Effects: ${JSON.stringify(selectedPolicy.effects)}`);
    
    // Generate reasoning based on AI type and policy effects
    console.log(`💭 ${aiType} Policy Reasoning:`);
    
    if (player.type === 'ai-income') {
      const moneyEffect = selectedPolicy.effects.money || 0;
      const co2Effect = selectedPolicy.effects.co2 || 0;
      const ecoEffect = selectedPolicy.effects.eco || 0;
      
      if (moneyEffect > 0) {
        console.log(`   💰 Reasoning: This policy increases income by ${moneyEffect} coins, directly supporting my business-focused strategy.`);
      } else if (moneyEffect < 0) {
        console.log(`   💸 Reasoning: While this policy costs ${Math.abs(moneyEffect)} coins, it's the best available option that minimizes financial loss.`);
      } else {
        console.log(`   ⚖️ Reasoning: This policy has neutral financial impact, chosen as the most balanced option among available choices.`);
      }
      
      if (co2Effect !== 0 || ecoEffect !== 0) {
        console.log(`   🌍 Secondary Consideration: Environmental impact (CO2: ${co2Effect >= 0 ? '+' : ''}${co2Effect}, Eco: ${ecoEffect >= 0 ? '+' : ''}${ecoEffect}) is acceptable for business growth.`);
      }
    } else {
      const ecoEffect = selectedPolicy.effects.eco || 0;
      const co2Effect = selectedPolicy.effects.co2 || 0;
      const moneyEffect = selectedPolicy.effects.money || 0;
      
      if (ecoEffect > 0 || co2Effect < 0) {
        console.log(`   🌱 Reasoning: This policy improves environmental conditions (Eco: ${ecoEffect >= 0 ? '+' : ''}${ecoEffect}, CO2: ${co2Effect >= 0 ? '+' : ''}${co2Effect}), aligning with my eco-focused mission.`);
      } else if (ecoEffect < 0 || co2Effect > 0) {
        console.log(`   ⚠️ Reasoning: Despite negative environmental impact (Eco: ${ecoEffect >= 0 ? '+' : ''}${ecoEffect}, CO2: ${co2Effect >= 0 ? '+' : ''}${co2Effect}), this is the least harmful option available.`);
      } else {
        console.log(`   🔄 Reasoning: This policy has neutral environmental impact, chosen as a balanced compromise among available options.`);
      }
      
      if (moneyEffect !== 0) {
        console.log(`   💼 Secondary Consideration: Economic impact (${moneyEffect >= 0 ? '+' : ''}${moneyEffect} coins) is acceptable to achieve environmental goals.`);
      }
    }
    
    console.log(`   🎯 Final Decision: Option ${choiceIndex} best represents my strategic priorities and values.`);
    
    return choiceIndex;
    
  } catch (error) {
    console.error('DeepSeek policy choice failed, using fallback logic:', error);
    // Fallback to original logic
    return getFallbackPolicyChoice(player, policyChoices);
  }
}

// Fallback policy choice logic
function getFallbackPolicyChoice(player: Player, policyChoices: Array<{ text: string; effects: any }>): number {
  if (player.type === 'ai-income') {
    // Business AI prioritizes options that increase money
    const bestChoice = policyChoices.findIndex(choice => (choice.effects.money || 0) > 0);
    if (bestChoice !== -1) return bestChoice;
    
    // If no money-increasing options, choose the one with least loss
    return policyChoices.reduce((bestIdx, choice, idx) => {
      const currentMoney = choice.effects.money || 0;
      const bestMoney = policyChoices[bestIdx].effects.money || 0;
      return currentMoney > bestMoney ? idx : bestIdx;
    }, 0);
  } else {
    // Eco AI prioritizes options that increase eco or reduce CO2
    const bestChoice = policyChoices.findIndex(choice => 
      (choice.effects.eco || 0) > 0 || (choice.effects.co2 || 0) < 0
    );
    if (bestChoice !== -1) return bestChoice;
    
    // If no eco options, choose the one with minimal environmental impact
    return policyChoices.reduce((bestIdx, choice, idx) => {
      const currentEcoScore = (choice.effects.eco || 0) - (choice.effects.co2 || 0);
      const bestEcoScore = (policyChoices[bestIdx].effects.eco || 0) - (policyChoices[bestIdx].effects.co2 || 0);
      return currentEcoScore > bestEcoScore ? idx : bestIdx;
    }, 0);
  }
}