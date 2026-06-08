ALTER TABLE t_p64806423_ppu_spraying_pwa.users DROP CONSTRAINT users_role_check;
ALTER TABLE t_p64806423_ppu_spraying_pwa.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'foreman'));
INSERT INTO t_p64806423_ppu_spraying_pwa.users (name, phone, password_hash, role, is_active)
VALUES ('Администратор', '+79527931594', 'd42e6f15362db6a224a167cd5baa3cb60443d826d4a92717ab327f5d68c5a956', 'admin', true);