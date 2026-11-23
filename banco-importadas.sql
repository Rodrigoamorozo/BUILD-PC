-- BuildPC — suporte a peças importadas (AliExpress)
-- JÁ APLICADO no projeto BUILDPC em 23/11/2026 (migration "pecas_suporte_importadas").
-- Fica aqui só como registro; é seguro rodar de novo (tudo é "if not exists").
-- Não altera nenhuma linha existente.

alter table public.pecas
  add column if not exists origem text not null default 'loja-br',   -- 'loja-br' ou 'aliexpress'
  add column if not exists link_compra text,                         -- link do anúncio
  add column if not exists preco_usd numeric(10,2),
  add column if not exists frete_estimado numeric(10,2),             -- soma no total do site
  add column if not exists prazo_dias integer,
  add column if not exists tipo_modulo text;                         -- 'UDIMM' | 'RDIMM' | 'SODIMM' (memória e placa-mãe)

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pecas_origem_check') then
    alter table public.pecas add constraint pecas_origem_check check (origem in ('loja-br', 'aliexpress'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pecas_tipo_modulo_check') then
    alter table public.pecas add constraint pecas_tipo_modulo_check check (tipo_modulo is null or tipo_modulo in ('UDIMM', 'RDIMM', 'SODIMM'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pecas_link_compra_check') then
    alter table public.pecas add constraint pecas_link_compra_check check (link_compra is null or link_compra ~* '^https?://');
  end if;
end $$;

create index if not exists pecas_origem_idx on public.pecas (origem);
