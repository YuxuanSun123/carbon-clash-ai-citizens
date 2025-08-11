import MultiPlayerApp from "./MultiPlayerApp";
import { useState } from "react";

function App() {
  const [gameMode, setGameMode] = useState<'menu' | 'multi'>('menu');

  // 如果选择多人模式，渲染多人游戏组件
  if (gameMode === 'multi') {
    return <MultiPlayerApp onBackToMenu={() => setGameMode('menu')} />;
  }

  // 游戏模式选择菜单
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-8 animate-pulse">🌍</div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            Carbon Clash
          </h1>
          <p className="text-xl text-gray-300 mb-12">Carbon Clash</p>
          
          <div className="space-y-6">
            <button
              onClick={() => setGameMode('multi')}
              className="block w-80 mx-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🤖</span>
                <div className="text-left">
                  <div className="text-lg">Start Game</div>
                  <div className="text-sm text-purple-200">Battle against AI Business & AI Environmentalist</div>
                </div>
              </div>
            </button>
          </div>
          
          <div className="mt-12 text-sm text-gray-400">
            <p>Start your environmental journey</p>
          </div>
        </div>
      </div>
    );
  }

  // 这里不应该到达，因为只有menu和multi两种模式
  return null;
}

export default App;
