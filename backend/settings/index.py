"""Настройки приложения: ставки бригады."""
import json
import os
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

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    try:
        method = event.get("httpMethod", "GET")
        body = json.loads(event.get("body") or "{}")

        # GET /settings
        if method == "GET":
            cur.execute(f"SELECT rate_pena, rate_polimochevina FROM {SCHEMA}.settings WHERE id=1")
            row = cur.fetchone()
            if not row:
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"rate_pena": 70, "rate_polimochevina": 100})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"rate_pena": float(row[0]), "rate_polimochevina": float(row[1])})}

        # POST /settings
        if method == "POST":
            rate_pena = float(body.get("rate_pena", 70))
            rate_poli = float(body.get("rate_polimochevina", 100))
            cur.execute(
                f"""INSERT INTO {SCHEMA}.settings (id, rate_pena, rate_polimochevina, updated_at)
                    VALUES (1, %s, %s, NOW())
                    ON CONFLICT (id) DO UPDATE SET rate_pena=%s, rate_polimochevina=%s, updated_at=NOW()""",
                (rate_pena, rate_poli, rate_pena, rate_poli)
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"rate_pena": rate_pena, "rate_polimochevina": rate_poli})}

        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()
