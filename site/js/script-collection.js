let currentLetter = 'A';
let currentYear = '';
let currentSearch = '';

let todosItens = [];

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

function montarFiltroAlfabeto() {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const numeros = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    const itens = [...letras, ...numeros];

    const container = document.getElementById('alphabetFilter');
    if (!container) return;

    container.innerHTML = itens.map(item => `
        <button class="alphabet-button" data-letter="${item}">${item}</button>
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

async function carregarColecao() {
    const tipo = document.body.dataset.page || 'movie';

    try {
        const items = await banco.buscarFilmes({ tipo });
        todosItens = items || [];
        await aplicarFiltros();
    } catch (e) {
        console.error(e);
    }
}

async function aplicarFiltros() {
    let lista = [...todosItens];

    if (currentLetter) {
        lista = lista.filter(item => {
            const titulo = (item.Title || '').toLowerCase();

            if (!isNaN(currentLetter)) {
                return /^[0-9]/.test(titulo);
            }

            return titulo.startsWith(currentLetter.toLowerCase());
        });
    }

    if (currentSearch) {
        lista = lista.filter(item =>
            (item.Title || '').toLowerCase().includes(currentSearch.toLowerCase())
        );
    }

    if (currentYear && currentYear !== '') {
        lista = lista.filter(item =>
            item.Year && item.Year.includes(currentYear)
        );
    }

    lista.sort((a, b) => (a.Title || '').localeCompare(b.Title || ''));
    lista = lista.slice(0, 12);
    lista = await enriquecerResumos(lista);

    renderMediaGrid('collectionGrid', lista);
}

function renderMediaGrid(id, items) {
    const container = document.getElementById(id);
    if (!container) return;

    if (!items.length) {
        container.innerHTML = 'Nenhum resultado';
        return;
    }

    container.innerHTML = items.map(item => {
        const poster = item.Poster !== 'N/A'
            ? item.Poster
            : 'https://via.placeholder.com/250x370';

        return `
        <div class="media-card">
            <div class="media-poster" style="background-image:url('${poster}')"></div>
            <div class="media-info">
                <strong>${item.Title}</strong>
                <span>${item.Year}</span>
                <p>${getResumo(item) || 'Resumo não disponível.'}</p>
                <a href="filme.html?id=${getId(item)}" class="btn-detalhes">Ver</a>
            </div>
        </div>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    montarFiltroAlfabeto();
    configurarBusca();
    configurarFiltroAno();
    carregarColecao();
});

