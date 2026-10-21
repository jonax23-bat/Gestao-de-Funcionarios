import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const { Pool } = pg;

// Initialize Postgres connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/empresa_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

app.use(cors());
app.use(express.json());

// CPF Helper Functions
function cleanCPF(cpf) {
  return (cpf || '').replace(/\D/g, '');
}

function formatCPF(cpf) {
  const digits = cleanCPF(cpf).slice(0, 11);
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function validateCPF(cpf) {
  const digits = cleanCPF(cpf);
  if (!digits || digits.length !== 11) {
    return { valid: false, reason: 'CPF deve conter 11 dígitos numéricos.' };
  }
  if (/^(\d)\1{10}$/.test(digits)) {
    return { valid: false, reason: 'CPF inválido: todos os dígitos são iguais.' };
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits.charAt(i), 10) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(digits.charAt(9), 10)) {
    return { valid: false, reason: 'Primeiro dígito verificador inválido.' };
  }
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits.charAt(i), 10) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  if (d2 !== parseInt(digits.charAt(10), 10)) {
    return { valid: false, reason: 'Segundo dígito verificador inválido.' };
  }
  return { valid: true };
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'online',
      database: 'PostgreSQL 16',
      timestamp: result.rows[0].now,
      service: 'API REST Funcionários',
    });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// GET /api/funcionarios - List all with optional search & status filter
app.get('/api/funcionarios', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = 'SELECT * FROM funcionarios WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      const digits = cleanCPF(search);
      params.push(term);
      if (digits.length >= 3) {
        params.push(`%${digits}%`);
        query += ` AND (nome ILIKE $1 OR REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') ILIKE $2)`;
      } else {
        query += ` AND (nome ILIKE $1 OR cpf ILIKE $1 OR cargo ILIKE $1 OR departamento ILIKE $1)`;
      }
    }

    if (status && (status === 'ativo' || status === 'inativo')) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching funcionarios:', err);
    res.status(500).json({ error: 'Erro ao buscar funcionários.' });
  }
});

// GET /api/funcionarios/:id - Get single by id
app.get('/api/funcionarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM funcionarios WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar funcionário.' });
  }
});

// POST /api/funcionarios - Create new funcionario
app.post('/api/funcionarios', async (req, res) => {
  try {
    const { nome, cpf, cargo, departamento, email, status, data_admissao } = req.body;

    if (!nome || typeof nome !== 'string' || nome.trim().length < 3) {
      return res.status(400).json({ error: 'Nome é obrigatório e deve ter ao menos 3 caracteres.' });
    }

    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
      return res.status(400).json({ error: cpfValidation.reason });
    }

    const formattedCpf = formatCPF(cpf);

    // Check duplicate CPF
    const existing = await pool.query('SELECT id FROM funcionarios WHERE cpf = $1', [formattedCpf]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Já existe um funcionário cadastrado com este CPF.' });
    }

    const result = await pool.query(
      `INSERT INTO funcionarios (nome, cpf, cargo, departamento, email, status, data_admissao, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        nome.trim(),
        formattedCpf,
        cargo ? cargo.trim() : null,
        departamento ? departamento.trim() : null,
        email ? email.trim() : null,
        status || 'ativo',
        data_admissao || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating funcionario:', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar funcionário.' });
  }
});

// PUT /api/funcionarios/:id - Update existing funcionario
app.put('/api/funcionarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, cargo, departamento, email, status, data_admissao } = req.body;

    const currentRes = await pool.query('SELECT * FROM funcionarios WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }

    let finalCpf = currentRes.rows[0].cpf;
    if (cpf) {
      const cpfValidation = validateCPF(cpf);
      if (!cpfValidation.valid) {
        return res.status(400).json({ error: cpfValidation.reason });
      }
      finalCpf = formatCPF(cpf);

      // Check unique
      const dup = await pool.query('SELECT id FROM funcionarios WHERE cpf = $1 AND id != $2', [finalCpf, id]);
      if (dup.rows.length > 0) {
        return res.status(409).json({ error: 'Outro funcionário já possui este CPF cadastrado.' });
      }
    }

    const finalNome = nome && nome.trim().length >= 3 ? nome.trim() : currentRes.rows[0].nome;

    const result = await pool.query(
      `UPDATE funcionarios
       SET nome = $1, cpf = $2, cargo = $3, departamento = $4, email = $5, status = $6, data_admissao = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        finalNome,
        finalCpf,
        cargo !== undefined ? (cargo ? cargo.trim() : null) : currentRes.rows[0].cargo,
        departamento !== undefined ? (departamento ? departamento.trim() : null) : currentRes.rows[0].departamento,
        email !== undefined ? (email ? email.trim() : null) : currentRes.rows[0].email,
        status || currentRes.rows[0].status,
        data_admissao !== undefined ? (data_admissao || null) : currentRes.rows[0].data_admissao,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating funcionario:', err);
    res.status(500).json({ error: 'Erro ao atualizar funcionário.' });
  }
});

// DELETE /api/funcionarios/:id - Delete funcionario
app.delete('/api/funcionarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM funcionarios WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }
    res.json({ message: 'Funcionário removido com sucesso.', id: parseInt(id, 10) });
  } catch (err) {
    console.error('Error deleting funcionario:', err);
    res.status(500).json({ error: 'Erro ao excluir funcionário.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend REST API running on port ${PORT}`);
});
