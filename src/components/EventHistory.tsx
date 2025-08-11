interface EventHistoryProps {
  eventHistory: string[];
  isOpen: boolean;
  onToggle: () => void;
}

const EventHistory = ({ eventHistory, isOpen, onToggle }: EventHistoryProps) => {
  return (
    <div className="w-full">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-300 rounded-xl hover:from-purple-400/30 hover:to-pink-400/30 transition-all duration-300 flex items-center justify-between backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <span className="font-medium">Event History</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-purple-500/30 text-purple-200 px-2 py-1 rounded-lg text-sm font-bold">
            {eventHistory.length}
          </span>
          <span className={`transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}>
            ▼
          </span>
        </div>
      </button>
      
      {isOpen && (
        <div className="mt-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-cyan-400 flex items-center gap-2">
              <span className="text-lg">📋</span>
              Event History Records
            </h3>
          </div>
          
          {eventHistory.length === 0 ? (
            <div className="p-6 text-gray-400 text-center">
              <div className="text-4xl mb-2 opacity-50">📝</div>
              <div className="text-sm">暂无事件记录</div>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {eventHistory.slice().reverse().map((event, index) => (
                <div
                  key={index}
                  className="p-3 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-lg text-xs font-bold min-w-fit">
                      #{eventHistory.length - index}
                    </span>
                    <span className="text-gray-300 text-sm leading-relaxed flex-1">
                      {event}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventHistory;