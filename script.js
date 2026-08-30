// ============================================================
// 📦 SISTEMA DE CONTROLE DE ESTOQUE
// SCRIPT.JS COMPLETO
// ============================================================

// ============================================================
// 🔐 CONFIGURAÇÕES
// ============================================================

const SENHA_SISTEMA = "1234";
const SENHA_ENTRADA_VENDA = "5678";

let produtos = [];
let movimentacoes = [];
let fornecedores = [];
let itensNF = [];

let visivelEstoque = true;
let categoriaFiltrada = null;


// ============================================================
// 🚀 INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    carregarDados();

    configurarDatas();

    verificarLogin();

    atualizarTabelaEstoque();

    atualizarFornecedores();

    atualizarListaItensNF();

});


// ============================================================
// 💾 CARREGAR DADOS
// ============================================================

function carregarDados() {

    try {

        produtos = JSON.parse(
            localStorage.getItem("estoque_produtos") || "[]"
        );

        movimentacoes = JSON.parse(
            localStorage.getItem("estoque_movimentacoes") || "[]"
        );

        fornecedores = JSON.parse(
            localStorage.getItem("estoque_fornecedores") || "[]"
        );

        itensNF = JSON.parse(
            localStorage.getItem("estoque_itens_nf") || "[]"
        );

        if (!Array.isArray(produtos)) produtos = [];
        if (!Array.isArray(movimentacoes)) movimentacoes = [];
        if (!Array.isArray(fornecedores)) fornecedores = [];
        if (!Array.isArray(itensNF)) itensNF = [];

    } catch (erro) {

        console.error("Erro ao carregar dados:", erro);

        produtos = [];
        movimentacoes = [];
        fornecedores = [];
        itensNF = [];

    }

}


// ============================================================
// 💾 SALVAR DADOS
// ============================================================

function salvarDados() {

    localStorage.setItem(
        "estoque_produtos",
        JSON.stringify(produtos)
    );

    localStorage.setItem(
        "estoque_movimentacoes",
        JSON.stringify(movimentacoes)
    );

    localStorage.setItem(
        "estoque_fornecedores",
        JSON.stringify(fornecedores)
    );

    localStorage.setItem(
        "estoque_itens_nf",
        JSON.stringify(itensNF)
    );

}


// ============================================================
// 🔐 LOGIN
// ============================================================

function verificarLogin() {

    const logado =
        localStorage.getItem("sistemaLogado");

    const telaLogin =
        document.getElementById("tela-login");

    const sistema =
        document.getElementById("sistema");


    if (logado === "true") {

        if (telaLogin) {
            telaLogin.style.display = "none";
        }

        if (sistema) {
            sistema.style.display = "block";
        }

    } else {

        if (telaLogin) {
            telaLogin.style.display = "flex";
        }

        if (sistema) {
            sistema.style.display = "none";
        }

    }

}


function entrarSistema() {

    const campo =
        document.getElementById("campo-senha");

    const aviso =
        document.getElementById("aviso-erro");


    if (!campo) return;


    if (campo.value === SENHA_SISTEMA) {

        localStorage.setItem(
            "sistemaLogado",
            "true"
        );

        if (aviso) {
            aviso.style.display = "none";
        }

        verificarLogin();

        campo.value = "";

    } else {

        if (aviso) {
            aviso.style.display = "block";
        }

        campo.value = "";

        campo.focus();

    }

}


function sairSistema() {

    if (
        !confirm(
            "Deseja realmente sair do sistema?"
        )
    ) {
        return;
    }


    localStorage.removeItem(
        "sistemaLogado"
    );

    verificarLogin();

}


// ============================================================
// 📑 ABAS
// ============================================================

function trocarAba(numero) {

    const abas =
        document.querySelectorAll(".aba");

    const conteudos =
        document.querySelectorAll(".conteudo-aba");


    abas.forEach(function (aba) {

        aba.classList.remove("ativa");

    });


    conteudos.forEach(function (conteudo) {

        conteudo.classList.remove("visivel");

    });


    if (abas[numero]) {

        abas[numero].classList.add("ativa");

    }


    if (conteudos[numero]) {

        conteudos[numero].classList.add("visivel");

    }

}


// ============================================================
// 📅 DATA
// ============================================================

function dataHojeISO() {

    const data = new Date();

    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            data.getDate()
        ).padStart(2, "0");


    return `${ano}-${mes}-${dia}`;

}


function formatarData(data) {

    if (!data) {
        return "-";
    }


    const texto =
        String(data);


    // Data com horário
    if (
        texto.includes("T")
    ) {

        const partes =
            texto.split("T");


        const dataParte =
            partes[0];

        const horaParte =
            partes[1]
                ? partes[1]
                    .substring(0, 8)
                : "";


        const p =
            dataParte.split("-");


        if (p.length === 3) {

            return `${p[2]}/${p[1]}/${p[0]} ${horaParte}`;

        }

    }


    const partes =
        texto.split("-");


    if (partes.length === 3) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }


    return texto;

}


function configurarDatas() {

    const hoje =
        dataHojeISO();


    const campos = [
        "mov-emissao-nf",
        "mov-data"
    ];


    campos.forEach(function (id) {

        const campo =
            document.getElementById(id);


        if (
            campo &&
            !campo.value
        ) {

            campo.value = hoje;

        }

    });

}


// ============================================================
// 💰 CONVERSÃO DE NÚMEROS
// ============================================================

function converterNumero(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return 0;
    }


    if (
        typeof valor === "number"
    ) {

        return isNaN(valor)
            ? 0
            : valor;

    }


    let texto =
        String(valor)
            .trim()
            .replace(/\s/g, "");


    if (
        texto.includes(".") &&
        texto.includes(",")
    ) {

        texto =
            texto
                .replace(/\./g, "")
                .replace(",", ".");

    } else if (
        texto.includes(",")
    ) {

        texto =
            texto.replace(",", ".");

    }


    const numero =
        parseFloat(texto);


    return isNaN(numero)
        ? 0
        : numero;

}


function formatarMoeda(valor) {

    return converterNumero(valor)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

}


function formatarQuantidade(valor) {

    return converterNumero(valor)
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

}


// ============================================================
// 🔢 LOCALIZAR PRODUTO
// ============================================================

function encontrarProduto(codigo) {

    if (
        codigo === null ||
        codigo === undefined
    ) {
        return null;
    }


    const procurado =
        String(codigo)
            .trim()
            .toLowerCase();


    return produtos.find(function (produto) {

        return String(
            produto.codigo
        )
        .trim()
        .toLowerCase()
        === procurado;

    }) || null;

}


// ============================================================
// 🔢 GERAR PRÓXIMO CÓDIGO
// ============================================================

function gerarCodigoProduto() {

    if (produtos.length === 0) {
        return "001";
    }


    let maior = 0;


    produtos.forEach(function (produto) {

        const numero =
            parseInt(
                produto.codigo,
                10
            );


        if (
            !isNaN(numero) &&
            numero > maior
        ) {

            maior = numero;

        }

    });


    return String(
        maior + 1
    ).padStart(3, "0");

}


// ============================================================
// 📝 CADASTRAR PRODUTO
// ============================================================

function cadastrarProduto() {

    const codigoCampo =
        document.getElementById(
            "codigoNovo"
        );

    const nomeCampo =
        document.getElementById(
            "nomeNovo"
        );

    const categoriaCampo =
        document.getElementById(
            "categoriaNova"
        );

    const precoCampo =
        document.getElementById(
            "precoNovo"
        );

    const qtdCampo =
        document.getElementById(
            "qtdNovo"
        );

    const unidadeCampo =
        document.getElementById(
            "unidadeNova"
        );


    let codigo =
        codigoCampo
            ? codigoCampo.value.trim()
            : "";


    const nome =
        nomeCampo
            ? nomeCampo.value.trim()
            : "";


    const categoria =
        categoriaCampo
            ? categoriaCampo.value.trim()
            : "";


    const preco =
        precoCampo
            ? converterNumero(
                precoCampo.value
            )
            : 0;


    const quantidade =
        qtdCampo
            ? converterNumero(
                qtdCampo.value
            )
            : 0;


    const unidade =
        unidadeCampo
            ? unidadeCampo.value
            : "UN";


    if (!codigo) {

        codigo =
            gerarCodigoProduto();

    }


    if (!nome) {

        alert(
            "Digite o nome do produto."
        );

        return;

    }


    if (!categoria) {

        alert(
            "Digite a categoria."
        );

        return;

    }


    if (preco < 0) {

        alert(
            "O preço não pode ser negativo."
        );

        return;

    }


    if (quantidade < 0) {

        alert(
            "A quantidade não pode ser negativa."
        );

        return;

    }


    if (
        encontrarProduto(codigo)
    ) {

        alert(
            "Já existe um produto com o código " +
            codigo + "."
        );

        return;

    }


    produtos.push({

        codigo: codigo,

        nome: nome,

        categoria: categoria,

        preco: preco,

        unidade: unidade,

        quantidade: quantidade,

        ultimaMovimentacao:
            quantidade > 0
                ? dataHojeISO()
                : ""

    });


    salvarDados();

    atualizarTabelaEstoque();


    alert(
        "Produto cadastrado com sucesso!"
    );


    if (codigoCampo) {
        codigoCampo.value = "";
    }

    if (nomeCampo) {
        nomeCampo.value = "";
    }

    if (categoriaCampo) {
        categoriaCampo.value = "";
    }

    if (precoCampo) {
        precoCampo.value = "";
    }

    if (qtdCampo) {
        qtdCampo.value = "0";
    }

    if (unidadeCampo) {
        unidadeCampo.value = "UN";
    }

}


// ============================================================
// 🔍 BUSCAR PRODUTO - CADASTRO
// ============================================================

function buscarProdutoCadastro() {

    const campo =
        document.getElementById(
            "codigoBusca"
        );


    if (!campo) return;


    const codigo =
        campo.value.trim();


    const produto =
        encontrarProduto(codigo);


    if (!produto) {

        limparCamposBusca();


        if (codigo) {

            alert(
                "Produto não encontrado."
            );

        }

        return;

    }


    preencherCampo(
        "nomeProd",
        produto.nome
    );


    preencherCampo(
        "categoriaProd",
        produto.categoria
    );


    preencherCampo(
        "precoProd",
        formatarMoeda(
            produto.preco
        )
    );

}


function preencherCampo(
    id,
    valor
) {

    const campo =
        document.getElementById(id);


    if (campo) {

        campo.value =
            valor ?? "";

    }

}


function limparCamposBusca() {

    preencherCampo(
        "nomeProd",
        ""
    );

    preencherCampo(
        "categoriaProd",
        ""
    );

    preencherCampo(
        "precoProd",
        ""
    );

}


function limparCampos() {

    const ids = [

        "codigoBusca",

        "nomeProd",

        "categoriaProd",

        "precoProd"

    ];


    ids.forEach(function (id) {

        const campo =
            document.getElementById(id);


        if (campo) {

            campo.value = "";

        }

    });

}


// ============================================================
// 📊 BOTÃO: OCULTAR / MOSTRAR ESTOQUE
// ============================================================

function mostrarOcultarEstoque() {

    visivelEstoque =
        !visivelEstoque;


    const botao =
        document.getElementById(
            "botao-ocultar-estoque"
        );


    if (botao) {

        botao.textContent =
            visivelEstoque
                ? "👁️ Ocultar Estoque"
                : "👁️ Mostrar Estoque";

    }


    atualizarTabelaEstoque();

}


// ============================================================
// 📊 ATUALIZAR TABELA
// ============================================================

function atualizarTabelaEstoque() {

    const tbody =
        document.querySelector(
            "#tabela-estoque tbody"
        );


    if (!tbody) return;


    tbody.innerHTML = "";


    let lista =
        [...produtos];


    // Aplica filtro
    if (categoriaFiltrada) {

        lista =
            lista.filter(
                function (produto) {

                    return String(
                        produto.categoria
                    )
                    .toLowerCase()
                    .includes(
                        categoriaFiltrada
                            .toLowerCase()
                    );

                }
            );

    }


    if (lista.length === 0) {

        const linha =
            document.createElement("tr");


        linha.innerHTML = `

            <td
                colspan="9"
                style="text-align:center;padding:20px;"
            >
                ${
                    categoriaFiltrada
                        ? "Nenhum produto encontrado para a categoria selecionada."
                        : "Nenhum produto cadastrado."
                }
            </td>

        `;


        tbody.appendChild(linha);

        return;

    }


    lista.forEach(
        function (produto) {

            const linha =
                document.createElement("tr");


            const quantidade =
                converterNumero(
                    produto.quantidade
                );


            const preco =
                converterNumero(
                    produto.preco
                );


            const total =
                quantidade * preco;


            const codigo =
                escapeHTML(
                    produto.codigo
                );


            const nome =
                escapeHTML(
                    produto.nome
                );


            const categoria =
                escapeHTML(
                    produto.categoria
                );


            const unidade =
                escapeHTML(
                    produto.unidade || "UN"
                );


            linha.innerHTML = `

                <td>${codigo}</td>

                <td>${nome}</td>

                <td>${categoria}</td>

                <td>
                    ${
                        visivelEstoque
                            ? formatarMoeda(preco)
                            : "••••••"
                    }
                </td>

                <td>${unidade}</td>

                <td>
                    ${
                        visivelEstoque
                            ? formatarQuantidade(
                                quantidade
                            )
                            : "••••••"
                    }
                </td>

                <td>
                    ${
                        visivelEstoque
                            ? formatarMoeda(total)
                            : "••••••"
                    }
                </td>

                <td>
                    ${formatarData(
                        produto.ultimaMovimentacao
                    )}
                </td>

                <td>

                    <button
                        type="button"
                        onclick="excluirProdutoPorCodigo('${escapeJS(produto.codigo)}')"
                    >
                        🗑️ Excluir
                    </button>

                </td>

            `;


            tbody.appendChild(linha);

        }
    );

}


// ============================================================
// 🗑️ EXCLUIR PRODUTO
// ============================================================

function excluirProdutoPorCodigo(codigo) {

    const produto =
        encontrarProduto(codigo);


    if (!produto) {

        alert(
            "Produto não encontrado."
        );

        return;

    }


    const confirmar =
        confirm(

            "Deseja excluir este produto?\n\n" +

            "Código: " +
            produto.codigo +

            "\nProduto: " +
            produto.nome

        );


    if (!confirmar) return;


    produtos =
        produtos.filter(
            function (item) {

                return String(
                    item.codigo
                ) !== String(
                    produto.codigo
                );

            }
        );


    salvarDados();

    atualizarTabelaEstoque();


    alert(
        "Produto excluído com sucesso!"
    );

}


// Compatibilidade com código anterior
function excluirProduto(indice) {

    if (
        indice >= 0 &&
        indice < produtos.length
    ) {

        excluirProdutoPorCodigo(
            produtos[indice].codigo
        );

    }

}


// ============================================================
// 🔍 BOTÃO: FILTRAR CATEGORIA
// ============================================================

function filtrarPorCategoria() {

    if (produtos.length === 0) {

        alert(
            "Não existem produtos cadastrados."
        );

        return;

    }


    const categorias =
        [
            ...new Set(
                produtos.map(
                    function (produto) {

                        return produto.categoria;

                    }
                )
            )
        ];


    categorias.sort();


    const lista =
        categorias
            .map(
                function (categoria, indice) {

                    return (
                        (indice + 1) +
                        " - " +
                        categoria
                    );

                }
            )
            .join("\n");


    const resposta =
        prompt(

            "Digite a categoria que deseja visualizar.\n\n" +

            lista +

            "\n\nDigite CANCELAR para mostrar todos."

        );


    if (resposta === null) {
        return;
    }


    if (
        resposta
            .trim()
            .toLowerCase()
        === "cancelar"
    ) {

        categoriaFiltrada = null;

        atualizarTabelaEstoque();

        return;

    }


    const texto =
        resposta.trim();


    // Permite digitar o número da categoria
    const numero =
        parseInt(
            texto,
            10
        );


    if (
        !isNaN(numero) &&
        numero >= 1 &&
        numero <= categorias.length
    ) {

        categoriaFiltrada =
            categorias[numero - 1];

    } else {

        categoriaFiltrada =
            texto;

    }


    atualizarTabelaEstoque();


    if (
        !produtos.some(
            function (produto) {

                return String(
                    produto.categoria
                )
                .toLowerCase()
                .includes(
                    categoriaFiltrada
                        .toLowerCase()
                );

            }
        )
    ) {

        alert(
            "Nenhum produto encontrado nessa categoria."
        );

        categoriaFiltrada = null;

        atualizarTabelaEstoque();

    }

}


// ============================================================
// 📊 BOTÃO: EXPORTAR EXCEL
// ============================================================

function exportarParaExcel() {

    if (produtos.length === 0) {

        alert(
            "Não existem produtos para exportar."
        );

        return;

    }


    let csv =
        "Código;Nome do Produto;Categoria;Preço Unitário;Unidade;Quantidade;Valor Total;Última Movimentação\n";


    produtos.forEach(
        function (produto) {

            const preco =
                converterNumero(
                    produto.preco
                );


            const quantidade =
                converterNumero(
                    produto.quantidade
                );


            const total =
                preco * quantidade;


            csv += [

                escaparCSV(
                    produto.codigo
                ),

                escaparCSV(
                    produto.nome
                ),

                escaparCSV(
                    produto.categoria
                ),

                preco
                    .toFixed(2)
                    .replace(".", ","),

                escaparCSV(
                    produto.unidade || "UN"
                ),

                quantidade
                    .toString()
                    .replace(".", ","),

                total
                    .toFixed(2)
                    .replace(".", ","),

                escaparCSV(
                    formatarData(
                        produto.ultimaMovimentacao
                    )
                )

            ].join(";") + "\n";

        }
    );


    const blob =
        new Blob(
            [
                "\ufeff" +
                csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        "controle_estoque_" +
        dataHojeISO() +
        ".csv";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );


    alert(
        "Estoque exportado com sucesso!\n\n" +
        "O arquivo foi salvo em formato CSV, compatível com Excel."
    );

}


function escaparCSV(valor) {

    const texto =
        String(valor ?? "");


    if (
        texto.includes(";") ||
        texto.includes('"') ||
        texto.includes("\n")
    ) {

        return '"' +
            texto.replace(
                /"/g,
                '""'
            ) +
            '"';

    }


    return texto;

}


// ============================================================
// 📂 BOTÃO: IMPORTAR EXCEL
// ============================================================

function importarDoExcel() {

    const input =
        document.createElement("input");


    input.type = "file";


    input.accept =
        ".csv,.txt,.xlsx,.xls";


    input.style.display =
        "none";


    document.body.appendChild(
        input
    );


    input.addEventListener(
        "change",
        function () {

            const arquivo =
                input.files[0];


            if (!arquivo) {

                document.body.removeChild(
                    input
                );

                return;

            }


            const nome =
                arquivo.name.toLowerCase();


            if (
                nome.endsWith(".xlsx") ||
                nome.endsWith(".xls")
            ) {

                importarArquivoExcel(
                    arquivo
                );

            } else {

                importarArquivoCSV(
                    arquivo
                );

            }

        }
    );


    input.click();

}


// ============================================================
// 📊 IMPORTAR XLSX
// ============================================================

function importarArquivoExcel(
    arquivo
) {

    // Se SheetJS já estiver carregado
    if (
        typeof XLSX !== "undefined"
    ) {

        lerExcelComSheetJS(
            arquivo
        );

        return;

    }


    // Carrega SheetJS automaticamente
    const script =
        document.createElement(
            "script"
        );


    script.src =
        "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js";


    script.onload =
        function () {

            lerExcelComSheetJS(
                arquivo
            );

        };


    script.onerror =
        function () {

            alert(

                "Não foi possível carregar o leitor de Excel.\n\n" +

                "Você pode salvar sua planilha como CSV e importá-la."

            );

        };


    document.head.appendChild(
        script
    );

}


function lerExcelComSheetJS(
    arquivo
) {

    const leitor =
        new FileReader();


    leitor.onload =
        function (evento) {

            try {

                const dados =
                    new Uint8Array(
                        evento.target.result
                    );


                const workbook =
                    XLSX.read(
                        dados,
                        {
                            type: "array"
                        }
                    );


                const primeiraAba =
                    workbook.SheetNames[0];


                const planilha =
                    workbook.Sheets[
                        primeiraAba
                    ];


                const linhas =
                    XLSX.utils.sheet_to_json(
                        planilha,
                        {
                            header: 1,
                            defval: ""
                        }
                    );


                importarLinhasPlanilha(
                    linhas
                );


            } catch (erro) {

                console.error(
                    erro
                );


                alert(
                    "Erro ao ler o arquivo Excel."
                );

            }

        };


    leitor.readAsArrayBuffer(
        arquivo
    );

}


// ============================================================
// 📂 IMPORTAR CSV
// ============================================================

function importarArquivoCSV(
    arquivo
) {

    const leitor =
        new FileReader();


    leitor.onload =
        function (evento) {

            try {

                const texto =
                    evento.target.result;


                const linhas =
                    texto
                        .split(/\r?\n/)
                        .filter(
                            function (linha) {

                                return linha.trim();

                            }
                        );


                const dados =
                    linhas.map(
                        function (linha) {

                            return linha.split(";");

                        }
                    );


                importarLinhasPlanilha(
                    dados
                );


            } catch (erro) {

                console.error(
                    erro
                );


                alert(
                    "Erro ao importar o arquivo."
                );

            }

        };


    leitor.readAsText(
        arquivo,
        "UTF-8"
    );

}


// ============================================================
// 📥 PROCESSAR PLANILHA
// ============================================================

function importarLinhasPlanilha(
    linhas
) {

    if (
        !linhas ||
        linhas.length < 2
    ) {

        alert(
            "A planilha está vazia ou inválida."
        );

        return;

    }


    let inicio = 0;


    // Detecta cabeçalho
    const primeiraLinha =
        linhas[0]
            .join(" ")
            .toLowerCase();


    if (
        primeiraLinha.includes("código") ||
        primeiraLinha.includes("codigo") ||
        primeiraLinha.includes("produto")
    ) {

        inicio = 1;

    }


    let importados = 0;


    for (
        let i = inicio;
        i < linhas.length;
        i++
    ) {

        const colunas =
            linhas[i];


        if (
            !colunas ||
            colunas.length < 2
        ) {
            continue;
        }


        const codigo =
            limparTextoPlanilha(
                colunas[0]
            );


        const nome =
            limparTextoPlanilha(
                colunas[1]
            );


        const categoria =
            limparTextoPlanilha(
                colunas[2] || "Importado"
            );


        const preco =
            converterNumero(
                colunas[3]
            );


        const unidade =
            limparTextoPlanilha(
                colunas[4] || "UN"
            );


        const quantidade =
            converterNumero(
                colunas[5]
            );


        if (
            !codigo ||
            !nome
        ) {

            continue;

        }


        const existente =
            encontrarProduto(
                codigo
            );


        if (existente) {

            existente.nome =
                nome;

            existente.categoria =
                categoria;

            existente.preco =
                preco;

            existente.unidade =
                unidade;

            existente.quantidade =
                quantidade;

            existente.ultimaMovimentacao =
                dataHojeISO();

        } else {

            produtos.push({

                codigo:
                    codigo,

                nome:
                    nome,

                categoria:
                    categoria,

                preco:
                    preco,

                unidade:
                    unidade,

                quantidade:
                    quantidade,

                ultimaMovimentacao:
                    dataHojeISO()

            });

        }


        importados++;

    }


    salvarDados();

    atualizarTabelaEstoque();


    alert(

        importados +
        " produto(s) importado(s) com sucesso!"

    );

}


function limparTextoPlanilha(
    valor
) {

    return String(
        valor ?? ""
    )
    .trim()
    .replace(/^"(.*)"$/, "$1");

}


// ============================================================
// 📥 BOTÃO: IMPORTAR XML NF-e
// ============================================================

function importarXML() {

    const input =
        document.createElement(
            "input"
        );


    input.type = "file";


    input.accept =
        ".xml";


    input.addEventListener(
        "change",
        function () {

            const arquivo =
                input.files[0];


            if (!arquivo) {
                return;
            }


            const leitor =
                new FileReader();


            leitor.onload =
                function (evento) {

                    processarXML(
                        evento.target.result
                    );

                };


            leitor.readAsText(
                arquivo,
                "UTF-8"
            );

        }
    );


    input.click();

}


// ============================================================
// 📥 PROCESSAR XML NF-e
// ============================================================

function processarXML(
    texto
) {

    try {

        const parser =
            new DOMParser();


        const xml =
            parser.parseFromString(
                texto,
                "text/xml"
            );


        if (
            xml.querySelector(
                "parsererror"
            )
        ) {

            alert(
                "O arquivo XML é inválido."
            );

            return;

        }


        const detalhes =
            encontrarElementosXML(
                xml,
                "det"
            );


        if (
            detalhes.length === 0
        ) {

            alert(
                "Nenhum produto foi encontrado no XML da NF-e."
            );

            return;

        }


        let processados = 0;


        detalhes.forEach(
            function (det) {

                const produtoXML =
                    encontrarPrimeiroElemento(
                        det,
                        "prod"
                    );


                if (!produtoXML) {
                    return;
                }


                const codigo =
                    obterTextoXML(
                        produtoXML,
                        "cProd"
                    );


                const nome =
                    obterTextoXML(
                        produtoXML,
                        "xProd"
                    );


                const unidade =
                    obterTextoXML(
                        produtoXML,
                        "uCom"
                    ) || "UN";


                const quantidade =
                    converterNumero(
                        obterTextoXML(
                            produtoXML,
                            "qCom"
                        )
                    );


                const preco =
                    converterNumero(
                        obterTextoXML(
                            produtoXML,
                            "vUnCom"
                        )
                    );


                if (
                    !codigo ||
                    !nome
                ) {

                    return;

                }


                const existente =
                    encontrarProduto(
                        codigo
                    );


                if (existente) {

                    existente.quantidade =
                        converterNumero(
                            existente.quantidade
                        ) +
                        quantidade;


                    if (preco > 0) {

                        existente.preco =
                            preco;

                    }


                    existente.unidade =
                        unidade;


                    existente.ultimaMovimentacao =
                        dataHojeISO();

                } else {

                    produtos.push({

                        codigo:
                            codigo,

                        nome:
                            nome,

                        categoria:
                            "Importado XML",

                        preco:
                            preco,

                        unidade:
                            unidade,

                        quantidade:
                            quantidade,

                        ultimaMovimentacao:
                            dataHojeISO()

                    });

                }


                const numeroNF =
                    obterTextoXML(
                        xml,
                        "nNF"
                    );


                movimentacoes.push({

                    id:
                        Date.now() +
                        Math.random(),

                    codigo:
                        codigo,

                    produto:
                        nome,

                    tipo:
                        "entrada",

                    quantidade:
                        quantidade,

                    numeroNF:
                        numeroNF,

                    emissaoNF:
                        obterTextoXML(
                            xml,
                            "dhEmi"
                        ),

                    data:
                        dataHojeISO(),

                    responsavel:
                        "Importação XML"

                });


                processados++;

            }
        );


        salvarDados();

        atualizarTabelaEstoque();


        alert(

            "XML NF-e importado com sucesso!\n\n" +

            "Itens processados: " +
            processados

        );


    } catch (erro) {

        console.error(
            "Erro XML:",
            erro
        );


        alert(
            "Ocorreu um erro ao processar o XML."
        );

    }

}


// ============================================================
// 🔎 FUNÇÕES PARA XML COM NAMESPACE
// ============================================================

function encontrarElementosXML(
    elemento,
    nome
) {

    const resultado = [];


    const todos =
        elemento.getElementsByTagName("*");


    for (
        let i = 0;
        i < todos.length;
        i++
    ) {

        if (
            todos[i].localName === nome ||
            todos[i].nodeName === nome
        ) {

            resultado.push(
                todos[i]
            );

        }

    }


    return resultado;

}


function encontrarPrimeiroElemento(
    elemento,
    nome
) {

    const lista =
        encontrarElementosXML(
            elemento,
            nome
        );


    return lista.length > 0
        ? lista[0]
        : null;

}


function obterTextoXML(
    elemento,
    nome
) {

    const encontrado =
        encontrarPrimeiroElemento(
            elemento,
            nome
        );


    return encontrado
        ? encontrado.textContent.trim()
        : "";

}


// ============================================================
// 📋 BOTÃO: GERAR RELATÓRIO
// ============================================================

function gerarRelatorio() {

    if (produtos.length === 0) {

        alert(
            "Não existem produtos cadastrados."
        );

        return;

    }


    let quantidadeTotal = 0;

    let valorTotalEstoque = 0;


    produtos.forEach(
        function (produto) {

            const quantidade =
                converterNumero(
                    produto.quantidade
                );


            const preco =
                converterNumero(
                    produto.preco
                );


            quantidadeTotal +=
                quantidade;


            valorTotalEstoque +=
                quantidade * preco;

        }
    );


    const totalEntradas =
        movimentacoes
            .filter(
                function (mov) {

                    return mov.tipo === "entrada";

                }
            )
            .reduce(
                function (total, mov) {

                    return total +
                        converterNumero(
                            mov.quantidade
                        );

                },
                0
            );


    const totalSaidas =
        movimentacoes
            .filter(
                function (mov) {

                    return mov.tipo === "saida";

                }
            )
            .reduce(
                function (total, mov) {

                    return total +
                        converterNumero(
                            mov.quantidade
                        );

                },
                0
            );


    const janela =
        window.open(
            "",
            "_blank",
            "width=1000,height=750"
        );


    if (!janela) {

        alert(
            "O navegador bloqueou a janela do relatório."
        );

        return;

    }


    let linhasProdutos = "";


    produtos.forEach(
        function (produto) {

            const quantidade =
                converterNumero(
                    produto.quantidade
                );


            const preco =
                converterNumero(
                    produto.preco
                );


            const total =
                quantidade * preco;


            linhasProdutos += `

                <tr>

                    <td>
                        ${escapeHTML(
                            produto.codigo
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            produto.nome
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            produto.categoria
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            produto.unidade || "UN"
                        )}
                    </td>

                    <td>
                        ${formatarQuantidade(
                            quantidade
                        )}
                    </td>

                    <td>
                        ${formatarMoeda(
                            preco
                        )}
                    </td>

                    <td>
                        ${formatarMoeda(
                            total
                        )}
                    </td>

                </tr>

            `;

        }
    );


    janela.document.write(`

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Relatório de Estoque</title>

<style>

body {

    font-family: Arial, sans-serif;

    margin: 30px;

    color: #222;

}

h1 {

    text-align: center;

    color: #1e40af;

}

h2 {

    margin-top: 30px;

    color: #1e40af;

}

.resumo {

    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap: 15px;

    margin: 20px 0;

}

.card {

    border: 1px solid #ccc;

    padding: 15px;

    border-radius: 8px;

    text-align: center;

}

.card strong {

    display: block;

    font-size: 22px;

    margin-top: 8px;

}

table {

    width: 100%;

    border-collapse: collapse;

    margin-top: 15px;

}

th {

    background: #1e40af;

    color: white;

}

th, td {

    border: 1px solid #ccc;

    padding: 9px;

    text-align: left;

}

button {

    padding: 10px 20px;

    margin-bottom: 20px;

    cursor: pointer;

}

@media print {

    button {

        display: none;

    }

}

@media(max-width:700px) {

    .resumo {

        grid-template-columns: 1fr;

    }

}

</style>

</head>

<body>

<button onclick="window.print()">
🖨️ Imprimir / Salvar PDF
</button>

<h1>
📊 RELATÓRIO DE ESTOQUE
</h1>

<p>
<strong>Data:</strong>
${formatarData(dataHojeISO())}
</p>

<div class="resumo">

<div class="card">

Produtos cadastrados

<strong>
${produtos.length}
</strong>

</div>

<div class="card">

Quantidade em estoque

<strong>
${formatarQuantidade(
    quantidadeTotal
)}
</strong>

</div>

<div class="card">

Valor do estoque

<strong>
${formatarMoeda(
    valorTotalEstoque
)}
</strong>

</div>

<div class="card">

Fornecedores

<strong>
${fornecedores.length}
</strong>

</div>

</div>

<h2>
📦 Produtos
</h2>

<table>

<thead>

<tr>

<th>Código</th>

<th>Produto</th>

<th>Categoria</th>

<th>Unidade</th>

<th>Quantidade</th>

<th>Preço</th>

<th>Valor Total</th>

</tr>

</thead>

<tbody>

${linhasProdutos}

</tbody>

</table>

<h2>
📥📤 Movimentações
</h2>

<p>
<strong>Total de entradas:</strong>
${formatarQuantidade(
    totalEntradas
)}
</p>

<p>
<strong>Total de saídas:</strong>
${formatarQuantidade(
    totalSaidas
)}
</p>

</body>

</html>

    `);


    janela.document.close();

}


// ============================================================
// 🏢 FORNECEDORES
// ============================================================

function atualizarFornecedores() {

    const tbody =
        document.querySelector(
            "#tabela-fornecedores tbody"
        );


    if (!tbody) return;


    tbody.innerHTML = "";


    fornecedores.forEach(
        function (fornecedor, indice) {

            const linha =
                document.createElement("tr");


            linha.innerHTML = `

                <td>
                    ${escapeHTML(
                        fornecedor.cnpj || ""
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        fornecedor.razaoSocial || ""
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        fornecedor.nomeFantasia || ""
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        fornecedor.telefone || ""
                    )}
                </td>

                <td>

                    <button
                        type="button"
                        onclick="excluirFornecedor(${indice})"
                    >
                        🗑️ Excluir
                    </button>

                </td>

            `;


            tbody.appendChild(
                linha
            );

        }
    );

}


// ============================================================
// ➕ CADASTRAR FORNECEDOR
// ============================================================

function cadastrarFornecedor() {

    const cnpj =
        obterValorDosIds([
            "fornecedor-cnpj",
            "cnpjFornecedor",
            "cnpj"
        ]);


    const razao =
        obterValorDosIds([
            "fornecedor-razao",
            "razaoSocial",
            "razao-fornecedor"
        ]);


    const fantasia =
        obterValorDosIds([
            "fornecedor-fantasia",
            "nomeFantasia"
        ]);


    const telefone =
        obterValorDosIds([
            "fornecedor-telefone",
            "telefoneFornecedor",
            "telefone"
        ]);


    if (!cnpj) {

        alert(
            "Digite o CNPJ."
        );

        return;

    }


    if (!razao) {

        alert(
            "Digite a razão social."
        );

        return;

    }


    const existe =
        fornecedores.some(
            function (fornecedor) {

                return limparDocumento(
                    fornecedor.cnpj
                ) ===
                limparDocumento(
                    cnpj
                );

            }
        );


    if (existe) {

        alert(
            "Este fornecedor já está cadastrado."
        );

        return;

    }


    fornecedores.push({

        id:
            Date.now(),

        cnpj:
            cnpj,

        razaoSocial:
            razao,

        nomeFantasia:
            fantasia,

        telefone:
            telefone

    });


    salvarDados();

    atualizarFornecedores();


    alert(
        "Fornecedor cadastrado com sucesso!"
    );


    limparPorIds([

        "fornecedor-cnpj",

        "cnpjFornecedor",

        "cnpj",

        "fornecedor-razao",

        "razaoSocial",

        "razao-fornecedor",

        "fornecedor-fantasia",

        "nomeFantasia",

        "fornecedor-telefone",

        "telefoneFornecedor",

        "telefone"

    ]);

}


// ============================================================
// 🗑️ EXCLUIR FORNECEDOR
// ============================================================

function excluirFornecedor(indice) {

    if (
        indice < 0 ||
        indice >= fornecedores.length
    ) {
        return;
    }


    const fornecedor =
        fornecedores[indice];


    if (
        !confirm(
            "Deseja excluir este fornecedor?\n\n" +
            fornecedor.razaoSocial
        )
    ) {

        return;

    }


    fornecedores.splice(
        indice,
        1
    );


    salvarDados();

    atualizarFornecedores();


    alert(
        "Fornecedor excluído com sucesso."
    );

}


// ============================================================
// 📥 MOVIMENTAÇÃO
// ============================================================

function buscarProdutoMovimentacao() {

    const campo =
        document.getElementById(
            "codigoMov"
        );


    if (!campo) return;


    const codigo =
        campo.value.trim();


    if (!codigo) return;


    if (
        !encontrarProduto(
            codigo
        )
    ) {

        alert(
            "Produto não encontrado."
        );

    }

}


// ============================================================
// 📥 REGISTRAR MOVIMENTAÇÃO
// ============================================================

function registrarMovimentacao() {

    const codigo =
        obterValorDosIds([
            "codigoMov"
        ]).trim();


    const tipo =
        obterValorDosIds([
            "tipoMov"
        ]) || "entrada";


    const quantidade =
        converterNumero(
            obterValorDosIds([
                "qtdProd"
            ])
        );


    const numeroNF =
        obterValorDosIds([
            "mov-numero-nf"
        ]);


    const emissaoNF =
        obterValorDosIds([
            "mov-emissao-nf"
        ]);


    const dataMov =
        obterValorDosIds([
            "mov-data"
        ]) || dataHojeISO();


    const responsavel =
        obterValorDosIds([
            "responsavel"
        ]);


    if (!codigo) {

        alert(
            "Digite o código do produto."
        );

        return;

    }


    if (quantidade <= 0) {

        alert(
            "Digite uma quantidade válida."
        );

        return;

    }


    const produto =
        encontrarProduto(
            codigo
        );


    if (!produto) {

        alert(
            "Produto não encontrado."
        );

        return;

    }


    if (
        tipo === "saida"
    ) {

        if (
            converterNumero(
                produto.quantidade
            ) < quantidade
        ) {

            alert(
                "Estoque insuficiente."
            );

            return;

        }


        produto.quantidade =
            converterNumero(
                produto.quantidade
            ) -
            quantidade;

    } else {

        produto.quantidade =
            converterNumero(
                produto.quantidade
            ) +
            quantidade;

    }


    produto.ultimaMovimentacao =
        dataMov;


    movimentacoes.push({

        id:
            Date.now(),

        codigo:
            produto.codigo,

        produto:
            produto.nome,

        tipo:
            tipo,

        quantidade:
            quantidade,

        numeroNF:
            numeroNF,

        emissaoNF:
            emissaoNF,

        data:
            dataMov,

        responsavel:
            responsavel

    });


    salvarDados();

    atualizarTabelaEstoque();


    alert(
        tipo === "entrada"
            ? "Entrada registrada com sucesso!"
            : "Saída registrada com sucesso!"
    );


    limparPorIds([

        "codigoMov",

        "mov-numero-nf",

        "mov-emissao-nf",

        "responsavel"

    ]);


    const qtd =
        document.getElementById(
            "qtdProd"
        );


    if (qtd) {
        qtd.value = "1";
    }


    configurarDatas();

}


// ============================================================
// ⚡ ENTRADA RÁPIDA
// ============================================================

function registrarEntradaRapida() {

    const codigo =
        obterValorDosIds([
            "entrada-codigo"
        ]).trim();


    const numeroNF =
        obterValorDosIds([
            "entrada-rapida-nf"
        ]);


    const quantidade =
        converterNumero(
            obterValorDosIds([
                "entrada-qtd"
            ])
        );


    const mensagem =
        document.getElementById(
            "msg-entrada"
        );


    if (!codigo) {

        mostrarMensagem(
            mensagem,
            "Digite o código do produto.",
            "erro"
        );

        return;

    }


    if (quantidade <= 0) {

        mostrarMensagem(
            mensagem,
            "Digite uma quantidade válida.",
            "erro"
        );

        return;

    }


    const produto =
        encontrarProduto(
            codigo
        );


    if (!produto) {

        mostrarMensagem(
            mensagem,
            "Produto não encontrado.",
            "erro"
        );

        return;

    }


    produto.quantidade =
        converterNumero(
            produto.quantidade
        ) +
        quantidade;


    produto.ultimaMovimentacao =
        dataHojeISO();


    const precoUnitario = Number(p.preco || 0);
const valorTotal = Number(qtd) * precoUnitario;

movimentacoes.push({

    data: dt,

    codigo: cod,

    produto: p.nome,

    tipo: tipo,

    quantidade: Number(qtd),

    nf: nf,

    responsavel: resp,

    precoUnitario: precoUnitario,

    valorTotal: valorTotal

});
           

       

       


    salvarDados();

    atualizarTabelaEstoque();


    mostrarMensagem(
        mensagem,
        "Entrada registrada com sucesso!",
        "sucesso"
    );


    limparPorIds([

        "entrada-codigo",

        "entrada-rapida-nf"

    ]);


    const qtd =
        document.getElementById(
            "entrada-qtd"
        );


    if (qtd) {
        qtd.value = "1";
    }

}


// ============================================================
// 📄 NF ENTRADA
// ============================================================

function abrirFormularioNF() {

    const formulario =
        document.getElementById(
            "form-entrada-nf"
        );


    if (!formulario) {

        alert(
            "Formulário de NF Entrada não encontrado."
        );

        return;

    }


    if (
        formulario.style.display ===
        "none"
    ) {

        formulario.style.display =
            "block";

    } else {

        formulario.style.display =
            "none";

    }


    configurarDatas();

}


function buscarFornecedorNF() {

    const campo =
        document.getElementById(
            "nf-cnpj"
        );


    const razao =
        document.getElementById(
            "nf-razao"
        );


    if (
        !campo ||
        !razao
    ) {
        return;
    }


    const cnpj =
        limparDocumento(
            campo.value
        );


    const fornecedor =
        fornecedores.find(
            function (item) {

                return limparDocumento(
                    item.cnpj
                ) === cnpj;

            }
        );


    if (fornecedor) {

        razao.value =
            fornecedor.razaoSocial || "";

    } else {

        razao.value = "";

        if (cnpj) {

            alert(
                "Fornecedor não encontrado."
            );

        }

    }

}


function buscarProdutoNF() {

    const campo =
        document.getElementById(
            "nf-codigo"
        );


    if (!campo) return;


    const codigo =
        campo.value.trim();


    const produto =
        encontrarProduto(
            codigo
        );


    if (!produto) {

        if (codigo) {

            alert(
                "Produto não encontrado."
            );

        }

        return;

    }


    preencherSeExistir(
        [
            "nf-nome",
            "nf-produto",
            "nf-nome-produto"
        ],
        produto.nome
    );


    preencherSeExistir(
        [
            "nf-preco",
            "nf-preco-unitario"
        ],
        produto.preco
    );


    preencherSeExistir(
        [
            "nf-unidade"
        ],
        produto.unidade
    );

}


// ============================================================
// ➕ ITEM NF
// ============================================================

function adicionarItemNF() {

    const codigo =
        obterValorDosIds([
            "nf-codigo"
        ]).trim();


    const produto =
        encontrarProduto(
            codigo
        );


    if (!produto) {

        alert(
            "Produto não encontrado."
        );

        return;

    }


    const quantidade =
        converterNumero(
            obterValorDosIds([
                "nf-quantidade",
                "nf-qtd",
                "nf-qtd-produto"
            ])
        );


    const precoInformado =
        converterNumero(
            obterValorDosIds([
                "nf-preco",
                "nf-preco-unitario"
            ])
        );


    const preco =
        precoInformado > 0
            ? precoInformado
            : converterNumero(
                produto.preco
            );


    if (quantidade <= 0) {

        alert(
            "Digite uma quantidade válida."
        );

        return;

    }


    itensNF.push({

        codigo:
            produto.codigo,

        nome:
            produto.nome,

        unidade:
            produto.unidade,

        quantidade:
            quantidade,

        preco:
            preco,

        total:
            quantidade * preco

    });


    salvarDados();

    atualizarListaItensNF();


    limparPorIds([
        "nf-codigo",
        "nf-quantidade",
        "nf-qtd",
        "nf-qtd-produto"
    ]);

}


// ============================================================
// 📋 ATUALIZAR ITENS NF
// ============================================================

function atualizarListaItensNF() {

    const container =
        document.getElementById(
            "lista-itens-nf"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    itensNF.forEach(
        function (item, indice) {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "item-nf";


            div.innerHTML = `

                <strong>
                    ${escapeHTML(
                        item.codigo
                    )}
                </strong>

                -

                ${escapeHTML(
                    item.nome
                )}

                -

                ${formatarQuantidade(
                    item.quantidade
                )}

                ${escapeHTML(
                    item.unidade || "UN"
                )}

                -

                ${formatarMoeda(
                    item.preco
                )}

                -

                ${formatarMoeda(
                    item.total
                )}

                <button
                    type="button"
                    onclick="removerItemNF(${indice})"
                >
                    🗑️
                </button>

            `;


            container.appendChild(
                div
            );

        }
    );


    const total =
        itensNF.reduce(
            function (
                soma,
                item
            ) {

                return soma +
                    converterNumero(
                        item.total
                    );

            },
            0
        );


    const campo =
        document.getElementById(
            "nf-total"
        );


    if (campo) {

        if (
            "value" in campo
        ) {

            campo.value =
                formatarMoeda(
                    total
                );

        } else {

            campo.textContent =
                formatarMoeda(
                    total
                );

        }

    }

}


function removerItemNF(
    indice
) {

    if (
        indice < 0 ||
        indice >= itensNF.length
    ) {
        return;
    }


    itensNF.splice(
        indice,
        1
    );


    salvarDados();

    atualizarListaItensNF();

}


// ============================================================
// 🧰 FUNÇÕES AUXILIARES
// ============================================================

function limparDocumento(
    valor
) {

    return String(
        valor || ""
    ).replace(
        /\D/g,
        ""
    );

}


function limparPorIds(
    ids
) {

    ids.forEach(
        function (id) {

            const campo =
                document.getElementById(
                    id
                );


            if (campo) {

                campo.value = "";

            }

        }
    );

}


function obterValorDosIds(
    ids
) {

    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const campo =
            document.getElementById(
                ids[i]
            );


        if (
            campo &&
            campo.value !== ""
        ) {

            return campo.value;

        }

    }


    return "";

}


function preencherSeExistir(
    ids,
    valor
) {

    ids.forEach(
        function (id) {

            const campo =
                document.getElementById(
                    id
                );


            if (campo) {

                campo.value =
                    valor ?? "";

            }

        }
    );

}


function mostrarMensagem(
    elemento,
    texto,
    tipo
) {

    if (!elemento) {

        alert(texto);

        return;

    }


    elemento.textContent =
        texto;


    elemento.style.display =
        "block";


    if (
        tipo === "erro"
    ) {

        elemento.style.color =
            "#b91c1c";

    } else {

        elemento.style.color =
            "#15803d";

    }


    setTimeout(
        function () {

            elemento.style.display =
                "none";

        },
        4000
    );

}


function escapeHTML(
    valor
) {

    return String(
        valor ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function escapeJS(
    valor
) {

    return String(
        valor ?? ""
    )
    .replace(
        /\\/g,
        "\\\\"
    )
    .replace(
        /'/g,
        "\\'"
    )
    .replace(
        /"/g,
        '\\"'
    );

}


// ============================================================
// 🔄 ATUALIZAR SISTEMA
// ============================================================

function atualizarSistema() {

    atualizarTabelaEstoque();

    atualizarFornecedores();

    atualizarListaItensNF();

}


// ============================================================
// 🧪 TESTE
// ============================================================

function testarSistema() {

    console.log(
        "===== SISTEMA DE ESTOQUE ====="
    );

    console.log(
        "Produtos:",
        produtos
    );

    console.log(
        "Movimentações:",
        movimentacoes
    );

    console.log(
        "Fornecedores:",
        fornecedores
    );

    console.log(
        "Itens NF:",
        itensNF
    );

    console.log(
        "=============================="
    );

}


// ============================================================
// 🌐 DISPONIBILIZAR FUNÇÕES PARA O HTML
// ============================================================

window.entrarSistema =
    entrarSistema;

window.sairSistema =
    sairSistema;

window.trocarAba =
    trocarAba;

window.mostrarOcultarEstoque =
    mostrarOcultarEstoque;

window.filtrarPorCategoria =
    filtrarPorCategoria;

window.exportarParaExcel =
    exportarParaExcel;

window.importarDoExcel =
    importarDoExcel;

window.importarXML =
    importarXML;

window.gerarRelatorio =
    gerarRelatorio;

window.cadastrarProduto =
    cadastrarProduto;

window.buscarProdutoCadastro =
    buscarProdutoCadastro;

window.limparCampos =
    limparCampos;

window.buscarProdutoMovimentacao =
    buscarProdutoMovimentacao;

window.registrarMovimentacao =
    registrarMovimentacao;

window.registrarEntradaRapida =
    registrarEntradaRapida;

window.abrirFormularioNF =
    abrirFormularioNF;

window.buscarFornecedorNF =
    buscarFornecedorNF;

window.buscarProdutoNF =
    buscarProdutoNF;

window.adicionarItemNF =
    adicionarItemNF;

window.removerItemNF =
    removerItemNF;

window.cadastrarFornecedor =
    cadastrarFornecedor;

window.excluirFornecedor =
    excluirFornecedor;

window.excluirProduto =
    excluirProduto;

window.excluirProdutoPorCodigo =
    excluirProdutoPorCodigo;

window.testarSistema =
    testarSistema;