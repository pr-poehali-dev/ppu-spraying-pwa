"""Авторизация пользователей по телефону и паролю."""
import json
import os
import uuid
import hashlib
import psycopg2

SCHEMA = "t_p64806423_ppu_spraying_pwa"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    try:
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "login")

        def hash_pwd(p: str) -> str:
            return hashlib.sha256(p.encode()).hexdigest()

        # LOGIN
        if action == "login":
            phone = body.get("phone", "")
            password = body.get("password", "")
            pwd_hash = hash_pwd(password)

            cur.execute(
                f"""SELECT id, name, phone, role
                    FROM {SCHEMA}.users
                    WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(%s, '[^0-9]', '', 'g')
                    AND password_hash = %s""",
                (phone, pwd_hash)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный телефон или пароль"})}

            user = {"id": str(row[0]), "name": row[1], "phone": row[2], "role": row[3]}
            token = str(uuid.uuid4())
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user, "token": token})}

        # REGISTER
        if action == "register":
            name = body.get("name", "")
            phone = body.get("phone", "")
            password = body.get("password", "")
            role = body.get("role", "foreman")

            if not name or not phone or not password:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}

            cur.execute(
                f"""INSERT INTO {SCHEMA}.users (name, phone, password_hash, role)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, name, phone, role""",
                (name, phone, hash_pwd(password), role)
            )
            row = cur.fetchone()
            conn.commit()
            user = {"id": str(row[0]), "name": row[1], "phone": row[2], "role": row[3]}
            token = str(uuid.uuid4())
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user, "token": token})}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Unknown action"})}

    finally:
        cur.close()
        conn.close()