-- =====================================================
-- MIGRATION: Adicionar Novas Profissões e Especialidades
-- =====================================================

-- PARTE 1: Especialidades para profissões EXISTENTES que estão vazias
-- =====================================================

-- MÉDICO (95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a)
INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
('Clínica Geral', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true),
('Cardiologia', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true),
('Dermatologia', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true),
('Pediatria', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true),
('Ginecologia', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true),
('Ortopedia', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true),
('Neurologia', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true),
('Psiquiatria Clínica', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true),
('Oftalmologia', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true),
('Otorrinolaringologia', '95fa893c-b9ec-4a74-9e92-8c2b3c0cbe7a', true);

-- DENTISTA (6356c00e-3dd9-4411-ac32-c86bd2dfb86d)
INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
('Ortodontia', '6356c00e-3dd9-4411-ac32-c86bd2dfb86d', true),
('Implantodontia', '6356c00e-3dd9-4411-ac32-c86bd2dfb86d', true),
('Endodontia', '6356c00e-3dd9-4411-ac32-c86bd2dfb86d', true),
('Periodontia', '6356c00e-3dd9-4411-ac32-c86bd2dfb86d', true),
('Odontopediatria', '6356c00e-3dd9-4411-ac32-c86bd2dfb86d', true),
('Prótese Dentária', '6356c00e-3dd9-4411-ac32-c86bd2dfb86d', true),
('Cirurgia Bucomaxilofacial', '6356c00e-3dd9-4411-ac32-c86bd2dfb86d', true),
('Clareamento Dental', '6356c00e-3dd9-4411-ac32-c86bd2dfb86d', true);

-- ENFERMEIRO (9f57f06a-fa58-45f6-821a-7c5f54850c8a)
INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
('Enfermagem Hospitalar', '9f57f06a-fa58-45f6-821a-7c5f54850c8a', true),
('Home Care', '9f57f06a-fa58-45f6-821a-7c5f54850c8a', true),
('UTI', '9f57f06a-fa58-45f6-821a-7c5f54850c8a', true),
('Emergência', '9f57f06a-fa58-45f6-821a-7c5f54850c8a', true),
('Enfermagem Obstétrica', '9f57f06a-fa58-45f6-821a-7c5f54850c8a', true),
('Enfermagem Pediátrica', '9f57f06a-fa58-45f6-821a-7c5f54850c8a', true),
('Enfermagem Geriátrica', '9f57f06a-fa58-45f6-821a-7c5f54850c8a', true);

-- EDUCADOR FÍSICO (fe8258c5-e3f0-46b2-93dd-899b6b52ed93)
INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
('Musculação', 'fe8258c5-e3f0-46b2-93dd-899b6b52ed93', true),
('Treinamento Funcional', 'fe8258c5-e3f0-46b2-93dd-899b6b52ed93', true),
('Pilates', 'fe8258c5-e3f0-46b2-93dd-899b6b52ed93', true),
('Yoga', 'fe8258c5-e3f0-46b2-93dd-899b6b52ed93', true),
('Personal Trainer', 'fe8258c5-e3f0-46b2-93dd-899b6b52ed93', true),
('Reabilitação Física', 'fe8258c5-e3f0-46b2-93dd-899b6b52ed93', true),
('Preparação Esportiva', 'fe8258c5-e3f0-46b2-93dd-899b6b52ed93', true),
('Natação', 'fe8258c5-e3f0-46b2-93dd-899b6b52ed93', true);

-- FONOAUDIÓLOGO (4e4a242d-200c-4321-86ee-b4588af19fda)
INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
('Audiologia', '4e4a242d-200c-4321-86ee-b4588af19fda', true),
('Linguagem', '4e4a242d-200c-4321-86ee-b4588af19fda', true),
('Voz', '4e4a242d-200c-4321-86ee-b4588af19fda', true),
('Motricidade Orofacial', '4e4a242d-200c-4321-86ee-b4588af19fda', true),
('Disfagia', '4e4a242d-200c-4321-86ee-b4588af19fda', true),
('Fonoaudiologia Escolar', '4e4a242d-200c-4321-86ee-b4588af19fda', true),
('Fonoaudiologia Hospitalar', '4e4a242d-200c-4321-86ee-b4588af19fda', true);

-- TERAPEUTA OCUPACIONAL (5e5ba774-8368-47c6-af36-a51c5e5f29e9)
INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
('Reabilitação Física', '5e5ba774-8368-47c6-af36-a51c5e5f29e9', true),
('Saúde Mental', '5e5ba774-8368-47c6-af36-a51c5e5f29e9', true),
('Gerontologia', '5e5ba774-8368-47c6-af36-a51c5e5f29e9', true),
('Pediatria', '5e5ba774-8368-47c6-af36-a51c5e5f29e9', true),
('Neurologia', '5e5ba774-8368-47c6-af36-a51c5e5f29e9', true),
('Saúde do Trabalhador', '5e5ba774-8368-47c6-af36-a51c5e5f29e9', true),
('Contexto Escolar', '5e5ba774-8368-47c6-af36-a51c5e5f29e9', true);

-- PARTE 2: Novas profissões + especialidades usando DO block
-- =====================================================

DO $$
DECLARE
  v_prof_id uuid;
BEGIN
  -- EDUCAÇÃO: Professor Particular
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Professor Particular', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Matemática', v_prof_id, true), ('Português', v_prof_id, true), ('Física', v_prof_id, true),
    ('Química', v_prof_id, true), ('Biologia', v_prof_id, true), ('História', v_prof_id, true),
    ('Geografia', v_prof_id, true), ('Inglês', v_prof_id, true), ('Espanhol', v_prof_id, true),
    ('Redação', v_prof_id, true);

  -- EDUCAÇÃO: Pedagogo
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Pedagogo', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Educação Infantil', v_prof_id, true), ('Alfabetização', v_prof_id, true),
    ('Orientação Escolar', v_prof_id, true), ('Educação Especial', v_prof_id, true),
    ('Coordenação Pedagógica', v_prof_id, true);

  -- EDUCAÇÃO: Psicopedagogo
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Psicopedagogo', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Dificuldades de Aprendizagem', v_prof_id, true), ('TDAH', v_prof_id, true),
    ('Dislexia', v_prof_id, true), ('Avaliação Psicopedagógica', v_prof_id, true),
    ('Intervenção Clínica', v_prof_id, true);

  -- DIREITO: Advogado
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Advogado', 'OAB', true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Trabalhista', v_prof_id, true), ('Tributário', v_prof_id, true), ('Civil', v_prof_id, true),
    ('Família', v_prof_id, true), ('Criminal', v_prof_id, true), ('Empresarial', v_prof_id, true),
    ('Previdenciário', v_prof_id, true), ('Imobiliário', v_prof_id, true);

  -- TECNOLOGIA: Desenvolvedor
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Desenvolvedor', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Frontend', v_prof_id, true), ('Backend', v_prof_id, true), ('Mobile', v_prof_id, true),
    ('Full Stack', v_prof_id, true), ('DevOps', v_prof_id, true), ('Data Science', v_prof_id, true),
    ('Machine Learning', v_prof_id, true);

  -- TECNOLOGIA: Designer Gráfico
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Designer Gráfico', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Identidade Visual', v_prof_id, true), ('Editorial', v_prof_id, true),
    ('Motion Graphics', v_prof_id, true), ('Ilustração', v_prof_id, true), ('Web', v_prof_id, true);

  -- TECNOLOGIA: Designer UX/UI
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Designer UX/UI', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Research', v_prof_id, true), ('Interface Design', v_prof_id, true),
    ('Prototipagem', v_prof_id, true), ('Design Systems', v_prof_id, true);

  -- TECNOLOGIA: Consultor de TI
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Consultor de TI', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Infraestrutura', v_prof_id, true), ('Segurança', v_prof_id, true),
    ('Cloud', v_prof_id, true), ('ERP', v_prof_id, true), ('Governança', v_prof_id, true);

  -- ESTÉTICA: Esteticista
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Esteticista', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Limpeza de Pele', v_prof_id, true), ('Depilação', v_prof_id, true),
    ('Massagem', v_prof_id, true), ('Tratamentos Corporais', v_prof_id, true),
    ('Microagulhamento', v_prof_id, true), ('Peeling', v_prof_id, true);

  -- ESTÉTICA: Cabeleireiro
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Cabeleireiro', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Corte', v_prof_id, true), ('Coloração', v_prof_id, true), ('Mechas', v_prof_id, true),
    ('Tratamentos Capilares', v_prof_id, true), ('Penteados', v_prof_id, true);

  -- ESTÉTICA: Maquiador
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Maquiador', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Social', v_prof_id, true), ('Noiva', v_prof_id, true),
    ('Artístico', v_prof_id, true), ('Editorial', v_prof_id, true);

  -- ESTÉTICA: Manicure/Pedicure
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Manicure/Pedicure', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Manicure Clássica', v_prof_id, true), ('Pedicure', v_prof_id, true),
    ('Nail Art', v_prof_id, true), ('Alongamento', v_prof_id, true);

  -- CONSULTORIA: Coach de Vida
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Coach de Vida', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Desenvolvimento Pessoal', v_prof_id, true), ('Relacionamentos', v_prof_id, true),
    ('Propósito', v_prof_id, true), ('Mindfulness', v_prof_id, true);

  -- CONSULTORIA: Coach Executivo
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Coach Executivo', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Liderança', v_prof_id, true), ('Performance', v_prof_id, true),
    ('Transição de Carreira', v_prof_id, true), ('Team Building', v_prof_id, true);

  -- CONSULTORIA: Consultor Financeiro
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Consultor Financeiro', 'CFP', true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Planejamento Pessoal', v_prof_id, true), ('Investimentos', v_prof_id, true),
    ('Previdência', v_prof_id, true), ('Dívidas', v_prof_id, true), ('Empresarial', v_prof_id, true);

  -- CONSULTORIA: Consultor Empresarial
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Consultor Empresarial', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Estratégia', v_prof_id, true), ('Processos', v_prof_id, true),
    ('Vendas', v_prof_id, true), ('Marketing', v_prof_id, true), ('Recursos Humanos', v_prof_id, true);

  -- ARQUITETURA: Arquiteto
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Arquiteto', 'CAU', true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Residencial', v_prof_id, true), ('Comercial', v_prof_id, true),
    ('Paisagismo', v_prof_id, true), ('Urbanismo', v_prof_id, true), ('Restauro', v_prof_id, true);

  -- ARQUITETURA: Designer de Interiores
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Designer de Interiores', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Residencial', v_prof_id, true), ('Comercial', v_prof_id, true),
    ('Corporativo', v_prof_id, true), ('Sustentável', v_prof_id, true);

  -- FOTOGRAFIA: Fotógrafo
  INSERT INTO public.professions (nome, registro_tipo, ativa) VALUES ('Fotógrafo', NULL, true) RETURNING id INTO v_prof_id;
  INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
    ('Casamento', v_prof_id, true), ('Família', v_prof_id, true), ('Produto', v_prof_id, true),
    ('Moda', v_prof_id, true), ('Eventos', v_prof_id, true), ('Newborn', v_prof_id, true);
END $$;