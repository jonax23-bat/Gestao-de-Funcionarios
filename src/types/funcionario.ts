export interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
  cargo?: string;
  departamento?: string;
  email?: string;
  status: 'ativo' | 'inativo';
  data_admissao?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFuncionarioDTO {
  nome: string;
  cpf: string;
  cargo?: string;
  departamento?: string;
  email?: string;
  status?: 'ativo' | 'inativo';
  data_admissao?: string;
}

export interface UpdateFuncionarioDTO {
  nome?: string;
  cpf?: string;
  cargo?: string;
  departamento?: string;
  email?: string;
  status?: 'ativo' | 'inativo';
  data_admissao?: string;
}
