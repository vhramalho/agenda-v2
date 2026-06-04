document.addEventListener("DOMContentLoaded", () => {
    const lista = document.getElementById("lista-pendentes");
    let temPendentes = false;

    // Busca os serviços cadastrados para pegar o valor
    const servicosCadastrados = JSON.parse(localStorage.getItem("servicos")) || [];

    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);

        if (chave.startsWith("agenda_")) {
            const agendamentos = JSON.parse(localStorage.getItem(chave)) || [];

            agendamentos.forEach((item) => {
                if (item.status === "realizado" && item.pago === false) {
                    temPendentes = true;

                    // Buscar valor somando os serviços (se houver múltiplos)
                    let valorTotal = 0;
                    let servicosTexto = "";

                    if (Array.isArray(item.servico)) {
                        servicosTexto = item.servico.join(" + ");
                        item.servico.forEach((nome) => {
                            const serv = servicosCadastrados.find(s => s.nome === nome);
                            if (serv) valorTotal += serv.valor;
                        });
                    } else {
                        servicosTexto = item.servico;
                        const serv = servicosCadastrados.find(s => s.nome === item.servico);
                        if (serv) valorTotal = serv.valor;
                    }

                    const card = document.createElement("div");
                    card.classList.add("cartao-pagamento");

                    const dataFormatada = chave.replace("agenda_", "").split("-").reverse().join("/").slice(0, 5); // DD/MM

                    card.innerHTML = `
  <div class="linha-superior">
    <span class="data">${dataFormatada}</span>
    <span class="cliente">${item.cliente || "Sem nome"}</span>
    <span class="valor">R$ ${(item.valor || 0).toFixed(2)}</span>
  </div>
  <div class="linha-inferior">  
    <span class="servicos">${servicosTexto || "Não informado"}</span>
  </div>
`;

                    card.addEventListener("click", () => {
                        const dataParam = chave.replace("agenda_", "");
                        window.location.href = `index.html?data=${dataParam}`;
                    });

                    lista.appendChild(card);
                }
            });
        }
    }

    if (!temPendentes) {
        lista.innerHTML = "<p>Nenhum pagamento pendente encontrado.</p>";
    }
});