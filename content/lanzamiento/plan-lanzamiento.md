# Plan de lanzamiento — Konecta3D

> Hoja de ruta para lanzar la plataforma, comprobar que el MVP funciona de punta a
> punta, testearla con negocios reales y pasar a la fase de venta.
> Apóyate en los documentos ya creados: `content/negocio/`, `content/plataforma/`,
> `content/llavero/`, `content/lanzamiento/copy-landing-informacion.md` y
> `content/lanzamiento/guia-voz-copy.md`.

---

## 0. Qué tipo de lanzamiento es el tuyo (reencuadre)

No es un lanzamiento viral ni un Product Hunt. Tu cliente (El Expositor: negocios
que van a ferias y eventos) no vive en esas plataformas. Tu lanzamiento es de
**alto contacto**:

> Pocos pilotos reales → fabricar prueba (casos y resultados) → un motor de venta repetible.

La meta de esta etapa **no es ruido**, es **validar que todo funciona de punta a
punta y conseguir tus primeros casos de éxito**. Cada piloto que sale bien hace la
siguiente venta más fácil (interés compuesto: prueba que genera más ventas que
generan más prueba).

---

## 1. Inventario de activos (lo que ya tienes para apoyarte)

Antes de actuar, ten presente lo que ya está construido. No hace falta crear nada
nuevo de software para lanzar.

- **Plataforma + MVP funcional**: alta de negocios, panel, landing del llavero `/l/[slug]`.
- **Constructor de landings de presentación** (`/admin/landings`) + página pública `/p/[slug]`.
- **Generador de landings con IA** con tu voz (`/admin/landings/voz`).
- **CRM de lanzamiento**: embudo de 7 etapas + seguimiento de clientes con insights por etapa.
- **Estadísticas** por negocio y dashboard general (leads, visitas, conversión, etapas).
- **Documentos de contexto** (negocio, plataforma, llavero) para venta y soporte.
- **Copy y voz propios** (guía de voz + landing de información ya redactada).
- **Búsqueda indexada** (Search Console, sitemap, robots).
- **Canales**: grupos de WhatsApp de empresarios + Instagram.
- **Base de clientes de llavero existentes** (fisioterapeutas, clínicas, inmobiliarias) → posibles primeros pilotos y logos.

---

## 2. Fase A — Test del MVP (que funcione de punta a punta)

**Objetivo**: comprobar que toda la cadena funciona sin que tú intervengas en cada paso.

**Quién**: 2-3 negocios de confianza (los amigos que ya prueban) + tú mismo.

### Criterio de éxito (definición de "hecho")
- [ ] El recorrido completo funciona sin intervención manual tuya en ningún paso.
- [ ] Un lead capturado aparece en menos de 1 minuto en el panel del negocio.
- [ ] El negocio entiende solo (sin que le expliques) cómo ver sus contactos y estadísticas.

### Recorrido a probar (la cadena completa)
1. [ ] **Alta**: se crea el negocio y puede entrar. → *Plataforma: `/admin/negocios` + `/business/login`*
2. [ ] **Configura su landing del llavero** y sus botones de acción. → *Panel del negocio: mi-negocio/landing*
3. [ ] **Configura su landing de presentación** (opcional, la visual). → *`/admin/landings` o generador IA*
4. [ ] **Llavero**: se fabrica/programa apuntando a `/l/su-marca/NFC`. → *Ver `content/llavero/produccion-y-logistica.md`*
5. [ ] **Toque real (o simulado)**: acercar el móvil al llavero → abre la landing. → *Probar con NFC y con el QR de respaldo*
6. [ ] **Captura**: el visitante deja su contacto → se guarda. → *Tabla de leads / clientes*
7. [ ] **Visibilidad**: el negocio ve el lead y las visitas. → *mi-negocio/estadísticas*
8. [ ] **Seguimiento**: el negocio contacta al lead por WhatsApp. → *Enlaces de acción / wa.me*

### Recoger fricciones
- [ ] Apunta cada fricción o duda en *Seguimiento de clientes* (insights por etapa).
- [ ] Decide qué se arregla antes de la Fase B y qué puede esperar (no pulir de más).

> Nota técnica: confirma que NFC y QR abren la misma landing, y que las
> estadísticas (visitas + leads) cuentan correctamente. Es la prueba de que el
> producto "hace lo que prometemos".

---

## 3. Fase B — Pilotos reales (validar + fabricar prueba)

**Objetivo**: que 3-5 expositores reales usen el MVP **gratis para su próxima feria** y
generar tus primeros casos de éxito.

**Quién**: 3-5 negocios reales (idealmente de los sectores que ya conoces).

### Oferta del piloto (no negociable lo del precio del llavero)
- MVP **gratis 1 mes**, sin permanencia.
- Llavero a **~3 €/unidad** (precio firme; si hace falta valor, **10-15 unidades extra**, nunca descuento monetario).
- Cobro = presupuesto + transferencia bancaria.

### Criterio de éxito (definición de "hecho")
- [ ] Al menos 3 pilotos completan una feria/evento usando el sistema.
- [ ] Al menos 1 piloto con un **resultado medible** (ej. nº de contactos captados en su feria).
- [ ] Capturados los **4 activos de prueba** de al menos 2 pilotos (abajo).

### Los 4 activos de prueba a capturar (ver `content/negocio/prueba-social.md`)
1. [ ] **Resultado/número** (contactos captados, visitas a su landing en la feria).
2. [ ] **Testimonio** (frase corta del negocio, mejor con nombre y sector).
3. [ ] **Logo / permiso de marca** para mostrarlo como cliente.
4. [ ] **Referido** (a quién más le vendría bien — pídelo cuando esté contento).

### Acciones
- [ ] Selecciona los 3-5 pilotos (criterios: tienen feria próxima, son receptivos, sector reconocible).
- [ ] Define con cada uno **qué es "que funcione" para él** antes de empezar (su objetivo concreto).
- [ ] Acompáñalo en el alta y la primera configuración (alto contacto, estilo onboarding 1 a 1).
- [ ] Tras su feria: recoge resultados y los 4 activos de prueba.
- [ ] Registra todo en el **embudo del CRM** y mueve cada piloto por sus etapas.

---

## 4. Fase C — Venta (motor repetible)

**Objetivo**: con 1-2 casos en la mano, activar un proceso de venta que se repita.

### Criterio de éxito (definición de "hecho")
- [ ] Existe un guion de venta apoyado en prueba real (ya no solo en la demostración).
- [ ] El embudo de 7 etapas se usa para cada prospecto, de principio a fin.
- [ ] Primer cliente que paga (presupuesto + transferencia) fuera del círculo de confianza.

### El motor (apóyate en el embudo de 7 etapas del CRM)
1. **Mensaje de entrada** (WhatsApp/Instagram) → llevar a la landing de información.
   - *Recurso: `content/lanzamiento/copy-landing-informacion.md` + voz de `guia-voz-copy.md`*
2. **Landing de información** (la visual `/p/[slug]`) → genera interés y agenda.
3. **Demostración**: "toca este llavero con el móvil" (lo más potente sin testimonio).
   - *Recurso: `content/llavero/argumentos-de-venta.md`*
4. **Prueba gratis 1 mes** → el cliente personaliza su parte digital.
5. **Presupuesto + transferencia** → cierre.
6. **Fabricación con tiempo** para llegar a su feria con los llaveros listos.
   - *Recurso: `content/llavero/produccion-y-logistica.md` (urgencia real por plazos)*
7. **Postventa y referido** → pide el referido y captura más prueba.

### Palancas honestas (además de la urgencia por plazos)
- **Permanencia, no solo presencia** (el llavero se queda; la tarjeta se tira).
- **Captura en el momento** (el contacto queda guardado aunque el equipo esté ocupado).
- **Coste marginal ridículo** (~3 € frente a los miles del stand).
- **Escasez real** si hay cupos de fabricación por temporada de ferias (úsala solo si es cierta).

---

## 5. Canales — marco ORB adaptado a ti

Todo debe terminar llevando a tus **canales propios**.

| Tipo | Tus canales | Cómo usarlos |
|---|---|---|
| **Propios** (lo que compone) | Tu plataforma (dogfooding), WhatsApp, lista de email (DKIM en GetResponse) | Tu propia landing/embudo te venden; WhatsApp es tu canal nº1 |
| **Alquilados** | Grupos de WhatsApp de empresarios, Instagram | Llevar tráfico a tu landing de información, no como fin en sí |
| **Prestados** (palanca real) | Organizadores de ferias, asociaciones de comerciantes, referidos de pilotos | Acceso a audiencia concentrada de expositores |

> Dogfooding: tu mejor demostración es que **Konecta usa Konecta**. Tu propia
> landing de presentación y tu embudo son el primer caso de uso que enseñas.

---

## 6. Métricas a vigilar (y dónde verlas)

- **Negocios activos** y **etapa del embudo** → *Dashboard admin / Seguimiento de clientes*.
- **Leads captados** (total y últimos 30 días) → *Dashboard admin / Estadísticas por negocio*.
- **Visitas a landings** → *Estadísticas (analytics_events)*.
- **Conversión global** (leads / visitas) → *Dashboard admin*.
- **Pilotos con resultado y con prueba capturada** → *seguimiento manual en el CRM*.

Revisa estas métricas una vez por semana y úsalas para decidir el siguiente paso.

---

## 7. Calendario sugerido (en semanas relativas, no fechas fijas)

El ritmo lo marcan las **ferias de tus pilotos**, no el calendario.

- **Semana 1-2**: Fase A (test del MVP de punta a punta con 2-3 amigos).
- **Semana 2-4**: arranque de Fase B (captar y dar de alta 3-5 pilotos con feria próxima).
- **Durante sus ferias**: acompañamiento + recogida de resultados.
- **Tras 1-2 ferias con buen resultado**: arrancar Fase C (venta activa con prueba).

---

## 8. Lo que NO hacer ahora

- **Product Hunt / lanzamiento masivo en redes**: audiencia equivocada, energía malgastada.
- **Pulir features nuevas**: el MVP ya está; lo que falta es **prueba** y **un motor de venta**, no más software.
- **Cobrar antes de validar**: el mes gratis es tu mejor herramienta de convicción.
- **Descuentos monetarios en el llavero**: rompe el modelo; da valor en unidades, no en precio.

---

## 9. Herramientas a enchufar (en este orden)

1. **Agendado de llamadas** (Cal.com / Calendly) → encaja en el embudo (entrada → reunión). *Falta.*
2. **Email** (GetResponse, ya con DKIM) → secuencia para pilotos y seguimiento.
3. **WhatsApp** → de momento `wa.me` basta; la API oficial más adelante.
4. **Captura de feedback** → ya la tienes en *Seguimiento de clientes* (insights por etapa).

---

## 10. Pendientes de Miguel (para que el plan no se bloquee)

- [ ] Rellenar los `[COMPLETAR]` de `content/llavero/` (lote mínimo, plazos de fabricación y envío, especificaciones del chip, material, RGPD).
- [ ] Rellenar precio de suscripción y datos de cobro en `content/plataforma/` y `content/negocio/modelo-y-oferta.md`.
- [ ] Confirmar que ANTHROPIC_API_KEY y los fondos funcionan en Vercel.
- [ ] Elegir y dar de alta la herramienta de agendado.
- [ ] Seleccionar los 3-5 pilotos con feria próxima.

---

*Plan de lanzamiento generado con la metodología de lanzamiento por fases (ORB +
5 fases) adaptada al modelo de alto contacto de Konecta3D.*
