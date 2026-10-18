class ErroAPI(Exception):
    def __init__(self, codigo: str, mensagem: str, detalhe=None):
        self.codigo = codigo
        self.mensagem = mensagem
        self.detalhe = detalhe
        super().__init__(mensagem)
