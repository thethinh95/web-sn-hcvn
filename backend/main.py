from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

# Cho phép frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đọc dữ liệu từ JSON
with open("ket_qua.json", "r", encoding="utf-8") as f:
    DATA = json.load(f)

@app.get("/tinh")
def get_all_tinh():
    return [d["tinh"] for d in DATA]

@app.get("/xa/{mahc}")
def get_xa(mahc: int):
    for d in DATA:
        if str(d["tinh"]["mahc"]) == str(mahc):
            return d["xa"]
    return []

@app.get("/full")
def get_full_data():
    return DATA
