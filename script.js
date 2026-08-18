// ========== BUSCAR PRODUTO ==========
async function buscarProduto() {
  const codigo = document.getElementById('codigoProd').value;
  if (!codigo) return;
  const res = await fetch('/api/produtos/' + codigo);
  const prod = await res.json();
  if (prod) {
    document.getElementById('nomeProd').value = prod.nome || '';
    document.getElementById('categoriaProd').value = prod.categoria || '';
    document.getElementById('precoProd').value = prod.preco_unitario || '';
  } else {
    document.getElementById('nomeProd').value = '';
    document.getElementById('categoriaProd').value = '';
    document.getElementById('precoProd').value = '';
  }
}

// ========== REGISTRAR MOVIMENTAÇÃO ==========
async function registrarMovimentacao() {
  const dados = {
    codigo: document.getElementById('codigoProd').value,
    tipo: document.getElementById('tipoMov').value,
    quantidade: document.getElementById('qtdProd').value,
    responsavel: document.getElementById('responsavel').value
  };
  if (!dados.codigo || !dados.quantidade || !dados.responsavel) {
    alert('Preencha todos os campos!'); return;
  }
  const res = await fetch('/api/movimentacao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  const r = await res.json();
  if (r.erro) alert(r.erro);
  else {
    alert('Sucesso! Qtd: ' + r.novaQuantidade);
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

// ========== CADASTRAR PRODUTO ==========
async function cadastrarProduto() {
  const dados = {
    codigo: document.getElementById('codigoNovo').value,
    nome: document.getElementById('nomeNovo').value,
    categoria: document.getElementById('categoriaNova').value,
    preco_unitario: document.getElementById('precoNovo').value || 0,
    quantidade: 0
  };
  if (!dados.codigo || !dados.nome || !dados.categoria) {
    alert('Código, Nome e Categoria são obrigatórios!'); return;
  }
  const res = await fetch('/api/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  const r = await res.json();
  if (r.erro) alert(r.erro);
  else {
    alert('Cadastrado!');
    atualizarTudo();
    limparCad();
    carregarCategorias();
  }
}

function limparCad() {
  document.getElementById('codigoNovo').value = '';
  document.getElementById('nomeNovo').value = '';
  document.getElementById('categoriaNova').value = '';
  document.getElementById('precoNovo').value = '';
}

// ========== CARREGAR CATEGORIAS ==========
async function carregarCategorias() {
  const sel = document.getElementById('filtroCategoria');
  if (!sel) return;
  const res = await fetch('/api/produtos');
  const prods = await res.json();
  const cats = [];
  for (let p of prods) if (p.categoria && !cats.includes(p.categoria)) cats.push(p.categoria);
  sel.innerHTML = '<option value="">Todas</option>';
  for (let c of cats) sel.innerHTML += '<option value="' + c + '">' + c + '</option>';
}

// ========== CARREGAR TABELAS ==========
async function carregarProdutos() {
  const tb = document.querySelector('#tabela-prod tbody');
  if (!tb) return;
  tb.innerHTML = '';
  const res = await fetch('/api/produtos');
  const prods = await res.json();
  for (let p of prods) {
    const preco = Number(p.preco_unitario || 0).toFixed(2);
    const total = (p.quantidade * (p.preco_unitario || 0)).toFixed(2);
    tb.innerHTML += '<tr>' +
      '<td>' + p.codigo + '</td>' +
      '<td>' + p.nome + '</td>' +
      '<td>' + p.categoria + '</td>' +
      '<td>R$ ' + preco + '</td>' +
      '<td>' + p.quantidade + '</td>' +
      '<td>R$ ' + total + '</td></tr>';
  }
}

async function atualizarEstoque() {
  const tb = document.querySelector('#tabela-estoque tbody');
  if (!tb) return;
  tb.innerHTML = '';
  const res = await fetch('/api/produtos');
  const prods = await res.json();
  for (let p of prods) {
    const preco = Number(p.preco_unitario || 0).toFixed(2);
    const total = (p.quantidade * (p.preco_unitario || 0)).toFixed(2);
    const dt = p.data_criacao ? p.data_criacao.substring(0, 10) : '-';
    tb.innerHTML += '<tr>' +
      '<td>' + p.codigo + '</td>' +
      '<td>' + p.nome + '</td>' +
      '<td>' + p.categoria + '</td>' +
      '<td>R$ ' + preco + '</td>' +
      '<td>' + p.quantidade + '</td>' +
      '<td>R$ ' + total + '</td>' +
      '<td>' + dt + '</td>' +
      '<td><button onclick="excluirProd(' + p.codigo + ')">Excluir</button></td></tr>';
  }
}

async function excluirProd(cod) {
  if (!confirm('Excluir?')) return;
  await fetch('/api/produtos/' + cod, { method: 'DELETE' });
  alert('Excluído!');
  atualizarTudo();
  carregarCategorias();
}

// ========== RESUMO ==========
async function atualizarResumo() {
  const res = await fetch('/api/resumo');
  const r = await res.json();
  document.getElementById('r-total-itens').textContent = r.total_produtos || 0;
  document.getElementById('r-qtd-total').textContent = r.total_quantidade || 0;
  document.getElementById('r-valor-total').textContent = Number(r.total_valor || 0).toFixed(2);

  const movRes = await fetch('/api/movimentacoes');
  const movs = await movRes.json();
  let ent = 0, sai = 0;
  if (movs && movs.length) {
    for (let m of movs) {
      if (m.tipo === 'entrada') ent += Number(m.quantidade);
      else sai += Number(m.quantidade);
    }
  }
  document.getElementById('r-entradas').textContent = ent;
  document.getElementById('r-saidas').textContent = sai;
}

// ========== MOSTRAR/OCULTAR ==========
let visProd = true;
function mostrarOcultarProdutos() {
  visProd = !visProd;
  const el = document.getElementById('sec-produtos');
  if (el) el.style.display = visProd ? 'block' : 'none';
}

let visEst = true;
function mostrarOcultarEstoque() {
  visEst = !visEst;
  const el = document.getElementById('tabela-estoque');
  if (el) el.style.display = visEst ? 'table' : 'none';
}

// ========== RELATÓRIOS — TODOS FUNCIONANDO ==========
async function relatorioCompleto() {
  console.log('→ Relatório Completo');
  const res = await fetch('/api/movimentacoes');
  const dados = await res.json();
  mostrarRel(dados, 'Relatório Completo');
}

async function historicoMovimentacoes() {
  console.log('→ Histórico de Movimentações');
  const res = await fetch('/api/movimentacoes');
  const dados = await res.json();
  mostrarRel(dados, 'Histórico de Movimentações');
}

async function filtrarPorCategoria() {
  const sel = document.getElementById('filtroCategoria');
  if (!sel) return;
  const cat = sel.value;
  let url = '/api/movimentacoes';
  if (cat) url += '?categoria=' + encodeURIComponent(cat);
  console.log('→ Filtrar por categoria:', cat);
  const res = await fetch(url);
  const dados = await res.json();
  mostrarRel(dados, 'Categoria: ' + (cat || 'Todas'));
}

async function gerarRelatorioPeriodo() {
  const ini = document.getElementById('dataInicio').value;
  const fim = document.getElementById('dataFim').value;
  console.log('→ Período:', ini, 'a', fim);
  let url = '/api/movimentacoes?';
  if (ini) url += 'inicio=' + ini + '&';
  if (fim) url += 'fim=' + fim;
  const res = await fetch(url);
  const dados = await res.json();
  mostrarRel(dados, 'Período: ' + ini + ' a ' + fim);
}

function mostrarRel(dados, titulo) {
  const div = document.getElementById('conteudo-relatorio');
  if (!div) {
    alert('Área de relatório não encontrada!');
    return;
  }

  let html = '<h3 style="margin:0 0 15px 0; color:#1e3a8a;">' + titulo + '</h3>';

  if (!dados || !dados.length) {
    html += '<p style="padding:15px; background:#f3f4f6; border-radius:6px;">Nenhuma movimentação encontrada.</p>';
  } else {
    html += '<table style="width:100%; border-collapse:collapse;">' +
      '<tr style="background:#1e3a8a; color:white;">' +
      '<th style="padding:10px; text-align:left;">Data</th>' +
      '<th style="padding:10px; text-align:left;">Tipo</th>' +
      '<th style="padding:10px; text-align:left;">Produto</th>' +
      '<th style="padding:10px; text-align:left;">Qtd</th>' +
      '<th style="padding:10px; text-align:left;">Responsável</th>' +
      '<th style="padding:10px; text-align:left;">Categoria</th>' +
      '</tr>';
    for (let i = 0; i < dados.length; i++) {
      const m = dados[i];
      const dt = m.data_hora ? m.data_hora.substring(0, 10) : '-';
      const cor = m.tipo === 'entrada' ? '#dcfce7' : '#fee2e2';
      html += '<tr style="background:' + cor + ';">' +
        '<td style="padding:8px; border-bottom:1px solid #ddd;">' + dt + '</td>' +
        '<td style="padding:8px; border-bottom:1px solid #ddd;">' + m.tipo + '</td>' +
        '<td style="padding:8px; border-bottom:1px solid #ddd;">' + (m.nome || '-') + '</td>' +
        '<td style="padding:8px; border-bottom:1px solid #ddd;">' + m.quantidade + '</td>' +
        '<td style="padding:8px; border-bottom:1px solid #ddd;">' + (m.responsavel || '-') + '</td>' +
        '<td style="padding:8px; border-bottom:1px solid #ddd;">' + (m.categoria || '-') + '</td>' +
        '</tr>';
    }
    html += '</table>';
  }

  div.innerHTML = html;
  console.log('✅ Relatório exibido!');
}

// ========== GERAL ==========
function atualizarTudo() {
  carregarProdutos();
  atualizarEstoque();
  atualizarResumo();
  carregarCategorias();
}

function sair() {
  window.location.href = 'login.html';
}

window.onload = atualizarTudo;

// ========== IMPRIMIR RELATÓRIO ==========
function imprimirRelatorio() {
  const conteudo = document.getElementById('conteudo-relatorio').innerHTML;
  if (!conteudo || conteudo.length < 20) {
    alert('Gere um relatório primeiro antes de imprimir!');
    return;
  }

  const janela = window.open('', '', 'width=800,height=600');
  janela.document.write(`
    <html>
    <head>
      <title>Relatório de Estoque</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        h2 { color: #1e3a8a; border-bottom: 2px solid #ddd; padding-bottom:10px; }
        table { width:100%; border-collapse:collapse; margin-top:15px; }
        th, td { padding:10px; text-align:left; border-bottom:1px solid #ddd; }
        th { background:#1e3a8a; color:white; }
        .rodape { margin-top:30px; text-align:right; font-size:12px; color:#666; }
      </style>
    </head>
    <body>
      <h2>Relatório de Controle de Estoque</h2>
      ${conteudo}
      <div class="rodape">
        Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
      </div>
      <script>window.onload = function() { window.print(); };<\/script>
    </body>
    </html>
  `);
  janela.document.close();
}