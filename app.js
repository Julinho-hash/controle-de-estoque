const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORTA = process.env.PORT || 3000;

// Nome do banco
const BANCO = 'estoque.db';

// Apaga o banco antigo se existir
if (fs.existsSync(BANCO)) {
  fs.unlinkSync(BANCO);
  console.log('Banco antigo apagado!');
}

// Cria banco novo
const db = new sqlite3.Database(BANCO, function(erro) {
  if (erro) {
    console.log('Erro ao abrir banco:', erro);
  } else {
    console.log('Conectado ao SQLite!');
    criarTabelas();
  }
});

// Cria as tabelas COM a coluna de preço
function criarTabelas() {
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo INTEGER UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      preco_unitario REAL DEFAULT 0,
      quantidade INTEGER DEFAULT 0,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, function() {
    console.log('Tabela produtos pronta!');
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      produto_codigo INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      responsavel TEXT NOT NULL,
      data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_codigo) REFERENCES produtos(codigo) ON DELETE CASCADE
    )
  `, function() {
    console.log('Tabela movimentacoes pronta!');
  });
}

// Configurações
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Listar todos os produtos
app.get('/api/produtos', function(req, res) {
  db.all('SELECT * FROM produtos ORDER BY codigo', function(erro, linhas) {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json(linhas);
  });
});

// Buscar produto por código
app.get('/api/produtos/:codigo', function(req, res) {
  const codigo = req.params.codigo;
  db.get('SELECT * FROM produtos WHERE codigo = ?', [codigo], function(erro, linha) {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json(linha || null);
  });
});

// Cadastrar produto
app.post('/api/produtos', function(req, res) {
  const d = req.body;
  db.run(`
    INSERT INTO produtos (codigo, nome, categoria, preco_unitario, quantidade)
    VALUES (?, ?, ?, ?, ?)
  `, [d.codigo, d.nome, d.categoria, d.preco_unitario, d.quantidade], function(erro) {
    if (erro) {
      if (erro.message.includes('UNIQUE'))
        res.status(400).json({ erro: 'Código já existe!' });
      else
        res.status(500).json({ erro: erro.message });
    } else {
      res.json({ id: this.lastID, ...d });
    }
  });
});

// Movimentação (entrada/saída)
app.post('/api/movimentacao', function(req, res) {
  const d = req.body;

  db.get('SELECT * FROM produtos WHERE codigo = ?', [d.codigo], function(erro, prod) {
    if (erro) return res.status(500).json({ erro: erro.message });
    if (!prod) return res.status(404).json({ erro: 'Produto não encontrado!' });

    let novaQtd;
    if (d.tipo === 'entrada') {
      novaQtd = prod.quantidade + parseInt(d.quantidade);
    } else if (d.tipo === 'saída') {
      if (prod.quantidade < parseInt(d.quantidade))
        return res.status(400).json({ erro: 'Estoque insuficiente!' });
      novaQtd = prod.quantidade - parseInt(d.quantidade);
    } else {
      return res.status(400).json({ erro: 'Tipo inválido!' });
    }

    db.run('UPDATE produtos SET quantidade = ? WHERE codigo = ?', [novaQtd, d.codigo], function(erro) {
      if (erro) return res.status(500).json({ erro: erro.message });

      db.run(`
        INSERT INTO movimentacoes (tipo, produto_codigo, quantidade, responsavel)
        VALUES (?, ?, ?, ?)
      `, [d.tipo, d.codigo, d.quantidade, d.responsavel], function(erro) {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.json({ sucesso: true, novaQuantidade: novaQtd });
      });
    });
  });
});

// Excluir produto
app.delete('/api/produtos/:codigo', function(req, res) {
  db.run('DELETE FROM produtos WHERE codigo = ?', [req.params.codigo], function(erro) {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json({ sucesso: true });
  });
});

// Relatório de movimentações
app.get('/api/movimentacoes', function(req, res) {
  const d = req.query;
  let sql = `
    SELECT m.*, p.nome, p.categoria, p.preco_unitario
    FROM movimentacoes m
    JOIN produtos p ON m.produto_codigo = p.codigo
    WHERE 1=1
  `;
  let params = [];

  if (d.inicio) { sql += ' AND DATE(m.data_hora) >= ?'; params.push(d.inicio); }
  if (d.fim) { sql += ' AND DATE(m.data_hora) <= ?'; params.push(d.fim); }
  if (d.categoria) { sql += ' AND p.categoria = ?'; params.push(d.categoria); }

  sql += ' ORDER BY m.data_hora DESC';

  db.all(sql, params, function(erro, linhas) {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json(linhas);
  });
});

// Relatório resumido
app.get('/api/resumo', function(req, res) {
  db.get('SELECT COUNT(*) as total FROM produtos', function(erro, p) {
    db.get('SELECT SUM(quantidade) as total FROM produtos', function(erro, q) {
      db.get('SELECT SUM(quantidade * preco_unitario) as total FROM produtos', function(erro, v) {
        res.json({
          total_produtos: p ? p.total : 0,
          total_quantidade: q ? q.total : 0,
          total_valor: v ? v.total : 0
        });
      });
    });
  });
});

// Página principal
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicia servidor
app.listen(PORTA, function() {
  console.log('Servidor rodando na porta ' + PORTA);
  console.log('Banco criado do zero com coluna preco_unitario! ✅');
});