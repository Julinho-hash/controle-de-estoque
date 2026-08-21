let produtos = [];
let movimentacoes = [];

function salvarDados() {
    localStorage.setItem("produtos", JSON.stringify(produtos));
    localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
}

function buscarProduto() {
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

    // Limpa os campos
    document.getElementById('codigoNovo').value = '';
    document.getElementById('nomeNovo').value = '';
    document.getElementById('categoriaNova').value = '';
    document.getElementById('precoNovo').value = '';
}

function listarProdutos() {
    const corpo = document.querySelector('#tabela-produtos tbody');
    corpo.innerHTML = '';

    produtos.forEach(p => {
        const tr = document.createElement('tr');
        // Faltavam os acentos de crase (`)
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
    const corpo = document.querySelector('#tabela-estoque tbody');
    corpo.innerHTML = '';

    produtos.forEach(p => {
        const total = (p.preco * p.quantidade).toFixed(2);
        const tr = document.createElement('tr');
        // Faltavam os acentos de crase (`)
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
    alert("Informe as datas e clique novamente!");
}

function relatorioCompleto() {
    let total = produtos.reduce((s, p) => s + p.quantidade, 0);
    let valor = produtos.reduce((s, p) => s + p.preco * p.quantidade, 0);
    // Faltavam os acentos de crase (`)
    alert(`RELATÓRIO COMPLETO

Produtos: ${produtos.length}
Quantidade: ${total}
Valor Total: R$ ${valor.toFixed(2)}
Movimentações: ${movimentacoes.length}`);
}

function historicoMovimentacoes() {
    if (!movimentacoes.length) return alert("Sem movimentações!");
    let txt = "HISTÓRICO DE MOVIMENTAÇÕES\n\n";
    movimentacoes.forEach((m, i) => {
        // Faltavam os acentos de crase (`)
        txt += `${i + 1}. ${m.tipo.toUpperCase()} — ${m.produto}
Qtd: ${m.quantidade} | Resp: ${m.responsavel}
Data: ${m.data}

`;
    });
    alert(txt);
}

function filtrarPorCategoria() {
    alert("Selecione uma categoria!");
}
function exportarParaExcel() {
    alert("Exportação: em desenvolvimento");
}
function importarDoExcel(e) {
    alert("Importação: em desenvolvimento");
}
function imprimirRelatorio() {
    window.print();
}

window.onload = function () {
    const salvo = localStorage.getItem("produtos");
    if (salvo) produtos = JSON.parse(salvo);
    const movSalvo = localStorage.getItem("movimentacoes");
    if (movSalvo) movimentacoes = JSON.parse(movSalvo);
    listarProdutos();
    atualizarEstoque();
};

