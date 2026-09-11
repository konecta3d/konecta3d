-- Fuente propia del negocio para el PDF del Recurso de Valor.
-- Cuando un negocio sube su propia tipografía (la de su marca), el archivo se guarda
-- en Storage (bucket landing-assets, carpeta font/) y aquí se guarda su URL pública.
-- Si custom_font_url está relleno, `font` es el nombre de la familia de esa fuente
-- (derivado del nombre del archivo) y se incrusta con @font-face; si es NULL, `font`
-- es una familia de Google Fonts.
ALTER TABLE lead_magnets
  ADD COLUMN IF NOT EXISTS custom_font_url text;
