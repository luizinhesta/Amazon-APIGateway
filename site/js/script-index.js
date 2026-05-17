document.addEventListener('DOMContentLoaded', function () {
    iniciarPagina();
});

let todosFilmes = [];
let todasSeries = [];

let currentLetter = 'A';
let currentYear = '';
let currentSearch = '';

function getTitulo(item) {
    return item?.Title || item?.titulo || '';
}

function getAno(item) {
    return item?.Year || item?.ano || '';
}

function getPoster(item) {
    return item?.Poster || item?.poster || 'N/A';
}

function getTipo(item) {
    return item?.Type || item?.tipo || '';
}

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

function iniciarPagina() {
    montarFiltroAlfabeto();
    configurarBusca();
    configurarFiltroAno();
    carregarLancamentos();
}

function montarFiltroAlfabeto() {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const numeros = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    const itens = [...letras, ...numeros];

    const container = document.getElementById('alphabetFilter');
    if (!container) return;

    container.innerHTML = itens.map(letter => `
        <button class="alphabet-button" data-letter="${letter}">${letter}</button>
    `).join('');

    const botoes = container.querySelectorAll('.alphabet-button');

    botoes.forEach(btn => {
        btn.addEventListener('click', function () {
            currentLetter = this.dataset.letter;
            currentSearch = '';

            botoes.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            aplicarFiltros();
        });
    });

    const btnA = container.querySelector('[data-letter="A"]');
    if (btnA) btnA.classList.add('active');
}

function configurarBusca() {
    const input = document.getElementById('searchInput');
    const button = document.getElementById('searchButton');

    if (!input || !button) return;

    function executarBusca() {
        currentSearch = input.value.trim();
        currentLetter = '';
        aplicarFiltros();
    }

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') executarBusca();
    });

    button.addEventListener('click', executarBusca);
}

function configurarFiltroAno() {
    const select = document.getElementById('yearFilter');
    if (!select) return;

    select.addEventListener('change', function () {
        currentYear = this.value;
        aplicarFiltros();
    });
}

function mostrarCarregando() {
    const html = '<div class="media-empty">Carregando...</div>';

    const filmesGrid = document.getElementById('filmesGrid');
    const seriesGrid = document.getElementById('seriesGrid');

    if (filmesGrid) filmesGrid.innerHTML = html;
    if (seriesGrid) seriesGrid.innerHTML = html;
}

async function carregarLancamentos() {
    mostrarCarregando();

    try {
        const filmes = await banco.buscarFilmes({ tipo: 'movie' });
        const series = await banco.buscarFilmes({ tipo: 'series' });

        todosFilmes = filmes || [];
        todasSeries = series || [];

        await aplicarFiltros();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

async function aplicarFiltros() {
    let filmes = [...todosFilmes];
    let series = [...todasSeries];

    if (currentLetter) {
        filmes = filmes.filter(f => {
            const titulo = getTitulo(f).toLowerCase();
            return !isNaN(currentLetter)
                ? /^[0-9]/.test(titulo)
                : titulo.startsWith(currentLetter.toLowerCase());
        });

        series = series.filter(s => {
            const titulo = getTitulo(s).toLowerCase();
            return !isNaN(currentLetter)
                ? /^[0-9]/.test(titulo)
                : titulo.startsWith(currentLetter.toLowerCase());
        });
    }

    if (currentSearch) {
        filmes = filmes.filter(f =>
            getTitulo(f).toLowerCase().includes(currentSearch.toLowerCase())
        );

        series = series.filter(s =>
            getTitulo(s).toLowerCase().includes(currentSearch.toLowerCase())
        );
    }

    if (currentYear && currentYear !== '') {
        filmes = filmes.filter(f => getAno(f).includes(currentYear));
        series = series.filter(s => getAno(s).includes(currentYear));
    }

    filmes.sort((a, b) => getTitulo(a).localeCompare(getTitulo(b)));
    series.sort((a, b) => getTitulo(a).localeCompare(getTitulo(b)));

    filmes = filmes.slice(0, 6);
    series = series.slice(0, 6);

    filmes = await enriquecerResumos(filmes);
    series = await enriquecerResumos(series);

    renderMediaGrid('filmesGrid', filmes, 'Nenhum filme encontrado.');
    renderMediaGrid('seriesGrid', series, 'Nenhuma série encontrada.');
}

function renderMediaGrid(containerId, items, mensagem) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items.length) {
        container.innerHTML = `<div class="media-empty">${mensagem}</div>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const posterBruto = getPoster(item);
        const poster = posterBruto && posterBruto !== 'N/A'
            ? posterBruto
            : 'https://via.placeholder.com/250x370?text=Sem+Imagem';

        return `
        <div class="media-card">
            <div class="media-poster" style="background-image:url('${poster}')"></div>
            <div class="media-info">
                <strong>${getTitulo(item) || 'Sem título'}</strong>
                <span>${getAno(item) || ''} · ${getTipo(item) || ''}</span>
                <p>${getResumo(item) || 'Resumo não disponível.'}</p>
                <a href="filme.html?id=${getId(item)}" class="btn-detalhes">Ver detalhes</a>
            </div>
        </div>`;
    }).join('');
}
