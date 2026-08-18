const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORTA = process.env.PORT || 3000;

// Apaga banco antigo e cria novo
const BANCO = 'estoque.db';
if (fs.existsSync(BANCO)) {
  try { fs.unlinkSync(BANCO); console.log('Banco antigo apagado!'); }
  catch(e) { console.log('Não deu pra apagar, usando o existente...'); }
}

const db = new sqlite3.Database(BANCO, function(erro) {
  if (erro) console.log('Erro banco:', erro);
  else { console.log('Conectado ao SQLite!'); criarTabelas(); }
});

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
  `);

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
  `, function(){ console.log('Tabelas prontas!'); });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// === PRODUTOS ===
app.get('/api/produtos', (req, res) => {
  db.all('SELECT * FROM produtos ORDER BY codigo', (erro, linhas) => {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json(linhas);
  });
});

app.get('/api/produtos/:codigo', (req, res) => {
  db.get('SELECT * FROM produtos WHERE codigo = ?', [req.params.codigo], (erro, linha) => {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json(linha || null);
  });
});

app.post('/api/produtos', (req, res) => {
  const d = req.body;
  db.run(`
    INSERT INTO produtos (codigo, nome, categoria, preco_unitario, quantidade)
    VALUES (?, ?, ?, ?, ?)
  `, [d.codigo, d.nome, d.categoria, d.preco_unitario, d.quantidade || 0], function(erro) {
    if (erro) {
      if (erro.message.includes('UNIQUE')) res.status(400).json({ erro: 'Código já existe!' });
      else res.status(500).json({ erro: erro.message });
    } else res.json({ id: this.lastID, ...d });
  });
});

// === MOVIMENTAÇÃO ===
app.post('/api/movimentacao', (req, res) => {
  const d = req.body;
  db.get('SELECT * FROM produtos WHERE codigo = ?', [d.codigo], (erro, prod) => {
    if (erro) return res.status(500).json({ erro: erro.message });
    if (!prod) return res.status(404).json({ erro: 'Produto não encontrado!' });

    let novaQtd;
    if (d.tipo === 'entrada') novaQtd = prod.quantidade + Number(d.quantidade);
    else if (d.tipo === 'saída') {
      if (prod.quantidade < Number(d.quantidade))
        return res.status(400).json({ erro: 'Estoque insuficiente!' });
      novaQtd = prod.quantidade - Number(d.quantidade);
    } else return res.status(400).json({ erro: 'Tipo inválido!' });

    db.run('UPDATE produtos SET quantidade = ? WHERE codigo = ?', [novaQtd, d.codigo], (erro) => {
      if (erro) return res.status(500).json({ erro: erro.message });
      db.run(`
        INSERT INTO movimentacoes (tipo, produto_codigo, quantidade, responsavel)
        VALUES (?, ?, ?, ?)
      `, [d.tipo, d.codigo, d.quantidade, d.responsavel], (erro) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.json({ sucesso: true, novaQuantidade: novaQtd });
      });
    });
  });
});

app.delete('/api/produtos/:codigo', (req, res) => {
  db.run('DELETE FROM produtos WHERE codigo = ?', [req.params.codigo], (erro) => {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json({ sucesso: true });
  });
});

// === RELATÓRIOS ===
app.get('/api/movimentacoes', (req, res) => {
  const q = req.query;
  let sql = `
    SELECT m.*, p.nome, p.categoria, p.preco_unitario
    FROM movimentacoes m
    LEFT JOIN produtos p ON m.produto_codigo = p.codigo
    WHERE 1=1
  `;
  let params = [];

  if (q.inicio) { sql += ' AND DATE(m.data_hora) >= ?'; params.push(q.inicio); }
  if (q.fim) { sql += ' AND DATE(m.data_hora) <= ?'; params.push(q.fim); }
  if (q.categoria) { sql += ' AND p.categoria = ?'; params.push(q.categoria); }

  sql += ' ORDER BY m.data_hora DESC';

  db.all(sql, params, (erro, linhas) => {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json(linhas);
  });
});

app.get('/api/resumo', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM produtos', (erro1, p) => {
    db.get('SELECT SUM(quantidade) as total FROM produtos', (erro2, q) => {
      db.get('SELECT SUM(quantidade * preco_unitario) as total FROM produtos', (erro3, v) => {
        res.json({
          total_produtos: p ? p.total : 0,
          total_quantidade: q ? q.total : 0,
          total_valor: v ? v.total : 0
        });
      });
    });
  });
});

// === PÁGINA PRINCIPAL ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORTA, () => {
  console.log('Servidor rodando na porta ' + PORTA);
});