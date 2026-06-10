-- Supabase migration: create order_sheets table
create table if not exists order_sheets (
  id text primary key,
  title text,
  status text,
  createdAt timestamptz,
  closedAt timestamptz,
  cafeId text,
  cafeName text,
  cafeFloor text,
  naverOrderUrl text
);

create index if not exists idx_order_sheets_createdAt on order_sheets (createdAt desc);
