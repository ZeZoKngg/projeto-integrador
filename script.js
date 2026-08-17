/* =========================================================
   LaunchControl — script.js
   Protótipo com dados mockados (sem backend / sem API real).
   Representa o trecho do BPMN referente à OFICINA/FORNECEDOR:
   Receber solicitação -> Analisar -> Verificar estoque ->
   Elaborar orçamento -> Enviar orçamento ao cliente.
   ========================================================= */

// ---------- 1. DADOS MOCKADOS ----------
// Cada "solicitação" representa uma mensagem que a plataforma
// LaunchControl encaminhou da oficina (atividade "Encaminhar
// solicitações de orçamento" -> "Receber solicitação de orçamento").
let solicitacoes = [
  {
    id: 101,
    cliente: "João Silva",
    telefone: "(11) 98765-4321",
    veiculo: "Honda Civic",
    ano: 2020,
    km: "42.300 km",
    servico: "Troca de pastilhas de freio",
    descricao: "Barulho ao frear e pedal um pouco mais fundo que o normal.",
    data: "17/08/2026",
    fotos: 2,
    status: "aguardando", // aguardando análise
    orcamento: null,
    entrada: null,
    previsao: null
  },
  {
    id: 102,
    cliente: "Mariana Souza",
    telefone: "(11) 91234-5678",
    veiculo: "Fiat Argo",
    ano: 2022,
    km: "18.900 km",
    servico: "Revisão dos 20.000 km",
    descricao: "Revisão programada de acordo com o manual do fabricante.",
    data: "16/08/2026",
    fotos: 0,
    status: "analise", // em análise pela oficina
    orcamento: null,
    entrada: null,
    previsao: null
  },
  {
    id: 103,
    cliente: "Ricardo Alves",
    telefone: "(11) 99887-6655",
    veiculo: "Chevrolet Onix",
    ano: 2019,
    km: "63.500 km",
    servico: "Troca de amortecedores",
    descricao: "Carro balançando muito em lombadas e buracos.",
    data: "15/08/2026",
    fotos: 3,
    status: "aprovacao", // aguardando aprovação do cliente
    orcamento: {
      servico: "Troca de amortecedores dianteiros",
      descricao: "Substituição do par de amortecedores dianteiros e alinhamento.",
      pecas: "Amortecedores dianteiros (par)",
      valorPecas: 480,
      maoDeObra: 220,
      prazo: "3 horas",
      obs: "Recomendado alinhamento e balanceamento após a troca.",
      total: 700
    },
    entrada: null,
    previsao: null
  },
  {
    id: 104,
    cliente: "Fernanda Lima",
    telefone: "(11) 97777-2233",
    veiculo: "Volkswagen Gol",
    ano: 2018,
    km: "78.100 km",
    servico: "Troca de correia dentada",
    descricao: "Manutenção preventiva indicada pelo manual do veículo.",
    data: "12/08/2026",
    fotos: 1,
    status: "execucao", // aprovado e em execução na oficina
    orcamento: {
      servico: "Troca de correia dentada e tensor",
      descricao: "Substituição da correia dentada, tensor e bomba d'água.",
      pecas: "Kit correia dentada + bomba d'água",
      valorPecas: 390,
      maoDeObra: 260,
      prazo: "4 horas",
      obs: "",
      total: 650
    },
    entrada: "13/08/2026",
    previsao: "18/08/2026"
  },
  {
    id: 105,
    cliente: "Paulo Costa",
    telefone: "(11) 96666-1122",
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
      pecas: "Óleo 5W30 + filtro de óleo + filtro de ar",
      valorPecas: 210,
      maoDeObra: 60,
      prazo: "1 hora",
      obs: "",
      total: 270
    },
    entrada: "08/08/2026",
    previsao: "08/08/2026"
  },
  {
    id: 106,
    cliente: "Beatriz Nunes",
    telefone: "(11) 95555-8899",
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

const STATUS_INFO = {
  aguardando:  { label: "Aguardando análise",              cls: "status--aguardando" },
  analise:     { label: "Em análise",                       cls: "status--analise" },
  aprovacao:   { label: "Aguardando aprovação do cliente",  cls: "status--aprovacao" },
  aprovado:    { label: "Aprovado",                         cls: "status--aprovado" },
  execucao:    { label: "Em execução",                      cls: "status--execucao" },
  concluido:   { label: "Concluído",                        cls: "status--concluido" },
  recusado:    { label: "Recusado pela oficina",            cls: "status--recusado" }
};

function formatBRL(v){
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusBadge(statusKey){
  const s = STATUS_INFO[statusKey];
  return `<span class="status ${s.cls}">${s.label}</span>`;
}

// ---------- 2. NAVEGAÇÃO ENTRE TELAS ----------
const navLinks = document.querySelectorAll(".nav-link, .link-more");
navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    goToView(link.dataset.view);
  });
});

function goToView(viewName){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
  document.getElementById(`view-${viewName}`).classList.add("is-active");

  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("is-active"));
  const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
  if (activeLink) activeLink.classList.add("is-active");

  renderAll();
}

// ---------- 3. RENDERIZAÇÃO ----------
function renderAll(){
  renderKpis();
  renderRequestList(document.getElementById("recentRequests"), solicitacoes.slice(0, 3));
  renderRequestList(document.getElementById("allRequests"), solicitacoes);
  renderOrcamentosTable();
  renderAndamentoTable();
}

function renderKpis(){
  const novas = solicitacoes.filter(s => s.status === "aguardando").length;
  const pendentes = solicitacoes.filter(s => s.status === "aprovacao").length;
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
    <tr>
      <td>${s.cliente}</td>
      <td>${s.veiculo}</td>
      <td>${s.orcamento.servico}</td>
      <td class="mono">${formatBRL(s.orcamento.total)}</td>
      <td>${statusBadge(s.status)}</td>
    </tr>
  `).join("");
}

function renderAndamentoTable(){
  const tbody = document.querySelector("#andamentoTable tbody");
  const emAndamento = solicitacoes.filter(s =>
    ["aprovacao", "aprovado", "execucao", "concluido"].includes(s.status)
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

// ---------- 4. MODAL: DETALHES DA SOLICITAÇÃO ----------
const modalDetalhe = document.getElementById("modalDetalhe");
const modalOrcamento = document.getElementById("modalOrcamento");
let solicitacaoAtualId = null;

function abrirDetalhe(id){
  const s = solicitacoes.find(x => x.id === id);
  if (!s) return;
  solicitacaoAtualId = id;

  const fotosHtml = s.fotos > 0
    ? Array.from({ length: s.fotos }).map(() => `<div class="photo-placeholder">📷</div>`).join("")
    : `<p style="color:var(--ink-soft); font-size:13px;">Nenhuma foto enviada pelo cliente.</p>`;

  document.getElementById("detalheBody").innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><div class="k">Cliente</div><div class="v">${s.cliente}</div></div>
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
      <button type="button" class="btn btn--primary" id="btnElaborarOrcamento">Elaborar orçamento</button>
    </div>
  `;

  document.getElementById("btnRecusar").addEventListener("click", () => {
    s.status = "recusado";
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

// ---------- 5. MODAL: ELABORAR ORÇAMENTO ----------
function abrirOrcamento(id){
  const s = solicitacoes.find(x => x.id === id);
  if (!s) return;
  solicitacaoAtualId = id;

  document.getElementById("orcSolicitacaoId").value = id;
  document.getElementById("orcServico").value = s.servico;
  document.getElementById("orcDescricao").value = "";
  document.getElementById("orcPecas").value = "";
  document.getElementById("orcValorPecas").value = 0;
  document.getElementById("orcMaoDeObra").value = 0;
  document.getElementById("orcPrazo").value = "";
  document.getElementById("orcObs").value = "";
  atualizarTotalOrcamento();

  modalOrcamento.classList.add("is-open");
}

function atualizarTotalOrcamento(){
  const pecas = parseFloat(document.getElementById("orcValorPecas").value) || 0;
  const maoDeObra = parseFloat(document.getElementById("orcMaoDeObra").value) || 0;
  const total = pecas + maoDeObra;
  document.getElementById("orcTotal").textContent = formatBRL(total);
  return total;
}
document.getElementById("orcValorPecas").addEventListener("input", atualizarTotalOrcamento);
document.getElementById("orcMaoDeObra").addEventListener("input", atualizarTotalOrcamento);

document.getElementById("formOrcamento").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = Number(document.getElementById("orcSolicitacaoId").value);
  const s = solicitacoes.find(x => x.id === id);
  if (!s) return;

  const total = atualizarTotalOrcamento();

  s.orcamento = {
    servico: document.getElementById("orcServico").value,
    descricao: document.getElementById("orcDescricao").value,
    pecas: document.getElementById("orcPecas").value,
    valorPecas: parseFloat(document.getElementById("orcValorPecas").value) || 0,
    maoDeObra: parseFloat(document.getElementById("orcMaoDeObra").value) || 0,
    prazo: document.getElementById("orcPrazo").value,
    obs: document.getElementById("orcObs").value,
    total: total
  };

  // Simula o envio: "Enviar orçamento ao cliente" -> plataforma -> cliente.
  s.status = "aprovacao";

  fecharModais();
  renderAll();
  mostrarToast(`Orçamento de ${s.cliente} enviado ao cliente via LaunchControl.`);
});

// ---------- 6. FECHAMENTO DE MODAIS ----------
function fecharModais(){
  modalDetalhe.classList.remove("is-open");
  modalOrcamento.classList.remove("is-open");
}
document.getElementById("closeDetalhe").addEventListener("click", fecharModais);
document.getElementById("closeOrcamento").addEventListener("click", fecharModais);
document.getElementById("cancelOrcamento").addEventListener("click", fecharModais);
[modalDetalhe, modalOrcamento].forEach(overlay => {
  overlay.addEventListener("click", (e) => { if (e.target === overlay) fecharModais(); });
});

// ---------- 7. TOAST ----------
let toastTimer = null;
function mostrarToast(msg){
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

// ---------- 8. AÇÕES DIVERSAS (mockadas) ----------
document.getElementById("btnNotif").addEventListener("click", () => {
  mostrarToast("Você tem 3 atualizações de status pendentes.");
});
document.getElementById("btnLogout").addEventListener("click", () => {
  mostrarToast("Sessão encerrada (simulação — sem autenticação real).");
});

// ---------- 9. INICIALIZAÇÃO ----------
renderAll();
