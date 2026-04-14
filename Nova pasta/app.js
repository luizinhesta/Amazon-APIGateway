(function () {
  const config = window.APP_CONFIG || {};
  const apiBase = (config.API_BASE_URL || '').replace(/\/$/, '');
  const cepApi = (config.CEP_API_URL || '').replace(/\/$/, '');

  function qs(selector) {
    return document.querySelector(selector);
  }

  function setFlash(message, type) {
    if (!message) return;
    sessionStorage.setItem('flash_message', message);
    sessionStorage.setItem('flash_type', type || 'info');
  }

  function showFlash() {
    const el = qs('#flash');
    if (!el) return;
    const message = sessionStorage.getItem('flash_message');
    const type = sessionStorage.getItem('flash_type');
    if (!message) return;
    el.textContent = message;
    el.style.display = 'block';
    el.classList.remove('info', 'warning', 'danger', 'success');
    if (type) el.classList.add(type);
    sessionStorage.removeItem('flash_message');
    sessionStorage.removeItem('flash_type');
  }

  function setUser(user) {
    localStorage.setItem('app_user', JSON.stringify(user));
  }

  function getUser() {
    const raw = localStorage.getItem('app_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearUser() {
    localStorage.removeItem('app_user');
  }

  async function apiRequest(path, options) {
    if (!apiBase) throw new Error('API_BASE_URL nao configurado');
    const url = apiBase + path;
    const opts = options || {};
    const headers = Object.assign({
      'Content-Type': 'application/json'
    }, opts.headers || {});

    const resp = await fetch(url, Object.assign({}, opts, { headers }));
    const contentType = resp.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await resp.json() : null;
    if (!resp.ok) {
      const message = payload && payload.message ? payload.message : 'Erro na API';
      throw new Error(message);
    }
    return payload;
  }

  async function cepLookup(cep) {
    if (!cepApi) throw new Error('CEP_API_URL nao configurado');
    const url = cepApi + '?cep=' + encodeURIComponent(cep);
    const resp = await fetch(url, { method: 'GET' });
    const payload = await resp.json();
    if (!resp.ok) {
      throw new Error(payload && payload.message ? payload.message : 'CEP nao encontrado');
    }
    return payload;
  }

  function bindLogin() {
    const form = qs('#login-form');
    if (!form) return;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const login = qs('#login').value.trim();
      const senha = qs('#senha').value;
      if (!login || !senha) {
        setFlash('Preencha login e senha.', 'warning');
        showFlash();
        return;
      }
      try {
        const data = await apiRequest('/api.php?action=login', {
          method: 'POST',
          body: JSON.stringify({ login: login, senha: senha })
        });
        setUser(data.user);
        window.location.href = 'bemvindo.html';
      } catch (err) {
        setFlash(err.message, 'danger');
        showFlash();
      }
    });
  }

  function bindCadastro() {
    const form = qs('#cadastro-form');
    if (!form) return;

    const cepInput = qs('#cep');
    const logradouroInput = qs('#logradouro');
    const bairroInput = qs('#bairro');
    const cidadeInput = qs('#cidade');
    const ufInput = qs('#uf');

    if (cepInput) {
      cepInput.addEventListener('blur', async function () {
        const cep = cepInput.value.trim();
        if (!cep) return;
        try {
          const data = await cepLookup(cep);
          if (data && !data.erro) {
            if (logradouroInput) logradouroInput.value = data.logradouro || '';
            if (bairroInput) bairroInput.value = data.bairro || '';
            if (cidadeInput) cidadeInput.value = data.localidade || '';
            if (ufInput) ufInput.value = data.uf || '';
          }
        } catch (err) {
          setFlash(err.message, 'warning');
          showFlash();
        }
      });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        nome: qs('#nome').value.trim(),
        login: qs('#login').value.trim(),
        senha: qs('#senha').value,
        cep: qs('#cep').value.trim(),
        logradouro: qs('#logradouro').value.trim(),
        bairro: qs('#bairro').value.trim(),
        cidade: qs('#cidade').value.trim(),
        uf: qs('#uf').value.trim(),
        numero: qs('#numero').value.trim(),
        complemento: qs('#complemento').value.trim()
      };

      if (!payload.nome || !payload.login || !payload.senha) {
        setFlash('Preencha nome, login e senha.', 'warning');
        showFlash();
        return;
      }

      try {
        const data = await apiRequest('/api.php?action=create', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setUser(data.user);
        window.location.href = 'bemvindo.html';
      } catch (err) {
        setFlash(err.message, 'danger');
        showFlash();
      }
    });
  }

  function bindEditar() {
    const form = qs('#editar-form');
    if (!form) return;
    const user = getUser();
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    const nameEl = qs('#user-name');
    if (nameEl) nameEl.textContent = user.nome || 'Usuario';

    async function loadUser() {
      try {
        const data = await apiRequest('/api.php?action=get&id=' + encodeURIComponent(user.id), {
          method: 'GET'
        });
        const u = data.user;
        if (!u) return;
        qs('#nome').value = u.nome || '';
        qs('#login').value = u.login || '';
        qs('#cep').value = u.cep || '';
        qs('#logradouro').value = u.logradouro || '';
        qs('#bairro').value = u.bairro || '';
        qs('#cidade').value = u.cidade || '';
        qs('#uf').value = u.uf || '';
        qs('#numero').value = u.numero || '';
        qs('#complemento').value = u.complemento || '';
      } catch (err) {
        setFlash(err.message, 'danger');
        showFlash();
      }
    }

    loadUser();

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        nome: qs('#nome').value.trim(),
        login: qs('#login').value.trim(),
        senha: qs('#senha').value,
        cep: qs('#cep').value.trim(),
        logradouro: qs('#logradouro').value.trim(),
        bairro: qs('#bairro').value.trim(),
        cidade: qs('#cidade').value.trim(),
        uf: qs('#uf').value.trim(),
        numero: qs('#numero').value.trim(),
        complemento: qs('#complemento').value.trim()
      };

      if (!payload.nome || !payload.login) {
        setFlash('Preencha nome e login.', 'warning');
        showFlash();
        return;
      }

      try {
        const data = await apiRequest('/api.php?action=update&id=' + encodeURIComponent(user.id), {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setUser(data.user);
        setFlash('Usuario atualizado com sucesso.', 'success');
        showFlash();
      } catch (err) {
        setFlash(err.message, 'danger');
        showFlash();
      }
    });
  }

  function bindBemVindo() {
    const user = getUser();
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    const nameEl = qs('#user-name');
    if (nameEl) nameEl.textContent = user.nome || 'Usuario';
    const editLink = qs('#edit-link');
    if (editLink) editLink.setAttribute('href', 'editar-usuario.html');
    const logoutLink = qs('#logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        clearUser();
        window.location.href = 'index.html';
      });
    }
  }

  function bindLogout() {
    const logout = qs('[data-action="logout"]');
    if (!logout) return;
    logout.addEventListener('click', function (e) {
      e.preventDefault();
      clearUser();
      window.location.href = 'index.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    showFlash();
    bindLogin();
    bindCadastro();
    bindEditar();
    bindBemVindo();
    bindLogout();
  });
})();
