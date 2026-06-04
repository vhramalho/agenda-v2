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
const modalConfirmarExclusao = document.getElementById("modalConfirmarExclusao");
const btnCancelarExclusao = document.getElementById("btnCancelarExclusao");
const btnConfirmarExclusao = document.getElementById("btnConfirmarExclusao");
let indiceParaExcluir = null;

// ✅ Controle de edição
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
    modalConfirmarExclusao.classList.remove("ativo"); // Também fecha confirmação
    modoEdicao = false;
    indiceEditando = null;
    indiceParaExcluir = null;
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
            <div>
                <span class="servico-nome">${servico.nome}</span><br>
                <span class="servico-valor">R$ ${servico.valor.toFixed(2)}</span>
            </div>
            <div class="acoes" style="display: none;">
                <button class="editar" data-index="${index}"><img src="img/lapis.png"</button>
                <button class="excluir" data-index="${index}"><img src="img/lixeira.png"</button>
            </div>
        `;

        div.addEventListener("click", () => {
            // Oculta todos os outros ícones primeiro
            document.querySelectorAll(".acoes").forEach(outra => {
                outra.style.display = "none";
            });

            // Exibe apenas os do item clicado
            const acoes = div.querySelector(".acoes");
            acoes.style.display = "flex";
        });

        listaServicos.appendChild(div);
    });

    // ✏️ Editar
    document.querySelectorAll(".editar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const servico = carregarServicos()[index];
            nomeInput.value = servico.nome;
            valorInput.value = servico.valor;
            modoEdicao = true;
            indiceEditando = index;
            fundoEscuro.classList.add("ativo");
            modal.classList.add("ativo");
        });
    });

    // 🗑️ Excluir → abre modal de confirmação
    document.querySelectorAll(".excluir").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            indiceParaExcluir = parseInt(btn.dataset.index);
            fundoEscuro.classList.add("ativo");
            modalConfirmarExclusao.classList.add("ativo");
        });
    });
}

// 🚀 Inicial
renderizarServicos();