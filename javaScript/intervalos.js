let modoEdicao = false;
let indiceEditando = null;
let indiceSelecionado = null;

const fundoEscuro = document.getElementById("fundoEscuro");

const modalIntervalo = document.getElementById("modalIntervalo");
const modalOpcoes = document.getElementById("modalOpcoes");
const modalConfirmarExclusao = document.getElementById(
  "modalConfirmarExclusao",
);

const btnAbrirModal = document.getElementById("btnAbrirModal");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnConfirmar = document.getElementById("btnConfirmar");

const btnEditar = document.getElementById("btnEditar");
const btnExcluir = document.getElementById("btnExcluir");

const btnCancelarExclusao = document.getElementById("btnCancelarExclusao");
const btnConfirmarExclusao = document.getElementById("btnConfirmarExclusao");

const nomeIntervalo = document.getElementById("nomeIntervalo");
const listaHorarios = document.getElementById("listaHorarios");
const listaIntervalos = document.getElementById("lista-intervalos");
const listaDiasSemana = document.getElementById("listaDiasSemana");

const horariosPadrao = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
];

function carregarIntervalos() {
  const dados = localStorage.getItem("intervalosBloqueios");
  return dados ? JSON.parse(dados) : [];
}

function salvarIntervalos(lista) {
  localStorage.setItem("intervalosBloqueios", JSON.stringify(lista));
}

function abrirFundo() {
  fundoEscuro.classList.add("ativo");
}

function fecharTudo() {
  fundoEscuro.classList.remove("ativo");
  modalIntervalo.classList.remove("ativo");
  modalOpcoes.classList.remove("ativo");
  modalConfirmarExclusao.classList.remove("ativo");

  modoEdicao = false;
  indiceEditando = null;
  indiceSelecionado = null;
}

function gerarHorariosSelecionaveis(horariosSelecionados = []) {
  listaHorarios.innerHTML = "";

  horariosPadrao.forEach((horario) => {
    const label = document.createElement("label");
    label.className = "horario-opcao";

    if (horariosSelecionados.includes(horario)) {
      label.classList.add("selecionado");
    }

    label.innerHTML = `
            <input type="checkbox" value="${horario}" ${horariosSelecionados.includes(horario) ? "checked" : ""}>
            ${horario}
        `;

    label.addEventListener("click", () => {
      setTimeout(() => {
        const input = label.querySelector("input");

        if (input.checked) {
          label.classList.add("selecionado");
        } else {
          label.classList.remove("selecionado");
        }
      }, 0);
    });

    listaHorarios.appendChild(label);
  });
}

function gerarDiasSemanaSelecionaveis(diasSelecionados = []) {
  const labels = listaDiasSemana.querySelectorAll(".dia-opcao");

  labels.forEach((label) => {
    const input = label.querySelector("input");

    input.checked = diasSelecionados.includes(Number(input.value));

    if (input.checked) {
      label.classList.add("selecionado");
    } else {
      label.classList.remove("selecionado");
    }

    label.onclick = () => {
      input.checked = !input.checked;

      if (input.checked) {
        label.classList.add("selecionado");
      } else {
        label.classList.remove("selecionado");
      }
    };
  });
}

function abrirModalCriar() {
  modoEdicao = false;
  indiceEditando = null;

  nomeIntervalo.value = "";
  gerarHorariosSelecionaveis();
  gerarDiasSemanaSelecionaveis([]);

  abrirFundo();
  modalIntervalo.classList.add("ativo");
}

function abrirModalEditar() {
  const lista = carregarIntervalos();
  const item = lista[indiceSelecionado];

  if (!item) return;

  modoEdicao = true;
  indiceEditando = indiceSelecionado;

  nomeIntervalo.value = item.nome;
  gerarHorariosSelecionaveis(item.horarios);
  gerarDiasSemanaSelecionaveis(item.diasSemana || []);

  modalOpcoes.classList.remove("ativo");
  modalIntervalo.classList.add("ativo");
}

function pegarHorariosSelecionados() {
  const inputsMarcados = listaHorarios.querySelectorAll("input:checked");
  return Array.from(inputsMarcados).map((input) => input.value);
}

function pegarDiasSemanaSelecionados() {
  const inputsMarcados = listaDiasSemana.querySelectorAll("input:checked");
  return Array.from(inputsMarcados).map((input) => Number(input.value));
}

function salvarIntervalo() {
  const nome = nomeIntervalo.value.trim() || "Bloqueio";
  const horarios = pegarHorariosSelecionados();
  const diasSemana = pegarDiasSemanaSelecionados();

  if (horarios.length === 0) {
    alert("Selecione pelo menos um horário.");
    return;
  }

  if (diasSemana.length === 0) {
    alert("Selecione pelo menos um dia da semana.");
    return;
  }

  const lista = carregarIntervalos();

  const novoIntervalo = {
    nome: nome,
    horarios: horarios,
    diasSemana: diasSemana,
  };

  if (modoEdicao && indiceEditando !== null) {
    lista[indiceEditando] = novoIntervalo;
  } else {
    lista.push(novoIntervalo);
  }

  salvarIntervalos(lista);
  renderizarIntervalos();
  fecharTudo();
}

function abrirModalOpcoes(index) {
  indiceSelecionado = index;

  abrirFundo();
  modalOpcoes.classList.add("ativo");
}

function abrirConfirmacaoExclusao() {
  modalOpcoes.classList.remove("ativo");
  modalConfirmarExclusao.classList.add("ativo");
}

function excluirIntervalo() {
  if (indiceSelecionado === null) return;

  const lista = carregarIntervalos();
  lista.splice(indiceSelecionado, 1);

  salvarIntervalos(lista);
  renderizarIntervalos();
  fecharTudo();
}

function formatarDiasSemana(diasSemana = []) {
  const nomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return diasSemana
    .map((dia) => nomes[dia])
    .filter(Boolean)
    .join(", ");
}

function renderizarIntervalos() {
  const lista = carregarIntervalos();
  listaIntervalos.innerHTML = "";

  if (lista.length === 0) {
    listaIntervalos.innerHTML = `
            <p style="color: #555; margin-top: 10px;">
                Nenhum bloqueio criado ainda.
            </p>
        `;
    return;
  }

  lista.forEach((intervalo, index) => {
    const div = document.createElement("div");
    div.className = "intervalo";

    div.innerHTML = `
  <div class="intervalo-topo">
    <span class="intervalo-nome">${intervalo.nome}</span>
    <span class="intervalo-dias">${formatarDiasSemana(intervalo.diasSemana)}</span>
  </div>

  <span class="intervalo-horarios">
    ${intervalo.horarios.join(", ")}
  </span>
`;

    div.addEventListener("click", () => {
      abrirModalOpcoes(index);
    });

    listaIntervalos.appendChild(div);
  });
}

btnAbrirModal.addEventListener("click", abrirModalCriar);
btnFecharModal.addEventListener("click", fecharTudo);
btnConfirmar.addEventListener("click", salvarIntervalo);

btnEditar.addEventListener("click", abrirModalEditar);
btnExcluir.addEventListener("click", abrirConfirmacaoExclusao);

btnCancelarExclusao.addEventListener("click", fecharTudo);
btnConfirmarExclusao.addEventListener("click", excluirIntervalo);

fundoEscuro.addEventListener("click", fecharTudo);

renderizarIntervalos();
