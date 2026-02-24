-- Função que libera Gcoins automaticamente quando proposta é aceita
CREATE OR REPLACE FUNCTION public.handle_proposal_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só executa se o status mudou para 'aceita'
  IF NEW.status = 'aceita' AND (OLD.status IS NULL OR OLD.status <> 'aceita') THEN
    -- Insere os Gcoins no saldo do cliente
    INSERT INTO public.gcoins (
      professional_id,
      client_id,
      quantidade,
      consumido,
      disponivel,
      proposta_id,
      data_liberacao
    ) VALUES (
      NEW.professional_id,
      NEW.client_id,
      NEW.quantidade_gcoins,
      0,
      NEW.quantidade_gcoins,
      NEW.id,
      now()
    );
    
    -- Atualiza a data de resposta da proposta
    NEW.data_resposta := now();
    
    -- Atualiza o vínculo para marcar gcoins_liberados = true
    UPDATE public.professional_client_links
    SET gcoins_liberados = true, proposta_aceita = true
    WHERE professional_id = NEW.professional_id
      AND client_id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger que dispara ao atualizar status da proposta
CREATE TRIGGER on_proposal_accepted
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_proposal_accepted();