// ✅ Variáveis principais
const btnAbrirModal = document.getElementById("btnAbrirModal");
const btnFecharModal = document.getElementById("btnFecharModal");
const fundoEscuro = document.getElementById("fundoEscuro");
const modal = document.getElementById("modalServico");
const btnConfirmar = document.getElementById("btnConfirmar");

const nomeInput = document.getElementById("nomeServico");
const valorInput = document.getElementById("valorServico");
const listaServicos = document.getElementById("lista-servicos");

// ✅ Modal de confirmação de exclusão
const modalConfirmarExclusao = document.getElementById(
  "modalConfirmarExclusao",
);
const btnCancelarExclusao = document.getElementById("btnCancelarExclusao");
const btnConfirmarExclusao = document.getElementById("btnConfirmarExclusao");
const modalOpcoes = document.getElementById("modalOpcoes");
const btnEditar = document.getElementById("btnEditar");
const btnExcluir = document.getElementById("btnExcluir");
let indiceParaExcluir = null;

// ✅ Controle de edição
let indiceSelecionado = null;
let modoEdicao = false;
let indiceEditando = null;

// 👉 Abrir modal de novo serviço
btnAbrirModal.addEventListener("click", () => {
  fundoEscuro.classList.add("ativo");
  modal.classList.add("ativo");
  nomeInput.value = "";
  valorInput.value = "";
  modoEdicao = false;
});

// 👉 Fechar modal (reutilizável)
const fecharModal = () => {
  fundoEscuro.classList.remove("ativo");
  modal.classList.remove("ativo");
  modalOpcoes.classList.remove("ativo");
  modalConfirmarExclusao.classList.remove("ativo");

  modoEdicao = false;
  indiceEditando = null;
  indiceParaExcluir = null;
  indiceSelecionado = null;
};

// 👉 Fechar modal ao clicar nos botões ou fundo
btnFecharModal.addEventListener("click", fecharModal);
btnCancelarExclusao.addEventListener("click", fecharModal);
fundoEscuro.addEventListener("click", fecharModal);

// 👉 Confirmar exclusão
btnConfirmarExclusao.addEventListener("click", () => {
  if (indiceParaExcluir !== null) {
    const servicos = carregarServicos();
    servicos.splice(indiceParaExcluir, 1);
    salvarServicos(servicos);
    renderizarServicos();
  }
  fecharModal();
});

// 👉 Confirmar cadastro ou edição
btnConfirmar.addEventListener("click", () => {
  const nome = nomeInput.value.trim();
  const valor = parseFloat(valorInput.value);

  if (nome && !isNaN(valor)) {
    const servicos = carregarServicos();

    if (modoEdicao && indiceEditando !== null) {
      servicos[indiceEditando] = { nome, valor }; // Editar
    } else {
      servicos.push({ nome, valor }); // Adicionar novo
    }

    salvarServicos(servicos);
    renderizarServicos();
    fecharModal();
  } else {
    alert("Preencha o nome e o valor corretamente.");
  }
});

// 📦 LocalStorage
function carregarServicos() {
  const dados = localStorage.getItem("servicos");
  return dados ? JSON.parse(dados) : [];
}

function salvarServicos(lista) {
  localStorage.setItem("servicos", JSON.stringify(lista));
}

// 🖥️ Renderizar lista de serviços
function renderizarServicos() {
  const servicos = carregarServicos();
  listaServicos.innerHTML = "";

  servicos.forEach((servico, index) => {
    const div = document.createElement("div");
    div.className = "servico";

    div.innerHTML = `
  <span class="servico-nome">${servico.nome}</span>
  <span class="servico-valor">R$ ${servico.valor.toFixed(2)}</span>
`;

    div.addEventListener("click", () => {
      indiceSelecionado = index;

      fundoEscuro.classList.add("ativo");
      modalOpcoes.classList.add("ativo");
    });

    listaServicos.appendChild(div);
  });
}

btnEditar.addEventListener("click", () => {
  if (indiceSelecionado === null) return;

  const servicos = carregarServicos();
  const servico = servicos[indiceSelecionado];

  nomeInput.value = servico.nome;
  valorInput.value = servico.valor;

  modoEdicao = true;
  indiceEditando = indiceSelecionado;

  modalOpcoes.classList.remove("ativo");
  modal.classList.add("ativo");
});

btnExcluir.addEventListener("click", () => {
  if (indiceSelecionado === null) return;

  indiceParaExcluir = indiceSelecionado;

  modalOpcoes.classList.remove("ativo");
  modalConfirmarExclusao.classList.add("ativo");
});
// 🚀 Inicial
renderizarServicos();
