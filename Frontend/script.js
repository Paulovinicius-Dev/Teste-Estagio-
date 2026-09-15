const API_URL = "http://127.0.0.1:8000";

const inputData = document.getElementById("data");
const divHorarios = document.getElementById("horarios");
const inputHorarioEscolhido = document.getElementById("horario-escolhido");
const formAgendamento = document.getElementById("form-agendamento");
const inputNome = document.getElementById("nome-paciente");
const listaAgendamentos = document.getElementById("lista-agendamentos");

// Quando o usuário escolhe uma data, busca no backend os horários
// disponíveis e desenha um botão pra cada um na tela.
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

        // Ao clicar num horário, guarda ele no campo escondido do
        // formulário e destaca visualmente só o botão escolhido.
        botao.addEventListener("click", () => {
            document.querySelectorAll("#horarios button").forEach((b) => b.classList.remove("selecionado"));
            inputHorarioEscolhido.value = horario;
            botao.classList.add("selecionado");
        });

        divHorarios.appendChild(botao);
    })
})

// Ao confirmar o formulário, envia o agendamento pro backend
formAgendamento.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const data = inputData.value;
    const horario = inputHorarioEscolhido.value;
    const nome = inputNome.value;

    if (!horario) {
        alert("Escolha um horário antes de confirmar.");
        return;
    }

    const resposta = await fetch(`${API_URL}/appointments`, {
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
    formAgendamento.reset();
    inputHorarioEscolhido.value = "";
    inputData.dispatchEvent(new Event("change")); // atualiza os horários disponíveis
    carregarAgendamentos(); 
});

// Busca todos os agendamentos já feitos e desenha a lista na tela.
// Mostra só o primeiro nome do paciente, não o nome completo — reduz
// a exposição de dados pessoais numa lista visível publicamente.
async function carregarAgendamentos() {
    const resposta = await fetch(`${API_URL}/appointments`);
    const agendamentos = await resposta.json();

    listaAgendamentos.innerHTML = "";
    agendamentos.forEach((ag) => {
        const item = document.createElement("li");
        const primeiroNome = ag.patient_name.split(" ")[0];
        item.textContent = `${ag.date} às ${ag.time} — ${primeiroNome}`;
        listaAgendamentos.appendChild(item);
    });
}

carregarAgendamentos(); // roda assim que a página abre, mostrando o que já existe