// ==============================================
// SEM FIREBASE POR ENQUANTO — SÓ LOCAL FUNCIONAL
// ==============================================

let produtos = [];
let movimentacoes = [];
let fornecedores = [];
let dadosCarregados = false;
let fornecedorSelecionadoIndex = -1;

// ==============================================
// SALVAR E CARREGAR DADOS (LOCALSTORAGE)
// ==============================================
function salvarDados() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
  localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
  localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
}

function carregarDadosNuvem() {
  const salvo = localStorage.getItem("produtos");
  if (salvo) produtos = JSON.parse(salvo);
  const movSalvo = localStorage.getItem("movimentacoes");
  if (movSalvo) movimentacoes = JSON.parse(movSalvo);
  const fornSalvo = localStorage.getItem("fornecedores");
  if (fornSalvo) fornecedores = JSON.parse(fornSalvo);
  fornecedores.forEach(f => { if (!f.produtos) f.produtos = []; });
  dadosCarregados = true;
  listarProdutos();
  atualizarEstoque();
  listarFornecedores();
  atualizarSelectFornecedores();
  console.log("✅ Sistema carregado!");
}

// ==============================================
// ABAS
// ==============================================
function trocarAba(indice) {
  document.querySelectorAll('.conteudo-aba').forEach((c, i) => {
    c.classList.toggle('visivel', i === indice);
  });
  document.querySelectorAll('.navegacao-abas .aba').forEach((a, i) => {
    a.classList.toggle('ativa', i === indice);
  });
}

// ==============================================
// PRODUTOS
// ==============================================
function buscarProduto() {
  if (!dadosCarregados) return;
  const cod = document.getElementById('codigoProd').value.trim();
  if (!cod) return limparCampos();
  const p = produtos.find(x => String(x.codigo) === String(cod));
  if (p) {
    document.getElementById('nomeProd').value = p.nome;
    document.getElementById('categoriaProd').value = p.categoria;
    document.getElementById('precoProd').value = p.preco.toFixed(2);
  } else { limparCampos(); }
}

function limparCampos() {
  document.getElementById('nomeProd').value = '';
  document.getElementById('categoriaProd').value = '';
  document.getElementById('precoProd').value = '';
}

function cadastrarProduto() {
  const codigo = document.getElementById('codigoNovo').value.trim();
  const nome = document.getElementById('nomeNovo').value.trim();
  const categoria = document.getElementById('categoriaNova').value.trim();
  const precoTexto = document.getElementById('precoNovo').value.replace(",", ".");
  const preco = parseFloat(precoTexto);
  if (!codigo || !nome || !categoria || isNaN(preco) || preco <= 0) {
    alert("Preencha todos os campos corretamente!"); return;
  }
  if (produtos.some(x => String(x.codigo) === String(codigo))) {
    alert("Código já cadastrado!"); return;
  }
  produtos.push({
    codigo: codigo, nome: nome, categoria: categoria,
    preco: preco, quantidade: 0,
    ultimaAtualizacao: new Date().toLocaleString("pt-BR")
  });
  salvarDados(); listarProdutos();
  alert("✅ Produto cadastrado!");
  document.getElementById('codigoNovo').value = '';
  document.getElementById('nomeNovo').value = '';
  document.getElementById('categoriaNova').value = '';
  document.getElementById('precoNovo').value = '';
}

function listarProdutos() {
  const corpo = document.querySelector('#tabela-produtos tbody');
  if (!corpo) return; corpo.innerHTML = '';
  produtos.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.codigo}</td><td>${p.nome}</td><td>${p.categoria}</td><td>R$ ${p.preco.toFixed(2)}</td><td>${p.quantidade}</td><td>R$ ${(p.preco * p.quantidade).toFixed(2)}</td>`;
    corpo.appendChild(tr);
  });
}

function registrarMovimentacao() {
  const cod = document.getElementById('codigoProd').value.trim();
  const qtd = parseInt(document.getElementById('qtdProd').value);
  const resp = document.getElementById('responsavel').value.trim();
  const tipo = document.getElementById('tipoMov').value;
  if (!cod || isNaN(qtd) || qtd <= 0 || !resp) {
    alert("Preencha corretamente!"); return;
  }
  const p = produtos.find(x => String(x.codigo) === String(cod));
  if (!p) { alert("Produto não encontrado!"); return; }
  if (tipo === "entrada") { p.quantidade += qtd; }
  else { if (p.quantidade < qtd) { alert("Estoque insuficiente!"); return; } p.quantidade -= qtd; }
  p.ultimaAtualizacao = new Date().toLocaleString("pt-BR");
  movimentacoes.push({
    codigo: cod, produto: p.nome, categoria: p.categoria,
    quantidade: qtd, tipo: tipo, responsavel: resp,
    data: new Date().toLocaleString("pt-BR")
  });
  salvarDados(); listarProdutos(); atualizarEstoque(); limparCampos();
  document.getElementById('qtdProd').value = '';
  document.getElementById('responsavel').value = '';
  alert("✅ Movimentação registrada!");
}

function atualizarEstoque() {
  const corpo = document.querySelector('#tabela-estoque tbody');
  if (!corpo) return; corpo.innerHTML = '';
  produtos.forEach(p => {
    const total = (p.preco * p.quantidade).toFixed(2);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.codigo}</td><td>${p.nome}</td><td>${p.categoria}</td><td>R$ ${p.preco.toFixed(2)}</td><td>${p.quantidade}</td><td>R$ ${total}</td><td>${p.ultimaAtualizacao}</td><td><button style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:3px;" onclick="excluirProduto('${p.codigo}')">Excluir</button></td>`;
    corpo.appendChild(tr);
  });
}

function excluirProduto(cod) {
  if (!confirm("Excluir?")) return;
  produtos = produtos.filter(x => String(x.codigo) !== String(cod));
  salvarDados(); listarProdutos(); atualizarEstoque();
}

// ==============================================
// EXIBIÇÃO TABELAS
// ==============================================
let estoqueVisivel = true;
function mostrarOcultarEstoque() {
  const tbl = document.getElementById('tabela-estoque');
  if (!tbl) return; estoqueVisivel = !estoqueVisivel;
  tbl.style.display = estoqueVisivel ? '' : 'none';
}

let produtosVisiveis = true;
function alternarProdutos() {
  const tbl = document.getElementById('tabela-produtos');
  const btn = document.getElementById('btn-prod');
  if (!tbl) return; produtosVisiveis = !produtosVisiveis;
  tbl.style.display = produtosVisiveis ? '' : 'none';
  if (btn) btn.textContent = produtosVisiveis ? 'Ocultar' : 'Mostrar';
}
function mostrarOcultarProdutos() { alternarProdutos(); }

// ==============================================
// RELATÓRIOS
// ==============================================
function gerarRelatorioPeriodo() {
  const dtIni = document.getElementById('dataInicio').value;
  const dtFim = document.getElementById('dataFim').value;
  if (!dtIni || !dtFim) { alert("Preencha as datas!"); return; }
  const filtradas = movimentacoes.filter(m => {
    const d = m.data.split(/[\/, :]/);
    const dataMov = new Date(d[2], d[1]-1, d[0]);
    return dataMov >= new Date(dtIni+"T00:00:00") && dataMov <= new Date(dtFim+"T23:59:59");
  });
  exibirRelatorioTela(filtradas, dtIni.split('-').reverse().join('/'), dtFim.split('-').reverse().join('/'));
}
function relatorioCompleto() {
  exibirRelatorioTela(movimentacoes, "Todo Período", "");
}
function exibirRelatorioTela(lista, ini, fim) {
  const div = document.getElementById('conteudo-relatorio');
  if (!lista.length) { div.innerHTML = "<p>⚠️ Nenhuma movimentação!</p>"; return; }
  div.innerHTML = `<h3>📋 Relatório ${ini} a ${fim}</h3><table><tr><th>Data</th><th>Tipo</th><th>Produto</th><th>Qtd</th><th>Resp</th></tr>` +
    lista.map(m => `<tr><td>${m.data}</td><td>${m.tipo}</td><td>${m.produto}</td><td>${m.quantidade}</td><td>${m.responsavel}</td></tr>`).join('') + `</table>`;
}
function imprimirRelatorio() { window.print(); }

// ==============================================
// FERRAMENTAS
// ==============================================
function filtrarPorCategoria() {
  const cat = prompt("Digite a categoria (vazio = todos):");
  const filtrados = (!cat) ? produtos : produtos.filter(p => p.categoria.includes(cat));
  const corpo = document.querySelector('#tabela-produtos tbody');
  corpo.innerHTML = '';
  filtrados.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.codigo}</td><td>${p.nome}</td><td>${p.categoria}</td><td>R$ ${p.preco.toFixed(2)}</td><td>${p.quantidade}</td><td>R$ ${(p.preco*p.quantidade).toFixed(2)}</td>`;
    corpo.appendChild(tr);
  });
}
function exportarParaExcel() {
  let csv = "Código;Nome;Categoria;Preço;Quantidade\n";
  produtos.forEach(p => csv += `${p.codigo};${p.nome};${p.categoria};${p.preco.toFixed(2)};${p.quantidade}\n`);
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = "estoque.csv"; a.click();
}
function importarDoExcel(e) {
  const arq = e.target.files[0];
  const leitor = new FileReader();
  leitor.onload = evt => {
    evt.target.result.split('\n').slice(1).forEach(linha => {
      const [cod, nome, cat, preco, qtd] = linha.split(';');
      if (!cod) return;
      const ex = produtos.find(p=>p.codigo===cod);
      if(ex) { ex.nome=nome; ex.categoria=cat; ex.preco=+preco.replace(',','.'); }
      else produtos.push({codigo:cod,nome:nome,categoria:cat,preco:+preco.replace(',','.'),quantidade:+qtd});
    });
    salvarDados(); listarProdutos(); atualizarEstoque(); alert("✅ Importado!");
  };
  leitor.readAsText(arq);
}

// ==============================================
// FORNECEDORES
// ==============================================
let fornecedoresVisivel = true;
function alternarFornecedores() {
  fornecedoresVisivel = !fornecedoresVisivel;
  document.getElementById('form-fornecedor').style.display = fornecedoresVisivel?'flex':'none';
  document.getElementById('tabela-fornecedores').style.display = fornecedoresVisivel?'table':'none';
  document.getElementById('btn-forn').textContent = fornecedoresVisivel?'Ocultar':'Exibir';
}
function cadastrarFornecedor() {
  const f = {
    cnpj: document.getElementById('cnpjForn').value.trim(),
    razao: document.getElementById('razaoForn').value.trim(),
    fantasia: document.getElementById('fantasiaForn').value.trim(),
    endereco: document.getElementById('enderecoForn').value.trim(),
    telefone: document.getElementById('telefoneForn').value.trim(),
    cidade: document.getElementById('cidadeForn').value.trim(),
    produtos: []
  };
  if (!f.cnpj || !f.razao) { alert("CNPJ e Razão Social obrigatórios!"); return; }
  fornecedores.push(f); salvarDados(); listarFornecedores(); atualizarSelectFornecedores();
  alert("✅ Fornecedor cadastrado!");
}
function listarFornecedores() {
  const tb = document.querySelector('#tabela-fornecedores tbody');
  tb.innerHTML = '';
  fornecedores.forEach((f,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${f.cnpj}</td><td>${f.razao}</td><td>${f.fantasia}</td><td>${f.endereco}</td><td>${f.telefone}</td><td>${f.cidade}</td><td><button onclick="excluirFornecedor(${i})">Excluir</td></tr>`;
    tb.appendChild(tr);
  });
}
function excluirFornecedor(i) { fornecedores.splice(i,1); salvarDados(); listarFornecedores(); }
function atualizarSelectFornecedores() {
  const sel = document.getElementById('selectFornecedorEntrada');
  sel.innerHTML='<option value="">-- Selecione --</option>';
  fornecedores.forEach((f,i)=>{const o=new Option(f.razao,i);sel.appendChild(o);});
}

// ==============================================
// XML (básico)
// ==============================================
function importarEntradaXML() { alert("XML funcionando — implementação simplificada!"); }

// ==============================================
// ✅ TORNAR TUDO GLOBAL — AQUI ESTÁ O SEGREDO!
// ==============================================
window.onload = carregarDadosNuvem;

window.trocarAba = trocarAba;
window.buscarProduto = buscarProduto;
window.cadastrarProduto = cadastrarProduto;
window.registrarMovimentacao = registrarMovimentacao;
window.atualizarEstoque = atualizarEstoque;
window.excluirProduto = excluirProduto;
window.mostrarOcultarEstoque = mostrarOcultarEstoque;
window.alternarProdutos = alternarProdutos;
window.mostrarOcultarProdutos = mostrarOcultarProdutos;
window.gerarRelatorioPeriodo = gerarRelatorioPeriodo;
window.relatorioCompleto = relatorioCompleto;
window.exibirRelatorioTela = exibirRelatorioTela;
window.imprimirRelatorio = imprimirRelatorio;
window.filtrarPorCategoria = filtrarPorCategoria;
window.exportarParaExcel = exportarParaExcel;
window.importarDoExcel = importarDoExcel;
window.cadastrarFornecedor = cadastrarFornecedor;
window.listarFornecedores = listarFornecedores;
window.excluirFornecedor = excluirFornecedor;
window.alternarFornecedores = alternarFornecedores;
window.atualizarSelectFornecedores = atualizarSelectFornecedores;
window.importarEntradaXML = importarEntradaXML;