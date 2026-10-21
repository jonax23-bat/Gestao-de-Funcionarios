import React from 'react';
import { Users, UserCheck, UserX, Database } from 'lucide-react';
import { Funcionario } from '../types/funcionario.ts';

interface StatsCardsProps {
  funcionarios: Funcionario[];
  dbConnected: boolean;
  dbEngine: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  funcionarios,
  dbConnected,
  dbEngine,
}) => {
  const total = funcionarios.length;
  const ativos = funcionarios.filter((f) => f.status === 'ativo').length;
  const inativos = funcionarios.filter((f) => f.status === 'inativo').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400">Total de Funcionários</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight font-mono tabular-nums">
          {total.toString().padStart(2, '0')}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span>Registrados no banco</span>
          <span aria-hidden="true">·</span>
          <span>Atualizado em tempo real</span>
        </div>
      </div>

      {/* Ativos Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400">Funcionários Ativos</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight font-mono tabular-nums">
          {ativos.toString().padStart(2, '0')}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="text-emerald-400 font-medium">
            {total > 0 ? Math.round((ativos / total) * 100) : 0}% da equipe
          </span>
          <span aria-hidden="true">·</span>
          <span>Atuação regular</span>
        </div>
      </div>

      {/* Inativos Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-amber-500/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400">Desligados / Inativos</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <UserX className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight font-mono tabular-nums">
          {inativos.toString().padStart(2, '0')}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span>Histórico arquivado</span>
          <span aria-hidden="true">·</span>
          <span>CPF retido para conformidade</span>
        </div>
      </div>

      {/* Database Status Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400">Banco de Dados</span>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-white tracking-tight truncate">
          {dbConnected ? 'PostgreSQL 16' : 'PostgreSQL Driver'}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 truncate">
          <span className="text-cyan-400 font-medium">Orquestração Docker</span>
          <span aria-hidden="true">·</span>
          <span>Porta 5432</span>
        </div>
      </div>
    </div>
  );
};
