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
    
    console.log(`🎯 DeepSeek AI final decision: ${choice || 'none'}`);
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