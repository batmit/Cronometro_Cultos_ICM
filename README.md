# Cronometro_Cultos_ICM
Uma página para o pré-culto com base nos horários de culto da igreja cristã maranata.

Abra `index.html` no navegador, mantendo `versiculos.js` e `painel.js` na mesma pasta.

Os 20 textos bíblicos de João Ferreira de Almeida estão salvos em `versiculos.js`, com suas referências e URLs de origem da bible-api.com. O painel central começa com um versículo e alterna a cada 15 segundos: versículo 1, notícia 1, versículo 2, notícia 2 e assim por diante. Cada lista recomeça após o último item. Os versículos funcionam sem internet. Para alterar a seleção, edite os itens desse arquivo.

As notícias são consultadas ao abrir, quando a conexão volta e a cada 15 minutos. Os últimos três itens e suas imagens são salvos para uso offline e restaurados ao reabrir. Falhas de conexão, respostas inválidas ou listas vazias preservam as últimas notícias. Se uma imagem falhar, mantém a imagem anterior da mesma notícia, quando disponível; caso contrário, exibe apenas o texto. Sem notícias salvas, continua mostrando os versículos. O link para ler a notícia completa requer internet.

## Aplicativo desktop (Windows)

Com Node.js e npm instalados:

```powershell
npm install
npm start
```

Para gerar o instalador para Windows de 64 bits:

```powershell
npm run dist
```

O instalador fica em `dist/`. `npm run pack` gera a pasta do aplicativo sem instalador. Use F11 para alternar a tela cheia. Enquanto a janela estiver aberta, o aplicativo impede a suspensão automática da tela. Os links das notícias abrem no navegador padrão.

No Electron, textos e imagens são gravados em `noticias.json` na pasta de dados do aplicativo (`app.getPath('userData')`, normalmente dentro de `%APPDATA%`). A gravação usa arquivo temporário e substituição para preservar o cache anterior caso a escrita falhe. No navegador, usa IndexedDB; a persistência depende de o navegador permitir armazenamento local. O cache do navegador não é transferido automaticamente para o desktop. É necessário abrir uma vez com internet para salvar as primeiras notícias. Atualizações ocorrem enquanto o aplicativo está aberto; isso não instala novas versões do aplicativo.

A logo está incluída em `assets/logo-icm.svg`, permitindo exibi-la sem conexão. O instalador não possui assinatura digital. Para verificar o comportamento das notícias, execute `npm test`.

Os botões circulares abaixo do painel e as teclas ← e → permitem avançar e voltar pelos conteúdos exibidos. Cada troca manual reinicia o intervalo de 15 segundos. A seta de voltar fica disponível após a primeira troca; o histórico guarda até 100 conteúdos.

Nos 5 minutos anteriores ao culto, o painel passa a exibir apenas “Momento de oração e de silêncio”, sem título ou setas. Ao atingir o horário, a página exibe a logo da igreja e, em texto abaixo, “Momento de reverência”, durante até 2 horas. Nessa tela, deslize o controle até o final à direita para informar que o culto terminou e exibir a tela de encerramento com “Foi um prazer te receber!” e “E cada um foi para sua casa.” (João 7:53). O encerramento fica salvo neste navegador, inclusive ao recarregar a página quando o armazenamento local estiver disponível. A despedida permanece até os 5 minutos anteriores ao próximo culto. Sem encerramento manual, após as 2 horas o painel volta a alternar os conteúdos. Os horários são: domingo às 10h e às 19h, sábado às 19h e demais dias às 19h30, conforme o relógio local.
