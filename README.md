# Sistema de Agendamento — Clínica

Mini sistema de agendamento de consultas, desenvolvido como teste técnico para a vaga de Estagiário Full Stack.

## Funcionalidades

- Consulta de horários disponíveis por data
- Criação de agendamentos (bloqueando fins de semana, feriados e horários já ocupados)
- Listagem de agendamentos já feitos
- Integração com a API pública de feriados nacionais ([Nager.Date](https://date.nager.at/))

## Regras de negócio

- Expediente: 08:00 às 18:00
- Consultas de 1 hora cada
- Não é possível agendar em finais de semana
- Não é possível agendar em feriados nacionais (validado via API)
- Não é possível agendar em horário já ocupado

## Tecnologias

**Backend:** Python, FastAPI, SQLite (`sqlite3`, sem ORM)
**Frontend:** HTML, CSS e JavaScript puro (sem framework)

## Como rodar o projeto

### Backend

\`\`\`bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload
\`\`\`

O servidor sobe em `http://127.0.0.1:8000`. Documentação interativa da API em `http://127.0.0.1:8000/docs`.

### Frontend

Abra o arquivo `frontend/index.html` diretamente no navegador (não precisa de servidor nem build).

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/available?date=YYYY-MM-DD` | Lista horários disponíveis numa data |
| POST | `/appointments` | Cria um novo agendamento |
| GET | `/appointments` | Lista todos os agendamentos |

## Observação sobre privacidade

A listagem pública de agendamentos exibe apenas o primeiro nome do paciente, para não expor dados sensíveis de saúde numa tela sem autenticação.