/* =========================================================
   LaunchControl — script.js
   Protótipo com dados mockados e persistência em localStorage
   (ainda sem backend / API real).

   Pontos de integração futura com API/banco de dados real:
   - autenticarUsuario()        -> chamada de login (POST /auth/login)
   - salvarEstado()/carregarEstado() -> troca de localStorage por
     chamadas reais de leitura/escrita (GET/POST/PUT em endpoints)
   - envio de orçamento, aprovação/recusa -> endpoints dedicados
   ========================================================= */

// =========================================================
// 0. CHAVES DE ARMAZENAMENTO (localStorage)
// =========================================================
const LS_KEYS = {
  SESSAO: "lc_sessao",
  SOLICITACOES: "lc_solicitacoes",
  CLIENTES: "lc_clientes",
  OFICINAS: "lc_oficinas"
};

// =========================================================
// 1. DADOS MOCKADOS (seed inicial — usado apenas se o
//    localStorage ainda estiver vazio)
// =========================================================

// ---- Usuários da OFICINA (login tipo "oficina") ----
const OFICINAS_SEED = [
  { cpf: "11111111111", senha: "123456", nome: "Carlos Mendes", cargo: "Atendente" },
  { cpf: "77777777777", senha: "123456", nome: "Patrícia Nogueira", cargo: "Gerente" }
];

// ---- Clientes finais da oficina (login tipo "cliente") ----
const CLIENTES_SEED = [
  {
    cpf: "22222222222", senha: "123456", nome: "João Silva",
    telefone: "(11) 98765-4321", email: "joao.silva@email.com",
    veiculos: [
      { modelo: "Honda Civic", ano: 2020, placa: "ABC1D23", km: "42.300 km" }
    ]
  },
  {
    cpf: "33333333333", senha: "123456", nome: "Mariana Souza",
    telefone: "(11) 91234-5678", email: "mariana.souza@email.com",
    veiculos: [
      { modelo: "Fiat Argo", ano: 2022, placa: "DEF4E56", km: "18.900 km" },
      { modelo: "Hyundai HB20", ano: 2021, placa: "HJK7L89", km: "31.200 km" }
    ]
  },
  {
    cpf: "44444444444", senha: "123456", nome: "Ricardo Alves",
    telefone: "(11) 99887-6655", email: "ricardo.alves@email.com",
    veiculos: [
      { modelo: "Chevrolet Onix", ano: 2019, placa: "GHI9J01", km: "63.500 km" },
      { modelo: "Toyota Corolla", ano: 2023, placa: "MNO2P34", km: "9.400 km" }
    ]
  },
  {
    cpf: "55555555555", senha: "123456", nome: "Fernanda Lima",
    telefone: "(11) 97777-2233", email: "fernanda.lima@email.com",
    veiculos: [
      { modelo: "Volkswagen Gol", ano: 2018, placa: "QRS5T67", km: "78.100 km" }
    ]
  }
];

// ---- Solicitações de orçamento (ligadas a um cliente via clienteId = CPF) ----
const SOLICITACOES_SEED = [
  {
    id: 101,
    clienteId: "22222222222",
    cliente: "João Silva",
    telefone: "(11) 98765-4321",
    veiculo: "Honda Civic",
    ano: 2020,
    km: "42.300 km",
    servico: "Troca de pastilhas de freio",
    descricao: "Barulho ao frear e pedal um pouco mais fundo que o normal.",
    data: "17/08/2026",
    fotos: 2,
    status: "aprovacao", // orçamento já elaborado, aguardando resposta do cliente
    orcamento: {
      servico: "Revisão do veículo",
      descricao: "Revisão preventiva com troca de peças de desgaste.",
      pecas: [
        { id: 1, nome: "Pastilhas de freio dianteiras", descricao: "", quantidade: 1, valorUnitario: 280, total: 280, aprovado: null },
        { id: 2, nome: "Óleo do motor 5W30", descricao: "", quantidade: 4, valorUnitario: 45, total: 180, aprovado: null },
        { id: 3, nome: "Filtro de óleo", descricao: "", quantidade: 1, valorUnitario: 35, total: 35, aprovado: null },
        { id: 4, nome: "Filtro de ar", descricao: "", quantidade: 1, valorUnitario: 65, total: 65, aprovado: null },
        { id: 5, nome: "Filtro de combustível", descricao: "", quantidade: 1, valorUnitario: 50, total: 50, aprovado: null }
      ],
      maoDeObra: [
        { id: 1, descricao: "Troca das pastilhas", quantidade: 1, valorUnitario: 100, total: 100, aprovado: null },
        { id: 2, descricao: "Troca de óleo e filtros", quantidade: 1, valorUnitario: 80, total: 80, aprovado: null }
      ],
      subtotalPecas: 610,
      subtotalMaoDeObra: 180,
      total: 790,
      valorAprovado: null,
      prazo: "2 horas",
      obs: "Recomendamos alinhamento na próxima visita."
    },
    entrada: null,
    previsao: null
  },
  {
    id: 102,
    clienteId: "33333333333",
    cliente: "Mariana Souza",
    telefone: "(11) 91234-5678",
    veiculo: "Fiat Argo",
    ano: 2022,
    km: "18.900 km",
    servico: "Revisão dos 20.000 km",
    descricao: "Revisão programada de acordo com o manual do fabricante.",
    data: "16/08/2026",
    fotos: 0,
    status: "analise", // em análise pela oficina — ainda sem orçamento
    orcamento: null,
    entrada: null,
    previsao: null
  },
  {
    id: 103,
    clienteId: "44444444444",
    cliente: "Ricardo Alves",
    telefone: "(11) 99887-6655",
    veiculo: "Chevrolet Onix",
    ano: 2019,
    km: "63.500 km",
    servico: "Troca de amortecedores",
    descricao: "Carro balançando muito em lombadas e buracos.",
    data: "15/08/2026",
    fotos: 3,
    status: "aprovacao",
    orcamento: {
      servico: "Troca de amortecedores dianteiros",
      descricao: "Substituição do par de amortecedores dianteiros e alinhamento.",
      pecas: [
        { id: 1, nome: "Amortecedores dianteiros (par)", descricao: "", quantidade: 1, valorUnitario: 480, total: 480, aprovado: null }
      ],
      maoDeObra: [
        { id: 1, descricao: "Troca dos amortecedores e alinhamento", quantidade: 1, valorUnitario: 220, total: 220, aprovado: null }
      ],
      subtotalPecas: 480,
      subtotalMaoDeObra: 220,
      total: 700,
      valorAprovado: null,
      prazo: "3 horas",
      obs: "Recomendado alinhamento e balanceamento após a troca."
    },
    entrada: null,
    previsao: null
  },
  {
    id: 104,
    clienteId: "55555555555",
    cliente: "Fernanda Lima",
    telefone: "(11) 97777-2233",
    veiculo: "Volkswagen Gol",
    ano: 2018,
    km: "78.100 km",
    servico: "Troca de correia dentada",
    descricao: "Manutenção preventiva indicada pelo manual do veículo.",
    data: "12/08/2026",
    fotos: 1,
    status: "execucao",
    orcamento: {
      servico: "Troca de correia dentada e tensor",
      descricao: "Substituição da correia dentada, tensor e bomba d'água.",
      pecas: [
        { id: 1, nome: "Kit correia dentada", descricao: "", quantidade: 1, valorUnitario: 250, total: 250, aprovado: true },
        { id: 2, nome: "Bomba d'água", descricao: "", quantidade: 1, valorUnitario: 140, total: 140, aprovado: true }
      ],
      maoDeObra: [
        { id: 1, descricao: "Substituição da correia, tensor e bomba d'água", quantidade: 1, valorUnitario: 260, total: 260, aprovado: true }
      ],
      subtotalPecas: 390,
      subtotalMaoDeObra: 260,
      total: 650,
      valorAprovado: 650,
      prazo: "4 horas",
      obs: ""
    },
    entrada: "13/08/2026",
    previsao: "18/08/2026"
  },
  {
    id: 105,
    clienteId: "33333333333",
    cliente: "Mariana Souza",
    telefone: "(11) 91234-5678",
    veiculo: "Hyundai HB20",
    ano: 2021,
    km: "31.200 km",
    servico: "Troca de óleo e filtros",
    descricao: "Troca de óleo do motor e filtros de óleo e ar.",
    data: "08/08/2026",
    fotos: 0,
    status: "concluido",
    orcamento: {
      servico: "Troca de óleo e filtros",
      descricao: "Óleo sintético 5W30 + filtro de óleo e filtro de ar.",
      pecas: [
        { id: 1, nome: "Óleo 5W30", descricao: "", quantidade: 4, valorUnitario: 45, total: 180, aprovado: true },
        { id: 2, nome: "Filtro de óleo", descricao: "", quantidade: 1, valorUnitario: 30, total: 30, aprovado: true }
      ],
      maoDeObra: [
        { id: 1, descricao: "Troca de óleo e filtros", quantidade: 1, valorUnitario: 60, total: 60, aprovado: true }
      ],
      subtotalPecas: 210,
      subtotalMaoDeObra: 60,
      total: 270,
      valorAprovado: 270,
      prazo: "1 hora",
      obs: ""
    },
    entrada: "08/08/2026",
    previsao: "08/08/2026"
  },
  {
    id: 106,
    clienteId: "44444444444",
    cliente: "Ricardo Alves",
    telefone: "(11) 99887-6655",
    veiculo: "Toyota Corolla",
    ano: 2023,
    km: "9.400 km",
    servico: "Diagnóstico de luz no painel",
    descricao: "Luz de injeção eletrônica acesa no painel intermitentemente.",
    data: "17/08/2026",
    fotos: 1,
    status: "aguardando",
    orcamento: null,
    entrada: null,
    previsao: null
  }
];

// =========================================================
// 2. ESTADO EM MEMÓRIA (carregado do localStorage ou do seed)
// =========================================================
let oficinas = [];
let clientes = [];
let solicitacoes = [];
let sessao = null; // { tipo: 'oficina'|'cliente', cpf, nome, ... }

function carregarEstado(){
  oficinas = lerLS(LS_KEYS.OFICINAS, OFICINAS_SEED);
  clientes = lerLS(LS_KEYS.CLIENTES, CLIENTES_SEED);
  solicitacoes = lerLS(LS_KEYS.SOLICITACOES, SOLICITACOES_SEED);
  sessao = lerLS(LS_KEYS.SESSAO, null);
}

function lerLS(chave, padrao){
  try{
    const bruto = localStorage.getItem(chave);
    if (!bruto) return JSON.parse(JSON.stringify(padrao));
    return JSON.parse(bruto);
  }catch(e){
    return JSON.parse(JSON.stringify(padrao));
  }
}

function salvarSolicitacoes(){
  // Futuro: PUT /solicitacoes (ou por item) em vez de localStorage.
  localStorage.setItem(LS_KEYS.SOLICITACOES, JSON.stringify(solicitacoes));
}
function salvarClientes(){
  localStorage.setItem(LS_KEYS.CLIENTES, JSON.stringify(clientes));
}
function salvarOficinas(){
  localStorage.setItem(LS_KEYS.OFICINAS, JSON.stringify(oficinas));
}
function salvarSessao(){
  if (sessao) localStorage.setItem(LS_KEYS.SESSAO, JSON.stringify(sessao));
  else localStorage.removeItem(LS_KEYS.SESSAO);
}

const STATUS_INFO = {
  aguardando:       { label: "Aguardando análise",             cls: "status--aguardando" },
  analise:          { label: "Em análise",                     cls: "status--analise" },
  aprovacao:        { label: "Aguardando aprovação do cliente", cls: "status--aprovacao" },
  aprovado:         { label: "Aprovado pelo cliente",           cls: "status--aprovado" },
  aprovado_parcial: { label: "Aprovado parcialmente",           cls: "status--aprovacao" },
  execucao:         { label: "Em execução",                     cls: "status--execucao" },
  concluido:        { label: "Concluído",                       cls: "status--concluido" },
  recusado:         { label: "Recusado pela oficina",           cls: "status--recusado" },
  recusado_cliente: { label: "Recusado pelo cliente",           cls: "status--recusado" }
};

function formatBRL(v){
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function statusBadge(statusKey){
  const s = STATUS_INFO[statusKey] || { label: statusKey, cls: "status--aguardando" };
  return `<span class="status ${s.cls}">${s.label}</span>`;
}
function iniciais(nome){
  return (nome || "").split(" ").filter(Boolean).slice(0,2).map(p => p[0].toUpperCase()).join("");
}

// =========================================================
// 3. AUTENTICAÇÃO (simulada)
// =========================================================

// Validação simplificada de CPF: exige 11 dígitos numéricos.
// OBS: os CPFs de teste usados neste protótipo (111.111.111-11 etc.)
// são sequências repetidas e não passariam no algoritmo oficial
// (módulo 11), por isso a checagem aqui fica no nível de formato.
// Ponto de integração futura: plugar validação completa (mod 11)
// quando os CPFs deixarem de ser mockados.
function apenasDigitos(v){ return (v || "").replace(/\D/g, ""); }

function cpfValido(cpfDigits){
  if (cpfDigits.length !== 11) return false;
  return true;
}

function mascararCpf(valor){
  let d = apenasDigitos(valor).slice(0, 11);
  if (d.length > 9) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  if (d.length > 6) return d.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  if (d.length > 3) return d.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  return d;
}

function mascararTelefone(valor){
  let d = apenasDigitos(valor).slice(0, 11);
  if (d.length > 10) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length > 6) return d.replace(/(\d{2})(\d{4})(\d{1,4})/, "($1) $2-$3");
  if (d.length > 2) return d.replace(/(\d{2})(\d{1,5})/, "($1) $2");
  if (d.length > 0) return d.replace(/(\d{1,2})/, "($1");
  return d;
}

function emailValido(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cpfJaCadastrado(cpfDigits){
  return oficinas.some(o => o.cpf === cpfDigits) || clientes.some(c => c.cpf === cpfDigits);
}

function cadastrarUsuario(tipo, dados){
  // Futuro: substituir por chamada real, ex.
  // POST /auth/cadastro { tipo, ...dados } -> { token, usuario }
  if (cpfJaCadastrado(dados.cpf)){
    return { ok: false, motivo: "Já existe uma conta cadastrada com esse CPF." };
  }
  if (tipo === "oficina"){
    const novaOficina = {
      cpf: dados.cpf,
      senha: dados.senha,
      nome: dados.nome,
      cargo: dados.cargo || "Atendente"
    };
    oficinas.push(novaOficina);
    salvarOficinas();
    return { ok: true, usuario: novaOficina };
  } else {
    const novoCliente = {
      cpf: dados.cpf,
      senha: dados.senha,
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      veiculos: []
    };
    clientes.push(novoCliente);
    salvarClientes();
    return { ok: true, usuario: novoCliente };
  }
}

function autenticarUsuario(tipo, cpfDigits, senha){
  // Futuro: substituir por chamada real, ex.
  // POST /auth/login { tipo, cpf, senha } -> { token, usuario }
  if (tipo === "oficina"){
    const u = oficinas.find(o => o.cpf === cpfDigits);
    if (!u) return { ok: false, motivo: "CPF não encontrado para oficina." };
    if (u.senha !== senha) return { ok: false, motivo: "Senha incorreta." };
    return { ok: true, usuario: u };
  } else {
    const u = clientes.find(c => c.cpf === cpfDigits);
    if (!u) return { ok: false, motivo: "CPF não encontrado para cliente." };
    if (u.senha !== senha) return { ok: false, motivo: "Senha incorreta." };
    return { ok: true, usuario: u };
  }
}

function iniciarSessao(tipo, usuario){
  sessao = { tipo, cpf: usuario.cpf, nome: usuario.nome };
  salvarSessao();
}
function encerrarSessao(){
  sessao = null;
  salvarSessao();
  mostrarTelaLogin();
}

function mostrarTelaLogin(){
  document.getElementById("telaCadastro").style.display = "none";
  document.getElementById("telaSobreNos").style.display = "none";
  document.getElementById("telaLogin").style.display = "flex";
  document.getElementById("appOficina").style.display = "none";
  document.getElementById("appCliente").style.display = "none";
  document.getElementById("formLogin").reset();
  document.getElementById("loginCpf").value = "";
  document.getElementById("erroLogin").textContent = "";
  document.getElementById("erroCpf").textContent = "";
  document.getElementById("erroSenha").textContent = "";
}

function mostrarTelaSobreNos(){
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("telaCadastro").style.display = "none";
  document.getElementById("appOficina").style.display = "none";
  document.getElementById("appCliente").style.display = "none";
  document.getElementById("telaSobreNos").style.display = "block";
}

function mostrarTelaCadastro(){
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("telaSobreNos").style.display = "none";
  document.getElementById("appOficina").style.display = "none";
  document.getElementById("appCliente").style.display = "none";
  document.getElementById("telaCadastro").style.display = "flex";
  document.getElementById("formCadastro").reset();
  document.getElementById("cadastroTipo").value = "cliente";
  document.querySelectorAll("#tipoCadastroSeg .segmented__opt").forEach(b =>
    b.classList.toggle("is-active", b.dataset.tipo === "cliente"));
  atualizarCamposCadastro("cliente");
  ["erroCadastroNome","erroCadastroCpf","erroCadastroTelefone","erroCadastroEmail",
   "erroCadastroCargo","erroCadastroSenha","erroCadastroConfirmarSenha","erroCadastro"]
    .forEach(id => document.getElementById(id).textContent = "");
}

function atualizarCamposCadastro(tipo){
  const ehOficina = tipo === "oficina";
  document.getElementById("campoCadastroCargo").style.display = ehOficina ? "flex" : "none";
  document.getElementById("campoCadastroTelefone").style.display = ehOficina ? "none" : "flex";
  document.getElementById("campoCadastroEmail").style.display = ehOficina ? "none" : "flex";
}

function entrarComoOficina(usuario){
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("telaSobreNos").style.display = "none";
  document.getElementById("appCliente").style.display = "none";
  document.getElementById("appOficina").style.display = "block";
  document.getElementById("oficinaNome").textContent = usuario.nome;
  document.getElementById("oficinaCargo").textContent = usuario.cargo || "Atendente";
  document.getElementById("oficinaAvatar").textContent = iniciais(usuario.nome);
  goToView("dashboard");
}

function entrarComoCliente(usuario){
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("telaSobreNos").style.display = "none";
  document.getElementById("appOficina").style.display = "none";
  document.getElementById("appCliente").style.display = "block";
  document.getElementById("cliNomeTopo").textContent = usuario.nome;
  document.getElementById("cliNomeSaudacao").textContent = (usuario.nome || "").split(" ")[0];
  document.getElementById("cliAvatar").textContent = iniciais(usuario.nome);
  goToViewCli("dashboard");
}

function restaurarSessaoSeExistir(){
  if (!sessao) { mostrarTelaLogin(); return; }
  if (sessao.tipo === "oficina"){
    const u = oficinas.find(o => o.cpf === sessao.cpf);
    if (u) { entrarComoOficina(u); return; }
  } else if (sessao.tipo === "cliente"){
    const u = clientes.find(c => c.cpf === sessao.cpf);
    if (u) { entrarComoCliente(u); return; }
  }
  // sessão inválida/corrompida
  encerrarSessao();
}

// ---- Eventos da tela de login ----
document.getElementById("tipoUsuarioSeg").addEventListener("click", (e) => {
  const btn = e.target.closest(".segmented__opt");
  if (!btn) return;
  document.querySelectorAll(".segmented__opt").forEach(b => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  document.getElementById("loginTipo").value = btn.dataset.tipo;
});

document.getElementById("loginCpf").addEventListener("input", (e) => {
  e.target.value = mascararCpf(e.target.value);
});

document.getElementById("btnEsqueciSenha").addEventListener("click", () => {
  mostrarToast("Funcionalidade simulada: entre em contato com o suporte da LaunchControl.");
});

document.getElementById("formLogin").addEventListener("submit", (e) => {
  e.preventDefault();
  const tipo = document.getElementById("loginTipo").value;
  const cpfDigits = apenasDigitos(document.getElementById("loginCpf").value);
  const senha = document.getElementById("loginSenha").value;

  const erroCpfEl = document.getElementById("erroCpf");
  const erroSenhaEl = document.getElementById("erroSenha");
  const erroLoginEl = document.getElementById("erroLogin");
  erroCpfEl.textContent = "";
  erroSenhaEl.textContent = "";
  erroLoginEl.textContent = "";

  let temErro = false;
  if (!cpfValido(cpfDigits)){
    erroCpfEl.textContent = "Informe um CPF válido no formato 000.000.000-00.";
    temErro = true;
  }
  if (!senha || senha.length < 4){
    erroSenhaEl.textContent = "Informe sua senha.";
    temErro = true;
  }
  if (temErro) return;

  const resultado = autenticarUsuario(tipo, cpfDigits, senha);
  if (!resultado.ok){
    erroLoginEl.textContent = resultado.motivo;
    return;
  }

  iniciarSessao(tipo, resultado.usuario);
  if (tipo === "oficina") entrarComoOficina(resultado.usuario);
  else entrarComoCliente(resultado.usuario);
  mostrarToast(`Bem-vindo(a), ${resultado.usuario.nome.split(" ")[0]}!`);
});

document.getElementById("btnLogoutOficina").addEventListener("click", encerrarSessao);
document.getElementById("btnLogoutCliente").addEventListener("click", encerrarSessao);

// ---- Eventos da tela de cadastro ----
document.getElementById("btnIrParaCadastro").addEventListener("click", mostrarTelaCadastro);
document.getElementById("btnVoltarParaLogin").addEventListener("click", mostrarTelaLogin);

// ---- Eventos da tela "Sobre nós" ----
document.getElementById("btnIrParaSobreNos").addEventListener("click", mostrarTelaSobreNos);
document.getElementById("linkSobreNosInicio").addEventListener("click", (e) => { e.preventDefault(); mostrarTelaLogin(); });
document.getElementById("btnSobreNosEntrar").addEventListener("click", mostrarTelaLogin);
document.getElementById("btnSobreNosEntrarBand").addEventListener("click", mostrarTelaLogin);
document.getElementById("btnSobreNosCriarConta").addEventListener("click", mostrarTelaCadastro);
document.getElementById("btnSobreNosCriarContaBand").addEventListener("click", mostrarTelaCadastro);

document.getElementById("tipoCadastroSeg").addEventListener("click", (e) => {
  const btn = e.target.closest(".segmented__opt");
  if (!btn) return;
  document.querySelectorAll("#tipoCadastroSeg .segmented__opt").forEach(b => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  document.getElementById("cadastroTipo").value = btn.dataset.tipo;
  atualizarCamposCadastro(btn.dataset.tipo);
});

document.getElementById("cadastroCpf").addEventListener("input", (e) => {
  e.target.value = mascararCpf(e.target.value);
});
document.getElementById("cadastroTelefone").addEventListener("input", (e) => {
  e.target.value = mascararTelefone(e.target.value);
});

document.getElementById("formCadastro").addEventListener("submit", (e) => {
  e.preventDefault();
  const tipo = document.getElementById("cadastroTipo").value;
  const nome = document.getElementById("cadastroNome").value.trim();
  const cpfDigits = apenasDigitos(document.getElementById("cadastroCpf").value);
  const telefone = document.getElementById("cadastroTelefone").value.trim();
  const email = document.getElementById("cadastroEmail").value.trim();
  const cargo = document.getElementById("cadastroCargo").value.trim();
  const senha = document.getElementById("cadastroSenha").value;
  const confirmarSenha = document.getElementById("cadastroConfirmarSenha").value;

  const erros = {
    erroCadastroNome: "", erroCadastroCpf: "", erroCadastroTelefone: "",
    erroCadastroEmail: "", erroCadastroCargo: "", erroCadastroSenha: "",
    erroCadastroConfirmarSenha: "", erroCadastro: ""
  };

  let temErro = false;
  if (!nome || nome.length < 3){
    erros.erroCadastroNome = "Informe seu nome completo.";
    temErro = true;
  }
  if (!cpfValido(cpfDigits)){
    erros.erroCadastroCpf = "Informe um CPF válido no formato 000.000.000-00.";
    temErro = true;
  }
  if (tipo === "cliente"){
    if (apenasDigitos(telefone).length < 10){
      erros.erroCadastroTelefone = "Informe um telefone válido com DDD.";
      temErro = true;
    }
    if (!emailValido(email)){
      erros.erroCadastroEmail = "Informe um e-mail válido.";
      temErro = true;
    }
  }
  if (!senha || senha.length < 6){
    erros.erroCadastroSenha = "A senha deve ter no mínimo 6 caracteres.";
    temErro = true;
  }
  if (senha !== confirmarSenha){
    erros.erroCadastroConfirmarSenha = "As senhas não coincidem.";
    temErro = true;
  }

  Object.keys(erros).forEach(id => document.getElementById(id).textContent = erros[id]);
  if (temErro) return;

  const resultado = cadastrarUsuario(tipo, { nome, cpf: cpfDigits, telefone, email, cargo, senha });
  if (!resultado.ok){
    document.getElementById("erroCadastro").textContent = resultado.motivo;
    return;
  }

  iniciarSessao(tipo, resultado.usuario);
  if (tipo === "oficina") entrarComoOficina(resultado.usuario);
  else entrarComoCliente(resultado.usuario);
  mostrarToast(`Conta criada com sucesso! Bem-vindo(a), ${resultado.usuario.nome.split(" ")[0]}!`);
});

// =========================================================
// 4. NAVEGAÇÃO — PAINEL DA OFICINA
// =========================================================
document.querySelectorAll(".nav-link, .link-more").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    goToView(link.dataset.view);
  });
});

function goToView(viewName){
  document.querySelectorAll("#appOficina .view").forEach(v => v.classList.remove("is-active"));
  const alvo = document.getElementById(`view-${viewName}`);
  if (alvo) alvo.classList.add("is-active");

  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("is-active"));
  const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
  if (activeLink) activeLink.classList.add("is-active");

  renderAll();
}

// =========================================================
// 5. NAVEGAÇÃO — PAINEL DO CLIENTE
// =========================================================
document.querySelectorAll(".nav-link-cli, .link-more-cli").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    goToViewCli(link.dataset.viewCli);
  });
});

function goToViewCli(viewName){
  document.querySelectorAll("#appCliente .view").forEach(v => v.classList.remove("is-active"));
  const alvo = document.getElementById(`viewcli-${viewName}`);
  if (alvo) alvo.classList.add("is-active");

  document.querySelectorAll(".nav-link-cli").forEach(l => l.classList.remove("is-active"));
  const activeLink = document.querySelector(`.nav-link-cli[data-view-cli="${viewName}"]`);
  if (activeLink) activeLink.classList.add("is-active");

  renderCliente();
}

// Helpers de permissão: solicitações do cliente logado
function solicitacoesDoCliente(){
  if (!sessao || sessao.tipo !== "cliente") return [];
  return solicitacoes.filter(s => s.clienteId === sessao.cpf);
}
function clienteAtual(){
  if (!sessao || sessao.tipo !== "cliente") return null;
  return clientes.find(c => c.cpf === sessao.cpf) || null;
}

// =========================================================
// 6. RENDERIZAÇÃO — PAINEL DA OFICINA
// =========================================================
function renderAll(){
  renderKpis();
  renderRequestList(document.getElementById("recentRequests"), solicitacoes.slice(0, 3));
  renderRequestList(document.getElementById("allRequests"), solicitacoes);
  renderOrcamentosTable();
  renderAndamentoTable();
  renderConcluidosTable();
  renderClientesTable();
  renderVeiculosTable();
}

function renderKpis(){
  const novas = solicitacoes.filter(s => s.status === "aguardando").length;
  const pendentes = solicitacoes.filter(s => s.status === "aprovacao" || s.status === "aprovado_parcial").length;
  const andamento = solicitacoes.filter(s => s.status === "execucao" || s.status === "aprovado").length;
  const concluidos = solicitacoes.filter(s => s.status === "concluido").length;

  const cards = [
    { label: "Novas solicitações", value: novas, icon: "📥", color: "var(--accent)" },
    { label: "Orçamentos pendentes", value: pendentes, icon: "🧾", color: "var(--amber)" },
    { label: "Serviços em andamento", value: andamento, icon: "🔧", color: "var(--purple)" },
    { label: "Serviços concluídos", value: concluidos, icon: "✅", color: "var(--teal)" }
  ];

  document.getElementById("kpiCards").innerHTML = cards.map(c => `
    <div class="kpi-card" style="--kpi-color:${c.color}">
      <span class="kpi-icon">${c.icon}</span>
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value">${c.value}</div>
    </div>
  `).join("");
}

function renderRequestList(container, list){
  if (!container) return;
  if (list.length === 0){
    container.innerHTML = `<p style="color:var(--ink-soft); padding:20px 0;">Nenhuma solicitação por aqui.</p>`;
    return;
  }
  container.innerHTML = list.map(s => `
    <div class="req-card">
      <div class="req-card__main">
        <div class="req-field"><span class="k">Cliente</span><span class="v">${s.cliente}</span></div>
        <div class="req-field"><span class="k">Veículo</span><span class="v">${s.veiculo} · ${s.ano}</span></div>
        <div class="req-field"><span class="k">Serviço</span><span class="v">${s.servico}</span></div>
        <div class="req-field"><span class="k">Data</span><span class="v mono">${s.data}</span></div>
      </div>
      <div>${statusBadge(s.status)}</div>
      <button class="btn btn--outline" data-detalhe="${s.id}">Visualizar</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-detalhe]").forEach(btn => {
    btn.addEventListener("click", () => abrirDetalhe(Number(btn.dataset.detalhe)));
  });
}

function renderOrcamentosTable(){
  const tbody = document.querySelector("#orcamentosTable tbody");
  const comOrcamento = solicitacoes.filter(s => s.orcamento);
  if (comOrcamento.length === 0){
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--ink-soft); padding:24px 0;">Nenhum orçamento elaborado ainda.</td></tr>`;
    return;
  }
  tbody.innerHTML = comOrcamento.map(s => `
    <tr class="row-click" data-orc-detalhe="${s.id}">
      <td>${s.cliente}</td>
      <td>${s.veiculo}</td>
      <td>${s.orcamento.servico}</td>
      <td class="mono">${formatBRL(s.orcamento.total)}</td>
      <td>${statusBadge(s.status)}</td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-orc-detalhe]").forEach(tr => {
    tr.addEventListener("click", () => abrirDetalheOrcamentoOficina(Number(tr.dataset.orcDetalhe)));
  });
}

function renderAndamentoTable(){
  const tbody = document.querySelector("#andamentoTable tbody");
  const emAndamento = solicitacoes.filter(s =>
    ["aprovacao", "aprovado_parcial", "aprovado", "execucao"].includes(s.status)
  );
  if (emAndamento.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--ink-soft); padding:24px 0;">Nenhum serviço em andamento.</td></tr>`;
    return;
  }
  tbody.innerHTML = emAndamento.map(s => `
    <tr>
      <td>${s.cliente}</td>
      <td>${s.veiculo}</td>
      <td>${s.servico}</td>
      <td class="mono">${s.entrada || "—"}</td>
      <td class="mono">${s.previsao || "—"}</td>
      <td>${statusBadge(s.status)}</td>
    </tr>
  `).join("");
}

function renderConcluidosTable(){
  const tbody = document.querySelector("#concluidosTable tbody");
  if (!tbody) return;
  const concluidos = solicitacoes.filter(s => s.status === "concluido");
  if (concluidos.length === 0){
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--ink-soft); padding:24px 0;">Nenhum serviço concluído ainda.</td></tr>`;
    return;
  }
  tbody.innerHTML = concluidos.map(s => `
    <tr>
      <td>${s.cliente}</td>
      <td>${s.veiculo}</td>
      <td>${s.servico}</td>
      <td class="mono">${s.data}</td>
      <td class="mono">${s.orcamento ? formatBRL(s.orcamento.total) : "—"}</td>
    </tr>
  `).join("");
}

function renderClientesTable(){
  const tbody = document.querySelector("#clientesTable tbody");
  if (!tbody) return;
  if (clientes.length === 0){
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--ink-soft); padding:24px 0;">Nenhum cliente cadastrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td>${c.nome}</td>
      <td class="mono">${mascararCpf(c.cpf)}</td>
      <td class="mono">${c.telefone}</td>
      <td>${c.email}</td>
      <td>${c.veiculos.map(v => v.modelo).join(", ")}</td>
    </tr>
  `).join("");
}

function renderVeiculosTable(){
  const tbody = document.querySelector("#veiculosTable tbody");
  if (!tbody) return;
  const linhas = [];
  clientes.forEach(c => {
    c.veiculos.forEach(v => {
      const ultima = solicitacoes
        .filter(s => s.clienteId === c.cpf && s.veiculo === v.modelo)
        .sort((a,b) => (a.id < b.id ? 1 : -1))[0];
      linhas.push(`
        <tr>
          <td>${v.modelo} <span class="mono" style="color:var(--ink-soft)">(${v.placa})</span></td>
          <td>${v.ano}</td>
          <td>${c.nome}</td>
          <td>${ultima ? ultima.servico : "—"}</td>
        </tr>
      `);
    });
  });
  tbody.innerHTML = linhas.length
    ? linhas.join("")
    : `<tr><td colspan="4" style="color:var(--ink-soft); padding:24px 0;">Nenhum veículo cadastrado.</td></tr>`;
}

// =========================================================
// 7. MODAL: DETALHES DA SOLICITAÇÃO (oficina)
// =========================================================
const modalDetalhe = document.getElementById("modalDetalhe");
const modalOrcamento = document.getElementById("modalOrcamento");
const modalOrcamentoDetalheOficina = document.getElementById("modalOrcamentoDetalheOficina");
const modalDetalheCli = document.getElementById("modalDetalheCli");
const modalOrcamentoCliente = document.getElementById("modalOrcamentoCliente");

function abrirDetalhe(id){
  const s = solicitacoes.find(x => x.id === id);
  if (!s) return;

  const fotosHtml = s.fotos > 0
    ? Array.from({ length: s.fotos }).map(() => `<div class="photo-placeholder">📷</div>`).join("")
    : `<p style="color:var(--ink-soft); font-size:13px;">Nenhuma foto enviada pelo cliente.</p>`;

  document.getElementById("detalheBody").innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><div class="k">Cliente</div><div class="v">${s.cliente}</div></div>
      <div class="detail-item"><div class="k">CPF</div><div class="v mono">${mascararCpf(s.clienteId)}</div></div>
      <div class="detail-item"><div class="k">Telefone</div><div class="v">${s.telefone}</div></div>
      <div class="detail-item"><div class="k">Veículo</div><div class="v">${s.veiculo}</div></div>
      <div class="detail-item"><div class="k">Ano</div><div class="v">${s.ano}</div></div>
      <div class="detail-item"><div class="k">Quilometragem</div><div class="v">${s.km}</div></div>
      <div class="detail-item"><div class="k">Data da solicitação</div><div class="v">${s.data}</div></div>
      <div class="detail-item full"><div class="k">Serviço solicitado</div><div class="v">${s.servico}</div></div>
      <div class="detail-item full"><div class="k">Descrição do problema</div><div class="v" style="font-weight:400;">${s.descricao}</div></div>
      <div class="detail-item full">
        <div class="k">Fotos do veículo / problema</div>
        <div class="photo-row" style="margin-top:6px;">${fotosHtml}</div>
      </div>
      <div class="detail-item"><div class="k">Status atual</div><div class="v">${statusBadge(s.status)}</div></div>
    </div>
    <div class="modal__actions">
      <button type="button" class="btn btn--danger" id="btnRecusar">Recusar solicitação</button>
      <button type="button" class="btn btn--primary" id="btnElaborarOrcamento">
        ${s.orcamento ? "Editar orçamento" : "Elaborar orçamento"}
      </button>
    </div>
  `;

  document.getElementById("btnRecusar").addEventListener("click", () => {
    s.status = "recusado";
    salvarSolicitacoes();
    fecharModais();
    renderAll();
    mostrarToast(`Solicitação de ${s.cliente} foi recusada.`);
  });

  document.getElementById("btnElaborarOrcamento").addEventListener("click", () => {
    fecharModais();
    abrirOrcamento(s.id);
  });

  modalDetalhe.classList.add("is-open");
}

// =========================================================
// 8. MODAL: ELABORAR / EDITAR ORÇAMENTO (oficina)
//    — editor itemizado de peças e mão de obra
// =========================================================
let orcPecasTemp = [];
let orcMaoObraTemp = [];
let orcProximoIdPeca = 1;
let orcProximoIdMaoObra = 1;

function novoItemPeca(nome = "", descricao = "", quantidade = 1, valorUnitario = 0, aprovado = null){
  return { id: orcProximoIdPeca++, nome, descricao, quantidade, valorUnitario, aprovado };
}
function novoItemMaoObra(descricao = "", quantidade = 1, valorUnitario = 0, aprovado = null){
  return { id: orcProximoIdMaoObra++, descricao, quantidade, valorUnitario, aprovado };
}

function abrirOrcamento(id){
  const s = solicitacoes.find(x => x.id === id);
  if (!s) return;

  document.getElementById("orcSolicitacaoId").value = id;
  document.getElementById("orcModalTitulo").textContent = s.orcamento ? "Editar orçamento" : "Elaborar orçamento";

  orcProximoIdPeca = 1;
  orcProximoIdMaoObra = 1;

  if (s.orcamento){
    // modo edição: carrega itens já existentes
    document.getElementById("orcServico").value = s.orcamento.servico;
    document.getElementById("orcDescricao").value = s.orcamento.descricao || "";
    document.getElementById("orcPrazo").value = s.orcamento.prazo || "";
    document.getElementById("orcObs").value = s.orcamento.obs || "";
    orcPecasTemp = s.orcamento.pecas.map(p => ({ ...p, id: orcProximoIdPeca++ }));
    orcMaoObraTemp = s.orcamento.maoDeObra.map(m => ({ ...m, id: orcProximoIdMaoObra++ }));
  } else {
    document.getElementById("orcServico").value = s.servico;
    document.getElementById("orcDescricao").value = "";
    document.getElementById("orcPrazo").value = "";
    document.getElementById("orcObs").value = "";
    orcPecasTemp = [novoItemPeca()];
    orcMaoObraTemp = [novoItemMaoObra()];
  }

  renderOrcPecasEditor();
  renderOrcMaoObraEditor();
  atualizarTotalOrcamento();

  modalOrcamento.classList.add("is-open");
}

function renderOrcPecasEditor(){
  const container = document.getElementById("orcPecasList");
  if (orcPecasTemp.length === 0){
    container.innerHTML = `<p class="items-empty">Nenhuma peça adicionada.</p>`;
    return;
  }
  container.innerHTML = orcPecasTemp.map(p => `
    <div class="item-row" data-peca-id="${p.id}">
      <label>Peça
        <input type="text" class="peca-nome" value="${escapeAttr(p.nome)}" placeholder="Ex: Pastilha de freio dianteira">
      </label>
      <label>Quantidade
        <input type="number" class="peca-qtd" min="1" step="1" value="${p.quantidade}">
      </label>
      <label>Valor unitário (R$)
        <input type="number" class="peca-valor" min="0" step="0.01" value="${p.valorUnitario}">
      </label>
      <label>Total
        <span class="item-total">${formatBRL(p.quantidade * p.valorUnitario)}</span>
      </label>
      <button type="button" class="item-row__remove" data-remove-peca="${p.id}" title="Remover peça">✕</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-remove-peca]").forEach(btn => {
    btn.addEventListener("click", () => {
      orcPecasTemp = orcPecasTemp.filter(p => p.id !== Number(btn.dataset.removePeca));
      renderOrcPecasEditor();
      atualizarTotalOrcamento();
    });
  });
  container.querySelectorAll(".item-row").forEach(row => {
    const id = Number(row.dataset.pecaId);
    row.querySelector(".peca-nome").addEventListener("input", (e) => atualizarItemPeca(id, "nome", e.target.value));
    row.querySelector(".peca-qtd").addEventListener("input", (e) => atualizarItemPeca(id, "quantidade", e.target.value));
    row.querySelector(".peca-valor").addEventListener("input", (e) => atualizarItemPeca(id, "valorUnitario", e.target.value));
  });
}

function atualizarItemPeca(id, campo, valor){
  const item = orcPecasTemp.find(p => p.id === id);
  if (!item) return;
  if (campo === "quantidade") item.quantidade = Math.max(0, parseFloat(valor) || 0);
  else if (campo === "valorUnitario") item.valorUnitario = Math.max(0, parseFloat(valor) || 0);
  else item[campo] = valor;

  const row = document.querySelector(`#orcPecasList [data-peca-id="${id}"] .item-total`);
  if (row) row.textContent = formatBRL(item.quantidade * item.valorUnitario);
  atualizarTotalOrcamento();
}

function renderOrcMaoObraEditor(){
  const container = document.getElementById("orcMaoObraList");
  if (orcMaoObraTemp.length === 0){
    container.innerHTML = `<p class="items-empty">Nenhum serviço de mão de obra adicionado.</p>`;
    return;
  }
  container.innerHTML = orcMaoObraTemp.map(m => `
    <div class="item-row" data-mo-id="${m.id}">
      <label>Serviço
        <input type="text" class="mo-descricao" value="${escapeAttr(m.descricao)}" placeholder="Ex: Troca das pastilhas de freio">
      </label>
      <label>Quantidade
        <input type="number" class="mo-qtd" min="1" step="1" value="${m.quantidade}">
      </label>
      <label>Valor (R$)
        <input type="number" class="mo-valor" min="0" step="0.01" value="${m.valorUnitario}">
      </label>
      <label>Total
        <span class="item-total">${formatBRL(m.quantidade * m.valorUnitario)}</span>
      </label>
      <button type="button" class="item-row__remove" data-remove-mo="${m.id}" title="Remover">✕</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-remove-mo]").forEach(btn => {
    btn.addEventListener("click", () => {
      orcMaoObraTemp = orcMaoObraTemp.filter(m => m.id !== Number(btn.dataset.removeMo));
      renderOrcMaoObraEditor();
      atualizarTotalOrcamento();
    });
  });
  container.querySelectorAll(".item-row").forEach(row => {
    const id = Number(row.dataset.moId);
    row.querySelector(".mo-descricao").addEventListener("input", (e) => atualizarItemMaoObra(id, "descricao", e.target.value));
    row.querySelector(".mo-qtd").addEventListener("input", (e) => atualizarItemMaoObra(id, "quantidade", e.target.value));
    row.querySelector(".mo-valor").addEventListener("input", (e) => atualizarItemMaoObra(id, "valorUnitario", e.target.value));
  });
}

function atualizarItemMaoObra(id, campo, valor){
  const item = orcMaoObraTemp.find(m => m.id === id);
  if (!item) return;
  if (campo === "quantidade") item.quantidade = Math.max(0, parseFloat(valor) || 0);
  else if (campo === "valorUnitario") item.valorUnitario = Math.max(0, parseFloat(valor) || 0);
  else item[campo] = valor;

  const row = document.querySelector(`#orcMaoObraList [data-mo-id="${id}"] .item-total`);
  if (row) row.textContent = formatBRL(item.quantidade * item.valorUnitario);
  atualizarTotalOrcamento();
}

document.getElementById("btnAddPeca").addEventListener("click", () => {
  orcPecasTemp.push(novoItemPeca());
  renderOrcPecasEditor();
  atualizarTotalOrcamento();
});
document.getElementById("btnAddMaoObra").addEventListener("click", () => {
  orcMaoObraTemp.push(novoItemMaoObra());
  renderOrcMaoObraEditor();
  atualizarTotalOrcamento();
});

function atualizarTotalOrcamento(){
  const subtotalPecas = orcPecasTemp.reduce((acc, p) => acc + (p.quantidade * p.valorUnitario), 0);
  const subtotalMaoObra = orcMaoObraTemp.reduce((acc, m) => acc + (m.quantidade * m.valorUnitario), 0);
  const total = subtotalPecas + subtotalMaoObra;

  document.getElementById("orcSubtotalPecas").textContent = formatBRL(subtotalPecas);
  document.getElementById("orcSubtotalMaoObra").textContent = formatBRL(subtotalMaoObra);
  document.getElementById("orcTotal").textContent = formatBRL(total);

  return { subtotalPecas, subtotalMaoObra, total };
}

document.getElementById("formOrcamento").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = Number(document.getElementById("orcSolicitacaoId").value);
  const s = solicitacoes.find(x => x.id === id);
  if (!s) return;

  const { subtotalPecas, subtotalMaoObra, total } = atualizarTotalOrcamento();

  const pecasFinal = orcPecasTemp
    .filter(p => (p.nome || "").trim() !== "")
    .map(p => ({
      id: p.id, nome: p.nome, descricao: p.descricao || "",
      quantidade: p.quantidade, valorUnitario: p.valorUnitario,
      total: p.quantidade * p.valorUnitario,
      aprovado: null // preparado para aprovação individual futura
    }));

  const maoObraFinal = orcMaoObraTemp
    .filter(m => (m.descricao || "").trim() !== "")
    .map(m => ({
      id: m.id, descricao: m.descricao,
      quantidade: m.quantidade, valorUnitario: m.valorUnitario,
      total: m.quantidade * m.valorUnitario,
      aprovado: null
    }));

  s.orcamento = {
    servico: document.getElementById("orcServico").value,
    descricao: document.getElementById("orcDescricao").value,
    pecas: pecasFinal,
    maoDeObra: maoObraFinal,
    subtotalPecas: subtotalPecas,
    subtotalMaoDeObra: subtotalMaoObra,
    total: total,
    valorAprovado: null,
    prazo: document.getElementById("orcPrazo").value,
    obs: document.getElementById("orcObs").value
  };

  // Simula o envio: "Enviar orçamento ao cliente" -> plataforma -> cliente.
  s.status = "aprovacao";
  salvarSolicitacoes();

  fecharModais();
  renderAll();
  mostrarToast(`Orçamento de ${s.cliente} enviado ao cliente via LaunchControl.`);
});

// =========================================================
// 9. MODAL: DETALHE DO ORÇAMENTO (oficina — leitura + editar)
// =========================================================
function tabelaItensLeitura(titulo, itens, colunaNome){
  if (!itens || itens.length === 0){
    return `<div class="orc-table-wrap"><h4>${titulo}</h4><p class="items-empty">Nenhum item.</p></div>`;
  }
  return `
    <div class="orc-table-wrap">
      <h4>${titulo}</h4>
      <table class="orc-mini-table">
        <thead><tr><th>${colunaNome}</th><th class="num">Qtd.</th><th class="num">Valor unitário</th><th class="num">Total</th></tr></thead>
        <tbody>
          ${itens.map(it => `
            <tr>
              <td>${colunaNome === "Item" ? it.nome : it.descricao}</td>
              <td class="num">${it.quantidade}</td>
              <td class="num">${formatBRL(it.valorUnitario)}</td>
              <td class="num">${formatBRL(it.total)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function abrirDetalheOrcamentoOficina(id){
  const s = solicitacoes.find(x => x.id === id);
  if (!s || !s.orcamento) return;
  const o = s.orcamento;

  document.getElementById("orcamentoDetalheOficinaBody").innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><div class="k">Cliente</div><div class="v">${s.cliente}</div></div>
      <div class="detail-item"><div class="k">CPF</div><div class="v mono">${mascararCpf(s.clienteId)}</div></div>
      <div class="detail-item"><div class="k">Veículo</div><div class="v">${s.veiculo} · ${s.ano}</div></div>
      <div class="detail-item"><div class="k">Serviço</div><div class="v">${o.servico}</div></div>
      <div class="detail-item"><div class="k">Data</div><div class="v">${s.data}</div></div>
      <div class="detail-item"><div class="k">Prazo</div><div class="v">${o.prazo || "—"}</div></div>
      <div class="detail-item"><div class="k">Status</div><div class="v">${statusBadge(s.status)}</div></div>
      ${o.obs ? `<div class="detail-item full"><div class="k">Observações</div><div class="v" style="font-weight:400;">${o.obs}</div></div>` : ""}
    </div>

    ${tabelaItensLeitura("Peças", o.pecas, "Item")}
    ${tabelaItensLeitura("Mão de obra", o.maoDeObra, "Serviço")}

    <div class="orc-summary">
      <span>Subtotal das peças: <strong class="mono">${formatBRL(o.subtotalPecas)}</strong></span>
      <span>Subtotal da mão de obra: <strong class="mono">${formatBRL(o.subtotalMaoDeObra)}</strong></span>
      <span class="grand">Total: ${formatBRL(o.total)}</span>
    </div>

    <div class="modal__actions">
      <button type="button" class="btn btn--primary" id="btnEditarOrcamento">Editar orçamento</button>
    </div>
  `;

  document.getElementById("btnEditarOrcamento").addEventListener("click", () => {
    fecharModais();
    abrirOrcamento(s.id);
  });

  modalOrcamentoDetalheOficina.classList.add("is-open");
}

// =========================================================
// 10. FECHAMENTO DE MODAIS
// =========================================================
function fecharModais(){
  [modalDetalhe, modalOrcamento, modalOrcamentoDetalheOficina, modalDetalheCli, modalOrcamentoCliente]
    .forEach(m => m.classList.remove("is-open"));
}
document.getElementById("closeDetalhe").addEventListener("click", fecharModais);
document.getElementById("closeOrcamento").addEventListener("click", fecharModais);
document.getElementById("cancelOrcamento").addEventListener("click", fecharModais);
document.getElementById("closeOrcamentoDetalheOficina").addEventListener("click", fecharModais);
document.getElementById("closeDetalheCli").addEventListener("click", fecharModais);
document.getElementById("closeOrcamentoCliente").addEventListener("click", fecharModais);
[modalDetalhe, modalOrcamento, modalOrcamentoDetalheOficina, modalDetalheCli, modalOrcamentoCliente].forEach(overlay => {
  overlay.addEventListener("click", (e) => { if (e.target === overlay) fecharModais(); });
});

// =========================================================
// 11. RENDERIZAÇÃO — PAINEL DO CLIENTE
// =========================================================
function renderCliente(){
  const c = clienteAtual();
  if (!c) return;
  const minhas = solicitacoesDoCliente();

  renderCliKpis(minhas);
  renderRequestListCli(document.getElementById("cliRecentRequests"), minhas.slice(0, 3));
  renderRequestListCli(document.getElementById("cliAllRequests"), minhas);
  renderCliVeiculos(c);
  renderCliOrcamentosTable(minhas);
  renderCliServicosTable(minhas);
  renderCliPerfil(c);
}

function renderCliKpis(minhas){
  const ultima = minhas[0];
  const pendente = minhas.find(s => s.status === "aprovacao" || s.status === "aprovado_parcial");
  const andamento = minhas.find(s => s.status === "execucao" || s.status === "aprovado");
  const concluidos = minhas.filter(s => s.status === "concluido").length;

  const cards = [
    { label: "Última solicitação", value: ultima ? ultima.servico : "—", icon: "▤", color: "var(--accent)" },
    { label: "Orçamento pendente", value: pendente ? formatBRL(pendente.orcamento.total) : "Nenhum", icon: "🧾", color: "var(--amber)" },
    { label: "Serviço em andamento", value: andamento ? andamento.servico : "Nenhum", icon: "🔧", color: "var(--purple)" },
    { label: "Serviços concluídos", value: concluidos, icon: "✅", color: "var(--teal)" }
  ];

  document.getElementById("cliKpiCards").innerHTML = cards.map(c => `
    <div class="kpi-card" style="--kpi-color:${c.color}">
      <span class="kpi-icon">${c.icon}</span>
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value" style="font-size:16px; font-family:var(--font-body);">${c.value}</div>
    </div>
  `).join("");
}

function renderRequestListCli(container, list){
  if (!container) return;
  if (list.length === 0){
    container.innerHTML = `<p style="color:var(--ink-soft); padding:20px 0;">Nenhuma solicitação por aqui.</p>`;
    return;
  }
  container.innerHTML = list.map(s => `
    <div class="req-card">
      <div class="req-card__main">
        <div class="req-field"><span class="k">Veículo</span><span class="v">${s.veiculo} · ${s.ano}</span></div>
        <div class="req-field"><span class="k">Serviço</span><span class="v">${s.servico}</span></div>
        <div class="req-field"><span class="k">Data</span><span class="v mono">${s.data}</span></div>
        <div class="req-field"><span class="k">&nbsp;</span><span class="v">&nbsp;</span></div>
      </div>
      <div>${statusBadge(s.status)}</div>
      <button class="btn btn--outline" data-detalhe-cli="${s.id}">Visualizar</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-detalhe-cli]").forEach(btn => {
    btn.addEventListener("click", () => abrirDetalheCliente(Number(btn.dataset.detalheCli)));
  });
}

function renderCliVeiculos(c){
  const container = document.getElementById("cliVeiculosCards");
  if (!container) return;
  container.innerHTML = c.veiculos.map(v => `
    <div class="veiculo-card">
      <strong>${v.modelo}</strong>
      <p>Ano ${v.ano} · Placa ${v.placa}</p>
      <p>${v.km}</p>
    </div>
  `).join("");
}

function renderCliOrcamentosTable(minhas){
  const tbody = document.querySelector("#cliOrcamentosTable tbody");
  if (!tbody) return;
  const comOrcamento = minhas.filter(s => s.orcamento);
  if (comOrcamento.length === 0){
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--ink-soft); padding:24px 0;">Você ainda não recebeu nenhum orçamento.</td></tr>`;
    return;
  }
  tbody.innerHTML = comOrcamento.map(s => `
    <tr class="row-click" data-orc-cli="${s.id}">
      <td>${s.veiculo}</td>
      <td>${s.orcamento.servico}</td>
      <td class="mono">${formatBRL(s.orcamento.total)}</td>
      <td>${statusBadge(s.status)}</td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-orc-cli]").forEach(tr => {
    tr.addEventListener("click", () => abrirOrcamentoCliente(Number(tr.dataset.orcCli)));
  });
}

function renderCliServicosTable(minhas){
  const tbody = document.querySelector("#cliServicosTable tbody");
  if (!tbody) return;
  const emServico = minhas.filter(s => ["aprovado", "execucao", "concluido"].includes(s.status));
  if (emServico.length === 0){
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--ink-soft); padding:24px 0;">Nenhum serviço em andamento ou concluído.</td></tr>`;
    return;
  }
  tbody.innerHTML = emServico.map(s => `
    <tr>
      <td>${s.veiculo}</td>
      <td>${s.servico}</td>
      <td class="mono">${s.entrada || "—"}</td>
      <td class="mono">${s.previsao || "—"}</td>
      <td>${statusBadge(s.status)}</td>
    </tr>
  `).join("");
}

function renderCliPerfil(c){
  const container = document.getElementById("cliPerfilInfo");
  if (!container) return;
  container.innerHTML = `
    <div class="detail-item"><div class="k">Nome</div><div class="v">${c.nome}</div></div>
    <div class="detail-item"><div class="k">CPF</div><div class="v mono">${mascararCpf(c.cpf)}</div></div>
    <div class="detail-item"><div class="k">Telefone</div><div class="v">${c.telefone}</div></div>
    <div class="detail-item"><div class="k">E-mail</div><div class="v">${c.email}</div></div>
    <div class="detail-item full"><div class="k">Veículos</div><div class="v" style="font-weight:400;">${c.veiculos.map(v => `${v.modelo} (${v.ano})`).join(", ")}</div></div>
  `;
}

// ---- Modal: detalhe da solicitação (cliente, somente leitura) ----
function abrirDetalheCliente(id){
  const s = solicitacoes.find(x => x.id === id && x.clienteId === sessao.cpf);
  if (!s) return;

  const fotosHtml = s.fotos > 0
    ? Array.from({ length: s.fotos }).map(() => `<div class="photo-placeholder">📷</div>`).join("")
    : `<p style="color:var(--ink-soft); font-size:13px;">Nenhuma foto enviada.</p>`;

  document.getElementById("detalheCliBody").innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><div class="k">Veículo</div><div class="v">${s.veiculo}</div></div>
      <div class="detail-item"><div class="k">Ano</div><div class="v">${s.ano}</div></div>
      <div class="detail-item"><div class="k">Quilometragem</div><div class="v">${s.km}</div></div>
      <div class="detail-item"><div class="k">Data da solicitação</div><div class="v">${s.data}</div></div>
      <div class="detail-item full"><div class="k">Serviço solicitado</div><div class="v">${s.servico}</div></div>
      <div class="detail-item full"><div class="k">Descrição do problema</div><div class="v" style="font-weight:400;">${s.descricao}</div></div>
      <div class="detail-item full">
        <div class="k">Fotos enviadas</div>
        <div class="photo-row" style="margin-top:6px;">${fotosHtml}</div>
      </div>
      <div class="detail-item"><div class="k">Status atual</div><div class="v">${statusBadge(s.status)}</div></div>
    </div>
    ${s.orcamento ? `
      <div class="modal__actions">
        <button type="button" class="btn btn--primary" id="btnVerOrcamentoCli">Ver orçamento detalhado</button>
      </div>
    ` : ""}
  `;

  const btnVer = document.getElementById("btnVerOrcamentoCli");
  if (btnVer){
    btnVer.addEventListener("click", () => {
      fecharModais();
      abrirOrcamentoCliente(s.id);
    });
  }

  modalDetalheCli.classList.add("is-open");
}

// ---- Modal: orçamento detalhado do cliente (aprovar/recusar) ----
function abrirOrcamentoCliente(id){
  const s = solicitacoes.find(x => x.id === id && x.clienteId === sessao.cpf);
  if (!s || !s.orcamento) return;
  const o = s.orcamento;

  const decisaoJaTomada = ["aprovado", "aprovado_parcial", "recusado_cliente"].includes(s.status);

  const linhaItem = (it, tipo) => `
    <tr>
      <td class="chk-col">
        <input type="checkbox" class="item-aprova" data-tipo="${tipo}" data-id="${it.id}"
          ${(it.aprovado === false ? "" : "checked")} ${decisaoJaTomada ? "disabled" : ""}>
      </td>
      <td>${tipo === "peca" ? it.nome : it.descricao}</td>
      <td class="num">${it.quantidade}</td>
      <td class="num">${formatBRL(it.valorUnitario)}</td>
      <td class="num">${formatBRL(it.total)}</td>
    </tr>
  `;

  document.getElementById("orcamentoClienteBody").innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><div class="k">Veículo</div><div class="v">${s.veiculo}</div></div>
      <div class="detail-item"><div class="k">Serviço</div><div class="v">${o.servico}</div></div>
      <div class="detail-item"><div class="k">Prazo estimado</div><div class="v">${o.prazo || "—"}</div></div>
      <div class="detail-item"><div class="k">Status</div><div class="v">${statusBadge(s.status)}</div></div>
      ${o.obs ? `<div class="detail-item full"><div class="k">Observações da oficina</div><div class="v" style="font-weight:400;">${o.obs}</div></div>` : ""}
    </div>

    <div class="orc-table-wrap">
      <h4>Peças</h4>
      <table class="orc-mini-table">
        <thead><tr><th class="chk-col"></th><th>Item</th><th class="num">Qtd.</th><th class="num">Valor unitário</th><th class="num">Total</th></tr></thead>
        <tbody>${o.pecas.map(p => linhaItem(p, "peca")).join("")}</tbody>
      </table>
    </div>

    <div class="orc-table-wrap">
      <h4>Mão de obra</h4>
      <table class="orc-mini-table">
        <thead><tr><th class="chk-col"></th><th>Serviço</th><th class="num">Qtd.</th><th class="num">Valor unitário</th><th class="num">Total</th></tr></thead>
        <tbody>${o.maoDeObra.map(m => linhaItem(m, "mo")).join("")}</tbody>
      </table>
    </div>

    <div class="orc-summary">
      <span>Total do orçamento: <strong class="mono">${formatBRL(o.total)}</strong></span>
      <span class="grand" id="orcClienteValorSelecionado">Selecionado: ${formatBRL(o.valorAprovado != null ? o.valorAprovado : o.total)}</span>
    </div>

    ${decisaoJaTomada ? `
      <p style="color:var(--ink-soft); font-size:13px;">Você já respondeu a este orçamento. O status atual é exibido acima.</p>
    ` : `
      <div class="modal__actions" style="justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <button type="button" class="btn btn--outline" id="btnSalvarSelecao">Aprovar itens selecionados</button>
        <div style="display:flex; gap:10px;">
          <button type="button" class="btn btn--danger" id="btnRecusarTudo">Recusar orçamento completo</button>
          <button type="button" class="btn btn--primary" id="btnAprovarTudo">Aprovar orçamento completo</button>
        </div>
      </div>
    `}
  `;

  if (!decisaoJaTomada){
    const checkboxes = () => Array.from(document.querySelectorAll("#orcamentoClienteBody .item-aprova"));

    function recalcularSelecionado(){
      let soma = 0;
      checkboxes().forEach(cb => {
        if (!cb.checked) return;
        const lista = cb.dataset.tipo === "peca" ? o.pecas : o.maoDeObra;
        const item = lista.find(it => it.id === Number(cb.dataset.id));
        if (item) soma += item.total;
      });
      document.getElementById("orcClienteValorSelecionado").textContent = `Selecionado: ${formatBRL(soma)}`;
      return soma;
    }

    checkboxes().forEach(cb => cb.addEventListener("change", recalcularSelecionado));

    function aplicarDecisao(modoForcado){
      // modoForcado: true = aprovar tudo, false = recusar tudo, null = usa checkboxes
      let totalAprovados = 0;
      let totalItens = o.pecas.length + o.maoDeObra.length;
      let contAprovados = 0;

      o.pecas.forEach(p => {
        const cb = document.querySelector(`.item-aprova[data-tipo="peca"][data-id="${p.id}"]`);
        const aprovado = modoForcado === null ? (cb ? cb.checked : true) : modoForcado;
        p.aprovado = aprovado;
        if (aprovado) { totalAprovados += p.total; contAprovados++; }
      });
      o.maoDeObra.forEach(m => {
        const cb = document.querySelector(`.item-aprova[data-tipo="mo"][data-id="${m.id}"]`);
        const aprovado = modoForcado === null ? (cb ? cb.checked : true) : modoForcado;
        m.aprovado = aprovado;
        if (aprovado) { totalAprovados += m.total; contAprovados++; }
      });

      o.valorAprovado = totalAprovados;

      if (contAprovados === totalItens) s.status = "aprovado";
      else if (contAprovados === 0) s.status = "recusado_cliente";
      else s.status = "aprovado_parcial";

      salvarSolicitacoes();
      fecharModais();
      renderCliente();
      renderAll(); // mantém o painel da oficina sincronizado quando o usuário voltar a ele
      mostrarToast(s.status === "aprovado"
        ? "Orçamento aprovado! A oficina foi notificada."
        : s.status === "recusado_cliente"
          ? "Orçamento recusado."
          : "Aprovação parcial registrada. A oficina foi notificada.");
    }

    document.getElementById("btnAprovarTudo").addEventListener("click", () => aplicarDecisao(true));
    document.getElementById("btnRecusarTudo").addEventListener("click", () => aplicarDecisao(false));
    document.getElementById("btnSalvarSelecao").addEventListener("click", () => aplicarDecisao(null));
  }

  modalOrcamentoCliente.classList.add("is-open");
}

// =========================================================
// 12. TOAST
// =========================================================
let toastTimer = null;
function mostrarToast(msg){
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

// =========================================================
// 13. UTILITÁRIOS
// =========================================================
function escapeAttr(str){
  return String(str == null ? "" : str).replace(/"/g, "&quot;");
}

// =========================================================
// 14. AÇÕES DIVERSAS (mockadas)
// =========================================================
document.getElementById("btnNotif").addEventListener("click", () => {
  mostrarToast("Você tem 3 atualizações de status pendentes.");
});

// =========================================================
// 15. INICIALIZAÇÃO
// =========================================================
carregarEstado();
restaurarSessaoSeExistir();
renderAll();
