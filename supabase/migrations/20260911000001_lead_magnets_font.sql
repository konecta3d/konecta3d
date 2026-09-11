-- Tipografía del PDF del Recurso de Valor (fidelización).
-- El wizard permite elegir una de las 50 fuentes de Google Fonts (ver src/lib/pdf-fonts.ts).
-- La fuente ya se incrusta en el PDF al generarlo; esta columna solo sirve para
-- recordar la elección al volver a editar el recurso. Por defecto 'Inter'.
ALTER TABLE lead_magnets
  ADD COLUMN IF NOT EXISTS font text DEFAULT 'Inter';
