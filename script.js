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
    alert('Sucesso! Quantidade: ' + resultado.novaQuantidade);
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
  const produtos = await res.json();
  const categorias = [];

  for (let i = 0; i < produtos.length; i++) {
    const cat = produtos[i].categoria;
    if (cat && !categorias.includes(cat)) {
      categorias.push(cat);
    }
  }

  sel.innerHTML = '<option value="">Todas</option>';
  for (let i = 0; i < categorias.length; i++) {
    sel.innerHTML += '<option value="' + categorias[i] + '">' + categorias[i] + '</option>';
  }
}

// ========== CARREGAR PRODUTOS ==========
async function carregarProdutos() {
  const tb = document.querySelector('#tabela-produtos tbody');
  if (!tb) return;
  tb.innerHTML = '';

  const res = await fetch('/api/produtos');
  const produtos = await res.json();

  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i];
    const preco = Number(p.preco_unitario || 0).toFixed(2);
    const total = (p.quantidade * (p.preco_unitario || 0)).toFixed(2);
    tb.innerHTML += '<tr>' +
      '<td>' + p.codigo + '</td>' +
      '<td>' + p.nome + '</td>' +
      '<td>' + p.categoria + '</td>' +
      '<td>R$ ' + preco + '</td>' +
      '<td>' + p.quantidade + '</td>' +
      '<td>R$ ' + total + '</td>' +
      '</tr>';
  }
}

// ========== ATUALIZAR ESTOQUE ==========
async function atualizarEstoque() {
  const tb = document.querySelector('#tabela-estoque tbody');
  if (!tb) return;
  tb.innerHTML = '';

  const res = await fetch('/api/produtos');
  const produtos = await res.json();

  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i];
    const preco = Number(p.preco_unitario || 0).toFixed(2);
    const total = (p.quantidade * (p.preco_unitario || 0)).toFixed(2);
    const data = p.data_criacao ? p.data_criacao.substring(0, 10) : '-';
    tb.innerHTML += '<tr>' +
      '<td>' + p.codigo + '</td>' +
      '<td>' + p.nome + '</td>' +
      '<td>' + p.categoria + '</td>' +
      '<td>R$ ' + preco + '</td>' +
      '<td>' + p.quantidade + '</td>' +
      '<td>R$ ' + total + '</td>' +
      '<td>' + data + '</td>' +
      '<td><button onclick="excluirProd(' + p.codigo + ')">Excluir</button></td>' +
      '</tr>';
  }
}

// ========== EXCLUIR PRODUTO ==========
async function excluirProd(codigo) {
  if (!confirm('Excluir produto?')) return;
  await fetch('/api/produtos/' + codigo, { method: 'DELETE' });
  alert('Excluído!');
  atualizarTudo();
  carregarCategorias();
}

// ========== RELATÓRIO RESUMIDO ==========
async function atualizarResumo() {
  const res = await fetch('/api/resumo');
  const r = await res.json();

  const totalItens = r.total_produtos || 0;
  const totalQtd = r.total_quantidade || 0;
  const totalValor = r.total_valor || 0;

  document.getElementById('r-total-itens').textContent = totalItens;
  document.getElementById('r-qtd-total').textContent = totalQtd;
  document.getElementById('r-valor-total').textContent = Number(totalValor).toFixed(2);

  const movRes = await fetch('/api/movimentacoes');
  const movs = await movRes.json();
  let ent = 0;
  let sai = 0;

  if (movs && movs.length > 0) {
    for (let i = 0; i < movs.length; i++) {
      if (movs[i].tipo === 'entrada') {
        ent += Number(movs[i].quantidade);
      } else {
        sai += Number(movs[i].quantidade);
      }
    }
  }

  document.getElementById('r-entradas').textContent = ent;
  document.getElementById('r-saidas').textContent = sai;
}

// ========== MOSTRAR / OCULTAR ==========
let visivelProd = true;
function mostrarOcultarProdutos() {
  visivelProd = !visivelProd;
  const sec = document.getElementById('sec-produtos');
  if (sec) sec.style.display = visivelProd ? 'block' : 'none';
}

let visivelEst = true;
function mostrarOcultarEstoque() {
  visivelEst = !visivelEst;
  const tb = document.getElementById('tabela-estoque');
  if (tb) tb.style.display = visivelEst ? 'table' : 'none';
}

// ========== RELATÓRIOS ==========
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
  const sel = document.getElementById('filtroCategoria');
  if (!sel) return;
  const cat = sel.value;
  let url = '/api/movimentacoes';
  if (cat) {
    url = url + '?categoria=' + encodeURIComponent(cat);
  }

  const res = await fetch(url);
  const dados = await res.json();
  mostrarRel(dados, 'Categoria: ' + (cat || 'Todas'));
}

async function gerarRelatorioPeriodo() {
  const ini = document.getElementById('dataInicio').value;
  const fim = document.getElementById('dataFim').value;
  let url = '/api/movimentacoes?';
  if (ini) {
    url = url + 'inicio=' + ini + '&';
  }
  if (fim) {
    url = url + 'fim=' + fim;
  }

  const res = await fetch(url);
  const dados = await res.json();
  mostrarRel(dados, 'Período: ' + ini + ' a ' + fim);
}

function mostrarRel(dados, titulo) {
  const div = document.getElementById('conteudo-relatorio');
  if (!div) return;

  div.style.display = 'block';
  let html = '<h3>' + titulo + '</h3>';

  if (!dados || dados.length === 0) {
    html += '<p style="padding:15px;background:#f0f0f0;border-radius:4px;">Nenhuma movimentação encontrada</p>';
  } else {
    html += '<table border="1" cellpadding="8" style="width:100%;margin-top:10px;border-collapse:collapse;">' +
      '<tr style="background:#eee;">' +
      '<th>Data</th><th>Tipo</th><th>Produto</th><th>Qtd</th><th>Resp.</th><th>Categ.</th>' +
      '</tr>';

    for (let i = 0; i < dados.length; i++) {
      const m = dados[i];
      const data = m.data_hora ? m.data_hora.substring(0, 10) : '-';
      html += '<tr>' +
        '<td>' + data + '</td>' +
        '<td>' + m.tipo + '</td>' +
        '<td>' + (m.nome || '-') + '</td>' +
        '<td>' + m.quantidade + '</td>' +
        '<td>' + (m.responsavel || '-') + '</td>' +
        '<td>' + (m.categoria || '-') + '</td>' +
        '</tr>';
    }
    html += '</table>';
  }

  div.innerHTML = html;
}

// ========== ATUALIZAR TUDO ==========
function atualizarTudo() {
  carregarProdutos();
  atualizarEstoque();
  atualizarResumo();
  carregarCategorias();
}

// ========== SAIR ==========
function sair() {
  localStorage.removeItem('logado');
  window.location.href = 'login.html';
}

// ========== INICIAR ==========
window.onload = function() {
  atualizarTudo();
};

// ========== 1. RELATÓRIO COMPLETO ==========
async function relatorioCompleto() {
  console.log('→ Gerando Relatório Completo...');
  const res = await fetch('/api/movimentacoes');
  const dados = await res.json();
  mostrarRel(dados, 'Relatório Completo');
}

// ========== 2. HISTÓRICO DE MOVIMENTAÇÕES ==========
async function historicoMovimentacoes() {
  console.log('→ Gerando Histórico...');
  const res = await fetch('/api/movimentacoes');
  const dados = await res.json();
  mostrarRel(dados, 'Histórico de Movimentações');
}

// ========== 3. FILTRAR POR CATEGORIA ==========
async function filtrarPorCategoria() {
  const sel = document.getElementById('filtroCategoria');
  if (!sel) return;
  const cat = sel.value;
  let url = '/api/movimentacoes';
  if (cat) url += '?categoria=' + encodeURIComponent(cat);
  console.log('→ Filtrando por categoria:', cat);
  const res = await fetch(url);
  const dados = await res.json();
  mostrarRel(dados, 'Categoria: ' + (cat || 'Todas'));
}

// ========== 4. RELATÓRIO POR PERÍODO ==========
async function gerarRelatorioPeriodo() {
  const ini = document.getElementById('dataInicio').value;
  const fim = document.getElementById('dataFim').value;
  console.log('→ Período:', ini, 'até', fim);
  let url = '/api/movimentacoes?';
  if (ini) url += 'inicio=' + ini + '&';
  if (fim) url += 'fim=' + fim;
  const res = await fetch(url);
  const dados = await res.json();
  mostrarRel(dados, 'Período: ' + ini + ' a ' + fim);
}

// ========== 5. EXIBIR O RELATÓRIO NA TELA ==========
function mostrarRel(dados, titulo) {
  const div = document.getElementById('conteudo-relatorio');
  if (!div) {
    alert('ERRO: Área de relatório não encontrada no HTML!');
    return;
  }

  console.log('Exibindo relatório:', titulo, dados);
  
  let html = '<h3 style="margin:0 0 15px 0; color:#1e3a8a;">' + titulo + '</h3>';

  if (!dados || !dados.length) {
    html += '<p style="padding:15px; background:#f3f4f6; border-radius:6px;">Nenhuma movimentação encontrada.</p>';
  } else {
    html += '<table style="width:100%; border-collapse:collapse;">' +
      '<tr style="background:#1e3a8a; color:white;">' +
      '<th style="padding:10px; text-align:left;">Data</th>' +
      '<th style="padding:10px; text-align:left;">Tipo</th>' +
      '<th style="padding:10px; text-align:left;">Produto</th>' +
      '<th style="padding:10px; text-align:left;">Quantidade</th>' +
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

// ========== 6. IMPRIMIR / SALVAR EM PDF ==========
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

// ========== EXPORTAR PARA EXCEL ==========
async function exportarParaExcel() {
  try {
    const res = await fetch('/api/produtos');
    const produtos = await res.json();

    if (!produtos || produtos.length === 0) {
      alert('Nenhum produto cadastrado!');
      return;
    }

    let csv = '\uFEFF';
    csv += 'Código;Produto;Categoria;Preço;Quantidade;Total\n';

    for (let i = 0; i < produtos.length; i++) {
      const p = produtos[i];
      const total = (p.quantidade * (p.preco_unitario || 0)).toFixed(2);
      csv += p.codigo + ';"' + p.nome + '";"' + p.categoria + '";' + p.preco_unitario + ';' + p.quantidade + ';' + total + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estoque.csv';
    a.click();
    URL.revokeObjectURL(url);

    alert('✅ ' + produtos.length + ' produtos exportados!');
  } catch (erro) {
    alert('Erro ao exportar: ' + erro.message);
  }
}

// ========== IMPORTAR DO EXCEL ==========
async function importarDoExcel(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  if (!confirm('Importar produtos?\n\nFormato: Código;Nome;Categoria;Preço')) {
    event.target.value = '';
    return;
  }

  const leitor = new FileReader();
  leitor.onload = async function(e) {
    const conteudo = e.target.result;
    const linhas = conteudo.split('\n');
    let importados = 0;
    let erros = 0;

    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      const partes = linha.includes(';') ? linha.split(';') : linha.split(',');
      
      const codigo = (partes[0] || '').trim().replace(/"/g, '');
      const nome = (partes[1] || '').trim().replace(/"/g, '');
      const categoria = (partes[2] || '').trim().replace(/"/g, '');
      const preco = (partes[3] || '').trim().replace(/"/g, '').replace(',', '.');

      if (!codigo || !nome) {
        erros++;
        continue;
      }

      try {
        await fetch('/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: codigo,
            nome: nome,
            categoria: categoria || 'Sem Categoria',
            preco_unitario: parseFloat(preco) || 0,
            quantidade: 0
          })
        });
        importados++;
      } catch {
        erros++;
      }
    }

    alert('✅ Pronto!\nImportados: ' + importados + '\nErros: ' + erros);
    
    if (typeof atualizarTudo === 'function') {
      atualizarTudo();
    }
    
    event.target.value = '';
  };

  leitor.readAsText(arquivo, 'UTF-8');
}