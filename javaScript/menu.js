// Carrega o menu.html dinamicamente no <header>
fetch("menu.html")
  .then((res) => res.text())
  .then((data) => {
    const header = document.querySelector("header");
    header.innerHTML = data;

    // Ativa o comportamento do menu lateral
    const botaoMenu = document.getElementById("botao-menu");
    const menuLateral = document.getElementById("menu-lateral");
    const fundoEscuro = document.getElementById("fundo-escuro");

    botaoMenu.addEventListener("click", () => {
      menuLateral.classList.add("ativo");
      fundoEscuro.style.display = "block";
    });

    fundoEscuro.addEventListener("click", () => {
      menuLateral.classList.remove("ativo");
      fundoEscuro.style.display = "none";
    });

    // Define o título com base no nome da página
    const tituloElemento = document.getElementById("titulo-pagina");
    const caminho = window.location.pathname;

    if (tituloElemento) {
      if (caminho.includes("index")) {
        tituloElemento.textContent = "Agenda";
      } else if (caminho.includes("servicos")) {
        tituloElemento.textContent = "Serviços";
      } else if (caminho.includes("pgtoPedentes")) {
        tituloElemento.textContent = "Pagamentos Pendentes";
      } else if (caminho.includes("config")) {
        tituloElemento.textContent = "Configurações";
      } else if (caminho.includes("relatorio")) {
        tituloElemento.textContent = "Relatório";
      } else if (caminho.includes("whatsapp")) {
        tituloElemento.textContent = "WhatsApp";
      } else if (caminho.includes("pagamento")) {
        tituloElemento.textContent = "Forma de Pagamento";
      } else if (caminho.includes("intervalos")) {
        tituloElemento.textContent = "Intervalos";
      } else {
        tituloElemento.textContent = "Agenda";
      }
    }

    // Controla o botão do WhatsApp com base na página
    const botaoWhatsapp = document.getElementById("botao-whatsapp");
    if (botaoWhatsapp) {
      const nomePagina = window.location.pathname.split("/").pop();
      if (!nomePagina.includes("index")) {
        botaoWhatsapp.style.display = "none";
      } else {
        botaoWhatsapp.addEventListener("click", abrirModalWhatsapp);
      }
    }

    // Ativa o botão de Verificar Atualização
    const botaoAtualizacao = document.getElementById("btnAtualizacao");
    if (botaoAtualizacao) {
      botaoAtualizacao.style.cursor = "pointer";

      // Aguarda até garantir que a função existe
      if (typeof window.verificarAtualizacao === "function") {
        botaoAtualizacao.addEventListener("click", window.verificarAtualizacao);
      } else {
        console.warn("Função verificarAtualizacao ainda não está disponível.");
      }
    }
  })
  .catch((err) => {
    console.error("Erro ao carregar menu.html:", err);
  });

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

document.addEventListener("click", (event) => {
  if (event.target.id === "btnAtualizacao") {
    verificarAtualizacao();
  }
});
