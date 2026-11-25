const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopICM', {
    lerNoticias: () => ipcRenderer.invoke('noticias:ler'),
    salvarNoticias: valor => ipcRenderer.invoke('noticias:salvar', valor),
    buscar: url => ipcRenderer.invoke('noticias:buscar', url)
});
