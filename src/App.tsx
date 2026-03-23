import MultiPlayerApp from "./MultiPlayerApp";
import { useState } from "react";
import heroClimateScene from "./assets/hero-climate-scene.svg";

function App() {
  const [gameMode, setGameMode] = useState<'menu' | 'multi'>('menu');

  // 如果选择多人模式，渲染多人游戏组件
  if (gameMode === 'multi') {
    return <MultiPlayerApp onBackToMenu={() => setGameMode('menu')} />;
  }

  // 游戏模式选择菜单
  if (gameMode === 'menu') {
    return (
      <div className="landing-theme relative min-h-screen overflow-hidden bg-[#0a2a4a] text-white">
        <img
          src={heroClimateScene}
          alt="Climate themed city illustration"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,52,96,0.3)_0%,rgba(18,73,109,0.56)_45%,rgba(24,61,90,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(88,218,255,0.22)_0,rgba(88,218,255,0)_42%),radial-gradient(circle_at_80%_14%,rgba(99,255,204,0.2)_0,rgba(99,255,204,0)_38%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:30px_30px] opacity-25" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[clamp(24px,10vw,170px)] bg-[linear-gradient(90deg,rgba(3,18,37,0.78),rgba(3,18,37,0.28),transparent)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[clamp(24px,10vw,170px)] bg-[linear-gradient(270deg,rgba(3,18,37,0.78),rgba(3,18,37,0.28),transparent)]" />
        <div className="pointer-events-none absolute inset-y-3 left-3 z-20 flex w-14 items-center justify-center md:left-5 lg:left-7">
          <div className="relative h-full w-full rounded-xl border border-emerald-100/70 bg-[linear-gradient(180deg,rgba(22,163,74,0.45),rgba(8,47,73,0.3))] shadow-[0_0_24px_rgba(110,231,183,0.45)] backdrop-blur-md">
            <div className="absolute inset-y-2 left-1/2 w-1 -translate-x-1/2 bg-emerald-100/80" />
            <div className="absolute left-2 top-8 h-2 w-2 bg-emerald-200/90 shadow-[0_0_10px_rgba(167,243,208,0.8)]" />
            <div className="absolute right-2 top-[16%] h-2 w-2 bg-lime-200/90 shadow-[0_0_10px_rgba(217,249,157,0.8)]" />
            <div className="absolute left-2 top-[26%] h-3 w-3 bg-emerald-300/80" />
            <div className="absolute right-2 top-[38%] h-2.5 w-2.5 bg-green-200/90" />
            <div className="absolute left-2 top-[50%] h-2 w-2 bg-lime-200/90" />
            <div className="absolute right-2 top-[62%] h-3 w-3 bg-emerald-200/85" />
            <div className="absolute left-2 top-[74%] h-2.5 w-2.5 bg-green-200/90" />
            <div className="absolute right-2 top-[86%] h-2 w-2 bg-lime-100/90" />
            <div className="absolute left-2 top-[94%] h-3 w-3 bg-emerald-200/85" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-3 right-3 z-20 flex w-14 items-center justify-center md:right-5 lg:right-7">
          <div className="relative h-full w-full rounded-xl border border-cyan-100/70 bg-[linear-gradient(180deg,rgba(16,185,129,0.4),rgba(8,47,73,0.32))] shadow-[0_0_24px_rgba(103,232,249,0.4)] backdrop-blur-md">
            <div className="absolute inset-y-2 left-1/2 w-1 -translate-x-1/2 bg-cyan-100/75" />
            <div className="absolute right-2 top-10 h-2 w-2 bg-cyan-200/90 shadow-[0_0_10px_rgba(165,243,252,0.75)]" />
            <div className="absolute left-2 top-[18%] h-2.5 w-2.5 bg-emerald-200/90" />
            <div className="absolute right-2 top-[30%] h-3 w-3 bg-teal-200/80" />
            <div className="absolute left-2 top-[42%] h-2 w-2 bg-cyan-100/90" />
            <div className="absolute right-2 top-[54%] h-3 w-3 bg-emerald-200/85" />
            <div className="absolute left-2 top-[68%] h-2.5 w-2.5 bg-cyan-200/85" />
            <div className="absolute right-2 top-[80%] h-2 w-2 bg-teal-100/90" />
            <div className="absolute left-2 top-[92%] h-3 w-3 bg-emerald-100/80" />
          </div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-2 py-10">
          <div className="relative w-full max-w-[1100px]">
            <div className="pointer-events-none absolute -top-10 left-10 h-32 w-32 rounded-full border border-cyan-200/35 bg-cyan-300/15 blur-xl" />
            <div className="pointer-events-none absolute -bottom-8 right-20 h-36 w-36 rounded-full border border-fuchsia-200/35 bg-fuchsia-300/15 blur-xl" />
            <div className="pointer-events-none absolute top-16 right-10 h-24 w-24 animate-spin rounded-full border-2 border-emerald-200/40 border-t-transparent" />

            <section className="rounded-[2rem] border border-cyan-100/50 bg-[linear-gradient(150deg,rgba(31,84,146,0.58),rgba(27,125,163,0.54)_40%,rgba(27,157,127,0.5)_100%)] p-6 shadow-[0_30px_100px_rgba(6,42,79,0.55)] backdrop-blur-2xl md:p-8">
              <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <div className="landing-text inline-flex items-center gap-2 rounded-full border border-cyan-50/80 bg-cyan-100/25 px-4 py-1.5 text-sm font-semibold tracking-wide">
                    <span>🌍</span>
                    <span>Carbon Strategy Simulation</span>
                  </div>

                  <h1 className="landing-title text-4xl leading-[1.04] md:text-7xl [font-family:'Orbitron','Noto_Sans_SC',sans-serif] font-black">
                    Carbon Clash
                  </h1>
                  <p className="landing-text max-w-3xl text-lg leading-relaxed text-cyan-50">
                    在工业增长与生态修复之间持续博弈。你将与商业 AI、环保 AI 同台竞争，用每一步决策塑造城市未来。
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-amber-100/70 bg-[linear-gradient(160deg,rgba(251,191,36,0.24),rgba(251,191,36,0.08))] p-4 shadow-[0_10px_30px_rgba(251,191,36,0.25)]">
                      <div className="text-xs font-bold tracking-wide text-amber-50">经济发展</div>
                      <div className="mt-2 text-base font-bold text-white">利润与现金流</div>
                    </div>
                    <div className="rounded-xl border border-cyan-100/70 bg-[linear-gradient(160deg,rgba(34,211,238,0.24),rgba(34,211,238,0.08))] p-4 shadow-[0_10px_30px_rgba(34,211,238,0.25)]">
                      <div className="text-xs font-bold tracking-wide text-cyan-50">碳排博弈</div>
                      <div className="mt-2 text-base font-bold text-white">风险与约束</div>
                    </div>
                    <div className="rounded-xl border border-rose-100/70 bg-[linear-gradient(160deg,rgba(244,114,182,0.24),rgba(244,114,182,0.08))] p-4 shadow-[0_10px_30px_rgba(244,114,182,0.25)]">
                      <div className="text-xs font-bold tracking-wide text-rose-50">政策投票</div>
                      <div className="mt-2 text-base font-bold text-white">多方协同</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/45 bg-[linear-gradient(170deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))] p-5 backdrop-blur-xl shadow-[0_16px_46px_rgba(7,26,52,0.4)]">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-white/40 bg-white/12 px-2 py-2 text-center">
                      <div className="text-[11px] font-semibold text-cyan-50">MODE</div>
                      <div className="text-sm font-bold text-white">Multiplayer</div>
                    </div>
                    <div className="rounded-lg border border-white/40 bg-white/12 px-2 py-2 text-center">
                      <div className="text-[11px] font-semibold text-emerald-50">AI</div>
                      <div className="text-sm font-bold text-white">2 Rivals</div>
                    </div>
                    <div className="rounded-lg border border-white/40 bg-white/12 px-2 py-2 text-center">
                      <div className="text-[11px] font-semibold text-amber-50">FOCUS</div>
                      <div className="text-sm font-bold text-white">Balance</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl border border-cyan-50/50 bg-cyan-50/12 p-3">
                      <div className="text-sm font-semibold text-cyan-50">🎯 胜负关键</div>
                      <div className="text-sm text-white">资金、生态、碳排三项综合得分</div>
                    </div>
                    <div className="rounded-xl border border-emerald-50/50 bg-emerald-50/12 p-3">
                      <div className="text-sm font-semibold text-emerald-50">🤖 对手特点</div>
                      <div className="text-sm text-white">商业 AI 偏收益，环保 AI 偏减排</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setGameMode('multi')}
                    className="group mt-5 w-full rounded-xl border border-amber-100 bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 px-6 py-3.5 text-base font-extrabold text-slate-900 shadow-[0_14px_34px_rgba(252,188,94,0.42)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(252,188,94,0.6)]"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span>🚀</span>
                      <span>进入多人对局</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </button>
                  <p className="landing-text-soft mt-4 text-sm">推荐分辨率 1366×768 以上，体验更佳。</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
