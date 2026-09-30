ALTER TABLE public.sauna_inventory DROP CONSTRAINT sauna_inventory_model_key_check;
ALTER TABLE public.sauna_inventory ADD CONSTRAINT sauna_inventory_model_key_check CHECK (model_key = ANY (ARRAY['standard','original','v1_fir_cedar','v2_cedar']));
ALTER TABLE public.sauna_inventory DROP CONSTRAINT sauna_inventory_model_check;
ALTER TABLE public.sauna_inventory ADD CONSTRAINT sauna_inventory_model_check CHECK (model IS NULL OR model = ANY (ARRAY['Standard','Original Collection','v1 — Fir/Cedar','v2 — Cedar']));

CREATE OR REPLACE FUNCTION public.sauna_inventory_sync_taxonomy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.locations IS NOT DISTINCT FROM OLD.locations
     AND NEW.indoor_outdoor_eligibility IS DISTINCT FROM OLD.indoor_outdoor_eligibility THEN
    NEW.locations := CASE WHEN NEW.indoor_outdoor_eligibility = 'either'
                          THEN ARRAY['indoor','outdoor']
                          ELSE ARRAY[NEW.indoor_outdoor_eligibility] END;
  END IF;

  IF NEW.locations IS NULL OR array_length(NEW.locations,1) IS NULL THEN
    NEW.locations := CASE WHEN NEW.indoor_outdoor_eligibility = 'either'
                          THEN ARRAY['indoor','outdoor']
                          ELSE ARRAY[COALESCE(NEW.indoor_outdoor_eligibility,'indoor')] END;
  END IF;

  NEW.indoor_outdoor_eligibility := CASE
    WHEN 'indoor' = ANY(NEW.locations) AND 'outdoor' = ANY(NEW.locations) THEN 'either'
    WHEN 'outdoor' = ANY(NEW.locations) THEN 'outdoor'
    ELSE 'indoor' END;

  IF TG_OP = 'UPDATE'
     AND NEW.model_key IS NOT DISTINCT FROM OLD.model_key
     AND NEW.model IS DISTINCT FROM OLD.model THEN
    NEW.model_key := CASE NEW.model
      WHEN 'Original Collection' THEN 'original'
      WHEN 'v1 — Fir/Cedar' THEN 'v1_fir_cedar'
      WHEN 'v2 — Cedar' THEN 'v2_cedar'
      ELSE 'standard' END;
  END IF;
  IF NEW.model_key IS NULL THEN
    NEW.model_key := CASE WHEN NEW.model = 'Original Collection' THEN 'original' ELSE 'standard' END;
  END IF;
  NEW.model := CASE NEW.model_key
    WHEN 'original' THEN 'Original Collection'
    WHEN 'v1_fir_cedar' THEN 'v1 — Fir/Cedar'
    WHEN 'v2_cedar' THEN 'v2 — Cedar'
    ELSE 'Standard' END;

  IF NEW.style IS NULL THEN
    NEW.style := CASE WHEN NEW.sauna_type_id ILIKE '%infrared%' THEN 'infrared' ELSE 'traditional' END;
  END IF;

  NEW.sauna_type_id := (
    SELECT st.id FROM public.sauna_types st
    WHERE st.style = NEW.style
      AND st.model_key = CASE WHEN NEW.model_key IN ('v1_fir_cedar','v2_cedar') THEN 'standard' ELSE NEW.model_key END
      AND st.location = ANY(NEW.locations)
    ORDER BY CASE WHEN st.location = 'indoor' THEN 0 ELSE 1 END
    LIMIT 1
  );
  IF NEW.sauna_type_id IS NULL THEN
    RAISE EXCEPTION 'No sauna type for style=% model=% locations=%', NEW.style, NEW.model_key, NEW.locations;
  END IF;
  RETURN NEW;
END;
$function$;