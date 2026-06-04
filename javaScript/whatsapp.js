document.addEventListener("DOMContentLoaded", () => {
    const inputNumero = document.getElementById("numeroWhatsapp");
    

    // Carrega dados salvos (se houver)
    const configSalva = JSON.parse(localStorage.getItem("configWhatsApp"));
    if (configSalva) {
        inputNumero.value = configSalva.numero || "";
    }

    // Eventos dos botões
    document.getElementById("btnSalvarWhatsapp").addEventListener("click", salvarConfiguracoesWhatsapp);  
});

function obterDataDoSistema() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function salvarConfiguracoesWhatsapp() {
    const numero = document.getElementById("numeroWhatsapp").value;
    const config = {numero };

    localStorage.setItem("configWhatsApp", JSON.stringify(config));
    alert("Configurações salvas com sucesso ✅");
}



