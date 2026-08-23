// supabase.js
// Conexão do site com o banco de dados (Supabase).
// Troque os valores abaixo pelos que você pegar em:
// Project Settings > API, dentro do seu projeto no supabase.com

const SUPABASE_URL =  'https://bsunzvivyfalkstyxpno.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdW56dml2eWZhbGtzdHl4cG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NjgwMjEsImV4cCI6MjEwMzA0NDAyMX0.mt9lppz7_VCvQxduoD_ovl5jLdPwo8UUEXtFvDR7iTE';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Busca todas as peças cadastradas na tabela "pecas"
async function buscarPecas() {
  const { data, error } = await db.from('pecas').select('*');
  if (error) {
    console.error('Erro ao buscar peças:', error.message);
    return [];
  }
  return data;
}

// Busca só as peças de uma categoria (ex: "cpu", "placa-mae")
async function buscarPecasPorCategoria(categoria) {
  const { data, error } = await db.from('pecas').select('*').eq('categoria', categoria);
  if (error) {
    console.error('Erro ao buscar peças:', error.message);
    return [];
  }
  return data;
}
