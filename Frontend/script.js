const API_URL = "http://127.0.0.1:8000";

const inputData = document.getElementById("data");
const divHorarios = document.getElementById("horarios");
const inputHorarioEscolhido = document.getElementById("horario-escolhido");

// Quando o usuário escolhe uma data, busca os horários disponíveis 
inputData.addEventListener("change", async () => {
    const data = inputData.value;
    const resposta = await fetch(`${API_URL}/available?date=${data}`);
    const resultado = await resposta.json();

    divHorarios.innerHTML = "";

    if (!resultado.is_business_day) {
        divHorarios.textContent = "Não há atendimento nesta data (fim de semana ou feriado).";
        return;
    }
    
    if (resultado.available_slots.length === 0) {
        divHorarios.textContent = "Não há horarios disponiveis nesta data.";
        return;
    }

    resultado.available_slots.forEach((horario) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = horario;
        botao.addEventListener("click", () => {
        });
        divHorarios.appendChild(botao);
    })

})

const formAgendamento = document.getElementById("form-agendamento");
const inputNome = document.getElementById("nome-paciente");

formAgendamento.addEventListenner("submit", async (evento) => {
    evento.preventDefault();

    const data = inputData.value;
    const horario = inputHorarioEscolhido.value;
    const nome = inputNome.value;

    if (!horario) {
        alert("Escolha um horário antes de confirmar.");
        return;
    }

    const resposta = await (`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: data, time: horario, patient_name: nome }),
    });

    if (!resposta.ok) {
        const erro = await resposta.json();
        alert(erro.detail);
        return;
    }

    alert("Agendamento confirmado!");
    formAgendamento.requestFullscreen();
    inputHorarioEscolhido.value = "";
    inputData.dispatchEvent(new Event("change"));
});
