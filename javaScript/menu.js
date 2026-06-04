// Carrega o menu.html dinamicamente no <header>
fetch("menu.html")
    .then(res => res.text())
    .then(data => {
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
    .catch(err => {
        console.error("Erro ao carregar menu.html:", err);
    });