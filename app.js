/ ==============================================
// INICIAR SERVIDOR PRIMEIRO, DEPOIS CONECTAR BANCO
// ==============================================
function iniciarServidor() {
  app.listen(PORTA, () => {
    console.log('✅ Servidor rodando na porta ' + PORTA);
    console.log('✅ Aguardando banco de dados...');
  });
}

// LIGA O SERVIDOR JÁ!
iniciarServidor();

// DEPOIS TENTA CONECTAR NO BANCO
async function conectarBanco() {
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Conectado ao Banco Permanente!');
    await criarTabelas();
    console.log('✅ Sistema Pronto! Dados salvos para SEMPRE! 🎉');
  } catch (erro) {
    console.log('⚠️ Aguardando banco... tentando em 10 segundos');
    setTimeout(conectarBanco, 10000);
  }
}

async function criarTabelas() {
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
}

conectarBanco();
