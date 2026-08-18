// Buscar produto
async function buscarProduto() {
  const codigo = document.getElementById('codigoProd').value;
  if (!codigo) return;

  const res = await fetch('/api/produtos/' + codigo);
  const prod = await res.json();

  if (prod) {
    document.getElementById('nomeProd').value = prod.nome || '';
    document.getElementById('categoriaProd').value = prod.categoria || '';
    document.getElementById('precoProd').value = prod.preco_unitario || '';
  }
}

// Registrar movimentação
async function registrarMovimentacao() {
  const dados = {
    codigo: document.getElementById('codigoProd').value,
    tipo: document.getElementById('tipoMov').value,
    quantidade: document.getElementById('qtdProd').value,
    responsavel: document.getElementById('responsavel').value
  };

  if (!dados.codigo || !dados.quantidade || !dados.responsavel) {
    alert('Preencha todos os campos!');
    return;
  }

  const res = await fetch('/api/movimentacao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });

  const resultado = await res.json();
  if (resultado.erro) {
    alert(resultado.erro);
  } else {
    alert('Sucesso!');
    atualizarTudo();
    limparMov();
  }
}

function limparMov() {
  document.getElementById('codigoProd').value = '';
  document.getElementById('nomeProd').value = '';
  document.getElementById('categoriaProd').value = '';
  document.getElementById('precoProd').value = '';
  document.getElementById('qtdProd').value = '';
  document.getElementById('responsavel').value = '';
}

// Cadastrar produto
async function cadastrarProduto() {
  const dados = {
    codigo: document.getElementById('codigoNovo').value,
    nome: document.getElementById('nomeNovo').value,
    categoria: document.getElementById('categoriaNova').value,
    preco_unitario: document.getElementById('precoNovo').value,
    quantidade: 0
  };

  if (!dados.codigo || !dados.nome || !dados.categoria) {
    alert('Código, Nome e Categoria são obrigatórios!');
    return;
  }

  const res = await fetch('/api/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });

  const resultado = await res.json();
  if (resultado.erro) {
    alert(resultado.erro);
  } else {
    alert('Produto cadastrado!');
    atualizarTudo();
    limparCad();
  }
}

function limparCad() {
  document.getElementById('codigoNovo').value = '';
  document.getElementById('nomeNovo').value = '';
  document.getElementById('categoriaNova').value = '';
  document.getElementById('precoNovo').value = '';
}

// Carregar produtos
async function carregarProdutos() {
  const res = await fetch('/api/produtos');
  const produtos = await res.json();
  const tb = document.querySelector('#tabela-produtos tbody');
  tb.innerHTML = '';

  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i];
    tb.innerHTML += '<tr>' +
      '<td>' + p.codigo + '</td>' +
      '<td>' + p.nome + '</td>' +
      '<td>' + p.categoria + '</td>' +
      '<td>R$ ' + Number(p.preco_unitario).toFixed(2) + '</td>' +
      '<td>' + p.quantidade + '</td>' +
      '<td>R$ ' + (p.quantidade * p.preco_unitario).toFixed(2) + '</td>' +
      '</tr>';
  }
}

// Atualizar estoque
async function atualizarEstoque() {
  const res = await fetch('/api/produtos');
  const produtos = await res.json();
  const tb = document.querySelector('#tabela-estoque tbody');
  tb.innerHTML = '';

  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i];
    tb.innerHTML += '<tr>' +
      '<td>' + p.codigo + '</td>' +
      '<td>' + p.nome + '</td>' +
      '<td>' + p.categoria + '</td>' +
      '<td>R$ ' + Number(p.preco_unitario).toFixed(2) + '</td>' +
      '<td>' + p.quantidade + '</td>' +
      '<td>R$ ' + (p.quantidade * p.preco_unitario).toFixed(2) + '</td>' +
      '<td>' + (p.data_criacao || '-') + '</td>' +
      '<td><button class="btn-excluir" onclick="excluirProd(' + p.codigo + ')">Excluir</button></td>' +
      '</tr>';
  }
}

// Excluir produto
async function excluirProd(codigo) {
  if (!confirm('Excluir produto?')) return;
  await fetch('/api/produtos/' + codigo, { method: 'DELETE' });
  alert('Excluído!');
  atualizarTudo();
}

// Atualizar resumo
async function atualizarResumo() {
  const res = await fetch('/api/resumo');
  const r = await res.json();

  document.getElementById('r-total-itens').textContent = r.total_produtos;
  document.getElementById('r-qtd-total').textContent = r.total_quantidade;
  document.getElementById('r-valor-total').textContent = r.total_valor.toFixed(2);

  const movRes = await fetch('/api/movimentacoes');
  const movs = await movRes.json();
  let ent = 0;
  let sai = 0;
  for (let i = 0; i < movs.length; i++) {
    if (movs[i].tipo === 'entrada') ent += movs[i].quantidade;
    else sai += movs[i].quantidade;
  }
  document.getElementById('r-entradas').textContent = ent;
  document.getElementById('r-saidas').textContent = sai;
}

// Mostrar/Ocultar
let visivelProd = true;
function mostrarOcultarProdutos() {
  visivelProd = !visivelProd;
  document.getElementById('sec-produtos').style.display = visivelProd ? 'block' : 'none';
}

let visivelEst = true;
function mostrarOcultarEstoque() {
  visivelEst = !visivelEst;
  document.getElementById('tabela-estoque').style.display = visivelEst ? 'table' : 'none';
}

// Relatórios
async function relatorioCompleto() {
  const res = await fetch('/api/movimentacoes');
  const dados = await res.json();
  mostrarRel(dados, 'Relatório Completo');
}

async function historicoMovimentacoes() {
  const res = await fetch('/api/movimentacoes');
  const dados = await res.json();
  mostrarRel(dados, 'Histórico de Movimentações');
}

async function filtrarPorCategoria() {
  const cat = document.getElementById('filtroCategoria').value;
  let url = '/api/movimentacoes';
  if (cat) url = url + '?categoria=' + cat;

  const res = await fetch(url);
  const dados = await res.json();
  mostrarRel(dados, 'Categoria: ' + (cat || 'Todas'));
}

async function gerarRelatorioPeriodo() {
  const ini = document.getElementById('dataInicio').value;
  const fim = document.getElementById('dataFim').value;
  let url = '/api/movimentacoes?';
  if (ini) url = url + 'inicio=' + ini + '&';
  if (fim) url = url + 'fim=' + fim;

  const res = await fetch(url);
  const dados = await res.json();
  mostrarRel(dados, 'Período: ' + ini + ' a ' + fim);
}

function mostrarRel(dados, titulo) {
  const div = document.getElementById('conteudo-relatorio');
  div.style.display = 'block';
  let html = '<h3>' + titulo + '</h3><table border="1" cellpadding="8" style="width:100%;margin-top:10px;">' +
    '<tr><th>Data</th><th>Tipo</th><th>Produto</th><th>Qtd</th><th>Resp.</th><th>Categ.</th></tr>';

  if (dados.length === 0) {
    html += '<tr><td colspan="6">Nenhuma movimentação</td></tr>';
  } else {
    for (let i = 0; i < dados.length; i++) {
      const m = dados[i];
      const data = m.data_hora ? m.data_hora.substring(0,10) : '-';
      html += '<tr>' +
        '<td>' + data + '</td>' +
        '<td>' + m.tipo + '</td>' +
        '<td>' + m.nome + '</td>' +
        '<td>' + m.quantidade + '</td>' +
        '<td>' + m.responsavel + '</td>' +
        '<td>' + m.categoria + '</td>' +
        '</tr>';
    }
  }
  div.innerHTML = html + '</table>';
}

// Atualizar tudo
function atualizarTudo() {
  carregarProdutos();
  atualizarEstoque();
  atualizarResumo();
}

// Sair
function sair() {
  window.location.href = 'login.html';
}

// Iniciar
window.onload = function() {
  atualizarTudo();
};