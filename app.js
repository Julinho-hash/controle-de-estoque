const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;

// ================= CONFIGURAÇÃO DO BANCO POSTGRESQL =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Testa conexão
pool.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
  } else {
    console.log('✅ Conectado ao PostgreSQL com sucesso!');
    criarTabelas();
  }
});

// ================= CRIA AS TABELAS =================
async function criarTabelas() {
  try {
    // Tabela de produtos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        codigo INTEGER UNIQUE NOT NULL,
        nome VARCHAR(100) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
        quantidade INTEGER NOT NULL DEFAULT 0,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de movimentações
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movimentacoes (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL,
        produto_codigo INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        responsavel VARCHAR(100) NOT NULL,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_codigo) REFERENCES produtos(codigo) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tabelas prontas!');
  } catch (erro) {
    console.error('Erro ao criar tabelas:', erro);
  }
}

// ================= MIDDLEWARES =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ================= ROTAS DA API =================

// Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM produtos ORDER BY codigo');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Buscar produto por código
app.get('/api/produtos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const resultado = await pool.query('SELECT * FROM produtos WHERE codigo = $1', [codigo]);
    if (resultado.rows.length === 0) {
      res.json(null);
    } else {
      res.json(resultado.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Cadastrar novo produto
app.post('/api/produtos', async (req, res) => {
  try {
    const { codigo, nome, categoria, preco_unitario, quantidade } = req.body;
    const resultado = await pool.query(`
      INSERT INTO produtos (codigo, nome, categoria, preco_unitario, quantidade)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [codigo, nome, categoria, preco_unitario, quantidade]);
    
    res.json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ erro: 'Já existe um produto com esse código!' });
    } else {
      res.status(500).json({ erro: err.message });
    }
  }
});

// Movimentação (entrada/saída)
app.post('/api/movimentacao', async (req, res) => {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const { codigo, tipo, quantidade, responsavel } = req.body;

    // Busca o produto
    const prodResult = await cliente.query('SELECT * FROM produtos WHERE codigo = $1', [codigo]);
    if (prodResult.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ erro: 'Produto não encontrado!' });
    }

    const produto = prodResult.rows[0];
    let novaQuantidade;

    if (tipo === 'entrada') {
      novaQuantidade = produto.quantidade + parseInt(quantidade);
    } else if (tipo === 'saída') {
      if (produto.quantidade < parseInt(quantidade)) {
        await cliente.query('ROLLBACK');
        return res.status(400).json({ erro: 'Estoque insuficiente!' });
      }
      novaQuantidade = produto.quantidade - parseInt(quantidade);
    } else {
      await cliente.query('ROLLBACK');
      return res.status(400).json({ erro: 'Tipo inválido!' });
    }

    // Atualiza quantidade
    await cliente.query(
      'UPDATE produtos SET quantidade = $1 WHERE codigo = $2',
      [novaQuantidade, codigo]
    );

    // Registra movimentação
    await cliente.query(`
      INSERT INTO movimentacoes (tipo, produto_codigo, quantidade, responsavel)
      VALUES ($1, $2, $3, $4)
    `, [tipo, codigo, quantidade, responsavel]);

    await cliente.query('COMMIT');
    res.json({ sucesso: true, novaQuantidade });

  } catch (err) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ erro: err.message });
  } finally {
    cliente.release();
  }
});

// Excluir produto
app.delete('/api/produtos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    await pool.query('DELETE FROM produtos WHERE codigo = $1', [codigo]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Relatório de movimentações
app.get('/api/movimentacoes', async (req, res) => {
  try {
    const { inicio, fim, categoria } = req.query;
    let consulta = `
      SELECT m.*, p.nome, p.categoria, p.preco_unitario
      FROM movimentacoes m
      JOIN produtos p ON m.produto_codigo = p.codigo
      WHERE 1=1
    `;
    const parametros = [];
    let contador = 1;

    if (inicio) {
      parametros.push(inicio);
      consulta += ` AND DATE(m.data_hora) >= $${contador}`;
      contador++;
    }
    if (fim) {
      parametros.push(fim);
      consulta += ` AND DATE(m.data_hora) <= $${contador}`;
      contador++;
    }
    if (categoria) {
      parametros.push(categoria);
      consulta += ` AND p.categoria = $${contador}`;
      contador++;
    }

    consulta += ' ORDER BY m.data_hora DESC';

    const resultado = await pool.query(consulta, parametros);
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Relatório resumido
app.get('/api/resumo', async (req, res) => {
  try {
    const totalProdutos = await pool.query('SELECT COUNT(*) FROM produtos');
    const totalQuantidade = await pool.query('SELECT SUM(quantidade) FROM produtos');
    const totalValor = await pool.query('SELECT SUM(quantidade * preco_unitario) FROM produtos');

    res.json({
      total_produtos: parseInt(totalProdutos.rows[0].count) || 0,
      total_quantidade: parseInt(totalQuantidade.rows[0].sum) || 0,
      total_valor: parseFloat(totalValor.rows[0].sum) || 0
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicia o servidor
app.listen(PORTA, () => {
  console.log(🚀 Servidor rodando na porta ${PORTA});
});