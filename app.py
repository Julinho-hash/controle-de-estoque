from flask import Flask, request, jsonify, send_from_directory
import os
import firebase_admin
from firebase_admin import credentials, db


app = Flask(__name__)

PORTA = int(os.environ.get("PORT", 3000))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAMINHO_CHAVE = os.path.join(
    BASE_DIR,
    "firebase-service-account.json"
)

URL_FIREBASE = (
    "https://controledeestoque-2d07d-default-rtdb.firebaseio.com"
)


# =========================
# CONEXÃO COM O FIREBASE
# =========================

if not os.path.exists(CAMINHO_CHAVE):
    raise FileNotFoundError(
        "O arquivo firebase-service-account.json "
        "não foi encontrado na pasta do app.py."
    )

if not firebase_admin._apps:
    credencial = credentials.Certificate(CAMINHO_CHAVE)

    firebase_admin.initialize_app(
        credencial,
        {
            "databaseURL": URL_FIREBASE
        }
    )


# =========================
# FUNÇÕES DO BANCO
# =========================

def estado_vazio():
    return {
        "produtos": [],
        "movimentacoes": [],
        "vendas": []
    }


def ler_dados():
    dados = db.reference("sistema").get()

    if not isinstance(dados, dict):
        return estado_vazio()

    resultado = estado_vazio()

    for nome in resultado:
        valor = dados.get(nome, [])

        if isinstance(valor, list):
            resultado[nome] = valor

        elif isinstance(valor, dict):
            resultado[nome] = [
                item for item in valor.values()
                if isinstance(item, dict)
            ]

    return resultado


def salvar_dados(dados):
    estado = estado_vazio()

    for nome in estado:
        valor = dados.get(nome, [])

        if isinstance(valor, list):
            estado[nome] = valor

    db.reference("sistema").set(estado)


def numero(valor, padrao=0):
    try:
        if isinstance(valor, str):
            valor = valor.replace(",", ".")
        return float(valor)
    except (TypeError, ValueError):
        return padrao


def inteiro(valor, padrao=0):
    try:
        return int(float(valor))
    except (TypeError, ValueError):
        return padrao


def encontrar_produto(produtos, identificador):
    identificador = str(identificador)

    for produto in produtos:
        if not isinstance(produto, dict):
            continue

        if str(produto.get("id", "")) == identificador:
            return produto

        if str(produto.get("codigo", "")) == identificador:
            return produto

    return None


# =========================
# PÁGINAS
# =========================

@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:arquivo>")
def arquivos_estaticos(arquivo):
    caminho = os.path.join(BASE_DIR, arquivo)

    if os.path.isfile(caminho):
        return send_from_directory(BASE_DIR, arquivo)

    return jsonify({
        "erro": "Arquivo não encontrado"
    }), 404


# =========================
# TESTE DO FIREBASE
# =========================

@app.route("/api/teste-firebase", methods=["GET"])
def teste_firebase():
    referencia = db.reference("teste/conexao")

    referencia.set({
        "conectado": True,
        "mensagem": "Firebase funcionando"
    })

    return jsonify(referencia.get())


# =========================
# DADOS COMPLETOS DO SISTEMA
# =========================

@app.route("/api/dados", methods=["GET"])
def obter_dados():
    return jsonify(ler_dados())


@app.route("/api/dados", methods=["POST"])
def atualizar_dados():
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return jsonify({
            "erro": "Dados inválidos"
        }), 400

    salvar_dados(dados)

    return jsonify({
        "ok": True,
        "mensagem": "Dados salvos no Firebase"
    })


# =========================
# PRODUTOS
# =========================

@app.route("/api/produtos", methods=["GET", "POST"])
def produtos_api():
    dados = ler_dados()

    if request.method == "GET":
        return jsonify(dados["produtos"])

    entrada = request.get_json(silent=True) or {}

    nome = str(entrada.get("nome", "")).strip()
    categoria = str(
        entrada.get("categoria", "Sem categoria")
    ).strip()

    if not nome:
        return jsonify({
            "erro": "O nome do produto é obrigatório"
        }), 400

    codigo = entrada.get("codigo")

    if codigo in (None, ""):
        codigos = []

        for produto in dados["produtos"]:
            try:
                codigos.append(int(produto.get("codigo", 0)))
            except (TypeError, ValueError):
                pass

        codigo = max(codigos, default=0) + 1

    codigo = str(codigo)

    if encontrar_produto(dados["produtos"], codigo):
        return jsonify({
            "erro": "Já existe um produto com esse código"
        }), 409

    produto = {
        "id": codigo,
        "codigo": codigo,
        "nome": nome,
        "categoria": categoria or "Sem categoria",
        "preco": numero(entrada.get("preco", 0)),
        "unidade": entrada.get("unidade", "UN"),
        "quantidade": inteiro(
            entrada.get("quantidade", 0)
        ),
        "ativo": True,
        "ultimaMov": entrada.get("ultimaMov", "")
    }

    produto["valor"] = (
        produto["quantidade"] * produto["preco"]
    )

    dados["produtos"].append(produto)
    salvar_dados(dados)

    return jsonify(produto), 201


@app.route("/api/produto/<int:codigo>", methods=["GET"])
@app.route("/api/produtos/<int:codigo>", methods=["GET"])
def buscar_produto(codigo):
    dados = ler_dados()
    produto = encontrar_produto(
        dados["produtos"],
        codigo
    )

    if not produto:
        return jsonify({
            "erro": "Produto não encontrado"
        }), 404

    return jsonify(produto)


# =========================
# RESUMO / ESTOQUE
# =========================

@app.route("/api/resumo", methods=["GET"])
@app.route("/api/estoque", methods=["GET"])
def resumo_estoque():
    dados = ler_dados()
    produtos = dados["produtos"]

    codigo = request.args.get("codigo")

    if codigo:
        produtos = [
            produto for produto in produtos
            if str(produto.get("codigo")) == str(codigo)
        ]

    resultado = []

    for produto in produtos:
        quantidade = inteiro(
            produto.get("quantidade", 0)
        )

        preco = numero(
            produto.get(
                "preco",
                produto.get("preco_unitario", 0)
            )
        )

        resultado.append({
            "id": produto.get("id"),
            "codigo": produto.get("codigo"),
            "nome": produto.get("nome", ""),
            "categoria": produto.get(
                "categoria",
                "Sem categoria"
            ),
            "preco": preco,
            "preco_unitario": preco,
            "unidade": produto.get("unidade", "UN"),
            "quantidade": quantidade,
            "valor": quantidade * preco
        })

    return jsonify(resultado)


# =========================
# MOVIMENTAÇÕES
# =========================

@app.route("/api/movimentacao", methods=["POST"])
def registrar_movimentacao():
    entrada = request.get_json(silent=True) or {}
    dados = ler_dados()

    identificador = (
        entrada.get("produto_id")
        or entrada.get("codigo")
    )

    produto = encontrar_produto(
        dados["produtos"],
        identificador
    )

    if not produto:
        return jsonify({
            "erro": "Produto não encontrado"
        }), 404

    quantidade = inteiro(
        entrada.get("quantidade", 0)
    )

    if quantidade <= 0:
        return jsonify({
            "erro": "Quantidade inválida"
        }), 400

    tipo_original = str(
        entrada.get("tipo", "Entrada")
    ).strip()

    tipo_normalizado = (
        tipo_original.lower()
        .replace("í", "i")
    )

    estoque_atual = inteiro(
        produto.get("quantidade", 0)
    )

    eh_saida = tipo_normalizado in (
        "saida",
        "venda"
    )

    if eh_saida:
        if quantidade > estoque_atual:
            return jsonify({
                "erro": "Estoque insuficiente"
            }), 400

        novo_estoque = estoque_atual - quantidade
    else:
        novo_estoque = estoque_atual + quantidade

    produto["quantidade"] = novo_estoque

    preco = numero(
        produto.get(
            "preco",
            produto.get("preco_unitario", 0)
        )
    )

    produto["valor"] = novo_estoque * preco
    produto["ultimaMov"] = entrada.get(
        "data",
        ""
    )

    movimentacao = {
        "id": str(len(dados["movimentacoes"]) + 1),
        "data": entrada.get("data", ""),
        "codigo": produto.get("codigo"),
        "produto": produto.get("nome", ""),
        "tipo": tipo_original,
        "quantidade": quantidade,
        "nf": entrada.get("nf", ""),
        "responsavel": entrada.get(
            "responsavel",
            ""
        ),
        "preco": preco,
        "valorTotal": quantidade * preco
    }

    dados["movimentacoes"].append(movimentacao)
    salvar_dados(dados)

    return jsonify({
        "ok": True,
        "produto": produto,
        "movimentacao": movimentacao
    })


@app.route("/api/movimentacoes", methods=["GET"])
def listar_movimentacoes():
    dados = ler_dados()
    return jsonify(dados["movimentacoes"])


# =========================
# VENDAS
# =========================

@app.route("/api/vendas", methods=["GET", "POST"])
def vendas_api():
    dados = ler_dados()

    if request.method == "GET":
        return jsonify(dados["vendas"])

    venda = request.get_json(silent=True)

    if not isinstance(venda, dict):
        return jsonify({
            "erro": "Venda inválida"
        }), 400

    dados["vendas"].append(venda)
    salvar_dados(dados)

    return jsonify({
        "ok": True,
        "venda": venda
    }), 201


# =========================
# INICIAR SERVIDOR
# =========================

if __name__ == "__main__":
    print(
        f"Servidor em http://localhost:{PORTA}"
    )

    app.run(
        host="0.0.0.0",
        port=PORTA,
        debug=True
    )