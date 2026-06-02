# Plan: Tracker del embudo de lanzamiento (seguimiento por cliente)

> Estado: DISEÑADO, pendiente de construir.
> Se construye DESPUÉS de definir las 7 etapas del embudo.
> Decisiones tomadas (2026-06-01):
>   - Orden: definir las 7 etapas primero, luego el tracker.
>   - A quién sigue: "negocios en seguimiento" propios del embudo
>     (se añaden directamente o se traen del pipeline).

---

## Qué es

Un sistema para seguir a cada negocio individualmente a través de las 7 etapas
del embudo de lanzamiento (Presentación → Fidelización). Distinto del pipeline
de ventas (que sigue la venta); este sigue el ciclo de vida del cliente ya captado.

## Las 3 vistas que debe tener

1. Por etapa: lista/kanban de los clientes que están en cada etapa.
2. Ficha de cliente: al entrar a un cliente, ver su estado en la etapa actual:
   - qué objetivos ha cumplido (checks)
   - qué documentos se le han entregado
   - cuál es su siguiente paso
   - notas/log de cada conversación
3. Resumen para medir/mejorar: cuántos clientes por etapa, dónde se atascan,
   tiempo medio por etapa.

## Estructura de datos

```
1. PLANTILLA (el mapa del embudo) — settings JSON
   Las 7 etapas con objetivos, documentos y pasos.
   (Es lo que estamos definiendo etapa por etapa.)

2. PROGRESO POR CLIENTE — tabla nueva crm_journey
   Por cada negocio en seguimiento:
   · business_id o lead_id (opcional) + nombre
   · etapa_actual
   · progreso: JSON { etapaId: { objetivos_cumplidos: [], docs_entregados: [],
                                 siguiente_paso, notas } }
   · fecha_entrada_etapa (para medir tiempo por etapa)
   El tracker LEE la plantilla para saber qué objetivos/docs mostrar,
   y GUARDA el progreso de cada cliente sobre ella.
```

## Cómo encaja

- Sección nueva en ADMIN → ESTRATEGIA (o dentro del embudo de lanzamiento).
- Reutiliza el patrón de actividad/notas del CRM para el log de conversaciones.
- Reutiliza el patrón de tiempo-entre-etapas del pipeline para medir.
- El negocio entra al tracker: o se añade directo (cliente actual reactivado)
  o se trae desde un lead "ganado" del pipeline.

## Cómo retomar

> "Construye el tracker del embudo de lanzamiento del plan en
>  content/planes/tracker-embudo-lanzamiento.md. Ya tengo las 7 etapas definidas."
