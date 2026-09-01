

/* =========================================================
   DADOS
========================================================= */

const SENHA_SISTEMA = "1234";

const SENHA_VENDAS = "5678";

let produtos = [];
let movimentacoes = [];
let vendas = [];

let itensNFEntrada = [];
let itensNFSaida = [];
let itensVenda = [];
let vendaAtual = null;
let estoqueOculto = false;


/* =========================================================
   SALVAR DADOS
========================================================= */

async function salvarDados() {
  try {
    const resposta = await fetch("/api/dados", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        produtos,
        movimentacoes,
        vendas
      })
    });

    if (!resposta.ok) {
      throw new Error("Não foi possível salvar no Firebase.");
    }
  } catch (erro) {
    console.error("Erro ao salvar dados:", erro);
  }
}


/* =========================================================
   DATA
========================================================= */

function dataHojeISO(){

const hoje = new Date();

const ano = hoje.getFullYear();

const mes =
String(hoje.getMonth()+1).padStart(2,"0");

const dia =
String(hoje.getDate()).padStart(2,"0");

return ano + "-" + mes + "-" + dia;

}


/* =========================================================
   MOEDA
========================================================= */

function moeda(valor){

return Number(valor || 0).toLocaleString(
"pt-BR",
{
style:"currency",
currency:"BRL"
}
);

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(valor){

return String(valor ?? "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}


/* =========================================================
   MENSAGEM
========================================================= */

function mostrarMensagem(id,texto,tipo="ok"){

const elemento =
document.getElementById(id);

if(!elemento)
return;

elemento.textContent = texto;

elemento.className =
"mensagem " + tipo;

setTimeout(function(){

elemento.textContent = "";

},4000);

}


/* =========================================================
   ENTRAR
========================================================= */

function entrarSistema(){

const senha =
document.getElementById("campo-senha").value;

if(senha === SENHA_SISTEMA){

document.getElementById("tela-login").style.display = "none";

document.getElementById("sistema").style.display = "block";

document.getElementById("aviso-erro").style.display = "none";

atualizarTudo();

}else{

document.getElementById("aviso-erro").style.display = "block";

document.getElementById("campo-senha").value = "";

document.getElementById("campo-senha").focus();

}

}


/* =========================================================
   SAIR
========================================================= */

function sairSistema(){

document.getElementById("sistema").style.display = "none";

document.getElementById("tela-login").style.display = "flex";

document.getElementById("campo-senha").value = "";

}


/* =========================================================
   TROCAR ABA
   ALTERAÇÃO: AO ESTAR EM VENDAS, ESTOQUE EXIGE SENHA
========================================================= */

function trocarAba(indice){

const abas =
document.querySelectorAll(".aba");

const conteudos =
document.querySelectorAll(".conteudo-aba");


/*
=========================================================
PROTEÇÃO PRINCIPAL

Se o usuário estiver na aba VENDAS (índice 6)
e tentar clicar em ESTOQUE (índice 0),
NÃO permite a troca diretamente.

Abre o modal de senha.
=========================================================
*/

const abaAtual =
document.querySelector(".aba.ativa");

let indiceAtual = -1;

abas.forEach(function(aba,i){

if(aba === abaAtual){

indiceAtual = i;

}

});

if(
indice === 0 &&
indiceAtual === 6
){

voltarEstoqueComSenha();

return;

}


/*
=========================================================
ESTOQUE NORMAL
=========================================================
*/

if(indice === 0){

abas.forEach(function(aba,i){

if(i === 0){

aba.classList.add("ativa");

}else{

aba.classList.remove("ativa");

}

});

conteudos.forEach(function(conteudo,i){

if(i === 0){

conteudo.classList.add("visivel");

}else{

conteudo.classList.remove("visivel");

}

});

return;

}


/*
=========================================================
VALIDAÇÃO DO ÍNDICE
=========================================================
*/

if(indice >= conteudos.length)
return;


/*
=========================================================
ALTERA ABAS
=========================================================
*/

abas.forEach(function(aba,i){

if(i === indice){

aba.classList.add("ativa");

}else{

aba.classList.remove("ativa");

}

});


/*
=========================================================
ALTERA CONTEÚDOS
=========================================================
*/

conteudos.forEach(function(conteudo,i){

if(i === indice){

conteudo.classList.add("visivel");

}else{

conteudo.classList.remove("visivel");

}

});

}

/* =========================================================
   IR PARA ABA DIRETO
   (SEM a proteção de senha de Vendas -> Estoque)
   Usada após a senha ser confirmada corretamente.
========================================================= */

function irParaAba(indice){

const abas =
document.querySelectorAll(".aba");

const conteudos =
document.querySelectorAll(".conteudo-aba");

if(indice < 0 || indice >= conteudos.length)
return;

abas.forEach(function(aba,i){

if(i === indice){

aba.classList.add("ativa");

}else{

aba.classList.remove("ativa");

}

});

conteudos.forEach(function(conteudo,i){

if(i === indice){

conteudo.classList.add("visivel");

}else{

conteudo.classList.remove("visivel");

}

});

}


/* =========================================================
   VENDAS
========================================================= */

function abrirVendasComSenha(){

const senha =
prompt("Digite a senha para acessar Vendas:");

if(senha === SENHA_VENDAS){

trocarAba(6);

}else{

alert("Senha incorreta!");

}

}


/* =========================================================
   VOLTAR PARA ESTOQUE COM SENHA
========================================================= */

function voltarEstoqueComSenha(){

document.getElementById(
"modal-senha"
).style.display = "flex";

document.getElementById(
"senha-voltar-estoque"
).value = "";

document.getElementById(
"erro-senha-voltar"
).style.display = "none";

setTimeout(function(){

document.getElementById(
"senha-voltar-estoque"
).focus();

},100);

}


function confirmarVoltarEstoque(){

const senha =
document.getElementById(
"senha-voltar-estoque"
).value;

if(senha === SENHA_SISTEMA){

fecharModalSenha();

irParaAba(0);

}else{

document.getElementById(
"erro-senha-voltar"
).style.display = "block";

document.getElementById(
"senha-voltar-estoque"
).value = "";

document.getElementById(
"senha-voltar-estoque"
).focus();

}

}


function fecharModalSenha(){

document.getElementById(
"modal-senha"
).style.display = "none";

}


/* =========================================================
   ENCONTRAR PRODUTO
========================================================= */

function encontrarProduto(codigo){

return produtos.find(function(p){

return String(p.codigo) === String(codigo);

});

}


/* =========================================================
   CADASTRAR PRODUTO
========================================================= */

function cadastrarProduto(){

const nome =
document.getElementById("cad-nome").value.trim();

const categoria =
document.getElementById("cad-categoria").value.trim();

const preco =
Number(document.getElementById("cad-preco").value || 0);

const unidade =
document.getElementById("cad-unidade").value;

const quantidade =
Number(document.getElementById("cad-quantidade").value || 0);

let codigo =
document.getElementById("cad-codigo").value;

if(!nome){

mostrarMensagem(
"mensagem-cadastro",
"Informe o nome do produto.",
"erro"
);

return;

}

if(preco < 0){

mostrarMensagem(
"mensagem-cadastro",
"Informe um preço válido.",
"erro"
);

return;

}

if(!codigo){

const codigos =
produtos.map(function(p){

return Number(p.codigo) || 0;

});

codigo =
codigos.length
?
Math.max(...codigos) + 1
:
1;

}else{

codigo = Number(codigo);

}

if(encontrarProduto(codigo)){

mostrarMensagem(
"mensagem-cadastro",
"Já existe um produto com esse código.",
"erro"
);

return;

}

const produto = {

codigo:codigo,
nome:nome,
categoria:categoria || "Sem categoria",
preco:preco,
unidade:unidade,
quantidade:quantidade,
valor:quantidade * preco,
ultimaMov:quantidade > 0 ? dataHojeISO() : ""

};

produtos.push(produto);

if(quantidade > 0){

movimentacoes.push({

data:dataHojeISO(),
codigo:codigo,
produto:nome,
tipo:"Entrada",
quantidade:quantidade,
nf:"",
responsavel:"Cadastro",
preco:preco,
valorTotal:quantidade * preco

});

}

salvarDados();

atualizarTudo();

limparCadastro();

mostrarMensagem(
"mensagem-cadastro",
"Produto cadastrado com sucesso!",
"ok"
);

}


/* =========================================================
   LIMPAR CADASTRO
========================================================= */

function limparCadastro(){

document.getElementById("cad-codigo").value = "";
document.getElementById("cad-nome").value = "";
document.getElementById("cad-categoria").value = "";
document.getElementById("cad-preco").value = "";
document.getElementById("cad-quantidade").value = "";

}


/* =========================================================
   ATUALIZAR ESTOQUE
========================================================= */

function atualizarTabelaEstoque(){

const tbody =
document.getElementById("tabela-estoque-body");

if(!tbody)
return;

tbody.innerHTML = "";

const filtro =
document.getElementById("filtro-categoria");

const categoriaFiltro =
filtro ? filtro.value : "";

let lista = produtos.slice();

if(categoriaFiltro){

lista =
lista.filter(function(p){

return String(p.categoria || "") === categoriaFiltro;

});

}

let totalQuantidade = 0;
let totalValor = 0;

lista.forEach(function(p){

const quantidade =
Number(p.quantidade || 0);

const valor =
quantidade * Number(p.preco || 0);

totalQuantidade += quantidade;
totalValor += valor;

const tr =
document.createElement("tr");

tr.innerHTML =

"<td class='col-estoque'>" +
escaparHTML(p.codigo) +
"</td>" +

"<td class='col-estoque'>" +
escaparHTML(
    p.nome || p.produto || p.descricao || p.nome_produto || "(sem nome)"
) +
"</td>" +

"<td class='col-estoque'>" +
escaparHTML(p.categoria || "-") +
"</td>" +

"<td class='col-estoque'>" +
moeda(p.preco) +
"</td>" +

"<td class='col-estoque'>" +
escaparHTML(p.unidade || "UN") +
"</td>" +

"<td class='col-estoque'>" +
quantidade +
"</td>" +

"<td class='col-estoque'>" +
moeda(valor) +
"</td>" +

"<td class='col-estoque'>" +
escaparHTML(p.ultimaMov || "-") +
"</td>" +

"<td>" +

"<button class='botao-excluir' onclick='excluirProduto(" +
JSON.stringify(p.codigo) +
")'>" +

"Excluir" +

"</button>" +

"</td>";

tbody.appendChild(tr);

});

document.getElementById(
"total-produtos"
).textContent = lista.length;

document.getElementById(
"total-quantidade"
).textContent = totalQuantidade;

document.getElementById(
"valor-total"
).textContent = moeda(totalValor);

if(estoqueOculto){

aplicarOcultarEstoque();

}

}


/* =========================================================
   EXCLUIR PRODUTO
========================================================= */

function excluirProduto(codigo){

const produto =
encontrarProduto(codigo);

if(!produto)
return;

if(!confirm(
"Excluir o produto " +
produto.nome +
"?"
)){

return;

}

produtos =
produtos.filter(function(p){

return String(p.codigo) !== String(codigo);

});

salvarDados();

atualizarTudo();

}


/* =========================================================
   OCULTAR ESTOQUE
========================================================= */

function alternarOcultarEstoque(){

estoqueOculto =
!estoqueOculto;

aplicarOcultarEstoque();

}


function aplicarOcultarEstoque(){

const colunas =
document.querySelectorAll(".col-estoque");

colunas.forEach(function(c){

if(estoqueOculto){

c.classList.add("estoque-oculto");

}else{

c.classList.remove("estoque-oculto");

}

});

const botao =
document.querySelector(
"button[onclick='alternarOcultarEstoque()']"
);

if(botao){

botao.innerHTML =
estoqueOculto
?
"👁️ Mostrar Estoque"
:
"👁️ Ocultar Estoque";

}

}


/* =========================================================
   FILTRO CATEGORIA
========================================================= */

function abrirFiltroCategoria(){

const area =
document.getElementById(
"filtro-categoria-container"
);

if(area.style.display === "none"){

area.style.display = "block";

carregarCategoriasNoFiltro();

}else{

area.style.display = "none";

}

}


function carregarCategoriasNoFiltro(){

const select =
document.getElementById(
"filtro-categoria"
);

if(!select)
return;

const atual =
select.value;

const categorias =
[
...new Set(
produtos.map(function(p){

return p.categoria;

})
)
]
.filter(Boolean)
.sort();

select.innerHTML =
'<option value="">Todas as categorias</option>';

categorias.forEach(function(c){

const option =
document.createElement("option");

option.value = c;
option.textContent = c;

select.appendChild(option);

});

select.value = atual;

}


/* =========================================================
   ATUALIZAR SELECTS
========================================================= */

function atualizarSelectProdutos(){

const ids = [
"mov-produto",
"nf-entrada-produto",
"nf-saida-produto",
"venda-produto"
];

ids.forEach(function(id){

const select =
document.getElementById(id);

if(!select)
return;

const valorAtual =
select.value;

select.innerHTML =
'<option value="">Selecione o produto</option>';

produtos.forEach(function(p){

const option =
document.createElement("option");

option.value = p.codigo;

option.textContent =
p.codigo + " - " + p.nome;

select.appendChild(option);

});

select.value = valorAtual;

});

}


/* =========================================================
   MOVIMENTAÇÃO
========================================================= */

function mostrarProdutoMovimentacao(){

const codigo =
document.getElementById(
"mov-produto"
).value;

const produto =
encontrarProduto(codigo);

const info =
document.getElementById(
"info-mov-produto"
);

if(!produto){

info.style.display = "none";

return;

}

info.innerHTML =

"<strong>" +
escaparHTML(produto.nome) +
"</strong>" +

"<br>" +

"Estoque atual: " +
produto.quantidade +
" " +
escaparHTML(produto.unidade || "UN") +

"<br>" +

"Preço: " +
moeda(produto.preco);

info.style.display = "block";

}


function registrarMovimentacao(){

const codigo =
document.getElementById("mov-produto").value;

const tipo =
document.getElementById("mov-tipo").value;

const quantidade =
Number(
document.getElementById("mov-quantidade").value || 0
);

const nf =
document.getElementById("mov-nf").value.trim();

const responsavel =
document.getElementById("mov-responsavel").value.trim();

const data =
document.getElementById("mov-data").value ||
dataHojeISO();

const produto =
encontrarProduto(codigo);

if(!produto){

mostrarMensagem(
"mensagem-movimentacao",
"Selecione um produto.",
"erro"
);

return;

}

if(quantidade <= 0){

mostrarMensagem(
"mensagem-movimentacao",
"Informe uma quantidade válida.",
"erro"
);

return;

}

if(
tipo === "Saída" &&
quantidade > Number(produto.quantidade || 0)
){

mostrarMensagem(
"mensagem-movimentacao",
"Quantidade de saída maior que o estoque disponível.",
"erro"
);

return;

}

if(tipo === "Entrada"){

produto.quantidade =
Number(produto.quantidade || 0) + quantidade;

}else{

produto.quantidade =
Number(produto.quantidade || 0) - quantidade;

}

produto.valor =
produto.quantidade * Number(produto.preco || 0);

produto.ultimaMov = data;

movimentacoes.push({

data:data,
codigo:produto.codigo,
produto:produto.nome,
tipo:tipo,
quantidade:quantidade,
nf:nf,
responsavel:responsavel,
preco:Number(produto.preco || 0),
valorTotal:
quantidade * Number(produto.preco || 0)

});

salvarDados();

atualizarTudo();

limparMovimentacao();

mostrarMensagem(
"mensagem-movimentacao",
"Movimentação registrada com sucesso!",
"ok"
);

}


function limparMovimentacao(){

document.getElementById("mov-produto").value = "";
document.getElementById("mov-tipo").value = "Entrada";
document.getElementById("mov-quantidade").value = "";
document.getElementById("mov-nf").value = "";
document.getElementById("mov-responsavel").value = "";
document.getElementById("mov-data").value = dataHojeISO();

document.getElementById(
"info-mov-produto"
).style.display = "none";

}


/* =========================================================
   HISTÓRICO
========================================================= */

function atualizarTabelaMovimentacoes(){

const tbody =
document.getElementById(
"tabela-movimentacoes-body"
);

const aviso =
document.getElementById(
"sem-movimentacoes"
);

if(!tbody)
return;

tbody.innerHTML = "";

if(movimentacoes.length === 0){

aviso.style.display = "block";

return;

}

aviso.style.display = "none";

movimentacoes
.slice()
.reverse()
.forEach(function(m){

const tr =
document.createElement("tr");

tr.innerHTML =

"<td>" +
escaparHTML(m.data || "-") +
"</td>" +

"<td>" +
escaparHTML(m.codigo || "-") +
"</td>" +

"<td>" +
escaparHTML(m.produto || "-") +
"</td>" +

"<td>" +
escaparHTML(m.tipo || "-") +
"</td>" +

"<td>" +
Number(m.quantidade || 0) +
"</td>" +

"<td>" +
escaparHTML(m.nf || "-") +
"</td>" +

"<td>" +
escaparHTML(m.responsavel || "-") +
"</td>" +

"<td>" +
moeda(m.preco) +
"</td>" +

"<td>" +
moeda(m.valorTotal) +
"</td>";

tbody.appendChild(tr);

});

}


function limparHistorico(){

if(movimentacoes.length === 0){

alert("Não há histórico para limpar.");

return;

}

if(!confirm(
"Deseja realmente limpar todo o histórico?"
)){

return;

}

movimentacoes = [];

salvarDados();

atualizarTabelaMovimentacoes();

atualizarTabelaEstoque();

}


/* =========================================================
   NF ENTRADA
========================================================= */

function adicionarItemNFEntrada(){

const codigo =
document.getElementById(
"nf-entrada-produto"
).value;

const quantidade =
Number(
document.getElementById(
"nf-entrada-quantidade"
).value || 0
);

const preco =
Number(
document.getElementById(
"nf-entrada-preco"
).value || 0
);

const produto =
encontrarProduto(codigo);

if(!produto){

alert("Selecione um produto.");

return;

}

if(quantidade <= 0){

alert("Informe a quantidade.");

return;

}

if(preco < 0){

alert("Informe um preço válido.");

return;

}

itensNFEntrada.push({

codigo:produto.codigo,
produto:produto.nome,
unidade:produto.unidade,
quantidade:quantidade,
preco:preco,
total:quantidade * preco

});

atualizarTabelaNFEntrada();

document.getElementById(
"nf-entrada-quantidade"
).value = "";

document.getElementById(
"nf-entrada-preco"
).value = "";

}


function atualizarTabelaNFEntrada(){

const tbody =
document.getElementById(
"tabela-nf-entrada-body"
);

tbody.innerHTML = "";

let total = 0;

itensNFEntrada.forEach(function(item,index){

total += Number(item.total || 0);

const tr =
document.createElement("tr");

tr.innerHTML =

"<td>" +
escaparHTML(item.codigo) +
"</td>" +

"<td>" +
escaparHTML(item.produto) +
"</td>" +

"<td>" +
item.quantidade +
"</td>" +

"<td>" +
moeda(item.preco) +
"</td>" +

"<td>" +
moeda(item.total) +
"</td>" +

"<td>" +

"<button class='botao-excluir' onclick='removerItemNFEntrada(" +
index +
")'>" +

"Excluir" +

"</button>" +

"</td>";

tbody.appendChild(tr);

});

document.getElementById(
"nf-entrada-total"
).textContent = moeda(total);

}


function removerItemNFEntrada(index){

itensNFEntrada.splice(index,1);

atualizarTabelaNFEntrada();

}


function finalizarNFEntrada(){

if(itensNFEntrada.length === 0){

alert("Adicione pelo menos um item.");

return;

}

const numero =
document.getElementById(
"nf-entrada-numero"
).value.trim();

const fornecedor =
document.getElementById(
"nf-entrada-fornecedor"
).value.trim();

const data =
document.getElementById(
"nf-entrada-data"
).value ||
dataHojeISO();

const responsavel =
document.getElementById(
"nf-entrada-responsavel"
).value.trim();

itensNFEntrada.forEach(function(item){

const produto =
encontrarProduto(item.codigo);

if(!produto)
return;

produto.quantidade =
Number(produto.quantidade || 0) +
Number(item.quantidade || 0);

produto.preco =
Number(item.preco || 0);

produto.valor =
produto.quantidade * produto.preco;

produto.ultimaMov = data;

movimentacoes.push({

data:data,
codigo:produto.codigo,
produto:produto.nome,
tipo:"Entrada",
quantidade:item.quantidade,
nf:numero,
responsavel:responsavel || fornecedor,
preco:item.preco,
valorTotal:item.total

});

});

salvarDados();

alert("NF de entrada registrada com sucesso.");

limparNFEntrada();

atualizarTudo();

}


function limparNFEntrada(){

document.getElementById(
"nf-entrada-numero"
).value = "";

document.getElementById(
"nf-entrada-fornecedor"
).value = "";

document.getElementById(
"nf-entrada-data"
).value = dataHojeISO();

document.getElementById(
"nf-entrada-responsavel"
).value = "";

itensNFEntrada = [];

atualizarTabelaNFEntrada();

}


/* =========================================================
   NF SAÍDA
========================================================= */

function adicionarItemNFSaida(){

const codigo =
document.getElementById(
"nf-saida-produto"
).value;

const quantidade =
Number(
document.getElementById(
"nf-saida-quantidade"
).value || 0
);

const preco =
Number(
document.getElementById(
"nf-saida-preco"
).value || 0
);

const produto =
encontrarProduto(codigo);

if(!produto){

alert("Selecione um produto.");

return;

}

if(quantidade <= 0){

alert("Informe a quantidade.");

return;

}

if(
quantidade >
Number(produto.quantidade || 0)
){

alert("Quantidade maior que o estoque disponível.");

return;

}

itensNFSaida.push({

codigo:produto.codigo,
produto:produto.nome,
unidade:produto.unidade,
quantidade:quantidade,

preco:
preco ||
Number(produto.preco || 0),

total:
quantidade *
(
preco ||
Number(produto.preco || 0)
)

});

atualizarTabelaNFSaida();

document.getElementById(
"nf-saida-quantidade"
).value = "";

document.getElementById(
"nf-saida-preco"
).value = "";

}


function atualizarTabelaNFSaida(){

const tbody =
document.getElementById(
"tabela-nf-saida-body"
);

tbody.innerHTML = "";

let total = 0;

itensNFSaida.forEach(function(item,index){

total += Number(item.total || 0);

const tr =
document.createElement("tr");

tr.innerHTML =

"<td>" +
escaparHTML(item.codigo) +
"</td>" +

"<td>" +
escaparHTML(item.produto) +
"</td>" +

"<td>" +
item.quantidade +
"</td>" +

"<td>" +
moeda(item.preco) +
"</td>" +

"<td>" +
moeda(item.total) +
"</td>" +

"<td>" +

"<button class='botao-excluir' onclick='removerItemNFSaida(" +
index +
")'>" +

"Excluir" +

"</button>" +

"</td>";

tbody.appendChild(tr);

});

document.getElementById(
"nf-saida-total"
).textContent = moeda(total);

}


function removerItemNFSaida(index){

itensNFSaida.splice(index,1);

atualizarTabelaNFSaida();

}


function finalizarNFSaida(){

if(itensNFSaida.length === 0){

alert("Adicione pelo menos um item.");

return;

}

const numero =
document.getElementById(
"nf-saida-numero"
).value.trim();

const cliente =
document.getElementById(
"nf-saida-cliente"
).value.trim();

const data =
document.getElementById(
"nf-saida-data"
).value ||
dataHojeISO();

const responsavel =
document.getElementById(
"nf-saida-responsavel"
).value.trim();

for(const item of itensNFSaida){

const produto =
encontrarProduto(item.codigo);

if(!produto){

alert("Produto não encontrado.");

return;

}

if(
Number(item.quantidade) >
Number(produto.quantidade || 0)
){

alert(
"Estoque insuficiente para " +
produto.nome
);

return;

}

}

itensNFSaida.forEach(function(item){

const produto =
encontrarProduto(item.codigo);

produto.quantidade =
Number(produto.quantidade || 0) -
Number(item.quantidade || 0);

produto.valor =
produto.quantidade *
Number(produto.preco || 0);

produto.ultimaMov = data;

movimentacoes.push({

data:data,
codigo:produto.codigo,
produto:produto.nome,
tipo:"Saída",
quantidade:item.quantidade,
nf:numero,
responsavel:responsavel || cliente,
preco:item.preco,
valorTotal:item.total

});

});

salvarDados();

alert("NF de saída registrada com sucesso.");

limparNFSaida();

atualizarTudo();

}


function limparNFSaida(){

document.getElementById(
"nf-saida-numero"
).value = "";

document.getElementById(
"nf-saida-cliente"
).value = "";

document.getElementById(
"nf-saida-data"
).value = dataHojeISO();

document.getElementById(
"nf-saida-responsavel"
).value = "";

itensNFSaida = [];

atualizarTabelaNFSaida();

}


/* =========================================================
   EXPORTAR EXCEL
========================================================= */

function exportarParaExcel(){

if(typeof XLSX === "undefined"){

alert("Biblioteca do Excel não carregada.");

return;

}

const dados =
produtos.map(function(p){

return {

"Código":p.codigo,
"Nome":p.nome,
"Categoria":p.categoria,
"Preço":Number(p.preco || 0),
"Unidade":p.unidade,
"Quantidade":Number(p.quantidade || 0),
"Valor":
Number(p.quantidade || 0) *
Number(p.preco || 0),
"Última Movimentação":p.ultimaMov || ""

};

});

const wb =
XLSX.utils.book_new();

const ws =
XLSX.utils.json_to_sheet(dados);

XLSX.utils.book_append_sheet(
wb,
ws,
"Estoque"
);

XLSX.writeFile(
wb,
"estoque.xlsx"
);

}


/* =========================================================
   IMPORTAR EXCEL
========================================================= */

function importarExcel(event){

const arquivo = event.target.files[0];

if(!arquivo){
    return;
}

if(typeof XLSX === "undefined"){
    alert("A biblioteca do Excel não foi carregada. Verifique sua conexão com a internet.");
    event.target.value = "";
    return;
}

const reader = new FileReader();

reader.onload = function(e){

    try{

        const dados = new Uint8Array(e.target.result);

        const workbook = XLSX.read(dados, {
            type: "array",
            cellDates: true
        });

        if(!workbook.SheetNames || workbook.SheetNames.length === 0){
            throw new Error("Nenhuma planilha encontrada.");
        }

        const nomePlanilha = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[nomePlanilha];

        if(!worksheet){
            throw new Error("Não foi possível abrir a planilha.");
        }

        const linhas = XLSX.utils.sheet_to_json(
            worksheet,
            {
                defval: "",
                raw: false
            }
        );

        if(!linhas || linhas.length === 0){
            alert("O arquivo Excel está vazio ou não foi possível encontrar dados na primeira planilha.");
            event.target.value = "";
            return;
        }

        let importados = 0;
        let atualizados = 0;
        let ignorados = 0;

        function normalizarColuna(valor){
            return String(valor || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g,"")
                .toLowerCase()
                .replace(/[^a-z0-9]/g,"")
                .trim();
        }

        function obterValor(linha, nomes){
            const chaves = Object.keys(linha);
            for(let i = 0; i < nomes.length; i++){
                const procurada = normalizarColuna(nomes[i]);
                for(let j = 0; j < chaves.length; j++){
                    if(normalizarColuna(chaves[j]) === procurada){
                        return linha[chaves[j]];
                    }
                }
            }
            return "";
        }

        function converterNumero(valor){
            if(valor === null || valor === undefined || valor === ""){
                return 0;
            }
            if(typeof valor === "number"){
                return valor;
            }
            let texto = String(valor).trim();
            texto = texto.replace(/R\$/gi,"").trim();
            if(texto.includes(".") && texto.includes(",")){
                texto = texto.replace(/\./g,"").replace(",",".");
            }else if(texto.includes(",")){
                texto = texto.replace(",",".");
            }
            texto = texto.replace(/\s/g,"");
            const numero = Number(texto);
            return isNaN(numero) ? 0 : numero;
        }

        linhas.forEach(function(linha){

            const valoresLinha = Object.values(linha);
            const linhaVazia = !valoresLinha.some(function(v){
                return String(v ?? "").trim() !== "";
            });

            if(linhaVazia){
                ignorados++;
                return;
            }

            let codigo = String(
                obterValor(linha, [
                    "Código","Codigo","CODIGO",
                    "Código do Produto","Codigo do Produto","cod","codigo_produto"
                ]) || ""
            ).trim();

            const nome = String(
                obterValor(linha, [
                    "Nome","Produto","Nome do Produto","Descrição","Descricao",
                    "Nome do Item","Nome Item","Descricao do Produto",
                    "Item","Material","Artigo","Articulo","Nome do Produto/Servico","xProd"
                ]) || ""
            ).trim();

            if(!codigo && !nome){
                ignorados++;
                return;
            }

            if(!codigo){
                let maior = 0;
                produtos.forEach(function(p){
                    const n = Number(p.codigo);
                    if(!isNaN(n) && n > maior){
                        maior = n;
                    }
                });
                codigo = String(maior + 1);
            }

            if(/^\d+\.0+$/.test(codigo)){
                codigo = codigo.split(".")[0];
            }

            if(/^\d+$/.test(codigo)){
                codigo = Number(codigo);
            }

            const categoria = String(
                obterValor(linha, [
                    "Categoria","categoria","Grupo","Tipo"
                ]) || "Sem categoria"
            ).trim();

            const preco = converterNumero(
                obterValor(linha, [
                    "Preço","Preco","Preço Unitário","Preco Unitario",
                    "Valor Unitário","Valor Unitario","Valor"
                ])
            );

            const unidade = String(
                obterValor(linha, [
                    "Unidade","unidade","Un","UN","Und"
                ]) || "UN"
            ).trim();

            const quantidade = converterNumero(
                obterValor(linha, [
                    "Quantidade","quantidade","Qtd","QTD","Estoque","Saldo"
                ])
            );

            const existente = encontrarProduto(codigo);

            if(existente){

                existente.nome = nome || existente.nome;
                existente.categoria = categoria || existente.categoria;
                existente.preco = preco;
                existente.unidade = unidade || "UN";
                existente.quantidade = quantidade;
                existente.valor = quantidade * preco;

                if(!existente.ultimaMov && quantidade > 0){
                    existente.ultimaMov = dataHojeISO();
                }

                atualizados++;

            }else{

                produtos.push({
                    codigo: codigo,
                    nome: nome,
                    categoria: categoria || "Sem categoria",
                    preco: preco,
                    unidade: unidade || "UN",
                    quantidade: quantidade,
                    valor: quantidade * preco,
                    ultimaMov: quantidade > 0 ? dataHojeISO() : ""
                });

                if(quantidade > 0){
                    movimentacoes.push({
                        data: dataHojeISO(),
                        codigo: codigo,
                        produto: nome,
                        tipo: "Entrada",
                        quantidade: quantidade,
                        nf: "",
                        responsavel: "Importação Excel",
                        preco: preco,
                        valorTotal: quantidade * preco
                    });
                }

                importados++;
            }

        });

        salvarDados();

        atualizarTudo();

        alert(
            "IMPORTAÇÃO CONCLUÍDA!\n\n" +
            "Produtos novos: " + importados +
            "\nProdutos atualizados: " + atualizados +
            "\nLinhas ignoradas: " + ignorados +
            "\n\nTotal processado: " + (importados + atualizados)
        );

    }catch(erro){
        console.error("Erro ao importar Excel:", erro);
        alert("ERRO AO IMPORTAR O EXCEL!\n\nVerifique se o arquivo possui uma planilha válida e se a primeira linha contém os nomes das colunas.\n\nDetalhes: " + erro.message);
    }

    event.target.value = "";
};

reader.onerror = function(){
    alert("Não foi possível ler o arquivo Excel.");
    event.target.value = "";
};

reader.readAsArrayBuffer(arquivo);

}


/* =========================================================
   IMPORTAR XML NF-E
========================================================= */

function importarXML(event){

const arquivo =
event.target.files[0];

if(!arquivo)
return;

const reader =
new FileReader();

reader.onload = function(e){

try{

const texto =
e.target.result;

const parser =
new DOMParser();

const xml =
parser.parseFromString(
texto,
"text/xml"
);

const erros =
xml.getElementsByTagName(
"parsererror"
);

if(erros.length){

throw new Error("XML inválido");

}

const dets =
xml.getElementsByTagName("det");

let quantidadeItens = 0;

for(
let i=0;
i<dets.length;
i++
){

const det = dets[i];

const prod =
det.getElementsByTagName("prod")[0];

if(!prod)
continue;

const cProd =
prod.getElementsByTagName("cProd")[0];

const xProd =
prod.getElementsByTagName("xProd")[0];

const qCom =
prod.getElementsByTagName("qCom")[0];

const uCom =
prod.getElementsByTagName("uCom")[0];

const vUnCom =
prod.getElementsByTagName("vUnCom")[0];

const codigo =
cProd
?
cProd.textContent.trim()
:
"";

const nome =
xProd
?
xProd.textContent.trim()
:
"Produto";

const quantidade =
qCom
?
Number(
qCom.textContent.replace(",",".")
)
:
0;

const unidade =
uCom
?
uCom.textContent.trim()
:
"UN";

const preco =
vUnCom
?
Number(
vUnCom.textContent.replace(",",".")
)
:
0;

if(!codigo)
continue;

let produto =
encontrarProduto(codigo);

if(produto){

produto.nome = nome;
produto.unidade = unidade;
produto.preco = preco;

produto.quantidade =
Number(produto.quantidade || 0) +
quantidade;

produto.valor =
produto.quantidade *
produto.preco;

produto.ultimaMov =
dataHojeISO();

}else{

produto = {

codigo:codigo,
nome:nome,
categoria:"Importado XML",
preco:preco,
unidade:unidade,
quantidade:quantidade,
valor:quantidade * preco,
ultimaMov:dataHojeISO()

};

produtos.push(produto);

}

movimentacoes.push({

data:dataHojeISO(),
codigo:codigo,
produto:nome,
tipo:"Entrada",
quantidade:quantidade,
nf:"XML NF-e",
responsavel:"Importação XML",
preco:preco,
valorTotal:quantidade * preco

});

quantidadeItens++;

}

salvarDados();

atualizarTudo();

alert(
quantidadeItens +
" item(ns) importado(s) do XML."
);

}catch(erro){

console.error(erro);

alert(
"Não foi possível importar o XML NF-e."
);

}

event.target.value = "";

};

reader.readAsText(arquivo);

}


/* =========================================================
   RELATÓRIO
========================================================= */

function gerarRelatorio(){

const area =
document.getElementById(
"area-relatorio"
);

area.style.display = "block";

const hoje =
dataHojeISO();

const primeiroDia =
new Date();

primeiroDia.setDate(1);

const ano =
primeiroDia.getFullYear();

const mes =
String(
primeiroDia.getMonth()+1
).padStart(2,"0");

const dataInicial =
ano + "-" + mes + "-01";

document.getElementById(
"relatorio-data-inicial"
).value =
dataInicial;

document.getElementById(
"relatorio-data-final"
).value =
hoje;

carregarProdutosRelatorio();

aplicarFiltrosRelatorio();

area.scrollIntoView({
behavior:"smooth"
});

}


function carregarProdutosRelatorio(){

const select =
document.getElementById(
"relatorio-produto"
);

const atual =
select.value;

select.innerHTML =
'<option value="">Todos</option>';

produtos.forEach(function(p){

const option =
document.createElement("option");

option.value = p.codigo;

option.textContent =
p.codigo + " - " + p.nome;

select.appendChild(option);

});

select.value = atual;

}


function aplicarFiltrosRelatorio(){

const dataInicial =
document.getElementById(
"relatorio-data-inicial"
).value;

const dataFinal =
document.getElementById(
"relatorio-data-final"
).value;

const produtoFiltro =
document.getElementById(
"relatorio-produto"
).value;

const tipoFiltro =
document.getElementById(
"relatorio-tipo"
).value;

const codigoFiltro =
document.getElementById(
"relatorio-codigo"
).value.trim();

const nfFiltro =
document.getElementById(
"relatorio-nf"
).value.trim();

const responsavelFiltro =
document.getElementById(
"relatorio-responsavel"
).value.trim();

const lista =
movimentacoes.filter(function(m){

if(
dataInicial &&
String(m.data || "") < dataInicial
){

return false;

}

if(
dataFinal &&
String(m.data || "") > dataFinal
){

return false;

}

if(
produtoFiltro &&
String(m.codigo || "") !==
String(produtoFiltro)
){

return false;

}

if(
tipoFiltro &&
String(m.tipo || "") !==
tipoFiltro
){

return false;

}

if(
codigoFiltro &&
String(m.codigo || "")
.indexOf(codigoFiltro) === -1
){

return false;

}

if(
nfFiltro &&
String(m.nf || "")
.toLowerCase()
.indexOf(
nfFiltro.toLowerCase()
) === -1
){

return false;

}

if(
responsavelFiltro &&
String(m.responsavel || "")
.toLowerCase()
.indexOf(
responsavelFiltro.toLowerCase()
) === -1
){

return false;

}

return true;

});

const tbody =
document.getElementById(
"tabela-relatorio-body"
);

tbody.innerHTML = "";

let totalQuantidade = 0;
let totalValor = 0;

if(lista.length === 0){

tbody.innerHTML =

"<tr>" +

"<td colspan='9' style='text-align:center;padding:25px;color:#777;'>" +

"Nenhuma movimentação encontrada para os filtros informados." +

"</td>" +

"</tr>";

}else{

lista
.slice()
.reverse()
.forEach(function(m){

const quantidade =
Number(m.quantidade || 0);

const valor =
Number(
m.valorTotal ||
(
quantidade *
Number(m.preco || 0)
)
);

totalQuantidade += quantidade;
totalValor += valor;

const tr =
document.createElement("tr");

tr.innerHTML =

"<td>" +
escaparHTML(m.data || "-") +
"</td>" +

"<td>" +
escaparHTML(m.codigo || "-") +
"</td>" +

"<td>" +
escaparHTML(m.produto || "-") +
"</td>" +

"<td>" +
escaparHTML(m.tipo || "-") +
"</td>" +

"<td>" +
quantidade +
"</td>" +

"<td>" +
escaparHTML(m.nf || "-") +
"</td>" +

"<td>" +
escaparHTML(m.responsavel || "-") +
"</td>" +

"<td>" +
moeda(m.preco) +
"</td>" +

"<td>" +
moeda(valor) +
"</td>";

tbody.appendChild(tr);

});

}

document.getElementById(
"relatorio-total-mov"
).textContent =
lista.length;

document.getElementById(
"relatorio-total-qtd"
).textContent =
totalQuantidade;

document.getElementById(
"relatorio-total-valor"
).textContent =
moeda(totalValor);

document.getElementById(
"relatorio-valor-medio"
).textContent =
lista.length
?
moeda(totalValor / lista.length)
:
moeda(0);

}


/* =========================================================
   IMPRIMIR RELATÓRIO
========================================================= */

function imprimirRelatorio(){

window.print();

}


function fecharRelatorio(){

document.getElementById(
"area-relatorio"
).style.display = "none";

}


/* =========================================================
   VENDAS
========================================================= */

function prepararNovaVenda(){

itensVenda = [];
vendaAtual = null;

document.getElementById(
"numero-venda-atual"
).textContent = "-";

document.getElementById(
"venda-vendedor"
).value = "";

document.getElementById(
"venda-cliente"
).value = "";

document.getElementById(
"venda-pagamento"
).value = "Dinheiro";

document.getElementById(
"venda-quantidade"
).value = "1";

document.getElementById(
"venda-desconto"
).value = "0";

document.getElementById(
"venda-observacao"
).value = "";

document.getElementById(
"venda-valor-recebido"
).value = "";

document.getElementById(
"venda-troco"
).value = "";

document.getElementById(
"troco-container"
).style.display = "none";

document.getElementById(
"info-produto-venda"
).style.display = "none";

atualizarTabelaItensVenda();

atualizarTotalVenda();

atualizarResumoVendas();

}


function gerarNumeroVenda(){

let maior = 0;

vendas.forEach(function(v){

const n =
parseInt(
String(v.numero || "")
.replace(/\D/g,""),
10
);

if(
!isNaN(n) &&
n > maior
){

maior = n;

}

});

return String(
maior + 1
).padStart(4,"0");

}


function mostrarProdutoVenda(){

const codigo =
document.getElementById(
"venda-produto"
).value;

const produto =
encontrarProduto(codigo);

const info =
document.getElementById(
"info-produto-venda"
);

if(!produto){

info.style.display = "none";

return;

}

info.innerHTML =

"<strong>" +
escaparHTML(produto.nome) +
"</strong>" +

"<br>" +

"Estoque disponível: " +
produto.quantidade +
" " +
escaparHTML(produto.unidade || "UN") +

"<br>" +

"Preço unitário: " +
moeda(produto.preco);

info.style.display = "block";

}


function adicionarItemVenda(){

const codigo =
document.getElementById(
"venda-produto"
).value;

const quantidade =
Number(
document.getElementById(
"venda-quantidade"
).value || 0
);

const produto =
encontrarProduto(codigo);

if(!produto){

alert("Selecione um produto.");

return;

}

if(quantidade <= 0){

alert("Informe uma quantidade válida.");

return;

}

const existente =
itensVenda.find(function(item){

return String(item.codigo) ===
String(produto.codigo);

});

const quantidadeJaAdicionada =
existente
?
Number(existente.quantidade)
:
0;

if(
quantidade + quantidadeJaAdicionada >
Number(produto.quantidade || 0)
){

alert(
"Quantidade solicitada maior que o estoque disponível."
);

return;

}

if(existente){

existente.quantidade += quantidade;

existente.total =
existente.quantidade *
existente.preco;

}else{

itensVenda.push({

codigo:produto.codigo,
produto:produto.nome,
unidade:produto.unidade || "UN",
quantidade:quantidade,
preco:Number(produto.preco || 0),
total:
quantidade *
Number(produto.preco || 0)

});

}

atualizarTabelaItensVenda();

atualizarTotalVenda();

document.getElementById(
"venda-quantidade"
).value = "1";

}


function atualizarTabelaItensVenda(){

const tbody =
document.getElementById(
"tabela-itens-venda-body"
);

tbody.innerHTML = "";

itensVenda.forEach(function(item,index){

const tr =
document.createElement("tr");

tr.innerHTML =

"<td>" +
escaparHTML(item.codigo) +
"</td>" +

"<td>" +
escaparHTML(item.produto) +
"</td>" +

"<td>" +
escaparHTML(item.unidade) +
"</td>" +

"<td>" +
item.quantidade +
"</td>" +

"<td>" +
moeda(item.preco) +
"</td>" +

"<td>" +
moeda(
item.quantidade * item.preco
) +
"</td>" +

"<td>" +

"<button class='botao-excluir' onclick='removerItemVenda(" +
index +
")'>" +

"Excluir" +

"</button>" +

"</td>";

tbody.appendChild(tr);

});

}


function removerItemVenda(index){

itensVenda.splice(index,1);

atualizarTabelaItensVenda();

atualizarTotalVenda();

}


function atualizarTotalVenda(){

let subtotal = 0;

itensVenda.forEach(function(item){

subtotal +=
Number(item.quantidade || 0) *
Number(item.preco || 0);

});

const desconto =
Number(
document.getElementById(
"venda-desconto"
).value || 0
);

const total =
Math.max(0,subtotal - desconto);

document.getElementById(
"venda-subtotal"
).textContent =
moeda(subtotal);

document.getElementById(
"venda-desconto-exibicao"
).textContent =
moeda(desconto);

document.getElementById(
"venda-total"
).textContent =
moeda(total);

const pagamento =
document.getElementById(
"venda-pagamento"
).value;

document.getElementById(
"troco-container"
).style.display =
pagamento === "Dinheiro"
?
"block"
:
"none";

calcularTroco();

}


function calcularTroco(){

const pagamento =
document.getElementById(
"venda-pagamento"
).value;

if(pagamento !== "Dinheiro"){

document.getElementById(
"venda-troco"
).value = "";

return;

}

const totalTexto =
document.getElementById(
"venda-total"
).textContent;

const total =
Number(
totalTexto
.replace("R$","")
.replace(/\./g,"")
.replace(",",".")
.trim()
) || 0;

const recebido =
Number(
document.getElementById(
"venda-valor-recebido"
).value || 0
);

const troco =
recebido - total;

document.getElementById(
"venda-troco"
).value =
troco >= 0
?
moeda(troco)
:
"Valor insuficiente";

}


/* =========================================================
   FINALIZAR VENDA
========================================================= */

function finalizarVenda(){

if(itensVenda.length === 0){

alert(
"Adicione pelo menos um produto à venda."
);

return;

}

const vendedor =
document.getElementById(
"venda-vendedor"
).value.trim();

const cliente =
document.getElementById(
"venda-cliente"
).value.trim();

const formaPagamento =
document.getElementById(
"venda-pagamento"
).value;

const desconto =
Number(
document.getElementById(
"venda-desconto"
).value || 0
);

const observacao =
document.getElementById(
"venda-observacao"
).value.trim();

let subtotal = 0;

itensVenda.forEach(function(item){

subtotal +=
Number(item.quantidade || 0) *
Number(item.preco || 0);

});

const total =
Math.max(0,subtotal - desconto);

if(formaPagamento === "Dinheiro"){

const recebido =
Number(
document.getElementById(
"venda-valor-recebido"
).value || 0
);

if(recebido < total){

alert(
"Valor recebido insuficiente para finalizar a venda."
);

return;

}

}

for(const item of itensVenda){

const produto =
encontrarProduto(item.codigo);

if(!produto){

alert(
"Produto não encontrado: " +
item.produto
);

return;

}

if(
Number(item.quantidade) >
Number(produto.quantidade || 0)
){

alert(
"Estoque insuficiente para " +
produto.nome
);

return;

}

}

const numero =
gerarNumeroVenda();

const data =
dataHojeISO();

const agora =
new Date();

const hora =
String(
agora.getHours()
).padStart(2,"0")
+
":"
+
String(
agora.getMinutes()
).padStart(2,"0")
+
":"
+
String(
agora.getSeconds()
).padStart(2,"0");

itensVenda.forEach(function(item){

const produto =
encontrarProduto(item.codigo);

produto.quantidade =
Number(produto.quantidade || 0) -
Number(item.quantidade || 0);

produto.valor =
produto.quantidade *
Number(produto.preco || 0);

produto.ultimaMov = data;

movimentacoes.push({

data:data,
codigo:produto.codigo,
produto:produto.nome,
tipo:"Venda",
quantidade:item.quantidade,
nf:numero,
responsavel:vendedor || "Vendas",
preco:item.preco,
valorTotal:
item.quantidade * item.preco

});

});

const venda = {

numero:numero,
data:data,
hora:hora,
vendedor:vendedor,
cliente:cliente,
pagamento:formaPagamento,
desconto:desconto,
subtotal:subtotal,
total:total,
observacao:observacao,

itens:
itensVenda.map(function(item){

return {

codigo:item.codigo,
produto:item.produto,
unidade:item.unidade,
quantidade:item.quantidade,
preco:item.preco,
total:
item.quantidade * item.preco

};

})

};

vendas.push(venda);

salvarDados();

atualizarTudo();

alert(
"✅ VENDA FINALIZADA COM SUCESSO!\n\n" +

"Venda Nº: " +
numero +
"\n" +

"Data: " +
data +
"\n" +

"Hora: " +
hora +
"\n" +

"Total: " +
moeda(total) +
"\n" +

"Pagamento: " +
formaPagamento +
"\n\n" +

"📦 O estoque foi atualizado automaticamente."
);

prepararNovaVenda();

}


/* =========================================================
   CANCELAR VENDA
========================================================= */

function cancelarVenda(){

if(itensVenda.length > 0){

if(!confirm(
"Cancelar esta venda e apagar os itens?"
)){

return;

}

}

prepararNovaVenda();

}


/* =========================================================
   RESUMO VENDAS
========================================================= */

function atualizarResumoVendas(){

const hoje =
dataHojeISO();

const vendasHoje =
vendas.filter(function(v){

return String(v.data || "") === hoje;

});

let itens = 0;
let faturamento = 0;

vendasHoje.forEach(function(v){

faturamento +=
Number(v.total || 0);

(v.itens || []).forEach(function(item){

itens +=
Number(item.quantidade || 0);

});

});

document.getElementById(
"vendas-hoje"
).textContent =
vendasHoje.length;

document.getElementById(
"itens-vendidos-hoje"
).textContent =
itens;

document.getElementById(
"faturamento-hoje"
).textContent =
moeda(faturamento);

}


/* =========================================================
   TABELA DE VENDAS
========================================================= */

function atualizarTabelaVendas(){

}


/* =========================================================
   RELATÓRIO DE VENDAS
========================================================= */

function abrirRelatorioVendas(){

const area =
document.getElementById(
"area-relatorio-vendas"
);

area.style.display = "block";

const hoje =
new Date();

const primeiroDia =
new Date(
hoje.getFullYear(),
hoje.getMonth(),
1
);

document.getElementById(
"rv-data-inicial"
).value =
primeiroDia
.toISOString()
.split("T")[0];

document.getElementById(
"rv-data-final"
).value =
dataHojeISO();

carregarFiltrosRelatorioVendas();

gerarRelatorioVendas();

area.scrollIntoView({
behavior:"smooth"
});

}


function carregarFiltrosRelatorioVendas(){

const vendedores = [];
const clientes = [];
const produtosRelatorio = [];

vendas.forEach(function(v){

const vendedor =
(
v.vendedor ||
"Não informado"
).trim();

const cliente =
(
v.cliente ||
"Não informado"
).trim();

if(
vendedor &&
!vendedores.includes(vendedor)
){

vendedores.push(vendedor);

}

if(
cliente &&
!clientes.includes(cliente)
){

clientes.push(cliente);

}

(v.itens || []).forEach(function(item){

const texto =
item.codigo +
" - " +
item.produto;

if(
!produtosRelatorio.includes(texto)
){

produtosRelatorio.push(texto);

}

});

});

const selVendedor =
document.getElementById(
"rv-vendedor"
);

const selCliente =
document.getElementById(
"rv-cliente"
);

const selProduto =
document.getElementById(
"rv-produto"
);

const atualVendedor =
selVendedor.value;

const atualCliente =
selCliente.value;

const atualProduto =
selProduto.value;

selVendedor.innerHTML =
'<option value="">Todos os vendedores</option>';

vendedores
.sort()
.forEach(function(v){

selVendedor.innerHTML +=
'<option value="' +
escaparHTML(v) +
'">' +
escaparHTML(v) +
'</option>';

});

if(atualVendedor){

selVendedor.value =
atualVendedor;

}

selCliente.innerHTML =
'<option value="">Todos os clientes</option>';

clientes
.sort()
.forEach(function(c){

selCliente.innerHTML +=
'<option value="' +
escaparHTML(c) +
'">' +
escaparHTML(c) +
'</option>';

});

if(atualCliente){

selCliente.value =
atualCliente;

}

selProduto.innerHTML =
'<option value="">Todos os produtos</option>';

produtosRelatorio
.sort()
.forEach(function(p){

selProduto.innerHTML +=
'<option value="' +
escaparHTML(p) +
'">' +
escaparHTML(p) +
'</option>';

});

if(atualProduto){

selProduto.value =
atualProduto;

}

}


/* =========================================================
   GERAR RELATÓRIO VENDAS
========================================================= */

function gerarRelatorioVendas(){

carregarFiltrosRelatorioVendas();

const dataInicial =
document.getElementById(
"rv-data-inicial"
).value;

const dataFinal =
document.getElementById(
"rv-data-final"
).value;

const vendedorFiltro =
document.getElementById(
"rv-vendedor"
).value;

const clienteFiltro =
document.getElementById(
"rv-cliente"
).value;

const produtoFiltro =
document.getElementById(
"rv-produto"
).value;

const pagamentoFiltro =
document.getElementById(
"rv-pagamento"
).value;

let vendasFiltradas =
vendas.slice();

if(dataInicial){

vendasFiltradas =
vendasFiltradas.filter(function(v){

return String(v.data || "") >= dataInicial;

});

}

if(dataFinal){

vendasFiltradas =
vendasFiltradas.filter(function(v){

return String(v.data || "") <= dataFinal;

});

}

if(vendedorFiltro){

vendasFiltradas =
vendasFiltradas.filter(function(v){

return String(
v.vendedor ||
"Não informado"
) === vendedorFiltro;

});

}

if(clienteFiltro){

vendasFiltradas =
vendasFiltradas.filter(function(v){

return String(
v.cliente ||
"Não informado"
) === clienteFiltro;

});

}

if(pagamentoFiltro){

vendasFiltradas =
vendasFiltradas.filter(function(v){

return String(
v.pagamento || ""
) === pagamentoFiltro;

});

}

let linhas = [];
let totalItens = 0;
let totalDesconto = 0;
let faturamento = 0;
let quantidadeVendas = 0;

vendasFiltradas.forEach(function(v){

let itens =
v.itens || [];

if(produtoFiltro){

itens =
itens.filter(function(item){

return (
item.codigo +
" - " +
item.produto
) === produtoFiltro;

});

if(itens.length === 0){

return;

}

}

quantidadeVendas++;

if(!produtoFiltro){

totalDesconto +=
Number(v.desconto || 0);

faturamento +=
Number(v.total || 0);

}

let valorItens = 0;

itens.forEach(function(item){

const quantidade =
Number(item.quantidade || 0);

const preco =
Number(item.preco || 0);

const valorItem =
quantidade * preco;

totalItens += quantidade;

valorItens += valorItem;

linhas.push({

numero:v.numero || "-",
data:v.data || "-",
hora:v.hora || "--:--:--",
vendedor:v.vendedor || "Não informado",
cliente:v.cliente || "Não informado",
codigo:item.codigo || "-",
produto:item.produto || "-",
quantidade:quantidade,
preco:preco,
total:valorItem,
pagamento:v.pagamento || "-",
observacao:v.observacao || ""

});

});

if(produtoFiltro){

faturamento += valorItens;

}

});

const tbody =
document.getElementById(
"tabela-relatorio-vendas-body"
);

tbody.innerHTML = "";

if(linhas.length === 0){

tbody.innerHTML =

"<tr>" +

"<td colspan='12' style='text-align:center;padding:25px;color:#777;'>" +

"Nenhuma venda encontrada para os filtros informados." +

"</td>" +

"</tr>";

}else{

linhas
.sort(function(a,b){

return (
b.data +
" " +
b.hora
)
.localeCompare(
a.data +
" " +
a.hora
);

})
.forEach(function(linha){

const tr =
document.createElement("tr");

tr.innerHTML =

"<td>" +
escaparHTML(linha.numero) +
"</td>" +

"<td>" +
escaparHTML(linha.data) +
"</td>" +

"<td>" +
escaparHTML(linha.hora) +
"</td>" +

"<td>" +
escaparHTML(linha.vendedor) +
"</td>" +

"<td>" +
escaparHTML(linha.cliente) +
"</td>" +

"<td>" +
escaparHTML(linha.codigo) +
"</td>" +

"<td>" +
escaparHTML(linha.produto) +
"</td>" +

"<td>" +
linha.quantidade +
"</td>" +

"<td>" +
moeda(linha.preco) +
"</td>" +

"<td>" +
moeda(linha.total) +
"</td>" +

"<td>" +

"<span class='badge-pagamento'>" +

escaparHTML(linha.pagamento) +

"</span>" +

"</td>" +

"<td>" +
escaparHTML(linha.observacao) +
"</td>";

tbody.appendChild(tr);

});

}

document.getElementById(
"rv-total-vendas"
).textContent =
quantidadeVendas;

document.getElementById(
"rv-total-itens"
).textContent =
totalItens;

document.getElementById(
"rv-total-desconto"
).textContent =
moeda(totalDesconto);

document.getElementById(
"rv-faturamento"
).textContent =
moeda(faturamento);

let resumo = "Relatório gerado";

if(dataInicial)
resumo += " de " + dataInicial;

if(dataFinal)
resumo += " até " + dataFinal;

if(vendedorFiltro)
resumo +=
" | Vendedor: " +
vendedorFiltro;

if(clienteFiltro)
resumo +=
" | Cliente: " +
clienteFiltro;

if(produtoFiltro)
resumo +=
" | Produto: " +
produtoFiltro;

if(pagamentoFiltro)
resumo +=
" | Pagamento: " +
pagamentoFiltro;

resumo +=
" | Registros detalhados: " +
linhas.length;

document.getElementById(
"rv-resumo-texto"
).textContent =
resumo;

}


/* =========================================================
   FECHAR RELATÓRIO DE VENDAS
========================================================= */

function fecharRelatorioVendas(){

document.getElementById(
"area-relatorio-vendas"
).style.display =
"none";

}


/* =========================================================
   IMPRIMIR RELATÓRIO DE VENDAS
========================================================= */

function imprimirRelatorioVendas(){

const area =
document.getElementById(
"area-relatorio-vendas"
);

if(area.style.display === "none"){

abrirRelatorioVendas();

}

window.print();

}


/* =========================================================
   EXPORTAR RELATÓRIO VENDAS
========================================================= */

function exportarRelatorioVendasExcel(){

const dataInicial =
document.getElementById(
"rv-data-inicial"
).value;

const dataFinal =
document.getElementById(
"rv-data-final"
).value;

const vendedorFiltro =
document.getElementById(
"rv-vendedor"
).value;

const clienteFiltro =
document.getElementById(
"rv-cliente"
).value;

const produtoFiltro =
document.getElementById(
"rv-produto"
).value;

const pagamentoFiltro =
document.getElementById(
"rv-pagamento"
).value;

const linhasExcel = [];

vendas.forEach(function(v){

if(
dataInicial &&
String(v.data || "") < dataInicial
)
return;

if(
dataFinal &&
String(v.data || "") > dataFinal
)
return;

if(
vendedorFiltro &&
String(
v.vendedor ||
"Não informado"
) !== vendedorFiltro
)
return;

if(
clienteFiltro &&
String(
v.cliente ||
"Não informado"
) !== clienteFiltro
)
return;

if(
pagamentoFiltro &&
String(
v.pagamento || ""
) !== pagamentoFiltro
)
return;

(v.itens || []).forEach(function(item){

const chave =
item.codigo +
" - " +
item.produto;

if(
produtoFiltro &&
chave !== produtoFiltro
)
return;

const quantidade =
Number(item.quantidade || 0);

const preco =
Number(item.preco || 0);

const total =
quantidade * preco;

linhasExcel.push({

"Nº Venda":
v.numero || "-",

"Data":
v.data || "-",

"Horário":
v.hora || "--:--:--",

"Vendedor":
v.vendedor || "Não informado",

"Cliente":
v.cliente || "Não informado",

"Código":
item.codigo || "-",

"Produto":
item.produto || "-",

"Quantidade":
quantidade,

"Preço Unitário":
preco,

"Valor Total":
total,

"Forma de Pagamento":
v.pagamento || "-",

"Observação":
v.observacao || ""

});

});

});

if(linhasExcel.length === 0){

alert(
"Nenhuma venda encontrada para exportar."
);

return;

}

const wb =
XLSX.utils.book_new();

const ws =
XLSX.utils.json_to_sheet(
linhasExcel
);

XLSX.utils.book_append_sheet(
wb,
ws,
"Relatório de Vendas"
);

XLSX.writeFile(
wb,
"relatorio_vendas.xlsx"
);

}



async function carregarDadosFirebase() {
  try {
    const resposta = await fetch("/api/dados", {
      cache: "no-store"
    });

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar os dados.");
    }

    const dados = await resposta.json();

    produtos = Array.isArray(dados.produtos)
      ? dados.produtos
      : [];

    movimentacoes = Array.isArray(
      dados.movimentacoes
    )
      ? dados.movimentacoes
      : [];

    vendas = Array.isArray(dados.vendas)
      ? dados.vendas
      : [];

    atualizarTudo();
  } catch (erro) {
    console.error(
      "Erro ao carregar dados do Firebase:",
      erro
    );

    alert(
      "Não foi possível carregar os dados do servidor."
    );
  }
}










/* =========================================================
   ATUALIZAR TUDO
========================================================= */

function atualizarTudo(){

atualizarTabelaEstoque();

atualizarTabelaMovimentacoes();

atualizarSelectProdutos();

carregarCategoriasNoFiltro();

carregarProdutosRelatorio();

atualizarTabelaNFEntrada();

atualizarTabelaNFSaida();

atualizarTabelaItensVenda();

atualizarTotalVenda();

atualizarResumoVendas();

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

window.onload = async function() {

document.getElementById(
"mov-data"
).value =
dataHojeISO();

document.getElementById(
"nf-entrada-data"
).value =
dataHojeISO();

document.getElementById(
"nf-saida-data"
).value =
dataHojeISO();

atualizarTudo();

};


carregarDadosFirebase();

