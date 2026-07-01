# language: pt
# Rastreabilidade: US07.1 → F-07 (ver docs/backlog/features/)
# Status: especificação — step definitions a implementar
Funcionalidade: Menu em tela pequena

  Cenário: Menu recolhido em tela pequena
    Dado que Ana acessa o sistema pelo celular
    Quando a tela inicial é exibida
    Então o menu lateral aparece recolhido
    E o conteúdo principal ocupa o espaço disponível

  Cenário: Abrir o menu pelo botão
    Dado que Ana está no celular com o menu recolhido
    Quando ela toca no botão de menu
    Então o menu lateral se abre sobre o conteúdo

  Cenário: Tocar fora fecha o menu
    Dado que Ana está no celular com o menu lateral aberto
    Quando ela toca em uma área fora do menu
    Então o menu lateral se fecha
