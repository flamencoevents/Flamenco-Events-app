-- Staging-only geography normalization; execute after prospect and hospitality tables are created.
create table if not exists public.fe_spain_provinces (
 name text primary key,
 community text not null
);
insert into public.fe_spain_provinces(name,community) values
('Almería','Andalucía'),
('Cádiz','Andalucía'),
('Córdoba','Andalucía'),
('Granada','Andalucía'),
('Huelva','Andalucía'),
('Jaén','Andalucía'),
('Málaga','Andalucía'),
('Sevilla','Andalucía'),
('Huesca','Aragón'),
('Teruel','Aragón'),
('Zaragoza','Aragón'),
('Asturias','Asturias'),
('Islas Baleares','Illes Balears'),
('Las Palmas','Canarias'),
('Santa Cruz de Tenerife','Canarias'),
('Cantabria','Cantabria'),
('Ávila','Castilla y León'),
('Burgos','Castilla y León'),
('León','Castilla y León'),
('Palencia','Castilla y León'),
('Salamanca','Castilla y León'),
('Segovia','Castilla y León'),
('Soria','Castilla y León'),
('Valladolid','Castilla y León'),
('Zamora','Castilla y León'),
('Albacete','Castilla-La Mancha'),
('Ciudad Real','Castilla-La Mancha'),
('Cuenca','Castilla-La Mancha'),
('Guadalajara','Castilla-La Mancha'),
('Toledo','Castilla-La Mancha'),
('Barcelona','Cataluña'),
('Girona','Cataluña'),
('Lleida','Cataluña'),
('Tarragona','Cataluña'),
('Alicante','Comunitat Valenciana'),
('Castellón','Comunitat Valenciana'),
('Valencia','Comunitat Valenciana'),
('Badajoz','Extremadura'),
('Cáceres','Extremadura'),
('A Coruña','Galicia'),
('Lugo','Galicia'),
('Ourense','Galicia'),
('Pontevedra','Galicia'),
('Madrid','Comunidad de Madrid'),
('Murcia','Región de Murcia'),
('Navarra','Navarra'),
('Álava','País Vasco'),
('Guipúzcoa','País Vasco'),
('Vizcaya','País Vasco'),
('La Rioja','La Rioja'),
('Ceuta','Ceuta'),
('Melilla','Melilla')
on conflict(name) do update set community=excluded.community;
alter table public.fe_spain_provinces enable row level security;
create policy "fe_provinces_authenticated_read" on public.fe_spain_provinces for select to authenticated using (true);
grant select on public.fe_spain_provinces to authenticated;
alter table public.fe_prospects
 add constraint fe_prospects_spain_province_fk foreign key(province) references public.fe_spain_provinces(name);
alter table public.fe_hospitality_prospects
 add constraint fe_hospitality_spain_province_fk foreign key(province) references public.fe_spain_provinces(name);
-- No data import from public directory to active Supabase.
