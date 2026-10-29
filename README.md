# Cronometro_Cultos_ICM
Uma página para o pré-culto com base nos horários de culto da igreja cristã maranata.

Abra `index.html` no navegador, mantendo `versiculos.js` e `painel.js` na mesma pasta.

Os 20 textos bíblicos de João Ferreira de Almeida estão salvos em `versiculos.js`, com suas referências e URLs de origem da bible-api.com. O painel central começa com um versículo e alterna a cada 15 segundos: versículo 1, notícia 1, versículo 2, notícia 2 e assim por diante. Cada lista recomeça após o último item. Os versículos funcionam sem internet. Para alterar a seleção, edite os itens desse arquivo.

As notícias usam a conexão com a internet para consultar o site oficial da igreja e são atualizadas a cada 15 minutos. O painel mostra uma notícia por vez, com imagem, data e link. Sem notícias disponíveis, continua mostrando um novo versículo a cada 15 segundos. Em falhas de atualização, mantém as notícias que já foram carregadas.

As setas laterais permitem avançar e voltar pelos conteúdos exibidos. Cada troca manual reinicia o intervalo de 15 segundos. A seta de voltar fica disponível após a primeira troca; o histórico guarda até 100 conteúdos.

Nos 5 minutos anteriores ao culto, o painel passa a exibir apenas “Momento de Silêncio de de Oração”, sem título ou setas. Ao atingir o horário, o cronômetro fica congelado em `00:00:00` por 30 minutos, mantendo a mensagem de oração. Depois, a contagem segue para o próximo culto e o painel volta a alternar os conteúdos. Os horários são: domingo às 10h e às 19h, sábado às 19h e demais dias às 19h30, conforme o relógio local.
