CREATE OR REPLACE FUNCTION public.sauna_inventory_sync_taxonomy()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
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
    NEW.model_key := CASE WHEN NEW.model = 'Original Collection' THEN 'original' ELSE 'standard' END;
  END IF;
  IF NEW.model_key IS NULL THEN
    NEW.model_key := CASE WHEN NEW.model = 'Original Collection' THEN 'original' ELSE 'standard' END;
  END IF;
  NEW.model := CASE WHEN NEW.model_key = 'original' THEN 'Original Collection' ELSE 'Standard' END;

  IF NEW.style IS NULL THEN
    NEW.style := CASE WHEN NEW.sauna_type_id ILIKE '%infrared%' THEN 'infrared' ELSE 'traditional' END;
  END IF;

  NEW.sauna_type_id := (
    SELECT st.id FROM public.sauna_types st
    WHERE st.style = NEW.style AND st.model_key = NEW.model_key
      AND st.location = ANY(NEW.locations)
    ORDER BY CASE WHEN st.location = 'indoor' THEN 0 ELSE 1 END
    LIMIT 1
  );
  IF NEW.sauna_type_id IS NULL THEN
    RAISE EXCEPTION 'No sauna type for style=% model=% locations=%', NEW.style, NEW.model_key, NEW.locations;
  END IF;
  RETURN NEW;
END;
$$;