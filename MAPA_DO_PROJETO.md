# Mapa do Projeto — Spotify Clone

## Estrutura MVC explicada

Os arquivos do PWA ficam na raiz e são independentes da arquitetura MVC. As
páginas HTML também ficam na raiz e iniciam diretamente os controllers de cada
fluxo, além de registrar o Service Worker.

```text
Spotify-main/
├── index.html                 # Página do player
├── admin.html                 # Painel do criador
├── manifest.json              # Metadados e ícone do PWA
├── sw.js                      # Cache e ciclo de vida do Service Worker
├── assets/
│   ├── icon.svg               # Ícone local do PWA
│   └── cover-placeholder.svg  # Capa local de fallback para imagens indisponíveis
├── models/
│   ├── firebase-config.js # Inicialização e configuração Firebase original
│   ├── songs-model.js        # Leitura e escrita do catálogo de músicas
│   └── likes-model.js       # Identificação local e operações de curtidas
├── views/
│   ├── style.css      # Estilos do player
│   ├── admin.css      # Estilos do painel
│   ├── player-view.js          # Consultas DOM e renderização do player
│   └── admin-view.js          # Consultas DOM e renderização do painel
└── controllers/
    ├── player-controller.js   # Navegação, reprodução, curtidas e volume
    └── admin-controller.js   # Eventos, validação e fluxo do formulário
```

Os nomes dos arquivos MVC seguem os nomes comuns em inglês: `model` cuida dos dados, `view` da interface e `controller` dos eventos e do fluxo.

### PWA na raiz

`manifest.json` descreve a instalação do PWA e `sw.js` implementa o cache dos
recursos estáticos. Ambos permanecem diretamente na raiz. O registro do Service
Worker está nos módulos inline de `index.html` e `admin.html`; não há controller
nem arquivos JavaScript separados para PWA.

**Model** concentra o acesso e a transformação dos dados associados ao Firebase.
`firebase-config.js` foi apenas movido para `models/`: seu conteúdo, credenciais,
versões e URLs de conexão não foram alterados.

**View** obtém elementos da página e atualiza o DOM. Os estilos ficam junto à
camada visual; a marcação HTML permanece na raiz para preservar os endereços das
páginas estáticas.

**Controller** conecta eventos do navegador aos models e solicita atualizações
à view. Não contém credenciais Firebase.

Os antigos `app.js`, `admin.js` e `script.js` na raiz foram removidos. Os dois
primeiros eram apenas pontos de entrada: agora os HTMLs importam e iniciam
diretamente os controllers MVC. `script.js` estava vazio e não era referenciado.

### Como ler os nomes das funções

Os nomes indicam a ação em palavras simples. Por exemplo:

- `acompanharMusicasDoFirebase` recebe as músicas e suas atualizações.
- `salvarMusicaNova` e `apagarMusica` alteram o catálogo.
- `tocarMusicaEscolhida` encontra a faixa clicada e começa a reprodução.
- `desenharTabelaDeMusicas` coloca as músicas na tabela do painel.
- `iniciarPlayer` e `iniciarPainelAdmin` preparam cada página.

Os nomes das funções são do projeto. Métodos como `addEventListener`, `play` e
`onValue` mantêm os nomes originais das APIs do navegador e do Firebase.

Para ver como as músicas aparecem, siga
`acompanharMusicasDoFirebase` → `atualizarListaDeMusicas` →
`mostrarMusicasNaTela`. Ao clicar numa faixa, o Controller usa
`tocarMusicaEscolhida` e depois `tocarMusicaPelaPosicao`.

## Fluxo de execução

### Reprodução de uma música

1. `index.html` importa `iniciarPlayer` de
   `controllers/player-controller.js` e inicia o player.
2. O controller assina o catálogo através de `acompanharMusicasDoFirebase` no model.
3. O model lê `songs` no Realtime Database e entrega ao controller uma lista de
   músicas com os respectivos IDs.
4. O controller solicita à view que desenhe os cartões.
5. Quando a pessoa clica num cartão ou no botão de play, o controller localiza a
   música e passa o `audioUrl` existente para o elemento HTML de áudio.
6. A view atualiza capa, título, artista e ícone do player. Os eventos do áudio
   atualizam a duração e o progresso mostrado.

O clique em play **não faz uma nova busca do arquivo de áudio**: o endereço
`audioUrl` já veio no registro do catálogo e é reproduzido pelo elemento `<audio>`.

### Curtir uma música

1. O controller recebe o clique no coração do cartão ou do player.
2. Consulta o estado local atual e chama `salvarOuRemoverCurtida` no model.
3. O model adiciona ou remove `likes/{userId}/{songId}` no Firebase.
4. A subscrição em tempo real devolve os IDs atualizados ao controller.
5. O controller solicita à view a atualização dos corações, da grelha de curtidas
   e dos contadores.

### Administração de músicas

1. `admin.html` importa `iniciarPainelAdmin` de
   `controllers/admin-controller.js` e inicia o painel.
2. O controller recebe as atualizações de `acompanharMusicasParaPainel` e pede à view
   para renderizar a tabela.
3. Ao submeter o formulário, o controller converte os arquivos selecionados para
   Data URLs, preserva os arquivos atuais durante uma edição sem substituição e
   chama `salvarMusicaNova` ou `salvarEdicaoDaMusica`.
4. O model realiza a escrita; a subscrição atualiza a tabela sem recarregar a
   página. A remoção segue o mesmo fluxo após confirmação.

## Tabela mapeada de funções

| Função | Camada MVC | Arquivo | O que faz |
|---|---|---|---|
| `acompanharMusicasDoFirebase` | MODEL | `models/songs-model.js` | Observa músicas e entrega uma lista com IDs. |
| `acompanharMusicasParaPainel` | MODEL | `models/songs-model.js` | Observa músicas em formato indexado para a tabela. |
| `salvarMusicaNova` | MODEL | `models/songs-model.js` | Cria registro no Firebase. |
| `salvarEdicaoDaMusica` | MODEL | `models/songs-model.js` | Atualiza registro existente. |
| `apagarMusica` | MODEL | `models/songs-model.js` | Remove registro do catálogo. |
| `pegarIdDoNavegador` | MODEL | `models/likes-model.js` | Mantém um ID para guardar as curtidas neste navegador. |
| `acompanharCurtidasDoUsuario` | MODEL | `models/likes-model.js` | Observa as curtidas do utilizador no Firebase. |
| `salvarOuRemoverCurtida` | MODEL | `models/likes-model.js` | Adiciona ou remove uma curtida. |
| `pegarElementosDoPlayer` | VIEW | `views/player-view.js` | Reúne as referências DOM do player. |
| `montarCartaoDeMusica` | VIEW | `views/player-view.js` | Constrói um cartão visual de música. |
| `mostrarMusicasNaTela` | VIEW | `views/player-view.js` | Desenha catálogo e músicas curtidas. |
| `mostrarPaginaEscolhida` | VIEW | `views/player-view.js` | Alterna início/curtidas na interface. |
| `atualizarContadorDeCurtidas` | VIEW | `views/player-view.js` | Atualiza os textos de contagem de curtidas. |
| `atualizarPlayerComMusica` | VIEW | `views/player-view.js` | Atualiza faixa, capa e áudio do player. |
| `atualizarBotaoPlayPause` | VIEW | `views/player-view.js` | Mostra o ícone de play ou pausa. |
| `atualizarCoracaoDoPlayer` | VIEW | `views/player-view.js` | Atualiza o coração da faixa atual. |
| `atualizarProgressoDoPlayer` | VIEW | `views/player-view.js` | Atualiza duração e barra de progresso. |
| `formatarTempo` | VIEW | `views/player-view.js` | Formata segundos como `mm:ss`. |
| `atualizarVolumeDoPlayer` | VIEW | `views/player-view.js` | Atualiza volume, slider e ícone. |
| `pegarElementosDoPainel` | VIEW | `views/admin-view.js` | Reúne as referências DOM do painel. |
| `desenharTabelaDeMusicas` | VIEW | `views/admin-view.js` | Desenha linhas da tabela administrativa. |
| `preencherFormularioComMusica` | VIEW | `views/admin-view.js` | Preenche e apresenta o formulário de edição. |
| `limparFormulario` | VIEW | `views/admin-view.js` | Restaura o formulário de nova música. |
| `mostrarSalvamentoEmAndamento` | VIEW | `views/admin-view.js` | Apresenta o estado de processamento. |
| `mostrarErroDeSalvamento` | VIEW | `views/admin-view.js` | Reativa o envio e restaura o rótulo após erro. |
| `iniciarPlayer` | CONTROLLER | `controllers/player-controller.js` | Liga modelos, view e eventos do player. |
| `atualizarMusicasNaTela` | CONTROLLER | `controllers/player-controller.js` | Solicita atualização das grelhas. |
| `atualizarCoracaoDaFaixa` | CONTROLLER | `controllers/player-controller.js` | Atualiza o coração da faixa atual. |
| `tocarMusicaEscolhida` | CONTROLLER | `controllers/player-controller.js` | Localiza e encaminha a música selecionada. |
| `tocarMusicaPelaPosicao` | CONTROLLER | `controllers/player-controller.js` | Toca a música que está na posição indicada da lista. |
| `alternarCurtidaDaFaixa` | CONTROLLER | `controllers/player-controller.js` | Envia ao model a alternância da curtida atual. |
| `aoClicarEmMusica` | CONTROLLER | `controllers/player-controller.js` | Trata clique no cartão, play ou coração. |
| `tocarProximaMusica` | CONTROLLER | `controllers/player-controller.js` | Avança circularmente no catálogo. |
| `tocarMusicaAnterior` | CONTROLLER | `controllers/player-controller.js` | Retrocede circularmente no catálogo. |
| `tocarOuPausarMusica` | CONTROLLER | `controllers/player-controller.js` | Inicia, pausa ou retoma reprodução. |
| `mudarPontoDaMusica` | CONTROLLER | `controllers/player-controller.js` | Converte o slider de progresso em tempo de áudio. |
| `mudarVolume` | CONTROLLER | `controllers/player-controller.js` | Trata a alteração do slider de volume. |
| `silenciarOuRestaurarVolume` | CONTROLLER | `controllers/player-controller.js` | Silencia ou restaura o volume anterior. |
| `atualizarListaDeMusicas` | CONTROLLER | `controllers/player-controller.js` | Atualiza estado e catálogo após callback do model. |
| `atualizarListaDeCurtidas` | CONTROLLER | `controllers/player-controller.js` | Atualiza estado e interface após callback do model. |
| `mostrarPaginaInicial` | CONTROLLER | `controllers/player-controller.js` | Trata clique para a vista Início. |
| `mostrarPaginaDeCurtidas` | CONTROLLER | `controllers/player-controller.js` | Trata clique para a vista Curtidas. |
| `atualizarProgressoEnquantoToca` | CONTROLLER | `controllers/player-controller.js` | Sincroniza duração e posição do áudio com a view. |
| `prepararArquivoParaSalvar` | CONTROLLER | `controllers/admin-controller.js` | Converte arquivo selecionado sem alterar o formato guardado. |
| `aoTerminarLeituraDoArquivo` | CONTROLLER | `controllers/admin-controller.js` | Entrega a Data URL ao processamento após leitura concluída. |
| `aoFalharLeituraDoArquivo` | CONTROLLER | `controllers/admin-controller.js` | Propaga falhas de leitura do arquivo. |
| `iniciarPainelAdmin` | CONTROLLER | `controllers/admin-controller.js` | Liga formulário, tabela e operações administrativas. |
| `atualizarTabelaDeMusicas` | CONTROLLER | `controllers/admin-controller.js` | Atualiza cache e tabela com os dados do model. |
| `abrirEdicaoDaMusica` | CONTROLLER | `controllers/admin-controller.js` | Inicia edição do registro selecionado. |
| `cancelarEdicao` | CONTROLLER | `controllers/admin-controller.js` | Cancela ou encerra o modo de edição. |
| `aoClicarNaAcaoDaMusica` | CONTROLLER | `controllers/admin-controller.js` | Trata ações de editar e eliminar. |
| `salvarMusicaDoFormulario` | CONTROLLER | `controllers/admin-controller.js` | Valida, prepara e grava música nova ou editada. |
| `prepararListaDeMusicas` | MODEL | `models/songs-model.js` | Normaliza o snapshot Firebase do catálogo. |
| `prepararMusicasParaPainel` | MODEL | `models/songs-model.js` | Entrega músicas no formato indexado administrativo. |
| `listarIdsCurtidos` | MODEL | `models/likes-model.js` | Normaliza o snapshot de curtidas. |
| `install` / `activate` / `fetch` | PWA | `sw.js` | Instala cache, remove versões antigas e atende pedidos cache-first. |

## PWA

As duas páginas incluem o manifesto e registram diretamente `./sw.js` em seus
módulos inline, sem uma camada MVC separada para o PWA. O manifesto usa
`start_url` relativo e o ícone local `assets/icon.svg`. O cache lista os caminhos
atuais de MVC e foi versionado como
`spotify-clone-mvc-v11` para invalidar os arquivos anteriores. A atualização do
worker assume o controle imediato das páginas e consulta apenas o cache atual.

O Service Worker armazena arquivos estáticos. A comunicação Firebase e os pedidos
a recursos externos continuam dependentes da rede, tal como antes.

## Roteiro de apresentação (3 minutos)

### 0:00–0:30 — Apresentar a organização

**Falar:** “Separei o projeto em Model, View e Controller sem mudar o formato dos
dados nem as regras do player. Os HTMLs ficaram na raiz porque são as páginas de
entrada da hospedagem; as responsabilidades JavaScript e os estilos estão
organizados nas pastas MVC.”

**Demonstrar:** mostrar `models/`, `views/` e `controllers/`, destacando que o
arquivo Firebase está em `models/` e mantém as mesmas credenciais.

### 0:30–1:20 — Demonstrar a reprodução

**Falar:** “A página importa e inicia `iniciarPlayer` em
`player-controller.js`. O controller ouve o catálogo no model, e a view renderiza os cartões.
O controller trata o clique e envia o áudio para
o elemento HTML, enquanto a view atualiza o player.”

**Demonstrar:** abrir o player, clicar numa música, usar play/pause e avançar a
barra de progresso; depois mostrar `player-controller.js`, `songs-model.js` e
`player-view.js` nesta ordem.

### 1:20–2:10 — Demonstrar as curtidas e administração

**Falar:** “As curtidas são isoladas pelo ID local do utilizador e sincronizadas
em tempo real. No painel, o controller valida e prepara os arquivos; o model
realiza a escrita e a view atualiza a tabela.”

**Demonstrar:** curtir uma música e abrir Curtidas. Em seguida, abrir o painel do
criador e apontar os handlers de formulário e os métodos de criar, atualizar e
remover no model.

### 2:10–3:00 — Mostrar o PWA e resumir

**Falar:** “O mesmo manifesto é associado ao player e à administração. O
Service Worker guarda os arquivos estáticos nos novos caminhos MVC e remove o
cache de versões antigas. A divisão torna cada responsabilidade identificável
sem alterar as operações existentes.”

**Demonstrar:** abrir `manifest.json` e `sw.js`; finalizar mostrando esta tabela
de responsabilidades e resumindo o fluxo: **View recebe o gesto → Controller
coordena → Model acessa Firebase → Controller entrega o resultado → View renderiza**.
