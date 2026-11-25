// Executado pelo binário Electron, não pelo node --test.
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const assert = require('node:assert/strict');
const offline = process.argv.includes('--offline');
const live = process.argv.includes('--live');
app.setPath('userData', path.resolve(live ? '.test-data/live' : '.test-data/desktop'));
if (!live) global.fetch = async url => {
    if (offline) throw Error('Offline simulado');
    const imagem = !url.includes('wp-json');
    const corpo = imagem ? Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=', 'base64')
        : Buffer.from(JSON.stringify([{ link: 'https://www.igrejacristamaranata.org.br/teste/', date: '2026-11-25T09:00:00',
            title: { rendered: 'Notícia de teste offline' }, _embedded: { 'wp:featuredmedia': [{ source_url: 'https://www.igrejacristamaranata.org.br/teste.png' }] } }]));
    return { ok: true, headers: { get: () => imagem ? 'image/png' : 'application/json' }, arrayBuffer: async () => corpo };
};
const erros = [];
const limite = setTimeout(() => { console.error('Timeout no teste desktop'); app.exit(1); }, 40000);
app.on('browser-window-created', (_evento, janela) => {
    janela.hide();
    janela.webContents.on('console-message', (_evento, nivel, mensagem) => { if (nivel === 3) erros.push(mensagem); });
    janela.webContents.on('did-finish-load', async () => {
        try {
            for (let tentativa = 0; tentativa < 330; tentativa++) {
                const pronto = await janela.webContents.executeJavaScript('noticias.length > 0 && !carregandoNoticias');
                if (pronto) break;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const resultado = await janela.webContents.executeJavaScript(`(async () => {
                const salvo = await window.cacheNoticias.ler();
                return { titulo: noticias[0]?.titulo, imagem: noticias[0]?.imagem,
                    persistido: salvo?.noticias[0]?.titulo, node: typeof require, logo: document.querySelector('.logo-igreja').complete };
            })()`);
            if (live) assert.ok(resultado.titulo);
            else assert.equal(resultado.titulo, 'Notícia de teste offline');
            assert.ok(/^data:image\/(png|jpeg|webp|gif);base64,/.test(resultado.imagem), 'Imagem deve estar salva no cache');
            assert.equal(resultado.persistido, resultado.titulo);
            assert.equal(resultado.node, 'undefined');
            assert.equal(resultado.logo, true);
            assert.deepEqual(erros, []);
            if (live) {
                await janela.webContents.executeJavaScript('mostrarNoticia()');
                await require('node:fs/promises').writeFile(path.resolve('.test-data/desktop.png'), (await janela.webContents.capturePage()).toPNG());
            }
            console.log(live ? 'PASS: notícias e imagens reais consultadas e salvas no Electron' : offline ? 'PASS: reabertura Electron offline com imagem e texto persistidos' : 'PASS: Electron online, IPC, persistência e isolamento');
            clearTimeout(limite);
            app.exit(0);
        } catch (erro) { console.error(erro); app.exit(1); }
    });
});
require('../desktop/main.cjs');
