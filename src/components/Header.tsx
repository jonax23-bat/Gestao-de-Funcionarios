import React from 'react';
import { Users, Server, Database, Plus, RefreshCw, Terminal } from 'lucide-react';

interface HeaderProps {
  activeTab: 'crud' | 'docker' | 'api';
  setActiveTab: (tab: 'crud' | 'docker' | 'api') => void;
  onOpenCreateModal: () => void;
  onResetSeed: () => void;
  isResetting: boolean;
  dbEngine: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  onResetSeed,
  isResetting,
  dbEngine,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                RH.Stack
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                CRUD + Postgres
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span>{dbEngine}</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('crud')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'crud'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Funcionários
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'docker'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Docker & Containers
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'api'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            API REST Explorer
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onResetSeed}
            disabled={isResetting}
            title="Restaurar dados iniciais de exemplo"
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Resetar Base</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="glass-button-primary px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap border border-white/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Funcionário</span>
          </button>
        </div>
      </div>
    </header>
  );
};
