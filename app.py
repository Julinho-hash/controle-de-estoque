from flask import Flask, request, jsonify, send_from_directory
import os
import json
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)

# Render envia a porta automaticamente, caso contrário usa a 10000
PORTA = int(os.environ.get("PORT", 10000))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# =========================================================
# CONFIGURAÇÃO DO FIREBASE
# =========================================================

def iniciar_firebase():

    if firebase_admin._apps:
        return

    # IMPORTANTE: Ajustado para ler 'FIREBASE_CONFIG' que colocamos na Render
    credenciais_json = os.environ.get("FIREBASE_CONFIG")

    if credenciais_json:
        try:
            dados_credenciais = json.loads(credenciais_json)

            credencial = credentials.Certificate(dados_credenciais)

            firebase_admin.initialize_app(
                credencial,
                {
                    "databaseURL": "https://firebaseio.com"
                }
            )

            print("Firebase iniciado usando FIREBASE_CONFIG na nuvem")
            return

        except Exception as erro:
            print("ERRO ao iniciar Firebase pelo FIREBASE_CONFIG:")
            print(erro)
            raise

    # No computador (Local), usa o arquivo JSON físico
    caminho_chave = os.path.join(
        BASE_DIR,
        "firebase-service-account.json"
    )

    if not os.path.exists(caminho_chave):
        raise FileNotFoundError(
            "Arquivo firebase-service-account.json não encontrado."
        )

    credencial = credentials.Certificate(caminho_chave)

    firebase_admin.initialize_app(
        credencial,
        {
            "databaseURL": "https://firebaseio.com"
        }
    )

    print("Firebase iniciado usando arquivo local")


# Inicia o Firebase
inicia_firebase()


# =========================================================
# LER DADOS
# =========================================================

def ler_dados():

    referencia = db.reference("sistema")

    dados = referencia.get()

    if not dados:
        return {
            "produtos": [],
            "movimentacoes": [],
            "vendas": []
        }

    return {
        "produtos": dados.get("produtos", []),
        "movimentacoes": dados.get("movimentacoes", []),
        "vendas": dados.get("vendas", [])
    }


# =========================================================
# SALVAR DADOS
# =========================================================

def salvar_dados(dados):

    estado = {
        "produtos": dados.get("produtos", []),
        "movimentacoes": dados.get("movimentacoes", []),
        "vendas": dados.get("vendas", [])
    }

    referencia = db.reference("sistema")

    referencia.set(estado)

    return estado


# =========================================================
# API - BUSCAR DADOS
# =========================================================

@app.route("/api/dados", methods=["GET"])
def api_obter_dados():

    try:

        dados = ler_dados()

        print("GET /api/dados - dados carregados com sucesso")

        return jsonify(dados), 200

    except Exception as erro:

        print("ERRO no GET /api/dados:")
        print(erro)

        return jsonify({
            "erro": "Erro ao obter dados do Firebase",
            "detalhes": str(erro)
        }), 500


# =========================================================
# API - SALVAR DADOS
# =========================================================

@app.route("/api/dados", methods=["POST"])
def api_salvar_dados():

    try:

        dados = request.get_json(silent=True)

        if dados is None:
            return jsonify({
                "erro": "Nenhum dado JSON recebido."
            }), 400

        estado = salvar_dados(dados)

        print("POST /api/dados - dados salvos com sucesso")

        return jsonify({
            "sucesso": True,
            "dados": estado
        }), 200

    except Exception as erro:

        print("ERRO no POST /api/dados:")
        print(erro)

        return jsonify({
            "sucesso": False,
            "erro": "Erro ao salvar dados no Firebase",
            "detalhes": str(erro)
        }), 500


# =========================================================
# PÁGINA PRINCIPAL CORRIGIDA
# =========================================================

@app.route("/")
def inicio():
    # Tenta carregar o index.html da pasta raiz
    caminho_raiz = os.path.join(BASE_DIR, "index.html")
    if os.path.isfile(caminho_raiz):
        return send_from_directory(BASE_DIR, "index.html")
        
    # Se não achar na raiz, tenta carregar de uma pasta templates
    caminho_templates = os.path.join(BASE_DIR, "templates", "index.html")
    if os.path.isfile(caminho_templates):
        return send_from_directory(os.path.join(BASE_DIR, "templates"), "index.html")

    return jsonify({
        "erro": "Arquivo index.html de entrada nao foi localizado no servidor."
    }), 404


# =========================================================
# ARQUIVOS DO SITE CORRIGIDO
# =========================================================

@app.route("/<path:nome_arquivo>")
def arquivos(nome_arquivo):

    # Verifica se o arquivo existe na pasta raiz
    caminho = os.path.join(BASE_DIR, nome_arquivo)
    if os.path.isfile(caminho):
        return send_from_directory(BASE_DIR, nome_arquivo)

    # Verifica se o arquivo existe na pasta templates
    caminho_templates = os.path.join(BASE_DIR, "templates", nome_arquivo)
    if os.path.isfile(caminho_templates):
        return send_from_directory(os.path.join(BASE_DIR, "templates"), nome_arquivo)

    return jsonify({
        "erro": "Arquivo nao encontrado"
    }), 404


# =========================================================
# EXECUÇÃO
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=PORTA,
        debug=False
    )
