const { app, BrowserWindow, ipcMain, shell, Menu, powerSaveBlocker } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const origem = 'https://www.igrejacristamaranata.org.br';
const pagina = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
let janela;
function validarRemoto(endereco) {
    const url = new URL(endereco);
    if (url.origin !== origem || url.username || url.password) throw new Error('Endereço não permitido');
    return url.href;
}
function validarOrigem(evento) {
    if (evento.senderFrame !== janela?.webContents.mainFrame || evento.senderFrame.url !== pagina) {
        throw new Error('Origem não permitida');
    }
}
app.setName('Cronômetro Cultos ICM');
if (!app.requestSingleInstanceLock()) app.quit();
else {
    app.on('second-instance', () => { if (janela) { if (janela.isMinimized()) janela.restore(); janela.focus(); } });
    app.whenReady().then(() => {
        const arquivo = path.join(app.getPath('userData'), 'noticias.json');
        ipcMain.handle('noticias:ler', async evento => {
            validarOrigem(evento);
            try { return JSON.parse(await fs.readFile(arquivo, 'utf8')); } catch { return null; }
        });
        ipcMain.handle('noticias:salvar', async (evento, valor) => {
            validarOrigem(evento);
            const texto = JSON.stringify(valor);
            if (!Array.isArray(valor?.noticias) || !valor.noticias.length || texto.length > 25 * 1024 * 1024) throw new Error('Cache inválido');
            await fs.writeFile(arquivo + '.tmp', texto, 'utf8');
            await fs.rename(arquivo + '.tmp', arquivo);
        });
        ipcMain.handle('noticias:buscar', async (evento, endereco) => {
            validarOrigem(evento);
            const resposta = await fetch(validarRemoto(endereco), { signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' });
            if (!resposta.ok) throw new Error('Recurso indisponível');
            const tipo = resposta.headers.get('content-type') || '';
            const buffer = Buffer.from(await resposta.arrayBuffer());
            if (buffer.length > 6 * 1024 * 1024) throw new Error('Recurso muito grande');
            if (tipo.includes('application/json')) return { json: JSON.parse(buffer.toString('utf8')) };
            if (!/^image\/(png|jpeg|webp|gif)(;|$)/i.test(tipo)) throw new Error('Imagem inválida');
            return { imagem: `data:${tipo.split(';')[0]};base64,${buffer.toString('base64')}` };
        });
        janela = new BrowserWindow({ width: 1280, height: 900, minWidth: 640, minHeight: 480,
            backgroundColor: '#f7f8fa', title: app.getName(),
            webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true }
        });
        janela.webContents.setWindowOpenHandler(({ url }) => {
            try { shell.openExternal(validarRemoto(url)).catch(() => {}); } catch {}
            return { action: 'deny' };
        });
        janela.webContents.on('will-navigate', (evento, url) => { if (url !== pagina) evento.preventDefault(); });
        janela.webContents.session.setPermissionRequestHandler((_wc, _permissao, responder) => responder(false));
        Menu.setApplicationMenu(Menu.buildFromTemplate([
            { label: 'Aplicativo', submenu: [{ label: 'Sair', role: 'quit' }] },
            { label: 'Exibir', submenu: [{ label: 'Tela cheia', role: 'togglefullscreen', accelerator: 'F11' }, { role: 'resetZoom', label: 'Tamanho original' }, { role: 'zoomIn', label: 'Ampliar' }, { role: 'zoomOut', label: 'Reduzir' }] }
        ]));
        const bloqueio = powerSaveBlocker.start('prevent-display-sleep');
        janela.on('closed', () => { if (powerSaveBlocker.isStarted(bloqueio)) powerSaveBlocker.stop(bloqueio); janela = null; });
        janela.loadURL(pagina);
    });
    app.on('window-all-closed', () => app.quit());
}
