/**
 * A estrutura do frontend foi organizada em JavaScript
 * para permitir que diferentes telas sejam carregadas
 * dinamicamente, sem a necessidade de criar um arquivo
 * HTML separado para cada funcionalidade.
 *
 * A comunicação com o backend Java é realizada
 * através de requisições HTTP para a API REST.
 */

"use strict";

/**
 * CONFIGURAÇÃO DA API
 *
 * Centralizei a definição do endereço do backend
 * para facilitar a execução do projeto em diferentes
 * ambientes e evitar repetir a URL em cada requisição.
 */
const API_ORIGIN =
  location.port === "8080" ||
  location.protocol === "file:" ||
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "http://localhost:8080"
    : "";

/**
 * Elemento principal da aplicação.
 *
 * O JavaScript utiliza o elemento com id="app"
 * para apresentar dinamicamente as telas.
 */
const app = document.querySelector("#app");

/**
 * CONTROLE DO ESTADO DA APLICAÇÃO
 *
 * Essas variáveis armazenam temporariamente
 * as informações necessárias para a navegação.
 *
 * auth: credenciais de autenticação.
 * me: dados do usuário autenticado.
 * tab: tela selecionada.
 * msg: mensagens de retorno.
 */
let auth = null;
let me = null;
let tab = "dashboard";
let msg = "";

/**
 * ARMAZENAMENTO DOS DADOS DA INTERFACE
 *
 * Organizei os dados por categoria para facilitar
 * a atualização das informações recebidas do backend.
 *
 * Os registros permanentes ficam no banco de dados,
 * não neste objeto JavaScript.
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
 * PROTEÇÃO DE CONTEÚDO HTML
 *
 * Utilizo esta função para converter caracteres
 * especiais antes de inserir textos na interface.
 *
 * Isso reduz o risco de execução de HTML ou scripts
 * indesejados quando informações são apresentadas.
 */
const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

/**
 * FORMATAÇÃO MONETÁRIA
 *
 * Centralizei a formatação dos valores para manter
 * o padrão brasileiro em toda a aplicação.
 */
const money = value =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

/**
 * STATUS DOS ATENDIMENTOS
 *
 * Os valores utilizados pelo backend são convertidos
 * em textos mais claros para os usuários.
 */
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
 * FUNÇÃO CENTRAL DE REQUISIÇÕES
 *
 * Centralizar as requisições evita duplicação
 * de código e facilita a manutenção da API.
 *
 * A função recebe:
 * path: caminho do endpoint.
 * method: método HTTP.
 * body: dados enviados ao servidor.
 *
 * A autenticação Basic é enviada quando existe
 * uma sessão ativa.
 *
 * Em produção, é necessário utilizar HTTPS.
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

/**
 * MENSAGENS DE RETORNO
 *
 * Esta função padroniza os avisos exibidos após
 * operações realizadas pelo usuário.
 *
 * A função esc() protege o conteúdo apresentado.
 */
function flash(text, error = false) {
  msg = `
    <div class="notice ${error ? "error" : "ok"}">
      ${esc(text)}
    </div>
  `;
}

/* ==========================================
   LOGIN E CADASTRO
   ========================================== */

/**
 * TELA DE AUTENTICAÇÃO
 *
 * Utilizei uma única função para apresentar
 * tanto o login quanto o cadastro.
 *
 * Essa escolha reduz a repetição de componentes
 * e mantém o mesmo padrão visual nas duas telas.
 *
 * register = false: login.
 * register = true: cadastro.
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

  /**
   * Alterna entre login e cadastro sem recarregar
   * a página inteira.
   */
  document.querySelector("#toggle").onclick =
    () => loginScreen(!register);

  const password = document.querySelector("#auth-password");
  const showPassword = document.querySelector("#show-password");

  /**
   * Permite visualizar ou ocultar a senha digitada,
   * melhorando a experiência do usuário.
   */
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

  /**
   * Abre a recuperação de senha quando o botão
   * estiver disponível na tela de login.
   */
  const forgot = document.querySelector("#esqueciSenha");

  if (forgot) {
    forgot.onclick = recoveryScreen;
  }

  /**
   * PROCESSAMENTO DO FORMULÁRIO
   *
   * No cadastro, os dados são enviados ao backend.
   * No login, as credenciais são utilizadas para
   * consultar o usuário autenticado.
   *
   * O botão é desabilitado durante o processamento
   * para evitar envios repetidos.
   */
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
 * TELA DE RECUPERAÇÃO DE SENHA
 *
 * Mantive a recuperação de senha em uma função
 * separada para facilitar a manutenção e evitar
 * misturar essa funcionalidade com o login.
 *
 * O usuário informa seu e-mail e o frontend
 * encaminha a solicitação para o backend Java.
 *
 * A validação do e-mail, a geração do link e
 * o envio das instruções são responsabilidades
 * do backend.
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

  /**
   * Permite retornar ao login sem atualizar
   * toda a página.
   */
  document.querySelector("#back-login").onclick =
    () => loginScreen(false);

  /**
   * ENVIO DA SOLICITAÇÃO
   *
   * Evito o comportamento padrão do formulário
   * para enviar os dados por meio da API.
   *
   * A mensagem de sucesso não confirma se
   * determinado e-mail existe no sistema.
   * Essa abordagem ajuda a reduzir a exposição
   * de informações sobre contas cadastradas.
   */
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
        /**
         * Libero novamente o botão após a resposta,
         * independentemente de sucesso ou erro.
         */
        button.disabled = false;
      }
    };
}

/* ==========================================
   CARREGAMENTO DOS DADOS
   ========================================== */

/**
 * ATUALIZAÇÃO DOS DADOS DO SISTEMA
 *
 * Centralizei as consultas nesta função para
 * manter as informações atualizadas após
 * o login e as operações de cadastro,
 * edição ou exclusão.
 *
 * Cada perfil recebe apenas as consultas
 * necessárias para suas funcionalidades.
 *
 * IMPORTANTE:
 * O controle visual de perfis não substitui
 * a autorização no backend. O servidor deve
 * validar o acesso a cada endpoint.
 */
async function refresh() {
  /**
   * As solicitações e notificações são
   * carregadas conforme o usuário autenticado.
   */
  data.solicitacoes = await api("/solicitacoes");
  data.notificacoes = await api("/notificacoes");

  /**
   * Somente o perfil CLIENTE precisa carregar
   * seus veículos nesta parte da aplicação.
   */
  data.veiculos =
    me.perfil === "CLIENTE"
      ? await api("/veiculos")
      : [];

  /**
   * O estoque de peças é consultado pelos
   * perfis relacionados ao fornecimento
   * e à gestão de serviços.
   */
  data.pecas =
    ["FORNECEDOR", "OFICINA", "ADMINISTRADOR"].includes(me.perfil)
      ? await api("/pecas")
      : [];

  /**
   * A listagem administrativa de usuários
   * é solicitada somente pelo administrador.
   */
  data.usuarios =
    me.perfil === "ADMINISTRADOR"
      ? await api("/admin/usuarios")
      : [];

  /**
   * O cliente consulta as oficinas disponíveis
   * para selecionar uma ao criar solicitações.
   */
  data.oficinas =
    me.perfil === "CLIENTE"
      ? await api("/oficinas")
      : [];

  /**
   * As cobranças são carregadas para exibição
   * das informações financeiras permitidas
   * ao usuário autenticado.
   */
  data.cobrancas = await api("/cobrancas");
}

/* ==========================================
   NAVEGAÇÃO
   ========================================== */

/**
 * MENU DE NAVEGAÇÃO
 *
 * Organizei as opções do menu em uma lista
 * de objetos para evitar criar manualmente
 * cada botão em diferentes partes do sistema.
 *
 * Cada item possui:
 * id: identificador interno da tela.
 * label: nome exibido no menu.
 * roles: perfis autorizados a visualizar a opção.
 *
 * Quando roles não é informado, a opção
 * fica visível para todos os perfis autenticados.
 *
 * Essa filtragem melhora a experiência visual,
 * mas a segurança dos dados depende do backend.
 */
function tabs() {
  return [
    {
      id: "dashboard",
      label: "▦ Painel"
    },
    {
      id: "solicitacoes",
      label: "▤ Solicitações"
    },
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
    {
      id: "pesquisa",
      label: "⌕ Pesquisa de peças"
    },
    {
      id: "pecas",
      label: "⚙ Peças",
      roles: ["FORNECEDOR", "OFICINA", "ADMINISTRADOR"]
    },
    {
      id: "cobrancas",
      label: "▤ Cobranças"
    },
    {
      id: "notificacoes",
      label: "♧ Notificações"
    },
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
 * RENDERIZAÇÃO DA INTERFACE
 *
 * Utilizo esta função para montar o layout
 * principal depois que o usuário realiza login.
 *
 * O menu lateral, o cabeçalho e a área de
 * conteúdo são gerados dinamicamente.
 *
 * Isso permite manter uma estrutura visual
 * consistente durante a navegação.
 */
function render() {
  app.innerHTML = `
    <div class="layout">

      <aside class="sidebar">
        <div class="logo">
          LAUNCH<span>CONTROL</span>
        </div>

        ${
          tabs().map(item => `
            <button
              class="nav ${tab === item.id ? "active" : ""}"
              data-tab="${item.id}"
            >
              ${item.label}
            </button>
          `).join("")
        }
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

  /**
   * Limpo a mensagem temporária após sua
   * inclusão na interface.
   */
  msg = "";

  /**
   * NAVEGAÇÃO ENTRE AS TELAS
   *
   * Cada botão atualiza a variável tab
   * e solicita uma nova renderização.
   *
   * Dessa forma, a navegação acontece
   * sem recarregar a página inteira.
   */
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.onclick = () => {
      tab = button.dataset.tab;
      render();
    };
  });

  /**
   * ENCERRAMENTO DA SESSÃO
   *
   * Ao sair, removo as credenciais mantidas
   * em memória e os dados do usuário atual.
   *
   * Depois disso, a tela de login é exibida.
   */
  document.querySelector("#logout").onclick = () => {
    auth = null;
    me = null;
    loginScreen();
  };

  /**
   * Depois de gerar os elementos HTML,
   * conecto os eventos dos formulários
   * e botões às suas funcionalidades.
   */
  bind();
}

/* ==========================================
   COMPONENTES REUTILIZÁVEIS
   ========================================== */

/**
 * COMPONENTE DE INDICADOR
 *
 * Cria cartões utilizados para apresentar
 * informações resumidas no dashboard.
 *
 * Reutilizar esta função evita repetir
 * a mesma estrutura HTML.
 */
function card(label, value) {
  return `
    <div class="card">
      <span class="muted">${esc(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

/**
 * COMPONENTE DE TABELA
 *
 * Centraliza a construção de tabelas
 * utilizadas em diferentes módulos.
 *
 * Também apresenta uma mensagem quando
 * não existem registros disponíveis.
 *
 * A função esc() é utilizada para proteger
 * os textos exibidos nas células.
 */
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

/**
 * COMPONENTE DE FORMULÁRIO
 *
 * Cria uma estrutura padronizada para
 * formulários de diferentes funcionalidades.
 *
 * O atributo data-form identifica qual
 * operação deverá ser executada quando
 * o usuário enviar os dados.
 */
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
 * AÇÕES DISPONÍVEIS POR PERFIL
 *
 * Organizei as ações conforme o perfil do usuário
 * e a situação atual de cada solicitação.
 *
 * Essa separação permite que clientes e oficinas
 * tenham opções diferentes durante o atendimento.
 *
 * A oficina pode elaborar orçamentos, iniciar
 * serviços aprovados e registrar sua conclusão.
 *
 * O cliente pode aprovar ou recusar propostas
 * e avaliar serviços finalizados.
 *
 * IMPORTANTE:
 * As permissões também precisam ser verificadas
 * pelo backend, pois ocultar botões no frontend
 * não é suficiente para garantir a segurança.
 */
function actions(item) {
  if (me.perfil === "OFICINA") {
    /**
     * Enquanto a solicitação estiver em análise
     * ou aguardando aprovação, a oficina poderá
     * acessar a funcionalidade de orçamento.
     */
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

    /**
     * O serviço poderá ser iniciado quando
     * o cliente aprovar o orçamento.
     */
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

    /**
     * Após a execução, a oficina poderá
     * finalizar o atendimento.
     */
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

  /**
   * APROVAÇÃO DO CLIENTE
   *
   * O cliente recebe as opções de aprovar
   * ou recusar uma proposta quando ela
   * estiver aguardando sua decisão.
   */
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

  /**
   * AVALIAÇÃO DO ATENDIMENTO
   *
   * A avaliação é disponibilizada quando
   * o serviço está concluído e ainda
   * não recebeu uma avaliação.
   */
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

/**
 * TABELA DE SOLICITAÇÕES
 *
 * Centralizei a apresentação das solicitações
 * para reutilizá-la no painel, na listagem
 * de atendimentos e no histórico dos veículos.
 *
 * Cada registro apresenta informações do cliente,
 * veículo, serviço, status, orçamento e ações.
 */
function requests(items) {
  /**
   * Quando não existem solicitações,
   * apresento uma mensagem informativa
   * em vez de uma tabela vazia.
   */
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
 * GERENCIAMENTO DAS TELAS
 *
 * Utilizo a variável tab para identificar
 * qual módulo deve ser apresentado.
 *
 * O switch permite organizar as funcionalidades
 * em uma estrutura centralizada.
 *
 * Cada case retorna o HTML correspondente
 * à tela selecionada pelo usuário.
 */
function content() {
  const solicitacoes = data.solicitacoes;

  switch (tab) {

    /* ======================================
       DASHBOARD
       ====================================== */

    /**
     * PAINEL PRINCIPAL
     *
     * O dashboard apresenta indicadores
     * que ajudam o usuário a acompanhar
     * o andamento dos atendimentos.
     *
     * Os valores são calculados a partir
     * dos dados recebidos do backend.
     */
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

          ${
            /**
             * FATURAMENTO
             *
             * Somo somente as cobranças que possuem
             * status PAGO para apresentar o valor
             * registrado como recebido.
             */
            card(
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
            )
          }

          ${
            /**
             * INDICADOR DE CONVERSÃO
             *
             * Relaciona os atendimentos aprovados
             * ou em andamento à quantidade de
             * solicitações com orçamento.
             *
             * Quando não existem orçamentos,
             * o indicador apresenta 0%.
             */
            card(
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
            )
          }
        </div>

        <div class="panel">
          <h2>Solicitações recentes</h2>
          ${requests(solicitacoes.slice(0, 8))}
        </div>
      `;

    /* ======================================
       SOLICITAÇÕES
       ====================================== */

    /**
     * GERENCIAMENTO DE SOLICITAÇÕES
     *
     * O cliente pode selecionar uma oficina,
     * escolher um veículo e descrever o
     * problema ou serviço desejado.
     *
     * Os demais perfis visualizam as
     * solicitações disponibilizadas pelo backend.
     */
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

    /* ======================================
       VEÍCULOS
       ====================================== */

    /**
     * CADASTRO E GERENCIAMENTO DE VEÍCULOS
     *
     * O cliente pode cadastrar seus veículos
     * e consultar os registros existentes.
     *
     * Os dados são utilizados posteriormente
     * na abertura de solicitações de serviço.
     */
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

    /* ======================================
       MINHA GARAGEM
       ====================================== */

    /**
     * HISTÓRICO DOS VEÍCULOS
     *
     * Organizei esta tela para que o cliente
     * acompanhe os serviços relacionados
     * a cada veículo cadastrado.
     *
     * As solicitações são filtradas pelo ID
     * do veículo e ordenadas por data.
     */
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

    /* ======================================
       PESQUISA DE PEÇAS
       ====================================== */

    /**
     * PESQUISA EXTERNA DE PEÇAS
     *
     * Esta funcionalidade permite pesquisar
     * peças automotivas considerando o veículo.
     *
     * A pesquisa utiliza links externos para
     * Mercado Livre e OLX.
     *
     * Os resultados e preços são consultados
     * diretamente nessas plataformas.
     */
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

    /* ======================================
       ESTOQUE DE PEÇAS
       ====================================== */

    /**
     * CONTROLE DE PEÇAS
     *
     * O fornecedor pode cadastrar peças
     * informando código, nome, preço
     * e quantidade disponível.
     *
     * A listagem apresenta os registros
     * recebidos do backend.
     */
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

    /* ======================================
       COBRANÇAS
       ====================================== */

    /**
     * CONTROLE DE COBRANÇAS
     *
     * A tela apresenta informações financeiras
     * relacionadas aos atendimentos.
     *
     * Quando uma cobrança está pendente,
     * a oficina pode registrar o pagamento.
     *
     * O backend deve validar a autorização
     * e a mudança de status da cobrança.
     */
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

    /* ======================================
       NOTIFICAÇÕES
       ====================================== */

    /**
     * CENTRAL DE NOTIFICAÇÕES
     *
     * Esta tela permite acompanhar avisos
     * relacionados às atividades do sistema.
     *
     * As notificações não lidas são identificadas
     * visualmente e podem ser marcadas como lidas.
     */
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

    /* ======================================
       ADMINISTRAÇÃO DE USUÁRIOS
       ====================================== */

    /**
     * CONSULTA ADMINISTRATIVA
     *
     * O administrador pode visualizar
     * os usuários cadastrados no sistema.
     *
     * A tabela apresenta informações básicas
     * como nome, e-mail e perfil.
     */
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

  /**
   * Caso nenhuma opção corresponda à tela
   * selecionada, retorna conteúdo vazio.
   */
  return "";
}

/* ==========================================
   EXECUÇÃO DE OPERAÇÕES
   ========================================== */

/**
 * EXECUÇÃO CENTRALIZADA DE OPERAÇÕES
 *
 * Centralizei nesta função as operações
 * realizadas pelo frontend no backend Java.
 *
 * Essa organização evita repetir o mesmo
 * tratamento de erros e atualização de dados
 * em diferentes funcionalidades do sistema.
 *
 * Parâmetros:
 * path: endereço do endpoint da API.
 * method: método HTTP utilizado.
 * body: informações enviadas ao servidor.
 * success: mensagem exibida após a operação.
 *
 * Após uma operação bem-sucedida, os dados
 * são consultados novamente para atualizar
 * as informações apresentadas ao usuário.
 */
async function execute(path, method, body, success) {
  try {
    await api(path, method, body);

    // Atualiza os dados após a operação.
    await refresh();

    // Prepara a mensagem de sucesso.
    flash(success);

    // Atualiza a interface.
    render();

  } catch (error) {
    /**
     * Caso ocorra um erro, apresento uma
     * mensagem ao usuário sem interromper
     * completamente a aplicação.
     */
    flash(error.message, true);
    render();
  }
}

/* ==========================================
   EVENTOS E FORMULÁRIOS
   ========================================== */

/**
 * CONFIGURAÇÃO DOS EVENTOS DA INTERFACE
 *
 * Como as telas são geradas dinamicamente,
 * os eventos precisam ser associados aos
 * elementos após sua criação no HTML.
 *
 * A função bind() concentra essa responsabilidade,
 * facilitando a localização e manutenção das
 * interações realizadas pelos usuários.
 */
function bind() {

  /* ======================================
     PESQUISA EXTERNA DE PEÇAS
     ====================================== */

  /**
   * PESQUISA DE PEÇAS AUTOMOTIVAS
   *
   * Permite pesquisar peças considerando
   * o modelo e o ano do veículo.
   *
   * O cliente pode selecionar um veículo
   * cadastrado, enquanto outros perfis
   * podem informar os dados manualmente.
   *
   * A consulta é realizada por meio de links
   * externos para Mercado Livre e OLX.
   *
   * Essa funcionalidade não consulta diretamente
   * o estoque dessas plataformas por uma API.
   */
  const searchForm = document.querySelector("#parts-search");

  if (searchForm) {
    searchForm.onsubmit = event => {
      event.preventDefault();

      const carElement = document.querySelector("#search-car");

      /**
       * Localiza o veículo selecionado
       * entre os registros carregados.
       */
      const vehicle = carElement
        ? data.veiculos.find(item =>
            String(item.id) === carElement.value
          )
        : null;

      /**
       * Utiliza o veículo cadastrado ou
       * o texto informado manualmente.
       */
      const car = vehicle
        ? `${vehicle.modelo} ${vehicle.ano}`
        : document.querySelector("#search-car-free")
            .value.trim();

      const part = document.querySelector("#search-part")
        .value.trim();

      if (!car || !part) return;

      /**
       * Codifica os termos para que possam
       * ser utilizados em endereços de pesquisa.
       */
      const query = encodeURIComponent(
        `${part} ${car}`.trim()
      );

      const mercadoLivre =
        "https://lista.mercadolivre.com.br/" + query;

      const olx =
        "https://www.olx.com.br/brasil?q=" + query;

      /**
       * Apresenta os links de pesquisa.
       *
       * As páginas são abertas em outra aba,
       * preservando a navegação no LaunchControl.
       */
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

  /* ======================================
     CADASTROS DO SISTEMA
     ====================================== */

  /**
   * PROCESSAMENTO DOS FORMULÁRIOS
   *
   * Utilizo o atributo data-form para identificar
   * qual operação deve ser realizada.
   *
   * O FormData permite obter os valores dos
   * campos sem precisar consultar cada input
   * individualmente.
   *
   * Os dados são enviados ao backend, responsável
   * por validá-los e persistir os registros.
   */
  document.querySelectorAll("[data-form]").forEach(formElement => {
    formElement.onsubmit = event => {
      event.preventDefault();

      const values = Object.fromEntries(
        new FormData(formElement)
      );

      const kind = formElement.dataset.form;

      /**
       * CADASTRO DE VEÍCULO
       *
       * Converto ano e quilometragem para números
       * antes de enviar os dados ao backend.
       */
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

      /**
       * ABERTURA DE SOLICITAÇÃO
       *
       * O cliente informa o serviço desejado,
       * seleciona um veículo e escolhe a oficina.
       *
       * Os identificadores são convertidos
       * para números antes do envio.
       */
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

      /**
       * CADASTRO DE PEÇAS
       *
       * Permite ao fornecedor registrar peças
       * com informações de preço e quantidade.
       */
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

  /* ======================================
     NOTIFICAÇÕES
     ====================================== */

  /**
   * MARCAR NOTIFICAÇÃO COMO LIDA
   *
   * O identificador da notificação é utilizado
   * para atualizar seu estado no backend.
   */
  document.querySelectorAll("[data-read]").forEach(button => {
    button.onclick = () => execute(
      "/notificacoes/" + button.dataset.read + "/lida",
      "PUT",
      null,
      "Notificação lida."
    );
  });

  /* ======================================
     APROVAÇÃO DE ORÇAMENTOS
     ====================================== */

  /**
   * DECISÃO DO CLIENTE
   *
   * O cliente pode aprovar ou recusar
   * o orçamento apresentado pela oficina.
   *
   * O valor enviado é booleano:
   * true: orçamento aprovado.
   * false: orçamento recusado.
   */
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

  /* ======================================
     ATUALIZAÇÃO DE STATUS
     ====================================== */

  /**
   * ALTERAÇÃO DA SITUAÇÃO DO SERVIÇO
   *
   * A oficina pode iniciar um atendimento
   * aprovado ou concluir um serviço em execução.
   *
   * Para concluir, é solicitado um laudo técnico,
   * permitindo registrar informações sobre
   * o serviço realizado.
   */
  document.querySelectorAll("[data-status]").forEach(button => {
    button.onclick = () => {
      let laudo = "";

      if (button.dataset.value === "CONCLUIDO") {
        laudo = prompt(
          "Informe o laudo técnico de conclusão:"
        ) || "";

        /**
         * Não permite prosseguir com a conclusão
         * quando o laudo está vazio.
         */
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

  /* ======================================
     ABERTURA DAS FUNCIONALIDADES
     ====================================== */

  /**
   * ORÇAMENTOS
   *
   * Associa o botão de orçamento à função
   * responsável por apresentar seu formulário.
   */
  document.querySelectorAll("[data-quote]").forEach(button => {
    button.onclick = () => quote(button.dataset.quote);
  });

  /**
   * AVALIAÇÕES
   *
   * Abre o formulário de avaliação
   * do atendimento selecionado.
   */
  document.querySelectorAll("[data-review]").forEach(button => {
    button.onclick = () => review(button.dataset.review);
  });

  /**
   * DETALHES DO ATENDIMENTO
   *
   * Apresenta informações completas
   * sobre a solicitação selecionada.
   */
  document.querySelectorAll("[data-detail]").forEach(button => {
    button.onclick = () => detail(button.dataset.detail);
  });

  /* ======================================
     EDIÇÃO DE VEÍCULOS
     ====================================== */

  /**
   * ATUALIZAÇÃO DE VEÍCULOS
   *
   * Permite alterar informações de um veículo
   * previamente cadastrado.
   *
   * Os dados atuais são utilizados como valores
   * iniciais nos campos de edição.
   *
   * A operação utiliza o método HTTP PUT.
   */
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

  /* ======================================
     EXCLUSÃO DE VEÍCULOS
     ====================================== */

  /**
   * EXCLUSÃO DE VEÍCULOS
   *
   * Solicito uma confirmação antes de excluir
   * um veículo para reduzir o risco de
   * remoções acidentais.
   *
   * A exclusão definitiva depende das regras
   * implementadas no backend e das relações
   * existentes no banco de dados.
   */
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

  /* ======================================
     CONTROLE DE PAGAMENTOS
     ====================================== */

  /**
   * REGISTRO DE PAGAMENTO
   *
   * Antes de marcar uma cobrança como paga,
   * apresento uma confirmação ao usuário.
   *
   * O backend recebe o novo status e deve
   * verificar se a alteração é permitida.
   */
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
 * FORMULÁRIO DE ORÇAMENTO
 *
 * Esta funcionalidade permite que a oficina
 * elabore uma proposta para uma solicitação.
 *
 * O orçamento possui valores separados para
 * peças, mão de obra, descontos e adicionais.
 *
 * Também é possível informar o prazo estimado
 * e observações relacionadas ao serviço.
 *
 * A separação desses campos facilita a
 * apresentação dos custos ao cliente.
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

  /**
   * Retorna ao painel anterior sem precisar
   * recarregar a aplicação.
   */
  document.querySelector("#back").onclick = render;

  /**
   * ENVIO DO ORÇAMENTO
   *
   * Os valores do formulário são obtidos
   * por meio de FormData.
   *
   * Como os campos HTML são recebidos como
   * texto, realizo a conversão dos valores
   * numéricos antes de enviar ao backend.
   */
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

      /**
       * Envia o orçamento para a solicitação
       * correspondente.
       *
       * O backend é responsável por validar
       * os valores, calcular o total e registrar
       * a proposta no banco de dados.
       */
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
 * CONSULTA COMPLETA DO ATENDIMENTO
 *
 * Esta função reúne as informações relacionadas
 * a uma solicitação de serviço automotivo.
 *
 * Mantive os detalhes do atendimento em uma
 * função específica para organizar a consulta
 * e a apresentação das informações.
 *
 * São consultados:
 * - Dados gerais da solicitação.
 * - Histórico de orçamentos.
 * - Mensagens entre cliente e oficina.
 * - Arquivos anexados ao atendimento.
 * - Diário de manutenção.
 *
 * As informações são obtidas do backend Java,
 * responsável por consultar os registros
 * persistidos no banco de dados.
 */
async function detail(id) {
  try {
    /**
     * CONSULTA DOS DADOS PRINCIPAIS
     *
     * O identificador da solicitação permite
     * recuperar os dados do atendimento.
     */
    const item = await api("/solicitacoes/" + id);

    /**
     * HISTÓRICO DE ORÇAMENTOS
     *
     * Mantive uma consulta específica para
     * apresentar as propostas registradas
     * durante o atendimento.
     *
     * Isso permite acompanhar alterações
     * realizadas nos valores dos serviços.
     */
    const historico = await api(
      "/solicitacoes/" + id + "/historico-orcamento"
    );

    /**
     * CONVERSA DO ATENDIMENTO
     *
     * Recupera as mensagens trocadas entre
     * os participantes da solicitação.
     */
    const mensagens = await api(
      "/solicitacoes/" + id + "/mensagens"
    );

    /**
     * ANEXOS DO ATENDIMENTO
     *
     * Consulta os registros de arquivos
     * relacionados ao diagnóstico ou serviço.
     */
    const anexos = await api(
      "/solicitacoes/" + id + "/anexos"
    );

    /**
     * DIÁRIO DE MANUTENÇÃO
     *
     * Recupera as observações registradas
     * durante a execução dos serviços.
     */
    const diario = await api(
      "/solicitacoes/" + id + "/diario"
    );

    /* ======================================
       APRESENTAÇÃO DOS DETALHES
       ====================================== */

    /**
     * RENDERIZAÇÃO DOS DADOS
     *
     * As informações consultadas são
     * apresentadas na área principal.
     *
     * Utilizo esc() nos textos recebidos
     * do backend para reduzir riscos
     * associados à inserção de HTML.
     */
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
          /**
           * APRESENTAÇÃO DO ORÇAMENTO
           *
           * Os valores são exibidos somente
           * quando existe uma proposta
           * associada à solicitação.
           *
           * A função money() mantém o padrão
           * monetário brasileiro.
           */
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
          /**
           * HISTÓRICO DAS PROPOSTAS
           *
           * Cada registro apresenta a data,
           * o valor e a descrição da alteração.
           */
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
            /**
             * O laudo final é apresentado
             * quando já foi registrado.
             */
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

        /* ======================================
           DIÁRIO DE MANUTENÇÃO
           ====================================== */

        <h2>Diário de manutenção</h2>

        <p class="muted">
          Atualizações registradas pela oficina.
        </p>

        ${
          /**
           * REGISTROS DE MANUTENÇÃO
           *
           * Apresenta as observações feitas
           * pela oficina durante o atendimento.
           */
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
          /**
           * FORMULÁRIO DO DIÁRIO
           *
           * A oficina pode registrar observações
           * quando o serviço está aprovado,
           * em execução ou concluído.
           *
           * Essa regra controla a apresentação
           * do formulário no frontend.
           */
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
          /**
           * LISTAGEM DE ANEXOS
           *
           * Apresenta os arquivos relacionados
           * ao atendimento e permite abri-los
           * através de um botão específico.
           */
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
          /**
           * ENVIO DE ARQUIVOS
           *
           * Clientes e oficinas podem anexar
           * imagens e vídeos relacionados
           * ao diagnóstico do veículo.
           *
           * O atributo accept orienta os tipos
           * de arquivo selecionáveis.
           */
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
            /**
             * HISTÓRICO DAS MENSAGENS
             *
             * As mensagens são apresentadas
             * com remetente, data e conteúdo.
             */
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
          /**
           * FORMULÁRIO DE MENSAGENS
           *
           * Permite a comunicação entre
           * cliente e oficina durante
           * o acompanhamento do serviço.
           */
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

    /* ======================================
       EVENTOS DOS DETALHES
       ====================================== */

    /**
     * BOTÃO VOLTAR
     *
     * Retorna à interface principal
     * sem atualizar toda a página.
     */
    document.querySelector("#back").onclick = render;

    /* ======================================
       REGISTRO NO DIÁRIO
       ====================================== */

    /**
     * ENVIO DE OBSERVAÇÕES
     *
     * O formulário registra informações
     * relacionadas à manutenção do veículo.
     *
     * Após o envio, os detalhes são consultados
     * novamente para apresentar o novo registro.
     */
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

    /* ======================================
       ENVIO DE ANEXOS
       ====================================== */

    /**
     * PROCESSAMENTO DE ARQUIVOS
     *
     * O frontend verifica o tamanho do arquivo
     * antes de iniciar o envio.
     *
     * O limite definido nesta interface
     * é de 3 MB por arquivo.
     *
     * O backend também deve validar tamanho,
     * formato e autorização do usuário.
     */
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

        /**
         * VALIDAÇÃO DE TAMANHO
         *
         * Impede o envio pela interface
         * quando o arquivo ultrapassa 3 MB.
         */
        if (file.size > 3 * 1024 * 1024) {
          alert("Arquivo deve ter no máximo 3 MB.");
          return;
        }

        try {
          /**
           * CONVERSÃO PARA BASE64
           *
           * Utilizo FileReader para converter
           * o arquivo em uma representação
           * que pode ser enviada no JSON.
           *
           * A conversão é assíncrona porque
           * depende da leitura do arquivo.
           */
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

          /**
           * ENVIO PARA O BACKEND
           *
           * São enviados o nome, o tipo
           * e o conteúdo codificado do arquivo.
           */
          await api(
            "/solicitacoes/" + id + "/anexos",
            "POST",
            {
              nome: file.name,
              tipo: file.type,
              base64
            }
          );

          /**
           * Atualiza a tela para apresentar
           * o arquivo enviado.
           */
          await detail(id);
        } catch (error) {
          alert(error.message);
        }
      };
    }

    /* ======================================
       ABERTURA DOS ANEXOS
       ====================================== */

    /**
     * VISUALIZAÇÃO DE ARQUIVOS
     *
     * O arquivo é solicitado ao backend
     * com as credenciais do usuário.
     *
     * A resposta é convertida em Blob
     * e disponibilizada por uma URL temporária.
     */
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

          /**
           * Abre o arquivo em uma nova aba,
           * preservando a tela do atendimento.
           */
          window.open(url, "_blank", "noopener");

          /**
           * Libera a URL temporária após
           * o período definido.
           */
          setTimeout(
            () => URL.revokeObjectURL(url),
            60000
          );
        } catch (error) {
          alert(error.message);
        }
      };
    });

    /* ======================================
       MENSAGENS DO ATENDIMENTO
       ====================================== */

    /**
     * ENVIO DE MENSAGENS
     *
     * Permite registrar a comunicação
     * entre os participantes do atendimento.
     *
     * Após o envio, os dados são atualizados
     * e a conversa é carregada novamente.
     */
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
    /**
     * TRATAMENTO DE ERROS
     *
     * Se alguma consulta falhar,
     * apresento a mensagem de erro
     * e retorno à interface principal.
     */
    flash(error.message, true);
    render();
  }
}

/* ==========================================
   AVALIAÇÃO DE SERVIÇOS
   ========================================== */

/**
 * AVALIAÇÃO DO ATENDIMENTO
 *
 * Esta funcionalidade permite que o cliente
 * registre sua opinião sobre o serviço realizado.
 *
 * A avaliação utiliza uma nota de 1 a 5
 * e um comentário opcional.
 *
 * O objetivo é permitir o acompanhamento
 * da satisfação dos clientes.
 */
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

  /**
   * Retorna à tela anterior sem
   * recarregar toda a aplicação.
   */
  document.querySelector("#back").onclick = render;

  /**
   * PROCESSAMENTO DA AVALIAÇÃO
   *
   * Os valores do formulário são coletados
   * e enviados ao backend.
   *
   * A nota é convertida para número
   * antes de realizar a requisição.
   */
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

/**
 * INICIALIZAÇÃO DO LAUNCHCONTROL
 *
 * A aplicação começa apresentando a tela
 * de autenticação.
 *
 * Após o login, as informações do usuário
 * são carregadas e a interface principal
 * é renderizada.
 *
 * Mantive a inicialização no final do arquivo
 * para que as funções estejam declaradas
 * antes de sua primeira utilização.
 */
loginScreen();
