"""CRUD для заказов."""
import json
import os
import psycopg2
from datetime import date

SCHEMA = "t_p64806423_ppu_spraying_pwa"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}

def row_to_order(row, cols):
    import decimal
    raw = dict(zip(cols, row))
    order = {}
    for k, v in raw.items():
        if isinstance(v, date):
            order[k] = v.isoformat()
        elif isinstance(v, decimal.Decimal):
            order[k] = float(v)
        elif k == 'id':
            order[k] = str(v)
        elif k == 'photos':
            order[k] = v if isinstance(v, list) else []
        else:
            order[k] = v
    return order

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    try:
        method = event.get("httpMethod", "GET")
        path = event.get("path", "/")
        body = json.loads(event.get("body") or "{}")
        params = event.get("queryStringParameters") or {}
        # Поддержка метода через тело запроса для обхода ограничений
        if method == "POST" and body.get("_method"):
            method = body["_method"]

        cols = ["id","date","customer_name","customer_phone","address",
                "planned_volume_m2","actual_volume_m2","material","price_per_m2",
                "total_amount","crew_rate","crew_salary","status","created_at","created_by","photos","description"]

        # GET /orders/customers — уникальные клиенты из всех заказов
        if method == "GET" and path.rstrip("/").endswith("/customers"):
            cur.execute(f"""
                SELECT DISTINCT ON (customer_phone) customer_name, customer_phone, address
                FROM {SCHEMA}.orders
                WHERE customer_phone IS NOT NULL AND customer_phone != ''
                ORDER BY customer_phone, created_at DESC
            """)
            rows = cur.fetchall()
            customers = [{"customer_name": r[0], "customer_phone": r[1], "address": r[2]} for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps(customers)}

        # GET /orders
        if method == "GET":
            where = "1=1"
            args = []
            if params.get("month") and params.get("year"):
                where += " AND EXTRACT(MONTH FROM date)=%s AND EXTRACT(YEAR FROM date)=%s"
                args += [params["month"], params["year"]]
            cur.execute(f"SELECT {','.join(cols)} FROM {SCHEMA}.orders WHERE {where} ORDER BY date DESC, created_at DESC", args)
            rows = cur.fetchall()
            orders = [row_to_order(r, cols) for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps(orders)}

        # POST /orders
        if method == "POST":
            o = body
            if not o.get("date"):
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите дату"})}
            crew_rate = float(o.get("crew_rate") or 70)
            planned = float(o.get("planned_volume_m2") or 0)
            price = float(o.get("price_per_m2") or 0)
            total = planned * price
            salary = planned * crew_rate
            cur.execute(
                f"""INSERT INTO {SCHEMA}.orders
                    (date,customer_name,customer_phone,address,planned_volume_m2,
                     actual_volume_m2,material,price_per_m2,total_amount,crew_rate,crew_salary,status,created_by,description)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'planned',%s,%s)
                    RETURNING {','.join(cols)}""",
                (o["date"], o["customer_name"], o.get("customer_phone",""), o["address"],
                 planned, None, o.get("material","pena"), price, total, crew_rate, salary, o.get("created_by",""), o.get("description",""))
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps(row_to_order(row, cols))}

        # PUT /orders
        if method == "PUT":
            order_id = body.get("id") or path.rstrip("/").split("/")[-1]
            o = body

            if o.get("status") == "planned":
                cur.execute(
                    f"""UPDATE {SCHEMA}.orders
                        SET status='planned', actual_volume_m2=NULL
                        WHERE id=%s RETURNING {','.join(cols)}""",
                    (order_id,)
                )
            elif o.get("status") == "completed":
                actual = float(o.get("actual_volume_m2") or 0)
                price = float(o.get("price_per_m2") or 0)
                crew_rate = float(o.get("crew_rate") or 70)
                # Берём переданные значения, иначе считаем автоматически
                total = float(o["total_amount"]) if o.get("total_amount") is not None else actual * price
                salary = float(o["crew_salary"]) if o.get("crew_salary") is not None else actual * crew_rate
                cur.execute(
                    f"""UPDATE {SCHEMA}.orders
                        SET status='completed', actual_volume_m2=%s, total_amount=%s, crew_salary=%s
                        WHERE id=%s RETURNING {','.join(cols)}""",
                    (actual, total, salary, order_id)
                )
            else:
                planned = float(o.get("planned_volume_m2") or 0)
                actual = float(o["actual_volume_m2"]) if o.get("actual_volume_m2") is not None else None
                price = float(o.get("price_per_m2") or 0)
                crew_rate = float(o.get("crew_rate") or 70)
                # Берём переданные значения, иначе считаем автоматически
                total = float(o["total_amount"]) if o.get("total_amount") is not None else planned * price
                salary = float(o["crew_salary"]) if o.get("crew_salary") is not None else planned * crew_rate
                cur.execute(
                    f"""UPDATE {SCHEMA}.orders
                        SET date=%s,customer_name=%s,customer_phone=%s,address=%s,
                            planned_volume_m2=%s,actual_volume_m2=%s,material=%s,price_per_m2=%s,
                            total_amount=%s,crew_rate=%s,crew_salary=%s,description=%s
                        WHERE id=%s RETURNING {','.join(cols)}""",
                    (o.get("date"), o.get("customer_name"), o.get("customer_phone",""), o.get("address",""),
                     planned, actual, o.get("material","pena"), price, total, crew_rate, salary, o.get("description",""), order_id)
                )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps(row_to_order(row, cols))}

        # DELETE /orders
        if method == "DELETE":
            order_id = body.get("id") or path.rstrip("/").split("/")[-1]
            cur.execute(f"DELETE FROM {SCHEMA}.orders WHERE id=%s", (order_id,))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()