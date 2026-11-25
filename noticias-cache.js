// IndexedDB armazena também as imagens, sem o pequeno limite do localStorage.
window.cacheNoticias = {
    async abrir() {
        return new Promise((resolve, reject) => {
            const pedido = indexedDB.open("cronometro-icm", 1);
            pedido.onupgradeneeded = () => pedido.result.createObjectStore("noticias");
            pedido.onsuccess = () => resolve(pedido.result);
            pedido.onerror = () => reject(pedido.error);
        });
    },
    async executar(modo, valor) {
        const banco = await this.abrir();
        try {
            return await new Promise((resolve, reject) => {
                const transacao = banco.transaction("noticias", modo);
                const tabela = transacao.objectStore("noticias");
                const pedido = modo === "readonly" ? tabela.get("atual") : tabela.put(valor, "atual");
                transacao.oncomplete = () => resolve(pedido.result);
                transacao.onerror = () => reject(transacao.error);
                transacao.onabort = () => reject(transacao.error);
            });
        } finally { banco.close(); }
    },
    ler() { return window.desktopICM ? window.desktopICM.lerNoticias() : this.executar("readonly"); },
    salvar(valor) { return window.desktopICM ? window.desktopICM.salvarNoticias(valor) : this.executar("readwrite", valor); }
};
