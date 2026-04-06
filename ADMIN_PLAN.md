# Plan de Implementación - Panel Admin Konecta3D

## Estado Actual

| Sección | Estado | Descripción |
|---------|--------|-------------|
| Listado de Negocios | ✅ Funcional | Crear, editar, eliminar, cambiar contraseña |
| Registro de Actividad | ⚠️ Básico | Solo lista de logs |
| Panel de Control | 🚧 Placeholder | Vacío |
| Gestión de Módulos | 🚧 Placeholder | Vacío |
| Configuración | 🚧 Placeholder | Vacío |
| Personalización | 🚧 Placeholder | Vacío |

---

## 1. Panel de Control (Dashboard)

**Objetivo:** Vista geral del sistema con métricas clave

### Funcionalidades a implementar:

```
┌─────────────────────────────────────────────────────────────┐
│  PANEL DE CONTROL                                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Total     │ │Activos   │ │Leads     │ │Landings  │      │
│  │Negocios │ │Este Mes  │ │Capturados│ │Creadas   │      │
│  │   24    │ │    5    │ │   142    │ │    67    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ACTIVIDAD RECIENTE                                 │   │
│  │  • Hoy: 3 nuevos negocios, 12 nuevos leads          │   │
│  │  • Ayer: 1 nuevo negocio, 8 leads                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │ NEGOCIOS RECIENTES  │  │ ACCIONES RÁPIDAS         │   │
│  │ • Clínica Dental... │  │ [+] Nuevo Negocio        │   │
│  │ • Restaurante...    │  │ [+] Ver Todos los Leads  │   │
│  │ • Tienda Online... │  │ [+] Configuración        │   │
│  └──────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Métricas a mostrar:
- Total negocios registrados
- Negocios activos (que han iniciado sesión en los últimos 30 días)
- Total de leads capturados
- Total de landings creadas
- Tendencia mensual (este mes vs mes anterior)

### Datos necesarios:
- Query a tabla `businesses` (count total)
- Query a `businesses` con filtro de fecha
- Query a `leads` (count total)
- Query a `landings` (count total)

---

## 2. Listado de Negocios

**Objetivo:** Gestión completa de negocios (YA FUNCIONAL)

### Estado: ✅ Ya implementado
- Crear negocio (con usuario Auth)
- Editar negocio
- Eliminar negocio
- Cambiar contraseña
- Toggle módulos
- Buscador
- Ver ID público

### Mejoras opcionales:
- [ ] Filtros por sector, fecha, módulos activos
- [ ] Ordenar por columna
- [ ] Ver detalles expandidos (leads count, landings count)
- [ ] Exportar a CSV
- [ ] Acciones masivas (activar/desactivar módulos a varios)

---

## 3. Gestión de Módulos

**Objetivo:** Control centralizado de qué módulos están activos por negocio

```
┌─────────────────────────────────────────────────────────────┐
│  GESTIÓN DE MÓDULOS                                         │
├─────────────────────────────────────────────────────────────┤
│  Filtros: [Todos ▼] [Con LM ▼] [Con VIP ▼] [Con WA ▼]     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Negocio           │ Lead Magnet │ VIP Benefits │ WA │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Clínica Dental    │   [✓]      │    [✓]      │[✓] │   │
│  │ Restaurante       │   [✓]      │    [✕]      │[✓] │   │
│  │ Tienda Online    │   [✓]      │    [✓]      │[✕] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Activar todos los LM] [Desactivar todos] [Guardar]       │
└─────────────────────────────────────────────────────────────┘
```

### Funcionalidades:
- Tabla con todos los negocios y sus módulos
- Toggle rápido por módulo
- Filtros por módulo activo
- Activación/desactivación masiva
- Guardar cambios en batch

### Datos necesarios:
- Query a `businesses` con todos los campos de módulos

---

## 4. Configuración Global

**Objetivo:** Ajustes generales de la plataforma

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📧 CONFIGURACIÓN DE EMAIL                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Email remitente:     noreply@konecta3d.com         │   │
│  │ Nombre remitente:    Konecta3D                     │   │
│  │ [✓] Enviar email de bienvenidad al crear negocio   │   │
│  │ [✓] Notificar admin cuando hay nuevos leads        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔒 SEGURIDAD                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Longitud mínima de contraseña: [6 ▼]               │   │
│  │ [✓] Requerir mayúsculas y números                   │   │
│  │ [✓] Forzar cambio de password cada 90 días         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💳 SUSCRIPCIONES (FUTURO)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Plan gratuito:  [1 negocio, 3 landings]             │   │
│  │ Plan básico:    [5 negocios, landings ilimitadas]  │   │
│  │ Plan pro:       [Negocios ilimitados + analytics]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Guardar Configuración]                                    │
└─────────────────────────────────────────────────────────────┘
```

### Sub-secciones recomendadas:
1. **Email** - Configuración de notificaciones
2. **Seguridad** - Políticas de contraseña
3. **Suscripciones** - Planes y límites (futuro)
4. **Integraciones** - API keys, webhooks (futuro)

### Datos a guardar:
- Tabla `settings` en Supabase o localStorage

---

## 5. Personalización

**Objetivo:** Personalizar nombres y Branding de la plataforma

```
┌─────────────────────────────────────────────────────────────┐
│  PERSONALIZACIÓN                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🎨 NOMENCLATURA                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Dashboard:      [Panel principal]                   │   │
│  │ Landing:        [Landing]  [Página de захват]     │   │
│  │ Lead Magnet:    [Lead Magnet] [Recurso gratuito]   │   │
│  │ VIP Benefits:   [Beneficios VIP] [Club VIP]         │   │
│  │ Cliente Ideal:  [Cliente Ideal] [Buyer Persona]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🎨 COLORES (FUTURO)                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Color principal:  [#1E3A5F]                         │   │
│  │ Color secundario: [#4A90D9]                         │   │
│  │ Color acento:     [#F5A623]                         │   │
│  │ Logo:            [Subir logo]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Guardar Personalización]                                   │
└─────────────────────────────────────────────────────────────┘
```

### Estado actual:
- ✅ Ya guarda nombres personalizados en localStorage
- ✅ Se muestra en el sidebar

### Mejoras:
- [ ] Persistir en base de datos (tabla settings)
- [ ] Vista previa en tiempo real
- [ ] Restablecer valores por defecto

---

## 6. Registro de Actividad

**Objetivo:** Historial de acciones del sistema (YA EXISTE - básico)

### Estado actual:
- ✅ Lista de activity_logs
- ✅ Muestra: fecha, negocio, acción, detalles

### Mejoras推荐adas:
- [ ] Filtrar por tipo de acción
- [ ] Filtrar por negocio
- [ ] Filtrar por fecha (rango)
- [ ] Búsqueda de texto
- [ ] Paginación (si hay muchos registros)
- [ ] Exportar a CSV

### Tipos de acción a registrar:
- `negocio_creado`
- `negocio_actualizado`
- `negocio_eliminado`
- `password_cambiado`
- `login_exitoso`
- `login_fallido`
- `landing_creada`
- `landing_publicada`
- `lead_capturado`

---

## Prioridades de Implementación

| Orden | Sección | Justificación |
|-------|---------|---------------|
| 1 | Panel de Control | Es lo primero que ve el admin |
| 2 | Gestión de Módulos | Funcionalidad básica de admin |
| 3 | Configuración | Necesario para personalización |
| 4 | Mejoras Actividad | Complementario |
| 5 | Mejoras Listado | Ya funciona, solo optimizar |

---

## Estructura de Archivos Sugerida

```
src/app/(app)/admin/
├── page.tsx                    # Redirect to configuracion?tab=dashboard
├── configuracion/
│   └── page.tsx               #现有 - mantener como está
├── dashboard/
│   └── page.tsx               # NUEVO - Panel de control
├── modulos/
│   └── page.tsx               # NUEVO - Gestión de módulos
├── settings/
│   └── page.tsx               # NUEVO - Configuración global
└── personalizacion/
    └── page.tsx               # MEJORAR - Ya existe, mejorar
```

---

## Notas Técnicas

### Queries útiles:

```typescript
// Total negocios
const { count: total } = await supabase
  .from('businesses')
  .select('*', { count: 'exact', head: true });

// Negocios activos (login en últimos 30 días)
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const { data: active } = await supabase
  .from('businesses')
  .select('id')
  .gte('last_login', thirtyDaysAgo.toISOString());

// Leads por mes
const { data: leads } = await supabase
  .from('leads')
  .select('created_at')
  .gte('created_at', startOfMonth);
```

### Componentes reutilizables a crear:
- `AdminCard` - Tarjeta con título, valor, icono
- `AdminTable` - Tabla con filtros, búsqueda, paginación
- `AdminModal` - Modal genérico
- `AdminChart` - Gráficos simples

---

*Plan creado: 2026-03-03*
