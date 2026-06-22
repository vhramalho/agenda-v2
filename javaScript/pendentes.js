const LIMITE_PAGOS_RECENTES = 10;
const DIAS_RANKING_PENDENCIAS = 90;

document.addEventListener("DOMContentLoaded", () => {
  const estadoTela = {
    mostrarTodosPendentes: false,
    mostrarTodosPagos: false,
    mostrarRankingCompleto: false,
  };

  const elementos = {
    totalPendente: document.getElementById("totalPendente"),
    quantidadePendentes: document.getElementById("quantidadePendentes"),
    contadorQuemDeve: document.getElementById("contadorQuemDeve"),

    listaPendentes: document.getElementById("listaPendentes"),
    listaPagosRecentes: document.getElementById("listaPagosRecentes"),
    rankingDevedores: document.getElementById("rankingDevedores"),

    btnVerTodosPendentes: document.getElementById("btnVerTodosPendentes"),
    btnVerTodosPagos: document.getElementById("btnVerTodosPagos"),
    btnVerRanking: document.getElementById("btnVerRanking"),
  };

  const dados = carregarDadosFinanceiros();

  renderizarTela(dados, estadoTela, elementos);

  elementos.btnVerTodosPendentes?.addEventListener("click", () => {
    estadoTela.mostrarTodosPendentes = !estadoTela.mostrarTodosPendentes;
    renderizarPendentes(dados.pendentes, estadoTela, elementos);
  });

  elementos.btnVerTodosPagos?.addEventListener("click", () => {
    estadoTela.mostrarTodosPagos = !estadoTela.mostrarTodosPagos;
    renderizarPagosRecentes(dados.pagos, estadoTela, elementos);
  });

  elementos.btnVerRanking?.addEventListener("click", () => {
    estadoTela.mostrarRankingCompleto = !estadoTela.mostrarRankingCompleto;
    renderizarRanking(dados.ranking, estadoTela, elementos);
  });
});

/* =========================
   CARREGAMENTO DOS DADOS
========================= */

function carregarDadosFinanceiros() {
  const pendentes = [];
  const pagos = [];
  const idsAgendamentosExistentes = new Set();
  const servicosCadastrados = carregarJSON("servicos", []);

  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);

    if (!chave || !chave.startsWith("agenda_")) continue;

    const data = chave.replace("agenda_", "");
    const agendamentos = carregarJSON(chave, []);

    agendamentos.forEach((item) => {
      if (item.status !== "realizado") return;

      const registro = montarRegistroFinanceiro(
        item,
        data,
        servicosCadastrados,
      );

      idsAgendamentosExistentes.add(gerarIdPendencia(registro));

      if (item.pago === false) {
        pendentes.push(registro);
      }

      if (item.pago === true) {
        pagos.push(registro);
      }
    });
  }

  registrarPendenciasNoHistorico(pendentes);
  registrarPagosPendentesNoHistorico(pagos);
  limparHistoricosDeAgendamentosExcluidos(idsAgendamentosExistentes);
  limitarHistoricoPagosPendentes();
  limparHistoricoPendenciasAntigas(pendentes);

  const historicoPagosPendentes = carregarJSON("historicoPagosPendentes", []);

  pendentes.sort(ordenarMaisAntigosPrimeiro);
  historicoPagosPendentes.sort(ordenarMaisRecentesPrimeiro);

  return {
    pendentes,
    pagos: historicoPagosPendentes,
    ranking: montarRankingDevedoresHistorico(),
  };
}

function montarRegistroFinanceiro(item, data, servicosCadastrados) {
  const cliente = item.cliente?.trim() || "Sem nome";
  const valor = obterValorAgendamento(item, servicosCadastrados);

  return {
    ...item,
    data,
    cliente,
    valor,
    dataReferenciaPagamento:
      item.dataPagamento ||
      item.dataRecebimento ||
      item.recebidoEm ||
      item.dataPago ||
      data,
  };
}

function obterValorRecebido(item) {
  if (Array.isArray(item.formaPagamento)) {
    return item.formaPagamento.reduce((total, pagamento) => {
      return total + converterNumero(pagamento.valor);
    }, 0);
  }

  if (Array.isArray(item.pagamentos)) {
    return item.pagamentos.reduce((total, pagamento) => {
      return total + converterNumero(pagamento.valor);
    }, 0);
  }

  return (
    converterNumero(item.valorRecebido) ||
    converterNumero(item.valorPago) ||
    converterNumero(item.totalPago) ||
    converterNumero(item.recebido) ||
    converterNumero(item.valor)
  );
}

function obterValorAgendamento(item, servicosCadastrados) {
  const valorDireto = converterNumero(item.valor);

  if (valorDireto > 0) {
    return valorDireto;
  }

  if (!item.servico) {
    return 0;
  }

  const servicosDoItem = Array.isArray(item.servico)
    ? item.servico
    : [item.servico];

  return servicosDoItem.reduce((total, nomeServico) => {
    const servicoEncontrado = servicosCadastrados.find(
      (servico) => servico.nome === nomeServico,
    );

    return total + converterNumero(servicoEncontrado?.valor);
  }, 0);
}

/* =========================
   RENDERIZAÇÃO GERAL
========================= */

function renderizarTela(dados, estadoTela, elementos) {
  renderizarResumo(dados.pendentes, elementos);
  renderizarPendentes(dados.pendentes, estadoTela, elementos);
  renderizarPagosRecentes(dados.pagos, estadoTela, elementos);
  renderizarRanking(dados.ranking, estadoTela, elementos);
}

function renderizarResumo(pendentes, elementos) {
  const total = pendentes.reduce((soma, item) => soma + item.valor, 0);
  const quantidade = pendentes.length;

  if (elementos.totalPendente) {
    elementos.totalPendente.textContent = formatarMoeda(total);
  }

  if (elementos.quantidadePendentes) {
    elementos.quantidadePendentes.textContent = `${quantidade} ${
      quantidade === 1 ? "cobrança" : "cobranças"
    }`;
  }

  if (elementos.contadorQuemDeve) {
    elementos.contadorQuemDeve.textContent = `(${quantidade})`;
  }
}

/* =========================
   QUEM DEVE
========================= */

function renderizarPendentes(pendentes, estadoTela, elementos) {
  const lista = elementos.listaPendentes;
  const botao = elementos.btnVerTodosPendentes;

  if (!lista) return;

  lista.innerHTML = "";

  if (pendentes.length === 0) {
    lista.innerHTML = `<p class="estado-vazio">Nenhum pagamento pendente.</p>`;
    if (botao) botao.style.display = "none";
    return;
  }

  const limite = estadoTela.mostrarTodosPendentes ? pendentes.length : 3;
  const pendentesVisiveis = pendentes.slice(0, limite);

  pendentesVisiveis.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item-pendente";

    card.innerHTML = `
      <div class="avatar-devedor">${criarIniciais(item.cliente)}</div>

      <div class="dados-pendente">
        <strong>${escaparHTML(item.cliente)}</strong>
        <p>
          <span class="valor-pendente-linha">${formatarMoeda(item.valor)}</span>
          <i>•</i>
          <span>${formatarDataCurta(item.data)}</span>
          <i>•</i>
          <span class="texto-atraso">${formatarDiasEmAberto(item.data)}</span>
        </p>
      </div>

      <div class="acao-pendente">
        <button type="button">Receber</button>
      </div>
    `;

    const botaoReceber = card.querySelector("button");

    botaoReceber.addEventListener("click", (evento) => {
      evento.stopPropagation();
      irParaAgenda(item.data);
    });

    card.addEventListener("click", () => {
      irParaAgenda(item.data);
    });

    lista.appendChild(card);
  });

  if (botao) {
    botao.style.display = pendentes.length > 3 ? "block" : "none";
    botao.textContent = estadoTela.mostrarTodosPendentes
      ? "Ver menos"
      : "Ver todos";
  }
}

/* =========================
   PAGOS RECENTEMENTE
========================= */

function renderizarPagosRecentes(pagos, estadoTela, elementos) {
  const lista = elementos.listaPagosRecentes;
  const botao = elementos.btnVerTodosPagos;

  if (!lista) return;

  lista.innerHTML = "";

  if (pagos.length === 0) {
    lista.innerHTML = `<p class="estado-vazio">Nenhum pagamento recebido recentemente.</p>`;
    if (botao) botao.style.display = "none";
    return;
  }

  const limite = estadoTela.mostrarTodosPagos ? pagos.length : 2;
  const pagosVisiveis = pagos.slice(0, limite);

  pagosVisiveis.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item-pago";

    card.innerHTML = `
      <div class="icone-pago">✓</div>

      <div class="dados-pago">
        <strong>${escaparHTML(item.cliente)}</strong>
        <p>
          <span class="texto-pago">${formatarTextoPago(item.dataReferenciaPagamento)}</span>
        </p>
      </div>

      <strong class="valor-pago">${formatarMoeda(item.valor)}</strong>
    `;

    card.addEventListener("click", () => {
      irParaAgenda(item.data);
    });

    lista.appendChild(card);
  });

  if (botao) {
    botao.style.display = pagos.length > 2 ? "block" : "none";
    botao.textContent = estadoTela.mostrarTodosPagos
      ? "Ver menos"
      : "Ver todos";
  }
}

/* =========================
   HISTÓRICO DE PENDÊNCIAS
========================= */

function registrarPendenciasNoHistorico(pendentes) {
  const historico = carregarJSON("historicoPendencias", []);
  const idsRegistrados = new Set(historico.map((item) => item.id));

  pendentes.forEach((item) => {
    const id = gerarIdPendencia(item);

    if (idsRegistrados.has(id)) return;

    historico.push({
      id,
      cliente: item.cliente,
      valor: item.valor,
      data: item.data,
      hora: item.hora || "",
    });

    idsRegistrados.add(id);
  });

  localStorage.setItem("historicoPendencias", JSON.stringify(historico));
}

function gerarIdPendencia(item) {
  return `${item.data}_${item.hora || ""}_${normalizarTexto(item.cliente)}`;
}

function registrarPagosPendentesNoHistorico(pagos) {
  const historicoPendencias = carregarJSON("historicoPendencias", []);
  const historicoPagos = carregarJSON("historicoPagosPendentes", []);

  pagos.forEach((item) => {
    const idAtual = gerarIdPendencia(item);

    const jaFoiPendencia = historicoPendencias.some((pendencia) => {
      const mesmoIdAtual = pendencia.id === idAtual;

      const mesmoRegistro =
        pendencia.data === item.data &&
        (pendencia.hora || "") === (item.hora || "") &&
        normalizarTexto(pendencia.cliente) === normalizarTexto(item.cliente);

      return mesmoIdAtual || mesmoRegistro;
    });

    if (!jaFoiPendencia) return;

    const valorRecebido = obterValorRecebido(item);
    const indexPago = historicoPagos.findIndex((pago) => pago.id === idAtual);

    const registroAtualizado = {
      id: idAtual,
      cliente: item.cliente,
      valor: valorRecebido > 0 ? valorRecebido : item.valor,
      data: item.data,
      hora: item.hora || "",
      momentoPagamento:
        indexPago >= 0
          ? historicoPagos[indexPago].momentoPagamento
          : new Date().toISOString(),
      dataReferenciaPagamento:
        item.dataPagamento ||
        item.dataRecebimento ||
        item.recebidoEm ||
        item.dataPago ||
        obterDataHojeISO(),
    };

    if (indexPago >= 0) {
      historicoPagos[indexPago] = registroAtualizado;
    } else {
      historicoPagos.push(registroAtualizado);
    }
  });

  localStorage.setItem(
    "historicoPagosPendentes",
    JSON.stringify(historicoPagos),
  );
}

function limitarHistoricoPagosPendentes() {
  const historicoPagos = carregarJSON("historicoPagosPendentes", []);

  const historicoLimitado = historicoPagos
    .sort(ordenarMaisRecentesPrimeiro)
    .slice(0, LIMITE_PAGOS_RECENTES);

  localStorage.setItem(
    "historicoPagosPendentes",
    JSON.stringify(historicoLimitado),
  );
}

function limparHistoricosDeAgendamentosExcluidos(idsAgendamentosExistentes) {
  const historicoPendencias = carregarJSON("historicoPendencias", []);
  const historicoPagos = carregarJSON("historicoPagosPendentes", []);

  const pendenciasFiltradas = historicoPendencias.filter((item) =>
    idsAgendamentosExistentes.has(item.id),
  );

  const pagosFiltrados = historicoPagos.filter((item) =>
    idsAgendamentosExistentes.has(item.id),
  );

  localStorage.setItem(
    "historicoPendencias",
    JSON.stringify(pendenciasFiltradas),
  );

  localStorage.setItem(
    "historicoPagosPendentes",
    JSON.stringify(pagosFiltrados),
  );
}

function limparHistoricoPendenciasAntigas(pendentesAtuais) {
  const historicoPendencias = carregarJSON("historicoPendencias", []);
  const idsPendentesAtuais = new Set(
    pendentesAtuais.map((item) => gerarIdPendencia(item)),
  );

  const hoje = zerarHorario(new Date());

  const historicoFiltrado = historicoPendencias.filter((item) => {
    if (idsPendentesAtuais.has(item.id)) {
      return true;
    }

    if (!item.data) {
      return false;
    }

    const dataPendencia = zerarHorario(criarDataLocal(item.data));
    const diasDesdePendencia = Math.floor((hoje - dataPendencia) / 86400000);

    return diasDesdePendencia <= DIAS_RANKING_PENDENCIAS;
  });

  localStorage.setItem(
    "historicoPendencias",
    JSON.stringify(historicoFiltrado),
  );
}

/* =========================
   RANKING
========================= */

function montarRankingDevedoresHistorico() {
  const historico = carregarJSON("historicoPendencias", []);
  const mapa = new Map();

  historico.forEach((item) => {
    const cliente = item.cliente?.trim() || "Sem nome";
    const chave = cliente.toLowerCase();

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        cliente,
        quantidade: 0,
        valorTotal: 0,
      });
    }

    const registro = mapa.get(chave);
    registro.quantidade += 1;
    registro.valorTotal += converterNumero(item.valor);
  });

  return Array.from(mapa.values()).sort((a, b) => {
    if (b.quantidade !== a.quantidade) {
      return b.quantidade - a.quantidade;
    }

    return b.valorTotal - a.valorTotal;
  });
}

function renderizarRanking(ranking, estadoTela, elementos) {
  const lista = elementos.rankingDevedores;
  const botao = elementos.btnVerRanking;

  if (!lista) return;

  lista.innerHTML = "";

  if (ranking.length === 0) {
    lista.innerHTML = `<p class="estado-vazio">Nenhum cliente no ranking.</p>`;
    if (botao) botao.style.display = "none";
    return;
  }

  const limite = estadoTela.mostrarRankingCompleto ? ranking.length : 3;
  const rankingVisivel = ranking.slice(0, limite);

  rankingVisivel.forEach((item, index) => {
    const posicao = index + 1;

    const card = document.createElement("article");
    card.className = "ranking-item";

    card.innerHTML = `
      <span class="ranking-posicao ${classeRanking(posicao)}">${posicao}</span>
      <strong>${escaparHTML(item.cliente)}</strong>
      <em>${item.quantidade} ${item.quantidade === 1 ? "vez" : "vezes"}</em>
    `;

    lista.appendChild(card);
  });

  if (botao) {
    botao.style.display = ranking.length > 3 ? "block" : "none";
    botao.textContent = estadoTela.mostrarRankingCompleto
      ? "Ver menos"
      : "Ver todos";
  }
}

/* =========================
   HELPERS
========================= */

function irParaAgenda(data) {
  window.location.href = `index.html?data=${data}`;
}

function carregarJSON(chave, valorPadrao) {
  try {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : valorPadrao;
  } catch (erro) {
    console.warn(`Erro ao carregar ${chave}:`, erro);
    return valorPadrao;
  }
}

function converterNumero(valor) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === "string") {
    const normalizado = valor
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(".", "")
      .replace(",", ".");

    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterDataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function criarDataLocal(dataTexto) {
  const [ano, mes, dia] = dataTexto.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarDataCurta(dataTexto) {
  const data = criarDataLocal(dataTexto);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");

  return `${dia}/${mes}`;
}

function formatarDiasEmAberto(dataTexto) {
  const hoje = zerarHorario(new Date());
  const data = zerarHorario(criarDataLocal(dataTexto));
  const diferenca = hoje - data;
  const dias = Math.max(0, Math.floor(diferenca / 86400000));

  if (dias === 0) return "hoje";
  if (dias === 1) return "1 dia em aberto";

  return `${dias} dias em aberto`;
}

function formatarTextoPago(dataTexto) {
  const hoje = zerarHorario(new Date());
  const data = zerarHorario(criarDataLocal(dataTexto));
  const diferenca = hoje - data;
  const dias = Math.floor(diferenca / 86400000);

  if (dias === 0) return "Pago hoje";
  if (dias === 1) return "Pago ontem";

  return `Pago em ${formatarDataCurta(dataTexto)}`;
}

function zerarHorario(data) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function ordenarMaisAntigosPrimeiro(a, b) {
  return gerarNumeroOrdenacao(a) - gerarNumeroOrdenacao(b);
}

function ordenarMaisRecentesPrimeiro(a, b) {
  return gerarNumeroOrdenacao(b) - gerarNumeroOrdenacao(a);
}

function gerarNumeroOrdenacao(item) {
  if (item.momentoPagamento) {
    return new Date(item.momentoPagamento).getTime();
  }

  const data = item.dataReferenciaPagamento || item.data;
  const hora = item.hora || "00:00";

  return Number(`${data.replaceAll("-", "")}${hora.replace(":", "")}`);
}

function criarIniciais(nome) {
  const partes = nome.trim().split(" ").filter(Boolean);

  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

function classeRanking(posicao) {
  if (posicao === 1) return "primeiro";
  if (posicao === 2) return "segundo";
  if (posicao === 3) return "terceiro";

  return "";
}

function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
