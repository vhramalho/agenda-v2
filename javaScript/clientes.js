const CHAVE_CLIENTES = "clientes";
const LIMITE_CLIENTES_INICIAL = 4;

let clientes = [];
let mostrandoTodosClientes = false;

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
  sincronizarClientesComAgenda();
  configurarEventos();
  renderizarClientes();
});

function configurarEventos() {
  const btnAdicionarCliente = document.getElementById("btnAdicionarCliente");
  const btnFecharModalCliente = document.getElementById(
    "btnFecharModalCliente",
  );
  const btnCancelarCliente = document.getElementById("btnCancelarCliente");
  const formCliente = document.getElementById("formCliente");
  const btnVerTodosClientes = document.getElementById("btnVerTodosClientes");
  const cardAniversariantes = document.getElementById("cardAniversariantes");
  const btnFecharModalAniversariantes = document.getElementById(
    "btnFecharModalAniversariantes",
  );
  const cardSemRetornar = document.getElementById("cardSemRetornar");
  const btnFecharModalSemRetornar = document.getElementById(
    "btnFecharModalSemRetornar",
  );

  if (cardSemRetornar) {
    cardSemRetornar.addEventListener("click", abrirModalSemRetornar);
  }

  if (btnFecharModalSemRetornar) {
    btnFecharModalSemRetornar.addEventListener("click", fecharModalSemRetornar);
  }

  if (cardAniversariantes) {
    cardAniversariantes.addEventListener("click", abrirModalAniversariantes);
  }

  if (btnFecharModalAniversariantes) {
    btnFecharModalAniversariantes.addEventListener(
      "click",
      fecharModalAniversariantes,
    );
  }

  if (btnAdicionarCliente) {
    btnAdicionarCliente.addEventListener("click", abrirModalCliente);
  }

  if (btnFecharModalCliente) {
    btnFecharModalCliente.addEventListener("click", fecharModalCliente);
  }

  if (btnCancelarCliente) {
    btnCancelarCliente.addEventListener("click", fecharModalCliente);
  }

  if (formCliente) {
    formCliente.addEventListener("submit", salvarCliente);
  }

  if (btnVerTodosClientes) {
    btnVerTodosClientes.addEventListener("click", alternarListaClientes);
  }

  configurarFechamentoPorCliqueFora();
}

function carregarClientes() {
  clientes = carregarJSON(CHAVE_CLIENTES, []);
}

function salvarClientes() {
  localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes));
}

function sincronizarClientesComAgenda() {
  normalizarClientesExistentes();

  Object.keys(localStorage).forEach((chave) => {
    if (!chave.startsWith("agenda_")) return;

    const dataAgenda = chave.replace("agenda_", "");
    const agendamentos = carregarJSON(chave, []);

    if (!Array.isArray(agendamentos)) return;

    agendamentos.forEach((item) => {
      if (!item || !item.cliente) return;

      const statusValidos = ["agendado", "realizado"];
      if (!statusValidos.includes(item.status)) return;

      criarOuAtualizarClientePorNome(item.cliente, {
        origem: "agenda",
        dataReferencia: dataAgenda,
      });
    });
  });

  salvarClientes();
}

function normalizarClientesExistentes() {
  const mapa = {};

  clientes.forEach((cliente) => {
    const nome = String(cliente.nome || "").trim();
    if (!nome) return;

    const nomeNormalizado = normalizarTexto(nome);

    const clienteNormalizado = {
      id: cliente.id || gerarIdCliente(),
      nome,
      nomeNormalizado,
      telefone: cliente.telefone || "",
      aniversario: {
        dia: cliente.aniversario?.dia || "",
        mes: cliente.aniversario?.mes || "",
        ano: cliente.aniversario?.ano || "",
      },
      observacao: cliente.observacao || "",
      criadoEm: cliente.criadoEm || new Date().toISOString(),
      atualizadoEm: cliente.atualizadoEm || cliente.criadoEm || new Date().toISOString(),
      origem: cliente.origem || "manual",
    };

    if (!mapa[nomeNormalizado]) {
      mapa[nomeNormalizado] = clienteNormalizado;
      return;
    }

    mapa[nomeNormalizado] = mesclarClientes(
      mapa[nomeNormalizado],
      clienteNormalizado,
    );
  });

  clientes = Object.values(mapa);
}

function criarOuAtualizarClientePorNome(nome, dadosExtras = {}) {
  const nomeLimpo = String(nome || "").trim();
  if (!nomeLimpo) return null;

  const nomeNormalizado = normalizarTexto(nomeLimpo);
  const agora = new Date().toISOString();

  let clienteExistente = clientes.find((cliente) => {
    return normalizarTexto(cliente.nome) === nomeNormalizado;
  });

  if (!clienteExistente) {
    const novoCliente = {
      id: gerarIdCliente(),
      nome: nomeLimpo,
      nomeNormalizado,
      telefone: dadosExtras.telefone || "",
      aniversario: {
        dia: dadosExtras.aniversario?.dia || "",
        mes: dadosExtras.aniversario?.mes || "",
        ano: dadosExtras.aniversario?.ano || "",
      },
      observacao: dadosExtras.observacao || "",
      criadoEm: dadosExtras.dataReferencia
        ? `${dadosExtras.dataReferencia}T00:00:00.000Z`
        : agora,
      atualizadoEm: agora,
      origem: dadosExtras.origem || "agenda",
    };

    clientes.unshift(novoCliente);
    return novoCliente;
  }

  clienteExistente.nomeNormalizado = nomeNormalizado;
  clienteExistente.atualizadoEm = agora;

  if (dadosExtras.origem === "manual") {
    clienteExistente.nome = nomeLimpo;
    clienteExistente.telefone = dadosExtras.telefone || clienteExistente.telefone || "";
    clienteExistente.aniversario = {
      dia: dadosExtras.aniversario?.dia || clienteExistente.aniversario?.dia || "",
      mes: dadosExtras.aniversario?.mes || clienteExistente.aniversario?.mes || "",
      ano: dadosExtras.aniversario?.ano || clienteExistente.aniversario?.ano || "",
    };
    clienteExistente.observacao =
      dadosExtras.observacao || clienteExistente.observacao || "";
    clienteExistente.origem = "manual";
  }

  return clienteExistente;
}

function mesclarClientes(clientePrincipal, clienteDuplicado) {
  return {
    ...clientePrincipal,
    telefone: clientePrincipal.telefone || clienteDuplicado.telefone || "",
    aniversario: {
      dia:
        clientePrincipal.aniversario?.dia ||
        clienteDuplicado.aniversario?.dia ||
        "",
      mes:
        clientePrincipal.aniversario?.mes ||
        clienteDuplicado.aniversario?.mes ||
        "",
      ano:
        clientePrincipal.aniversario?.ano ||
        clienteDuplicado.aniversario?.ano ||
        "",
    },
    observacao:
      clientePrincipal.observacao || clienteDuplicado.observacao || "",
    origem:
      clientePrincipal.origem === "manual" || clienteDuplicado.origem === "manual"
        ? "manual"
        : "agenda",
    criadoEm:
      new Date(clientePrincipal.criadoEm).getTime() <=
      new Date(clienteDuplicado.criadoEm).getTime()
        ? clientePrincipal.criadoEm
        : clienteDuplicado.criadoEm,
    atualizadoEm: new Date().toISOString(),
  };
}

function abrirModalCliente() {
  const modal = document.getElementById("modalCliente");
  const formCliente = document.getElementById("formCliente");

  if (formCliente) {
    formCliente.reset();
  }

  if (modal) {
    modal.classList.add("aberto");
  }

  const inputNome = document.getElementById("clienteNome");

  if (inputNome) {
    setTimeout(() => inputNome.focus(), 100);
  }
}

function fecharModalCliente() {
  const modal = document.getElementById("modalCliente");

  if (modal) {
    modal.classList.remove("aberto");
  }
}

function salvarCliente(evento) {
  evento.preventDefault();

  const nome = obterValorInput("clienteNome");
  const telefone = obterValorInput("clienteTelefone");
  const dia = obterNumeroInput("clienteAniversarioDia");
  const mes = obterNumeroInput("clienteAniversarioMes");
  const ano = obterNumeroInput("clienteAniversarioAno");
  const observacao = obterValorInput("clienteObservacao");

  if (!nome) {
    alert("Informe o nome do cliente.");
    return;
  }

  if ((dia && !mes) || (!dia && mes)) {
    alert("Preencha dia e mês do aniversário.");
    return;
  }

  if (dia && (dia < 1 || dia > 31)) {
    alert("Dia de aniversário inválido.");
    return;
  }

  if (mes && (mes < 1 || mes > 12)) {
    alert("Mês de aniversário inválido.");
    return;
  }

  const cliente = criarOuAtualizarClientePorNome(nome, {
    telefone,
    aniversario: {
      dia: dia || "",
      mes: mes || "",
      ano: ano || "",
    },
    observacao,
    origem: "manual",
  });

  salvarClientes();
  fecharModalCliente();
  renderizarClientes();
}

function renderizarClientes() {
  renderizarListaClientes();
  renderizarResumoClientes();
  renderizarTopClientes();
  renderizarAniversariantes();
  renderizarSemRetornar();
}

function renderizarListaClientes() {
  const lista = document.getElementById("listaClientes");
  const btnVerTodosClientes = document.getElementById("btnVerTodosClientes");

  if (!lista) return;

  const resumoAgenda = carregarDadosAgendaPorCliente();

  const clientesOrdenados = [...clientes].sort((a, b) => {
    return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
  });

  const clientesVisiveis = mostrandoTodosClientes
    ? clientesOrdenados
    : clientesOrdenados.slice(0, LIMITE_CLIENTES_INICIAL);

  if (clientesVisiveis.length === 0) {
    lista.innerHTML = `
      <p class="estado-vazio-clientes">
        Nenhum cliente cadastrado ainda.
      </p>
    `;

    if (btnVerTodosClientes) {
      btnVerTodosClientes.style.display = "none";
    }

    return;
  }

  lista.innerHTML = clientesVisiveis
    .map((cliente) => {
      const resumo = obterResumoCliente(cliente, resumoAgenda);

      return `
        <article class="cliente-item">
          <div class="avatar-cliente pequeno">${obterIniciais(cliente.nome)}</div>

          <div class="dados-cliente">
            <strong>${escaparHTML(cliente.nome)}</strong>
            <span>${montarTextoUltimaVisita(resumo.ultimaVisita)}</span>
          </div>

          <div class="resumo-cliente">
            <strong>${formatarMoeda(resumo.faturamento)}</strong>
            <span>${resumo.visitas} ${resumo.visitas === 1 ? "visita" : "visitas"}</span>
          </div>
        </article>
      `;
    })
    .join("");

  if (btnVerTodosClientes) {
    btnVerTodosClientes.style.display =
      clientesOrdenados.length > LIMITE_CLIENTES_INICIAL ? "block" : "none";

    btnVerTodosClientes.textContent = mostrandoTodosClientes
      ? "Ver menos"
      : "Ver todos";
  }
}

function renderizarTopClientes() {
  const container = document.getElementById("topClientes");

  if (!container) return;

  const resumoAgenda = carregarDadosAgendaPorCliente();

  const ranking = clientes
    .map((cliente) => {
      const resumo = obterResumoCliente(cliente, resumoAgenda);

      return {
        ...cliente,
        faturamento: resumo.faturamento,
        visitas: resumo.visitas,
      };
    })
    .filter((cliente) => cliente.faturamento > 0 || cliente.visitas > 0)
    .sort((a, b) => {
      if (b.faturamento !== a.faturamento) {
        return b.faturamento - a.faturamento;
      }

      return b.visitas - a.visitas;
    })
    .slice(0, 3);

  if (ranking.length === 0) {
    container.innerHTML = `
      <p class="estado-vazio-clientes">
        Nenhum cliente com atendimento realizado ainda.
      </p>
    `;
    return;
  }

  container.innerHTML = ranking
    .map((cliente, index) => {
      const classesMedalha = ["primeiro", "segundo", "terceiro"];
      const posicao = index + 1;

      return `
        <article class="top-cliente-item">
          <span class="medalha ${classesMedalha[index]}">${posicao}</span>

          <div class="avatar-cliente destaque">${obterIniciais(cliente.nome)}</div>

          <div class="dados-top-cliente">
            <strong>${escaparHTML(cliente.nome)}</strong>
            <span>${cliente.visitas} ${cliente.visitas === 1 ? "visita" : "visitas"}</span>
          </div>

          <div class="valor-top-cliente">
            <strong>${formatarMoeda(cliente.faturamento)}</strong>
            <span>faturados</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderizarResumoClientes() {
  const totalClientes = document.getElementById("totalClientes");

  if (totalClientes) {
    totalClientes.textContent = `(${clientes.length})`;
  }
}

function alternarListaClientes() {
  mostrandoTodosClientes = !mostrandoTodosClientes;
  renderizarListaClientes();
}

function montarTextoCliente(cliente) {
  if (cliente.telefone) {
    return formatarTelefone(cliente.telefone);
  }

  if (cliente.aniversario?.dia && cliente.aniversario?.mes) {
    return `Aniversário ${formatarDoisDigitos(cliente.aniversario.dia)}/${formatarDoisDigitos(cliente.aniversario.mes)}`;
  }

  return "Cliente cadastrado";
}

function configurarFechamentoPorCliqueFora() {
  const modais = document.querySelectorAll(".modal-clientes");

  modais.forEach((modal) => {
    modal.addEventListener("click", (evento) => {
      if (evento.target === modal) {
        modal.classList.remove("aberto");
      }
    });
  });
}

function obterValorInput(id) {
  const elemento = document.getElementById(id);
  return elemento ? elemento.value.trim() : "";
}

function obterNumeroInput(id) {
  const valor = obterValorInput(id);
  return valor ? Number(valor) : "";
}

function carregarJSON(chave, fallback) {
  try {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : fallback;
  } catch (erro) {
    console.error(`Erro ao carregar ${chave}:`, erro);
    return fallback;
  }
}

function gerarIdCliente() {
  return `cliente_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function obterIniciais(nome) {
  const partes = String(nome || "")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (partes.length === 0) return "?";

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function formatarTelefone(telefone) {
  const numeros = String(telefone || "").replace(/\D/g, "");

  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return telefone;
}

function formatarDoisDigitos(valor) {
  return String(valor).padStart(2, "0");
}

function escaparHTML(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function carregarDadosAgendaPorCliente() {
  const resumo = {};

  Object.keys(localStorage).forEach((chave) => {
    if (!chave.startsWith("agenda_")) return;

    const data = chave.replace("agenda_", "");
    const agendamentos = carregarJSON(chave, []);

    if (!Array.isArray(agendamentos)) return;

    agendamentos.forEach((item) => {
      if (!item || item.status !== "realizado") return;

      const nomeCliente = String(item.cliente || "").trim();
      if (!nomeCliente) return;

      const chaveCliente = normalizarTexto(nomeCliente);
      const valor = obterValorAgendamento(item);

      if (!resumo[chaveCliente]) {
        resumo[chaveCliente] = {
          nome: nomeCliente,
          faturamento: 0,
          visitas: 0,
          ultimaVisita: data,
        };
      }

      resumo[chaveCliente].faturamento += valor;
      resumo[chaveCliente].visitas += 1;

      if (data > resumo[chaveCliente].ultimaVisita) {
        resumo[chaveCliente].ultimaVisita = data;
      }
    });
  });

  return resumo;
}

function obterResumoCliente(cliente, resumoAgenda) {
  const chaveCliente = normalizarTexto(cliente.nome);

  return (
    resumoAgenda[chaveCliente] || {
      nome: cliente.nome,
      faturamento: 0,
      visitas: 0,
      ultimaVisita: "",
    }
  );
}

function obterValorAgendamento(item) {
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

function converterNumero(valor) {
  if (typeof valor === "number") return valor;

  if (!valor) return 0;

  return (
    Number(
      String(valor)
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim(),
    ) || 0
  );
}

function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataBR(dataISO) {
  if (!dataISO) return "";

  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function calcularDiasDesde(dataISO) {
  if (!dataISO) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const data = new Date(`${dataISO}T00:00:00`);
  data.setHours(0, 0, 0, 0);

  const diferenca = hoje.getTime() - data.getTime();

  return Math.floor(diferenca / (1000 * 60 * 60 * 24));
}

function montarTextoUltimaVisita(dataISO) {
  if (!dataISO) return "Nenhuma visita realizada";

  const dias = calcularDiasDesde(dataISO);

  if (dias === 0) return "Última visita hoje";
  if (dias === 1) return "Última visita ontem";

  return `Última visita há ${dias} dias`;
}

function obterAniversariantesDoMes() {
  const mesAtual = new Date().getMonth() + 1;

  return clientes
    .filter((cliente) => {
      const aniversario = cliente.aniversario || {};
      return Number(aniversario.mes) === mesAtual && Number(aniversario.dia);
    })
    .sort((a, b) => {
      return Number(a.aniversario.dia) - Number(b.aniversario.dia);
    });
}

function renderizarAniversariantes() {
  const totalAniversariantes = document.getElementById("totalAniversariantes");

  if (!totalAniversariantes) return;

  const aniversariantes = obterAniversariantesDoMes();

  totalAniversariantes.textContent = aniversariantes.length;
}

function abrirModalAniversariantes() {
  renderizarModalAniversariantes();

  const modal = document.getElementById("modalAniversariantes");

  if (modal) {
    modal.classList.add("aberto");
  }
}

function fecharModalAniversariantes() {
  const modal = document.getElementById("modalAniversariantes");

  if (modal) {
    modal.classList.remove("aberto");
  }
}

function renderizarModalAniversariantes() {
  const lista = document.getElementById("listaAniversariantes");

  if (!lista) return;

  const aniversariantes = obterAniversariantesDoMes();

  if (aniversariantes.length === 0) {
    lista.innerHTML = `
      <p class="estado-vazio-clientes">
        Nenhum aniversariante neste mês.
      </p>
    `;
    return;
  }

  lista.innerHTML = aniversariantes
    .map((cliente) => {
      const dia = formatarDoisDigitos(cliente.aniversario.dia);
      const mes = formatarDoisDigitos(cliente.aniversario.mes);
      const telefone = String(cliente.telefone || "").replace(/\D/g, "");

      const botaoWhatsapp = telefone
        ? `
          <button
            type="button"
            class="btn-whatsapp-cliente"
            onclick="enviarWhatsappAniversario('${telefone}', '${escaparAtributo(cliente.nome)}')"
          >
            WhatsApp
          </button>
        `
        : "";

      return `
        <article class="item-modal-cliente">
          <div class="avatar-cliente pequeno">${obterIniciais(cliente.nome)}</div>

          <div class="dados-modal-cliente">
            <strong>${escaparHTML(cliente.nome)}</strong>
            <span>${dia}/${mes}</span>
          </div>

          ${botaoWhatsapp}
        </article>
      `;
    })
    .join("");
}

function enviarWhatsappAniversario(telefone, nome) {
  const primeiroNome = String(nome || "").split(" ")[0] || "tudo bem";

  const mensagem = `Olá, ${primeiroNome}! Passando para te desejar um feliz aniversário! Que Deus abençoe muito sua vida. 🎉`;

  const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
}

function escaparAtributo(texto) {
  return String(texto || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function obterClientesSemRetornar() {
  const resumoAgenda = carregarDadosAgendaPorCliente();

  return clientes
    .map((cliente) => {
      const resumo = obterResumoCliente(cliente, resumoAgenda);
      const diasSemRetornar = calcularDiasDesde(resumo.ultimaVisita);

      return {
        ...cliente,
        faturamento: resumo.faturamento,
        visitas: resumo.visitas,
        ultimaVisita: resumo.ultimaVisita,
        diasSemRetornar,
      };
    })
    .filter((cliente) => {
      return (
        cliente.visitas > 0 &&
        typeof cliente.diasSemRetornar === "number" &&
        cliente.diasSemRetornar >= 20
      );
    })
    .sort((a, b) => {
      return b.diasSemRetornar - a.diasSemRetornar;
    });
}

function obterCategoriasSemRetornar() {
  const clientesSemRetornar = obterClientesSemRetornar();

  return {
    vinte: clientesSemRetornar.filter((cliente) => {
      return cliente.diasSemRetornar >= 20 && cliente.diasSemRetornar <= 29;
    }),

    trinta: clientesSemRetornar.filter((cliente) => {
      return cliente.diasSemRetornar >= 30 && cliente.diasSemRetornar <= 44;
    }),

    quarentaCinco: clientesSemRetornar.filter((cliente) => {
      return cliente.diasSemRetornar >= 45 && cliente.diasSemRetornar <= 59;
    }),

    historico: clientesSemRetornar.filter((cliente) => {
      return cliente.diasSemRetornar >= 60;
    }),
  };
}

function renderizarSemRetornar() {
  const totalSemRetornar = document.getElementById("totalSemRetornar");

  if (!totalSemRetornar) return;

  const categorias = obterCategoriasSemRetornar();

  const totalOperacional =
    categorias.vinte.length +
    categorias.trinta.length +
    categorias.quarentaCinco.length;

  totalSemRetornar.textContent = totalOperacional;
}

function abrirModalSemRetornar() {
  renderizarModalSemRetornar();

  const modal = document.getElementById("modalSemRetornar");

  if (modal) {
    modal.classList.add("aberto");
  }
}

function fecharModalSemRetornar() {
  const modal = document.getElementById("modalSemRetornar");

  if (modal) {
    modal.classList.remove("aberto");
  }
}

function renderizarModalSemRetornar() {
  const lista = document.getElementById("listaSemRetornar");

  if (!lista) return;

  const categorias = obterCategoriasSemRetornar();

  const html = [
    montarCategoriaSemRetornar(
      "20+ dias",
      "20 a 29 dias sem retornar",
      categorias.vinte,
    ),
    montarCategoriaSemRetornar(
      "30+ dias",
      "30 a 44 dias sem retornar",
      categorias.trinta,
    ),
    montarCategoriaSemRetornar(
      "45+ dias",
      "45 a 59 dias sem retornar",
      categorias.quarentaCinco,
    ),
    montarCategoriaSemRetornar(
      "Histórico 60+",
      "60 dias ou mais sem retornar",
      categorias.historico,
    ),
  ].join("");

  lista.innerHTML = html;
}

function montarCategoriaSemRetornar(titulo, subtitulo, clientesCategoria) {
  const total = clientesCategoria.length;

  const itens =
    total === 0
      ? `
        <p class="estado-vazio-clientes pequeno">
          Nenhum cliente nessa faixa.
        </p>
      `
      : clientesCategoria
          .map((cliente) => montarItemSemRetornar(cliente))
          .join("");

  return `
    <section class="grupo-sem-retornar">
      <div class="grupo-sem-retornar-topo">
        <div>
          <h3>${titulo} <span>(${total})</span></h3>
          <p>${subtitulo}</p>
        </div>
      </div>

      <div class="grupo-sem-retornar-lista">
        ${itens}
      </div>
    </section>
  `;
}

function montarItemSemRetornar(cliente) {
  const telefone = String(cliente.telefone || "").replace(/\D/g, "");

  const botaoWhatsapp = telefone
    ? `
      <button
        type="button"
        class="btn-whatsapp-cliente"
        onclick="enviarWhatsappRetorno('${telefone}', '${escaparAtributo(cliente.nome)}')"
      >
        WhatsApp
      </button>
    `
    : "";

  return `
    <article class="item-modal-cliente">
      <div class="avatar-cliente pequeno">${obterIniciais(cliente.nome)}</div>

      <div class="dados-modal-cliente">
        <strong>${escaparHTML(cliente.nome)}</strong>
        <span>${cliente.diasSemRetornar} dias sem retornar</span>
      </div>

      ${botaoWhatsapp}
    </article>
  `;
}

function enviarWhatsappRetorno(telefone, nome) {
  const primeiroNome = String(nome || "").split(" ")[0] || "tudo bem";

  const mensagem = `Olá, ${primeiroNome}! Tudo bem? Passando para lembrar que já tem um tempinho desde sua última visita. Quando quiser, é só me chamar para agendar seu horário.`;

  const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
}
