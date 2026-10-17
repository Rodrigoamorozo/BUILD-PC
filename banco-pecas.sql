-- ============================================================
-- BuildPC — banco de peças (script SEGURO: pode rodar quantas vezes quiser)
-- Cole no Supabase: Project > SQL Editor > New query > Run
--
-- O que faz:
--  1) Cria a tabela "pecas" só se ela ainda não existir
--  2) Garante a coluna "desempenho_idx" (usada pelo cálculo de gargalo)
--  3) Garante a leitura pública das peças (RLS)
--  4) Insere só as peças de exemplo que AINDA NÃO existem (por categoria + nome)
--  5) Preenche o desempenho_idx das CPUs e placas de vídeo pelo nome
--
-- O que NÃO faz: não apaga a tabela e não altera preço de peça que já existe.
-- ============================================================

-- 1) Tabela (só cria se não existir)
create table if not exists public.pecas (
  id            uuid primary key default gen_random_uuid(),
  categoria     text not null check (categoria in ('cpu', 'placa-mae', 'memoria', 'placa-video', 'armazenamento', 'fonte', 'gabinete')),
  nome          text not null,
  marca         text not null,
  preco         numeric(10,2) not null check (preco >= 0),
  socket        text,
  tipo_memoria  text,
  potencia_w    integer,
  desempenho_idx numeric(5,1),
  imagem_url    text,
  specs         text,
  criado_em     timestamptz not null default now()
);

-- 2) Se a tabela já existia sem a coluna (ou com a antiga "desempenho"), garante a nova
alter table public.pecas add column if not exists desempenho_idx numeric(5,1);

-- 3) Leitura pública (o catálogo é público; escrita só pelo painel do Supabase)
alter table public.pecas enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pecas' and policyname = 'Leitura pública das peças'
  ) then
    create policy "Leitura pública das peças" on public.pecas for select using (true);
  end if;
end $$;

-- 4) Insere só o que ainda não existe
insert into public.pecas (categoria, nome, marca, preco, socket, tipo_memoria, potencia_w, desempenho_idx)
select v.* from (values
  ('cpu', 'Ryzen 5 7600', 'AMD', 1299, 'AM5', null, 65, 64),
  ('cpu', 'Core i5-13400F', 'Intel', 1099, 'LGA1700', null, 65, 61),
  ('cpu', 'Ryzen 7 7800X3D', 'AMD', 2599, 'AM5', null, 120, 85.6),
  ('cpu', 'Ryzen 5 5600', 'AMD', 699, 'AM4', null, 65, 52),
  ('placa-mae', 'B650M', 'Gigabyte', 899, 'AM5', 'DDR5', null, null),
  ('placa-mae', 'B760M', 'ASUS', 799, 'LGA1700', 'DDR4', null, null),
  ('placa-mae', 'X670E', 'MSI', 1899, 'AM5', 'DDR5', null, null),
  ('placa-mae', 'A520M', 'ASRock', 449, 'AM4', 'DDR4', null, null),
  ('memoria', '16GB (2x8) 5600MHz', 'Kingston', 349, null, 'DDR5', null, null),
  ('memoria', '16GB (2x8) 3200MHz', 'Corsair', 279, null, 'DDR4', null, null),
  ('memoria', '32GB (2x16) 6000MHz', 'Kingston', 799, null, 'DDR5', null, null),
  ('placa-video', 'RTX 4060', 'NVIDIA', 2199, null, null, 115, 35.1),
  ('placa-video', 'RTX 4070', 'NVIDIA', 3699, null, null, 200, 54.7),
  ('placa-video', 'RX 7600', 'AMD', 1899, null, null, 165, 34.3),
  ('placa-video', 'RTX 5090', 'NVIDIA', 1899, null, null, 580, 100),
  ('placa-video', 'RX 580', 'AMD', 1899, null, null, 135, 10),
  ('placa-video', 'RTX 3050 TI', 'NVIDIA', 1899, null, null, 35, 13),
  ('armazenamento', 'SSD NVMe 500GB', 'Kingston', 249, null, null, 6, null),
  ('armazenamento', 'SSD NVMe 1TB', 'WD', 449, null, null, 6, null),
  ('armazenamento', 'HD 1TB 7200RPM', 'Seagate', 279, null, null, 8, null),
  ('fonte', '550W 80+ Bronze', 'Corsair', 399, null, null, 550, null),
  ('fonte', '650W 80+ Bronze', 'EVGA', 499, null, null, 650, null),
  ('fonte', '750W 80+ Gold', 'Corsair', 699, null, null, 750, null),
  ('gabinete', 'NZXT H510', 'NZXT', 549, null, null, null, null),
  ('gabinete', 'Lancer', 'Gamdias', 349, null, null, null, null)
) as v(categoria, nome, marca, preco, socket, tipo_memoria, potencia_w, desempenho_idx)
where not exists (
  select 1 from public.pecas p where p.categoria = v.categoria and p.nome = v.nome
);

-- 5) Preenche/atualiza o índice de desempenho (só CPU e placa de vídeo)
update public.pecas as p
set desempenho_idx = v.idx
from (values
  ('cpu', 'Ryzen 5 7600', 64),
  ('cpu', 'Core i5-13400F', 61),
  ('cpu', 'Ryzen 7 7800X3D', 85.6),
  ('cpu', 'Ryzen 5 5600', 52),
  ('placa-video', 'RTX 4060', 35.1),
  ('placa-video', 'RTX 4070', 54.7),
  ('placa-video', 'RX 7600', 34.3),
  ('placa-video', 'RTX 5090', 100),
  ('placa-video', 'RX 580', 10),
  ('placa-video', 'RTX 3050 TI', 13)
) as v(categoria, nome, idx)
where p.categoria = v.categoria and p.nome = v.nome;

-- Conferência: tem que listar as CPUs e GPUs, todas com desempenho_idx preenchido
select categoria, nome, preco, desempenho_idx
from public.pecas
where categoria in ('cpu', 'placa-video')
order by categoria, desempenho_idx;
