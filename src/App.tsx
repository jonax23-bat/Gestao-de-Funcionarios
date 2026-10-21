import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Trash2,
  Edit2,
  Eye,
  User,
  CreditCard,
  Briefcase,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import { Funcionario, CreateFuncionarioDTO, UpdateFuncionarioDTO } from './types/funcionario.ts';
import { Header } from './components/Header.tsx';
import { StatsCards } from './components/StatsCards.tsx';
import { FuncionarioModal } from './components/FuncionarioModal.tsx';
import { FuncionarioDetailsModal } from './components/FuncionarioDetailsModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { DockerViewer } from './components/DockerViewer.tsx';
import { ApiTester } from './components/ApiTester.tsx';
import { Toast, ToastMessage } from './components/Toast.tsx';
import { formatCPF } from './utils/cpf.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'crud' | 'docker' | 'api'>('crud');

  // Funcionários data state
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [sortField, setSortField] = useState<'id' | 'nome' | 'data'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Funcionario | null>(null);
  const [deletingFuncionario, setDeletingFuncionario] = useState<Funcionario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Database info
  const [dbStatus, setDbStatus] = useState({
    connected: true,
    engine: 'PostgreSQL 16 (Docker Ready)',
  });

  // Toast feedback
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ id: Math.random().toString(), type, message });
  };

  // Fetch all funcionarios from backend REST API
  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/funcionarios');
      if (!res.ok) throw new Error('Falha ao obter lista de funcionários.');
      const data = await res.json();
      setFuncionarios(data);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Check health and db engine info
  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (data.database) {
          setDbStatus({
            connected: data.database.connected,
            engine: data.database.engine,
          });
        }
      }
    } catch (err) {
      console.warn('Health check warning:', err);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
    fetchHealth();
  }, []);

  // Filter and sort employees
  const filteredFuncionarios = useMemo(() => {
    return funcionarios
      .filter((f) => {
        const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
        if (!matchesStatus) return false;

        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase().trim();
        const nomeMatch = f.nome.toLowerCase().includes(term);
        const cpfMatch = f.cpf.replace(/\D/g, '').includes(term.replace(/\D/g, '')) || f.cpf.includes(term);
        const cargoMatch = f.cargo?.toLowerCase().includes(term);
        const deptMatch = f.departamento?.toLowerCase().includes(term);

        return nomeMatch || cpfMatch || cargoMatch || deptMatch;
      })
      .sort((a, b) => {
        if (sortField === 'id') {
          return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
        }
        if (sortField === 'nome') {
          return sortOrder === 'asc' ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome);
        }
        if (sortField === 'data') {
          const d1 = a.data_admissao || '';
          const d2 = b.data_admissao || '';
          return sortOrder === 'asc' ? d1.localeCompare(d2) : d2.localeCompare(d1);
        }
        return 0;
      });
  }, [funcionarios, searchTerm, statusFilter, sortField, sortOrder]);

  // Create or Update handler
  const handleSaveFuncionario = async (data: CreateFuncionarioDTO | UpdateFuncionarioDTO) => {
    if (editingFuncionario) {
      // Update
      const res = await fetch(`/api/funcionarios/${editingFuncionario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Falha ao atualizar dados.');
      }

      const updated = await res.json();
      setFuncionarios((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      showToast('success', `Funcionário ${updated.nome} atualizado com sucesso!`);
    } else {
      // Create
      const res = await fetch('/api/funcionarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Falha ao cadastrar funcionário.');
      }

      const created = await res.json();
      setFuncionarios((prev) => [created, ...prev]);
      showToast('success', `Funcionário ${created.nome} cadastrado com sucesso no banco!`);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deletingFuncionario) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/funcionarios/${deletingFuncionario.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Erro ao excluir.');
      }

      setFuncionarios((prev) => prev.filter((f) => f.id !== deletingFuncionario.id));
      showToast('success', `Funcionário ${deletingFuncionario.nome} removido do PostgreSQL.`);
      setDeletingFuncionario(null);
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao excluir funcionário.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset seed
  const handleResetSeed = async () => {
    try {
      setIsResetting(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao restaurar banco.');
      await fetchFuncionarios();
      showToast('success', 'Base de dados restaurada com a massa de dados inicial!');
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao resetar.');
    } finally {
      setIsResetting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (funcionarios.length === 0) {
      showToast('error', 'Nenhum funcionário para exportar.');
      return;
    }

    const headers = ['ID', 'Nome', 'CPF', 'Cargo', 'Departamento', 'Email', 'Status', 'Data Admissao'];
    const rows = filteredFuncionarios.map((f) => [
      f.id,
      `"${f.nome}"`,
      `"${f.cpf}"`,
      `"${f.cargo || ''}"`,
      `"${f.departamento || ''}"`,
      `"${f.email || ''}"`,
      f.status,
      f.data_admissao || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `funcionarios_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Relatório CSV exportado com sucesso!');
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Background Glass Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/15 rounded-full blur-[128px]" />
        {/* Subtle grid pattern for glass depth */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => {
          setEditingFuncionario(null);
          setIsCreateModalOpen(true);
        }}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
        dbEngine={dbStatus.engine}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: CRUD Funcionários */}
        {activeTab === 'crud' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* High-level Statistics */}
            <StatsCards
              funcionarios={funcionarios}
              dbConnected={dbStatus.connected}
              dbEngine={dbStatus.engine}
            />

            {/* Filter and Search Bar Panel */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 min-w-[280px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar funcionário por nome, CPF ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Status Filter Segmented Control (Buttons) */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      statusFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos ({funcionarios.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ativo')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      statusFilter === 'ativo'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ativos ({funcionarios.filter((f) => f.status === 'ativo').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('inativo')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      statusFilter === 'inativo'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Inativos ({funcionarios.filter((f) => f.status === 'inativo').length})
                  </button>
                </div>

                {/* Export CSV action */}
                <button
                  onClick={handleExportCSV}
                  title="Exportar registros filtrados para arquivo CSV"
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* Funcionários Data Table Panel */}
            <div className="glass-panel rounded-3xl border border-white/15 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-tight">Quadro de Funcionários</h2>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    ({filteredFuncionarios.length} de {funcionarios.length})
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>Ordenação por ID decrescente</span>
                </div>
              </div>

              {/* Table Content */}
              {loading ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Consultando PostgreSQL...</p>
                </div>
              ) : filteredFuncionarios.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Nenhum funcionário encontrado</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchTerm
                        ? `Nenhum registro corresponde ao filtro "${searchTerm}". Tente outro termo.`
                        : 'Comece adicionando seu primeiro colaborador ao banco de dados PostgreSQL.'}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setEditingFuncionario(null);
                        setIsCreateModalOpen(true);
                      }}
                      className="glass-button-primary px-4 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 border border-white/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Primeiro Funcionário</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-900/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">ID</th>
                        <th className="py-3.5 px-6">Nome Completo</th>
                        <th className="py-3.5 px-6 font-mono">CPF (Receita Federal)</th>
                        <th className="py-3.5 px-6">Cargo & Departamento</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6">Admissão</th>
                        <th className="py-3.5 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredFuncionarios.map((func) => (
                        <tr
                          key={func.id}
                          className="hover:bg-white/[0.03] transition-colors group"
                        >
                          {/* ID */}
                          <td className="py-3 px-6 font-mono font-medium text-slate-400 tabular-nums">
                            #{func.id.toString().padStart(3, '0')}
                          </td>

                          {/* Nome */}
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30 shrink-0">
                                {func.nome
                                  .split(' ')
                                  .slice(0, 2)
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                  {func.nome}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                                  {func.email || 'E-mail não informado'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* CPF */}
                          <td className="py-3 px-6 font-mono font-medium text-slate-200 tracking-wider tabular-nums">
                            {formatCPF(func.cpf)}
                          </td>

                          {/* Cargo & Dept */}
                          <td className="py-3 px-6">
                            <div className="text-slate-200 font-medium">{func.cargo || 'Geral'}</div>
                            <div className="text-[11px] text-slate-400">
                              {func.departamento || 'Não atribuído'}
                            </div>
                          </td>

                          {/* Status (Unboxed text with subtle typographic color) */}
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-medium ${
                                  func.status === 'ativo' ? 'text-emerald-400' : 'text-amber-400'
                                }`}
                              >
                                {func.status === 'ativo' ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </td>

                          {/* Data Admissão */}
                          <td className="py-3 px-6 text-slate-400 tabular-nums">
                            {func.data_admissao
                              ? new Date(func.data_admissao).toLocaleDateString('pt-BR')
                              : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedDetails(func)}
                                title="Ver Detalhes do Funcionário"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingFuncionario(func);
                                  setIsCreateModalOpen(true);
                                }}
                                title="Editar Cadastro"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingFuncionario(func)}
                                title="Excluir do Banco de Dados"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Docker & Arquitetura */}
        {activeTab === 'docker' && <DockerViewer />}

        {/* Tab 3: API REST Explorer */}
        {activeTab === 'api' && <ApiTester />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-auto bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span>Gestão de Funcionários CRUD · PostgreSQL 16 · Docker Compose</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('docker')}
              className="hover:text-white transition-colors"
            >
              Arquitetura dos Containers
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('api')}
              className="hover:text-white transition-colors"
            >
              Documentação da API
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <FuncionarioModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingFuncionario(null);
        }}
        onSubmit={handleSaveFuncionario}
        funcionarioToEdit={editingFuncionario}
      />

      <FuncionarioDetailsModal
        isOpen={Boolean(selectedDetails)}
        onClose={() => setSelectedDetails(null)}
        funcionario={selectedDetails}
        onEdit={(f) => {
          setEditingFuncionario(f);
          setIsCreateModalOpen(true);
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingFuncionario)}
        onClose={() => setDeletingFuncionario(null)}
        onConfirm={handleDeleteConfirm}
        funcionario={deletingFuncionario}
        isDeleting={isDeleting}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
