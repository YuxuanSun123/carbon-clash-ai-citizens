// DeepSeek API 服务
import type { Player, PlayerType } from '../hooks/useMultiPlayerGameState';
import type { BuildingType } from '../data/buildings';
import { buildingData } from '../data/buildings';
import { pathCoordinates } from '../utils/path';

// DeepSeek API 配置
// 支持本地ollama部署和远程API
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';

// API 请求接口
interface DeepSeekRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

// API 响应接口
interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// 游戏状态信息
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

// 构建系统提示词
function buildSystemPrompt(playerType: PlayerType): string {
  const basePrompt = `你是一个智能游戏AI，正在玩一个类似大富翁的城市建设游戏。

游戏规则：
- 玩家在棋盘上移动，可以在格子上建造建筑
- 建筑类型：工厂(300金币，高收入+80CO2-10生态)、住宅(200金币，中等收入+30CO2)、绿色建筑(150金币，低收入-20CO2+30生态)
- 每回合建筑会产生收入和环境影响
- 游戏目标是平衡经济发展和环境保护

你的角色特点：`;

  if (playerType === 'ai-income') {
    return basePrompt + `
- 你是商业AI，优先追求经济利益最大化
- 偏好建造高收入建筑（工厂）
- 在经济效益和环境保护之间更倾向于经济
- 但也要考虑长期可持续发展

请根据当前游戏状态做出最优决策，只返回建筑类型（factory/residential/green）或none（不建造）。`;
  } else {
    return basePrompt + `
- 你是环保AI，优先追求环境保护和可持续发展
- 偏好建造绿色建筑，避免高污染建筑
- 在经济效益和环境保护之间更倾向于环保
- 但也要保证基本的经济发展需求

请根据当前游戏状态做出最优决策，只返回建筑类型（factory/residential/green）或none（不建造）。`;
  }
}

// 构建用户消息
function buildUserMessage(context: GameContext): string {
  const { currentPlayer, allPlayers, currentPosition } = context;
  
  const playerStatus = `当前状态：
- 金钱：${currentPlayer.money}
- CO2排放：${currentPlayer.co2}
- 生态值：${currentPlayer.eco}
- 位置：第${currentPlayer.position}格（${currentPosition.type}类型）
- 已建建筑数量：${Object.keys(currentPlayer.built).length}`;
  
  const buildingOptions = `可建造建筑：
- 工厂：300金币，收入高，+80CO2，-10生态
- 住宅：200金币，收入中等，+30CO2
- 绿色建筑：150金币，收入低，-20CO2，+30生态`;
  
  const otherPlayers = allPlayers
    .filter(p => p.id !== currentPlayer.id)
    .map(p => `${p.name}：金钱${p.money}，CO2${p.co2}，生态${p.eco}`)
    .join('\n');
  
  const posKey = `${currentPosition.row}-${currentPosition.col}`;
  const hasBuilding = currentPlayer.built[posKey];
  
  let situationAnalysis = '';
  if (hasBuilding) {
    situationAnalysis = '当前位置已有建筑，无法建造。';
  } else if (currentPlayer.position === 0 && !currentPlayer.passedStart) {
    situationAnalysis = '在起点且未经过起点，无法建造。';
  } else {
    situationAnalysis = '当前位置可以建造建筑。';
  }
  
  return `${playerStatus}\n\n其他玩家：\n${otherPlayers}\n\n${buildingOptions}\n\n${situationAnalysis}\n\n请分析当前局势并做出建造决策。只返回：factory、residential、green 或 none`;
}

// 调用 DeepSeek API
async function callDeepSeekAPI(request: DeepSeekRequest): Promise<string> {
  // 检查是否为ollama本地部署（通过URL判断）
  const isOllama = DEEPSEEK_API_URL.includes('localhost') || DEEPSEEK_API_URL.includes('127.0.0.1') || DEEPSEEK_API_URL.includes('ollama');
  
  // 如果不是ollama且没有API key，则报错
  if (!isOllama && !DEEPSEEK_API_KEY) {
    console.warn('DeepSeek API Key 未配置，使用默认AI逻辑');
    throw new Error('API Key not configured');
  }
  
  console.log('🚀 开始调用AI API...');
  console.log('🔗 API地址:', DEEPSEEK_API_URL);
  console.log('🤖 使用模型:', DEEPSEEK_MODEL);
  console.log('📝 请求数据:', JSON.stringify(request, null, 2));
  
  try {
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 只有在非ollama环境下才添加Authorization头
    if (!isOllama && DEEPSEEK_API_KEY) {
      headers['Authorization'] = `Bearer ${DEEPSEEK_API_KEY}`;
    }
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
    
    console.log('📡 API响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API请求失败详情:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const data: DeepSeekResponse = await response.json();
    console.log('✅ API响应成功:', data);
    
    const content = data.choices[0]?.message?.content || '';
    console.log('🎯 AI回复内容:', content);
    
    return content;
  } catch (error) {
    console.error('💥 DeepSeek API 调用失败:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 网络连接问题，请检查网络连接');
    }
    throw error;
  }
}

// 解析AI响应
function parseAIResponse(response: string): BuildingType | null {
  const cleanResponse = response.toLowerCase().trim();
  
  if (cleanResponse.includes('factory')) return 'factory';
  if (cleanResponse.includes('residential')) return 'residential';
  if (cleanResponse.includes('green')) return 'green';
  if (cleanResponse.includes('none')) return null;
  
  // 如果无法解析，返回null（不建造）
  console.warn('无法解析AI响应:', response);
  return null;
}

// 主要的AI决策函数
export async function getAIBuildingChoiceFromDeepSeek(
  player: Player,
  allPlayers: Player[],
  gamePhase: 'rolling' | 'building' | 'waiting',
  turnCount: number
): Promise<BuildingType | null> {
  console.log(`🔍 DeepSeek API: 开始为玩家 ${player.name} 生成建筑决策`);
  console.log(`📍 玩家状态: 位置=${player.position}, 金钱=${player.money}, CO2=${player.co2}, 生态=${player.eco}`);
  
  try {
    // 构建游戏上下文
    const currentPosition = pathCoordinates[player.position];
    const context: GameContext = {
      currentPlayer: player,
      allPlayers,
      gamePhase,
      turnCount,
      availableBuildings: ['factory', 'residential', 'green'],
      currentPosition
    };
    
    console.log(`🎯 游戏上下文: 回合=${turnCount}, 阶段=${gamePhase}, 位置类型=${currentPosition.type}`);
    
    // 检查格子类型：只有可建造格子才能建造
    if (currentPosition.type !== 'build') {
      console.log(`❌ DeepSeek API: 当前格子类型为 ${currentPosition.type}，不是可建造格子，无法建造`);
      return null;
    }
    
    // 检查基本建造条件
    const posKey = `${currentPosition.row}-${currentPosition.col}`;
    if (player.built[posKey]) {
      console.log(`❌ DeepSeek API: 位置已有建筑，无法建造`);
      return null;
    }
    if (player.position === 0 && !player.passedStart) {
      console.log(`❌ DeepSeek API: 在起点且未经过起点，无法建造`);
      return null;
    }
    
    console.log(`📝 构建API请求...`);
    console.log(`🤖 AI类型: ${player.type === 'ai-income' ? '商业AI' : '环保AI'}`);
    
    // 构建API请求
    const request: DeepSeekRequest = {
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(player.type)
        },
        {
          role: 'user',
          content: buildUserMessage(context)
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    };
    
    console.log(`🌐 发送请求到DeepSeek API: ${DEEPSEEK_API_URL}`);
    console.log(`📊 使用模型: ${DEEPSEEK_MODEL}`);
    
    // 调用API
    const response = await callDeepSeekAPI(request);
    console.log(`📥 DeepSeek API响应: "${response}"`);
    
    const choice = parseAIResponse(response);
    console.log(`🔍 解析结果: ${choice || 'none'}`);
    
    // 验证选择是否可行（检查金钱）
    if (choice) {
      const costMap = {
        factory: 300,
        residential: 200,
        green: 150,
      };
      
      const cost = costMap[choice];
      console.log(`💰 建筑成本检查: ${choice}需要${cost}金币，玩家有${player.money}金币`);
      
      if (player.money < cost) {
        console.log(`❌ 金钱不足! AI选择了${choice}但只有${player.money}金币，需要${cost}金币`);
        return null;
      } else {
        console.log(`✅ 金钱充足，可以建造${choice}`);
      }
    }
    
    console.log(`🎯 DeepSeek AI最终决策: ${choice || 'none'}`);
    return choice;
    
  } catch (error) {
    console.error('❌ DeepSeek API调用失败:', error);
    console.log(`🔄 降级到备用逻辑...`);
    // 降级到原有的简单AI逻辑
    return getFallbackAIChoice(player);
  }
}

// 备用AI逻辑（原有的简单逻辑）
function getFallbackAIChoice(player: Player): BuildingType | null {
  const currentPosition = pathCoordinates[player.position];
  const posKey = `${currentPosition.row}-${currentPosition.col}`;
  
  // 检查格子类型：只有可建造格子才能建造
  if (currentPosition.type !== 'build') {
    console.log(`❌ 备用逻辑: 当前格子类型为 ${currentPosition.type}，不是可建造格子，无法建造`);
    return null;
  }
  
  // 检查是否可以建造
  if (player.built[posKey]) return null;
  if (player.position === 0 && !player.passedStart) return null;
  
  if (player.type === 'ai-income') {
    // 商业AI优先建造工厂（高收入）
    if (player.money >= 300) return 'factory';
    if (player.money >= 200) return 'residential';
    if (player.money >= 150) return 'green';
  } else if (player.type === 'ai-eco') {
    // 环保AI优先建造绿色建筑
    if (player.money >= 150) return 'green';
    if (player.money >= 200) return 'residential';
    // 环保AI避免建造工厂，除非钱太多
    if (player.money >= 500) return 'factory';
  }
  
  return null;
}

// 政策选择AI（可选功能）
export async function getAIPolicyChoiceFromDeepSeek(
  player: Player,
  policyChoices: Array<{ text: string; effects: any }>,
  allPlayers: Player[]
): Promise<number> {
  try {
    const systemPrompt = buildSystemPrompt(player.type) + '\n\n现在需要你选择政策选项，请返回选项编号（0、1、2等）。';
    
    const userMessage = `当前政策选择：\n${policyChoices.map((choice, idx) => 
      `${idx}: ${choice.text} (效果: ${JSON.stringify(choice.effects)})`
    ).join('\n')}\n\n请选择最符合你角色特点的选项编号。`;
    
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
    console.error('DeepSeek政策选择失败，使用备用逻辑:', error);
    // 降级到原有逻辑
    return getFallbackPolicyChoice(player, policyChoices);
  }
}

// 备用政策选择逻辑
function getFallbackPolicyChoice(player: Player, policyChoices: Array<{ text: string; effects: any }>): number {
  if (player.type === 'ai-income') {
    // 商业AI优先选择增加金钱的选项
    const bestChoice = policyChoices.findIndex(choice => (choice.effects.money || 0) > 0);
    if (bestChoice !== -1) return bestChoice;
    
    // 如果没有增加金钱的选项，选择损失最少的
    return policyChoices.reduce((bestIdx, choice, idx) => {
      const currentMoney = choice.effects.money || 0;
      const bestMoney = policyChoices[bestIdx].effects.money || 0;
      return currentMoney > bestMoney ? idx : bestIdx;
    }, 0);
  } else {
    // 环保AI优先选择增加生态或减少CO2的选项
    const bestChoice = policyChoices.findIndex(choice => 
      (choice.effects.eco || 0) > 0 || (choice.effects.co2 || 0) < 0
    );
    if (bestChoice !== -1) return bestChoice;
    
    // 如果没有环保选项，选择对环境影响最小的
    return policyChoices.reduce((bestIdx, choice, idx) => {
      const currentEcoScore = (choice.effects.eco || 0) - (choice.effects.co2 || 0);
      const bestEcoScore = (policyChoices[bestIdx].effects.eco || 0) - (policyChoices[bestIdx].effects.co2 || 0);
      return currentEcoScore > bestEcoScore ? idx : bestIdx;
    }, 0);
  }
}