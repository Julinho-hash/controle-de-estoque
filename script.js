// 🔐 SENHA DO SISTEMA
const SENHA_SISTEMA = "1234";

// DADOS DA NF EM ABERTO
let itensNF = [];

// BANCO DE DADOS (localStorage)
let produtos = [];
let movimentacoes = [];
let fornecedores = [];

// SALVAR DADOS
function salvar() {
    localStorage.setItem("produtos", JSON.stringify(produtos));
    localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
    localStorage.setItem("fornecedores", JSON.stringify(fornecedores));
}

// CARREGAR DADOS
function carregarDados() {
    produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
    movimentacoes = JSON.parse(localStorage.getItem("movimentacoes") || "[]");
    fornecedores = JSON.parse(localStorage.getItem("fornecedores") || "[]");
    listarProdutos(); 
    atualizarEstoque(); 
    listarFornecedores(); 
    atualizarSelectFornecedores();
}

// LOGIN
function entrarSistema() {
    const senha = document.getElementById('campo-senha').value;
    if (senha === SENHA_SISTEMA) {
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('sistema').style.display = 'block';
        carregarDados();
    } else {
        document.getElementById('aviso-erro').style.display = 'block';
        document.getElementById('campo-senha').value = '';
    }
}

function sairSistema() {
    if (confirm("Deseja realmente sair do sistema?")) {
        document.getElementById('sistema').style.display = 'none';
        document.getElementById('tela-login').style.display = 'flex';
        document.getElementById('campo-senha').value = '';
        document.getElementById('aviso-erro').style.display = 'none';
    }
}

// NAVEGAÇÃO DE ABAS
function trocarAba(n) {
    document.querySelectorAll('.conteudo-aba').forEach((el, i) => el.classList.toggle('visivel', i === n));
    document.querySelectorAll('.aba').forEach((el, i) => el.classList.toggle('ativa', i === n));
}

// ==============================================
// ✅ ENTRADA POR NF
// ==============================================
function abrirFormularioNF() {
    const form = document.getElementById('form-entrada-nf');
    form.style.display = form.style.display === 'block' ? 'none' : 'block';
    itensNF = [];
    document.getElementById('tabela-itens-nf').innerHTML = '';
    limparFormNF();
}

/* ==========================================================
   SAÍDA POR CONVERSÃO DE UNIDADES
========================================================== */

function abrirFormularioSaidaNF() {
    const form = document.getElementById("form-saida-nf");
    const formEntrada = document.getElementById("form-entrada-nf");

    // Fecha o formulário de entrada por conversão
    formEntrada.style.display = "none";

    // Abre/fecha o formulário de saída
    form.style.display = form.style.display === "block" ? "none" : "block";

    // Limpa o formulário ao abrir
    if (form.style.display === "block") {
        limparFormSaida();
    }
}


function buscarProdutoSaida() {
    const codigo = document.getElementById("saida-codigo").value.trim();

    const produto = produtos.find(
        p => String(p.codigo) === String(codigo)
    );

    if (produto) {
        document.getElementById("saida-nome").value = produto.nome;

        // Calcula o estoque atual do produto
        let estoque = 0;

        movimentacoes.forEach(m => {
            if (String(m.codigo) === String(codigo)) {
                if (m.tipo === "entrada") {
                    estoque += Number(m.quantidade) || 0;
                }

                if (m.tipo === "saida") {
                    estoque -= Number(m.quantidade) || 0;
                }
            }
        });

        // Também considera a quantidade armazenada no produto
        if (produto.quantidade !== undefined) {
            estoque = Number(produto.quantidade) || 0;
        }

        document.getElementById("saida-estoque").value =
            estoque.toFixed(2);

        calcularTotalSaida();

    } else {
        document.getElementById("saida-nome").value =
            "(Produto não cadastrado)";

        document.getElementById("saida-estoque").value = "0.00";

        calcularTotalSaida();
    }
}


function calcularTotalSaida() {
    const quantidade =
        parseFloat(document.getElementById("saida-quantidade").value) || 0;

    const fator =
        parseFloat(document.getElementById("saida-fator").value) || 1;

    const total = quantidade * fator;

    const select =
        document.getElementById("saida-unidade");

    const unidade =
        select.options[select.selectedIndex].textContent;

    document.getElementById("saida-formula").textContent =
        `${quantidade} × ${fator} = ${total.toFixed(2)}`;

    document.getElementById("saida-total").textContent =
        total.toFixed(2);

    document.getElementById("saida-sigla").textContent =
        unidade;
}


function registrarSaidaConversao() {

    const codigo =
        document.getElementById("saida-codigo").value.trim();

    const nome =
        document.getElementById("saida-nome").value.trim();

    const quantidade =
        parseFloat(
            document.getElementById("saida-quantidade").value
        );

    const fator =
        parseFloat(
            document.getElementById("saida-fator").value
        );

    const total = quantidade * fator;

    const unidade =
        document.getElementById("saida-unidade").value;

    const responsavel =
        document.getElementById("saida-responsavel").value.trim();

    if (!codigo) {
        return alert("⚠️ Informe o código do produto!");
    }

    if (!nome || nome.startsWith("(")) {
        return alert("⚠️ Produto não encontrado!");
    }

    if (isNaN(quantidade) || quantidade <= 0) {
        return alert("⚠️ Informe uma quantidade válida!");
    }

    if (isNaN(fator) || fator <= 0) {
        return alert("⚠️ Informe um volume/peso válido!");
    }

    if (!responsavel) {
        return alert("⚠️ Informe o responsável pela saída!");
    }

    const produto = produtos.find(
        p => String(p.codigo) === String(codigo)
    );

    if (!produto) {
        return alert("⚠️ Produto não cadastrado!");
    }

    const estoqueAtual = Number(produto.quantidade) || 0;

    if (total > estoqueAtual) {
        return alert(
            `⚠️ Estoque insuficiente!\n\n` +
            `Estoque disponível: ${estoqueAtual.toFixed(2)} ${unidade}\n` +
            `Tentativa de saída: ${total.toFixed(2)} ${unidade}`
        );
    }

    // Desconta a quantidade convertida do estoque
    produto.quantidade = estoqueAtual - total;

    // Registra a movimentação
    movimentacoes.push({
        codigo: codigo,
        nome: produto.nome,
        tipo: "saida",
        quantidade: total,
        unidade: unidade,
        fator: fator,
        quantidadeUnidades: quantidade,
        responsavel: responsavel,
        data: new Date().toLocaleString("pt-BR")
    });

    // Salva os dados
    salvar();

    // Atualiza as tabelas
    listarProdutos();
    atualizarEstoque();

    alert(
        `✅ Saída registrada com sucesso!\n\n` +
        `Produto: ${produto.nome}\n` +
        `Quantidade descontada: ${total.toFixed(2)} ${unidade}\n` +
        `Responsável: ${responsavel}`
    );

    limparFormSaida();
}


function limparFormSaida() {

    document.getElementById("saida-codigo").value = "";
    document.getElementById("saida-nome").value = "";
    document.getElementById("saida-estoque").value = "0.00";

    document.getElementById("saida-quantidade").value = "1";
    document.getElementById("saida-fator").value = "1";

    document.getElementById("saida-unidade").value = "un";

    document.getElementById("saida-responsavel").value = "";

    calcularTotalSaida();
}

function buscarFornecedorNF() {
    const cnpj = document.getElementById('nf-cnpj').value.trim().replace(/\D/g, '');
    const f = fornecedores.find(x => x.cnpj.replace(/\D/g, '') === cnpj);
    document.getElementById('nf-razao').value = f ? f.razao : '(Fornecedor não cadastrado)';
}

function buscarProdutoNF() {
    const cod = document.getElementById('nf-codigo').value.trim();
    const p = produtos.find(x => String(x.codigo) === String(cod));
    if (p) {
        document.getElementById('nf-nome').value = p.nome;
        document.getElementById('nf-preco').value = p.preco.toFixed(2);
    } else {
        document.getElementById('nf-nome').value = '(Produto não cadastrado)';
    }
    calcularTotalNF();
}

function calcularTotalNF() {
    const qtd = parseFloat(document.getElementById('nf-quantidade').value) || 0;
    const fator = parseFloat(document.getElementById('nf-fator').value) || 1;
    const total = qtd * fator;
    const un = document.getElementById('nf-unidade').value;

    document.getElementById('nf-formula').textContent = `${qtd} × ${fator} = ${total.toFixed(2)}`;
    document.getElementById('nf-total').textContent = total.toFixed(2);
    document.getElementById('nf-sigla').textContent = un;
}

function adicionarItemNF() {
    const cod = document.getElementById('nf-codigo').value.trim();
    const nome = document.getElementById('nf-nome').value.trim();
    const qtd = parseFloat(document.getElementById('nf-quantidade').value);
    const preco = parseFloat(document.getElementById('nf-preco').value.replace(',', '.'));
    const fator = parseFloat(document.getElementById('nf-fator').value);
    const un = document.getElementById('nf-unidade').value;
    const total = qtd * fator;

    if (!cod || !nome || nome.startsWith('(') || isNaN(qtd) || qtd <= 0) {
        return alert("Preencha o código de um produto cadastrado!");
    }

    itensNF.push({ codigo: cod, nome: nome, quantidade: qtd, fator: fator, total: total, unidade: un, preco: preco });
    atualizarTabelaNF();

    document.getElementById('nf-codigo').value = '';
    document.getElementById('nf-nome').value = '';
    document.getElementById('nf-quantidade').value = '1';
    document.getElementById('nf-fator').value = '1';
    calcularTotalNF();
}

function atualizarTabelaNF() {
    const tb = document.getElementById('tabela-itens-nf');
    tb.innerHTML = '';
    itensNF.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.codigo}</td>
            <td>${item.nome}</td>
            <td>${item.quantidade}</td>
            <td>${item.fator}</td>
            <td>${item.total.toFixed(2)}</td>
            <td>${item.unidade}</td>
            <td>R$ ${item.preco.toFixed(2)}</td>
            <td><button class="perigo" onclick="removerItemNF(${idx})">Excluir</button></td>
        `;
        tb.appendChild(tr);
    });
}

function removerItemNF(idx) {
    itensNF.splice(idx, 1);
    atualizarTabelaNF();
}

function registrarEntradaNF() {
    const resp = document.getElementById('nf-responsavel').value.trim();
    if (!resp) return alert("Informe o responsável pela entrada!");
    if (itensNF.length === 0) return alert("Adicione pelo menos um item!");

    let ok = 0;
    itensNF.forEach(item => {
        const p = produtos.find(x => String(x.codigo) === String(item.codigo));
        if (p) {
            p.quantidade += item.total;
            p.ultima = new Date().toLocaleString('pt-BR');
            movimentacoes.push({
                codigo: item.codigo,
                produto: item.nome,
                quantidade: item.total,
                tipo: 'entrada',
                responsavel: resp,
                data: p.ultima,
                unidade: item.unidade,
                fatorUsado: item.fator
            });
            ok++;
        }
    });

    salvar();
    listarProdutos();
    atualizarEstoque();
    alert(`✅ Entrada registrada! ${ok} item(ns) adicionado(s) ao estoque.`);
    limparFormNF();
    itensNF = [];
    document.getElementById('tabela-itens-nf').innerHTML = '';
    document.getElementById('form-entrada-nf').style.display = 'none';
}

function limparFormNF() {
    document.getElementById('nf-cnpj').value = '';
    document.getElementById('nf-razao').value = '';
    document.getElementById('nf-codigo').value = '';
    document.getElementById('nf-nome').value = '';
    document.getElementById('nf-quantidade').value = '1';
    document.getElementById('nf-preco').value = '0.00';
    document.getElementById('nf-fator').value = '1';
    document.getElementById('nf-unidade').value = 'L';
    document.getElementById('nf-responsavel').value = '';
    calcularTotalNF();
}

// ==============================================
// PRODUTOS
// ==============================================
function buscarProduto() {
    const cod = document.getElementById('codigoProd').value.trim();
    if (!cod) { limparCampos(); return; }
    const p = produtos.find(x => String(x.codigo) === String(cod));
    if (p) {
        document.getElementById('nomeProd').value = p.nome;
        document.getElementById('categoriaProd').value = p.categoria;
        document.getElementById('precoProd').value = p.preco.toFixed(2);
    } else limparCampos();
}

function limparCampos() {
    document.getElementById('nomeProd').value = '';
    document.getElementById('categoriaProd').value = '';
    document.getElementById('precoProd').value = '';
}

function cadastrarProduto() {
    const codigo = document.getElementById('codigoNovo').value.trim();
    const nome = document.getElementById('nomeNovo').value.trim();
    const cat = document.getElementById('categoriaNova').value.trim();
    const preco = parseFloat(document.getElementById('precoNovo').value.replace(',', '.'));
    const unidade = document.getElementById('unidadeNova').value;
    if (!codigo || !nome || !cat || isNaN(preco) || preco <= 0) return alert("Preencha todos os campos corretamente!");
    if (produtos.some(x => String(x.codigo) === String(codigo))) return alert("Já existe produto com este código!");
    produtos.push({ codigo, nome, categoria: cat, preco, quantidade: 0, ultima: new Date().toLocaleString('pt-BR') });
    salvar(); listarProdutos(); atualizarEstoque();
    alert("✅ Produto cadastrado com sucesso!");
    document.getElementById('codigoNovo').value = '';
    document.getElementById('nomeNovo').value = '';
    document.getElementById('categoriaNova').value = '';
    document.getElementById('precoNovo').value = '';
}

function listarProdutos() {
    const tb = document.querySelector('#tabela-produtos tbody');
    tr.innerHTML = `
    <td>${p.codigo}</td>
    <td>${p.nome}</td>
    <td>${p.categoria}</td>
    <td>R$ ${p.preco.toFixed(2)}</td>
    <td>${p.unidade || 'UN'}</td>
    <td>${p.quantidade}</td>
    <td>R$ ${(p.preco * p.quantidade).toFixed(2)}</td>
`;
}
function registrarMovimentacao() {
    const cod = document.getElementById('codigoProd').value.trim();
    const qtd = parseFloat(document.getElementById('qtdProd').value);
    const resp = document.getElementById('responsavel').value.trim();
    const tipo = document.getElementById('tipoMov').value;
    if (!cod || isNaN(qtd) || qtd <= 0 || !resp) return alert("Preencha todos os campos corretamente!");
    const p = produtos.find(x => String(x.codigo) === String(cod));
    if (!p) return alert("Produto não encontrado! Cadastre-o primeiro.");
    if (tipo === 'entrada') p.quantidade += qtd;
    else { if (p.quantidade < qtd) return alert("Estoque insuficiente! Disponível: " + p.quantidade); p.quantidade -= qtd; }
    p.ultima = new Date().toLocaleString('pt-BR');
    movimentacoes.push({ codigo: cod, produto: p.nome, categoria: p.categoria, quantidade: qtd, tipo, responsavel: resp, data: p.ultima });
    salvar(); listarProdutos(); atualizarEstoque(); limparCampos();
    document.getElementById('qtdProd').value = '1';
    document.getElementById('responsavel').value = '';
    document.getElementById('codigoProd').value = '';
    alert("✅ Movimentação registrada com sucesso!");
}

function atualizarEstoque() {
    const tb = document.querySelector('#tabela-estoque tbody');
    tr.innerHTML = `
    <td>${p.codigo}</td>

    <td>${p.nome}</td>

    <td>${p.categoria}</td>

    <td>R$ ${p.preco.toFixed(2)}</td>

    <td>${p.unidade || 'UN'}</td>

    <td>${p.quantidade}</td>

    <td>R$ ${(p.preco * p.quantidade).toFixed(2)}</td>

    <td>${p.ultima || '-'}</td>

    <td>
        <button
            class="perigo"
            onclick="excluirProduto('${p.codigo}')"
        >
            Excluir
        </button>
    </td>
`;
}

function excluirProduto(cod) {
    if (!confirm("Deseja excluir este produto?")) return;
    produtos = produtos.filter(x => String(x.codigo) !== String(cod));
    salvar(); listarProdutos(); atualizarEstoque();
}

let visivelProd = true;
function mostrarOcultarProdutos() {
    visivelProd = !visivelProd;
    document.getElementById('tabela-produtos').style.display = visivelProd ? '' : 'none';
    event.target.textContent = visivelProd ? 'Ocultar' : 'Mostrar';
}

let visivelEstoque = true;
function mostrarOcultarEstoque() {
    visivelEstoque = !visivelEstoque;
    document.getElementById('tabela-estoque').style.display = visivelEstoque ? '' : 'none';
    event.target.textContent = visivelEstoque ? 'Ocultar' : 'Mostrar';
}

function filtrarPorCategoria() {
    const cat = prompt("Digite a categoria para filtrar (deixe vazio para todas):", "");
    const filtrados = (!cat) ? produtos : produtos.filter(p => p.categoria.toLowerCase().includes(cat.toLowerCase()));
    const tb = document.querySelector('#tabela-produtos tbody'); tb.innerHTML = '';
    filtrados.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.codigo}</td><td>${p.nome}</td><td>${p.categoria}</td><td>R$ ${p.preco.toFixed(2)}</td><td>${p.quantidade}</td><td>R$ ${(p.preco * p.quantidade).toFixed(2)}</td>`;
        tb.appendChild(tr);
    });
}

function exportarParaExcel() {
    if (!produtos.length) return alert("Não há produtos para exportar!");
    let csv = "Código;Nome;Categoria;Preço;Quantidade;Valor Total\n";
    produtos.forEach(p => csv += `${p.codigo};${p.nome};${p.categoria};${p.preco.toFixed(2)};${p.quantidade};${(p.preco * p.quantidade).toFixed(2)}\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `estoque_${new Date().toLocaleDateString('pt-BR').replaceAll('/','-')}.csv`;
    a.click();
}

function importarDoExcel(e) {
    const arq = e.target.files[0]; if (!arq) return;
    const leitor = new FileReader();
    leitor.onload = evt => {
        const linhas = evt.target.result.split('\n');
        let cont = 0;
        for (let i = 1; i < linhas.length; i++) {
            const [cod, nome, cat, preco, qtd] = linhas[i].split(';');
            if (!cod) continue;
            const ex = produtos.find(p => String(p.codigo.trim()) === String(cod.trim()));
            if (ex) { ex.nome = nome.trim(); ex.categoria = cat.trim(); ex.preco = +preco.replace(',', '.'); }
            else {
                produtos.push({
                    codigo: cod.trim(), nome: nome.trim(), categoria: cat.trim(),
                    preco: +preco.replace(',', '.'), quantidade: parseInt(qtd) || 0,
                    ultima: new Date().toLocaleString('pt-BR')
                });
                cont++;
            }
        }
        salvar(); listarProdutos(); atualizarEstoque(); alert(`✅ Importado! ${cont} novo(s) produto(s).`);
    };
    leitor.readAsText(arq);
}

// ==============================================
// FORNECEDORES
// ==============================================
let visivelForn = true;
function alternarFornecedores() {
    visivelForn = !visivelForn;
    document.getElementById('form-fornecedor').style.display = visivelForn ? 'block' : 'none';
    document.getElementById('tabela-fornecedores').style.display = visivelForn ? 'table' : 'none';
    event.target.textContent = visivelForn ? 'Ocultar' : 'Mostrar';
}

function cadastrarFornecedor() {
    const f = {
        cnpj: document.getElementById('cnpjForn').value.trim(),
        razao: document.getElementById('razaoForn').value.trim(),
        fantasia: document.getElementById('fantasiaForn').value.trim(),
        endereco: document.getElementById('enderecoForn').value.trim(),
        telefone: document.getElementById('telefoneForn').value.trim(),
        cidade: document.getElementById('cidadeForn').value.trim()
    };
    if (!f.cnpj || !f.razao) return alert("CNPJ e Razão Social são obrigatórios!");
    fornecedores.push(f); salvar(); listarFornecedores(); atualizarSelectFornecedores();
    alert("✅ Fornecedor cadastrado com sucesso!");
    document.getElementById('cnpjForn').value = '';
    document.getElementById('razaoForn').value = '';
    document.getElementById('fantasiaForn').value = '';
    document.getElementById('enderecoForn').value = '';
    document.getElementById('telefoneForn').value = '';
    document.getElementById('cidadeForn').value = '';
}

function listarFornecedores() {
    const tb = document.querySelector('#tabela-fornecedores tbody');
    tb.innerHTML = '';
    fornecedores.forEach((f, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${f.cnpj}</td><td>${f.razao}</td><td>${f.fantasia}</td><td>${f.endereco}</td><td>${f.telefone}</td><td>${f.cidade}</td><td><button class="perigo" onclick="excluirFornecedor(${idx})">Excluir</button></td>`;
        tb.appendChild(tr);
    });
}

function excluirFornecedor(idx) {
    if (!confirm("Excluir fornecedor?")) return;
    fornecedores.splice(idx, 1); salvar(); listarFornecedores(); atualizarSelectFornecedores();
}

function atualizarSelectFornecedores() {
    const sel = document.getElementById('selectFornecedorEntrada');
    sel.innerHTML = '<option value="">-- Selecione --</option>';
    fornecedores.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.cnpj;
        opt.textContent = f.razao;
        sel.appendChild(opt);
    });
}

function carregarProdutosFornecedor() {
    document.getElementById('area-entrada-frn').style.display = 'block';
}

function registrarEntradaForn() {
    alert("Função em desenvolvimento!");
}

// ==============================================
// XML
// ==============================================
function importarEntradaXML() {
    alert("Importação XML pronta para receber o arquivo!");
}

// ==============================================
// RELATÓRIOS
// ==============================================
function gerarRelatorio() {
    document.getElementById('conteudo-relatorio').innerHTML = "<strong>Relatório de movimentações</strong><br>Função pronta para uso!";
}

function relatorioCompleto() {
    gerarRelatorio();
}