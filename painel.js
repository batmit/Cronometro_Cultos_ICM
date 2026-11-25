const versiculos = window.versiculosBiblicos || [];
const conteudoCentral = document.getElementById("conteudo-central");
const tipoConteudo = document.getElementById("tipo-conteudo");
let carregandoNoticias = false;
let noticias = [];
let indiceVersiculo = 0;
let indiceNoticia = 0;
let proximoConteudo = "versiculo";
const botaoAnterior = document.getElementById("conteudo-anterior");
const botaoProximo = document.getElementById("proximo-conteudo");
const historico = [];
let posicaoHistorico = -1;
let intervaloConteudo;
let momentoDeOracao = false;

function atualizarMomentoDeOracao(ativo) {
    if (momentoDeOracao === ativo) return;
    momentoDeOracao = ativo;
    document.querySelector(".barra-titulo").hidden = ativo;
    document.querySelector(".navegacao-conteudo").hidden = ativo;
    botaoAnterior.hidden = ativo;
    botaoProximo.hidden = ativo;
    if (ativo) {
        clearInterval(intervaloConteudo);
        const mensagem = document.createElement("p");
        mensagem.className = "mensagem-oracao";
        mensagem.textContent = "Momento de oração e de silêncio";
        conteudoCentral.replaceChildren(mensagem);
    } else {
        if (posicaoHistorico >= 0) restaurarConteudo();
        else avancarConteudo();
        reiniciarIntervalo();
    }
}

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
    if (momentoDeOracao) return;
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
    if (momentoDeOracao) return;
    intervaloConteudo = setInterval(avancarConteudo, 15 * 1000);
}

botaoAnterior.addEventListener("click", () => {
    if (momentoDeOracao || posicaoHistorico <= 0) return;
    posicaoHistorico--;
    restaurarConteudo();
    reiniciarIntervalo();
});
botaoProximo.addEventListener("click", () => {
    avancarConteudo();
    reiniciarIntervalo();
});

document.addEventListener("keydown", evento => {
    if (momentoDeOracao || evento.defaultPrevented || evento.altKey
        || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
    if (evento.target instanceof Element && evento.target.closest(
        "input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']"
    )) return;
    const botao = evento.key === "ArrowLeft" ? botaoAnterior
        : evento.key === "ArrowRight" ? botaoProximo : null;
    if (!botao || botao.disabled) return;
    evento.preventDefault();
    botao.click();
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
    rodape.append(referencia);
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

async function buscarRecurso(url, imagem = false) {
    if (window.desktopICM) {
        const resultado = await window.desktopICM.buscar(url);
        return imagem ? resultado.imagem : resultado.json;
    }
    const resposta = await fetch(url, { signal: AbortSignal.timeout(15000), credentials: "omit", cache: "no-store" });
    if (!resposta.ok) throw new Error("Recurso indisponível");
    if (!imagem) return resposta.json();
    const blob = await resposta.blob();
    if (!/^image\/(png|jpeg|webp|gif)$/.test(blob.type) || blob.size > 6 * 1024 * 1024) throw new Error("Imagem inválida");
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = () => reject(leitor.error);
        leitor.readAsDataURL(blob);
    });
}

function validarNoticiasSalvas(lista) {
    return Array.isArray(lista) ? lista.slice(0, 3).filter(noticia =>
        noticia && urlOficial(noticia.link) && typeof noticia.titulo === "string" && noticia.titulo.trim()
        && typeof noticia.data === "string" && !Number.isNaN(new Date(noticia.data).getTime())
    ).map(noticia => ({ ...noticia,
        imagem: typeof noticia.imagem === "string" && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(noticia.imagem) ? noticia.imagem : null
    })) : [];
}

async function carregarNoticias() {
    if (carregandoNoticias) return;
    carregandoNoticias = true;
    try {
        const dados = await buscarRecurso(
            "https://www.igrejacristamaranata.org.br/wp-json/wp/v2/posts?per_page=3&orderby=date&order=desc&_embed=wp:featuredmedia&_fields=date,link,title,_links,_embedded"
        );
        if (!Array.isArray(dados)) throw new Error("Resposta inválida");
        const novas = dados.slice(0, 3).flatMap(noticia => {
            if (!noticia || typeof noticia !== "object") return [];
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
        if (!novas.length) throw new Error("Sem notícias válidas");
        await Promise.all(novas.map(async noticia => {
            const anterior = noticias.find(item => item.link === noticia.link);
            if (!noticia.imagem) return;
            try { noticia.imagem = await buscarRecurso(noticia.imagem, true); }
            catch { noticia.imagem = anterior?.imagem || null; }
        }));
        noticias = novas;
        try {
            await window.cacheNoticias.salvar({ versao: 1, atualizadoEm: new Date().toISOString(), noticias });
        } catch (erro) { console.warn("Não foi possível salvar as notícias para uso offline.", erro); }
    } catch {
        // Mantém as notícias anteriores; sem elas, o painel continua com os versículos.
    } finally {
        carregandoNoticias = false;
    }
}

async function iniciarNoticias() {
    try {
        const salvas = await window.cacheNoticias.ler();
        if (salvas?.versao === 1) noticias = validarNoticiasSalvas(salvas.noticias);
    } catch { /* Sem cache disponível, os versículos continuam funcionando. */ }
    window.addEventListener("online", carregarNoticias);
    carregarNoticias();
    setInterval(carregarNoticias, 15 * 60 * 1000);
}
avancarConteudo();
reiniciarIntervalo();
iniciarNoticias();
