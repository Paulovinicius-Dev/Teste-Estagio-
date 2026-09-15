from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import date as date_type
import sqlite3
import requests

app = FastAPI()

# Permissão para o navegador deixar o JS ler a resposta que voltou da api
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db ():
    conn = sqlite3.connect('agendamentos.db')
    conn.row_factory = sqlite3.Row # permite acessar colunas pelo nome 
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            patient_name TEXT NOT NULL,
            UNIQUE(date, time)
        )
    ''')
    conn.commit()
    conn.close()

init_db()


_holidays_cache = {} 

def get_holidays(year: int): # vai ver se o ano já está no cache se não estiver vai buscar na API e armazenar nele
    if year not in _holidays_cache:
        url = f"https://date.nager.at/api/v3/PublicHolidays/{year}/BR"
        response = requests.get(url)
        response.raise_for_status()
        holidays = response.json()
        _holidays_cache[year] = {h["date"] for h in holidays}
    return _holidays_cache[year]

def is_holiday(check_date: date_type) -> bool: #vai ver se a data é feriado chamando a função get_holidays para conseguir os feriados do ano da data que foi colocada e vendo se a data ta na lista de feriados
    return check_date.isoformat() in get_holidays(check_date.year)

def is_weekend(check_date: date_type) -> bool: # vai ver se a data é fim de semana
    return check_date.weekday() >= 5  # 5 = sábado, 6 = Domingo


# Horário de funcionamento da clínica: 08h às 18h, consultas de 1h.
# Gera os horários de INÍCIO de cada consulta (08:00 até 17:00) —
BUSINESS_HOURS = [f"{h:02d}:00" for h in range (8, 18)]

# Retorna os horários livres para uma data, já bloqueando fim de semana e feriado, e removendo horários que já têm agendamento.
@app.get ("/available")
def get_available(date: str):
    check_date = date_type.fromisoformat(date)

    if is_weekend(check_date) or is_holiday(check_date):
        return {
            "date": date,
            "is_business_day": False,
            "available_slots": []
        }
# Busca no banco quais horarios ja estao ocupados nessa data 
    conn = get_db()
    rows = conn.execute(
        "SELECT time FROM appointments WHERE date =?", (date,)
    ).fetchall()
    conn.close()

    booked = {row["time"] for row in rows}
    # Disponivel = todo horário de expediente que não esta ocupado
    available = [t for t in BUSINESS_HOURS if t not in booked]

    return {
    "date": date,
    "is_business_day": True,
    "available_slots": available
}


class AppointmentCreate(BaseModel):
    date: str
    time: str
    patient_name: str

#Aqui vai ser onde o agendamento vai ser criado, ele vai receber a data, horario e nome do paciente, vai verificar se a data é fim de semana ou feriado, se o horario é valido e se o horario ja esta ocupado, caso tudo esteja certo ele vai criar o agendamento no banco de dados

@app.post("/appointments")
def create_appointment(appointment: AppointmentCreate):
    check_date = date_type.fromisoformat(appointment.date)

    if is_weekend(check_date) or is_holiday(check_date):
        raise HTTPException(status_code=400, detail="Não é possivel agendar em finais de semana ou feriados.")

    if appointment.time not in BUSINESS_HOURS:
        raise HTTPException(status_code=400, detail="Horário Inválido ou fora do expediente.")

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO appointments (date, time, patient_name) VALUES (?, ?, ?)",
            (appointment.date, appointment.time, appointment.patient_name)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Esse horário já está ocupado.")
    conn.close()

    return {
        "message": "Agendamento confirmado.",
        "date": appointment.date,
        "time": appointment.time,
        "patient_name": appointment.patient_name

      }
    
app.get("/appointments")
def list_appointments():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, date, time, patient_name FROM appointments ORDER BY date, time" # volta a lista em ordem cronologica de data e horario
    ).fetchall()
    conn.close()    

    return [dict(row) for row in rows] # converte cada linha que vem em formato especial por causa do row_factory para um dicionario normal, para poder ser retornado como json


