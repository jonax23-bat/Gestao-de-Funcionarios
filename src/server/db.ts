import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { Funcionario, CreateFuncionarioDTO, UpdateFuncionarioDTO } from '../types/funcionario.ts';
import { cleanCPF, formatCPF } from '../utils/cpf.ts';

const { Pool } = pg;

// Default initial seed data for employees
const INITIAL_FUNCIONARIOS: Omit<Funcionario, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    nome: 'Mariana de Souza Santos',
    cpf: '382.491.508-20',
    cargo: 'Engenheira de Software Senior',
    departamento: 'Tecnologia',
    email: 'mariana.santos@empresa.com.br',
    status: 'ativo',
    data_admissao: '2022-03-15',
  },
  {
    nome: 'Carlos Eduardo Oliveira',
    cpf: '519.824.170-04',
    cargo: 'Analista de Infraestrutura & DevOps',
    departamento: 'Infraestrutura',
    email: 'carlos.oliveira@empresa.com.br',
    status: 'ativo',
    data_admissao: '2021-08-10',
  },
  {
    nome: 'Beatriz Almeida Lima',
    cpf: '741.059.328-91',
    cargo: 'Coordenadora de Recursos Humanos',
    departamento: 'Recursos Humanos',
    email: 'beatriz.lima@empresa.com.br',
    status: 'ativo',
    data_admissao: '2020-01-20',
  },
  {
    nome: 'Lucas Ribeiro Fernandes',
    cpf: '163.928.450-77',
    cargo: 'Product Designer (UI/UX)',
    departamento: 'Produto',
    email: 'lucas.fernandes@empresa.com.br',
    status: 'ativo',
    data_admissao: '2023-05-02',
  },
  {
    nome: 'Juliana Costa Mendes',
    cpf: '928.374.615-38',
    cargo: 'Analista Financeiro Pleno',
    departamento: 'Financeiro',
    email: 'juliana.mendes@empresa.com.br',
    status: 'inativo',
    data_admissao: '2021-11-18',
  },
];

class DatabaseService {
  private pool: pg.Pool | null = null;
  private isPostgresConnected: boolean = false;
  private localStore: Funcionario[] = [];
  private nextId: number = 1;
  private localDataDir: string;
  private localDataFile: string;

  constructor() {
    this.localDataDir = path.resolve(process.cwd(), '.data');
    this.localDataFile = path.join(this.localDataDir, 'funcionarios.json');
    this.initLocalStore();
  }

  private initLocalStore() {
    try {
      if (!fs.existsSync(this.localDataDir)) {
        fs.mkdirSync(this.localDataDir, { recursive: true });
      }

      if (fs.existsSync(this.localDataFile)) {
        const raw = fs.readFileSync(this.localDataFile, 'utf-8');
        this.localStore = JSON.parse(raw);
        const maxId = this.localStore.reduce((acc, curr) => Math.max(acc, curr.id), 0);
        this.nextId = maxId + 1;
      } else {
        this.seedLocalStore();
      }
    } catch {
      this.seedLocalStore();
    }
  }

  private seedLocalStore() {
    const now = new Date().toISOString();
    this.localStore = INITIAL_FUNCIONARIOS.map((item, idx) => ({
      ...item,
      id: idx + 1,
      cpf: formatCPF(item.cpf),
      created_at: now,
      updated_at: now,
    }));
    this.nextId = this.localStore.length + 1;
    this.persistLocalStore();
  }

  private persistLocalStore() {
    try {
      if (!fs.existsSync(this.localDataDir)) {
        fs.mkdirSync(this.localDataDir, { recursive: true });
      }
      fs.writeFileSync(this.localDataFile, JSON.stringify(this.localStore, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not persist local store file:', e);
    }
  }

  public async init(): Promise<void> {
    const connectionString =
      process.env.DATABASE_URL ||
      (process.env.PGHOST
        ? `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'empresa_db'}`
        : null);

    if (connectionString) {
      try {
        this.pool = new Pool({
          connectionString,
          connectionTimeoutMillis: 3000,
        });

        // Test connection with a fast probe query
        const client = await this.pool.connect();
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS funcionarios (
              id SERIAL PRIMARY KEY,
              nome VARCHAR(255) NOT NULL,
              cpf VARCHAR(14) NOT NULL UNIQUE,
              cargo VARCHAR(150),
              departamento VARCHAR(100),
              email VARCHAR(255),
              status VARCHAR(20) DEFAULT 'ativo',
              data_admissao DATE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `);

          // Check if empty, if so, seed
          const countRes = await client.query('SELECT COUNT(*) FROM funcionarios');
          if (parseInt(countRes.rows[0].count, 10) === 0) {
            for (const item of INITIAL_FUNCIONARIOS) {
              await client.query(
                `INSERT INTO funcionarios (nome, cpf, cargo, departamento, email, status, data_admissao)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  item.nome,
                  formatCPF(item.cpf),
                  item.cargo || null,
                  item.departamento || null,
                  item.email || null,
                  item.status,
                  item.data_admissao || null,
                ]
              );
            }
          }

          this.isPostgresConnected = true;
          console.log('[Database] Connected successfully to PostgreSQL instance.');
        } finally {
          client.release();
        }
      } catch (err) {
        console.warn('[Database] PostgreSQL connection failed or unavailable. Falling back to built-in local store:', (err as Error).message);
        this.isPostgresConnected = false;
        this.pool = null;
      }
    } else {
      console.log('[Database] No PostgreSQL connection string provided. Using persistent local store.');
    }
  }

  public getStatus() {
    return {
      connected: this.isPostgresConnected,
      engine: this.isPostgresConnected ? 'PostgreSQL 16 (Container / Host)' : 'Engine Local Emulado (PostgreSQL Ready)',
      recordsCount: this.isPostgresConnected ? null : this.localStore.length,
      tableName: 'funcionarios',
      schema: {
        id: 'SERIAL PRIMARY KEY',
        nome: 'VARCHAR(255) NOT NULL',
        cpf: 'VARCHAR(14) NOT NULL UNIQUE',
        cargo: 'VARCHAR(150)',
        departamento: 'VARCHAR(100)',
        email: 'VARCHAR(255)',
        status: 'VARCHAR(20) DEFAULT ativo',
        data_admissao: 'DATE',
        created_at: 'TIMESTAMP',
        updated_at: 'TIMESTAMP',
      },
    };
  }

  public async listFuncionarios(search?: string, status?: string): Promise<Funcionario[]> {
    if (this.isPostgresConnected && this.pool) {
      let query = 'SELECT * FROM funcionarios WHERE 1=1';
      const params: any[] = [];

      if (search && search.trim()) {
        const cleanDigits = cleanCPF(search);
        params.push(`%${search.trim()}%`);
        if (cleanDigits.length >= 3) {
          params.push(`%${cleanDigits}%`);
          query += ` AND (nome ILIKE $${params.length - 1} OR REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') ILIKE $${params.length})`;
        } else {
          query += ` AND (nome ILIKE $${params.length} OR cpf ILIKE $${params.length} OR cargo ILIKE $${params.length} OR departamento ILIKE $${params.length})`;
        }
      }

      if (status && (status === 'ativo' || status === 'inativo')) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      query += ' ORDER BY id DESC';
      const res = await this.pool.query(query, params);
      return res.rows.map((r) => ({
        ...r,
        data_admissao: r.data_admissao ? new Date(r.data_admissao).toISOString().split('T')[0] : undefined,
      }));
    }

    // Local Store execution
    let results = [...this.localStore];

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      const termDigits = cleanCPF(term);

      results = results.filter((f) => {
        const nameMatch = f.nome.toLowerCase().includes(term);
        const cpfMatch = f.cpf.includes(term) || (termDigits.length > 0 && cleanCPF(f.cpf).includes(termDigits));
        const cargoMatch = f.cargo?.toLowerCase().includes(term);
        const deptMatch = f.departamento?.toLowerCase().includes(term);
        return nameMatch || cpfMatch || cargoMatch || deptMatch;
      });
    }

    if (status && (status === 'ativo' || status === 'inativo')) {
      results = results.filter((f) => f.status === status);
    }

    return results.sort((a, b) => b.id - a.id);
  }

  public async getFuncionarioById(id: number): Promise<Funcionario | null> {
    if (this.isPostgresConnected && this.pool) {
      const res = await this.pool.query('SELECT * FROM funcionarios WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        ...r,
        data_admissao: r.data_admissao ? new Date(r.data_admissao).toISOString().split('T')[0] : undefined,
      };
    }

    const item = this.localStore.find((f) => f.id === id);
    return item ? { ...item } : null;
  }

  public async getFuncionarioByCpf(cpf: string, excludeId?: number): Promise<Funcionario | null> {
    const formatted = formatCPF(cpf);
    const raw = cleanCPF(cpf);

    if (this.isPostgresConnected && this.pool) {
      let query = `SELECT * FROM funcionarios WHERE (cpf = $1 OR REPLACE(REPLACE(cpf, '.', ''), '-', '') = $2)`;
      const params: any[] = [formatted, raw];
      if (excludeId) {
        query += ' AND id != $3';
        params.push(excludeId);
      }
      const res = await this.pool.query(query, params);
      return res.rows[0] || null;
    }

    const item = this.localStore.find((f) => {
      if (excludeId && f.id === excludeId) return false;
      return f.cpf === formatted || cleanCPF(f.cpf) === raw;
    });

    return item ? { ...item } : null;
  }

  public async createFuncionario(data: CreateFuncionarioDTO): Promise<Funcionario> {
    const formattedCpf = formatCPF(data.cpf);
    const now = new Date().toISOString();

    if (this.isPostgresConnected && this.pool) {
      const res = await this.pool.query(
        `INSERT INTO funcionarios (nome, cpf, cargo, departamento, email, status, data_admissao, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          data.nome.trim(),
          formattedCpf,
          data.cargo?.trim() || null,
          data.departamento?.trim() || null,
          data.email?.trim() || null,
          data.status || 'ativo',
          data.data_admissao || null,
          now,
          now,
        ]
      );
      return res.rows[0];
    }

    const newFuncionario: Funcionario = {
      id: this.nextId++,
      nome: data.nome.trim(),
      cpf: formattedCpf,
      cargo: data.cargo?.trim() || undefined,
      departamento: data.departamento?.trim() || undefined,
      email: data.email?.trim() || undefined,
      status: data.status || 'ativo',
      data_admissao: data.data_admissao || undefined,
      created_at: now,
      updated_at: now,
    };

    this.localStore.unshift(newFuncionario);
    this.persistLocalStore();
    return newFuncionario;
  }

  public async updateFuncionario(id: number, data: UpdateFuncionarioDTO): Promise<Funcionario | null> {
    const now = new Date().toISOString();

    if (this.isPostgresConnected && this.pool) {
      const existing = await this.getFuncionarioById(id);
      if (!existing) return null;

      const updatedNome = data.nome !== undefined ? data.nome.trim() : existing.nome;
      const updatedCpf = data.cpf !== undefined ? formatCPF(data.cpf) : existing.cpf;
      const updatedCargo = data.cargo !== undefined ? (data.cargo?.trim() || null) : (existing.cargo || null);
      const updatedDept = data.departamento !== undefined ? (data.departamento?.trim() || null) : (existing.departamento || null);
      const updatedEmail = data.email !== undefined ? (data.email?.trim() || null) : (existing.email || null);
      const updatedStatus = data.status !== undefined ? data.status : existing.status;
      const updatedDataAdm = data.data_admissao !== undefined ? (data.data_admissao || null) : (existing.data_admissao || null);

      const res = await this.pool.query(
        `UPDATE funcionarios
         SET nome = $1, cpf = $2, cargo = $3, departamento = $4, email = $5, status = $6, data_admissao = $7, updated_at = $8
         WHERE id = $9
         RETURNING *`,
        [updatedNome, updatedCpf, updatedCargo, updatedDept, updatedEmail, updatedStatus, updatedDataAdm, now, id]
      );

      return res.rows[0] || null;
    }

    const index = this.localStore.findIndex((f) => f.id === id);
    if (index === -1) return null;

    const current = this.localStore[index];
    const updated: Funcionario = {
      ...current,
      nome: data.nome !== undefined ? data.nome.trim() : current.nome,
      cpf: data.cpf !== undefined ? formatCPF(data.cpf) : current.cpf,
      cargo: data.cargo !== undefined ? data.cargo.trim() : current.cargo,
      departamento: data.departamento !== undefined ? data.departamento.trim() : current.departamento,
      email: data.email !== undefined ? data.email.trim() : current.email,
      status: data.status !== undefined ? data.status : current.status,
      data_admissao: data.data_admissao !== undefined ? data.data_admissao : current.data_admissao,
      updated_at: now,
    };

    this.localStore[index] = updated;
    this.persistLocalStore();
    return updated;
  }

  public async deleteFuncionario(id: number): Promise<boolean> {
    if (this.isPostgresConnected && this.pool) {
      const res = await this.pool.query('DELETE FROM funcionarios WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }

    const idx = this.localStore.findIndex((f) => f.id === id);
    if (idx === -1) return false;

    this.localStore.splice(idx, 1);
    this.persistLocalStore();
    return true;
  }

  public async resetSeed(): Promise<void> {
    if (this.isPostgresConnected && this.pool) {
      await this.pool.query('TRUNCATE TABLE funcionarios RESTART IDENTITY');
      for (const item of INITIAL_FUNCIONARIOS) {
        await this.pool.query(
          `INSERT INTO funcionarios (nome, cpf, cargo, departamento, email, status, data_admissao)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            item.nome,
            formatCPF(item.cpf),
            item.cargo || null,
            item.departamento || null,
            item.email || null,
            item.status,
            item.data_admissao || null,
          ]
        );
      }
      return;
    }

    this.seedLocalStore();
  }
}

export const dbService = new DatabaseService();
