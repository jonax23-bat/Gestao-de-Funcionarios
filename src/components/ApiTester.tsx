import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, AlertCircle, Copy, Check, Play } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  defaultBody?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/health',
    description: 'Verifica saúde da API REST e conexão com PostgreSQL',
  },
  {
    method: 'GET',
    path: '/api/funcionarios',
    description: 'Lista todos os funcionários cadastrados',
  },
  {
    method: 'GET',
    path: '/api/funcionarios?status=ativo',
    description: 'Filtra funcionários ativos no banco',
  },
  {
    method: 'POST',
    path: '/api/funcionarios',
    description: 'Cadastra novo funcionário com validação de CPF',
    defaultBody: JSON.stringify(
      {
        nome: 'Gabriel Mendes Duarte',
        cpf: '829.417.630-58',
        cargo: 'Engenheiro de Dados',
        departamento: 'Tecnologia',
        email: 'gabriel.duarte@empresa.com.br',
        status: 'ativo',
        data_admissao: '2024-02-01',
      },
      null,
      2
    ),
  },
];

export const ApiTester: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState<string>(ENDPOINTS[0].defaultBody || '');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectEndpoint = (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.defaultBody || '');
    setResponseStatus(null);
    setResponseData(null);
    setResponseTime(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const end = performance.now();
      setResponseTime(Math.round(end - start));
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseData(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Erro ao conectar à API' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">API REST Node.js Explorer</h2>
            <p className="text-xs text-slate-400">
              Teste os endpoints da API REST diretamente pelo navegador com retorno JSON e tempo de resposta
            </p>
          </div>
        </div>

        {/* Endpoints List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-6">
          {ENDPOINTS.map((ep, idx) => {
            const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
            return (
              <button
                key={idx}
                onClick={() => handleSelectEndpoint(ep)}
                className={`p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between ${
                  isSelected
                    ? 'bg-purple-500/20 text-white border-purple-500/50 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900/50 text-slate-300 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono font-medium text-white">{ep.path}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{ep.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Request Execution Panel */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-mono text-sm">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  selectedEndpoint.method === 'GET'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <span className="text-slate-200">{selectedEndpoint.path}</span>
            </div>

            <button
              onClick={handleExecute}
              disabled={loading}
              className="glass-button-primary px-5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 border border-white/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executando...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Enviar Requisição</span>
                </>
              )}
            </button>
          </div>

          {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Payload JSON (Corpo da Requisição):
              </label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={7}
                className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Live Response Panel */}
        {responseStatus !== null && (
          <div className="mt-6 p-5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Resposta da API:</span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  Status {responseStatus}
                </span>
                {responseTime !== null && (
                  <span className="text-xs text-slate-400 font-mono tabular-nums">{responseTime} ms</span>
                )}
              </div>

              {responseData && (
                <button
                  onClick={handleCopyResponse}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              )}
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 border border-white/5 font-mono text-xs text-emerald-300 overflow-x-auto max-h-80 whitespace-pre">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
