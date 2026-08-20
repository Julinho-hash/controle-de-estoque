const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORTA = process.env.PORT || 3000;

// ==============================================
// CONEXÃO COM BANCO DE DADOS
// ==============================================
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==============================================
// CRIAR TABELAS
// ==============================================
async function criarTabelas() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        codigo INTEGER UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        preco_unitario NUMERIC DEFAULT 0,
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

    console.log('✅ Tabelas prontas! Dados salvos para SEMPRE!');
    iniciarServidor();
  } catch (erro) {
    console.log('⚠️ Tentando conectar de novo...');
    setTimeout(criarTabelas, 3000);
  }
}

// Inicia tudo
criarTabelas();

// ==============================================
// CONFIGURAÇÕES
// ==============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ==============================================
// PÁGINAS
// ==============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==============================================
// PRODUTOS
// ==============================================
app.get('/api/produtos', async (req, res) => {
  const resultado = await db.query('SELECT * FROM produtos ORDER BY codigo');
  res.json(resultado.rows);
});

app.get('/api/produtos/:codigo', async (req, res) => {
  const codigo = req.params.codigo;
  const resultado = await db.query('SELECT * FROM produtos WHERE codigo = $1', [codigo]);
  res.json(resultado.rows[0] || null);
});

app.post('/api/produtos', async (req, res) => {
  const d = req.body;
  const data = new Date().toISOString();

  try {
    const resultado = await db.query(`
      INSERT INTO produtos (codigo, nome, categoria, preco_unitario, quantidade, ultima_atualizacao)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [d.codigo, d.nome, d.categoria, d.preco_unitario || 0, 0, data]);

    res.json({ sucesso: true, produto: resultado.rows[0] });
  } catch (erro) {
    if (erro.constraint === 'produtos_codigo_key') {
      res.status(400).json({ erro: 'Código ja cadastrado!' });
    } else {
      res.status(500).json({ erro: 'Erro ao cadastrar' });
    }
  }
});

app.delete('/api/produtos/:codigo', async (req, res) => {
  const codigo = req.params.codigo;
  await db.query('DELETE FROM produtos WHERE codigo = $1', [codigo]);
  res.json({ sucesso: true });
});

// ==============================================
// MOVIMENTAÇÃO
// ==============================================
app.post('/api/movimentacao', async (req, res) => {
  const d = req.body;
  const data = new Date().toISOString();

  // Busca o produto
  const prodResultado = await db.query('SELECT * FROM produtos WHERE codigo = $1', [d.codigo]);
  const produto = prodResultado.rows[0];
  if (!produto) {
    return res.status(404).json({ erro: 'Produto nao encontrado!' });
  }

  // Calcula nova quantidade
  let novaQuantidade;
  if (d.tipo === 'entrada') {
    novaQuantidade = produto.quantidade + Number(d.quantidade);
  } else if (d.tipo === 'saida') {
    if (produto.quantidade < Number(d.quantidade)) {
      return res.status(400).json({ erro: 'Estoque insuficiente!' });
    }
    novaQuantidade = produto.quantidade - Number(d.quantidade);
  } else {
    return res.status(400).json({ erro: 'Tipo invalido!' });
  }

  // Atualiza estoque
  await db.query(
    'UPDATE produtos SET quantidade = $1, ultima_atualizacao = $2 WHERE codigo = $3',
    [novaQuantidade, data, d.codigo]
  );

  // Registra movimentação
  await db.query(
    'INSERT INTO movimentacoes (tipo, produto_codigo, quantidade, responsavel, data_hora) VALUES ($1, $2, $3, $4, $5)',
    [d.tipo, d.codigo, d.quantidade, d.responsavel, data]
  );

  res.json({ sucesso: true, novaQuantidade: novaQuantidade });
});

// ==============================================
// RELATÓRIOS
// ==============================================
app.get('/api/movimentacoes', async (req, res) => {
  const q = req.query;
  let sql = 'SELECT m.*, p.nome, p.categoria FROM movimentacoes m LEFT JOIN produtos p ON m.produto_codigo = p.codigo WHERE 1=1';
  let params = [];
  let indice = 1;

  if (q.inicio) {
    sql += ` AND DATE(m.data_hora) >= $${indice}`;
    params.push(q.inicio);
    indice++;
  }
  if (q.fim) {
    sql += ` AND DATE(m.data_hora) <= $${indice}`;
    params.push(q.fim);
    indice++;
  }
  if (q.categoria) {
    sql += ` AND p.categoria = $${indice}`;
    params.push(q.categoria);
    indice++;
  }

  sql += ' ORDER BY m.data_hora DESC';
  const resultado = await db.query(sql, params);
  res.json(resultado.rows);
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
// INICIAR SERVIDOR
// ==============================================
function iniciarServidor() {
  app.listen(PORTA, () => {
    console.log('✅ Servidor rodando na porta ' + PORTA);
    console.log('✅ Sistema Pronto! Dados salvos para SEMPRE!');
  });
}
