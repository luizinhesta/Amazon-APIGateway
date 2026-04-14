// Carregar dados do usuário ao abrir a página
document.addEventListener('DOMContentLoaded', async function () {
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

    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            banco.logout();
            window.location.href = 'index.html';
        });
    }

    let dadosUsuarioApi = null;

    try {
        if (typeof banco.buscarUsuarioPorLogin === 'function' && usuarioLogado.login) {
            dadosUsuarioApi = await banco.buscarUsuarioPorLogin(usuarioLogado.login);
        }
    } catch (error) {
        console.error('Erro ao buscar dados completos:', error);
    }

    const dadosUsuario = normalizarDadosUsuario(dadosUsuarioApi, usuarioLogado);
    preencherFormulario(dadosUsuario);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('formEditar').style.display = 'block';

    if (!dadosUsuarioApi) {
        mostraMensagem('Dados carregados da sessão. Complete os campos e salve.', 'erro');
    }
});

function normalizarDadosUsuario(origem, fallback) {
    let u = origem;

    if (Array.isArray(u)) {
        u = u[0] || {};
    }

    if (u && typeof u === 'object' && u.usuario) {
        u = u.usuario;
    }

    u = (u && typeof u === 'object') ? u : {};
    const f = (fallback && typeof fallback === 'object') ? fallback : {};

    return {
        nome: u.nome || f.nome || '',
        sobrenome: u.sobrenome || f.sobrenome || '',
        login: u.login || f.login || '',
        email: u.email || f.email || '',
        cep: u.cep || f.cep || '',
        logradouro: u.logradouro || f.logradouro || '',
        bairro: u.bairro || f.bairro || '',
        cidade: u.cidade || f.cidade || '',
        estado: u.estado || f.estado || ''
    };
}

function preencherFormulario(dadosUsuario) {
    document.getElementById('nome').value = dadosUsuario.nome;
    document.getElementById('sobrenome').value = dadosUsuario.sobrenome;
    document.getElementById('login').value = dadosUsuario.login;
    document.getElementById('email').value = dadosUsuario.email;
    document.getElementById('cep').value = dadosUsuario.cep;
    document.getElementById('logradouro').value = dadosUsuario.logradouro;
    document.getElementById('bairro').value = dadosUsuario.bairro;
    document.getElementById('cidade').value = dadosUsuario.cidade;
    document.getElementById('estado').value = dadosUsuario.estado;
}

// Função para formatar CEP
function formatarCEP(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 5) {
        input.value = value;
    } else {
        input.value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
}

// Função para buscar CEP automaticamente
function buscarCEP() {
    let cep = document.getElementById('cep').value.replace(/\D/g, '');

    if (cep.length === 8) {
        banco.buscarCEP(cep)
            .then(data => {
                document.getElementById('logradouro').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.cidade || '';
                document.getElementById('estado').value = data.estado || '';
            })
            .catch(error => {
                console.error('Erro:', error);
                limparEndereco();
                mostraMensagem('CEP não encontrado', 'erro');
            });
    } else if (cep.length < 8) {
        limparEndereco();
    }
}

// Limpar campos de endereço
function limparEndereco() {
    document.getElementById('logradouro').value = '';
    document.getElementById('bairro').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('estado').value = '';
}

// Enviar formulário de edição
document.getElementById('formEditar').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();
    const login = document.getElementById('login').value.trim();
    const email = document.getElementById('email').value.trim();
    const cep = document.getElementById('cep').value.trim();
    const logradouro = document.getElementById('logradouro').value.trim();
    const bairro = document.getElementById('bairro').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const estado = document.getElementById('estado').value.trim();
    const senha_atual = document.getElementById('senha_atual').value;
    const nova_senha = document.getElementById('nova_senha').value;
    const confirmar_senha = document.getElementById('confirmar_senha').value;

    if (!nome || !sobrenome || !email || !senha_atual) {
        mostraMensagem('Preencha todos os campos obrigatórios', 'erro');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostraMensagem('Email inválido', 'erro');
        return;
    }

    if (nova_senha) {
        if (nova_senha.length < 6) {
            mostraMensagem('Nova senha deve ter pelo menos 6 caracteres', 'erro');
            return;
        }
        if (nova_senha !== confirmar_senha) {
            mostraMensagem('Nova senha e confirmação não coincidem', 'erro');
            return;
        }
    }

    try {
        const dadosEdicao = {
            login: login,
            senha_atual: senha_atual,
            nome: nome,
            sobrenome: sobrenome,
            email: email,
            cep: cep,
            logradouro: logradouro,
            bairro: bairro,
            cidade: cidade,
            estado: estado
        };

        if (nova_senha) {
            dadosEdicao.nova_senha = nova_senha;
        }

        await banco.editarUsuario(dadosEdicao);
        mostraMensagem('Dados atualizados com sucesso!', 'sucesso');

        document.getElementById('senha_atual').value = '';
        document.getElementById('nova_senha').value = '';
        document.getElementById('confirmar_senha').value = '';

        const user = banco.getUsuarioLogado();
        if (user) {
            user.nome = nome;
            user.sobrenome = sobrenome;
            user.email = email;
            user.cep = cep;
            user.logradouro = logradouro;
            user.bairro = bairro;
            user.cidade = cidade;
            user.estado = estado;
            banco.setUsuarioLogado(user);
        }

    } catch (error) {
        console.error('Erro:', error);
        mostraMensagem(error.message || 'Erro ao atualizar dados', 'erro');
    }
});

// Função para mostrar mensagem
function mostraMensagem(texto, tipo = 'erro') {
    const msg = document.getElementById('mensagem');
    if (!msg) return;

    msg.textContent = texto;
    msg.className = 'mensagem ' + tipo;
    msg.style.display = 'block';

    if (tipo === 'sucesso') {
        setTimeout(() => {
            window.location.href = 'acesso.html';
        }, 1200);
    }
}
