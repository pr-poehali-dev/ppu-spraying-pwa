"""Авторизация: login, logout, me, управление пользователями (admin). v2"""
import json
import os
import hashlib
import psycopg2

SCHEMA = "t_p64806423_ppu_spraying_pwa"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Authorization",
}


def hash_pwd(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()


def esc(s: str) -> str:
    return str(s).replace("'", "''")


def get_token(event: dict) -> str:
    headers = event.get("headers") or {}
    t = (
        headers.get("X-Auth-Token") or
        headers.get("x-auth-token") or
        headers.get("X-Authorization") or
        headers.get("x-authorization") or ""
    ).replace("Bearer ", "").strip()
    return t


def get_user_by_token(cur, token: str):
    if not token:
        return None
    t = esc(token)
    cur.execute(
        f"""SELECT u.id, u.name, u.phone, u.role
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = '{t}' AND s.expires_at > NOW() AND u.is_active = true"""
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": str(row[0]), "name": row[1], "phone": row[2], "role": row[3]}


def handler(event: dict, context) -> dict:
    """Авторизация пользователей."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    try:
        method = event.get("httpMethod", "GET")
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "")
        token = get_token(event)

        # GET — проверка текущей сессии
        if method == "GET":
            user = get_user_by_token(cur, token)
            if not user:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}

        # LOGIN
        if action == "login":
            phone = esc(body.get("phone", "").strip())
            password = body.get("password", "")
            if not phone or not password:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введите телефон и пароль"})}
            pwd_hash = hash_pwd(password)
            cur.execute(
                f"SELECT id, name, phone, role FROM {SCHEMA}.users WHERE phone = '{phone}' AND password_hash = '{pwd_hash}' AND is_active = true"
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный телефон или пароль"})}
            user = {"id": str(row[0]), "name": row[1], "phone": row[2], "role": row[3]}
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id) VALUES ('{user['id']}') RETURNING token")
            new_token = str(cur.fetchone()[0])
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user, "token": new_token})}

        # LOGOUT
        if action == "logout":
            if token:
                t = esc(token)
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = '{t}'")
                conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # --- Только для admin ---
        current_user = get_user_by_token(cur, token)
        if not current_user or current_user["role"] != "admin":
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}

        # СПИСОК ПОЛЬЗОВАТЕЛЕЙ
        if action == "list_users":
            cur.execute(f"SELECT id, name, phone, role, is_active, created_at FROM {SCHEMA}.users ORDER BY created_at")
            rows = cur.fetchall()
            users = [{"id": str(r[0]), "name": r[1], "phone": r[2], "role": r[3], "is_active": r[4], "created_at": str(r[5])} for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": users})}

        # СОЗДАТЬ ПОЛЬЗОВАТЕЛЯ
        if action == "create_user":
            name = esc(body.get("name", "").strip())
            phone = esc(body.get("phone", "").strip())
            password = body.get("password", "").strip()
            role = body.get("role", "foreman")
            if not name or not phone or not password:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
            if role not in ("admin", "manager", "foreman"):
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверная роль"})}
            pwd_hash = hash_pwd(password)
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (name, phone, password_hash, role) VALUES ('{name}', '{phone}', '{pwd_hash}', '{role}') RETURNING id, name, phone, role, is_active"
            )
            r = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": {"id": str(r[0]), "name": r[1], "phone": r[2], "role": r[3], "is_active": r[4]}})}

        # ОБНОВИТЬ ПОЛЬЗОВАТЕЛЯ
        if action == "update_user":
            uid = esc(body.get("id", ""))
            name = esc(body.get("name", "").strip())
            phone = esc(body.get("phone", "").strip())
            role = body.get("role", "foreman")
            is_active = "true" if body.get("is_active", True) else "false"
            password = body.get("password", "").strip()
            if role not in ("admin", "manager", "foreman"):
                role = "foreman"
            if password:
                pwd_hash = hash_pwd(password)
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET name='{name}', phone='{phone}', role='{role}', is_active={is_active}, password_hash='{pwd_hash}' WHERE id='{uid}' RETURNING id, name, phone, role, is_active"
                )
            else:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET name='{name}', phone='{phone}', role='{role}', is_active={is_active} WHERE id='{uid}' RETURNING id, name, phone, role, is_active"
                )
            r = cur.fetchone()
            conn.commit()
            if not r:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": {"id": str(r[0]), "name": r[1], "phone": r[2], "role": r[3], "is_active": r[4]}})}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестное действие"})}

    finally:
        cur.close()
        conn.close()