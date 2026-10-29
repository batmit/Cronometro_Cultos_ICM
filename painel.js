const versiculos = window.versiculosBiblicos || [];
const conteudoCentral = document.getElementById("conteudo-central");
const tipoConteudo = document.getElementById("tipo-conteudo");
const statusNoticias = document.getElementById("status-noticias");
const botaoNoticias = document.getElementById("atualizar-noticias");
let noticias = [];
let indiceVersiculo = 0;
let indiceNoticia = 0;
let proximoConteudo = "versiculo";
const botaoAnterior = document.getElementById("conteudo-anterior");
const botaoProximo = document.getElementById("proximo-conteudo");
const historico = [];
let posicaoHistorico = -1;
let intervaloConteudo;

function atualizarSetas() {
    botaoAnterior.disabled = posicaoHistorico <= 0;
}

function restaurarConteudo() {
    const anterior = historico[posicaoHistorico];
    conteudoCentral.replaceChildren(anterior.elemento);
    tipoConteudo.textContent = anterior.titulo;
    indiceVersiculo = anterior.indiceVersiculo;
    indiceNoticia = anterior.indiceNoticia;
    proximoConteudo = anterior.proximoConteudo;
    atualizarSetas();
}

function avancarConteudo() {
    if (posicaoHistorico < historico.length - 1) {
        posicaoHistorico++;
        restaurarConteudo();
        return;
    }
    alternarConteudo();
    if (conteudoCentral.firstElementChild) {
        historico.push({
            elemento: conteudoCentral.firstElementChild,
            titulo: tipoConteudo.textContent,
            indiceVersiculo, indiceNoticia, proximoConteudo
        });
        // Limita a memória em páginas que permanecem abertas por vários dias.
        if (historico.length > 100) historico.shift();
        posicaoHistorico = historico.length - 1;
    }
    atualizarSetas();
}

function reiniciarIntervalo() {
    clearInterval(intervaloConteudo);
    intervaloConteudo = setInterval(avancarConteudo, 60 * 1000);
}

botaoAnterior.addEventListener("click", () => {
    if (posicaoHistorico <= 0) return;
    posicaoHistorico--;
    restaurarConteudo();
    reiniciarIntervalo();
});
botaoProximo.addEventListener("click", () => {
    avancarConteudo();
    reiniciarIntervalo();
});

function mostrarVersiculo() {
    if (!versiculos.length) return false;
    const versiculo = versiculos[indiceVersiculo];
    const citacao = document.createElement("blockquote");
    citacao.className = "versiculo";
    const texto = document.createElement("p");
    texto.textContent = versiculo.texto;
    const rodape = document.createElement("footer");
    const referencia = document.createElement("strong");
    referencia.textContent = versiculo.referencia;
    const traducao = document.createElement("small");
    traducao.textContent = versiculo.traducao;
    rodape.append(referencia, traducao);
    citacao.append(texto, rodape);
    tipoConteudo.textContent = "Palavra de Deus";
    conteudoCentral.replaceChildren(citacao);
    indiceVersiculo = (indiceVersiculo + 1) % versiculos.length;
    return true;
}

function mostrarNoticia() {
    if (!noticias.length) return false;
    const noticia = noticias[indiceNoticia % noticias.length];
    const artigo = document.createElement("article");
    const link = document.createElement("a");
    link.className = "noticia-link";
    link.href = noticia.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    if (noticia.imagem) {
        const imagem = document.createElement("img");
        imagem.className = "noticia-imagem";
        imagem.alt = noticia.descricaoImagem || noticia.titulo;
        imagem.decoding = "async";
        imagem.addEventListener("error", () => {
            imagem.remove();
            link.classList.remove("noticia-com-imagem");
        }, { once: true });
        imagem.src = noticia.imagem;
        link.classList.add("noticia-com-imagem");
        link.append(imagem);
    }

    const informacoes = document.createElement("div");
    const data = document.createElement("time");
    data.dateTime = noticia.data.slice(0, 10);
    data.textContent = new Date(noticia.data).toLocaleDateString("pt-BR");
    const titulo = document.createElement("h3");
    titulo.textContent = noticia.titulo;
    const chamada = document.createElement("span");
    chamada.className = "ler-noticia";
    chamada.textContent = "Ler no site oficial ↗";
    informacoes.append(data, titulo, chamada);
    link.append(informacoes);
    artigo.append(link);
    tipoConteudo.textContent = "Novidades";
    conteudoCentral.replaceChildren(artigo);
    indiceNoticia = (indiceNoticia + 1) % noticias.length;
    return true;
}

function alternarConteudo() {
    if (proximoConteudo === "noticia" && mostrarNoticia()) {
        proximoConteudo = "versiculo";
        return;
    }
    if (mostrarVersiculo()) {
        proximoConteudo = "noticia";
        return;
    }
    if (mostrarNoticia()) {
        proximoConteudo = "versiculo";
        return;
    }
    tipoConteudo.textContent = "Tempo de Comunhão";
    conteudoCentral.textContent = "Não foi possível carregar os textos. Acesse o site oficial para acompanhar as novidades.";
}

function urlOficial(endereco) {
    try {
        const url = new URL(endereco);
        return url.origin === "https://www.igrejacristamaranata.org.br" ? url.href : null;
    } catch {
        return null;
    }
}

async function carregarNoticias() {
    if (botaoNoticias.disabled) return;
    botaoNoticias.disabled = true;
    statusNoticias.textContent = "Atualizando notícias…";
    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), 15000);
    try {
        const resposta = await fetch(
            "https://www.igrejacristamaranata.org.br/wp-json/wp/v2/posts?per_page=3&orderby=date&order=desc&_embed=wp:featuredmedia&_fields=date,link,title,_links,_embedded",
            { signal: controlador.signal, credentials: "omit" }
        );
        if (!resposta.ok) throw new Error("Notícias indisponíveis");
        const dados = await resposta.json();
        if (!Array.isArray(dados)) throw new Error("Resposta inválida");
        noticias = dados.slice(0, 3).flatMap(noticia => {
            const link = urlOficial(noticia.link);
            const titulo = new DOMParser().parseFromString(
                noticia.title?.rendered || "", "text/html"
            ).body.textContent.trim();
            if (!link || !titulo || typeof noticia.date !== "string"
                || Number.isNaN(new Date(noticia.date).getTime())) return [];
            const midia = noticia._embedded?.["wp:featuredmedia"]?.[0];
            return [{
                link, titulo, data: noticia.date,
                imagem: urlOficial(midia?.media_details?.sizes?.medium?.source_url || midia?.source_url),
                descricaoImagem: midia?.alt_text || ""
            }];
        });
        statusNoticias.textContent = noticias.length
            ? "Versículos e notícias alternam a cada minuto."
            : "Sem notícias disponíveis. Os versículos continuam a cada minuto.";
    } catch {
        statusNoticias.textContent = noticias.length
            ? "Não foi possível atualizar as notícias. Exibindo as últimas carregadas."
            : "Notícias indisponíveis. Os versículos continuam a cada minuto.";
    } finally {
        clearTimeout(limite);
        botaoNoticias.disabled = false;
    }
}

botaoNoticias.addEventListener("click", carregarNoticias);
avancarConteudo();
carregarNoticias();
reiniciarIntervalo();
setInterval(carregarNoticias, 15 * 60 * 1000);
