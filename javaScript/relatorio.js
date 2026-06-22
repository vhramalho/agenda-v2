// ================================
// CONFIGURAÇÃO INICIAL
// ================================

let periodoAtual = "dia";
let dataAtual = obterDataDoSistema();

// Calendário
const btnCalendario = document.getElementById("btnCalendario");
const modalCalendario = document.getElementById("modal-calendario");
const mesAtualSpan = document.getElementById("mesAtual");
const calendarioCorpo = document.getElementById("calendarioCorpo");
const btnMesAnterior = document.getElementById("mesAnterior");
const btnMesSeguinte = document.getElementById("mesSeguinte");

let mesAtual = new Date(dataAtual).getMonth();
let anoAtual = new Date(dataAtual).getFullYear();

// Abas
const abas = document.querySelectorAll(".aba-periodo");
const btnPeriodoAnterior = document.getElementById("btnPeriodoAnterior");
const btnPeriodoSeguinte = document.getElementById("btnPeriodoSeguinte");

// ================================
// INICIALIZAÇÃO
// ================================

document.addEventListener("DOMContentLoaded", () => {
  atualizarRelatorio();

  abas.forEach((botao) => {
    botao.addEventListener("click", () => {
      abas.forEach((b) => b.classList.remove("ativa"));
      botao.classList.add("ativa");

      periodoAtual = botao.dataset.periodo;

      atualizarRelatorio();
    });
  });

  btnPeriodoAnterior.addEventListener("click", () => {
    mudarPeriodo(-1);
  });

  btnPeriodoSeguinte.addEventListener("click", () => {
    mudarPeriodo(1);
  });

  gerarCalendario();
});

// ================================
// ATUALIZA RELATÓRIO
// ================================

function atualizarRelatorio() {
  const agendamentos = carregarTodosAgendamentosRealizados();

  const formas = JSON.parse(localStorage.getItem("formasPagamento")) || [];

  let lista = [];
  let titulo = "";

  switch (periodoAtual) {
    case "dia":
      lista = filtrarPorDia(agendamentos, dataAtual);
      titulo = formatarData(dataAtual);
      break;

    case "semana":
      lista = filtrarPorSemana(agendamentos, dataAtual);
      titulo = "Semana " + getNumeroSemana(dataAtual);
      break;

    case "mes":
      lista = filtrarPorMes(agendamentos, dataAtual);
      titulo = formatarMes(dataAtual);
      break;

    case "ano":
      lista = filtrarPorAno(agendamentos, dataAtual);
      titulo = dataAtual.slice(0, 4);
      break;
  }

  preencherCabecalho(titulo);
  preencherCards(lista, formas);
  atualizarGraficoFaturamento(lista);
}

function mudarPeriodo(direcao) {
  const data = criarDataLocal(dataAtual);

  if (periodoAtual === "dia") {
    data.setDate(data.getDate() + direcao);
  }

  if (periodoAtual === "semana") {
    data.setDate(data.getDate() + 7 * direcao);
  }

  if (periodoAtual === "mes") {
    data.setMonth(data.getMonth() + direcao);
  }

  if (periodoAtual === "ano") {
    data.setFullYear(data.getFullYear() + direcao);
  }

  dataAtual = converterDataParaTexto(data);
  atualizarRelatorio();
}

// ================================
// PREENCHIMENTO DOS DADOS
// ================================

function preencherCabecalho(titulo) {
  const textoPeriodo = document.getElementById("textoPeriodoSelecionado");
  const subtituloPeriodo = document.getElementById("subtituloPeriodo");

  textoPeriodo.textContent = titulo;
  subtituloPeriodo.textContent = "";

  if (periodoAtual === "dia") {
    subtituloPeriodo.textContent = obterNomeDiaSemana(dataAtual);
  }

  if (periodoAtual === "semana") {
    subtituloPeriodo.textContent = obterPeriodoSemana(dataAtual);
  }
}

function calcularVariacaoPercentual(atual, anterior) {
  if (anterior === 0) {
    return {
      valor: "Sem dados para comparação",
      classe: "variacao-neutra",
    };
  }

  const percentual = ((atual - anterior) / anterior) * 100;

  return {
    valor: `${percentual >= 0 ? "▲" : "▼"} ${Math.abs(percentual).toFixed(1)}%`,
    classe: percentual >= 0 ? "variacao-positiva" : "variacao-negativa",
  };
}

function calcularVariacaoQuantidade(atual, anterior) {
  if (anterior === 0) {
    return {
      valor: "Sem dados para comparação",
      classe: "variacao-neutra",
    };
  }

  const diferenca = atual - anterior;

  return {
    valor: `${diferenca >= 0 ? "+" : "-"}${Math.abs(diferenca)}`,
    classe: diferenca >= 0 ? "variacao-positiva" : "variacao-negativa",
  };
}

function obterTextoComparacao() {
  if (periodoAtual === "dia") return "vs ontem";
  if (periodoAtual === "semana") return "vs semana anterior";
  if (periodoAtual === "mes") return "vs mês anterior";
  if (periodoAtual === "ano") return "vs ano anterior";

  return "";
}

function aplicarVariacao(idElemento, resultado, mostrarContexto = true) {
  const elemento = document.getElementById(idElemento);

  if (!elemento) return;

  const contexto = obterTextoComparacao();

  if (resultado.valor === "Sem dados para comparação") {
    elemento.innerHTML = "";
    return;
  }

  elemento.innerHTML = `
  <span class="variacao-linha">
    <span class="variacao-valor ${resultado.classe}">${resultado.valor}</span>
    ${mostrarContexto ? `<span class="variacao-contexto">${contexto}</span>` : ""}
  </span>
`;

  elemento.className = "variacao-card";
}

function preencherCards(lista, formasCadastradas) {
  const faturamento = somarValores(lista);
  const atendimentos = lista.length;
  const ticketMedio = atendimentos > 0 ? faturamento / atendimentos : 0;

  const anterior = obterDadosPeriodoAnterior();

  const variacaoFaturamento = calcularVariacaoPercentual(
    faturamento,
    anterior.faturamento,
  );

  const variacaoAtendimentos = calcularVariacaoQuantidade(
    atendimentos,
    anterior.atendimentos,
  );

  const variacaoTicket = calcularVariacaoPercentual(
    ticketMedio,
    anterior.ticketMedio,
  );

  document.getElementById("faturamentoPeriodo").textContent =
    formatarMoeda(faturamento);

  document.getElementById("totalAtendimentos").textContent = atendimentos;

  document.getElementById("ticketMedio").textContent =
    formatarMoeda(ticketMedio);

  aplicarVariacao("variacaoFaturamento", variacaoFaturamento);
  aplicarVariacao("variacaoAtendimentos", variacaoAtendimentos);
  aplicarVariacao("variacaoTicketMedio", variacaoTicket);

  preencherRecebimentos(lista, formasCadastradas);
  preencherTaxaCartao(lista, formasCadastradas);
}

function preencherRecebimentos(lista, formasCadastradas) {
  const container = document.getElementById("recebimentoDetalhado");
  const resumo = {
    dinheiro: 0,
    pix: 0,
    credito: 0,
    debito: 0,
    outras: 0,
  };

  lista.forEach((agendamento) => {
    const formas = Array.isArray(agendamento.formaPagamento)
      ? agendamento.formaPagamento
      : [];

    formas.forEach((fp) => {
      const nomeForma = fp.forma || "";
      const valor = Number(fp.valor) || 0;

      const formaCadastrada = formasCadastradas.find(
        (forma) => forma.nome === nomeForma,
      );

      const tipo = obterTipoPagamento(formaCadastrada, nomeForma);

      resumo[tipo] += valor;
    });
  });

  const itens = [
    { tipo: "dinheiro", nome: "Dinheiro" },
    { tipo: "pix", nome: "Pix" },
    { tipo: "credito", nome: "Crédito" },
    { tipo: "debito", nome: "Débito" },
    { tipo: "outras", nome: "Outras" },
  ];

  container.innerHTML = `
    <div class="coluna-legenda">
      ${itens
        .map(
          (item) => `
            <div class="forma-recebimento">
              <span class="bolinha ${item.tipo}"></span>
              <span>${item.nome}</span>
            </div>
          `,
        )
        .join("")}
    </div>

    <div class="coluna-valores">
      ${itens
        .map((item) => `<strong>${formatarMoeda(resumo[item.tipo])}</strong>`)
        .join("")}
    </div>
  `;

  atualizarGraficoRecebimentos(resumo);
}

function obterTipoPagamento(formaCadastrada, nomeForma) {
  if (formaCadastrada && formaCadastrada.tipo) {
    return formaCadastrada.tipo;
  }

  const nome = normalizarTexto(nomeForma);

  if (nome.includes("dinheiro")) return "dinheiro";
  if (nome.includes("pix")) return "pix";
  if (nome.includes("credito") || nome.includes("cartao credito"))
    return "credito";
  if (nome.includes("debito") || nome.includes("cartao debito"))
    return "debito";

  return "outras";
}

function atualizarGraficoRecebimentos(resumo) {
  const grafico = document.getElementById("graficoPizzaRecebimentos");

  if (!grafico) return;

  const cores = {
    dinheiro: "#39e51f",
    pix: "#0075ff",
    credito: "#f012a5",
    debito: "#ffe600",
    outras: "#19c8d8",
  };

  const tipos = ["dinheiro", "pix", "credito", "debito", "outras"];

  const total = tipos.reduce((soma, tipo) => soma + resumo[tipo], 0);

  if (total <= 0) {
    grafico.style.background = "var(--bg-card-light)";
    return;
  }

  let inicio = 0;

  const fatias = tipos
    .filter((tipo) => resumo[tipo] > 0)
    .map((tipo) => {
      const percentual = (resumo[tipo] / total) * 100;
      const fim = inicio + percentual;

      const trecho = `${cores[tipo]} ${inicio}% ${fim}%`;

      inicio = fim;

      return trecho;
    });

  grafico.style.background = `conic-gradient(${fatias.join(", ")})`;
}

function preencherTaxaCartao(lista, formasCadastradas) {
  let totalTaxa = 0;

  lista.forEach((agendamento) => {
    const formas = Array.isArray(agendamento.formaPagamento)
      ? agendamento.formaPagamento
      : [];

    formas.forEach((fp) => {
      const nome = fp.forma || "";
      const valor = Number(fp.valor) || 0;

      const formaCadastrada = formasCadastradas.find((f) => f.nome === nome);

      if (formaCadastrada && formaCadastrada.taxa) {
        totalTaxa += valor * (Number(formaCadastrada.taxa) / 100);
      }
    });
  });

  document.getElementById("taxaCartao").textContent = formatarMoeda(totalTaxa);
}

// ================================
// GRÁFICO DE FATURAMENTO
// ================================

function atualizarGraficoFaturamento(lista) {
  const cardFaturamento = document.querySelector(".card-faturamento");
  const container = document.getElementById("graficoFaturamento");
  const valorSelecionado = document.getElementById("valorSelecionadoGrafico");

  cardFaturamento?.classList.remove("sem-grafico");

  if (valorSelecionado) {
    valorSelecionado.innerHTML = "";
  }

  if (!container) return;

  const dados = montarDadosGraficoFaturamento(lista);
  const total = somarValores(lista);

  if (dados.length === 0 || total <= 0) {
    container.innerHTML = "";
    container.classList.remove("ativo");
    return;
  }

  container.classList.add("ativo");
  container.innerHTML = desenharGraficoSvg(dados);
}

function montarDadosGraficoFaturamento(lista) {
  if (periodoAtual === "dia") {
    return montarDadosDia(lista);
  }

  if (periodoAtual === "semana") {
    return montarDadosSemana(lista);
  }

  if (periodoAtual === "mes") {
    return montarDadosMes(lista);
  }

  if (periodoAtual === "ano") {
    return montarDadosAno(lista);
  }

  return [];
}

function montarDadosDia(lista) {
  const dados = [];

  for (let hora = 8; hora <= 20; hora++) {
    dados.push({
      label: `${String(hora).padStart(2, "0")}h`,
      valor: 0,
      atendimentos: 0,
    });
  }

  lista.forEach((agendamento) => {
    const horaTexto = agendamento.hora || "";
    const hora = Number(String(horaTexto).split(":")[0]);

    if (!Number.isFinite(hora)) return;
    if (hora < 8 || hora > 20) return;

    const index = hora - 8;

    dados[index].valor += Number(agendamento.valor) || 0;
    dados[index].atendimentos += 1;
  });

  return dados;
}

function montarDadosSemana(lista) {
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dados = labels.map((label) => ({
    label,
    valor: 0,
    atendimentos: 0,
  }));

  lista.forEach((agendamento) => {
    const diaSemana = criarDataLocal(agendamento.data).getDay();
    dados[diaSemana].valor += Number(agendamento.valor) || 0;
    dados[diaSemana].atendimentos += 1;
  });

  return dados;
}

function montarDadosMes(lista) {
  const [ano, mes] = dataAtual.split("-").map(Number);
  const diasNoMes = new Date(ano, mes, 0).getDate();

  const dados = [];

  for (let dia = 1; dia <= diasNoMes; dia++) {
    dados.push({
      label: String(dia),
      valor: 0,
      atendimentos: 0,
    });
  }

  lista.forEach((agendamento) => {
    const dia = Number(agendamento.data.split("-")[2]);
    dados[dia - 1].valor += Number(agendamento.valor) || 0;
    dados[dia - 1].atendimentos += 1;
  });

  return dados;
}

function montarDadosAno(lista) {
  const labels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const dados = labels.map((label) => ({
    label,
    valor: 0,
    atendimentos: 0,
  }));

  lista.forEach((agendamento) => {
    const mes = Number(agendamento.data.split("-")[1]);
    dados[mes - 1].valor += Number(agendamento.valor) || 0;
    dados[mes - 1].atendimentos += 1;
  });

  return dados;
}

function desenharGraficoSvg(dados) {
  const largura = 320;
  const altura = 150;
  const paddingTopo = 16;
  const paddingDireita = 8;
  const paddingBaixo = 24;
  const paddingEsquerda = 8;

  const larguraUtil = largura - paddingEsquerda - paddingDireita;
  const alturaUtil = altura - paddingTopo - paddingBaixo;

  const maiorValor = Math.max(...dados.map((item) => item.valor), 1);
  const limiteGrafico = obterLimiteGrafico(maiorValor);

  const labelsY = [
    limiteGrafico,
    limiteGrafico * 0.75,
    limiteGrafico * 0.5,
    limiteGrafico * 0.25,
    0,
  ];

  const pontos = dados.map((item, index) => {
    const x =
      dados.length === 1
        ? largura / 2
        : paddingEsquerda + (index / (dados.length - 1)) * larguraUtil;

    const y =
      paddingTopo + alturaUtil - (item.valor / limiteGrafico) * alturaUtil;

    return {
      ...item,
      x,
      y,
    };
  });

  const linha = pontos
    .map((ponto, index) => `${index === 0 ? "M" : "L"} ${ponto.x} ${ponto.y}`)
    .join(" ");

  const area = `
    M ${pontos[0].x} ${altura - paddingBaixo}
    ${pontos.map((ponto) => `L ${ponto.x} ${ponto.y}`).join(" ")}
    L ${pontos[pontos.length - 1].x} ${altura - paddingBaixo}
    Z
  `;

  const pontosSvg = pontos
    .map((ponto, index) => {
      const textoLabel =
        periodoAtual === "mes" ? `Dia ${ponto.label}` : ponto.label;

      return `
        <circle
          class="ponto-faturamento"
          cx="${ponto.x}"
          cy="${ponto.y}"
          r="${ponto.valor > 0 ? 5 : 0}"
          data-index="${index}"
          data-label="${textoLabel}"
          data-valor="${formatarMoeda(ponto.valor)}"
          onclick="selecionarPontoGrafico(this)"
        />
      `;
    })
    .join("");

  const labels = montarLabelsGrafico(dados);

  return `
    <div class="grafico-y-labels">
      ${labelsY.map((valor) => `<span>${formatarNumeroGrafico(valor)}</span>`).join("")}
    </div>

    <svg viewBox="0 0 ${largura} ${altura}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="gradienteFaturamento" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="0" />
        </linearGradient>
      </defs>

      <path class="area-faturamento" d="${area}" fill="url(#gradienteFaturamento)" />

      <path class="linha-faturamento" d="${linha}" />

      ${pontosSvg}
    </svg>

    <div class="grafico-labels">
      ${labels.map((label) => `<span>${label}</span>`).join("")}
    </div>
  `;
}

function obterLimiteGrafico(maiorValor) {
  if (maiorValor <= 0) return 1;

  const potencia = Math.pow(10, Math.floor(Math.log10(maiorValor)));
  const normalizado = maiorValor / potencia;

  let multiplicador = 1;

  if (normalizado <= 1) {
    multiplicador = 1;
  } else if (normalizado <= 2) {
    multiplicador = 2;
  } else if (normalizado <= 5) {
    multiplicador = 5;
  } else {
    multiplicador = 10;
  }

  return multiplicador * potencia;
}

function formatarNumeroGrafico(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });
}

function selecionarPontoGrafico(elemento) {
  const areaSelecionada = document.getElementById("valorSelecionadoGrafico");

  if (!areaSelecionada) return;

  const label = elemento.dataset.label;
  const valor = elemento.dataset.valor;

  areaSelecionada.innerHTML = `
    <span>${label}: <strong>${valor}</strong></span>
  `;
}

function montarLabelsGrafico(dados) {
  if (periodoAtual === "dia") {
    return ["08h", "10h", "12h", "14h", "16h", "18h", "20h"];
  }

  if (periodoAtual === "semana") {
    return dados.map((item) => item.label);
  }

  if (periodoAtual === "mes") {
    const totalDias = dados.length;

    const labels = ["1", "5", "10", "15", "20", "25", String(totalDias)];

    return labels.filter((label, index, array) => {
      return array.indexOf(label) === index && Number(label) <= totalDias;
    });
  }

  if (periodoAtual === "ano") {
    return dados.map((item) => item.label);
  }

  return [];
}

// ================================
// DADOS E FILTROS
// ================================

function obterDataDoSistema() {
  const dataLocal = localStorage.getItem("dataAtual");

  if (dataLocal && dataLocal.includes("/")) {
    const [dia, mes, ano] = dataLocal.split("/");
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function carregarTodosAgendamentosRealizados() {
  const agendamentos = [];

  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);

    if (!chave.startsWith("agenda_")) continue;

    const data = chave.replace("agenda_", "");
    const lista = JSON.parse(localStorage.getItem(chave)) || [];

    lista.forEach((item) => {
      if (item.status === "realizado") {
        agendamentos.push({ ...item, data });
      }
    });
  }

  return agendamentos;
}

function filtrarPorDia(ags, data) {
  return ags.filter((a) => a.data === data);
}

function filtrarPorSemana(ags, data) {
  const semana = getNumeroSemana(data);
  const ano = data.slice(0, 4);

  return ags.filter(
    (a) => getNumeroSemana(a.data) === semana && a.data.startsWith(ano),
  );
}

function filtrarPorMes(ags, data) {
  const [ano, mes] = data.split("-");
  return ags.filter((a) => a.data.startsWith(`${ano}-${mes}`));
}

function filtrarPorAno(ags, data) {
  const ano = data.slice(0, 4);
  return ags.filter((a) => a.data.startsWith(ano));
}

// ================================
// CALENDÁRIO
// ================================

btnCalendario.addEventListener("click", () => {
  const dataSelecionada = criarDataLocal(dataAtual);

  mesAtual = dataSelecionada.getMonth();
  anoAtual = dataSelecionada.getFullYear();

  gerarCalendario();

  modalCalendario.style.display = "flex";
});

modalCalendario.addEventListener("click", (e) => {
  if (e.target === modalCalendario) {
    modalCalendario.style.display = "none";
  }
});

function gerarCalendario() {
  calendarioCorpo.innerHTML = "";

  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const nomesMeses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  mesAtualSpan.textContent = `${capitalize(nomesMeses[mesAtual])} ${anoAtual}`;

  for (let i = 0; i < primeiroDia; i++) {
    const vazio = document.createElement("div");
    vazio.classList.add("dia-vazio");
    calendarioCorpo.appendChild(vazio);
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const divDia = document.createElement("div");
    divDia.textContent = String(dia).padStart(2, "0");
    const dataDoDia = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    if (estaNaSemanaSelecionada(dataDoDia)) {
      divDia.classList.add("semana-selecionada");
    }

    if (dataDoDia === dataAtual) {
      divDia.classList.add("dia-selecionado");
    }

    divDia.addEventListener("click", () => {
      const mes = String(mesAtual + 1).padStart(2, "0");
      const diaStr = String(dia).padStart(2, "0");

      dataAtual = `${anoAtual}-${mes}-${diaStr}`;

      modalCalendario.style.display = "none";
      atualizarRelatorio();
    });

    calendarioCorpo.appendChild(divDia);
  }
}

btnMesAnterior.addEventListener("click", () => {
  mesAtual--;

  if (mesAtual < 0) {
    mesAtual = 11;
    anoAtual--;
  }

  gerarCalendario();
});

btnMesSeguinte.addEventListener("click", () => {
  mesAtual++;

  if (mesAtual > 11) {
    mesAtual = 0;
    anoAtual++;
  }

  gerarCalendario();
});

function obterDadosPeriodoAnterior() {
  const agendamentos = carregarTodosAgendamentosRealizados();

  let listaAnterior = [];

  const data = criarDataLocal(dataAtual);

  if (periodoAtual === "dia") {
    data.setDate(data.getDate() - 1);
    listaAnterior = filtrarPorDia(agendamentos, converterDataParaTexto(data));
  }

  if (periodoAtual === "semana") {
    data.setDate(data.getDate() - 7);
    listaAnterior = filtrarPorSemana(
      agendamentos,
      converterDataParaTexto(data),
    );
  }

  if (periodoAtual === "mes") {
    data.setMonth(data.getMonth() - 1);
    listaAnterior = filtrarPorMes(agendamentos, converterDataParaTexto(data));
  }

  if (periodoAtual === "ano") {
    data.setFullYear(data.getFullYear() - 1);
    listaAnterior = filtrarPorAno(agendamentos, converterDataParaTexto(data));
  }

  const faturamento = somarValores(listaAnterior);
  const atendimentos = listaAnterior.length;

  return {
    lista: listaAnterior,
    faturamento,
    atendimentos,
    ticketMedio: atendimentos > 0 ? faturamento / atendimentos : 0,
  };
}

// ================================
// AUXILIARES
// ================================

function somarValores(lista) {
  return lista.reduce((soma, item) => soma + (Number(item.valor) || 0), 0);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");

  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  return `${Number(dia)} de ${meses[Number(mes) - 1]} de ${ano}`;
}

function formatarMes(data) {
  const [ano, mes] = data.split("-");

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return `${meses[Number(mes) - 1]} de ${ano}`;
}

function criarDataLocal(dataStr) {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function getNumeroSemana(dataStr) {
  const data = criarDataLocal(dataStr);

  const primeiroDomingo = new Date(data.getFullYear(), 0, 1);

  while (primeiroDomingo.getDay() !== 0) {
    primeiroDomingo.setDate(primeiroDomingo.getDate() - 1);
  }

  const diffDias = Math.floor((data - primeiroDomingo) / 86400000);
  return Math.floor(diffDias / 7) + 1;
}

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function capitalize(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function converterDataParaTexto(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}
function obterNomeDiaSemana(dataStr) {
  const dias = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  return dias[criarDataLocal(dataStr).getDay()];
}

function obterPeriodoSemana(dataStr) {
  const data = criarDataLocal(dataStr);

  const inicio = new Date(data);
  inicio.setDate(data.getDate() - data.getDay());

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);

  const diaInicio = String(inicio.getDate()).padStart(2, "0");
  const mesInicio = String(inicio.getMonth() + 1).padStart(2, "0");

  const diaFim = String(fim.getDate()).padStart(2, "0");
  const mesFim = String(fim.getMonth() + 1).padStart(2, "0");

  return `${diaInicio}/${mesInicio} a ${diaFim}/${mesFim}`;
}

function estaNaSemanaSelecionada(dataDiaStr) {
  const dataBase = criarDataLocal(dataAtual);
  const dataDia = criarDataLocal(dataDiaStr);

  const inicioSemana = new Date(dataBase);
  inicioSemana.setDate(dataBase.getDate() - dataBase.getDay());

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);

  return dataDia >= inicioSemana && dataDia <= fimSemana;
}
