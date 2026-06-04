"""Загрузка фотографий объекта в S3 и сохранение ссылок в заказе."""
import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = "t_p64806423_ppu_spraying_pwa"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    method = event.get("httpMethod", "POST")

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    try:
        # POST — загрузить фото
        if method == "POST":
            order_id = body.get("order_id")
            image_data = body.get("image")  # base64
            content_type = body.get("content_type", "image/jpeg")

            if not order_id or not image_data:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет данных"})}

            image_bytes = base64.b64decode(image_data)
            ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
            key = f"orders/{order_id}/{uuid.uuid4()}.{ext}"

            s3 = get_s3()
            s3.put_object(
                Bucket='files',
                Key=key,
                Body=image_bytes,
                ContentType=content_type,
            )

            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

            # Добавляем URL в массив photos заказа
            cur.execute(
                f"""UPDATE {SCHEMA}.orders
                    SET photos = photos || %s::jsonb
                    WHERE id = %s
                    RETURNING photos""",
                (json.dumps([cdn_url]), order_id)
            )
            row = cur.fetchone()
            conn.commit()

            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Заказ не найден"})}

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"url": cdn_url, "photos": row[0]})}

        # DELETE — удалить фото
        if method == "DELETE":
            order_id = body.get("order_id")
            photo_url = body.get("url")

            if not order_id or not photo_url:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет данных"})}

            cur.execute(
                f"""UPDATE {SCHEMA}.orders
                    SET photos = (
                        SELECT jsonb_agg(p)
                        FROM jsonb_array_elements(photos) p
                        WHERE p::text != %s
                    )
                    WHERE id = %s
                    RETURNING photos""",
                (json.dumps(photo_url), order_id)
            )
            row = cur.fetchone()
            conn.commit()

            photos = row[0] if row and row[0] else []
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"photos": photos})}

        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}

    finally:
        cur.close()
        conn.close()
