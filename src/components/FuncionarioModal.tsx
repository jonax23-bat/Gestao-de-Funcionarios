import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles, User, CreditCard, Briefcase, Building2, Mail, Calendar } from 'lucide-react';
import { Funcionario, CreateFuncionarioDTO, UpdateFuncionarioDTO } from '../types/funcionario.ts';
import { formatCPF, cleanCPF, validateCPF, generateValidCPF } from '../utils/cpf.ts';

interface FuncionarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFuncionarioDTO | UpdateFuncionarioDTO) => Promise<void>;
  funcionarioToEdit?: Funcionario | null;
}

export const FuncionarioModal: React.FC<FuncionarioModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  funcionarioToEdit,
}) => {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [dataAdmissao, setDataAdmissao] = useState('');

  const [cpfValidation, setCpfValidation] = useState<{ valid: boolean; reason?: string }>({ valid: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync form state when modal opens or edit target changes
  useEffect(() => {
    if (funcionarioToEdit) {
      setNome(funcionarioToEdit.nome || '');
      const formatted = formatCPF(funcionarioToEdit.cpf || '');
      setCpf(formatted);
      setCargo(funcionarioToEdit.cargo || '');
      setDepartamento(funcionarioToEdit.departamento || '');
      setEmail(funcionarioToEdit.email || '');
      setStatus(funcionarioToEdit.status || 'ativo');
      setDataAdmissao(funcionarioToEdit.data_admissao || '');
      setCpfValidation(validateCPF(formatted));
    } else {
      setNome('');
      setCpf('');
      setCargo('');
      setDepartamento('');
      setEmail('');
      setStatus('ativo');
      setDataAdmissao(new Date().toISOString().split('T')[0]);
      setCpfValidation({ valid: false });
    }
    setErrorMessage(null);
  }, [funcionarioToEdit, isOpen]);

  // Handle CPF typing with automatic mask formatting and real-time validation
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCPF(raw);
    setCpf(formatted);

    if (cleanCPF(formatted).length === 11) {
      setCpfValidation(validateCPF(formatted));
    } else {
      setCpfValidation({ valid: false, reason: 'Digite os 11 dígitos do CPF' });
    }
  };

  // Quick generator for testing
  const handleGenerateCPF = () => {
    const sample = generateValidCPF();
    setCpf(sample);
    setCpfValidation(validateCPF(sample));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nome.trim() || nome.trim().length < 3) {
      setErrorMessage('Por favor, informe o nome completo do funcionário (mínimo 3 caracteres).');
      return;
    }

    const check = validateCPF(cpf);
    if (!check.valid) {
      setErrorMessage(check.reason || 'O CPF informado não é válido segundo a Receita Federal.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        nome: nome.trim(),
        cpf: formatCPF(cpf),
        cargo: cargo.trim() || undefined,
        departamento: departamento.trim() || undefined,
        email: email.trim() || undefined,
        status,
        data_admissao: dataAdmissao || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar dados do funcionário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 relative border border-white/20 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {funcionarioToEdit ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <p className="text-xs text-slate-400">
                {funcionarioToEdit
                  ? `Atualize as informações do registro ID #${funcionarioToEdit.id}`
                  : 'Preencha os dados cadastrais com validação em tempo real'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nome Completo *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mariana de Souza Santos"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* CPF with validation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>CPF (Obrigatório) *</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateCPF}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Gerar CPF Válido</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                maxLength={14}
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border text-sm font-mono tracking-wider text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  cleanCPF(cpf).length === 11
                    ? cpfValidation.valid
                      ? 'border-emerald-500/60 focus:ring-1 focus:ring-emerald-500'
                      : 'border-rose-500/60 focus:ring-1 focus:ring-rose-500'
                    : 'border-white/15 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />

              {cleanCPF(cpf).length === 11 && (
                <div className="absolute right-3 top-2.5 flex items-center">
                  {cpfValidation.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  )}
                </div>
              )}
            </div>

            {/* Validation helper text */}
            <div className="mt-1 flex items-center justify-between text-[11px]">
              {cleanCPF(cpf).length === 11 ? (
                cpfValidation.valid ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Dígitos verificadores válidos (Receita Federal)
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {cpfValidation.reason || 'CPF matematicamente inválido'}
                  </span>
                )
              ) : (
                <span className="text-slate-500">Formato esperado: 11 dígitos numéricos</span>
              )}
              <span className="font-mono text-slate-500 tabular-nums">
                {cleanCPF(cpf).length}/11
              </span>
            </div>
          </div>

          {/* Grid: Cargo & Departamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cargo / Função</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Desenvolvedor Fullstack"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Departamento</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Tecnologia"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Grid: Email & Data Admissao */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>E-mail Corporativo</span>
              </label>
              <input
                type="email"
                placeholder="funcionario@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Data de Admissão</span>
              </label>
              <input
                type="date"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Cadastral</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('ativo')}
                className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                  status === 'ativo'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900/40 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                Ativo na Empresa
              </button>
              <button
                type="button"
                onClick={() => setStatus('inativo')}
                className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                  status === 'inativo'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900/40 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                Inativo / Desligado
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="glass-button-primary px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 border border-white/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{funcionarioToEdit ? 'Salvar Alterações' : 'Cadastrar Funcionário'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
