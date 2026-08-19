const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORTA = process.env.PORT || 3000;

// ==============================================
// BANCO DE DADOS
// ==============================================
const BANCO = 'estoque.db';

// Apaga banco antigo (só na primeira criação)
if (fs.existsSync(BANCO)) {
  try { 
    fs.unlinkSync(BANCO); 
    console.log('Banco antigo apagado! Criando banco novo...'); 
  } catch(e) { 
    console.log('Usando banco existente...'); 
  }
}

// Conecta ao banco
const db = new sqlite3.Database(BANCO, function(erro) {
  if (erro) {
    console.log('Erro ao conectar banco:', erro);
  } else {
    console.log('✅ Conectado ao SQLite!');
    criarTabelas();
  }
});

// Cria tabelas
function criarTabelas() {
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo INTEGER UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      preco_unitario REAL DEFAULT 0,
      quantidade INTEGER DEFAULT 0,
      ultima_atualizacao TEXT
    )
  `, function() {
    console.log('✅ Tabela produtos pronta!');
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      produto_codigo INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      responsavel TEXT NOT NULL,
      data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, function() {
    console.log('✅ Tabela movimentacoes pronta!');
  });
}

// ==============================================
// CONFIGURAÇÕES
// ==============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ==============================================
// 🔐 TELA DE LOGIN — PRIMEIRA PÁGINA
// ==============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// PÁGINA PRINCIPAL (após login)
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==============================================
// PRODUTOS
// ==============================================

// Listar todos
app.get('/api/produtos', (req, res) => {
  db.all('SELECT * FROM produtos ORDER BY codigo', (erro, linhas) => {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json(linhas);
  });
});

// Buscar por código
app.get('/api/produtos/:codigo', (req, res) => {
  db.get('SELECT * FROM produtos WHERE codigo = ?', [req.params.codigo], (erro, linha) => {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json(linha || null);
  });
});

// Cadastrar
app.post('/api/produtos', (req, res) => {
  const d = req.body;
  const data = new Date().toISOString();
  
  db.run(`
    INSERT INTO produtos (codigo, nome, categoria, preco_unitario, quantidade, ultima_atualizacao)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [d.codigo, d.nome, d.categoria, d.preco_unitario || 0, d.quantidade || 0, data], function(erro) {
    if (erro) {
      if (erro.message.includes('UNIQUE')) {
        res.status(400).json({ erro: 'Código já cadastrado!' });
      } else {
        res.status(500).json({ erro: erro.message });
      }
    } else {
      res.json({ id: this.lastID, ...d });
    }
  });
});

// Excluir
app.delete('/api/produtos/:codigo', (req, res) => {
  db.run('DELETE FROM produtos WHERE codigo = ?', [req.params.codigo], (erro) => {
    if (erro) res.status(500).json({ erro: erro.message });
    else res.json({ sucesso: true });
  });
});

// ==============================================
// MOVIMENTAÇÃO
// ==============================================

app.post('/api/movimentacao', (req, res) => {
  const d = req.body;
  const data = new Date().toISOString();

  db.get('SELECT * FROM produtos WHERE codigo = ?', [d.codigo], (erro, prod) => {
    if (erro) return res.status(500).json({ erro: erro.message });
    if (!prod) return res.status(404).json({ erro: 'Produto não encontrado!' });

    let novaQtd;
    if (d.tipo === 'entrada') {
      novaQtd = prod.quantidade + Number(d.quantidade);
    } else if (d.tipo === 'saida') {
      if (prod.quantidade < Number(d.quantidade)) {
        return res.status(400).json({ erro: 'Estoque insuficiente!' });
      }
      novaQtd = prod.quantidade - Number(d.quantidade);
    } else {
      return res.status(400).json({ erro: 'Tipo inválido!' });
    }

    // Atualiza quantidade e data
    db.run(
      'UPDATE produtos SET quantidade = ?, ultima_atualizacao = ? WHERE codigo = ?',
      [novaQtd, data, d.codigo],
      (erro) => {
        if (erro) return res.status(500).json({ erro: erro.message });

        // Registra movimentação
        db.run(`
          INSERT INTO movimentacoes (tipo, produto_codigo, quantidade, responsavel, data_hora)
          VALUES (?, ?, ?, ?, ?)
        `, [d.tipo, d.codigo, d.quantidade, d.responsavel, data], (erro) => {
          if (erro) return res.status(500).json({ erro: erro.message });
          res.json({ sucesso: true, novaQuantidade: novaQtd });
        });
      }
    );
  });
});

// ==============================================
// RELATÓRIOS
// ==============================================

// Relatório de movimentações (com filtros)
app.get('/api/movimentacoes', (req, res) => {
  const q = req.query;
  let sql = `
    SELECT m.*, p.nome, p.categoria, p.preco_unitario
    FROM movimentacoes m
    LEFT JOIN produtos p ON m.produto_codigo = p.codigo
    WHERE 1=1
  `;
  let params = [];

  if (q.inicio) {
    sql += ' AND DATE(m.data_hora) >= ?';
    params.push(q.inicio);
  }
  if (q.fim) {
    sql += ' AND DATE(m.data_hora) <= ?';
    params.push(q.fim);
  }
  if (q.categoria) {
    sql += ' AND p.categoria = ?';
    params.push(q.categoria);
  }

  sql += ' ORDER BY m.data_hora DESC';

  db.all(sql, params, (erro, linhas) => {
    if (erro) {
      console.log('Erro relatório:', erro);
      res.status(500).json({ erro: erro.message });
    } else {
      res.json(linhas);
    }
  });
});

// Relatório resumido
app.get('/api/resumo', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM produtos', (erro1, p) => {
    db.get('SELECT COALESCE(SUM(quantidade), 0) as total FROM produtos', (erro2, q) => {
      db.get('SELECT COALESCE(SUM(quantidade * preco_unitario), 0) as total FROM produtos', (erro3, v) => {
        res.json({
          total_produtos: p ? p.total : 0,
          total_quantidade: q ? q.total : 0,
          total_valor: v ? v.total : 0
        });
      });
    });
  });
});

// ==============================================
// INICIAR SERVIDOR
// ==============================================
app.listen(PORTA, () => {
  console.log('✅ Servidor rodando na porta ' + PORTA);
  console.log('✅ Acesse: http://localhost:' + PORTA);
  console.log('✅ Sistema de Controle de Estoque - Pronto!');
});