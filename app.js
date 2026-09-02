from flask import Flask, request, jsonify, send_from_directory
import os
import json
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)

# ============================================================

# CONFIGURAÇÃO

# ============================================================

PORTA = int(os.environ.get("PORT", 3000))

BASE_DIR = os.path.dirname(os.path.abspath(**file**))

URL_FIREBASE = "https://controledeestoque-2d07d-default-rtdb.firebaseio.com"

ARQUIVO_FIREBASE = os.path.join(
BASE_DIR,
"firebase-service-account.json"
)

# ============================================================

# CONEXÃO COM FIREBASE

# ============================================================

def conectar_firebase():

```
if firebase_admin._apps:
    return

# --------------------------------------------------------
# RENDER
# --------------------------------------------------------

credenciais_json = os.environ.get(
    "FIREBASE_CREDENTIALS_JSON"
)

if credenciais_json:

    try:

        dados = json.loads(
            credenciais_json
        )

        credencial = credentials.Certificate(
            dados
        )

        firebase_admin.initialize_app(
            credencial,
            {
                "databaseURL": URL_FIREBASE
            }
        )

        print(
            "Firebase conectado usando "
            "FIREBASE_CREDENTIALS_JSON."
        )

        return

    except Exception as erro:

        print(
            "Erro nas credenciais do Render:"
        )

        print(erro)

        raise


# --------------------------------------------------------
# COMPUTADOR
# --------------------------------------------------------

if not os.path.exists(
    ARQUIVO_FIREBASE
):

    raise FileNotFoundError(
        "Arquivo firebase-service-account.json "
        "não encontrado."
    )


credencial = credentials.Certificate(
    ARQUIVO_FIREBASE
)


firebase_admin.initialize_app(
    credencial,
    {
        "databaseURL": URL_FIREBASE
    }
)


print(
    "Firebase conectado usando "
    "firebase-service-account.json."
)
```

conectar_firebase()

# ============================================================

# ESTRUTURA PADRÃO

# ============================================================

def dados_vazios():

```
return {
    "produtos": [],
    "movimentacoes": [],
    "vendas": []
}
```

# ============================================================

# LER DADOS

# ============================================================

def ler_dados():

```
referencia = db.reference(
    "sistema"
)

dados = referencia.get()

if not isinstance(
    dados,
    dict
):

    return dados_vazios()


resultado = dados_vazios()


for nome in resultado:

    valor = dados.get(
        nome,
        []
    )

    if isinstance(
        valor,
        list
    ):

        resultado[nome] = valor

    elif isinstance(
        valor,
        dict
    ):

        resultado[nome] = list(
            valor.values()
        )


return resultado
```

# ============================================================

# SALVAR DADOS

# ============================================================

def salvar_dados(dados):

```
estado = dados_vazios()


if isinstance(
    dados.get("produtos"),
    list
):

    estado["produtos"] = dados[
        "produtos"
    ]


if isinstance(
    dados.get("movimentacoes"),
    list
):

    estado["movimentacoes"] = dados[
        "movimentacoes"
    ]


if isinstance(
    dados.get("vendas"),
    list
):

    estado["vendas"] = dados[
        "vendas"
    ]


db.reference(
    "sistema"
).set(
    estado
)
```

# ============================================================

# CONVERSÕES

# ============================================================

def numero(
valor,
padrao=0
):

```
try:

    if isinstance(
        valor,
        str
    ):

        valor = valor.replace(
            ",",
            "."
        )

    return float(
        valor
    )

except:

    return padrao
```

def inteiro(
valor,
padrao=0
):

```
try:

    return int(
        float(valor)
    )

except:

    return padrao
```

# ============================================================

# ENCONTRAR PRODUTO

# ============================================================

def encontrar_produto(
produtos,
codigo
):

```
codigo = str(
    codigo
)


for produto in produtos:

    if not isinstance(
        produto,
        dict
    ):

        continue


    if str(
        produto.get(
            "codigo",
            ""
        )
    ) == codigo:

        return produto


    if str(
        produto.get(
            "id",
            ""
        )
    ) == codigo:

        return produto


return None
```

# ============================================================

# PÁGINA PRINCIPAL

# ============================================================

@app.route("/")
def pagina_principal():

```
return send_from_directory(
    BASE_DIR,
    "index.html"
)
```

# ============================================================

# ARQUIVOS DO SITE

# ============================================================

@app.route(
"/[path:nome_arquivo](path:nome_arquivo)"
)

def arquivos():

```
caminho = os.path.join(
    BASE_DIR,
    nome_arquivo
)

if os.path.isfile(
    caminho
):

    return send_from_directory(
        BASE_DIR,
        nome_arquivo
    )


return jsonify({
    "erro": "Arquivo não encontrado"
}), 404
```

# ============================================================

# API - DADOS

# ============================================================

@app.route(
"/api/dados",
methods=["GET"]
)

def api_dados_get():

```
try:

    dados = ler_dados()

    return jsonify(
        dados
    )

except Exception as erro:

    print(
        "ERRO GET /api/dados:",
        erro
    )

    return jsonify({

        "erro":
            "Erro ao buscar dados",

        "detalhes":
            str(erro)

    }), 500
```

@app.route(
"/api/dados",
methods=["POST"]
)

def api_dados_post():

```
try:

    dados = request.get_json(
        silent=True
    )


    if not isinstance(
        dados,
        dict
    ):

        return jsonify({

            "erro":
                "Dados inválidos"

        }), 400


    salvar_dados(
        dados
    )


    return jsonify({

        "ok": True,

        "mensagem":
            "Dados salvos com sucesso"

    })


except Exception as erro:

    print(
        "ERRO POST /api/dados:",
        erro
    )

    return jsonify({

        "erro":
            "Erro ao salvar dados",

        "detalhes":
            str(erro)

    }), 500
```

# ============================================================

# TESTE FIREBASE

# ============================================================

@app.route(
"/api/teste-firebase",
methods=["GET"]
)

def teste_firebase():

```
try:

    referencia = db.reference(
        "teste/conexao"
    )


    referencia.set({

        "conectado": True,

        "mensagem":
            "Firebase funcionando"

    })


    return jsonify(
        referencia.get()
    )


except Exception as erro:

    return jsonify({

        "erro":
            str(erro)

    }), 500
```

# ============================================================

# PRODUTOS

# ============================================================

@app.route(
"/api/produtos",
methods=["GET"]
)

def listar_produtos():

```
try:

    dados = ler_dados()

    return jsonify(
        dados["produtos"]
    )

except Exception as erro:

    return jsonify({

        "erro":
            str(erro)

    }), 500
```

@app.route(
"/api/produtos",
methods=["POST"]
)

def cadastrar_produto():

```
try:

    dados = ler_dados()

    entrada = request.get_json(
        silent=True
    ) or {}


    nome = str(
        entrada.get(
            "nome",
            ""
        )
    ).strip()


    if not nome:

        return jsonify({

            "erro":
                "Nome do produto obrigatório"

        }), 400


    codigo = entrada.get(
        "codigo"
    )


    if codigo in (
        None,
        ""
    ):

        maior = 0


        for produto in dados[
            "produtos"
        ]:

            try:

                numero_codigo = int(
                    produto.get(
                        "codigo",
                        0
                    )
                )


                if numero_codigo > maior:

                    maior = numero_codigo


            except:

                pass


        codigo = maior + 1


    codigo = str(
        codigo
    )


    if encontrar_produto(
        dados["produtos"],
        codigo
    ):

        return jsonify({

            "erro":
                "Produto já cadastrado"

        }), 409


    produto = {

        "id":
            codigo,

        "codigo":
            codigo,

        "nome":
            nome,

        "categoria":
            entrada.get(
                "categoria",
                "Sem categoria"
            ),

        "preco":
            numero(
                entrada.get(
                    "preco",
                    0
                )
            ),

        "unidade":
            entrada.get(
                "unidade",
                "UN"
            ),

        "quantidade":
            inteiro(
                entrada.get(
                    "quantidade",
                    0
                )
            ),

        "ativo":
            True,

        "ultimaMov":
            entrada.get(
                "ultimaMov",
                ""
            )

    }


    produto["valor"] = (

        produto["quantidade"]

        *

        produto["preco"]

    )


    dados["produtos"].append(
        produto
    )


    salvar_dados(
        dados
    )


    return jsonify(
        produto
    ), 201


except Exception as erro:

    print(
        "ERRO POST /api/produtos:",
        erro
    )

    return jsonify({

        "erro":
            str(erro)

    }), 500
```

# ============================================================

# BUSCAR PRODUTO

# ============================================================

@app.route(
"/api/produtos/[int:codigo](int:codigo)",
methods=["GET"]
)

def buscar_produto(
codigo
):

```
try:

    dados = ler_dados()


    produto = encontrar_produto(

        dados["produtos"],

        codigo

    )


    if not produto:

        return jsonify({

            "erro":
                "Produto não encontrado"

        }), 404


    return jsonify(
        produto
    )


except Exception as erro:

    return jsonify({

        "erro":
            str(erro)

    }), 500
```

# ============================================================

# ESTOQUE

# ============================================================

@app.route(
"/api/estoque",
methods=["GET"]
)

@app.route(
"/api/resumo",
methods=["GET"]
)

def estoque():

```
try:

    dados = ler_dados()

    resultado = []


    for produto in dados[
        "produtos"
    ]:

        quantidade = inteiro(

            produto.get(
                "quantidade",
                0
            )

        )


        preco = numero(

            produto.get(
                "preco",
                0
            )

        )


        resultado.append({

            "id":
                produto.get(
                    "id"
                ),

            "codigo":
                produto.get(
                    "codigo"
                ),

            "nome":
                produto.get(
                    "nome",
                    ""
                ),

            "categoria":
                produto.get(
                    "categoria",
                    ""
                ),

            "preco":
                preco,

            "preco_unitario":
                preco,

            "unidade":
                produto.get(
                    "unidade",
                    "UN"
                ),

            "quantidade":
                quantidade,

            "valor":
                quantidade * preco

        })


    return jsonify(
        resultado
    )


except Exception as erro:

    return jsonify({

        "erro":
            str(erro)

    }), 500
```

# ============================================================

# MOVIMENTAÇÃO

# ============================================================

@app.route(
"/api/movimentacao",
methods=["POST"]
)

def movimentacao():

```
try:

    dados = ler_dados()

    entrada = request.get_json(
        silent=True
    ) or {}


    codigo = (

        entrada.get(
            "produto_id"
        )

        or

        entrada.get(
            "codigo"
        )

    )


    produto = encontrar_produto(

        dados["produtos"],

        codigo

    )


    if not produto:

        return jsonify({

            "erro":
                "Produto não encontrado"

        }), 404


    quantidade = inteiro(

        entrada.get(
            "quantidade",
            0
        )

    )


    if quantidade <= 0:

        return jsonify({

            "erro":
                "Quantidade inválida"

        }), 400


    tipo = str(

        entrada.get(
            "tipo",
            "Entrada"
        )

    )


    tipo_sem_acento = (

        tipo.lower()

        .replace(
            "í",
            "i"
        )

    )


    atual = inteiro(

        produto.get(
            "quantidade",
            0
        )

    )


    if tipo_sem_acento in (
        "saida",
        "venda"
    ):

        if quantidade > atual:

            return jsonify({

                "erro":
                    "Estoque insuficiente"

            }), 400


        novo = (
            atual - quantidade
        )

    else:

        novo = (
            atual + quantidade
        )


    produto[
        "quantidade"
    ] = novo


    preco = numero(

        produto.get(
            "preco",
            0
        )

    )


    produto[
        "valor"
    ] = novo * preco


    produto[
        "ultimaMov"
    ] = entrada.get(
        "data",
        ""
    )


    movimento = {

        "id":
            str(
                len(
                    dados[
                        "movimentacoes"
                    ]
                ) + 1
            ),

        "data":
            entrada.get(
                "data",
                ""
            ),

        "codigo":
            produto.get(
                "codigo"
            ),

        "produto":
            produto.get(
                "nome",
                ""
            ),

        "tipo":
            tipo,

        "quantidade":
            quantidade,

        "nf":
            entrada.get(
                "nf",
                ""
            ),

        "responsavel":
            entrada.get(
                "responsavel",
                ""
            ),

        "preco":
            preco,

        "valorTotal":
            quantidade * preco

    }


    dados[
        "movimentacoes"
    ].append(
        movimento
    )


    salvar_dados(
        dados
    )


    return jsonify({

        "ok": True,

        "produto":
            produto,

        "movimentacao":
            movimento

    })


except Exception as erro:

    print(
        "ERRO MOVIMENTAÇÃO:",
        erro
    )

    return jsonify({

        "erro":
            str(erro)

    }), 500
```

# ============================================================

# MOVIMENTAÇÕES - LISTAR

# ============================================================

@app.route(
"/api/movimentacoes",
methods=["GET"]
)

def listar_movimentacoes():

```
try:

    dados = ler_dados()

    return jsonify(
        dados["movimentacoes"]
    )

except Exception as erro:

    return jsonify({

        "erro":
            str(erro)

    }), 500
```

# ============================================================

# VENDAS

# ============================================================

@app.route(
"/api/vendas",
methods=["GET"]
)

def listar_vendas():

```
try:

    dados = ler_dados()

    return jsonify(
        dados["vendas"]
    )

except Exception as erro:

    return jsonify({

        "erro":
            str(erro)

    }), 500
```

@app.route(
"/api/vendas",
methods=["POST"]
)

def cadastrar_venda():

```
try:

    dados = ler_dados()

    venda = request.get_json(
        silent=True
    )


    if not isinstance(
        venda,
        dict
    ):

        return jsonify({

            "erro":
                "Venda inválida"

        }), 400


    dados[
        "vendas"
    ].append(
        venda
    )


    salvar_dados(
        dados
    )


    return jsonify({

        "ok":
            True,

        "venda":
            venda

    }), 201


except Exception as erro:

    return jsonify({

        "erro":
            str(erro)

    }), 500
```

# ============================================================

# INICIAR SERVIDOR

# ============================================================

if **name** == "**main**":

```
print("")
print("======================================")
print(" SISTEMA DE CONTROLE DE ESTOQUE")
print("======================================")
print(
    "Servidor: http://localhost:"
    + str(PORTA)
)
print("======================================")
print("")


app.run(

    host="0.0.0.0",

    port=PORTA,

    debug=True

)
```
