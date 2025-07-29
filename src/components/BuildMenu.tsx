import type { BuildingType } from "../data/buildings";
import { buildingData } from "../data/buildings";

interface BuildMenuProps {
  onBuild: (type: BuildingType) => void;
  onClose: () => void;
}

const BuildMenu = ({ onBuild, onClose }: BuildMenuProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 max-w-4xl mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            🏗️ 选择建造类型
          </h2>
          <p className="text-gray-600">选择要建造的建筑类型</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {Object.entries(buildingData).map(([type, data]) => (
            <button
              key={type}
              onClick={() => onBuild(type as BuildingType)}
              className="
                group relative p-6 rounded-2xl border-2 border-gray-200
                bg-gradient-to-br from-white to-gray-50
                hover:border-blue-400 hover:shadow-xl
                transform transition-all duration-300
                hover:scale-105 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white
                active:scale-95
              "
            >
              {/* 建筑图标 */}
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {data.icon}
              </div>
              
              {/* 建筑名称 */}
              <h3 className="text-lg font-bold text-gray-800 mb-3">{data.name}</h3>
              
              {/* 建造成本 */}
              <div className="bg-yellow-100 rounded-lg p-2 mb-3">
                <span className="text-sm font-semibold text-yellow-700">
                  💰 建造成本：{data.cost}
                </span>
              </div>
              
              {/* 建造效果 */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">建造时效果：</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-red-600">🏭 CO2: {data.co2}</span>
                  <span className="text-green-600">🌱 生态: {data.eco}</span>
                </div>
              </div>
              
              {/* 每回合效果 */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="text-xs font-semibold text-gray-700 mb-2">每回合效果：</div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">📈 收入</span>
                    <span className="text-xs font-bold text-green-600">+{data.income}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">🏭 排放</span>
                    <span className={`text-xs font-bold ${
                      data.co2PerTurn > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {data.co2PerTurn > 0 ? '+' : ''}{data.co2PerTurn}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">🌱 生态</span>
                    <span className={`text-xs font-bold ${
                      data.ecoPerTurn > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {data.ecoPerTurn > 0 ? '+' : ''}{data.ecoPerTurn}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 悬停效果 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          ))}
        </div>
        
        <div className="text-center">
          <button
            onClick={onClose}
            className="
              px-6 py-3 bg-gray-500 text-white rounded-xl
              hover:bg-gray-600 transition-colors duration-300
              font-medium
            "
          >
            ❌ 取消建造
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildMenu;
