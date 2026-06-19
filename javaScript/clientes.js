document.addEventListener("DOMContentLoaded", () => {
  const listaClientes = document.getElementById("listaClientes");
  const inputBusca = document.getElementById("inputBuscaCliente");

  const modalCliente = document.getElementById("modalCliente");
  const btnNovoCliente = document.getElementById("btnNovoCliente");
  const btnCancelarCliente = document.getElementById("btnCancelarCliente");
  const btnSalvarCliente = document.getElementById("btnSalvarCliente");

  const inputNomeCliente = document.getElementById("inputNomeCliente");
  const inputTelefoneCliente = document.getElementById("inputTelefoneCliente");
  const inputDiaAniversario = document.getElementById("inputDiaAniversario");
  const inputMesAniversario = document.getElementById("inputMesAniversario");
  const inputAnoAniversario = document.getElementById("inputAnoAniversario");
  const inputObservacaoCliente = document.getElementById(
    "inputObservacaoCliente",
  );

  let clientes = [];

  let filtroAtual = "todos";

  function aplicarFiltro(tipo) {
  filtroAtual = tipo;

  let listaFiltrada = [...clientes];

  if (tipo === "aniversariantes") {
    listaFiltrada = clientes.filter(ehAniversarianteDoMes);
  }

  if (tipo === "sumidos") {
    listaFiltrada = clientes.filter(ehClienteSumido);
  }

  if (tipo === "destaque") {
    listaFiltrada.sort(
      (a, b) => b.totalGasto - a.totalGasto,
    );
  }

  renderizarClientes(listaFiltrada);

  atualizarCardsAtivos();
}

function atualizarCardsAtivos() {
  document
    .querySelectorAll(".mini-card-cliente")
    .forEach((card) => {
      card.classList.remove("ativo");
    });

  if (filtroAtual === "todos") {
    document
      .getElementById("cardTotalClientes")
      .classList.add("ativo");
  }

  if (filtroAtual === "aniversariantes") {
    document
      .getElementById("cardAniversariantes")
      .classList.add("ativo");
  }

  if (filtroAtual === "sumidos") {
    document
      .getElementById("cardClientesSumidos")
      .classList.add("ativo");
  }

  if (filtroAtual === "destaque") {
    document
      .getElementById("cardClienteDestaque")
      .classList.add("ativo");
  }
}

document
  .getElementById("cardTotalClientes")
  .addEventListener("click", () => {
    aplicarFiltro("todos");
  });

document
  .getElementById("cardAniversariantes")
  .addEventListener("click", () => {
    aplicarFiltro("aniversariantes");
  });

document
  .getElementById("cardClientesSumidos")
  .addEventListener("click", () => {
    aplicarFiltro("sumidos");
  });

document
  .getElementById("cardClienteDestaque")
  .addEventListener("click", () => {
    aplicarFiltro("destaque");
  });

  function iniciar() {
    sincronizarClientesComAgenda();
    carregarClientes();
  }

  function carregarClientes() {
    const clientesCadastrados =
      JSON.parse(localStorage.getItem("clientes")) || [];

    const estatisticas = gerarEstatisticasClientes();

    clientes = clientesCadastrados.map((cliente) => {
      const dados = estatisticas[normalizarTexto(cliente.nome)] || {
        atendimentos: 0,
        totalGasto: 0,
        ultimaVisita: null,
      };

      return {
        ...cliente,
        atendimentos: dados.atendimentos,
        totalGasto: dados.totalGasto,
        ultimaVisita: dados.ultimaVisita,
      };
    });

    clientes.sort((a, b) => b.totalGasto - a.totalGasto);

    atualizarResumo();
    aplicarFiltro(filtroAtual);
  }

  function sincronizarClientesComAgenda() {
    const clientesCadastrados =
      JSON.parse(localStorage.getItem("clientes")) || [];

    const nomesCadastrados = clientesCadastrados.map((cliente) =>
      normalizarTexto(cliente.nome),
    );

    const estatisticas = gerarEstatisticasClientes();

    Object.values(estatisticas).forEach((clienteAgenda) => {
      const nomeNormalizado = normalizarTexto(clienteAgenda.nome);

      if (nomesCadastrados.includes(nomeNormalizado)) return;

      clientesCadastrados.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        nome: clienteAgenda.nome,
        telefone: "",
        aniversarioDia: "",
        aniversarioMes: "",
        aniversarioAno: "",
        observacao: "",
      });

      nomesCadastrados.push(nomeNormalizado);
    });

    localStorage.setItem("clientes", JSON.stringify(clientesCadastrados));
  }

  function gerarEstatisticasClientes() {
    const mapa = {};

    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);

      if (!chave.startsWith("agenda_")) continue;

      const data = chave.replace("agenda_", "");
      const agenda = JSON.parse(localStorage.getItem(chave)) || [];

      agenda.forEach((item) => {
        if (item.status !== "realizado") return;
        if (!item.cliente) return;

        const nome = item.cliente.trim();
        const chaveCliente = normalizarTexto(nome);

        if (!mapa[chaveCliente]) {
          mapa[chaveCliente] = {
            nome,
            atendimentos: 0,
            totalGasto: 0,
            ultimaVisita: data,
          };
        }

        mapa[chaveCliente].atendimentos++;
        mapa[chaveCliente].totalGasto += Number(item.valor || 0);

        if (data > mapa[chaveCliente].ultimaVisita) {
          mapa[chaveCliente].ultimaVisita = data;
        }
      });
    }

    return mapa;
  }

  function atualizarResumo() {
    const aniversariantes = clientes.filter(ehAniversarianteDoMes);
    const sumidos = clientes.filter(ehClienteSumido);

    document.getElementById("totalClientes").textContent = clientes.length;
    document.getElementById("totalAniversariantes").textContent =
      aniversariantes.length;
    document.getElementById("totalClientesSumidos").textContent =
      sumidos.length;

    document.getElementById("clienteDestaque").textContent =
      clientes.length > 0 ? clientes[0].nome.split(" ")[0] : "-";
  }

  function renderizarClientes(lista) {
    listaClientes.innerHTML = "";

    if (lista.length === 0) {
      listaClientes.innerHTML = `
        <div class="card-cliente">
          <div class="card-cliente-info">
            Nenhum cliente encontrado
          </div>
        </div>
      `;
      return;
    }

    lista.forEach((cliente) => {
      const card = document.createElement("div");
      card.className = "card-cliente";

      card.innerHTML = `
        <div class="card-cliente-nome">
          ${cliente.nome}
        </div>

        <div class="card-cliente-info">
          Última visita: ${
            cliente.ultimaVisita ? formatarData(cliente.ultimaVisita) : "-"
          }
          <br>
          Atendimentos: ${cliente.atendimentos}
          <br>
          Total gasto: ${formatarMoeda(cliente.totalGasto)}
        </div>
      `;

      listaClientes.appendChild(card);
    });
  }

  function abrirModalCliente() {
    inputNomeCliente.value = "";
    inputTelefoneCliente.value = "";
    inputDiaAniversario.value = "";
    inputMesAniversario.value = "";
    inputAnoAniversario.value = "";
    inputObservacaoCliente.value = "";

    modalCliente.classList.add("ativo");
  }

  function fecharModalCliente() {
    modalCliente.classList.remove("ativo");
  }

  function salvarCliente() {
    const nome = inputNomeCliente.value.trim();

    if (!nome) {
      alert("Informe o nome do cliente.");
      return;
    }

    const clientesCadastrados =
      JSON.parse(localStorage.getItem("clientes")) || [];

    const clienteJaExiste = clientesCadastrados.some(
      (cliente) => normalizarTexto(cliente.nome) === normalizarTexto(nome),
    );

    if (clienteJaExiste) {
      alert("Cliente já cadastrado.");
      return;
    }

    const novoCliente = {
      id: Date.now(),
      nome,
      telefone: inputTelefoneCliente.value.trim(),
      aniversarioDia: inputDiaAniversario.value.trim(),
      aniversarioMes: inputMesAniversario.value.trim(),
      aniversarioAno: inputAnoAniversario.value.trim(),
      observacao: inputObservacaoCliente.value.trim(),
    };

    clientesCadastrados.push(novoCliente);

    localStorage.setItem("clientes", JSON.stringify(clientesCadastrados));

    fecharModalCliente();
    carregarClientes();
  }

  inputBusca.addEventListener("input", () => {
    const termo = normalizarTexto(inputBusca.value);

    const filtrados = clientes.filter((cliente) => {
      return (
        normalizarTexto(cliente.nome).includes(termo) ||
        normalizarTexto(cliente.telefone).includes(termo)
      );
    });

    renderizarClientes(filtrados);
  });

  btnNovoCliente.addEventListener("click", abrirModalCliente);
  btnCancelarCliente.addEventListener("click", fecharModalCliente);
  btnSalvarCliente.addEventListener("click", salvarCliente);

  modalCliente.addEventListener("click", (e) => {
    if (e.target === modalCliente) {
      fecharModalCliente();
    }
  });

  function ehAniversarianteDoMes(cliente) {
    const mesAtual = new Date().getMonth() + 1;

    return Number(cliente.aniversarioMes) === mesAtual;
  }

  function ehClienteSumido(cliente) {
    if (!cliente.ultimaVisita) return false;

    const diasSemVisitar = calcularDiasDesde(cliente.ultimaVisita);

    return diasSemVisitar >= 60;
  }

  function calcularDiasDesde(dataTexto) {
    const hoje = new Date();
    const data = criarDataLocal(dataTexto);

    hoje.setHours(0, 0, 0, 0);
    data.setHours(0, 0, 0, 0);

    const diferenca = hoje - data;

    return Math.floor(diferenca / 86400000);
  }

  function criarDataLocal(dataStr) {
    const [ano, mes, dia] = dataStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  iniciar();
});