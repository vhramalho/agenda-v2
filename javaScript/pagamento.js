// 🔁 Dados fixos iniciais (só adicionados uma vez)
const formasFixas = [
  { nome: "Dinheiro", taxa: 0 },
  { nome: "Pix", taxa: 0 },
  { nome: "Crédito", taxa: 0 },
  { nome: "Débito", taxa: 0 },
];

// 🧠 Estados
let indiceParaExcluir = null;
const modalConfirmarExclusao = document.getElementById(
  "modalConfirmarExclusao",
);
const btnCancelarExclusao = document.getElementById("btnCancelarExclusao");
const btnConfirmarExclusao = document.getElementById("btnConfirmarExclusao");
const modalOpcoes = document.getElementById("modalOpcoes");
const btnEditar = document.getElementById("btnEditar");
const btnExcluir = document.getElementById("btnExcluir");
let modoEdicao = false;
let indiceEditando = null;
let indiceSelecionado = null;

// 🎯 Seletores
const fundoEscuro = document.getElementById("fundoEscuro");
const modal = document.getElementById("modalPagamento");
const btnAbrirModal = document.getElementById("btnAbrirModal");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnConfirmar = document.getElementById("btnConfirmar");
const nomeInput = document.getElementById("nomePagamento");
const taxaInput = document.getElementById("taxaPagamento");
const listaPagamentos = document.getElementById("lista-pagamentos");

// 🗂 LocalStorage
function carregarFormas() {
  const dados = localStorage.getItem("formasPagamento");
  return dados ? JSON.parse(dados) : [];
}

function salvarFormas(lista) {
  localStorage.setItem("formasPagamento", JSON.stringify(lista));
}

// ✅ Inicia com as formas fixas se ainda não houver nada
function iniciarFormasFixas() {
  if (!localStorage.getItem("formasPagamento")) {
    salvarFormas(formasFixas);
  }
}

// 📦 Abrir modal
btnAbrirModal.addEventListener("click", () => {
  fundoEscuro.classList.add("ativo");
  modal.classList.add("ativo");
  nomeInput.value = "";
  taxaInput.value = "";
  modoEdicao = false;
  indiceEditando = null;
});

// ❌ Fechar modal
function fecharModal() {
  fundoEscuro.classList.remove("ativo");
  modal.classList.remove("ativo");
  modalOpcoes.classList.remove("ativo");
  modalConfirmarExclusao.classList.remove("ativo");

  modoEdicao = false;
  indiceEditando = null;
  indiceSelecionado = null;
}
btnFecharModal.addEventListener("click", fecharModal);
fundoEscuro.addEventListener("click", fecharModal);

// 💾 Salvar nova ou editar existente
btnConfirmar.addEventListener("click", () => {
  const nome = nomeInput.value.trim();
  const taxa = parseFloat(taxaInput.value) || 0;

  if (!nome) {
    alert("Preencha o nome corretamente.");
    return;
  }

  const lista = carregarFormas();

  if (modoEdicao && indiceEditando !== null) {
    lista[indiceEditando] = { nome, taxa };
  } else {
    lista.push({ nome, taxa });
  }

  salvarFormas(lista);
  renderizarFormas();
  fecharModal();
});

// 🖥️ Renderiza formas na tela
function renderizarFormas() {
  const lista = carregarFormas();
  listaPagamentos.innerHTML = "";

  lista.forEach((forma, index) => {
    const div = document.createElement("div");
    div.className = "pagamento";

    // Verifica se é fixa ou personalizada
    const ehFixa = forma.nome === "Dinheiro" || forma.nome === "Pix";
    const ehEditavelSimples =
      forma.nome === "Crédito" || forma.nome === "Débito";

    // HTML da ação (ícones)
    const possuiAcoes = ehEditavelSimples || !ehFixa;

    div.innerHTML = `
  <span class="pagamento-nome">${forma.nome}</span>
  <span class="pagamento-taxa">
    ${forma.taxa ? `Taxa ${forma.taxa.toFixed(2)}%` : ""}
  </span>
`;

    if (possuiAcoes) {
      div.addEventListener("click", () => {
        indiceSelecionado = index;

        fundoEscuro.classList.add("ativo");
        modalOpcoes.classList.add("ativo");
      });
    }

    listaPagamentos.appendChild(div);
  });
}

btnEditar.addEventListener("click", () => {
  if (indiceSelecionado === null) return;

  const lista = carregarFormas();
  const item = lista[indiceSelecionado];

  nomeInput.value = item.nome;
  taxaInput.value = item.taxa;

  modoEdicao = true;
  indiceEditando = indiceSelecionado;

  modalOpcoes.classList.remove("ativo");
  modal.classList.add("ativo");
});

btnExcluir.addEventListener("click", () => {
  if (indiceSelecionado === null) return;

  const lista = carregarFormas();
  const item = lista[indiceSelecionado];

  if (item.nome === "Dinheiro" || item.nome === "Pix") {
    alert("Dinheiro e Pix são formas padrão e não podem ser excluídas.");
    return;
  }

  indiceParaExcluir = indiceSelecionado;

  modalOpcoes.classList.remove("ativo");
  modalConfirmarExclusao.classList.add("ativo");
});

// 🚀 Inicialização
iniciarFormasFixas();
renderizarFormas();

// Cancelar exclusão
btnCancelarExclusao.addEventListener("click", () => {
  modalConfirmarExclusao.classList.remove("ativo");
  fundoEscuro.classList.remove("ativo");
  indiceParaExcluir = null;
});

// Confirmar exclusão
btnConfirmarExclusao.addEventListener("click", () => {
  if (indiceParaExcluir !== null) {
    const lista = carregarFormas();
    lista.splice(indiceParaExcluir, 1);
    salvarFormas(lista);
    renderizarFormas();
    indiceParaExcluir = null;
  }
  modalConfirmarExclusao.classList.remove("ativo");
  fundoEscuro.classList.remove("ativo");
});
