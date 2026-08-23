// ==============================================
// 🔒 CONFIGURAÇÃO DO FIREBASE — JÁ ESTÁ CERTO!
// ==============================================
const firebaseConfig = {
  apiKey: "AIzaSyA2HT3sfwCcRxds26wZef1ULkvgW2elO9Q",
  authDomain: "controledeestoque-2d07d.firebaseapp.com",
  projectId: "controledeestoque-2d07d",
  storageBucket: "controledeestoque-2d07d.firebasestorage.app",
  messagingSenderId: "875951054042",
  appId: "1:875951054042:web:af7646e4c9f1fb7e5759e3"
};

// ==============================================
// NÃO ALTERE NADA DAQUI PARA BAIXO!
// ==============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let produtos = [];
let movimentacoes = [];
let dadosCarregados = false;

// ✅ SALVAR DADOS NA NUVEM
async function salvarDados() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
  localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
  
  try {
    await setDoc(doc(db, "sistema", "dados"), {
      produtos: produtos,
      movimentacoes: movimentacoes,
      atualizadoEm: new Date().toISOString()
    });
  } catch (e) {
    console.log("Aviso: salvo localmente", e);
  }
}

// ✅ CARREGAR DADOS DA NUVEM
async function carregarDadosNuvem() {
  try {
    const snap = await getDoc(doc(db, "sistema", "dados"));
    if (snap.exists()) {
      const dados = snap.data();
      produtos = dados.produtos || [];
      movimentacoes = dados.movimentacoes || [];
      localStorage.setItem("produtos", JSON.stringify(produtos));
      localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
      console.log("✅ Dados carregados da nuvem!");
    }
  } catch (e) {
    console.log("Usando dados locais", e);
    const salvo = localStorage.getItem("produtos");
    if (salvo) produtos = JSON.parse(salvo);
    const movSalvo = localStorage.getItem("movimentacoes");
    if (movSalvo) movimentacoes = JSON.parse(movSalvo);
  }
  dadosCarregados = true;
  listarProdutos();
  atualizarEstoque();
}

// ==============================================
// RESTO DAS FUNÇÕES
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
  } else {
    limparCampos();
  }
}

function limparCampos() {
  document.getElementById('nomeProd').value = '';
  document.getElementById('categoriaProd').value = '';
  document.getElementById('precoProd').value = '';
}

function cadastrarProduto() {
  if (!dadosCarregados) return;
  const codigo = document.getElementById('codigoNovo').value.trim();
  const nome = document.getElementById('nomeNovo').value.trim();
  const categoria = document.getElementById('categoriaNova').value.trim();
  const preco = parseFloat(document.getElementById('precoNovo').value);

  if (!codigo || !nome || !categoria || isNaN(preco)) {
    alert("Preencha todos os campos!");
    return;
  }
  if (produtos.some(x => String(x.codigo) === String(codigo))) {
    alert("Código já cadastrado!");
    return;
  }

  produtos.push({
    codigo: codigo,
    nome: nome,
    categoria: categoria,
    preco: preco,
    quantidade: 0,
    ultimaAtualizacao: new Date().toLocaleString("pt-BR")
  });

  salvarDados();
  listarProdutos();
  alert("✅ Produto cadastrado!");

  document.getElementById('codigoNovo').value = '';
  document.getElementById('nomeNovo').value = '';
  document.getElementById('categoriaNova').value = '';
  document.getElementById('precoNovo').value = '';
}

function listarProdutos() {
  if (!dadosCarregados) return;
  const corpo = document.querySelector('#tabela-produtos tbody');
  corpo.innerHTML = '';

  produtos.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.nome}</td>
      <td>${p.categoria}</td>
      <td>R$ ${p.preco.toFixed(2)}</td>
      <td>${p.quantidade}</td>
      <td>R$ ${(p.preco * p.quantidade).toFixed(2)}</td>
    `;
    corpo.appendChild(tr);
  });
}

function registrarMovimentacao() {
  if (!dadosCarregados) return;
  const cod = document.getElementById('codigoProd').value.trim();
  const qtd = parseInt(document.getElementById('qtdProd').value);
  const resp = document.getElementById('responsavel').value.trim();
  const tipo = document.getElementById('tipoMov').value;

  if (!cod || isNaN(qtd) || qtd <= 0 || !resp) {
    alert("Preencha corretamente!");
    return;
  }

  const p = produtos.find(x => String(x.codigo) === String(cod));
  if (!p) {
    alert("Produto não encontrado!");
    return;
  }

  if (tipo === "entrada") {
    p.quantidade += qtd;
  } else {
    if (p.quantidade < qtd) {
      alert("Estoque insuficiente!");
      return;
    }
    p.quantidade -= qtd;
  }

  p.ultimaAtualizacao = new Date().toLocaleString("pt-BR");
  movimentacoes.push({
    codigo: cod,
    produto: p.nome,
    categoria: p.categoria,
    quantidade: qtd,
    tipo: tipo,
    responsavel: resp,
    data: new Date().toLocaleString("pt-BR")
  });

  salvarDados();
  listarProdutos();
  atualizarEstoque();
  limparCampos();
  document.getElementById('qtdProd').value = '';
  document.getElementById('responsavel').value = '';
  alert("✅ Movimentação registrada!");
}

function atualizarEstoque() {
  if (!dadosCarregados) return;
  const corpo = document.querySelector('#tabela-estoque tbody');
  corpo.innerHTML = '';

  produtos.forEach(p => {
    const total = (p.preco * p.quantidade).toFixed(2);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.nome}</td>
      <td>${p.categoria}</td>
      <td>R$ ${p.preco.toFixed(2)}</td>
      <td>${p.quantidade}</td>
      <td>R$ ${total}</td>
      <td>${p.ultimaAtualizacao}</td>
      <td>
        <button style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;" 
                onclick="excluirProduto('${p.codigo}')">
          Excluir
        </button>
      </td>
    `;
    corpo.appendChild(tr);
  });
}

function excluirProduto(cod) {
  if (!dadosCarregados) return;
  if (!confirm("Excluir este produto?")) return;
  produtos = produtos.filter(x => String(x.codigo) !== String(cod));
  salvarDados();
  listarProdutos();
  atualizarEstoque();
}

let estoqueVisivel = true;
function mostrarOcultarEstoque() {
  const tbl = document.getElementById('tabela-estoque');
  estoqueVisivel = !estoqueVisivel;
  tbl.style.display = estoqueVisivel ? '' : 'none';
}

let produtosVisiveis = true;
function alternarProdutos() {
  const tbl = document.getElementById('tabela-produtos');
  produtosVisiveis = !produtosVisiveis;
  tbl.style.display = produtosVisiveis ? '' : 'none';
  document.querySelector('#sec-produtos button').textContent = produtosVisiveis ? 'Ocultar' : 'Mostrar';
}
function mostrarOcultarProdutos() {
  alternarProdutos();
}

function gerarRelatorioPeriodo() {
  const dataInicioCampo = document.getElementById('dataInicio').value;
  const dataFimCampo = document.getElementById('dataFim').value;

  if (!dataInicioCampo || !dataFimCampo) {
    alert("⚠️ Preencha a Data Inicial e a Data Final nos campos ao lado!");
    return;
  }

  const dataInicio = new Date(dataInicioCampo + "T00:00:00");
  const dataFim = new Date(dataFimCampo + "T23:59:59");

  const convParaBR = (dataISO) => {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const dtInicioBR = convParaBR(dataInicioCampo);
  const dtFimBR = convParaBR(dataFimCampo);

  const filtradas = movimentacoes.filter(m => {
    const partesData = m.data.split(/[\/, :]/);
    const dia = partesData[0];
    const mes = partesData[1];
    const ano = partesData[2];
    const hora = partesData[3] || "00";
    const minuto = partesData[4] || "00";
    const dataMov = new Date(ano, mes - 1, dia, hora, minuto);
    return dataMov >= dataInicio && dataMov <= dataFim;
  });

  exibirRelatorioTela(filtradas, dtInicioBR, dtFimBR);
}

function relatorioCompleto() {
  exibirRelatorioTela(movimentacoes, "Todo Período", "Até Hoje");
}

function exibirRelatorioTela(lista, dtIni, dtFim) {
  const conteudo = document.getElementById('conteudo-relatorio');

  if (!lista.length) {
    conteudo.innerHTML = `<p style="color:#e74c3c; font-weight:bold;">⚠️ Nenhuma movimentação encontrada no período!</p>`;
    return;
  }

  const entradas = lista.filter(m => m.tipo === "entrada");
  const saidas = lista.filter(m => m.tipo === "saida");
  const qtdEntradas = entradas.reduce((s, m) => s + m.quantidade, 0);
  const qtdSaidas = saidas.reduce((s, m) => s + m.quantidade, 0);

  const porUsuario = {};
  lista.forEach(m => {
    if (!porUsuario[m.responsavel]) {
      porUsuario[m.responsavel] = { e: 0, s: 0 };
    }
    m.tipo === "entrada" ? porUsuario[m.responsavel].e += m.quantidade : porUsuario[m.responsavel].s += m.quantidade;
  });

  let html = `
    <h3 style="margin:0 0 15px 0; color:#1e293b;">📋 Relatório de Movimentações</h3>
    <p style="color:#475569; margin:5px 0;"><strong>Período:</strong> ${dtIni} até ${dtFim}</p>
    <hr style="border:none; border-top:1px solid #e2e8f0; margin:10px 0;">
    <div style="display:flex; gap:20px; flex-wrap:wrap; margin:10px 0;">
      <div style="background:#dcfce7; padding:10px 15px; border-radius:6px;">
        <strong>📥 Entradas:</strong> ${qtdEntradas}
      </div>
      <div style="background:#fee2e2; padding:10px 15px; border-radius:6px;">
        <strong>📤 Saídas:</strong> ${qtdSaidas}
      </div>
      <div style="background:#dbeafe; padding:10px 15px; border-radius:6px;">
        <strong>📊 Saldo:</strong> ${qtdEntradas - qtdSaidas}
      </div>
      <div style="background:#f3e8ff; padding:10px 15px; border-radius:6px;">
        <strong>📝 Total de Movs:</strong> ${lista.length}
      </div>
    </div>
    <h4 style="margin:15px 0 8px 0;">👤 Por Responsável:</h4>
    <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
      <thead><tr style="background:#f1f5f9;">
        <th style="padding:8px; text-align:left; border:1px solid #ddd;">Responsável</th>
        <th style="padding:8px; text-align:center; border:1px solid #ddd;">Entradas</th>
        <th style="padding:8px; text-align:center; border:1px solid #ddd;">Saídas</th>
        <th style="padding:8px; text-align:center; border:1px solid #ddd;">Saldo</th>
      </tr></thead>
      <tbody>`;

  for (const [nome, d] of Object.entries(porUsuario)) {
    html += `
      <tr>
        <td style="padding:8px; border:1px solid #ddd;">${nome}</td>
        <td style="padding:8px; text-align:center; border:1px solid #ddd;">${d.e}</td>
        <td style="padding:8px; text-align:center; border:1px solid #ddd;">${d.s}</td>
        <td style="padding:8px; text-align:center; border:1px solid #ddd;">${d.e - d.s}</td>
      </tr>`;
  }

  html += `</tbody></table>
    <h4 style="margin:15px 0 8px 0;">📝 Detalhe das Movimentações:</h4>
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead><tr style="background:#f1f5f9;">
        <th style="padding:7px; border:1px solid #ddd;">Data/Hora</th>
        <th style="padding:7px; border:1px solid #ddd;">Tipo</th>
        <th style="padding:7px; border:1px solid #ddd;">Produto</th>
        <th style="padding:7px; border:1px solid #ddd;">Qtd</th>
        <th style="padding:7px; border:1px solid #ddd;">Responsável</th>
      </tr></thead>
      <tbody>`;

  lista.forEach(m => {
    const cor = m.tipo === "entrada" ? "#16a34a" : "#dc2626";
    const icone = m.tipo === "entrada" ? "ENTRADA" : "SAÍDA";
    html += `
      <tr>
        <td style="padding:6px; border:1px solid #ddd;">${m.data}</td>
        <td style="padding:6px; border:1px solid #ddd; color:${cor}; font-weight:bold;">${icone}</td>
        <td style="padding:6px; border:1px solid #ddd;">${m.produto}</td>
        <td style="padding:6px; border:1px solid #ddd; text-align:center;">${m.quantidade}</td>
        <td style="padding:6px; border:1px solid #ddd;">${m.responsavel}</td>
      </tr>`;
  });

  html += `</tbody></table>`;
  conteudo.innerHTML = html;
}

function historicoMovimentacoes() {
  if (!dadosCarregados) return;
  if (!movimentacoes.length) return alert("Sem movimentações!");
  let txt = "HISTÓRICO DE MOVIMENTAÇÕES\n\n";
  movimentacoes.forEach((m, i) => {
    txt += `${i + 1}. ${m.tipo.toUpperCase()} — ${m.produto}\nQtd: ${m.quantidade} | Resp: ${m.responsavel}\nData: ${m.data}\n\n`;
  });
  alert(txt);
}

function filtrarPorCategoria() {
  if (!dadosCarregados) return;
  if (produtos.length === 0) return alert("Sem produtos cadastrados!");

  const categorias = [...new Set(produtos.map(p => p.categoria).filter(c => c))].sort();
  if (categorias.length === 0) return alert("Nenhuma categoria cadastrada!");

  const lista = categorias.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const escolha = prompt(`Categorias disponíveis:\n\n${lista}\n\nDigite o NOME da categoria para filtrar ou deixe em branco para mostrar TODOS:`);

  const corpoP = document.querySelector('#tabela-produtos tbody');
  const corpoE = document.querySelector('#tabela-estoque tbody');
  corpoP.innerHTML = "";
  corpoE.innerHTML = "";

  let filtrados = produtos;
  if (escolha && escolha.trim() !== "") {
    filtrados = produtos.filter(p => p.categoria.toLowerCase() === escolha.trim().toLowerCase());
  }

  if (filtrados.length === 0) {
    alert("Nenhum produto encontrado nesta categoria!");
    listarProdutos();
    atualizarEstoque();
    return;
  }

  filtrados.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.codigo}</td><td>${p.nome}</td><td>${p.categoria}</td>
      <td>R$ ${p.preco.toFixed(2)}</td><td>${p.quantidade}</td>
      <td>R$ ${(p.preco * p.quantidade).toFixed(2)}</td>
    `;
    corpoP.appendChild(tr);
  });

  filtrados.forEach(p => {
    const total = (p.preco * p.quantidade).toFixed(2);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.codigo}</td><td>${p.nome}</td><td>${p.categoria}</td>
      <td>R$ ${p.preco.toFixed(2)}</td><td>${p.quantidade}</td>
      <td>R$ ${total}</td><td>${p.ultimaAtualizacao}</td>
      <td><button style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;" onclick="excluirProduto('${p.codigo}')">Excluir</button></td>
    `;
    corpoE.appendChild(tr);
  });

  alert(`✅ ${filtrados.length} produto(s) encontrado(s)!`);
}

function exportarParaExcel() {
  if (!dadosCarregados) return;
  if (produtos.length === 0) {
    alert("Nenhum produto cadastrado para exportar!");
    return;
  }

  let linhas = ["Código;Nome;Categoria;Preço;Quantidade;Valor Total;Última Atualização"];
  produtos.forEach(p => {
    linhas.push(
      `${p.codigo};${p.nome};${p.categoria};${p.preco.toFixed(2)};${p.quantidade};${(p.preco * p.quantidade).toFixed(2)};${p.ultimaAtualizacao}`
    );
  });

  linhas.push("");
  linhas.push("=== MOVIMENTAÇÕES ===");
  linhas.push("Nº;Tipo;Produto;Quantidade;Responsável;Data");
  movimentacoes.forEach((m, i) => {
    linhas.push(
      `${i + 1};${m.tipo};${m.produto};${m.quantidade};${m.responsavel};${m.data}`
    );
  });

  const arquivo = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement("a");
  a.href = url;
  a.download = `estoque_${new Date().toLocaleDateString("pt-BR").replaceAll("/", "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  alert("✅ Exportado com sucesso! Abra com o Excel.");
}

function importarDoExcel(e) {
  if (!dadosCarregados) return;
  const arquivo = e.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = function (event) {
    const texto = event.target.result;
    const linhas = texto.split("\n");
    let contador = 0;
    let erros = 0;

    for (let i = 1; i < linhas.length; i++) {
      const colunas = linhas[i].split(";");
      if (colunas.length < 5 || !colunas[0].trim()) continue;

      const codigo = colunas[0].trim();
      const nome = colunas[1].trim();
      const categoria = colunas[2].trim();
      const preco = parseFloat(colunas[3].replace(",", "."));
      const quantidade = parseInt(colunas[4]) || 0;
      const ultima = colunas[6] || new Date().toLocaleString("pt-BR");

      if (!codigo || !nome || isNaN(preco)) { erros++; continue; }

      const existe = produtos.find(x => String(x.codigo) === String(codigo));
      if (existe) {
        existe.nome = nome;
        existe.categoria = categoria;
        existe.preco = preco;
        existe.quantidade = quantidade;
        existe.ultimaAtualizacao = ultima;
      } else {
        produtos.push({ codigo, nome, categoria, preco, quantidade, ultimaAtualizacao: ultima });
      }
      contador++;
    }

    salvarDados();
    listarProdutos();
    atualizarEstoque();
    e.target.value = "";
    alert(`✅ Importação concluída!\n${contador} produtos importados.\n${erros} linhas com erro.`);
  };
  leitor.readAsText(arquivo);
}

function imprimirRelatorio() {
  const conteudo = document.getElementById('conteudo-relatorio').innerHTML;

  if (!conteudo || conteudo.includes("Clique em um botão")) {
    alert("⚠️ Primeiro gere um relatório para poder imprimir!");
    return;
  }

  const janela = window.open('', '', 'width=900, height=700');
  janela.document.write(`
    <html>
    <head>
      <title>Relatório de Movimentações</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
        h2 { color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { background: #f1f5f9; padding: 8px; text-align: left; border: 1px solid #ddd; }
        td { padding: 6px; border: 1px solid #ddd; }
        hr { border: none; border-top: 1px solid #ccc; margin: 15px 0; }
      </style>
    </head>
    <body>
      <h2>📋 Relatório de Movimentações</h2>
      <hr>
      ${conteudo}
    </body>
    </html>
  `);
  janela.document.close();
  janela.focus();
  janela.print();
  janela.close();
}

window.onload = function () {
  carregarDadosNuvem();
};

// ==============================================
// ✅ TORNA TODAS AS FUNÇÕES VISÍVEIS PARA O HTML
// ==============================================
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
window.historicoMovimentacoes = historicoMovimentacoes;
window.filtrarPorCategoria = filtrarPorCategoria;
window.exportarParaExcel = exportarParaExcel;
window.importarDoExcel = importarDoExcel;
window.imprimirRelatorio = imprimirRelatorio;

// ========== FUNÇÃO DE IMPORTAÇÃO DE ENTRADA POR XML ==========
function importarEntradaXML() {
  const inputArquivo = document.getElementById('arquivoXml');
  const caixaMensagem = document.getElementById('mensagemImportacao');

  if (!inputArquivo.files || inputArquivo.files.length === 0) {
    caixaMensagem.innerHTML = '<span style="color:red;">⚠️ Selecione um arquivo XML primeiro!</span>';
    return;
  }

  const arquivo = inputArquivo.files[0];
  const leitor = new FileReader();

  leitor.onload = function (eventoLeitura) {
    const conteudoXML = eventoLeitura.target.result;
    const leitorXML = new DOMParser();
    const documentoXML = leitorXML.parseFromString(conteudoXML, "text/xml");

    let contadorSucesso = 0;
    let listaErros = [];

    // === AJUSTE AQUI SE O SEU XML TIVER NOMES DIFERENTES ===
    const itensXML = documentoXML.getElementsByTagName("item");
    const responsavelXML = documentoXML.getElementsByTagName("responsavel")[0]?.textContent || "Importação XML";

    if (itensXML.length === 0) {
      caixaMensagem.innerHTML = '<span style="color:red;">❌ Nenhum item encontrado no XML!</span>';
      return;
    }

    // Percorre cada item do XML
    for (let i = 0; i < itensXML.length; i++) {
      const codigo = itensXML[i].getElementsByTagName("codigo")[0]?.textContent?.trim();
      const quantidadeTexto = itensXML[i].getElementsByTagName("quantidade")[0]?.textContent?.trim();
      const quantidade = parseFloat(quantidadeTexto);

      // Validação dos dados
      if (!codigo) {
        listaErros.push(`Item ${i + 1}: sem código`);
        continue;
      }
      if (isNaN(quantidade) || quantidade <= 0) {
        listaErros.push(`Produto ${codigo}: quantidade inválida`);
        continue;
      }

      // ✅ Busca produto e registra entrada
      const produto = listaProdutos.find(p => String(p.codigo) === String(codigo));
      if (!produto) {
        listaErros.push(`Código ${codigo}: produto não cadastrado`);
        continue;
      }

      // Atualiza quantidade em estoque
      produto.quantidade += quantidade;

      // Registra no histórico de movimentações
      movimentacoes.push({
        codigo: produto.codigo,
        nome: produto.nome,
        quantidade: quantidade,
        tipo: "Entrada",
        responsavel: responsavelXML,
        data: new Date().toLocaleDateString('pt-BR')
      });

      contadorSucesso++;
    }

    // === Mostra resultado para o usuário ===
    let mensagemFinal = `<span style="color:green;">✅ ${contadorSucesso} entrada(s) registrada(s) com sucesso!</span>`;
    if (listaErros.length > 0) {
      mensagemFinal += `<br><span style="color:red;">⚠️ Avisos: ${listaErros.join(" | ")}</span>`;
    }
    caixaMensagem.innerHTML = mensagemFinal;

    // Recarrega a tabela de produtos automaticamente
    carregarProdutos();
  };

  leitor.readAsText(arquivo);
}