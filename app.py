from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os

app = Flask(__name__)
PORTA = int(os.environ.get("PORT", 3000))
ARQUIVO_BANCO = "estoque.db"

# Páginas
@app.route("/<arquivo>")
def arquivos_estaticos(arquivo):
    return send_from_directory(".", arquivo)

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/login.html")
def login():
    return send_from_directory(".", "login.html")

# Criar banco
def criar_banco():
    conn = sqlite3.connect(ARQUIVO_BANCO)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo INTEGER UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        preco_unitario REAL NOT NULL DEFAULT 0
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS movimentacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        responsavel TEXT NOT NULL,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )""")
    conn.commit()
    conn.close()
    print("✅ Banco pronto!")

# ✅ BUSCAR PRODUTO — ACEITA TODOS OS ENDEREÇOS POSSÍVEIS
@app.route("/api/produto/<int:codigo>", methods=["GET"])
@app.route("/api/produto:<int:codigo>", methods=["GET"])
@app.route("/api/produtos/<int:codigo>", methods=["GET"])
@app.route("/api/produtos:<int:codigo>", methods=["GET"])
@app.route("/api/produtos/<int:codigo>:<int:codigo2>", methods=["GET"])
@app.route("/api/produtos:<int:codigo>:<int:codigo2>", methods=["GET"])
def buscar_produto(codigo, codigo2=None):
    conn = sqlite3.connect(ARQUIVO_BANCO)
    c = conn.cursor()
    c.execute("SELECT id,codigo,nome,categoria,preco_unitario FROM produtos WHERE codigo=?", (codigo,))
    p = c.fetchone()
    conn.close()
    if p:
        return jsonify({
            "id": p[0],
            "codigo": p[1],
            "nome": p[2],
            "categoria": p[3],
            "preco": p[4],
            "preco_unitario": p[4]
        })
    return jsonify({"erro": "Não encontrado"}), 404

# ✅ RESUMO / ESTOQUE — ACEITA TODOS OS ENDEREÇOS
@app.route("/api/resumo/<int:codigo>", methods=["GET"])
@app.route("/api/resumo:<int:codigo>", methods=["GET"])
@app.route("/api/resumo", methods=["GET"])
@app.route("/api/estoque/<int:codigo>", methods=["GET"])
@app.route("/api/estoque:<int:codigo>", methods=["GET"])
@app.route("/api/estoque", methods=["GET"])
@app.route("/api/produtos", methods=["GET"])
def resumo(codigo=None):
    conn = sqlite3.connect(ARQUIVO_BANCO)
    c = conn.cursor()
    if codigo:
        c.execute("""SELECT p.codigo,p.nome,p.categoria,p.preco_unitario,
            COALESCE(SUM(CASE WHEN m.tipo='entrada' THEN m.quantidade ELSE 0 END),0) -
            COALESCE(SUM(CASE WHEN m.tipo='saida' THEN m.quantidade ELSE 0 END),0) AS quantidade
            FROM produtos p LEFT JOIN movimentacoes m ON p.id=m.produto_id
            WHERE p.codigo=? GROUP BY p.id""", (codigo,))
    else:
        c.execute("""SELECT p.codigo,p.nome,p.categoria,p.preco_unitario,
            COALESCE(SUM(CASE WHEN m.tipo='entrada' THEN m.quantidade ELSE 0 END),0) -
            COALESCE(SUM(CASE WHEN m.tipo='saida' THEN m.quantidade ELSE 0 END),0) AS quantidade
            FROM produtos p LEFT JOIN movimentacoes m ON p.id=m.produto_id
            GROUP BY p.id ORDER BY p.codigo""")
    lista = c.fetchall()
    conn.close()
    return jsonify([{
        "codigo": p[0],
        "nome": p[1],
        "categoria": p[2],
        "preco": p[3],
        "preco_unitario": p[3],
        "quantidade": p[4]
    } for p in lista])

# ✅ CADASTRAR PRODUTO
@app.route("/api/produtos", methods=["POST"])
def cadastrar_produto():
    try:
        dados = request.get_json(force=True)
        codigo = int(dados.get("codigo", 0))
        nome = dados.get("nome", "")
        categoria = dados.get("categoria", "")
        preco = dados.get("preco", 0)
        if isinstance(preco, str):
            preco = float(preco.replace(",", "."))
        preco = float(preco)
        
        conn = sqlite3.connect(ARQUIVO_BANCO)
        c = conn.cursor()
        c.execute("INSERT INTO produtos (codigo,nome,categoria,preco_unitario) VALUES (?,?,?,?)",
                 (codigo, nome, categoria, preco))
        conn.commit()
        conn.close()
        return jsonify({"mensagem": "✅ Cadastrado com sucesso!"})
    except Exception as e:
        conn.close()
        print("→ ERRO:", str(e))
        return jsonify({"erro": "Verifique os dados!"}), 200

# ✅ MOVIMENTAÇÃO
@app.route("/api/movimentacao", methods=["POST"])
def movimentacao():
    d = request.get_json(force=True)
    conn = sqlite3.connect(ARQUIVO_BANCO)
    c = conn.cursor()
    c.execute("INSERT INTO movimentacoes (produto_id,tipo,quantidade,responsavel) VALUES (?,?,?,?)",
             (d["produto_id"], d["tipo"], d["quantidade"], d["responsavel"]))
    conn.commit()
    conn.close()
    return jsonify({"mensagem": "✅ Movimentação registrada!"})

# ✅ RELATÓRIO
@app.route("/api/movimentacoes", methods=["GET"])
def relatorio():
    conn = sqlite3.connect(ARQUIVO_BANCO)
    c = conn.cursor()
    c.execute("""SELECT m.tipo,p.codigo,p.nome,m.quantidade,m.responsavel,m.data_hora
        FROM movimentacoes m JOIN produtos p ON m.produto_id=p.id ORDER BY m.data_hora DESC""")
    lista = c.fetchall()
    conn.close()
    return jsonify([{"tipo":r[0],"codigo":r[1],"nome":r[2],"quantidade":r[3],"responsavel":r[4],"data":r[5]} for r in lista])

if __name__ == "__main__":
    criar_banco()
    print(f"✅ Servidor em http://localhost:{PORTA}")
    app.run(host="0.0.0.0", port=PORTA, debug=True)