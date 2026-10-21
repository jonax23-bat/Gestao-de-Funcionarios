-- Init SQL script for PostgreSQL
-- Automatically executed by PostgreSQL container upon creation

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

-- Index for fast CPF lookups
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON funcionarios(nome);

-- Initial seed data
INSERT INTO funcionarios (nome, cpf, cargo, departamento, email, status, data_admissao)
VALUES
  ('Mariana de Souza Santos', '382.491.508-20', 'Engenheira de Software Senior', 'Tecnologia', 'mariana.santos@empresa.com.br', 'ativo', '2022-03-15'),
  ('Carlos Eduardo Oliveira', '519.824.170-04', 'Analista de Infraestrutura & DevOps', 'Infraestrutura', 'carlos.oliveira@empresa.com.br', 'ativo', '2021-08-10'),
  ('Beatriz Almeida Lima', '741.059.328-91', 'Coordenadora de Recursos Humanos', 'Recursos Humanos', 'beatriz.lima@empresa.com.br', 'ativo', '2020-01-20'),
  ('Lucas Ribeiro Fernandes', '163.928.450-77', 'Product Designer (UI/UX)', 'Produto', 'lucas.fernandes@empresa.com.br', 'ativo', '2023-05-02'),
  ('Juliana Costa Mendes', '928.374.615-38', 'Analista Financeiro Pleno', 'Financeiro', 'juliana.mendes@empresa.com.br', 'inativo', '2021-11-18')
ON CONFLICT (cpf) DO NOTHING;
