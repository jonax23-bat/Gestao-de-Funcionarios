import React, { useState, useEffect } from 'react';
import { Server, Database, Layers, Copy, Check, Terminal, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

interface DockerFiles {
  dockerCompose: string;
  initSql: string;
  backendDockerfile: string;
  frontendDockerfile: string;
  backendServer: string;
  readme: string;
}

export const DockerViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<
    'dockerCompose' | 'initSql' | 'backendDockerfile' | 'frontendDockerfile' | 'backendServer' | 'readme'
  >('dockerCompose');

  const [files, setFiles] = useState<DockerFiles>({
    dockerCompose: '',
    initSql: '',
    backendDockerfile: '',
    frontendDockerfile: '',
    backendServer: '',
    readme: '',
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/docker-files')
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load docker files:', err);
        setLoading(false);
      });
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fileMap = {
    dockerCompose: { name: 'docker-compose.yml', label: 'Docker Compose', desc: 'Orquestrador dos 3 containers' },
    initSql: { name: 'init.sql', label: 'PostgreSQL Init SQL', desc: 'Tabela funcionarios e índices' },
    backendDockerfile: { name: 'backend/Dockerfile', label: 'Backend Dockerfile', desc: 'Container Node.js 20 Alpine' },
    frontendDockerfile: { name: 'frontend/Dockerfile', label: 'Frontend Dockerfile', desc: 'Multi-stage build com Nginx' },
    backendServer: { name: 'backend/server.js', label: 'Backend Server JS', desc: 'API REST Express + pg pool' },
    readme: { name: 'README.md', label: 'Instruções de Execução', desc: 'Guia passo a passo de deploy' },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-3">
            <Server className="w-3.5 h-3.5" />
            <span>Microsserviços Containerizados</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
            Orquestração com Docker Compose & PostgreSQL
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Arquitetura isolada em 3 serviços independentes: frontend em Nginx, backend em Node.js com API REST e banco de dados relacional PostgreSQL 16 com volume persistente e verificação de integridade (<code className="text-indigo-400 font-mono text-xs">healthcheck</code>).
          </p>
        </div>
      </div>

      {/* Troubleshooting Banner for Docker Desktop DNS */}
      <div className="glass-card rounded-3xl p-6 border border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-amber-400">Solução para o erro:</span>
              <code className="text-xs font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                dial tcp: lookup registry-1.docker.io: no such host
              </code>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esse erro ocorre no Windows quando o <strong>Docker Desktop / WSL2</strong> perde a conexão DNS com a internet para baixar as imagens do Docker Hub.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="font-semibold text-white">1. Adicionar DNS no Docker</div>
                <div className="text-slate-400 text-[11px]">
                  No Docker Desktop &gt; Settings ⚙️ &gt; Docker Engine, insira <code className="text-indigo-300">"dns": ["8.8.8.8", "1.1.1.1"]</code> e clique em <em>Apply & restart</em>.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="font-semibold text-white">2. Reiniciar WSL2</div>
                <div className="text-slate-400 text-[11px]">
                  No PowerShell execute <code className="text-indigo-300">wsl --shutdown</code> e reabra o Docker Desktop.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="font-semibold text-white">3. Rodar direto sem Docker</div>
                <div className="text-slate-400 text-[11px]">
                  Rode <code className="text-emerald-400">npm install</code> e <code className="text-emerald-400">npm run dev</code> para testar imediatamente na porta 3000!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Containers Diagram */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
        <h3 className="text-base font-bold text-white tracking-tight mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Diagrama dos Containers & Rede Docker</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Container 1: Frontend */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-indigo-500/30 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Container 1
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Porta 8080:80</span>
            </div>
            <div className="text-base font-bold text-white mb-1">frontend_funcionarios</div>
            <p className="text-xs text-slate-400 mb-4">
              Vite + React + Tailwind com Nginx Alpine servindo assets estáticos e proxy reverso para <code className="text-indigo-300">/api/</code>.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-3 border-t border-white/10">
              <div>Rede: app_network</div>
              <div>Depends on: backend</div>
            </div>
          </div>

          {/* Container 2: Backend */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-purple-500/30 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Container 2
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Porta 5000:5000</span>
            </div>
            <div className="text-base font-bold text-white mb-1">backend_funcionarios</div>
            <p className="text-xs text-slate-400 mb-4">
              API REST Node.js 20 Express com validação oficial de CPF e pool de conexões PostgreSQL.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-3 border-t border-white/10">
              <div>Rede: app_network</div>
              <div>Depends on: db (healthy)</div>
            </div>
          </div>

          {/* Container 3: PostgreSQL Database */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/30 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Container 3
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Porta 5432:5432</span>
            </div>
            <div className="text-base font-bold text-white mb-1">postgres_funcionarios</div>
            <p className="text-xs text-slate-400 mb-4">
              PostgreSQL 16 Alpine com schema inicial <code className="text-cyan-300">init.sql</code> e volume persistente <code className="text-cyan-300">postgres_data</code>.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-3 border-t border-white/10">
              <div>Banco: empresa_db</div>
              <div>Healthcheck: pg_isready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Code Viewer with Tabs */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <span>Arquivos de Configuração do Projeto</span>
            </h3>
            <p className="text-xs text-slate-400">
              Inspecione e copie os arquivos prontos para executar em sua máquina local
            </p>
          </div>

          <button
            onClick={() => handleCopy(files[selectedFile], selectedFile)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-2 self-start sm:self-auto border border-indigo-400/30 shadow-md shadow-indigo-600/30"
          >
            {copiedKey === selectedFile ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copiado para Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar {fileMap[selectedFile].name}</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
          {(Object.keys(fileMap) as Array<keyof typeof fileMap>).map((key) => {
            const item = fileMap[key];
            const isActive = selectedFile === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedFile(key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-white/15 hover:text-white'
                }`}
              >
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Code Block Container */}
        <div className="relative rounded-2xl bg-slate-950/80 border border-white/10 p-5 font-mono text-xs overflow-x-auto max-h-[500px]">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Carregando código...</div>
          ) : (
            <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
              {files[selectedFile] || '// Arquivo pronto para execução'}
            </pre>
          )}
        </div>
      </div>

      {/* Terminal Cheat Sheet */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
        <h3 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>Comandos Rápidos no Terminal</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
            <div className="text-slate-400 font-sans text-xs font-medium">1. Subir todos os containers:</div>
            <div className="text-emerald-400 flex items-center justify-between">
              <span>docker compose up --build -d</span>
              <button
                onClick={() => handleCopy('docker compose up --build -d', 'cmd1')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
            <div className="text-slate-400 font-sans text-xs font-medium">2. Ver status de saúde dos serviços:</div>
            <div className="text-emerald-400 flex items-center justify-between">
              <span>docker compose ps</span>
              <button
                onClick={() => handleCopy('docker compose ps', 'cmd2')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'cmd2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
            <div className="text-slate-400 font-sans text-xs font-medium">3. Acompanhar logs em tempo real:</div>
            <div className="text-emerald-400 flex items-center justify-between">
              <span>docker compose logs -f</span>
              <button
                onClick={() => handleCopy('docker compose logs -f', 'cmd3')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'cmd3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
            <div className="text-slate-400 font-sans text-xs font-medium">4. Acessar o terminal PostgreSQL psql:</div>
            <div className="text-emerald-400 flex items-center justify-between">
              <span>docker exec -it postgres_funcionarios psql -U postgres -d empresa_db</span>
              <button
                onClick={() => handleCopy('docker exec -it postgres_funcionarios psql -U postgres -d empresa_db', 'cmd4')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'cmd4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
