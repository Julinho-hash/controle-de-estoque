


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

// ✅ RELATÓRIO POR PERÍODO — LÊ AS DATAS DA TELA E FUNCIONA!
function gerarRelatorioPeriodo() {
    // Pega as datas que o usuário digitou nos campos da tela
    const dataInicioCampo = document.getElementById('dataInicio').value;
    const dataFimCampo = document.getElementById('dataFim').value;

    // Verifica se os dois campos estão preenchidos
    if (!dataInicioCampo || !dataFimCampo) {
        alert("⚠️ Preencha a Data Inicial e a Data Final nos campos ao lado!");
        return;
    }

    // Converte as datas para formato de comparação (inclui horário)
    const dataInicio = new Date(dataInicioCampo + "T00:00:00");
    const dataFim = new Date(dataFimCampo + "T23:59:59");

    // Converte data para formato BR para mostrar no relatório
    const convParaBR = (dataISO) => {
        const [ano, mes, dia] = dataISO.split("-");
        return `${dia}/${mes}/${ano}`;
    };

    const dtInicioBR = convParaBR(dataInicioCampo);
    const dtFimBR = convParaBR(dataFimCampo);

    // Filtra SOMENTE as movimentações do período escolhido
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

    // ✅ Reutiliza a função que já funciona e mostra na tela!
    exibirRelatorioTela(filtradas, dtInicioBR, dtFimBR);
}

// ✅ RELATÓRIO COMPLETO — Mostra na tela!
function relatorioCompleto() {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const dataFim = hoje.toLocaleDateString("pt-BR").replaceAll("/", "-");
    const dataInicio = primeiroDia.toLocaleDateString("pt-BR").replaceAll("/", "-");

    exibirRelatorioTela(movimentacoes, "Todo Período", dataFim);
}


// ✅ FUNÇÃO PRINCIPAL — Monta e exibe o relatório na TELA
function exibirRelatorioTela(lista, dtIni, dtFim) {
    const conteudo = document.getElementById('conteudo-relatorio');

    if (!lista.length) {
        conteudo.innerHTML = `<p style="color:#e74c3c; font-weight:bold;">⚠️ Nenhuma movimentação encontrada no período!</p>`;
        return;
    }

    // Calcula totais
    const entradas = lista.filter(m => m.tipo === "entrada");
    const saidas = lista.filter(m => m.tipo === "saida");
    const qtdEntradas = entradas.reduce((s, m) => s + m.quantidade, 0);
    const qtdSaidas = saidas.reduce((s, m) => s + m.quantidade, 0);

    // Agrupa por responsável
    const porUsuario = {};
    lista.forEach(m => {
        if (!porUsuario[m.responsavel]) {
            porUsuario[m.responsavel] = { e: 0, s: 0 };
        }
        m.tipo === "entrada" ? porUsuario[m.responsavel].e += m.quantidade : porUsuario[m.responsavel].s += m.quantidade;
    });

    // Monta HTML
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
            <tbody>
    `;

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
function exportarParaExcel() {
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
            `${i+1};${m.tipo};${m.produto};${m.quantidade};${m.responsavel};${m.data}`
        );
    });

    const arquivo = new Blob([linhas.join("\n")], {type: "text/csv;charset=utf-8"});
    const url = URL.createObjectURL(arquivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estoque_${new Date().toLocaleDateString("pt-BR").replaceAll("/","-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Exportado com sucesso! Abra com o Excel.");
}


// ✅ IMPORTAR DO EXCEL
function importarDoExcel(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(event) {
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
                produtos.push({codigo, nome, categoria, preco, quantidade, ultimaAtualizacao: ultima});
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

// ✅ IMPRIMIR — Agora imprime SOMENTE o Relatório!
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
                h3 { color: #1e293b; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0 20px 0; }
                th { background: #f1f5f9; padding: 10px; text-align: left; border: 1px solid #ddd; }
                td { padding: 8px; border: 1px solid #ddd; }
                .entrada { color: #16a34a; font-weight: bold; }
                .saida { color: #dc2626; font-weight: bold; }
                .caixa { display: inline-block; padding: 10px 15px; margin: 5px; border-radius: 6px; }
                .entradas { background: #dcfce7; }
                .saidas { background: #fee2e2; }
                .saldo { background: #dbeafe; }
                .total { background: #f3e8ff; }
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

    // 🔒 SEMPRE Pede senha ao ABRIR o site
    sessionStorage.removeItem("senhaAprovada"); // ← SEMPRE apaga ao fechar
    verificarSenha(); // ← Pede senha OBRIGATORIAMENTE

    if (senhaConfirmada) {
        const salvo = localStorage.getItem("produtos");
        if (salvo) produtos = JSON.parse(salvo);
        const movSalvo = localStorage.getItem("movimentacoes");
        if (movSalvo) movimentacoes = JSON.parse(movSalvo);
        listarProdutos();
        atualizarEstoque();
    }

