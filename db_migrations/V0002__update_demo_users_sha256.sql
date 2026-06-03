-- Обновляем пароли демо-пользователей на SHA256('1234')
UPDATE t_p64806423_ppu_spraying_pwa.users
SET password_hash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
WHERE phone IN ('+79001234567', '+79007654321');
