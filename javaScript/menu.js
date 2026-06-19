// Carrega o menu inferior dinamicamente no final do <body>
fetch("menu.html")
  .then((res) => res.text())
  .then((data) => {
    document.body.insertAdjacentHTML("beforeend", data);

    marcarPaginaAtiva();
    configurarMenuMais();
    configurarAtualizacao();
  })
  .catch((err) => {
    console.error("Erro ao carregar menu.html:", err);
  });

function marcarPaginaAtiva() {
  const nomePagina = window.location.pathname.split("/").pop() || "index.html";

  const mapaPaginas = {
    "index.html": "index",
    "relatorio.html": "relatorio",
    "pgtoPedentes.html": "pgtoPedentes",
  };

  const paginaAtual = mapaPaginas[nomePagina];

  if (!paginaAtual) return;

  const itemAtivo = document.querySelector(
    `.menu-item[data-page="${paginaAtual}"]`
  );

  if (itemAtivo) {
    itemAtivo.classList.add("ativo");
  }
}

function configurarMenuMais() {
  const btnMais = document.getElementById("btnMais");
  const menuMais = document.getElementById("menuMais");
  const overlay = document.getElementById("menuMaisOverlay");

  if (!btnMais || !menuMais || !overlay) return;

  function abrirMenu() {
    menuMais.classList.add("aberto");
    overlay.classList.add("aberto");
    document.body.style.overflow = "hidden";
  }

  function fecharMenu() {
    menuMais.classList.remove("aberto");
    overlay.classList.remove("aberto");
    document.body.style.overflow = "";
  }

  btnMais.addEventListener("click", abrirMenu);

  overlay.addEventListener("click", fecharMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      fecharMenu();
    }
  });

  const btnLogout = document.getElementById("btnLogout");

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      alert("Logout será implementado quando houver login.");
    });
  }
}

function configurarAtualizacao() {
  const botaoAtualizacao = document.getElementById("btnAtualizacao");

  if (!botaoAtualizacao) return;

  botaoAtualizacao.style.cursor = "pointer";
  botaoAtualizacao.addEventListener("click", verificarAtualizacao);
}

async function verificarAtualizacao() {
  const confirmar = confirm("Deseja verificar atualizações do app?");

  if (!confirmar) return;

  try {
    if ("serviceWorker" in navigator) {
      const registros = await navigator.serviceWorker.getRegistrations();

      for (const registro of registros) {
        await registro.update();
      }
    }

    if ("caches" in window) {
      const nomesCaches = await caches.keys();

      for (const nome of nomesCaches) {
        await caches.delete(nome);
      }
    }

    alert("Atualização verificada. O app será recarregado agora.");
    window.location.reload(true);
  } catch (erro) {
    console.error("Erro ao verificar atualização:", erro);
    alert("Não foi possível verificar atualização agora.");
  }
}