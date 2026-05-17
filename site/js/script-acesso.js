document.addEventListener('DOMContentLoaded', function () {
    const usuarioLogado = banco.getUsuarioLogado();

    if (!usuarioLogado) {
        window.location.href = 'index.html';
        return;
    }

    const nomeCompleto = `${usuarioLogado.nome || ''} ${usuarioLogado.sobrenome || ''}`.trim();
    const userEl = document.getElementById('usuarioLogado');
    if (userEl) {
        userEl.textContent = `Olá, ${nomeCompleto || 'Usuário'}`;
    }

    const tabFilmes = document.getElementById('tabFilmes');
    const tabSeries = document.getElementById('tabSeries');

    if (tabFilmes) tabFilmes.addEventListener('click', () => mostrarAba('filmes'));
    if (tabSeries) tabSeries.addEventListener('click', () => mostrarAba('series'));

    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', function () {
            banco.logout();
            window.location.href = 'index.html';
        });
    }

    carregarCatalogo();

    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'series') {
        mostrarAba('series');
    } else {
        mostrarAba('filmes');
    }
});

function getId(item) {
    return item?.imdbID || item?.id || '';
}

function getResumo(item) {
    return item?.Plot || item?.plot || item?.resumo || item?.sinopse || item?.overview || item?.Description || '';
}

async function enriquecerResumos(items) {
    return Promise.all((items || []).map(async item => {
        if (getResumo(item)) return item;

        const id = getId(item);
        if (!id) return item;

        try {
            let detalhe = await banco.buscarFilmeDetalhes(id);
            if (detalhe && typeof detalhe.body !== 'undefined') {
                detalhe = typeof detalhe.body === 'string' ? JSON.parse(detalhe.body) : detalhe.body;
            }

            const resumo = getResumo(detalhe);
            return resumo ? { ...item, Plot: resumo } : item;
        } catch {
            return item;
        }
    }));
}

async function carregarCatalogo() {
    const usuarioLogado = banco.getUsuarioLogado();
    if (!usuarioLogado) return;

    try {
        const favoritos = await banco.listarFavoritos(usuarioLogado.id_usuario);

        let filmes = (favoritos || []).filter(f => {
            const tipo = (f.Type || f.tipo || '').toLowerCase();
            return tipo === 'movie' || tipo === 'filme' || tipo === 'filmes';
        });

        let series = (favoritos || []).filter(f => {
            const tipo = (f.Type || f.tipo || '').toLowerCase();
            return tipo === 'series' || tipo === 'serie' || tipo === 'série';
        });

        filmes = await enriquecerResumos(filmes);
        series = await enriquecerResumos(series);

        renderCatalogo('filmesCatalogo', filmes, 'Nenhum filme nos favoritos.');
        renderCatalogo('seriesCatalogo', series, 'Nenhuma série nos favoritos.');

    } catch (error) {
        console.error('Erro ao carregar catálogo:', error);
        mostrarMensagem('Erro ao carregar catálogo.');
    }
}

function renderCatalogo(containerId, items, mensagemVazia) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<div class="catalogo-empty">${mensagemVazia}</div>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const poster = item.Poster || item.poster || 'https://via.placeholder.com/250x370?text=Sem+Imagem';
        const titulo = item.Title || item.titulo || 'Sem título';
        const ano = item.Year || item.ano || '';
        const imdbID = getId(item);
        const resumo = getResumo(item) || 'Resumo não disponível.';

        return `
            <div class="catalogo-card">
                <div class="catalogo-poster" style="background-image:url('${poster}')"></div>
                <div class="catalogo-info">
                    <strong>${titulo}</strong>
                    <span>${ano}</span>
                    <p>${resumo}</p>
                    <button class="btn-remover" data-imdbid="${imdbID}">Remover</button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.btn-remover').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const imdbID = e.target.dataset.imdbid;
            await removerFavorito(imdbID);
        });
    });
}

async function removerFavorito(imdbID) {
    const usuarioLogado = banco.getUsuarioLogado();
    if (!usuarioLogado) return;

    try {
        await banco.removerFavorito(usuarioLogado.id_usuario, imdbID);
        mostrarMensagem('Removido do catálogo!', 'sucesso');
        carregarCatalogo();
    } catch (error) {
        console.error('Erro ao remover favorito:', error);
        mostrarMensagem('Erro ao remover do catálogo.');
    }
}

function mostrarAba(tipo) {
    const filmesCatalogo = document.getElementById('filmesCatalogo');
    const seriesCatalogo = document.getElementById('seriesCatalogo');
    const tabFilmes = document.getElementById('tabFilmes');
    const tabSeries = document.getElementById('tabSeries');

    if (!filmesCatalogo || !seriesCatalogo || !tabFilmes || !tabSeries) return;

    if (tipo === 'series') {
        filmesCatalogo.style.display = 'none';
        seriesCatalogo.style.display = 'grid';
        tabFilmes.classList.remove('active');
        tabSeries.classList.add('active');
    } else {
        filmesCatalogo.style.display = 'grid';
        seriesCatalogo.style.display = 'none';
        tabFilmes.classList.add('active');
        tabSeries.classList.remove('active');
    }
}

function mostrarMensagem(texto, tipo = 'erro') {
    const msg = document.getElementById('mensagem');
    if (!msg) return;

    msg.textContent = texto;
    msg.className = 'mensagem ' + tipo;
    msg.style.display = 'block';

    setTimeout(() => {
        msg.style.display = 'none';
    }, 3000);
}
