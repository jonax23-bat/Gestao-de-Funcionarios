import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { dbService } from './src/server/db.ts';
import { validateCPF, formatCPF, cleanCPF } from './src/utils/cpf.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Initialize database service (Postgres or local resilient fallback)
  await dbService.init();

  // API Routes
  // 1. Health & Database Status
  app.get('/api/health', (req: Request, res: Response) => {
    const status = dbService.getStatus();
    res.json({
      status: 'ok',
      service: 'Node.js REST API - Gestão de Funcionários',
      database: status,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. GET /api/funcionarios - List all with optional search & status filter
  app.get('/api/funcionarios', async (req: Request, res: Response) => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const data = await dbService.listFuncionarios(search, status);
      res.json(data);
    } catch (err: any) {
      console.error('Error listing funcionarios:', err);
      res.status(500).json({ error: 'Erro interno ao listar funcionários.' });
    }
  });

  // 3. GET /api/funcionarios/:id - Get by ID
  app.get('/api/funcionarios/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      const item = await dbService.getFuncionarioById(id);
      if (!item) {
        return res.status(404).json({ error: 'Funcionário não encontrado.' });
      }
      res.json(item);
    } catch (err: any) {
      console.error('Error fetching funcionario by ID:', err);
      res.status(500).json({ error: 'Erro ao buscar funcionário.' });
    }
  });

  // 4. POST /api/funcionarios - Create new funcionario
  app.post('/api/funcionarios', async (req: Request, res: Response) => {
    try {
      const { nome, cpf, cargo, departamento, email, status, data_admissao } = req.body;

      if (!nome || typeof nome !== 'string' || nome.trim().length < 3) {
        return res.status(400).json({ error: 'Nome é obrigatório e deve ter no mínimo 3 caracteres.' });
      }

      const cpfCheck = validateCPF(cpf);
      if (!cpfCheck.valid) {
        return res.status(400).json({ error: cpfCheck.reason });
      }

      const existing = await dbService.getFuncionarioByCpf(cpf);
      if (existing) {
        return res.status(409).json({ error: 'Já existe um funcionário cadastrado com este CPF.' });
      }

      const created = await dbService.createFuncionario({
        nome,
        cpf,
        cargo,
        departamento,
        email,
        status: status === 'inativo' ? 'inativo' : 'ativo',
        data_admissao,
      });

      res.status(201).json(created);
    } catch (err: any) {
      console.error('Error creating funcionario:', err);
      res.status(500).json({ error: 'Erro interno ao cadastrar funcionário.' });
    }
  });

  // 5. PUT /api/funcionarios/:id - Update existing funcionario
  app.put('/api/funcionarios/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const { nome, cpf, cargo, departamento, email, status, data_admissao } = req.body;

      if (nome !== undefined && (typeof nome !== 'string' || nome.trim().length < 3)) {
        return res.status(400).json({ error: 'Nome deve ter no mínimo 3 caracteres.' });
      }

      if (cpf !== undefined) {
        const cpfCheck = validateCPF(cpf);
        if (!cpfCheck.valid) {
          return res.status(400).json({ error: cpfCheck.reason });
        }

        const duplicate = await dbService.getFuncionarioByCpf(cpf, id);
        if (duplicate) {
          return res.status(409).json({ error: 'Outro funcionário já possui este CPF cadastrado.' });
        }
      }

      const updated = await dbService.updateFuncionario(id, {
        nome,
        cpf,
        cargo,
        departamento,
        email,
        status,
        data_admissao,
      });

      if (!updated) {
        return res.status(404).json({ error: 'Funcionário não encontrado para atualização.' });
      }

      res.json(updated);
    } catch (err: any) {
      console.error('Error updating funcionario:', err);
      res.status(500).json({ error: 'Erro ao atualizar funcionário.' });
    }
  });

  // 6. DELETE /api/funcionarios/:id - Remove funcionario
  app.delete('/api/funcionarios/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const success = await dbService.deleteFuncionario(id);
      if (!success) {
        return res.status(404).json({ error: 'Funcionário não encontrado para exclusão.' });
      }

      res.json({ message: 'Funcionário excluído com sucesso.', id });
    } catch (err: any) {
      console.error('Error deleting funcionario:', err);
      res.status(500).json({ error: 'Erro ao excluir funcionário.' });
    }
  });

  // 7. POST /api/seed - Reset to default seed
  app.post('/api/seed', async (req: Request, res: Response) => {
    try {
      await dbService.resetSeed();
      const list = await dbService.listFuncionarios();
      res.json({ message: 'Base de dados resetada com sucesso.', count: list.length });
    } catch (err: any) {
      console.error('Error resetting seed:', err);
      res.status(500).json({ error: 'Erro ao resetar banco de dados.' });
    }
  });

  // 8. GET /api/docker-files - Read Docker files for UI inspector
  app.get('/api/docker-files', (req: Request, res: Response) => {
    try {
      const readFileSafe = (relPath: string) => {
        const full = path.resolve(process.cwd(), relPath);
        return fs.existsSync(full) ? fs.readFileSync(full, 'utf-8') : '';
      };

      res.json({
        dockerCompose: readFileSafe('docker-compose.yml'),
        initSql: readFileSafe('init.sql'),
        backendDockerfile: readFileSafe('Dockerfile.backend') || readFileSafe('backend/Dockerfile'),
        frontendDockerfile: readFileSafe('Dockerfile.frontend') || readFileSafe('frontend/Dockerfile'),
        backendServer: readFileSafe('backend/server.js'),
        readme: readFileSafe('README.md'),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao carregar arquivos Docker.' });
    }
  });

  // Frontend Serving / Vite Middleware Integration
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FullStack] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
