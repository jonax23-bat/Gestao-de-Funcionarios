import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Funcionario } from '../types/funcionario.ts';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  funcionario: Funcionario | null;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  funcionario,
  isDeleting,
}) => {
  if (!isOpen || !funcionario) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-md rounded-3xl p-6 relative border border-rose-500/30 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Confirmar Exclusão</h3>
              <p className="text-xs text-slate-400">Esta ação removerá o registro do PostgreSQL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-xs text-slate-300">
            Você está prestes a excluir permanentemente o funcionário:
          </p>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
            <div className="text-sm font-bold text-white">{funcionario.nome}</div>
            <div className="text-xs text-slate-400 font-mono">CPF: {funcionario.cpf}</div>
            {funcionario.cargo && (
              <div className="text-xs text-slate-400">
                {funcionario.cargo} {funcionario.departamento ? `· ${funcionario.departamento}` : ''}
              </div>
            )}
          </div>

          <p className="text-[11px] text-rose-400">
            Atenção: A chave primária e o histórico do funcionário serão removidos do banco relacional.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-2 border border-rose-500/40 shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Funcionário</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
