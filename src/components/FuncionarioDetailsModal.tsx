import React, { useState } from 'react';
import { X, Copy, Check, User, CreditCard, Briefcase, Building2, Mail, Calendar, ShieldCheck } from 'lucide-react';
import { Funcionario } from '../types/funcionario.ts';
import { formatCPF } from '../utils/cpf.ts';

interface FuncionarioDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  funcionario: Funcionario | null;
  onEdit: (funcionario: Funcionario) => void;
}

export const FuncionarioDetailsModal: React.FC<FuncionarioDetailsModalProps> = ({
  isOpen,
  onClose,
  funcionario,
  onEdit,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !funcionario) return null;

  const handleCopyCPF = () => {
    navigator.clipboard.writeText(funcionario.cpf);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 relative border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30 border border-white/20">
              {funcionario.nome
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{funcionario.nome}</h3>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Registro #{funcionario.id}</span>
                <span aria-hidden="true">·</span>
                <span className={funcionario.status === 'ativo' ? 'text-emerald-400' : 'text-amber-400'}>
                  {funcionario.status === 'ativo' ? 'Ativo na Empresa' : 'Inativo / Desligado'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="space-y-4 mb-6">
          {/* CPF Block with copy button */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">CPF (Validado pela Receita Federal)</div>
                <div className="text-base font-bold font-mono text-white tracking-wider tabular-nums">
                  {formatCPF(funcionario.cpf)}
                </div>
              </div>
            </div>
            <button
              onClick={handleCopyCPF}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs"
              title="Copiar CPF"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Details list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/10">
              <div className="text-slate-400 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cargo / Função</span>
              </div>
              <div className="text-white font-medium">{funcionario.cargo || 'Não informado'}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/10">
              <div className="text-slate-400 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Departamento</span>
              </div>
              <div className="text-white font-medium">{funcionario.departamento || 'Geral'}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/10">
              <div className="text-slate-400 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>E-mail Corporativo</span>
              </div>
              <div className="text-white font-medium truncate">{funcionario.email || 'Não informado'}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/10">
              <div className="text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Data de Admissão</span>
              </div>
              <div className="text-white font-medium">
                {funcionario.data_admissao
                  ? new Date(funcionario.data_admissao).toLocaleDateString('pt-BR')
                  : 'Não informada'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Chave única indexada em PostgreSQL com integridade referencial.</span>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(funcionario);
            }}
            className="glass-button-primary px-4 py-2 rounded-xl text-xs font-semibold text-white border border-white/20"
          >
            Editar Cadastro
          </button>
        </div>
      </div>
    </div>
  );
};
