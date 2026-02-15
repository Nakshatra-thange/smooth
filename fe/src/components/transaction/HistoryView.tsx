import { useState } from 'react';
import { ArrowUp, ArrowDown, MessageSquare, Bot } from 'lucide-react';
import { useUnifiedHistory } from "@/hooks/useUnifiedHistory";

const filters = ['All', 'Confirmed', 'Pending', 'Failed'] as const;

const HistoryView = () => {
  const history = useUnifiedHistory();
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Filter only works for transactions, show all for messages
  const filtered = activeFilter === 'All'
    ? history
    : history.filter((item) => 
        item.type === 'transaction' && item.status === activeFilter.toLowerCase()
      );

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof history>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  // Helper to get icon based on item type
  const getIcon = (item: any) => {
    if (item.type === 'transaction') {
      return item.type === 'sent' ? (
        <ArrowUp className="w-4 h-4 text-cherry-soda" />
      ) : (
        <ArrowDown className="w-4 h-4 text-green-400" />
      );
    } else {
      // Message
      return item.role === 'user' ? (
        <MessageSquare className="w-4 h-4 text-blue-400" />
      ) : (
        <Bot className="w-4 h-4 text-purple-400" />
      );
    }
  };

  // Helper to get icon background color
  const getIconBg = (item: any) => {
    if (item.type === 'transaction') {
      return item.type === 'sent' ? 'bg-cherry-soda/20' : 'bg-green-500/20';
    } else {
      return item.role === 'user' ? 'bg-blue-500/20' : 'bg-purple-500/20';
    }
  };

  // Helper to get title text
  const getTitle = (item: any) => {
    if (item.type === 'transaction') {
      return item.type === 'sent' ? 'Sent SOL' : 'Received SOL';
    } else {
      return item.role === 'user' ? 'You said' : 'Smooth replied';
    }
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-app-text mb-1 text-bubbly">History</h1>
      <p className="text-sm text-app-text-muted mb-6 text-bubbly">Your conversations and transactions</p>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeFilter === f
                ? 'gradient-pink text-white'
                : 'border border-app-border text-app-text-muted hover:border-cherry-soda/40'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* History groups */}
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-app-text-muted py-2 font-medium">{date}</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-app-surface border border-app-border rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-cherry-soda/30 hover:glow-pink transition-all duration-200 cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBg(item)}`}>
                  {getIcon(item)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-app-text">
                    {getTitle(item)}
                  </p>
                  <p className="text-[10px] text-app-text-muted truncate">
                    {item.content || `${item.amount || ''} ${item.amount ? 'SOL' : ''}`}
                  </p>
                  {item.type === 'transaction' && item.to && (
                    <p className="text-[10px] text-app-text-muted font-mono truncate">
                      To: {item.to}
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  {item.type === 'transaction' && (
                    <>
                      <p className={`text-sm font-medium ${item.type === 'sent' ? 'text-cherry-soda' : 'text-green-400'}`}>
                        {item.type === 'sent' ? '-' : '+'}{item.amount} SOL
                      </p>
                      <div className="flex items-center justify-end gap-2">
                        <span className={`text-[10px] ${
                          item.status === 'confirmed' ? 'text-green-400' : 
                          item.status === 'failed' ? 'text-red-400' : 
                          'text-yellow-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </>
                  )}
                  <span className="text-[10px] text-app-text-muted">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-app-text-muted text-sm">No history yet</p>
          <p className="text-app-text-muted text-xs mt-1">Start chatting to see your history here</p>
        </div>
      )}
    </div>
  );
};

export default HistoryView;