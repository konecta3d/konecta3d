# Plan: integrar agendado de llamadas en el CRM

> Estado: PENDIENTE (decisión: empezar con enlace manual)
> Complejidad de la automatización: baja-media (~medio día de trabajo)
> Fecha del plan: 2026-06-01

---

## Contexto

En el recorrido del cliente, el paso clave es "agendar llamada de asesoramiento".
Hace falta una herramienta de calendario y, opcionalmente, integrarla con el CRM
para que el lead que reserva entre solo en el pipeline.

---

## Decisiones tomadas

- **Herramienta:** sin decidir aún. Recomendación: **Cal.com**.
- **Arranque:** Nivel 1 (enlace manual). El webhook (Nivel 2) se construye más adelante.

---

## Comparativa de herramientas

| | Calendly | Cal.com |
|---|---|---|
| Plan gratuito | Sí | Sí |
| Webhooks gratis | No (~10€/mes) | **Sí, incluso gratis** |
| API abierta | Limitada | Completa |
| Recomendación | — | **Elegida por webhooks gratis** |

---

## Los 3 niveles de integración

### Nivel 1 — Enlace manual (cero construcción, hacer ya)
- Crear cuenta de calendario + evento "Llamada de asesoramiento — 20 min".
- Poner el enlace en el lead magnet (CTA) y la landing.
- Las reservas llegan por email; Miguel las mete a mano en el CRM.

### Nivel 2 — Webhook automático (construcción futura)
Cuando alguien reserva, el calendario avisa a la plataforma y automáticamente:
- Crea o actualiza el lead (busca por email)
- Mueve el lead a etapa "Contacto iniciado"
- Pone `fecha_proxima_accion` = día de la llamada
- Crea tarea "Llamada de asesoramiento con X" asignada a Miguel
- Registra actividad "Llamada agendada"
- Aparece solo en Pipeline, Agenda y Tareas

### Nivel 3 — Calendario propio en la plataforma
Descartado por ahora. Demasiado trabajo, no aporta frente a Cal.com.

---

## Qué construir para el Nivel 2

```
1. Endpoint  src/app/api/webhooks/cal/route.ts
   - Recibe eventos de Cal.com (booking.created, booking.cancelled)
   - Verifica firma secreta (seguridad)
   - Reutiliza tablas existentes: crm_leads, crm_tasks, crm_activities
   - Crea/actualiza lead + tarea + actividad

2. Campos opcionales en crm_leads
   - fecha_llamada_agendada (TIMESTAMPTZ)
   - estado_llamada (agendada / hecha / cancelada)

3. Configuración
   - Crear el evento en Cal.com
   - Pegar el webhook secret en variable de entorno (CAL_WEBHOOK_SECRET)
   - Apuntar el webhook de Cal.com a app.konecta3d.com/api/webhooks/cal
```

Aislado: no toca nada existente, mismo patrón que el resto del CRM.

---

## Flujo completo (Nivel 2)

```
Lead reserva en Cal.com
   → Cal.com dispara webhook → /api/webhooks/cal
   → verifica firma
   → busca lead por email (crea si no existe)
   → etapa = "Contacto iniciado", fecha_proxima_accion = día llamada
   → crea tarea para Miguel con la fecha
   → registra actividad
   → aparece en Agenda y en "Mi trabajo hoy"
```

---

## Por qué construirlo DESPUÉS y no ahora

El código es sencillo, pero depende de una herramienta externa. Conviene construir
el webhook con la cuenta ya elegida y con reservas reales de prueba para ver el
formato exacto del payload de Cal.com. A ciegas es más frágil.

---

## Cómo retomar

> "Construye la integración de agendado del plan en content/planes/integracion-agendado.md.
>  Ya tengo cuenta de Cal.com configurada."
