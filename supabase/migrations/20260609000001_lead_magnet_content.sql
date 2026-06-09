-- Persistir el contenido editable de los lead magnets de captación.
-- Antes solo se guardaba el PDF generado (file_url) y los metadatos, por lo que
-- al editar un lead magnet el cuerpo escrito (intro, contenido, puntos, colores,
-- CTAs) se perdía. Esta columna guarda todo el estado editable del wizard para
-- poder recargarlo al editar.
ALTER TABLE captacion_lead_magnets
  ADD COLUMN IF NOT EXISTS content jsonb;
