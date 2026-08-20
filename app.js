const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORTA = process.env.PORT || 3000;

// ==============================================
// BANCO DE DADOS — POSTGRESQL (PERMANENTE!)
// ==============================================
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://controle_de_estoque_cpuz_user:gnhahsOp979Fv00lHMqfK4aCdmrkYOJE@dpg-da24fvn40ujc7395ej00-a:5432/controle_de_estoque_cpuz',
  ssl: { rejectUnauthorized: false }
});

// TESTAR CONEXÃO
db.query('SELECT NOW()', (erro) => {
  if (erro) console.log('❌ Erro banco:', erro.message);
  else {
    console.log('✅ Conectado ao Banco Permanente!');
    criarTabelas();
  }
});

// CRIAR TABELAS
async function criarTabelas() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      codigo INTEGER UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      preco_unitario REAL DEFAULT 0,
      quantidade INTEGER DEFAULT 0,
      ultima_atualizacao TEXT
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id SERIAL PRIMARY KEY,
      tipo TEXT NOT NULL,
      produto_codigo INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      responsavel TEXT NOT NULL,
      data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabelas prontas! Dados SALVOS PARA SEMPRE!');
  iniciarServidor();
}

// ==============================================
// CONFIGURAÇÕES
// ==============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ==============================================
// PÁGINAS
// ==============================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ==============================================
// PRODUTOS
// ==============================================
app.get('/api/produtos', async (req, res) => {
  const r = await db.query('SELECT * FROM produtos ORDER BY codigo');
  res.json(r.rows);
});

app.get('/api/produtos/:codigo', async (req, res) => {
  const r = await db.query('SELECT * FROM produtos WHERE codigo = $1', [req.params.codigo]);
  res.json(r.rows[0] || null);
});

app.post('/api/produtos', async (req, res) => {
  const d = req.body;
  const data = new Date().toISOString();
  try {
    const r = await db.query(`
      INSERT INTO produtos (codigo, nome, categoria, preco_unitario, quantidade, ultima_atualizacao)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [d.codigo, d.nome, d.categoria, d.preco_unitario||0, 0, data]);
    res.json({ sucesso: true, produto: r.rows[0] });
  } catch (erro) {
    if (erro.message.includes('duplicate')) {
      res.status(400).json({ erro: 'Código já cadastrado!' });
    } else {
      res.status(500).json({ erro: erro.message });
    }
  }
});

app.delete('/api/produtos/:codigo', async (req, res) => {
  await db.query('DELETE FROM produtos WHERE codigo = $1', [req.params.codigo]);
  res.json({ sucesso: true });
});

// ==============================================
// MOVIMENTAÇÃO
// ==============================================
app.post('/api/movimentacao', async (req, res) => {
  const d = req.body;
  const data = new Date().toISOString();
  
  const prodRes = await db.query('SELECT * FROM produtos WHERE codigo = $1', [d.codigo]);
  const prod = prodRes.rows[0];
  if (!prod) return res.status(404).json({ erro: 'Produto não encontrado!' });

  let novaQtd;
  if (d.tipo === 'entrada') novaQtd = prod.quantidade + Number(d.quantidade);
  else if (d.tipo === 'saida') {
    if (prod.quantidade < Number(d.quantidade)) return res.status(400).json({ erro: 'Estoque insuficiente!' });
    novaQtd = prod.quantidade - Number(d.quantidade);
  } else return res.status(400).json({ erro: 'Tipo inválido!' });

  await db.query(
    'UPDATE produtos SET quantidade = $1, ultima_atualizacao = $2 WHERE codigo = $3',
    [novaQtd, data, d.codigo]
  );
  await db.query(
    'INSERT INTO movimentacoes (tipo, produto_codigo, quantidade, responsavel, data_hora) VALUES ($1, $2, $3, $4, $5)',
    [d.tipo, d.codigo, d.quantidade, d.responsavel, data]
  );
  res.json({ sucesso: true, novaQuantidade: novaQtd });
});

// ==============================================
// RELATÓRIOS
// ==============================================
app.get('/api/movimentacoes', async (req, res) => {
  const q = req.query;
  let sql = SELECT m.*, p.nome, p.categoria FROM movimentacoes m LEFT JOIN produtos p ON m.produto_codigo = p.codigo WHERE 1=1;
  let params = [];
  let n = 1;
  if (q.inicio) { sql += ` AND DATE(m.data_hora) >= $${n++}`; params.push(q.inicio); }
  if (q.fim)   { sql += ` AND DATE(m.data_hora) <= $${n++}`; params.push(q.fim); }
  if (q.categoria) { sql += ` AND p.categoria = $${n++}`; params.push(q.categoria); }
  sql += ' ORDER BY m.data_hora DESC';
  
  const r = await db.query(sql, params);
  res.json(r.rows);
});

app.get('/api/resumo', async (req, res) => {
  const p = await db.query('SELECT COUNT(*) as total FROM produtos');
  const q = await db.query('SELECT COALESCE(SUM(quantidade), 0) as total FROM produtos');
  const v = await db.query('SELECT COALESCE(SUM(quantidade * preco_unitario), 0) as total FROM produtos');
  res.json({
    total_produtos: parseInt(p.rows[0].total),
    total_quantidade: parseInt(q.rows[0].total),
    total_valor: parseFloat(v.rows[0].total)
  });
});

// ==============================================
// INICIAR
// ==============================================
function iniciarServidor() {
  app.listen(PORTA, () => {
    console.log(✅ Servidor rodando na porta ${PORTA});
    console.log(✅ BANCO PERMANENTE — DADOS NUNCA SOMEM! 🎉);
  });
}