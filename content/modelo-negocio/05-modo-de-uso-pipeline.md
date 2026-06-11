# Modo de uso — Pipeline de seguimiento

> Protocolo operativo para Miguel y Miriam.
> Este documento responde a: ¿quién hace qué, cuándo y cómo?
> No hay que preguntar ni improvisar — si hay duda, consultar aquí.

---

## Principios del sistema

1. **2 contactos por semana** durante el mes de prueba de cada cliente.
2. **Miguel** lleva: llamadas de calificación, conversiones, incidencias técnicas, referidos.
3. **Miriam** lleva: check-ins de onboarding, seguimiento operativo, encuestas.
4. **Cada mensaje lleva firma**: "[Nombre], Equipo Konecta3D".
5. **Nunca preguntas abiertas de horario**. Siempre dos opciones concretas.
6. **2 mensajes sin respuesta** = lead frío. Mensaje de cierre y archivar.
7. El CRM es la fuente de verdad: mover el lead a su etapa después de cada contacto.

---

## Las dos herramientas del CRM

### Herramienta A: Pipeline (`/admin/crm/pipeline`)
**Para:** prospectos que aún no tienen acceso a la plataforma.
**Periodo:** desde que captamos el contacto (feria) hasta que enviamos el PDF de acceso.

| Etapa CRM | Cuándo mover |
|---|---|
| Lead frío | Nada más llegar de la feria. Cada lead nuevo entra aquí. |
| Cualificado | Cuando responde al primer WhatsApp |
| Contacto iniciado | Cuando se hace la llamada de calificación |
| Demo hecha | Ya ocurrió en la feria — marcar al crear el lead |
| Propuesta enviada | Cuando se envía el PDF de acceso |
| Ganado | Cuando acepta el acceso y empieza el trial |
| Cliente activo | Cuando paga los primeros 99 €/mes |
| Perdido | 2 mensajes sin respuesta |

### Herramienta B: Seguimiento (`/admin/crm/seguimiento`)
**Para:** negocios que ya tienen acceso y están en el mes de prueba.
**Periodo:** desde que se envía el PDF de acceso hasta que convierte o se va.

| Etapa embudo | Cuándo mover |
|---|---|
| 1. Presentación | Cuando se envía el acceso |
| 2. Onboarding | Cuando está configurando la plataforma (semana 1) |
| 3. Activación | Cuando el llavero apunta a su nueva landing |
| 4. Uso y resultados | Cuando usa el llavero con clientes reales |
| 5. Expansión | Cuando pide presupuesto de llaveros |
| 6. Conversión a pago | En el Contacto 11 (día 25 del trial) |
| 7. Fidelización | Cliente de pago, recurrente |

---

## El pipeline de 11 contactos — quién, qué y cuándo

Los mensajes completos están en `03-pipeline-seguimiento.md`.
Esta tabla es el resumen operativo para tener siempre a la vista.

### Fase 0 — Pre-trial

| # | Día | Quién | Acción |
|---|---|---|---|
| 0 | Mismo día feria (tarde) | Miguel | WhatsApp con captura de su lead en el panel |
| 1 | Día +1 (si no responde) | Miguel | WhatsApp con alternativas de horario para llamada |
| 2 | Día +5-7 | Miguel | Llamada de calificación (15-20 min) |
| 3 | Post-llamada (mismo día) | Miguel | Envío PDF de acceso + primer paso |

### Fase 1 — Semana 1 del trial

| # | Día trial | Quién | Objetivo | Señal de avance |
|---|---|---|---|---|
| 4 | Día 2 | Miriam | Perfil completado | Logo + datos subidos |
| 5 | Día 5 | Miriam | Landing y WhatsApp activos | Sistema operativo |

### Fase 2 — Semana 2

| # | Día trial | Quién | Objetivo | Señal de avance |
|---|---|---|---|---|
| 6 | Día 9 | Miguel | Primer uso real del llavero | Usa el llavero con clientes |
| 7 | Día 12 | Miriam | Detectar ferias/eventos próximos | Fecha de evento identificada |

### Fase 3 — Semana 3

| # | Día trial | Quién | Objetivo | Señal de avance |
|---|---|---|---|---|
| 8 | Día 16 | Miguel | Revisar primeros resultados | ≥3 leads reales captados |
| 9 | Día 19 | Miriam | Encuesta de soporte | Respuesta a las 3 preguntas |

### Fase 4 — Semana 4: cierre y conversión

| # | Día trial | Quién | Objetivo | Señal de avance |
|---|---|---|---|---|
| 10 | Día 23 | Miguel | Recopilar datos antes del cierre | Número de leads confirmado |
| 11 | Día 25 | Miguel | Conversión a 99 €/mes | Cliente activo |

---

## Qué hacer después de cada contacto

1. **Abrir el CRM** (`/admin/crm/pipeline` o `/admin/crm/seguimiento`)
2. **Mover el lead a la etapa correcta** según la respuesta recibida
3. **Anotar en notas:** qué respondió, qué objeción puso, qué próxima acción hay
4. **Registrar la fecha del próximo contacto** en el campo correspondiente

---

## Protocolo de lead frío

Tras 2 mensajes sin respuesta en cualquier fase:

**Miriam o Miguel envían:**
> "[Nombre], entiendo que puede no ser el momento. Dejo la puerta abierta por si lo retomas más adelante. — Equipo Konecta3D"

Mover a "Perdido" en el CRM. Sin más contacto.

---

## Cuándo escala a Miguel (si lo lleva Miriam)

- El cliente pide hablar con el responsable del proyecto
- Hay un problema técnico que Miguel necesita ver desde admin
- El cliente muestra señales de querer cancelar
- Hay una objeción de precio o contrato
- Es el momento de pedir el referido o cerrar la conversión

---

## Registro de la llamada de calificación

Después de cada llamada, anotar en las notas del lead en el CRM:
- Sector y tipo de negocio
- Ferias que hace al año y próxima fecha
- Perfil asignado (A/B/C/D según ficha de leads)
- Principal dolor detectado
- Objeción principal si la hubo
- Temperatura: caliente / templado / frío

---

## Criterios de escalado urgente

Actuar el mismo día (no esperar al contacto programado) si:
- El cliente no abre la plataforma en los primeros 5 días desde el acceso
- El cliente reporta que el llavero no funciona
- El cliente pregunta por el precio antes del Contacto 11
- El cliente da señales de abandono antes del día 20

---

*Modo de uso v1.0 — junio 2026. Revisar después de los primeros 5 clientes y ajustar según fricciones reales.*
