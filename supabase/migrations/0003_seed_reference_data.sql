-- ============================================================================
-- SIRA — Migration 0003: seed de dados de referência (salas + equipamentos)
-- Dados não-sensíveis para popular listagens/calendário em dev. Idempotente.
-- ============================================================================

insert into public.rooms (name, type, capacity, block, resources, status) values
  ('Lab. Programação 01', 'laboratorio', 30, 'Bloco D', '["Projetor","Computadores","Ar-condicionado"]'::jsonb, 'active'),
  ('Lab. Programação 02', 'laboratorio', 30, 'Bloco D', '["Projetor","Computadores","Ar-condicionado"]'::jsonb, 'active'),
  ('Auditório Bloco C',   'auditorio',  120, 'Bloco C', '["Projetor","Microfone","Som"]'::jsonb, 'active'),
  ('Sala 105',            'sala',        40, 'Bloco A', '["Projetor","Quadro"]'::jsonb, 'active'),
  ('Sala 204',            'sala',        35, 'Bloco B', '["Quadro"]'::jsonb, 'active'),
  ('Lab. Redes',          'laboratorio', 24, 'Bloco D', '["Computadores","Switches","Projetor"]'::jsonb, 'maintenance')
on conflict (name) do nothing;

insert into public.equipment (name, type, status, block) values
  ('Projetor Epson 07', 'Projetor',     'active',      'Bloco A'),
  ('Projetor Epson 12', 'Projetor',     'maintenance', 'Bloco B'),
  ('Notebook Dell 01',  'Notebook',     'active',      'Bloco D'),
  ('Microfone 01',      'Microfone',    'active',      'Bloco C'),
  ('Câmera 02',         'Câmera',       'inactive',    'Bloco C'),
  ('Caixa de Som 01',   'Caixa de som', 'active',      'Bloco C')
on conflict (name) do nothing;
