# language: pt
# Rastreabilidade: F-47 (imagem da sala) / F-48 (imagem do equipamento)
#   → RNF-imagem-de-recurso · CA02/CA03/CA05/CA08/CA09 · IMG02/IMG03/IMG08.
# Natureza: SIMULAÇÃO DE DOMÍNIO — os passos chamam a lógica PURA real
#   (validateImageFile / resourceImageUrl), a mesma que roda no client e na
#   Server Action. Não é E2E de browser.
Funcionalidade: Imagem de recurso (validação e exibição)

  Cenário: Aceitar imagem em formato e tamanho válidos (CA02/CA03)
    Dado uma imagem do tipo "image/png" com 1048576 bytes
    Quando a imagem do recurso é validada
    Então a imagem é aceita

  Cenário: Aceitar JPEG dentro do limite (CA02)
    Dado uma imagem do tipo "image/jpeg" com 524288 bytes
    Quando a imagem do recurso é validada
    Então a imagem é aceita

  Cenário: Aceitar WebP dentro do limite (CA02)
    Dado uma imagem do tipo "image/webp" com 524288 bytes
    Quando a imagem do recurso é validada
    Então a imagem é aceita

  Cenário: Recusar formato não permitido (CA02/IMG02)
    Dado uma imagem do tipo "image/gif" com 1024 bytes
    Quando a imagem do recurso é validada
    Então a imagem é recusada com aviso de formato

  Cenário: Recusar imagem acima de 2 MB (CA03/IMG03)
    Dado uma imagem do tipo "image/png" com 2097153 bytes
    Quando a imagem do recurso é validada
    Então a imagem é recusada com aviso de tamanho

  Cenário: Aceitar imagem exatamente no limite de 2 MB (CA03)
    Dado uma imagem do tipo "image/png" com 2097152 bytes
    Quando a imagem do recurso é validada
    Então a imagem é aceita

  Cenário: Recurso com imagem expõe a URL pública do bucket (CA08)
    Dado um recurso cujo caminho de imagem é "room/abc.png"
    Quando a URL pública da imagem é resolvida
    Então a URL pública aponta para o bucket "resource-images"

  Cenário: Recurso sem imagem usa o ícone padrão (CA09/IMG08)
    Dado um recurso sem imagem
    Quando a URL pública da imagem é resolvida
    Então não há URL pública e o recurso usa o ícone padrão
