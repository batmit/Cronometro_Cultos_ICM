const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const fonte = fs.readFileSync('painel.js', 'utf8');
const link = 'https://www.igrejacristamaranata.org.br/noticia/';
const antiga = { link, titulo: 'Salva', data: '2026-11-20T10:00:00', imagem: 'data:image/png;base64,YQ==' };
async function ambiente(salvas, buscar) {
    const eventos = {};
    const gravacoes = [];
    const elemento = { addEventListener() {}, replaceChildren() {}, classList: { remove() {} } };
    const contexto = vm.createContext({
        URL, AbortSignal, console, Element: class {},
        setInterval() {}, clearInterval() {},
        document: { getElementById: () => ({ ...elemento }), addEventListener() {} },
        DOMParser: class { parseFromString(texto) { return { body: { textContent: texto } }; } },
        window: {
            addEventListener: (nome, funcao) => { eventos[nome] = funcao; },
            cacheNoticias: { ler: async () => salvas, salvar: async valor => gravacoes.push(valor) },
            desktopICM: { buscar }
        }
    });
    vm.runInContext(fonte, contexto);
    await new Promise(resolve => setImmediate(resolve));
    return { contexto, eventos, gravacoes, noticias: () => JSON.parse(vm.runInContext('JSON.stringify(noticias)', contexto)) };
}
test('reabre offline com textos e imagens salvos; falha não apaga cache', async () => {
    const estado = await ambiente({ versao: 1, noticias: [antiga] }, async () => { throw Error('offline'); });
    assert.deepEqual(estado.noticias(), [antiga]);
    assert.equal(estado.gravacoes.length, 0);
});
test('reconexão atualiza textos e armazena a imagem', async () => {
    let online = false;
    const estado = await ambiente({ versao: 1, noticias: [antiga] }, async url => {
        if (!online) throw Error('offline');
        return url.includes('wp-json') ? { json: [{ link, date: antiga.data, title: { rendered: 'Nova' },
            _embedded: { 'wp:featuredmedia': [{ source_url: link + 'foto.png' }] } }] } : { imagem: 'data:image/png;base64,Yg==' };
    });
    online = true;
    await estado.eventos.online();
    assert.equal(estado.noticias()[0].titulo, 'Nova');
    assert.equal(estado.noticias()[0].imagem, 'data:image/png;base64,Yg==');
    assert.equal(estado.gravacoes.length, 1);
});
test('resposta vazia ou inválida preserva a última lista', async () => {
    for (const json of [[], {}, [null], [{ title: { rendered: 'Inválida' } }]]) {
        const estado = await ambiente({ versao: 1, noticias: [antiga] }, async () => ({ json }));
        assert.deepEqual(estado.noticias(), [antiga]);
        assert.equal(estado.gravacoes.length, 0);
    }
});
test('falha na imagem preserva imagem anterior da mesma notícia', async () => {
    const estado = await ambiente({ versao: 1, noticias: [antiga] }, async url => {
        if (!url.includes('wp-json')) throw Error('imagem indisponível');
        return { json: [{ link, date: antiga.data, title: { rendered: 'Atualizada' },
            _embedded: { 'wp:featuredmedia': [{ source_url: link + 'foto.png' }] } }] };
    });
    assert.equal(estado.noticias()[0].imagem, antiga.imagem);
    assert.equal(estado.gravacoes.length, 1);
});
