from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
import csv
import os
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
csv_file = 'yonghu.csv'

# 用户数据模型，使用中文字段名称
class User(BaseModel):
    账号: str
    密码: str

# 写入表头到 CSV 文件（如果文件不存在）
def write_header_if_not_exists():
    if not os.path.exists(csv_file):
        with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
            fieldnames = ['账号', '密码']
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()

# 使用 lifespan 事件管理器
@asynccontextmanager
async def lifespan(app: FastAPI):
    write_header_if_not_exists()
    yield

app.router.lifespan_context = lifespan

# 添加在 app = FastAPI() 之后
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册用户的 POST 请求
@app.post("/register")
async def register_user(user: User):
    # 向 CSV 文件中追加用户数据
    with open(csv_file, mode='a', newline='', encoding='utf-8') as file:
        fieldnames = ['账号', '密码']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writerow({'账号': user.账号, '密码': user.密码})

    return {"message": "用户注册成功"}

# 登录用户的 POST 请求
@app.post("/login")
async def login_user(user: User):
    # 读取 CSV 文件中的所有用户数据
    with open(csv_file, mode='r', newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        users = {row['账号']: row['密码'] for row in reader}

    # 检查用户名是否存在
    if user.账号 not in users:
        raise HTTPException(status_code=400, detail="账号不存在")

    # 检查密码是否正确
    if users[user.账号] != user.密码:
        raise HTTPException(status_code=400, detail="密码错误")

    # 登录成功，返回欢迎信息
    return {"message": f"欢迎回来, {user.账号}!"}
