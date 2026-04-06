# Plan de Producción - Konecta3D

## Estado: ✅ PARCIALMENTE IMPLEMENTADO

---

## Completado ✅

### 1. Datos movidos de LocalStorage a Supabase
- [x] **Personalización**: Nombres del menú → tabla `settings` en Supabase
- [x] **Configuración**: Settings global → tabla `settings` en Supabase
- [x] Código actualizado con fallback a localStorage si Supabase falla
- [x] SQL creado: `sql-produccion.sql`

### 2. Archivos de Despliegue
- [x] `vercel.json` - Configuración para Vercel
- [x] `.env.production.example` - Template de variables
- [x] `DESPLIEGUE.md` - Instrucciones paso a paso

---

## Pendiente - Requiere tu acción

### 1. Ejecutar SQL en Supabase ⚠️
**Necesario antes de desplegar:**

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Abre **SQL Editor**
3. Copia y ejecuta el contenido de: `sql-produccion.sql`

Esto creará la tabla `settings` necesaria.

### 2. Desplegar a Vercel
1. Subir código a GitHub
2. Importar en [vercel.com](https://vercel.com)
3. Configurar variables de entorno
4. Desplegar

### 3. Datos que YA están en Supabase (OK)
| Tabla | Estado |
|-------|--------|
| businesses | ✅ |
| landings | ✅ |
| leads | ✅ |
| benefits | ✅ |
| activity_logs | ✅ |
| settings | ⚠️ Crear con SQL |

---

## Acciones requeridas para producción

### Antes de desplegar (requiere tu acción):

1. **Ejecutar SQL** en Supabase Dashboard:
   ```
   Archivo: sql-produccion.sql
   ```

2. **Crear proyecto de Supabase** para producción (opcional - puedes usar el mismo)

3. **Subir a GitHub**:
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

4. **Configurar Vercel**:
   - Importar desde GitHub
   - Añadir variables de entorno
   - Deploy

### Después de desplegar (tests):

- [ ] Crear negocio desde Admin
- [ ] Login de negocio
- [ ] Crear landing
- [ ] Probar cambio de contraseña
- [ ] Verificar personalización se guarda

---

## Archivos creados/modificados

| Archivo | Descripción |
|---------|-------------|
| `sql-produccion.sql` | SQL para crear tablas en Supabase |
| `vercel.json` | Config Vercel |
| `.env.production.example` | Template variables |
| `DESPLIEGUE.md` | Instrucciones detalladas |
| `admin/personalizacion/page.tsx` | Actualizado para usar Supabase |
| `admin/settings/page.tsx` | Actualizado para usar Supabase |

---

## Siguiente paso inmediato

**Ejecutar SQL en Supabase:**

Ve a Supabase Dashboard > SQL Editor y ejecuta el contenido de `sql-produccion.sql`.

¿Quieres que te ayude con algo específico?
