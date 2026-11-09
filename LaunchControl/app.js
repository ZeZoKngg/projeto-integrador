

/**

  A aplicação utiliza JavaScript para renderizar as telas e consumir a API
 REST do backend Spring Boot. O HTML funciona como ponto de entrada,
 enquanto o CSS concentra as regras de apresentação visual.
 
 Decisão de arquitetura: manter a comunicação com o servidor centralizada
 e reutilizar funções de renderização reduz a repetição de código.
 */
"use strict";

/**
 * Define o endereço da API conforme o ambiente de execução.
 * Em execução local, as requisições são direcionadas à porta 8080;
 * quando o frontend é servido pelo próprio backend, usa a mesma origem.
 * Atenção: a configuração deve ser revisada antes de publicar em produção.
 */
const API_ORIGIN =
  location.port === "8080" ||
  location.protocol === "file:" ||
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "http://localhost:8080"
    : "";

// O elemento #app recebe as telas renderizadas dinamicamente pelo JavaScript.
const app = document.querySelector("#app");

/**
 * Estado temporário da interface: credenciais da sessão, usuário autenticado,
 * módulo selecionado e mensagens de retorno das operações.
 * As credenciais permanecem em memória e são descartadas ao sair da aplicação.
 */
let auth = null;
let me = null;
let tab = "dashboard";
let msg = "";

/**
 * Cache dos dados exibidos nas telas. As coleções são preenchidas pela API;
 * este objeto não substitui a persistência realizada no banco de dados.
 */
let data = {
  solicitacoes: [],
  veiculos: [],
  notificacoes: [],
  pecas: [],
  usuarios: [],
  oficinas: [],
  cobrancas: []
};

/**
 * Escapa caracteres especiais antes de inserir valores em templates HTML.
 * Essa proteção é importante para reduzir riscos de injeção de HTML.
 */
const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

// Padroniza valores monetários no formato brasileiro (BRL).
const money = value =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

// Traduz os códigos de status retornados pelo backend para a interface.
const statuses = {
  AGUARDANDO: "Aguardando",
  EM_ANALISE: "Em análise",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  EM_EXECUCAO: "Em execução",
  CONCLUIDO: "Concluído"
};

/* ==========================================
   COMUNICAÇÃO COM O BACKEND
   ========================================== */

/**
 * Centraliza as requisições HTTP ao backend Spring Boot.
 * Adiciona autenticação Basic quando existe uma sessão e converte corpos
 * JSON e respostas de erro para um formato reutilizável pela interface.
 *
 * Observação: HTTP Basic deve ser utilizado com HTTPS fora do ambiente local;
 * Base64 não representa criptografia de senha.
 */
async function api(path, method = "GET", body) {
  const response = await fetch(API_ORIGIN + "/api" + path, {
    method,
    headers: {
      ...(auth ? { Authorization: "Basic " + auth } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let error;

    try {
      error = await response.json();
    } catch {}

    throw new Error(
      error?.message ||
      error?.detail ||
      "Erro HTTP " + response.status
    );
  }

  if (response.status === 204) return null;

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

// Prepara uma mensagem de sucesso ou erro para o próximo render da tela.
function flash(text, error = false) {
  msg = `
    <div class="notice ${error ? "error" : "ok"}">
      ${esc(text)}
    </div>
  `;
}

/* ==========================================
   LOGIN E CADASTRO PREMIUM
   ========================================== */

/**
 * Renderiza login e cadastro na mesma estrutura visual.
 * A opção register altera campos e textos sem duplicar duas páginas inteiras.
 * Os eventos do formulário são associados após a inserção do HTML.
 */
function loginScreen(register = false) {
  const heading = register
    ? "Crie sua conta"
    : "Bem-vindo de volta";

  const subtitle = register
    ? "Comece a gerenciar seus serviços automotivos em um só lugar."
    : "Acesse sua conta e acompanhe seus atendimentos.";

  app.innerHTML = `
    <main class="login lc-auth-page">
      <section
        class="auth lc-auth-card"
        aria-labelledby="auth-title"
      >
        <div class="lc-brand">
          <div class="logo">
            LAUNCH<span>CONTROL</span>
          </div>

          <span class="lc-brand-caption">
            AUTOMOTIVE PLATFORM
          </span>
        </div>

        <div class="lc-auth-heading">
          <span class="lc-eyebrow">
            ${register ? "COMECE AGORA" : "ÁREA SEGURA"}
          </span>

          <h1 id="auth-title">${heading}</h1>
          <p>${subtitle}</p>
        </div>

        <div
          id="authmsg"
          role="status"
          aria-live="polite"
        ></div>

        <form id="authform" class="lc-auth-form">

          ${
            register
              ? `
                <label class="field">
                  Nome completo
                  <input
                    name="nome"
                    autocomplete="name"
                    required
                    maxlength="100"
                    placeholder="Seu nome completo"
                  >
                </label>
              `
              : ""
          }

          <label class="field">
            E-mail
            <input
              type="email"
              name="email"
              required
              autocomplete="username"
              placeholder="voce@exemplo.com"
            >
          </label>

          <label class="field">
            Senha

            <span class="lc-password-field">
              <input
                id="auth-password"
                type="password"
                name="senha"
                minlength="6"
                required
                autocomplete="${
                  register ? "new-password" : "current-password"
                }"
                placeholder="${
                  register
                    ? "Mínimo de 6 caracteres"
                    : "Digite sua senha"
                }"
              >

              <button
                type="button"
                id="show-password"
                class="lc-eye-button"
                aria-label="Mostrar senha"
              >
                Mostrar
              </button>
            </span>
          </label>

          ${
            register
              ? `
                <label class="field">
                  Perfil
                  <select name="perfil">
                    <option value="CLIENTE">Cliente</option>
                    <option value="OFICINA">Oficina</option>
                    <option value="FORNECEDOR">Fornecedor</option>
                  </select>
                </label>

                <label class="field">
                  Telefone (opcional)
                  <input
                    type="tel"
                    name="telefone"
                    autocomplete="tel"
                    placeholder="(00) 00000-0000"
                  >
                </label>
              `
              : `
                <div class="lc-forgot-row">
                  <button
                    type="button"
                    class="link"
                    id="esqueciSenha"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              `
          }

          <button
            class="btn lc-submit"
            type="submit"
          >
            ${register ? "Criar conta" : "Entrar na plataforma"}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <div class="lc-auth-footer">
          ${
            register
              ? "Já tem uma conta?"
              : "Ainda não tem uma conta?"
          }

          <button
            type="button"
            class="link"
            id="toggle"
          >
            ${register ? "Fazer login" : "Criar conta grátis"}
          </button>
        </div>
      </section>

      <p class="lc-auth-bottom">
        LAUNCHCONTROL · Gestão automotiva inteligente
      </p>
    </main>
  `;

  document.querySelector("#toggle").onclick =
    () => loginScreen(!register);

  const password = document.querySelector("#auth-password");
  const showPassword = document.querySelector("#show-password");

  showPassword.onclick = () => {
    const visible = password.type === "password";

    password.type = visible ? "text" : "password";

    showPassword.textContent =
      visible ? "Ocultar" : "Mostrar";

    showPassword.setAttribute(
      "aria-label",
      visible ? "Ocultar senha" : "Mostrar senha"
    );
  };

  const forgot = document.querySelector("#esqueciSenha");

  if (forgot) {
    forgot.onclick = recoveryScreen;
  }

  document.querySelector("#authform").onsubmit = async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const values = Object.fromEntries(new FormData(form));

    button.disabled = true;

    try {
      if (register) {
        await api("/public/cadastro", "POST", values);

        loginScreen(false);

        document.querySelector("#authmsg").innerHTML = `
          <div class="notice ok">
            Conta criada! Entre com seu e-mail e senha.
          </div>
        `;
      } else {
        auth = btoa(
          unescape(
            encodeURIComponent(
              values.email.trim().toLowerCase() +
              ":" +
              values.senha
            )
          )
        );

        me = await api("/me");

        await refresh();

        tab = "dashboard";

        render();
      }
    } catch (error) {
      auth = null;

      document.querySelector("#authmsg").innerHTML = `
        <div class="notice error">
          ${esc(error.message)}
        </div>
      `;

      button.disabled = false;
    }
  };
}

/* ==========================================
   RECUPERAÇÃO DE SENHA
   ========================================== */

/**
 * Exibe a solicitação de recuperação de senha.
 * O envio depende do endpoint público correspondente e da configuração
 * de e-mail do backend; esta tela, isoladamente, não redefine a senha.
 */
function recoveryScreen() {
  app.innerHTML = `
    <main class="login lc-auth-page">
      <section class="auth lc-auth-card">

        <div class="lc-brand">
          <div class="logo">
            LAUNCH<span>CONTROL</span>
          </div>

          <span class="lc-brand-caption">
            RECUPERAÇÃO DE ACESSO
          </span>
        </div>

        <div class="lc-auth-heading">
          <span class="lc-eyebrow">
            SEGURANÇA DA CONTA
          </span>

          <h1>Esqueceu sua senha?</h1>

          <p>
            Informe seu e-mail cadastrado para solicitar
            um link de recuperação.
          </p>
        </div>

        <div
          id="recovery-message"
          role="status"
          aria-live="polite"
        ></div>

        <form id="recovery-form" class="lc-auth-form">
          <label class="field">
            E-mail cadastrado

            <input
              type="email"
              name="email"
              autocomplete="email"
              required
              placeholder="voce@exemplo.com"
            >
          </label>

          <button
            type="submit"
            class="btn lc-submit"
          >
            Solicitar recuperação
          </button>
        </form>

        <div class="lc-auth-footer">
          <button
            type="button"
            class="link"
            id="back-login"
          >
            Voltar para o login
          </button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#back-login").onclick =
    () => loginScreen(false);

  document.querySelector("#recovery-form").onsubmit =
    async event => {
      event.preventDefault();

      const form = event.currentTarget;
      const button = form.querySelector('[type="submit"]');

      const email = new FormData(form)
        .get("email")
        .trim();

      const message = document.querySelector(
        "#recovery-message"
      );

      button.disabled = true;

      try {
        await api(
          "/public/recuperar-senha",
          "POST",
          { email }
        );

        message.innerHTML = `
          <div class="notice ok">
            Se o e-mail estiver cadastrado, você receberá
            as instruções de recuperação.
          </div>
        `;
      } catch (error) {
        message.innerHTML = `
          <div class="notice error">
            Não foi possível processar a solicitação.
            Verifique se o backend possui a rota de
            recuperação de senha.
          </div>
        `;
      } finally {
        button.disabled = false;
      }
    };
}

/* ==========================================
   CARREGAMENTO DOS DADOS
   ========================================== */

/**
 * Atualiza os dados consultados pela aplicação.
 * As chamadas condicionadas ao perfil evitam solicitar recursos que não
 * fazem parte da navegação daquele usuário. A autorização real deve
 * continuar sendo validada no backend, nunca apenas no frontend.
 */
async function refresh() {
  data.solicitacoes = await api("/solicitacoes");
  data.notificacoes = await api("/notificacoes");

  data.veiculos =
    me.perfil === "CLIENTE"
      ? await api("/veiculos")
      : [];

  data.pecas =
    ["FORNECEDOR", "OFICINA", "ADMINISTRADOR"].includes(me.perfil)
      ? await api("/pecas")
      : [];

  data.usuarios =
    me.perfil === "ADMINISTRADOR"
      ? await api("/admin/usuarios")
      : [];

  data.oficinas =
    me.perfil === "CLIENTE"
      ? await api("/oficinas")
      : [];

  data.cobrancas = await api("/cobrancas");
}

/* ==========================================
   NAVEGAÇÃO
   ========================================== */

/**
 * Define os módulos disponíveis no menu para cada perfil.
 * A filtragem melhora a experiência de uso, mas não substitui
 * as regras de acesso implementadas pelo Spring Security.
 */
function tabs() {
  return [
    { id: "dashboard", label: "▦ Painel" },
    { id: "solicitacoes", label: "▤ Solicitações" },
    {
      id: "veiculos",
      label: "▣ Veículos",
      roles: ["CLIENTE"]
    },
    {
      id: "garagem",
      label: "◷ Minha garagem",
      roles: ["CLIENTE"]
    },
    { id: "pesquisa", label: "⌕ Pesquisa de peças" },
    {
      id: "pecas",
      label: "⚙ Peças",
      roles: ["FORNECEDOR", "OFICINA", "ADMINISTRADOR"]
    },
    { id: "cobrancas", label: "▤ Cobranças" },
    { id: "notificacoes", label: "♧ Notificações" },
    {
      id: "usuarios",
      label: "♙ Usuários",
      roles: ["ADMINISTRADOR"]
    }
  ].filter(item =>
    !item.roles || item.roles.includes(me.perfil)
  );
}

/* ==========================================
   LAYOUT PRINCIPAL
   ========================================== */

/**
 * Monta o layout autenticado, com menu lateral, cabeçalho e conteúdo ativo.
 * Após atualizar o DOM, registra os eventos de navegação e formulários.
 */
function render() {
  app.innerHTML = `
    <div class="layout">

      <aside class="sidebar">
        <div class="logo">
          LAUNCH<span>CONTROL</span>
        </div>

        ${tabs().map(item => `
          <button
            class="nav ${tab === item.id ? "active" : ""}"
            data-tab="${item.id}"
          >
            ${item.label}
          </button>
        `).join("")}
      </aside>

      <div class="main">
        <header class="top">
          <div>
            <b>${esc(me.nome)}</b>

            <div class="muted">
              ${esc(me.email)} · ${esc(me.perfil)}
            </div>
          </div>

          <button
            class="btn secondary"
            id="logout"
          >
            Sair
          </button>
        </header>

        <main class="content">
          <div class="heading">
            <h1>
              ${esc(tabs().find(item => item.id === tab)?.label || "Painel")}
            </h1>
          </div>

          ${msg}
          ${content()}
        </main>
      </div>
    </div>
  `;

  msg = "";

  document.querySelectorAll("[data-tab]").forEach(button => {
    button.onclick = () => {
      tab = button.dataset.tab;
      render();
    };
  });

  document.querySelector("#logout").onclick = () => {
    auth = null;
    me = null;
    loginScreen();
  };

  bind();
}

/* ==========================================
   COMPONENTES REUTILIZÁVEIS
   ========================================== */

// Componente reutilizável para indicadores do painel principal.
function card(label, value) {
  return `
    <div class="card">
      <span class="muted">${esc(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

// Gera tabelas consistentes e uma mensagem quando não há registros.
function table(headers, rows) {
  if (!rows.length) {
    return `
      <div class="empty">
        Nenhum registro encontrado no MySQL.
      </div>
    `;
  }

  return `
    <table>
      <thead>
        <tr>
          ${headers.map(header =>
            `<th>${esc(header)}</th>`
          ).join("")}
        </tr>
      </thead>

      <tbody>
        ${rows.map(row => `
          <tr>
            ${row.map(cell =>
              `<td>${esc(cell)}</td>`
            ).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// Padroniza a estrutura de formulários usados nos diferentes módulos.
function form(id, fields, label) {
  return `
    <form data-form="${id}">
      ${fields}
      <button class="btn" type="submit">
        ${esc(label)}
      </button>
    </form>
  `;
}

/* ==========================================
   AÇÕES DAS SOLICITAÇÕES
   ========================================== */

/**
 * Seleciona ações possíveis conforme perfil e estado da solicitação.
 * Exemplo: a oficina prepara orçamentos e o cliente aprova ou recusa.
 * O backend precisa validar cada transição independentemente dos botões.
 */
function actions(item) {
  if (me.perfil === "OFICINA") {
    if (
      ["AGUARDANDO", "EM_ANALISE", "AGUARDANDO_APROVACAO"]
        .includes(item.status)
    ) {
      return `
        <button class="btn" data-quote="${item.id}">
          Orçamento
        </button>
      `;
    }

    if (item.status === "APROVADO") {
      return `
        <button
          class="btn"
          data-status="${item.id}"
          data-value="EM_EXECUCAO"
        >
          Iniciar
        </button>
      `;
    }

    if (item.status === "EM_EXECUCAO") {
      return `
        <button
          class="btn"
          data-status="${item.id}"
          data-value="CONCLUIDO"
        >
          Concluir
        </button>
      `;
    }
  }

  if (
    me.perfil === "CLIENTE" &&
    item.status === "AGUARDANDO_APROVACAO"
  ) {
    return `
      <div class="actions">
        <button
          class="btn"
          data-decision="${item.id}"
          data-value="true"
        >
          Aprovar
        </button>

        <button
          class="btn danger"
          data-decision="${item.id}"
          data-value="false"
        >
          Recusar
        </button>
      </div>
    `;
  }

  if (
    me.perfil === "CLIENTE" &&
    item.status === "CONCLUIDO" &&
    !item.avaliado
  ) {
    return `
      <button class="btn" data-review="${item.id}">
        Avaliar
      </button>
    `;
  }

  return "—";
}

// Renderiza solicitações, seus orçamentos, status e ações disponíveis.
function requests(items) {
  if (!items.length) {
    return `
      <div class="empty">
        Nenhuma solicitação cadastrada.
        Os dados aparecerão aqui após serem salvos no MySQL.
      </div>
    `;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Veículo</th>
          <th>Serviço</th>
          <th>Status</th>
          <th>Orçamento</th>
          <th>Ações</th>
        </tr>
      </thead>

      <tbody>
        ${items.map(item => `
          <tr>
            <td>#${item.id}</td>

            <td>${esc(item.cliente)}</td>

            <td>
              ${esc(item.veiculo)}
              <div class="muted">
                ${esc(item.placa)}
              </div>
            </td>

            <td>
              ${esc(item.servico)}
              <div class="muted">
                ${esc(item.descricao)}
              </div>
            </td>

            <td>
              <span class="pill">
                ${esc(statuses[item.status] || item.status)}
              </span>
            </td>

            <td>
              ${item.orcamento
                ? money(item.orcamento.total)
                : "—"}
            </td>

            <td>
              ${actions(item)}

              <button
                class="btn secondary"
                data-detail="${item.id}"
              >
                Detalhes
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/* ==========================================
   CONTEÚDO DOS MÓDULOS
   ========================================== */

/**
 * Retorna o conteúdo do módulo atualmente selecionado.
 * O painel apresenta indicadores; os demais módulos oferecem cadastros,
 * consultas, pesquisa externa de peças, cobranças e notificações.
 */
function content() {
  const solicitacoes = data.solicitacoes;

  switch (tab) {

    case "dashboard":
      return `
        <div class="grid">
          ${card("Solicitações", solicitacoes.length)}

          ${card(
            "Aguardando aprovação",
            solicitacoes.filter(item =>
              item.status === "AGUARDANDO_APROVACAO"
            ).length
          )}

          ${card(
            "Em execução",
            solicitacoes.filter(item =>
              item.status === "EM_EXECUCAO"
            ).length
          )}

          ${card(
            "Concluídos",
            solicitacoes.filter(item =>
              item.status === "CONCLUIDO"
            ).length
          )}

          ${card(
            "Faturamento pago",
            money(
              data.cobrancas
                .filter(item => item.status === "PAGO")
                .reduce(
                  (total, item) =>
                    total + Number(item.valor),
                  0
                )
            )
          )}

          ${card(
            "Conversão",
            solicitacoes.filter(item => item.orcamento).length
              ? Math.round(
                  100 *
                  solicitacoes.filter(item =>
                    ["APROVADO", "EM_EXECUCAO", "CONCLUIDO"]
                      .includes(item.status)
                  ).length /
                  solicitacoes.filter(item => item.orcamento).length
                ) + "%"
              : "0%"
          )}
        </div>

        <div class="panel">
          <h2>Solicitações recentes</h2>
          ${requests(solicitacoes.slice(0, 8))}
        </div>
      `;

    case "solicitacoes":
      return `
        ${
          me.perfil === "CLIENTE"
            ? `
              <div class="panel">
                <h2>Nova solicitação</h2>

                ${form(
                  "solicitacao",
                  `
                    <label class="field">
                      Oficina
                      <select name="oficinaId" required>
                        ${data.oficinas.map(oficina => `
                          <option value="${oficina.id}">
                            ${esc(oficina.nome)}
                          </option>
                        `).join("")}
                      </select>
                    </label>

                    <label class="field">
                      Veículo
                      <select name="veiculoId" required>
                        ${data.veiculos.map(veiculo => `
                          <option value="${veiculo.id}">
                            ${esc(veiculo.modelo)} ·
                            ${esc(veiculo.placa)}
                          </option>
                        `).join("")}
                      </select>
                    </label>

                    <label class="field">
                      Serviço
                      <input
                        name="servico"
                        required
                        maxlength="100"
                      >
                    </label>

                    <label class="field">
                      Descrição
                      <textarea
                        name="descricao"
                        required
                        maxlength="1500"
                      ></textarea>
                    </label>
                  `,
                  "Enviar solicitação"
                )}

                ${
                  data.veiculos.length
                    ? ""
                    : `<p class="muted">
                        Cadastre um veículo primeiro.
                      </p>`
                }
              </div>
            `
            : ""
        }

        <div class="panel">
          <h2>Solicitações do banco de dados</h2>
          ${requests(solicitacoes)}
        </div>
      `;

    case "veiculos":
      return `
        <div class="panel">
          <h2>Cadastrar veículo</h2>

          ${form(
            "veiculo",
            `
              <div class="formgrid">
                <label class="field">
                  Modelo
                  <input name="modelo" required>
                </label>

                <label class="field">
                  Ano
                  <input
                    type="number"
                    name="ano"
                    min="1950"
                    max="2100"
                    required
                  >
                </label>

                <label class="field">
                  Placa
                  <input
                    name="placa"
                    maxlength="8"
                    required
                    placeholder="ABC1D23"
                  >
                </label>

                <label class="field">
                  Quilometragem
                  <input
                    type="number"
                    name="quilometragem"
                    min="0"
                    value="0"
                  >
                </label>
              </div>
            `,
            "Salvar veículo"
          )}
        </div>

        <div class="panel">
          <h2>Meus veículos</h2>

          ${
            data.veiculos.length
              ? `
                <table>
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th>Ano</th>
                      <th>Placa</th>
                      <th>Km</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${data.veiculos.map(veiculo => `
                      <tr>
                        <td>${esc(veiculo.modelo)}</td>
                        <td>${esc(veiculo.ano)}</td>
                        <td>${esc(veiculo.placa)}</td>
                        <td>${esc(veiculo.quilometragem)}</td>

                        <td>
                          <button
                            class="btn secondary"
                            data-editvehicle="${veiculo.id}"
                          >
                            Editar
                          </button>

                          <button
                            class="btn danger"
                            data-delvehicle="${veiculo.id}"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              `
              : `<div class="empty">
                  Nenhum veículo cadastrado.
                </div>`
          }
        </div>
      `;

    case "garagem":
      return `
        <div class="panel">
          <h2>Histórico por veículo</h2>

          <p class="muted">
            Consulte os atendimentos e o histórico
            de manutenção dos seus veículos.
          </p>

          ${
            data.veiculos.length
              ? data.veiculos.map(veiculo => `
                  <section class="panel">
                    <h3>
                      ${esc(veiculo.modelo)}
                      (${esc(veiculo.ano)})
                      · ${esc(veiculo.placa)}
                    </h3>

                    ${requests(
                      solicitacoes
                        .filter(item =>
                          item.veiculoId === veiculo.id
                        )
                        .sort((a, b) =>
                          String(b.criadaEm)
                            .localeCompare(String(a.criadaEm))
                        )
                    )}
                  </section>
                `).join("")
              : `<div class="empty">
                  Cadastre um veículo para começar.
                </div>`
          }
        </div>
      `;

    case "pesquisa":
      return `
        <div class="panel">
          <h2>Pesquisa de peças por veículo</h2>

          <p class="muted">
            Pesquise peças no Mercado Livre e na OLX.
            Confira a compatibilidade antes de comprar.
          </p>

          <form id="parts-search">
            <label class="field">
              Veículo

              ${
                me.perfil === "CLIENTE" && data.veiculos.length
                  ? `
                    <select id="search-car">
                      ${data.veiculos.map(veiculo => `
                        <option value="${veiculo.id}">
                          ${esc(veiculo.modelo)}
                          (${esc(veiculo.ano)})
                          · ${esc(veiculo.placa)}
                        </option>
                      `).join("")}
                    </select>
                  `
                  : `
                    <input
                      id="search-car-free"
                      required
                      placeholder="Ex.: Chevrolet Onix 2022"
                    >
                  `
              }
            </label>

            <label class="field">
              Peça desejada
              <input
                id="search-part"
                required
                maxlength="120"
                placeholder="Ex.: pastilha de freio"
              >
            </label>

            <button class="btn" type="submit">
              Pesquisar nas lojas
            </button>
          </form>

          <div id="parts-results"></div>
        </div>
      `;

    case "pecas":
      return `
        ${
          me.perfil === "FORNECEDOR"
            ? `
              <div class="panel">
                <h2>Cadastrar peça</h2>

                ${form(
                  "peca",
                  `
                    <div class="formgrid">
                      <label class="field">
                        Código
                        <input name="codigo" required>
                      </label>

                      <label class="field">
                        Nome
                        <input name="nome" required>
                      </label>

                      <label class="field">
                        Preço (R$)
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          name="preco"
                          required
                        >
                      </label>

                      <label class="field">
                        Quantidade
                        <input
                          type="number"
                          min="0"
                          name="quantidade"
                          required
                        >
                      </label>
                    </div>
                  `,
                  "Cadastrar peça"
                )}
              </div>
            `
            : ""
        }

        <div class="panel">
          <h2>Estoque</h2>

          ${table(
            ["Código", "Peça", "Preço", "Quantidade", "Fornecedor"],
            data.pecas.map(peca => [
              peca.codigo,
              peca.nome,
              money(peca.preco),
              peca.quantidade,
              peca.fornecedor
            ])
          )}
        </div>
      `;

    case "cobrancas":
      return `
        <div class="panel">
          <h2>Cobranças registradas</h2>

          ${
            data.cobrancas.length
              ? `
                <table>
                  <thead>
                    <tr>
                      <th>Solicitação</th>
                      <th>Serviço</th>
                      <th>Cliente</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${data.cobrancas.map(cobranca => `
                      <tr>
                        <td>#${cobranca.solicitacaoId}</td>
                        <td>${esc(cobranca.servico)}</td>
                        <td>${esc(cobranca.cliente)}</td>
                        <td>${money(cobranca.valor)}</td>
                        <td>${esc(cobranca.status)}</td>

                        <td>
                          ${
                            me.perfil === "OFICINA" &&
                            cobranca.status === "PENDENTE"
                              ? `
                                <button
                                  class="btn"
                                  data-pay="${cobranca.id}"
                                >
                                  Registrar pagamento
                                </button>
                              `
                              : "—"
                          }
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              `
              : `<div class="empty">
                  Nenhuma cobrança registrada.
                </div>`
          }
        </div>
      `;

    case "notificacoes":
      return `
        <div class="panel">
          <h2>Minhas notificações</h2>

          ${
            data.notificacoes.length
              ? data.notificacoes.map(notificacao => `
                  <div class="panel">
                    <b>${esc(notificacao.titulo)}</b>

                    ${
                      notificacao.lida
                        ? ""
                        : `<span class="pill">Nova</span>`
                    }

                    <p>${esc(notificacao.mensagem)}</p>

                    ${
                      notificacao.lida
                        ? ""
                        : `
                          <button
                            class="btn secondary"
                            data-read="${notificacao.id}"
                          >
                            Marcar como lida
                          </button>
                        `
                    }
                  </div>
                `).join("")
              : `<div class="empty">
                  Nenhuma notificação.
                </div>`
          }
        </div>
      `;

    case "usuarios":
      return `
        <div class="panel">
          <h2>Usuários cadastrados</h2>

          ${table(
            ["ID", "Nome", "E-mail", "Perfil"],
            data.usuarios.map(usuario => [
              usuario.id,
              usuario.nome,
              usuario.email,
              usuario.perfil
            ])
          )}
        </div>
      `;
  }

  return "";
}

/* ==========================================
   EXECUÇÃO DE OPERAÇÕES
   ========================================== */

/**
 * Executa uma operação de escrita, recarrega os dados e atualiza a tela.
 * Centralizar esse fluxo evita repetir o tratamento de sucesso e erro.
 */
async function execute(path, method, body, success) {
  try {
    await api(path, method, body);
    await refresh();
    flash(success);
    render();
  } catch (error) {
    flash(error.message, true);
    render();
  }
}

/* ==========================================
   EVENTOS E FORMULÁRIOS
   ========================================== */

/**
 * Conecta os botões e formulários renderizados aos respectivos eventos.
 * Como a interface é recriada dinamicamente, os eventos são registrados
 * novamente após cada renderização.
 */
function bind() {
  const searchForm = document.querySelector("#parts-search");

  if (searchForm) {
    searchForm.onsubmit = event => {
      event.preventDefault();

      const carElement = document.querySelector("#search-car");

      const vehicle = carElement
        ? data.veiculos.find(item =>
            String(item.id) === carElement.value
          )
        : null;

      const car = vehicle
        ? `${vehicle.modelo} ${vehicle.ano}`
        : document.querySelector("#search-car-free")
            .value.trim();

      const part = document.querySelector("#search-part")
        .value.trim();

      if (!car || !part) return;

      const query = encodeURIComponent(
        `${part} ${car}`.trim()
      );

      const mercadoLivre =
        "https://lista.mercadolivre.com.br/" + query;

      const olx =
        "https://www.olx.com.br/brasil?q=" + query;

      document.querySelector("#parts-results").innerHTML = `
        <div class="panel">
          <h3>
            Pesquisar: ${esc(part)} — ${esc(car)}
          </h3>

          <p>
            Confira os anúncios, preços e disponibilidade
            diretamente nas plataformas.
          </p>

          <div class="actions">
            <a
              class="btn"
              target="_blank"
              rel="noopener noreferrer"
              href="${mercadoLivre}"
            >
              Ver no Mercado Livre ↗
            </a>

            <a
              class="btn secondary"
              target="_blank"
              rel="noopener noreferrer"
              href="${olx}"
            >
              Ver na OLX ↗
            </a>
          </div>
        </div>
      `;
    };
  }

  document.querySelectorAll("[data-form]").forEach(formElement => {
    formElement.onsubmit = event => {
      event.preventDefault();

      const values = Object.fromEntries(
        new FormData(formElement)
      );

      const kind = formElement.dataset.form;

      if (kind === "veiculo") {
        return execute(
          "/veiculos",
          "POST",
          {
            ...values,
            ano: Number(values.ano),
            quilometragem: Number(values.quilometragem)
          },
          "Veículo cadastrado no MySQL."
        );
      }

      if (kind === "solicitacao") {
        return execute(
          "/solicitacoes",
          "POST",
          {
            ...values,
            veiculoId: Number(values.veiculoId),
            oficinaId: Number(values.oficinaId)
          },
          "Solicitação enviada à oficina."
        );
      }

      if (kind === "peca") {
        return execute(
          "/pecas",
          "POST",
          {
            ...values,
            preco: Number(values.preco),
            quantidade: Number(values.quantidade)
          },
          "Peça cadastrada."
        );
      }
    };
  });

  document.querySelectorAll("[data-read]").forEach(button => {
    button.onclick = () => execute(
      "/notificacoes/" + button.dataset.read + "/lida",
      "PUT",
      null,
      "Notificação lida."
    );
  });

  document.querySelectorAll("[data-decision]").forEach(button => {
    button.onclick = () => execute(
      "/solicitacoes/" + button.dataset.decision + "/decisao",
      "POST",
      {
        aprovado: button.dataset.value === "true"
      },
      "Resposta registrada."
    );
  });

  document.querySelectorAll("[data-status]").forEach(button => {
    button.onclick = () => {
      let laudo = "";

      if (button.dataset.value === "CONCLUIDO") {
        laudo = prompt(
          "Informe o laudo técnico de conclusão:"
        ) || "";

        if (!laudo.trim()) return;
      }

      execute(
        "/solicitacoes/" + button.dataset.status + "/status",
        "PUT",
        {
          status: button.dataset.value,
          laudo
        },
        "Status atualizado."
      );
    };
  });

  document.querySelectorAll("[data-quote]").forEach(button => {
    button.onclick = () => quote(button.dataset.quote);
  });

  document.querySelectorAll("[data-review]").forEach(button => {
    button.onclick = () => review(button.dataset.review);
  });

  document.querySelectorAll("[data-detail]").forEach(button => {
    button.onclick = () => detail(button.dataset.detail);
  });

  document.querySelectorAll("[data-editvehicle]").forEach(button => {
    button.onclick = () => {
      const vehicle = data.veiculos.find(
        item => String(item.id) === button.dataset.editvehicle
      );

      if (!vehicle) return;

      const modelo = prompt("Modelo:", vehicle.modelo);
      if (modelo === null) return;

      const ano = prompt("Ano:", vehicle.ano);
      if (ano === null) return;

      const quilometragem = prompt(
        "Quilometragem:",
        vehicle.quilometragem
      );

      if (quilometragem === null) return;

      execute(
        "/veiculos/" + vehicle.id,
        "PUT",
        {
          modelo,
          ano: Number(ano),
          quilometragem: Number(quilometragem)
        },
        "Veículo atualizado."
      );
    };
  });

  document.querySelectorAll("[data-delvehicle]").forEach(button => {
    button.onclick = () => {
      if (confirm("Excluir veículo sem histórico?")) {
        execute(
          "/veiculos/" + button.dataset.delvehicle,
          "DELETE",
          null,
          "Veículo excluído."
        );
      }
    };
  });

  document.querySelectorAll("[data-pay]").forEach(button => {
    button.onclick = () => {
      if (confirm("Confirmar recebimento do pagamento?")) {
        execute(
          "/cobrancas/" + button.dataset.pay + "/status",
          "PUT",
          { status: "PAGO" },
          "Pagamento registrado."
        );
      }
    };
  });
}

/* ==========================================
   ORÇAMENTO
   ========================================== */

/**
 * Exibe o formulário de orçamento para uma solicitação específica.
 * Converte valores numéricos antes de enviá-los à API; a validação final
 * e o cálculo confiável dos totais devem ocorrer no backend.
 */
function quote(id) {
  document.querySelector(".content").innerHTML = `
    <div class="heading">
      <h1>Orçamento da solicitação #${esc(id)}</h1>
    </div>

    <div class="panel">
      ${form(
        "orcamento",
        `
          <div class="formgrid">
            <label class="field">
              Peças (R$)
              <input
                type="number"
                step="0.01"
                min="0"
                name="pecas"
                value="0"
                required
              >
            </label>

            <label class="field">
              Mão de obra (R$)
              <input
                type="number"
                step="0.01"
                min="0"
                name="maoDeObra"
                value="0"
                required
              >
            </label>

            <label class="field">
              Desconto (R$)
              <input
                type="number"
                step="0.01"
                min="0"
                name="desconto"
                value="0"
                required
              >
            </label>

            <label class="field">
              Adicionais (R$)
              <input
                type="number"
                step="0.01"
                min="0"
                name="adicionais"
                value="0"
                required
              >
            </label>

            <label class="field">
              Prazo (dias)
              <input
                type="number"
                min="1"
                name="prazoDias"
                value="3"
                required
              >
            </label>
          </div>

          <label class="field">
            Observações
            <textarea name="observacoes"></textarea>
          </label>
        `,
        "Enviar orçamento"
      )}

      <button class="btn secondary" id="back">
        Voltar
      </button>
    </div>
  `;

  document.querySelector("#back").onclick = render;

  document.querySelector('[data-form="orcamento"]').onsubmit =
    event => {
      event.preventDefault();

      const values = Object.fromEntries(
        new FormData(event.currentTarget)
      );

      for (const key of [
        "pecas",
        "maoDeObra",
        "desconto",
        "adicionais",
        "prazoDias"
      ]) {
        values[key] = Number(values[key]);
      }

      execute(
        "/solicitacoes/" + id + "/orcamento",
        "POST",
        values,
        "Orçamento enviado ao cliente."
      );
    };
}

/* ==========================================
   DETALHES DO ATENDIMENTO
   ========================================== */

/**
 * Carrega a visão detalhada do atendimento: orçamento, histórico,
 * diário de manutenção, anexos e mensagens entre cliente e oficina.
 * Os dados são buscados pelos endpoints específicos da solicitação.
 */
async function detail(id) {
  try {
    const item = await api("/solicitacoes/" + id);

    const historico = await api(
      "/solicitacoes/" + id + "/historico-orcamento"
    );

    const mensagens = await api(
      "/solicitacoes/" + id + "/mensagens"
    );

    const anexos = await api(
      "/solicitacoes/" + id + "/anexos"
    );

    const diario = await api(
      "/solicitacoes/" + id + "/diario"
    );

    document.querySelector(".content").innerHTML = `
      <h1>Solicitação #${esc(item.id)}</h1>

      <div class="panel">
        <p><b>Cliente:</b> ${esc(item.cliente)}</p>
        <p><b>Oficina:</b> ${esc(item.oficina)}</p>

        <p>
          <b>Veículo:</b>
          ${esc(item.veiculo)} — ${esc(item.placa)}
        </p>

        <p><b>Serviço:</b> ${esc(item.servico)}</p>
        <p><b>Descrição:</b> ${esc(item.descricao)}</p>

        <p>
          <b>Status:</b>
          ${esc(statuses[item.status] || item.status)}
        </p>

        <p><b>Data:</b> ${esc(item.criadaEm)}</p>

        <p>
          <b>Laudo:</b>
          ${esc(item.laudo || "Ainda não registrado")}
        </p>

        ${
          item.orcamento
            ? `
              <h2>Proposta</h2>

              <p>
                Peças: ${money(item.orcamento.pecas)}
              </p>

              <p>
                Mão de obra: ${money(item.orcamento.maoDeObra)}
              </p>

              <p>
                Desconto: ${money(item.orcamento.desconto)}
              </p>

              <p>
                Adicionais: ${money(item.orcamento.adicionais)}
              </p>

              <h3>
                Total: ${money(item.orcamento.total)}
              </h3>

              <p>
                Prazo: ${esc(item.orcamento.prazoDias)} dias
              </p>

              <p>
                ${esc(item.orcamento.observacoes)}
              </p>
            `
            : ""
        }

        <h2>Histórico de propostas</h2>

        ${
          historico.length
            ? historico.map(entry => `
                <p>
                  ${esc(entry.registradoEm)}
                  · ${money(entry.total)}
                  · ${esc(entry.descricao)}
                </p>
              `).join("")
            : "<p>Sem alterações registradas.</p>"
        }

        <h2>Linha do tempo do atendimento</h2>

        <div class="panel">
          <p>
            <b>Solicitação criada:</b>
            ${esc(item.criadaEm)}
          </p>

          <p>
            <b>Situação atual:</b>
            ${esc(statuses[item.status] || item.status)}
            · ${esc(item.atualizadaEm)}
          </p>

          ${
            item.laudo
              ? `
                <p>
                  <b>Laudo final:</b>
                  ${esc(item.laudo)}
                </p>
              `
              : ""
          }
        </div>

        <h2>Diário de manutenção</h2>

        <p class="muted">
          Atualizações registradas pela oficina.
        </p>

        ${
          diario.length
            ? diario.map(entry => `
                <div class="panel">
                  <b>${esc(entry.oficina)}</b>
                  · ${esc(entry.criadoEm)}

                  <p>${esc(entry.observacao)}</p>
                </div>
              `).join("")
            : "<p>Sem atualizações de manutenção.</p>"
        }

        ${
          me.perfil === "OFICINA" &&
          ["APROVADO", "EM_EXECUCAO", "CONCLUIDO"]
            .includes(item.status)
            ? `
              <form id="diary-form">
                <label class="field">
                  Nova atualização

                  <textarea
                    name="observacao"
                    required
                    maxlength="1500"
                  ></textarea>
                </label>

                <button class="btn">
                  Registrar no diário
                </button>
              </form>
            `
            : ""
        }

        <h2>Fotos e vídeos do diagnóstico</h2>

        <p class="muted">
          JPG, PNG, WebP, MP4 ou WebM.
          Limite de 3 MB por arquivo.
        </p>

        ${
          anexos.length
            ? anexos.map(anexo => `
                <div class="panel">
                  <b>${esc(anexo.nome)}</b>
                  · ${esc(anexo.autor)}
                  · ${esc(anexo.criadoEm)}

                  <button
                    class="btn secondary"
                    data-open-attachment="${anexo.id}"
                  >
                    Abrir arquivo
                  </button>
                </div>
              `).join("")
            : "<p>Nenhum arquivo enviado.</p>"
        }

        ${
          ["CLIENTE", "OFICINA"].includes(me.perfil)
            ? `
              <form id="attachment-form">
                <label class="field">
                  Adicionar foto ou vídeo

                  <input
                    type="file"
                    name="arquivo"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    required
                  >
                </label>

                <button class="btn">
                  Enviar arquivo
                </button>
              </form>
            `
            : ""
        }

        <h2>Conversa do atendimento</h2>

        <div id="conversation">
          ${
            mensagens.length
              ? mensagens.map(message => `
                  <div class="panel">
                    <b>${esc(message.remetente)}</b>

                    <span class="muted">
                      ${esc(message.enviadaEm)}
                    </span>

                    <p>${esc(message.texto)}</p>
                  </div>
                `).join("")
              : "<p>Nenhuma mensagem ainda.</p>"
          }
        </div>

        ${
          ["CLIENTE", "OFICINA"].includes(me.perfil)
            ? `
              <form id="message-form">
                <label class="field">
                  Enviar mensagem

                  <textarea
                    name="texto"
                    maxlength="2000"
                    required
                  ></textarea>
                </label>

                <button class="btn">
                  Enviar mensagem
                </button>
              </form>
            `
            : ""
        }

        <button class="btn secondary" id="back">
          Voltar
        </button>
      </div>
    `;

    document.querySelector("#back").onclick = render;

    const diaryForm = document.querySelector("#diary-form");

    if (diaryForm) {
      diaryForm.onsubmit = async event => {
        event.preventDefault();

        try {
          await api(
            "/solicitacoes/" + id + "/diario",
            "POST",
            {
              observacao: new FormData(diaryForm)
                .get("observacao")
            }
          );

          await detail(id);
        } catch (error) {
          alert(error.message);
        }
      };
    }

    const attachmentForm = document.querySelector(
      "#attachment-form"
    );

    if (attachmentForm) {
      attachmentForm.onsubmit = async event => {
        event.preventDefault();

        const file = attachmentForm.querySelector(
          'input[type="file"]'
        ).files[0];

        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
          alert("Arquivo deve ter no máximo 3 MB.");
          return;
        }

        try {
          const base64 = await new Promise(
            (resolve, reject) => {
              const reader = new FileReader();

              reader.onload = () => {
                resolve(
                  String(reader.result).split(",")[1]
                );
              };

              reader.onerror = reject;
              reader.readAsDataURL(file);
            }
          );

          await api(
            "/solicitacoes/" + id + "/anexos",
            "POST",
            {
              nome: file.name,
              tipo: file.type,
              base64
            }
          );

          await detail(id);
        } catch (error) {
          alert(error.message);
        }
      };
    }

    document.querySelectorAll(
      "[data-open-attachment]"
    ).forEach(button => {
      button.onclick = async () => {
        try {
          const response = await fetch(
            API_ORIGIN +
            "/api/solicitacoes/" +
            id +
            "/anexos/" +
            button.dataset.openAttachment,
            {
              headers: {
                Authorization: "Basic " + auth
              }
            }
          );

          if (!response.ok) {
            throw new Error("Falha ao abrir arquivo.");
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          window.open(url, "_blank", "noopener");

          setTimeout(
            () => URL.revokeObjectURL(url),
            60000
          );
        } catch (error) {
          alert(error.message);
        }
      };
    });

    const messageForm = document.querySelector(
      "#message-form"
    );

    if (messageForm) {
      messageForm.onsubmit = async event => {
        event.preventDefault();

        const texto = new FormData(messageForm)
          .get("texto");

        try {
          await api(
            "/solicitacoes/" + id + "/mensagens",
            "POST",
            { texto }
          );

          await refresh();
          await detail(id);
        } catch (error) {
          alert(error.message);
        }
      };
    }
  } catch (error) {
    flash(error.message, true);
    render();
  }
}

/* ==========================================
   AVALIAÇÃO DE SERVIÇOS
   ========================================== */

// Exibe a avaliação de um serviço concluído, com nota e comentário.
function review(id) {
  document.querySelector(".content").innerHTML = `
    <h1>Avaliar serviço #${esc(id)}</h1>

    <div class="panel">
      ${form(
        "avaliacao",
        `
          <label class="field">
            Nota

            <select name="nota">
              <option value="5">5 - Excelente</option>
              <option value="4">4 - Bom</option>
              <option value="3">3 - Regular</option>
              <option value="2">2 - Ruim</option>
              <option value="1">1 - Péssimo</option>
            </select>
          </label>

          <label class="field">
            Comentário
            <textarea name="comentario"></textarea>
          </label>
        `,
        "Enviar avaliação"
      )}

      <button class="btn secondary" id="back">
        Voltar
      </button>
    </div>
  `;

  document.querySelector("#back").onclick = render;

  document.querySelector(
    '[data-form="avaliacao"]'
  ).onsubmit = event => {
    event.preventDefault();

    const values = Object.fromEntries(
      new FormData(event.currentTarget)
    );

    execute(
      "/solicitacoes/" + id + "/avaliacao",
      "POST",
      {
        nota: Number(values.nota),
        comentario: values.comentario
      },
      "Avaliação registrada."
    );
  };
}

/* ==========================================
   INICIALIZAÇÃO
   ========================================== */

// Inicializa a aplicação na tela de autenticação.
loginScreen();
