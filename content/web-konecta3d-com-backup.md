# Backup de contenido — konecta3d.com (web en GHL, a recrear)

> Capturado antes de que GHL borre el contenido. Dominio en GoDaddy, lista en GetResponse,
> correo en Microsoft 365. Solo hay que recrear estas páginas y repuntar el dominio.

## Home

**Hero**
- Título: Llaveros NFC personalizados para marcas que buscan calidad y resultados
- Subtítulo:
  - Conexión instantánea con tus clientes.
  - Seguimiento y fidelización en un solo toque.
  - Diseño personalizado y tecnología certificada.
- Botones: "pedir presupuesto" · "ver demo"

**¿Cómo funciona? (el ejemplo de Carlos)**
Te lo explico con un ejemplo.

Carlos es peluquero. Tiene una peluquería. Cuando termina con una clienta, y ella va a pagar, él la obsequia con un llavero. Este llavero es especial y no solo por su diseño. Cuando lo tocas con el móvil (desbloqueado), en la pantalla se abre directamente una landing personalizada hecha para la peluquería de Carlos en la que la clienta encontrará tres botones: uno para el calendario donde cómodamente reservará su próxima cita, otro para descargar un descuento para "el tratamiento del mes" (que, como su nombre indica, cambia mensualmente), y otro para dejar una reseña en Google a su nuevo peluquero favorito… que, después de encontrar por fin a uno que entiende que "sólo las puntas" significa sólo las puntas y con este detallazo en sus manos, no me dirás que no va a ser de 5 estrellas.

Como este, te puedo contar miles de historias en los que un llavero puede marcar la diferencia entre que tus clientes te olviden o que estén ansiosos por repetir contigo.

Al igual que el diseño del llavero, el enlace que éste lleva, es completamente personalizable. Si no lo crees, pregúntame.

**Más que un llavero: una herramienta de conversión**
Ideal para fidelizar pero también para ferias, eventos y networking.
- Aumenta tus leads hasta un 30% en eventos gracias a la interacción instantánea.
- Diferénciate con un producto físico único que destaca frente a tarjetas tradicionales.
- Actualiza tu contenido cuando quieras: ofertas, links, catálogos, landing pages…
- Compatible con iPhone y Android, sin instalar aplicaciones.
- Materiales de alta calidad: PLA biodegradable y chips NFC certificados.

**Quiénes confían en nosotros** — "Las marcas que ya no son olvidadas" (sección de logos — pendiente de guardar las imágenes).

**Formulario de suscripción**
Suscríbete a nuestra lista de email para recibir ideas, consejos y conceptos que te pueden ayudar en el día a día en tu negocio.
- Campo: "Tu mejor email *" → Enviar
- Aviso: los datos se guardan en GetResponse (RGPD).
- Enlace: Política de Privacidad

## Estructura y enlaces (capturado)
- **Menú:** Inicio, Packs llaveros, Contacto. OJO: enlaces rotos/inconsistentes — "Inicio" apunta a `/homeantigua`, "Packs" a `/` en uno de los menús.
- **CTA "pedir presupuesto"** → `mailto:info@konecta3d.com?subject=Quiero mi presupuesto personalizado` (es un mailto, no un formulario — mala conversión).
- **CTA "ver demo"** → `/demo`.
- **"pregúntame"** → WhatsApp `wa.me/34623759451`.
- **Formulario de suscripción** → GetResponse (sin `<form>` nativo; es un embed).
- **Páginas internas a capturar aún:** `/demo`, `/productos`, `/contacto`, `/homeantigua`, y el texto íntegro de la Política de Privacidad.

## Imágenes — DESCÁRGALAS antes de que GHL borre (viven en su CDN)
Base del CDN: `images.leadconnectorhq.com` / `storage.googleapis.com/msgsndr/eIbV5CbsN6SQJ94eYtwy/...` — morirán con la cuenta. Hay que re-alojarlas en el sitio nuevo.
- Logo de marca, foto(s) del llavero (gris/dorado, rojo, azul-amarillo).
- ~10 logos de "Quiénes confían en nosotros" (verificar que son clientes REALES; si no, no usarlos — norma de no fabricar prueba social).
(Las URLs completas quedaron en la captura; si quieres te las listo todas para descargar.)

## Infra actual (para la migración)
- Dominio: GoDaddy (NS ns33/ns34.domaincontrol.com).
- Web: GHL vía sites.ludicrous.cloud (www CNAME).
- Email marketing / lista: GetResponse.
- Correo: Microsoft 365 (MX a *.mail.protection.outlook.com) — NO tocar.
