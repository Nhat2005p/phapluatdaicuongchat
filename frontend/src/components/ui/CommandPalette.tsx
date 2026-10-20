import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  Code, 
  History, 
  Settings, 
  Phone, 
  LayoutDashboard,
  CornerDownLeft,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'Tính năng chính' | 'Tài khoản & Dịch vụ' | 'Hệ thống';
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, items }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut Ctrl+K / Cmd+K handled at window level
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle arrow navigation and enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div 
        className="relative w-full max-w-xl rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800">
          <Search className="w-5 h-5 text-sky-400 shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tính năng, tra cứu điều luật, gói cước... (gõ để tìm)"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Không tìm thấy lệnh hoặc tính năng phù hợp với &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150',
                    isSelected 
                      ? 'bg-sky-500/15 border border-sky-500/30 text-white' 
                      : 'hover:bg-slate-800/60 text-slate-300'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'p-2 rounded-lg shrink-0 transition-colors',
                      isSelected ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800/80 text-slate-400'
                    )}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-normal">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-sky-400 shrink-0 ml-2">
                      <span>Chọn</span>
                      <CornerDownLeft className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">↑↓</kbd> Di chuyển
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">Enter</kbd> Chọn
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">ESC</kbd> Đóng
            </span>
          </div>
          <span className="text-slate-400 hidden sm:inline">Phím tắt nhanh: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-sky-400 font-mono">Ctrl + K</kbd></span>
        </div>
      </div>
    </div>
  );
};
