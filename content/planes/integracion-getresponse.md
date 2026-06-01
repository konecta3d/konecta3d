# Integración GetResponse — guía de configuración

> Estado: IMPLEMENTADO. Falta solo poner las variables de entorno en Vercel.

---

## Qué hace

Cuando alguien rellena un formulario de captación del **negocio Konecta**, su
contacto (nombre + email) se añade automáticamente a una campaña de GetResponse
vía API. GetResponse dispara entonces el autoresponder (primer email + secuencia)
configurado en esa campaña.

Solo afecta a los leads del negocio Konecta — los demás negocios no se ven
afectados. El contacto sigue guardándose también en la plataforma (Clientes),
así que mantienes el dato y el dogfooding.

---

## Configuración (variables de entorno en Vercel)

Añadir en Vercel → Settings → Environment Variables:

```
GETRESPONSE_API_KEY      = (tu API key de GetResponse)
GETRESPONSE_CAMPAIGN_ID  = (ID de la lista/campaña destino)
KONECTA_BUSINESS_ID      = (ID del negocio Konecta en la plataforma)
```

### Cómo obtener cada valor

**GETRESPONSE_API_KEY**
GetResponse → Menú → Integraciones y API → API → Generar API key.

**GETRESPONSE_CAMPAIGN_ID**
Una vez puesta la API key y redesplegado, entra como admin y abre:
`app.konecta3d.com/api/admin/getresponse/campaigns`
Devuelve la lista de tus campañas con su `campaignId`. Copia el de la lista
donde quieras que entren los leads (la que tenga el autoresponder).

**KONECTA_BUSINESS_ID**
El ID del negocio Konecta dentro de la plataforma. Aparece en la URL del wizard
o en /admin/configuracion al abrir el negocio Konecta.

---

## Pasos para activarlo

1. En GetResponse: crea la lista/campaña y monta el autoresponder
   (primer email + secuencia) sobre esa lista.
2. Genera la API key en GetResponse.
3. Pon las 3 variables en Vercel y redespliega.
4. Visita /api/admin/getresponse/campaigns para confirmar el campaignId.
5. Da de alta Konecta como negocio en la plataforma (si no lo está) y crea
   una campaña de captación con su formulario + lead magnet.
6. Haz una prueba real: rellena el formulario → comprueba que el contacto
   aparece en GetResponse y que llega el primer email.

---

## Detalles técnicos

- `src/lib/getresponse.ts`: addContactToGetResponse() + listGetResponseCampaigns()
- Enganche en `src/app/api/captacion/leads/route.ts` (fire-and-forget, no bloquea)
- El envío solo ocurre si business_id === KONECTA_BUSINESS_ID y hay email
- API v3 de GetResponse, POST /contacts con campaign.campaignId
- El formulario ahora acepta solo nombre + email (teléfono ya no es obligatorio
  si se proporciona email)

---

## Notas

- Si las variables no están puestas, no pasa nada: el envío se omite en silencio
  y el lead se guarda igual en la plataforma.
- Entregabilidad: el dominio info@konecta3d.com ya está verificado (DKIM) en
  GetResponse, así que el primer email transaccional debería entregar bien.
- RGPD: asegúrate de que el formulario muestra el consentimiento de recibir
  comunicaciones antes de enviar a GetResponse.
