window.onload = () => {
  const listaHorarios = document.getElementById("lista-horarios");
  const dataAgenda = document.getElementById("data-agenda");
  const btnAnterior = document.getElementById("btnAnterior");
  const btnProximo = document.getElementById("btnProximo");

  // 🔧 ADICIONADO – Referências ao modal de opções
  const modalOpcoes = document.getElementById("modal-opcoes");
  const textoHorario = document.getElementById("texto-horario");

  // 🔧 Modal de bloqueio/desbloqueio
  const modalBloqueio = document.getElementById("modal-bloqueio");
  const tituloBloqueio = document.getElementById("titulo-bloqueio");

  const btnConfirmarBloqueio = document.getElementById("btnConfirmarBloqueio");
  const btnCancelarBloqueio = document.getElementById("btnCancelarBloqueio");

  let horarioSelecionado = null;

  let dataAtual = new Date();

  const parametrosUrl = new URLSearchParams(window.location.search);
  const dataRecebida = parametrosUrl.get("data");

  if (dataRecebida) {
    const partes = dataRecebida.split("-");

    if (partes.length === 3) {
      const ano = Number(partes[0]);
      const mes = Number(partes[1]);
      const dia = Number(partes[2]);

      dataAtual = new Date(ano, mes - 1, dia);
    }
  }

  // 🧠 Funções auxiliares
  function formatarDataTitulo(data) {
    const diasSemana = [
      "domingo",
      "segunda-feira",
      "terça-feira",
      "quarta-feira",
      "quinta-feira",
      "sexta-feira",
      "sábado",
    ];

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

    const diaSemana = diasSemana[data.getDay()];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];

    return `${capitalize(diaSemana)} <br> ${dia} de ${mes}`;
  }

  function capitalize(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function getChaveData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function gerarHorariosBase() {
    const horarios = [];
    for (let h = 8; h <= 20; h++) {
      horarios.push({
        hora: `${h.toString().padStart(2, "0")}:00`,
        status: "livre",
      });
      if (h !== 23) {
        horarios.push({
          hora: `${h.toString().padStart(2, "0")}:30`,
          status: "livre",
        });
      }
    }
    return horarios;
  }

  // 🔁 Carrega ou cria os horários do dia
  function carregarHorarios(chave, dataReferencia = dataAtual) {
    const salvo = localStorage.getItem("agenda_" + chave);
    const horarios = salvo ? JSON.parse(salvo) : gerarHorariosBase();

    return aplicarIntervalosFixos(horarios, dataReferencia);
  }

  function carregarIntervalosFixos() {
    const dados = localStorage.getItem("intervalosBloqueios");
    return dados ? JSON.parse(dados) : [];
  }

  function buscarIntervaloPorHorario(hora, dataReferencia = dataAtual) {
    const intervalos = carregarIntervalosFixos();
    const diaSemanaAtual = dataReferencia.getDay();

    return intervalos.find((intervalo) => {
      const bloqueiaHorario = intervalo.horarios.includes(hora);
      const bloqueiaDia = intervalo.diasSemana?.includes(diaSemanaAtual);

      return bloqueiaHorario && bloqueiaDia;
    });
  }

  function aplicarIntervalosFixos(horarios, dataReferencia = dataAtual) {
    return horarios.map((item) => {
      const intervalo = buscarIntervaloPorHorario(item.hora, dataReferencia);

      if (
        intervalo &&
        (item.status === "livre" ||
          item.status === "encaixe" ||
          item.bloqueioAutomatico) &&
        !item.desbloqueioIntervalo
      ) {
        return {
          ...item,
          status: "bloqueado",
          bloqueioAutomatico: true,
          nomeBloqueio: intervalo.nome || "Bloqueado",
        };
      }

      if (!intervalo && item.bloqueioAutomatico) {
        return {
          ...item,
          status: "livre",
          bloqueioAutomatico: false,
          nomeBloqueio: "",
        };
      }

      return item;
    });
  }

  function salvarHorarios(chave, lista) {
    localStorage.setItem("agenda_" + chave, JSON.stringify(lista));
  }

  // 🖥️ Renderiza na tela
  function renderizarHorarios() {
    const chave = getChaveData(dataAtual);
    const horarios = carregarHorarios(chave);
    listaHorarios.innerHTML = "";

    horarios.forEach((item) => {
      const li = document.createElement("li");
      li.className = item.status;
      li.innerHTML = `
<div class="coluna-esquerda">
<span class="hora">${item.hora}</span>
</div>

<div class="conteudo-centro">
${
  item.status === "bloqueado"
    ? `<span class="nome">${item.nomeBloqueio || "Bloqueado"}</span>`
    : `
<span class="nome">${item.cliente || ""}</span>
<span class="servico">${item.servico || ""}</span>
`
}
</div>

<div class="coluna-direita">
${
  item.status === "realizado"
    ? `<span class="icone">${item.pago ? "✅" : "⚠️"}</span>`
    : ""
}
${
  item.status === "realizado" && item.valor
    ? `<span class="valor">R$${item.valor}</span>`
    : ""
}
</div>
`;

      // 🔧 ADICIONADO – Clique no horário livre
      li.addEventListener("click", () => {
        if (item.status === "livre" || item.status === "encaixe") {
          textoHorario.textContent = `Horário: ${item.hora}`;
          horarioSelecionado = item.hora;
          modalOpcoes.classList.add("ativo");
        } else if (item.status === "bloqueado") {
          tituloBloqueio.textContent = "Desbloquear Horário";
          horarioSelecionado = item.hora;
          modalBloqueio.classList.add("ativo");
        } else if (item.status === "agendado") {
          abrirModalAgendamento(item);
        } else if (item.status === "realizado") {
          abrirModalAgendamentoRealizado(item);
        }
      });
      modalOpcoes.addEventListener("click", (e) => {
        if (e.target === modalOpcoes) {
          modalOpcoes.classList.remove("ativo");
          modalOpcoes.classList.remove("oculto");
        }
      });

      listaHorarios.appendChild(li);
    });

    dataAgenda.innerHTML = formatarDataTitulo(dataAtual);
    atualizarResumoDia();
  }

  function atualizarResumoDia() {
    const chave = getChaveData(dataAtual);
    const horarios = carregarHorarios(chave);

    const realizados = horarios.filter((h) => h.status === "realizado");
    const totalValor = realizados.reduce((soma, h) => soma + (h.valor || 0), 0);

    document.getElementById("qtdAtendimentos").textContent = realizados.length;
    document.getElementById("valorTotalDia").textContent =
      totalValor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
  }

  // 📅 Botões para mudar o dia
  btnAnterior.addEventListener("click", () => {
    dataAtual.setDate(dataAtual.getDate() - 1);
    renderizarHorarios();
    verificarSeMostrarBotaoHoje();
  });

  btnProximo.addEventListener("click", () => {
    dataAtual.setDate(dataAtual.getDate() + 1);
    renderizarHorarios();
    verificarSeMostrarBotaoHoje();
  });

  // 🚀 Inicial
  renderizarHorarios();
  const btnVoltarHoje = document.getElementById("btnVoltarHoje");

  function verificarSeMostrarBotaoHoje() {
    const hoje = new Date();
    const mesmaData =
      hoje.getFullYear() === dataAtual.getFullYear() &&
      hoje.getMonth() === dataAtual.getMonth() &&
      hoje.getDate() === dataAtual.getDate();

    btnVoltarHoje.style.display = mesmaData ? "flex" : "flex";
  }

  btnVoltarHoje.addEventListener("click", () => {
    dataAtual = new Date();
    renderizarHorarios();
    verificarSeMostrarBotaoHoje();
  });
  verificarSeMostrarBotaoHoje();

  // =================== CALENDÁRIO ===================

  const btnCalendario = document.getElementById("btnCalendario");
  const modalCalendario = document.getElementById("modal-calendario");
  const calendarioCorpo = document.getElementById("calendarioCorpo");
  const mesAtualSpan = document.getElementById("mesAtual");
  const btnMesAnterior = document.getElementById("mesAnterior");
  const btnMesSeguinte = document.getElementById("mesSeguinte");

  let calendarioData = new Date(dataAtual);

  btnCalendario.addEventListener("click", () => {
    modalCalendario.style.display = "flex";
    gerarCalendario();
  });

  modalCalendario.addEventListener("click", (e) => {
    if (e.target === modalCalendario) {
      modalCalendario.style.display = "none";
    }
  });

  btnMesAnterior.addEventListener("click", () => {
    calendarioData.setMonth(calendarioData.getMonth() - 1);
    gerarCalendario();
  });

  btnMesSeguinte.addEventListener("click", () => {
    calendarioData.setMonth(calendarioData.getMonth() + 1);
    gerarCalendario();
  });

  function gerarCalendario() {
    calendarioCorpo.innerHTML = "";

    const ano = calendarioData.getFullYear();
    const mes = calendarioData.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();

    const nomeMeses = [
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

    mesAtualSpan.textContent = `${nomeMeses[mes]} ${ano}`;

    for (let i = 0; i < primeiroDia; i++) {
      const vazio = document.createElement("div");
      calendarioCorpo.appendChild(vazio);
    }
    const dataSelecionada = new Date(dataAtual); // dia atual da agenda
    const domingoDaSemana = new Date(
      dataSelecionada.getFullYear(),
      dataSelecionada.getMonth(),
      dataSelecionada.getDate() - dataSelecionada.getDay(),
    );

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const diaElemento = document.createElement("div");
      diaElemento.textContent = dia;

      const dataAtualLoop = new Date(ano, mes, dia);

      // Dia selecionado
      if (
        dataAtualLoop.getDate() === dataSelecionada.getDate() &&
        dataAtualLoop.getMonth() === dataSelecionada.getMonth() &&
        dataAtualLoop.getFullYear() === dataSelecionada.getFullYear()
      ) {
        diaElemento.style.backgroundColor = "yellow"; // amarelo forte
        diaElemento.style.fontWeight = "bold";
      }

      // Outros dias da semana (domingo a sábado)
      const diferenca = Math.round(
        (dataAtualLoop - domingoDaSemana) / (1000 * 60 * 60 * 24),
      );
      if (diferenca >= 0 && diferenca <= 6) {
        // só pinta se ainda não for o dia selecionado (evita sobreposição de cor)
        if (!diaElemento.style.backgroundColor) {
          diaElemento.style.backgroundColor = "rgb(255, 255, 209)"; // amarelo clarinho
        }
      }

      diaElemento.addEventListener("click", () => {
        dataAtual.setFullYear(ano, mes, dia);
        renderizarHorarios();
        modalCalendario.style.display = "none";
        verificarSeMostrarBotaoHoje();
      });

      calendarioCorpo.appendChild(diaElemento);
    }
  }

  // Menu lateral
  const botaoMenu = document.getElementById("botao-menu");
  const menuLateral = document.getElementById("menu-lateral");
  const fundoEscuro = document.getElementById("fundo-escuro");

  // Ao clicar em "Bloquear" no modal-opcoes
  document.getElementById("btnBloquear").addEventListener("click", () => {
    modalOpcoes.classList.remove("ativo");
    tituloBloqueio.textContent = "Bloquear horário?";
    modalBloqueio.classList.add("ativo");
  });

  btnCancelarBloqueio.addEventListener("click", () => {
    modalBloqueio.classList.remove("ativo");
  });

  modalBloqueio.addEventListener("click", (e) => {
    if (e.target === modalBloqueio) {
      modalBloqueio.classList.remove("ativo");
    }
  });

  btnConfirmarBloqueio.addEventListener("click", () => {
    const chave = getChaveData(dataAtual);
    const horarios = carregarHorarios(chave);

    // Atualiza o horário atual
    horarios.forEach((item) => {
      if (item.hora === horarioSelecionado) {
        if (tituloBloqueio.textContent.includes("Desbloquear")) {
          item.status = "livre";
          item.desbloqueioIntervalo = true;
          delete item.bloqueioAutomatico;
          delete item.nomeBloqueio;
        } else {
          item.status = "bloqueado";
          delete item.desbloqueioIntervalo;
          delete item.bloqueioAutomatico;
          delete item.nomeBloqueio;
        }
      }
    });

    salvarHorarios(chave, horarios);
    aplicarLogicaEncaixe(getChaveData(dataAtual));
    modalBloqueio.classList.remove("ativo");
    renderizarHorarios();
  });
  const modalAgendar = document.getElementById("modal-agendar");
  const tituloAgendar = document.getElementById("titulo-agendar");
  const inputNomeCliente = document.getElementById("input-nome-cliente");
  const listaServicos = document.getElementById("lista-servicos");
  const btnCancelarAgendar = document.getElementById("btnCancelarAgendar");
  const btnConfirmarAgendar = document.getElementById("btnConfirmarAgendar");

  // Ao clicar em "Agendar" no modal-opcoes
  document.getElementById("btnAgendar").addEventListener("click", () => {
    console.log("Clique em agendar");
    modalOpcoes.classList.remove("ativo");
    tituloAgendar.textContent = `Horário: ${horarioSelecionado}`;
    inputNomeCliente.value = "";
    listaServicos.innerHTML = "";

    const servicos = JSON.parse(localStorage.getItem("servicos")) || [];

    servicos.forEach((serv) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = serv.nome;
      checkbox.id = `serv-${serv.nome}`;

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = serv.nome;

      label.prepend(checkbox);
      listaServicos.appendChild(label);
    });

    modalAgendar.classList.add("ativo");
  });

  // Cancelar
  btnCancelarAgendar.addEventListener("click", () => {
    modalAgendar.classList.remove("ativo");
  });

  // Fechar ao clicar fora
  modalAgendar.addEventListener("click", (e) => {
    if (e.target === modalAgendar) {
      modalAgendar.classList.remove("ativo");
    }
  });

  // Confirmar
  btnConfirmarAgendar.addEventListener("click", () => {
    const nome = inputNomeCliente.value.trim();

    if (!nome) {
      alert("Por favor, preencha o nome do cliente.");
      return;
    }

    const servicosSelecionados = [
      ...listaServicos.querySelectorAll("input:checked"),
    ].map((input) => input.value);

    const chave = getChaveData(dataAtual);
    const horarios = carregarHorarios(chave);

    if (agendamentoEditando) {
      horarios.forEach((item) => {
        if (item.hora === agendamentoEditando.hora) {
          item.cliente = nome;
          item.servico = servicosSelecionados.join(" + ");
        }
      });

      agendamentoEditando = null;
    } else {
      horarios.forEach((item) => {
        if (item.hora === horarioSelecionado) {
          item.status = "agendado";
          item.cliente = nome;
          item.servico = servicosSelecionados.join(" + ");
        }
      });
    }

    salvarHorarios(chave, horarios);
    aplicarLogicaEncaixe(getChaveData(dataAtual));
    modalAgendar.classList.remove("ativo");
    renderizarHorarios();
  });

  /* MODAL DE AGENDADO (QUANDO CLICA EM UM HOARIO AGENDADO) (REALIZAR / EDITAR / CANCELAR*/
  let agendamentoEditando = null;

  function abrirModalAgendamento(item) {
    // Referências ao modal e seus elementos internos

    const modalAgendamento = document.getElementById("modal-agendamento");
    const tituloAgendamento = document.getElementById("titulo-agendamento");
    const descricao = document.getElementById("descricao-agendamento");
    const btnRealizado = document.getElementById("btnRealizado");
    const btnCancelarAgendamento = document.getElementById(
      "btnCancelarAgendamento",
    );
    const btnEditarAgendamento = document.getElementById(
      "btnEditarAgendamento",
    );

    // Dados do agendamento
    const nomeCliente = item.cliente || "-";
    const servicos = item.servico || ""; // já é string formatada

    // Atualiza o conteúdo do modal
    tituloAgendamento.textContent = `Horário: ${item.hora}`;
    descricao.textContent = `${nomeCliente}${servicos ? ": " + servicos : ""}`;

    // Exibe o modal
    modalAgendamento.classList.add("ativo");

    // Fecha o modal ao clicar fora da caixa
    modalAgendamento.addEventListener("click", function (e) {
      if (e.target === modalAgendamento) {
        modalAgendamento.classList.remove("ativo");
      }
    });
    // Evento: Cancelar agendamento
    btnCancelarAgendamento.onclick = function () {
      modalAgendamento.classList.remove("ativo");
      abrirModalCancelar(item);
    };
    // Evento: Realizar serviço
    btnRealizado.onclick = function () {
      modalAgendamento.classList.remove("ativo");
      abrirModalRealizado(item); // já implementado por você
    };
    btnEditarAgendamento.onclick = function () {
      modalAgendamento.classList.remove("ativo");

      agendamentoEditando = item;

      abrirModalEditarAgendamento(item);
    };
  }

  function abrirModalEditarAgendamento(item) {
    tituloAgendar.textContent = `Horário: ${item.hora}`;

    inputNomeCliente.value = item.cliente || "";

    listaServicos.innerHTML = "";

    const servicos = JSON.parse(localStorage.getItem("servicos")) || [];

    const servicosSelecionados = (item.servico || "")
      .split(" + ")
      .map((s) => s.trim());

    servicos.forEach((serv) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = serv.nome;
      checkbox.id = `editar-${serv.nome}`;

      if (servicosSelecionados.includes(serv.nome)) {
        checkbox.checked = true;
      }

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = serv.nome;

      label.prepend(checkbox);
      listaServicos.appendChild(label);
    });

    modalAgendar.classList.add("ativo");
  }

  function abrirModalCancelar(item) {
    console.log("OK", item);
    const modalCancelar = document.getElementById("modal-cancelar");
    const btnVoltarCancelar = document.getElementById("btnVoltarCancelar");
    const btnConfirmarCancelar = document.getElementById(
      "btnConfirmarCancelar",
    );

    modalCancelar.classList.add("ativo");

    // Fecha ao clicar fora do fundo
    modalCancelar.addEventListener("click", (e) => {
      if (e.target === modalCancelar) {
        modalCancelar.classList.remove("ativo");
      }
    });

    // Botão Voltar
    btnVoltarCancelar.onclick = () => {
      modalCancelar.classList.remove("ativo");
    };

    // Botão Confirmar → remove o agendamento
    btnConfirmarCancelar.onclick = () => {
      const chave = getChaveData(dataAtual);
      const horarios = carregarHorarios(chave);

      const index = horarios.findIndex((h) => h.hora === item.hora);
      if (index !== -1) {
        horarios[index].status = "livre";
        delete horarios[index].cliente;
        delete horarios[index].servico;
        delete horarios[index].valor;
      }

      salvarHorarios(chave, horarios);
      aplicarLogicaEncaixe(getChaveData(dataAtual));
      modalCancelar.classList.remove("ativo");
      renderizarHorarios();
    };
  }

  function preencherFormasPagamento() {
    const container = document.getElementById("listaFormasPagamento");
    container.innerHTML = ""; // limpa conteúdo anterior

    const formas = JSON.parse(localStorage.getItem("formasPagamento") || "[]");

    formas.forEach((fp, index) => {
      const id = `fp-${index}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = id;
      checkbox.name = "formaPagamento";
      checkbox.value = fp.nome;

      const label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = fp.nome;

      const inputValor = document.createElement("input");
      inputValor.type = "number";
      inputValor.placeholder = "Valor";
      inputValor.classList.add("valor-forma-pagamento");
      inputValor.style.display = "none";

      // Mostrar input quando marcar
      checkbox.addEventListener("change", () => {
        inputValor.style.display = checkbox.checked ? "inline-block" : "none";
      });

      const div = document.createElement("div");
      div.classList.add("linha-pagamento");
      div.appendChild(checkbox);
      div.appendChild(label);
      div.appendChild(inputValor);

      container.appendChild(div);
    });
  }

  function abrirModalRealizado(item) {
    const modal = document.getElementById("modal-realizado");
    const campoInfo = document.getElementById("info-realizado");
    const radiosPago = document.querySelectorAll('input[name="pago"]');
    const formaPagamento = document.getElementById("grupoFormaPagamento");
    const btnVoltar = document.getElementById("btnVoltarRealizado");
    const btnConfirmar = document.getElementById("btnConfirmarRealizado");
    const campoValorNaoPago = document.getElementById("campoValorNaoPago");
    const inputValorNaoPago = document.getElementById("inputValorNaoPago");
    const listaServicosRealizado = document.getElementById(
      "lista-servicos-realizado",
    );
    const inputNomeRealizado = document.getElementById("inputNomeRealizado");

    // Preenche os dados do serviço no modal
    const servicosTexto = Array.isArray(item.servico)
      ? item.servico.map((s) => s.nome).join(" + ")
      : typeof item.servico === "string"
        ? item.servico
        : "-";

    campoInfo.innerHTML = `Horário: ${item.hora}`;

    inputNomeRealizado.value = item.cliente || "";

    listaServicosRealizado.innerHTML = "";

    const servicosCadastrados =
      JSON.parse(localStorage.getItem("servicos")) || [];

    const servicosMarcados = (item.servico || "")
      .split(" + ")
      .map((s) => s.trim());

    servicosCadastrados.forEach((serv) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = serv.nome;
      checkbox.id = `realizado-${serv.nome}`;

      if (servicosMarcados.includes(serv.nome)) {
        checkbox.checked = true;
      }

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = serv.nome;

      label.prepend(checkbox);
      listaServicosRealizado.appendChild(label);
    });

    // Resetar radios e esconder campos
    radiosPago.forEach((radio) => (radio.checked = false));
    formaPagamento.style.display = "none";
    campoValorNaoPago.style.display = "none";
    inputValorNaoPago.value = "";

    // Comportamento ao marcar "Sim" ou "Não"
    radiosPago.forEach((radio) => {
      radio.onchange = () => {
        if (radio.value === "sim") {
          formaPagamento.style.display = "block";
          campoValorNaoPago.style.display = "none";
          preencherFormasPagamento();
        } else {
          formaPagamento.style.display = "none";
          campoValorNaoPago.style.display = "block";
        }
      };
    });

    // Se já foi pago antes, preencher campos
    if ("pago" in item) {
      const radioSim = document.querySelector(
        'input[name="pago"][value="sim"]',
      );
      const radioNao = document.querySelector(
        'input[name="pago"][value="nao"]',
      );

      if (item.pago) {
        radioSim.checked = true;
        formaPagamento.style.display = "block";
        preencherFormasPagamento();

        setTimeout(() => {
          const checkboxes = document.querySelectorAll(
            '#listaFormasPagamento input[type="checkbox"]',
          );
          item.formaPagamento?.forEach((fp) => {
            checkboxes.forEach((checkbox) => {
              if (checkbox.value === fp.forma) {
                checkbox.checked = true;
                const inputValor = checkbox.parentElement.querySelector(
                  ".valor-forma-pagamento",
                );
                inputValor.style.display = "inline-block";
                inputValor.value = fp.valor;
              }
            });
          });
        }, 100);
      } else {
        radioNao.checked = true;
        campoValorNaoPago.style.display = "block";
        inputValorNaoPago.value = item.valor || " ";
      }
    }

    // Abre o modal
    modal.classList.add("ativo");

    // Fecha ao clicar fora do modal
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("ativo");
      }
    });

    // Botão Voltar
    btnVoltar.onclick = () => {
      modal.classList.remove("ativo");
    };

    // Botão Confirmar
    btnConfirmar.onclick = () => {
      const pago = document.querySelector('input[name="pago"]:checked');
      if (!pago) {
        alert("Selecione se foi pago ou não.");
        return;
      }

      const chave = getChaveData(dataAtual);
      const horarios = carregarHorarios(chave);
      const index = horarios.findIndex((h) => h.hora === item.hora);

      if (index !== -1) {
        horarios[index].status = "realizado";
        horarios[index].pago = pago.value === "sim";

        const nomeAtualizado = inputNomeRealizado.value.trim();

        if (!nomeAtualizado) {
          alert("Informe o nome do cliente.");
          return;
        }

        horarios[index].cliente = nomeAtualizado;

        const servicosRealizados = [
          ...listaServicosRealizado.querySelectorAll("input:checked"),
        ].map((input) => input.value);

        if (servicosRealizados.length === 0) {
          alert("Selecione pelo menos um serviço realizado.");
          return;
        }

        horarios[index].servico = servicosRealizados.join(" + ");

        if (pago.value === "sim") {
          // Se foi pago, pegar formas de pagamento e valores
          const formasSelecionadas = [];
          const checkboxes = document.querySelectorAll(
            '#listaFormasPagamento input[type="checkbox"]:checked',
          );

          checkboxes.forEach((checkbox) => {
            const divPai = checkbox.parentElement;
            const inputValor = divPai.querySelector(".valor-forma-pagamento");
            const valorForma = inputValor.value.trim();

            if (valorForma) {
              formasSelecionadas.push({
                forma: checkbox.value,
                valor: parseFloat(valorForma),
              });
            }
          });

          if (formasSelecionadas.length === 0) {
            alert("Informe ao menos um valor para a forma de pagamento.");
            return;
          }

          horarios[index].valor = formasSelecionadas.reduce(
            (soma, f) => soma + f.valor,
            0,
          );
          horarios[index].formaPagamento = formasSelecionadas;
        } else {
          // Se não foi pago, salvar apenas o valor informado
          const valorInformado = parseFloat(inputValorNaoPago.value);
          if (!valorInformado || isNaN(valorInformado) || valorInformado <= 0) {
            alert("Informe o valor do serviço mesmo que não tenha sido pago.");
            return;
          }

          horarios[index].valor = valorInformado;
          delete horarios[index].formaPagamento;
        }
      }

      salvarHorarios(chave, horarios);
      aplicarLogicaEncaixe(getChaveData(dataAtual));
      modal.classList.remove("ativo");
      renderizarHorarios();
    };
  }

  // Abrir modal de Editar ou Excluir agendamento realizado
  function abrirModalAgendamentoRealizado(item) {
    document.getElementById("hr-realizado").textContent = item.hora || "-";
    document.getElementById("nome-realizado").textContent = item.cliente || "-";
    document.getElementById("servico-realizado").textContent =
      item.servico || "-";
    document.getElementById("valor-realizado").textContent = item.valor || "-";

    // Salva o item atual para ações futuras
    window.itemRealizadoSelecionado = item;

    document
      .getElementById("modal-agendamento-realizado")
      .classList.add("ativo");
  }

  //Fecha o modal ao clicar fora da caixa
  document
    .getElementById("modal-agendamento-realizado")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("ativo");
      }
    });

  function editarRealizado() {
    document
      .getElementById("modal-agendamento-realizado")
      .classList.remove("ativo");
    abrirModalAgendamentoRealizado(window.itemRealizadoSelecionado);
  }

  function excluirRealizado() {
    // Fecha o modal de informações e abre o modal de confirmação
    document
      .getElementById("modal-agendamento-realizado")
      .classList.remove("ativo");
    document.getElementById("modal-confirmar-exclusao").classList.add("ativo");
  }

  function fecharModalExclusaoRealizado() {
    document
      .getElementById("modal-confirmar-exclusao")
      .classList.remove("ativo");
  }

  function confirmarExclusaoRealizado() {
    const item = window.itemRealizadoSelecionado;
    const chave = getChaveData(dataAtual);
    const horarios = carregarHorarios(chave);

    const index = horarios.findIndex((h) => h.hora === item.hora);
    if (index !== -1) {
      horarios[index].status = "livre";
      delete horarios[index].cliente;
      delete horarios[index].servico;
      delete horarios[index].valor;
      delete horarios[index].formaPagamento;
      delete horarios[index].pago;
    }

    salvarHorarios(chave, horarios);
    aplicarLogicaEncaixe(getChaveData(dataAtual));
    document
      .getElementById("modal-confirmar-exclusao")
      .classList.remove("ativo");
    renderizarHorarios();
  }

  window.editarRealizado = function () {
    document
      .getElementById("modal-agendamento-realizado")
      .classList.remove("ativo");
    abrirModalRealizado(window.itemRealizadoSelecionado);
  };
  window.excluirRealizado = excluirRealizado;
  window.fecharModalExclusaoRealizado = fecharModalExclusaoRealizado;
  window.confirmarExclusaoRealizado = confirmarExclusaoRealizado;

  function aplicarLogicaEncaixe(dataSelecionada) {
    const chave = `agenda_${dataSelecionada}`;
    const agenda = JSON.parse(localStorage.getItem(chave)) || [];

    // 🔁 1. Zerar todos os encaixes (volta pra livre se não estiver ocupado)
    for (let i = 0; i < agenda.length; i++) {
      if (agenda[i].status === "encaixe") {
        agenda[i].status = "livre";
      }
    }

    // 🔁 2. Aplicar lógica do encaixe para frente
    for (let i = 0; i < agenda.length - 1; i++) {
      const atual = agenda[i];
      const seguinte = agenda[i + 1];

      const ocupado = ["agendado", "realizado"].includes(atual.status);
      if (ocupado && seguinte.status === "livre") {
        seguinte.status = "encaixe";
      }
    }

    // 🔁 3. Aplicar lógica do encaixe para trás
    for (let i = 1; i < agenda.length; i++) {
      const atual = agenda[i];
      const anterior = agenda[i - 1];

      const ocupado = ["agendado", "realizado"].includes(atual.status);
      if (ocupado && anterior.status === "livre") {
        anterior.status = "encaixe";
      }
    }

    localStorage.setItem(chave, JSON.stringify(agenda));
  }

  //ABRIR MODAL DO WHATSAPP
  function abrirModalWhatsapp() {
    const chave = getChaveData(dataAtual);
    const [ano, mes, diaNum] = chave.split("-");
    const dataObj = new Date(ano, mes - 1, diaNum);
    const diaSemana = dataObj.getDay(); // 0 = domingo
    const domingo = new Date(dataObj);
    domingo.setDate(dataObj.getDate() - diaSemana);

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(domingo);
      dia.setDate(domingo.getDate() + i);
      dias.push(dia);
    }

    const container = document.getElementById("diasSemanaWhatsapp");
    container.innerHTML = "";

    dias.forEach((dia) => {
      const nomeDia = dia.toLocaleDateString("pt-BR", { weekday: "short" });
      const dataTexto = dia.toLocaleDateString("pt-BR", { day: "2-digit" });

      const div = document.createElement("div");
      div.classList.add("dia-caixa");
      div.dataset.data = dia.toLocaleDateString("pt-BR");

      const spanDia = document.createElement("span");
      spanDia.textContent = nomeDia;

      const spanData = document.createElement("div");
      spanData.textContent = dataTexto;

      div.appendChild(spanDia); // Nome do dia (seg, ter...)
      div.appendChild(spanData); // Data real (07/07/2025)

      const hojeTexto = dataObj.toLocaleDateString("pt-BR");

      if (div.dataset.data === hojeTexto) {
        div.classList.add("selecionado");
      }

      div.addEventListener("click", () => {
        div.classList.toggle("selecionado");
      });

      container.appendChild(div);
    });

    const dia = dataObj.getDate().toString().padStart(2, "0");
    const nomeMes = dataObj.toLocaleDateString("pt-BR", { month: "long" });
    document.getElementById("tituloSemana").textContent =
      `Semana do dia ${dia} de ${nomeMes}`;
    document.getElementById("modalWhatsapp").style.display = "flex";
  }
  //BOTAO DE CANCELAR DO MODAL DE WHATSAPP
  function fecharModalWhatsapp() {
    document.getElementById("modalWhatsapp").style.display = "none";
  }
  window.fecharModalWhatsapp = fecharModalWhatsapp;

  //FECHAR AO CLICAR FORA DO MODAL DE WHATSAPP
  document
    .getElementById("modalWhatsapp")
    .addEventListener("click", function (e) {
      if (e.target.id === "modalWhatsapp") {
        fecharModalWhatsapp();
      }
    });

  function converterParaData(dataPtBr) {
    const [dia, mes, ano] = dataPtBr.split("/").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  // 👇 Disponibiliza globalmente para menu.js acessar
  window.abrirModalWhatsapp = abrirModalWhatsapp;

  function encaminharParaWhatsApp() {
    const selecionados = document.querySelectorAll(".dia-caixa.selecionado");
    if (selecionados.length === 0) {
      alert("Selecione pelo menos um dia.");
      return;
    }

    const config = JSON.parse(localStorage.getItem("configWhatsApp")) || {};
    const numero = config.numero?.replace(/\D/g, ""); // remove caracteres não numéricos

    if (!numero) {
      alert("Número do WhatsApp não configurado.");
      return;
    }

    let mensagem = "Horários disponíveis:\n\n";

    selecionados.forEach((div) => {
      const dataPtBr = div.dataset.data; // formato: dd/mm/yyyy
      const [dia, mes, ano] = dataPtBr
        .split("/")
        .map((str) => str.padStart(2, "0"));
      const dataISO = `${ano}-${mes}-${dia}`;
      const dataObj = new Date(ano, mes - 1, dia);

      // Nome do dia da semana
      const nomeDia = dataObj.toLocaleDateString("pt-BR", { weekday: "long" });
      mensagem += `${capitalize(nomeDia)} ${dia}/${mes}\n`;

      const dados = carregarHorarios(dataISO, dataObj);

      let horarios = [];

      if (dados) {
        function horaParaMinutos(hora) {
          const [h, m] = hora.split(":").map(Number);
          return h * 60 + m;
        }

        const horariosOtimizados = [];
        let blocoLivre = [];

        // percorre todos os horários do dia (já estão em ordem)
        for (let i = 0; i < dados.length; i++) {
          const item = dados[i];

          if (
            item.status === "livre" ||
            (item.status === "encaixe" &&
              i > 0 &&
              dados[i - 1].status === "livre")
          ) {
            blocoLivre.push(item.hora);
          } else {
            // Quando encontra um horário ocupado, processa o blocoLivre anterior
            while (blocoLivre.length >= 2) {
              const hora = blocoLivre[0];
              horariosOtimizados.push(hora);
              // Remove dois horários (equivale a 1h)
              blocoLivre.splice(0, 2);
            }
            // limpa o resto, pois não dá pra montar mais blocos inteiros
            blocoLivre = [];
          }
        }

        // Se terminar com blocoLivre sobrando
        while (blocoLivre.length >= 2) {
          const hora = blocoLivre[0];
          horariosOtimizados.push(hora);
          blocoLivre.splice(0, 2);
        }

        horarios = horariosOtimizados;
      }

      if (horarios.length === 0) {
        mensagem += "(Sem horários disponíveis)\n\n";
      } else {
        mensagem += horarios.join("\n") + "\n\n";
      }
    });

    const link = `https://wa.me/?text=${encodeURIComponent(mensagem.trim())}`;
    window.open(link, "_blank");
  }
  document
    .getElementById("btnEncaminharParaWhatsApp")
    .addEventListener("click", encaminharParaWhatsApp);

  function capitalize(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service Worker registrado!"))
      .catch((err) => console.error("Erro no SW:", err));
  }

  function verificarAtualizacao() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.update(); // força checar nova versão

          reg.addEventListener("updatefound", () => {
            const novoWorker = reg.installing;
            novoWorker.addEventListener("statechange", () => {
              if (novoWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  alert(
                    "✅ Nova versão disponível! O app será recarregado agora.",
                  );
                  window.location.reload(); // aplica a nova versão
                } else {
                  alert("🆕 Aplicativo atualizado!");
                }
              }
            });
          });

          setTimeout(() => {
            alert("✅ Aplicativo já está na última versão.");
          }, 3000); // caso nenhuma atualização seja detectada
        }
      });
    } else {
      alert("Este navegador não suporta Service Workers.");
    }
  }

  window.verificarAtualizacao = verificarAtualizacao;
};
