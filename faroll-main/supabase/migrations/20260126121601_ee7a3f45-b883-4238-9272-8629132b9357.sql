-- =============================================
-- FLUXO COMPLETO DE GCOINS
-- =============================================

-- 1. Função auxiliar: verifica se cancelamento está dentro do prazo
CREATE OR REPLACE FUNCTION public.is_within_cancellation_window(
  p_professional_id uuid,
  p_appointment_date date,
  p_appointment_time time
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_antecedencia_minutos integer;
  v_appointment_datetime timestamp;
  v_deadline timestamp;
BEGIN
  -- Busca a antecedência de cancelamento do profissional (em minutos)
  SELECT COALESCE(antecedencia_cancelamento, 2880) -- default 48h
  INTO v_antecedencia_minutos
  FROM public.profiles
  WHERE id = p_professional_id;
  
  -- Monta o datetime do compromisso
  v_appointment_datetime := p_appointment_date + p_appointment_time;
  
  -- Calcula o deadline (horário limite para cancelar com extorno)
  v_deadline := v_appointment_datetime - (v_antecedencia_minutos || ' minutes')::interval;
  
  -- Retorna true se ainda está dentro do prazo
  RETURN now() <= v_deadline;
END;
$$;

-- 2. Função: Consumir Gcoin ao criar agendamento
CREATE OR REPLACE FUNCTION public.handle_appointment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gcoin_record record;
BEGIN
  -- Só processa agendamentos (tipo = 'agendamento')
  IF NEW.tipo <> 'agendamento' THEN
    RETURN NEW;
  END IF;
  
  -- Só processa se tiver client_id e professional_id
  IF NEW.client_id IS NULL OR NEW.professional_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Busca registro de Gcoin com saldo disponível para o vínculo
  SELECT id, disponivel, consumido
  INTO v_gcoin_record
  FROM public.gcoins
  WHERE professional_id = NEW.professional_id
    AND client_id = NEW.client_id
    AND disponivel > 0
  ORDER BY data_liberacao ASC -- FIFO: consume os mais antigos primeiro
  LIMIT 1
  FOR UPDATE;
  
  -- Se não encontrou saldo, bloqueia o agendamento
  IF v_gcoin_record IS NULL THEN
    RAISE EXCEPTION 'Saldo insuficiente de Gcoins para este vínculo';
  END IF;
  
  -- Consome 1 Gcoin
  UPDATE public.gcoins
  SET disponivel = disponivel - 1,
      consumido = consumido + 1
  WHERE id = v_gcoin_record.id;
  
  -- Marca o agendamento como tendo consumido Gcoin
  NEW.gcoin_consumido := true;
  
  RETURN NEW;
END;
$$;

-- 3. Trigger para consumo ao criar agendamento
CREATE TRIGGER on_appointment_created
  BEFORE INSERT ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_appointment_created();

-- 4. Função: Extorno condicional ao cancelar agendamento
CREATE OR REPLACE FUNCTION public.handle_appointment_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_within_window boolean;
  v_gcoin_record record;
BEGIN
  -- Só processa se status mudou para 'cancelado'
  IF NEW.status <> 'cancelado' OR OLD.status = 'cancelado' THEN
    RETURN NEW;
  END IF;
  
  -- Só processa agendamentos que consumiram Gcoin
  IF NEW.tipo <> 'agendamento' OR NEW.gcoin_consumido IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  
  -- Só processa se tiver client_id e professional_id
  IF NEW.client_id IS NULL OR NEW.professional_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verifica se está dentro do prazo de cancelamento
  v_within_window := public.is_within_cancellation_window(
    NEW.professional_id,
    NEW.data,
    COALESCE(NEW.hora_inicio, '00:00:00'::time)
  );
  
  IF v_within_window THEN
    -- EXTORNO: Devolve o Gcoin ao saldo
    -- Busca o registro de Gcoin mais recente com consumo
    SELECT id
    INTO v_gcoin_record
    FROM public.gcoins
    WHERE professional_id = NEW.professional_id
      AND client_id = NEW.client_id
      AND consumido > 0
    ORDER BY data_liberacao DESC
    LIMIT 1
    FOR UPDATE;
    
    IF v_gcoin_record IS NOT NULL THEN
      UPDATE public.gcoins
      SET disponivel = disponivel + 1,
          consumido = consumido - 1
      WHERE id = v_gcoin_record.id;
      
      -- Marca que o Gcoin foi devolvido
      NEW.gcoin_consumido := false;
    END IF;
  END IF;
  -- Se fora do prazo: Gcoin perdido (não faz nada)
  
  RETURN NEW;
END;
$$;

-- 5. Trigger para extorno ao cancelar
CREATE TRIGGER on_appointment_cancelled
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_appointment_cancelled();