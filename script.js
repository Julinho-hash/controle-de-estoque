// ==========================================
// CONFIGURAÇÕES GERAIS
// ==========================================
const SENHA_SISTEMA = "estoque123";
let produtos = [];

// ==========================================
// ATUALIZAR TABELA DE PRODUTOS NA TELA
// ==========================================
function atualizarListaProdutos() {
  const tabela = document.querySelector('#tabelaEstoque tbody');
  if (!tabela) return;

  tabela.innerHTML = '';

  produtos.forEach(p => {
    const totalItem = (p.quantidade * p.preco).toFixed(2);
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.nome}</td>
      <td>${p.categoria}</td>
      <td>R$ ${p.preco.toFixed(2)}</td>
      <td>${p.quantidade}</td>
      <td>R$ ${totalItem}</td>
      <td>${p.ultima_atualizacao || '-'}</td>
      <td>
        <button class="botao-excluir" onclick="excluirProduto(${p.codigo})">Excluir</button>
      </td>
    `;
    tabela.appendChild(linha);
  });

  atualizarRelatorioResumido();
}

// ==========================================
// ATUALIZAR RELATÓRIO RESUMIDO
// ==========================================
function atualizarRelatorioResumido() {
  let qtdTotal = 0;
  let valorTotal = 0;

  produtos.forEach(p => {
    qtdTotal += p.quantidade;
    valorTotal += p.quantidade * p.preco;
  });

  const el = id => document.getElementById(id);
  if (el('res_totalItens')) el('res_totalItens').textContent = produtos.length;
  if (el('res_qtdTotal')) el('res_qtdTotal').textContent = qtdTotal;
  if (el('res_valorTotal')) el('res_valorTotal').textContent = valorTotal.toFixed(2);
}

// ==========================================
// PREENCHER LISTA DE CÓDIGOS
// ==========================================
function preencherListaCodigos() {
  const lista = document.getElementById('lista-codigos');
  if (!lista) return;

  lista.innerHTML = '';
  produtos.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.codigo + ' | ' + p.nome + ' | ' + p.categoria + ' | R$ ' + p.preco.toFixed(2);
    lista.appendChild(li);
  });
}

// ==========================================
// MOSTRAR/OCULTAR LISTA DE PRODUTOS
// ==========================================
function mostrarOcultarLista() {
  const area = document.getElementById('areaListaProdutos');
  if (!area) return;

  if (area.style.display === 'none' || area.style.display === '') {
    area.style.display = 'block';
    preencherListaCodigos();
  } else {
    area.style.display = 'none';
  }
}

// ==========================================
// MOSTRAR/OCULTAR TABELA DE ESTOQUE
// ==========================================
function mostrarOcultarEstoque() {
  const area = document.getElementById('areaEstoqueAtual');
  if (!area) return;

  if (area.style.display === 'none' || area.style.display === '') {
    area.style.display = 'block';
  } else {
    area.style.display = 'none';
  }
}

// ==========================================
// BUSCAR PRODUTO PELO CÓDIGO
// ==========================================
function buscarProdutoPorCodigo() {
  const codigo = parseInt(document.getElementById('codigoMov').value);
  if (!codigo) {
    document.getElementById('prod').value = '';
    document.getElementById('cat').value = '';
    document.getElementById('preco').value = '';
    return;
  }

  const produto = produtos.find(p => p.codigo === codigo);
  if (produto) {
    document.getElementById('prod').value = produto.nome;
    document.getElementById('cat').value = produto.categoria;
    document.getElementById('preco').value = produto.preco.toFixed(2);
  } else {
    document.getElementById('prod').value = '';
    document.getElementById('cat').value = '';
    document.getElementById('preco').value = '';
  }
}

// ==========================================
// CARREGAR CATEGORIAS NO SELECT
// ==========================================
function carregarCategorias() {
  fetch('/api/categorias')
    .then(res => res.json())
    .then(listaCategorias => {
      const select = document.getElementById('categoriaFiltro');
      if (!select) return;

      select.innerHTML = '<option value="">Escolha Categoria</option>';
      listaCategorias.forEach(cat => {
        const opcao = document.createElement('option');
        opcao.value = cat;
        opcao.textContent = cat;
        select.appendChild(opcao);
      });
    })
    .catch(err => console.log('Erro ao carregar categorias:', err));
}

// ==========================================
// ATUALIZAR DADOS DO BANCO
// ==========================================
function atualizarDoBanco() {
  fetch('/api/produtos')
    .then(res => res.json())
    .then(dados => {
      produtos = dados;
      atualizarListaProdutos();
      preencherListaCodigos();
      carregarCategorias();
    })
    .catch(err => console.log('Erro:', err));
}

// ==========================================
// LOGIN
// ==========================================
function verificarLogin() {
  const senha = document.getElementById('senha').value;
  if (senha === SENHA_SISTEMA) {
    document.getElementById('telaLogin').style.display = 'none';
    document.getElementById('sistemaPrincipal').style.display = 'block';
    atualizarDoBanco();
  } else {
    document.getElementById('avisoErro').style.display = 'block';
    document.getElementById('senha').value = '';
  }
}

// ==========================================
// SAIR DO SISTEMA
// ==========================================
function sairDoSistema() {
  if (confirm('Deseja realmente sair?')) {
    document.getElementById('sistemaPrincipal').style.display = 'none';
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('senha').value = '';
    document.getElementById('avisoErro').style.display = 'none';
  }
}

// ==========================================
// CADASTRAR PRODUTO
// ==========================================
function cadastrarProduto() {
  const codigo = parseInt(document.getElementById('novoCodigo').value);
  const nome = document.getElementById('novoNome').value.toUpperCase();
  const categoria = document.getElementById('novaCategoria').value.toUpperCase();
  const preco = parseFloat(document.getElementById('novoPreco').value);

  if (!codigo || !nome || !categoria || !preco) {
    alert('Preencha TODOS os campos!');
    return;
  }

  fetch('/api/produtos', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ codigo, nome, categoria, preco })
  })
  .then(res => res.json())
  .then(dados => {
    if (dados.erro) {
      alert(dados.erro);
      return;
    }
    alert('Produto cadastrado com sucesso!');
    atualizarDoBanco();
    document.getElementById('novoCodigo').value = '';
    document.getElementById('novoNome').value = '';
    document.getElementById('novaCategoria').value = '';
    document.getElementById('novoPreco').value = '';
  })
  .catch(err => alert('Erro: ' + err));
}

// ==========================================
// REGISTRAR MOVIMENTAÇÃO
// ==========================================
function registrarMovimentacao() {
  const codigo = parseInt(document.getElementById('codigoMov').value);
  const quantidade = parseInt(document.getElementById('qtdMov').value);
  const tipo = document.getElementById('tipoMov').value;
  const responsavel = document.getElementById('respMov').value;

  if (!codigo || !quantidade || !responsavel) {
    alert('Preencha todos os campos!');
    return;
  }

  fetch('/api/movimentacao', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ codigo, quantidade, tipo, responsavel })
  })
  .then(res => res.json())
  .then(dados => {
    if (dados.erro) {
      alert(dados.erro);
      return;
    }
    alert('Movimentação registrada!');
    atualizarDoBanco();
    document.getElementById('codigoMov').value = '';
    document.getElementById('prod').value = '';
    document.getElementById('cat').value = '';
    document.getElementById('preco').value = '';
    document.getElementById('qtdMov').value = '';
    document.getElementById('respMov').value = '';
  })
  .catch(err => alert('Erro: ' + err));
}

// ==========================================
// EXCLUIR PRODUTO
// ==========================================
function excluirProduto(codigo) {
  if (!confirm('Deseja excluir este produto?')) return;
  alert('Função de exclusão - código: ' + codigo);
  atualizarDoBanco();
}

// ==========================================
// RELATÓRIO COMPLETO
// ==========================================
function gerarRelatorioCompleto() {
  if (!produtos || produtos.length === 0) {
    alert('Nenhum produto cadastrado!');
    return;
  }

  let qtdTotal = 0;
  let valorTotal = 0;

  produtos.forEach(p => {
    qtdTotal += p.quantidade;
    valorTotal += p.quantidade * p.preco;
  });

  alert(
'===== RELATÓRIO COMPLETO =====\n\n' +
'Total de Itens: ' + produtos.length + '\n' +
'Quantidade Total: ' + qtdTotal + '\n' +
'Valor Total: R$ ' + valorTotal.toFixed(2)
  );
}

// ==========================================
// RELATÓRIO POR CATEGORIA
// ==========================================
function gerarRelatorioPorCategoria() {
  const select = document.getElementById('categoriaFiltro');
  if (!select) {
    alert('Campo de categoria não encontrado!');
    return;
  }

  const catEscolhida = select.value;
  if (!catEscolhida) {
    alert('Escolha uma categoria primeiro!');
    return;
  }

  const filtrados = produtos.filter(p => p.categoria === catEscolhida);
  let qtdTotal = 0;
  let valorTotal = 0;

  filtrados.forEach(p => {
    qtdTotal += p.quantidade;
    valorTotal += p.quantidade * p.preco;
  });

  alert(
'===== ' + catEscolhida.toUpperCase() + ' =====\n\n' +
'Produtos: ' + filtrados.length + '\n' +
'Quantidade: ' + qtdTotal + '\n' +
'Valor Total: R$ ' + valorTotal.toFixed(2)
  );
}

// ==========================================
// HISTÓRICO DE MOVIMENTAÇÕES
// ==========================================
function gerarRelatorioMovimentacoes() {
  fetch('/api/movimentacoes')
    .then(res => res.json())
    .then(dados => {
      if (!dados || dados.length === 0) {
        alert('Nenhuma movimentação registrada!');
        return;
      }

      let texto =
'===== HISTÓRICO DE MOVIMENTAÇÕES =====\n' +
'Total de registros: ' + dados.length + '\n\n' +
'Cód | Produto         | Tipo     | Qtd | Responsável      | Data/Hora\n' +
'-----------------------------------------------------------------------\n';

      dados.forEach(m => {
        const tipoTexto = m.tipo === 'entrada' ? 'ENTRADA' :
                          m.tipo === 'saida' ? 'SAÍDA  ' : 'EXCLUSÃO';
        const data = m.data ? m.data.replace('T', ' ').substring(0, 19) : '-';
        texto +=
String(m.codigo_produto).padStart(3, ' ') + ' | ' +
(m.nome || 'DESCONHECIDO').padEnd(15) + ' | ' +
tipoTexto + ' | ' +
String(m.quantidade).padStart(3, ' ') + ' | ' +
(m.responsavel || '-').padEnd(16) + ' | ' + data + '\n';
      });

      alert(texto);
    })
    .catch(err => alert('Erro ao carregar relatório: ' + err));
}

// ==========================================
// RELATÓRIO POR PERÍODO
// ==========================================
function gerarRelatorioPorPeriodo() {
  const inicio = document.getElementById('dataInicio').value;
  const fim = document.getElementById('dataFim').value;

  if (!inicio || !fim) {
    alert('Preencha a Data de Início e a Data de Fim!');
    return;
  }

  fetch('/api/movimentacoes-periodo?inicio=' + inicio + '&fim=' + fim)
    .then(res => res.json())
    .then(dados => {
      if (!dados || dados.length === 0) {
        alert('Nenhuma movimentação encontrada entre ' + inicio + ' e ' + fim + '!');
        return;
      }

      let totalEntradas = 0;
      let totalSaidas = 0;

      let texto =
'===== RELATÓRIO POR PERÍODO =====\n' +
'Período: ' + inicio + ' até ' + fim + '\n' +
'Total de registros: ' + dados.length + '\n\n' +
'Cód | Produto         | Tipo     | Qtd | Responsável      | Data/Hora\n' +
'-----------------------------------------------------------------------\n';

      dados.forEach(m => {
        const tipoTexto = m.tipo === 'entrada' ? 'ENTRADA' :
                          m.tipo === 'saida' ? 'SAÍDA  ' : 'EXCLUSÃO';

        if (m.tipo === 'entrada') totalEntradas += m.quantidade;
        if (m.tipo === 'saida') totalSaidas += m.quantidade;

        const data = m.data ? m.data.replace('T', ' ').substring(0, 19) : '-';
        texto +=
String(m.codigo_produto).padStart(3, ' ') + ' | ' +
(m.nome || 'DESCONHECIDO').padEnd(15) + ' | ' +
tipoTexto + ' | ' +
String(m.quantidade).padStart(3, ' ') + ' | ' +
(m.responsavel || '-').padEnd(16) + ' | ' + data + '\n';
      });

      texto +=
'-----------------------------------------------------------------------\n' +
'TOTAIS DO PERÍODO:\n' +
'  Entradas: ' + totalEntradas + '\n' +
'  Saídas:   ' + totalSaidas + '\n' +
'  Saldo:    ' + (totalEntradas - totalSaidas);

      alert(texto);
    })
    .catch(err => alert('Erro ao carregar relatório: ' + err));
}

// ==========================================
// INICIALIZAÇÃO AO CARREGAR A PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  // Botões de login
  document.getElementById('btnEntrar').addEventListener('click', verificarLogin);
  document.getElementById('senha').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') verificarLogin();
  });

  // Botão de sair
  document.getElementById('btnSair').addEventListener('click', sairDoSistema);

  // Carrega categorias
  carregarCategorias();
});