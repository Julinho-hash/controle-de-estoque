const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

// Conecta no banco
const db = new sqlite3.Database('estoque.db');

// Configurações
app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// CRIAÇÃO DAS TABELAS NO BANCO
// ==========================================

// Tabela de Produtos
db.run(`
  CREATE TABLE IF NOT EXISTS produtos (
    codigo INTEGER PRIMARY KEY,
    nome TEXT,
    categoria TEXT,
    preco REAL,
    quantidade INTEGER,
    ultima_atualizacao TEXT
  )
`);

// Tabela de Movimentações
db.run(`
  CREATE TABLE IF NOT EXISTS movimentacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_produto INTEGER,
    tipo TEXT,
    quantidade INTEGER,
    responsavel TEXT,
    data TEXT
  )
`);

// ==========================================
// ROTAS — PRODUTOS
// ==========================================

// Buscar todos os produtos
app.get('/api/produtos', (req, res) => {
  db.all('SELECT * FROM produtos ORDER BY codigo', [], (err, linhas) => {
    if (err) return res.status(500).json({erro: err.message});
    res.json(linhas);
  });
});

// Listar todas as categorias
app.get('/api/categorias', (req, res) => {
  db.all('SELECT DISTINCT categoria FROM produtos ORDER BY categoria', [], (err, linhas) => {
    if (err) return res.status(500).json({erro: err.message});
    res.json(linhas.map(l => l.categoria));
  });
});

// ==========================================
// CADASTRAR NOVO PRODUTO
// ==========================================
app.post('/api/produtos', (req, res) => {
  const { codigo, nome, categoria, preco } = req.body;

  if (!codigo || !nome || !categoria || !preco) {
    return res.status(400).json({erro: 'Preencha todos os campos!'});
  }

  db.run(`
    INSERT INTO produtos (codigo, nome, categoria, preco, quantidade)
    VALUES (?, ?, ?, ?, 0)
  `, [codigo, nome.toUpperCase(), categoria.toUpperCase(), preco], function(err) {
    if (err) return res.status(500).json({erro: 'Código já existe!'});
    res.json({sucesso: true});
  });
});

// ==========================================
// REGISTRAR MOVIMENTAÇÃO
// ==========================================
app.post('/api/movimentacao', (req, res) => {
  const { codigo, quantidade, tipo, responsavel } = req.body;

  db.get('SELECT * FROM produtos WHERE codigo = ?', [codigo], (err, prod) => {
    if (err) return res.status(500).json({erro: err.message});
    if (!prod) return res.json({erro: 'Produto não encontrado!'});

    let novaQtd;
    if (tipo === 'entrada') {
      novaQtd = prod.quantidade + quantidade;
    } else {
      if (prod.quantidade < quantidade) {
        return res.json({erro: 'Estoque insuficiente!'});
      }
      novaQtd = prod.quantidade - quantidade;
    }

    // Atualiza quantidade do produto
    db.run(
      'UPDATE produtos SET quantidade = ?, ultima_atualizacao = datetime("now") WHERE codigo = ?',
      [novaQtd, codigo],
      function(err) {
        if (err) return res.status(500).json({erro: err.message});

        // Registra no histórico de movimentações
        db.run(`
          INSERT INTO movimentacoes (codigo_produto, tipo, quantidade, responsavel, data)
          VALUES (?, ?, ?, ?, datetime("now"))
        `, [codigo, tipo, quantidade, responsavel], (err) => {
          if (err) return res.status(500).json({erro: err.message});
          res.json({sucesso: true});
        });
      }
    );
  });
});

// ==========================================
// RELATÓRIO DE TODAS AS MOVIMENTAÇÕES
// ==========================================
app.get('/api/movimentacoes', (req, res) => {
  db.all(`
    SELECT m.*, p.nome, p.categoria 
    FROM movimentacoes m
    LEFT JOIN produtos p ON m.codigo_produto = p.codigo
    ORDER BY m.data DESC
  `, [], (err, linhas) => {
    if (err) return res.status(500).json({erro: err.message});
    res.json(linhas);
  });
});

// ==========================================
// RELATÓRIO DE MOVIMENTAÇÕES POR PERÍODO ✅
// ==========================================
app.get('/api/movimentacoes-periodo', (req, res) => {
  const { inicio, fim } = req.query;

  db.all(`
    SELECT m.*, p.nome, p.categoria 
    FROM movimentacoes m
    LEFT JOIN produtos p ON m.codigo_produto = p.codigo
    WHERE DATE(m.data) BETWEEN ? AND ?
    ORDER BY m.data DESC
  `, [inicio, fim], (err, linhas) => {
    if (err) return res.status(500).json({erro: err.message});
    res.json(linhas);
  });
});

// ==========================================
// LIGAR O SERVIDOR
// ==========================================
app.listen(3000, () => {
  console.log('===============================');
  console.log('SERVIDOR RODANDO!');
  console.log('ACESSE: http://localhost:3000');
  console.log('===============================');
});