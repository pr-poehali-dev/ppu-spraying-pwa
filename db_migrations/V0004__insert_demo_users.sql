-- SHA256('1234') = 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
INSERT INTO t_p64806423_ppu_spraying_pwa.users (name, phone, password_hash, role)
VALUES
  ('Алексей Петров', '+79001234567', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'manager'),
  ('Иван Смирнов', '+79007654321', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'foreman')
ON CONFLICT (phone) DO UPDATE SET password_hash = EXCLUDED.password_hash;
