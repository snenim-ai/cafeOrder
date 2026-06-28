-- Run this once in Supabase SQL Editor to create the shared cafe order DB.

create table if not exists order_sheets (
  id text primary key,
  title text,
  status text,
  "createdAt" timestamptz,
  "closedAt" timestamptz,
  "cafeId" text,
  "cafeName" text,
  "cafeFloor" text,
  "naverOrderUrl" text
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'order_sheets' and column_name = 'createdat'
  ) then
    alter table order_sheets rename column createdat to "createdAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'order_sheets' and column_name = 'closedat'
  ) then
    alter table order_sheets rename column closedat to "closedAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'order_sheets' and column_name = 'cafeid'
  ) then
    alter table order_sheets rename column cafeid to "cafeId";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'order_sheets' and column_name = 'cafename'
  ) then
    alter table order_sheets rename column cafename to "cafeName";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'order_sheets' and column_name = 'cafefloor'
  ) then
    alter table order_sheets rename column cafefloor to "cafeFloor";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'order_sheets' and column_name = 'naverorderurl'
  ) then
    alter table order_sheets rename column naverorderurl to "naverOrderUrl";
  end if;
end $$;

create table if not exists menus (
  id text primary key,
  "cafeId" text not null,
  "cafeName" text not null,
  "menuName" text not null,
  price integer not null default 0,
  "soldOutYn" boolean not null default false,
  "order" integer not null default 9999,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists order_items (
  id text primary key,
  "orderSheetId" text not null references order_sheets(id) on delete cascade,
  "userName" text not null,
  "cafeId" text not null,
  "cafeName" text not null,
  "cafeFloor" text not null,
  "menuId" text null references menus(id) on delete set null,
  "menuName" text not null,
  price integer not null default 0,
  quantity integer not null default 1,
  "totalPrice" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_order_sheets_createdAt on order_sheets ("createdAt" desc);
create index if not exists idx_menus_cafe_order on menus ("cafeId", "order", "createdAt");
create index if not exists idx_order_items_sheet_created on order_items ("orderSheetId", "createdAt");
