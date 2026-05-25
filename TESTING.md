# Guía de pruebas — Konecta3D Platform

> Referencia rápida para probar cualquier cambio en la plataforma sin perder tiempo.
> Actualizar este documento si cambia algún paso del flujo.

---

## 1. Arrancar el entorno de desarrollo

```bash
cd "C:\Users\MIGUEL PILETA\Downloads\konecta3d-platform"
npm run dev
```

La plataforma arranca en **http://localhost:3012**

Si el puerto ya está en uso:
```bash
# Ver qué proceso lo usa
netstat -ano | findstr :3012
# Matar el proceso (sustituir PID)
taskkill /PID <numero> /F
```

---

## 2. Acceso como Admin (Miguel)

URL: **http://localhost:3012/login**

| Campo | Valor |
|-------|-------|
| Email | `info@konecta3d.com` (o el valor de `NEXT_PUBLIC_ADMIN_EMAIL` en `.env.local`) |
| Contraseña | Admin1234! |

Redirige a `/admin/dashboard`.

**Desde Admin puedes:**
- Ver y gestionar todos los negocios en `/admin/configuracion`
- Activar/desactivar módulos en `/admin/modulos`
- Ver logs en `/admin/actividad`
- Crear un nuevo negocio de prueba (ver sección 3)

---

## 3. Crear un negocio de prueba (si no existe)

1. Entra como Admin
2. Ve a **Negocios** → `/admin/configuracion`
3. Pulsa "Nuevo negocio"
4. Rellena:
   - Nombre: `Negocio Test`
   - Email: `test@konecta3d.com`
   - Contraseña: cualquiera (ej: `Test1234!`)
5. Activa los módulos que quieras probar
6. Guarda — el negocio ya puede hacer login

---

## 4. Acceso como Negocio (perfil de prueba)

URL: **http://localhost:3012/business/login**

El login acepta cualquiera de estos formatos:

| Formato | Ejemplo |
|---------|---------|
| Email | `test@konecta3d.com` |
| Teléfono | `+34 666 123 456` |
| ID negocio | `K3D-XXXXX` (ver en la BD) |
| Slug | `negocio-test` |

Tras login redirige a `/business/select-profile` para elegir entre:
- **Fidelización** — landing, lead magnet, VIP, WhatsApp
- **Captación** — el módulo nuevo

---

## 5. Navegar el módulo de Captación

Una vez dentro del perfil **Captación**, el sidebar muestra:

```
Captación
├── Inicio          → /captacion           (métricas + campaña activa)
├── Contexto        → /captacion/contexto  (7 bloques de perfil del negocio)
├── Campañas        → /captacion/campanas  (crear y gestionar campañas)
├── Formularios     → /captacion/formularios
├── Lead Magnets    → /captacion/lead-magnets
├── Recorrido       → /captacion/recorrido (5 etapas de seguimiento)
└── Clientes        → /captacion/clientes  (leads capturados)
```

---

## 6. Flujo completo de prueba — Captación

Seguir este orden para probar el flujo end-to-end:

### Paso 1 — Completar el Contexto
`/captacion/contexto`
- Abrir cada bloque y rellenar al menos 1 campo por bloque
- Guardar bloque → verificar que aparece "Completo" en verde
- Verificar que la barra de progreso sube
- Probar el **asistente IA** (botón flotante "Asistente IA" abajo a la derecha)

### Paso 2 — Crear un Formulario
`/captacion/formularios`
- Pulsar "Nuevo formulario"
- Paso 1: nombre (ej: `Feria Test`)
- Paso 2: objetivo (elegir "Rapido")
- Verificar que aparece en la lista con estado "Borrador"

### Paso 3 — Crear un Lead Magnet
`/captacion/lead-magnets`
- Pulsar crear con el asistente
- Completar los 4 pasos del wizard
- Verificar que aparece en la lista

### Paso 4 — Crear una Campaña
`/captacion/campanas`
- Pulsar "Nueva campaña"
- Rellenar nombre, fechas, cliente objetivo, objetivo
- Asignar el formulario y lead magnet creados en pasos 2 y 3
- Verificar que el pipeline muestra los 4 pasos completados
- Activar la campaña

### Paso 5 — Verificar el Recorrido
`/captacion/recorrido`
- Comprobar que las 5 etapas tienen las plantillas de mensaje
- Editar el mensaje de la etapa "Inmediato"
- Copiar → pegar en WhatsApp para verificar que el texto es correcto
- Probar el asistente IA con "Secuencia completa de seguimiento"

### Paso 6 — Ver métricas en Inicio
`/captacion`
- Con la campaña activa, verificar que aparece el banner de campaña activa
- Si hay leads, verificar las 4 tarjetas de métricas con semáforos

---

## 7. Probar la página pública (formulario NFC)

URL: **http://localhost:3012/c/[slug-del-formulario]**

El slug del formulario se encuentra en la tabla `captacion_forms` en Supabase
o en la URL al editar el formulario.

Verificar:
- Carga sin autenticación
- Rellena nombre + teléfono + email
- Envía → aparece pantalla de gracias
- El lead aparece en `/captacion/clientes`

---

## 8. Probar el Asistente IA

El botón "Asistente IA" aparece en todas las secciones de Captación.

**Comprobaciones por sección:**

| Sección | Acción rápida para probar |
|---------|--------------------------|
| Contexto | "Completar mi perfil" |
| Lead Magnets | "Proponer recurso completo" |
| Formularios | "Optimizar mi formulario" |
| Campañas | "Diseñar campaña completa" |
| Recorrido | "Secuencia completa de seguimiento" |

Verificar:
- Responde en menos de 5 segundos
- El texto es personalizado (menciona datos del perfil del negocio)
- Si hay sugerencia, el botón "Usar esto" aparece y aplica el contenido

---

## 9. Panel de Admin — comprobaciones rápidas

URL base: **http://localhost:3012/admin**

| Sección | Qué verificar |
|---------|---------------|
| `/admin/dashboard` | Métricas generales se cargan |
| `/admin/configuracion` | Lista de negocios visible, se puede editar |
| `/admin/modulos` | Se puede activar/desactivar módulo captación |
| `/admin/actividad` | Muestra logs de acciones recientes |

---

## 10. Variables de entorno necesarias

Archivo: `.env.local` en la raíz del proyecto.

```bash
NEXT_PUBLIC_SUPABASE_URL=          # URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Anon key de Supabase
SUPABASE_SERVICE_ROLE_KEY=         # Service role key (solo server-side)
NEXT_PUBLIC_ADMIN_EMAIL=           # Email del admin (Miguel)
OPENAI_API_KEY=                    # Para el asistente IA de Captación
```

Si falta `OPENAI_API_KEY`, el asistente devuelve error 503 pero el resto de la plataforma funciona.

---

## 11. Errores comunes y soluciones rápidas

| Error | Causa probable | Solución |
|-------|---------------|----------|
| Página en blanco al hacer login | Sesión caducada | Cerrar sesión y volver a entrar |
| "Negocio no encontrado" | Email no coincide con `contact_email` en BD | Verificar en Supabase → tabla `businesses` |
| Asistente IA no responde | `OPENAI_API_KEY` faltante o inválida | Revisar `.env.local` y reiniciar servidor |
| El formulario público no carga | Slug incorrecto o formulario en borrador | Verificar estado del formulario en `/captacion/formularios` |
| Cambios de CSS no se ven | Cache del navegador | `Ctrl+Shift+R` para hard refresh |
| Puerto 3012 ocupado | Otra instancia del servidor | Ver sección 1 para matar el proceso |

---

## 12. Acceso directo a Supabase (BD)

Dashboard local (si usas Supabase local):
**http://localhost:54323**

Dashboard cloud:
**https://supabase.com/dashboard/project/[tu-project-id]**

Tablas más útiles para depurar:
- `businesses` — negocios y sus módulos activos
- `captacion_campaigns` — campañas
- `captacion_forms` — formularios
- `captacion_lead_magnets` — lead magnets
- `captacion_leads` — leads capturados
- `settings` — contexto y recorrido guardados (clave: `captacion_context_*`, `captacion_journey_*`)

---

*Última actualización: mayo 2026*
