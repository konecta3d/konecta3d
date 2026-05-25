# Konecta3D — Resumen Completo para Comercialización

> Este documento describe la plataforma Konecta3D: qué es, qué hace, cómo está organizada y qué beneficios aporta a cada tipo de usuario. Está pensado para explicarle al asistente comercial toda la estructura y funcionalidad del producto.

---

## ¿Qué es Konecta3D?

Konecta3D es una **plataforma SaaS B2B multi-tenant** que permite a negocios locales (dentistas, abogados, fisioterapeutas, inmobiliarias…) crear y gestionar herramientas de marketing digital de forma autónoma, **sin necesidad de saber diseño ni programación**.

El producto físico que se vende es un **llavero NFC** que, al acercarlo a cualquier móvil, abre automáticamente la página digital del negocio. Pero **el valor real no es el llavero** — es toda la plataforma de presencia digital que ese llavero activa.

**Propuesta de valor en una frase:**
> Presencia digital profesional + captación de clientes + fidelización, todo desde el móvil, sin saber de marketing.

---

## Los dos tipos de usuario

| Usuario | Acceso | Rol |
|---------|--------|-----|
| **Admin (Miguel)** | `/admin` | Gestiona todos los negocios de la plataforma |
| **Negocio (cliente)** | `/mi-negocio` | Gestiona su propio espacio y herramientas |

Y existe una tercera capa:
| **Cliente final** | `/l/[slug]` | El usuario del negocio — ve la landing pública sin autenticación |

---

## PARTE 1 — Panel de Administración (`/admin`)

El admin (Miguel) tiene una vista centralizada de toda la plataforma con las siguientes secciones:

### Dashboard
- Estadísticas globales: total de negocios, leads de los últimos 30 días, landings activas, negocios con onboarding completado.
- Lista de negocios y leads recientes.
- Acciones rápidas: crear negocio, gestionar módulos, configuración.

### Configuración de Negocios
- Crear, editar y eliminar negocios.
- Asignar email, teléfono, sector y módulos activos a cada negocio.
- Resetear contraseña de cualquier negocio (con generador de contraseña aleatoria).
- Ver y acceder al panel del negocio como si fuera el cliente.

### Gestión de Módulos
- Tabla completa con todos los negocios y sus módulos.
- Activar/desactivar módulos individuales por negocio con un clic.
- Módulos disponibles: Lead Magnet, Beneficios VIP, WhatsApp, Herramientas, Formularios, GPT de Fidelización, Asistente IA Landing, Asistente IA Recursos.
- Activación/desactivación masiva de módulos en todos los negocios.

### Registro de Actividad
- Log completo de todo lo que ocurre en la plataforma.
- Filtros por tipo de acción (logins, creaciones, ediciones, eliminaciones, landings, leads).
- Filtro por negocio específico y búsqueda de texto libre.

### Settings del Sistema
- Configuración de email (remitente, notificaciones de nuevos negocios y leads).
- Reglas de seguridad (longitud mínima de contraseñas, reglas de complejidad).
- Diagnóstico de base de datos: verifica que todas las tablas necesarias existan en Supabase y genera el SQL si faltan.
- Toggle global: activar/desactivar el Editor Avanzado de Recursos de Valor para todos los negocios.

### Personalización de Nombres
- Cambiar los nombres de las secciones que ven los clientes en su sidebar.
- Ejemplo: "Lead Magnet" puede llamarse "Recursos de Valor" o "Guía Gratuita".
- Vista previa en tiempo real de cómo queda en el panel del negocio.

---

## PARTE 2 — Panel del Negocio (`/mi-negocio`)

Cada negocio accede a su propio espacio, completamente separado de los demás. Solo ve sus datos y solo tiene acceso a los módulos que el admin ha activado para él.

### Dashboard del Negocio
- Tarjeta de identidad con logo, nombre y descripción.
- Acceso rápido a todas las secciones habilitadas.
- Contadores de items creados por herramienta (cuántos recursos, beneficios, leads, etc.).

### Perfil
- Editar nombre del negocio, slug (URL pública), logo, teléfono, descripción y dirección.
- Ver estadísticas propias: leads, landings, recursos creados.
- Ver el enlace público del negocio (konecta3d.com/l/[slug]).

---

## PARTE 3 — Los Generadores (herramientas que usa el negocio)

Cada negocio puede crear contenido digital con las siguientes herramientas, según los módulos que tenga activos:

---

### 🌐 Editor de Landing (`/landing`)

El constructor visual de la página pública del negocio.

**Qué se puede configurar:**
- **Fondo**: color sólido o imagen con control de opacidad.
- **Identidad**: logo, nombre del negocio, subtítulo personalizado.
- **Botones CTA (hasta 5)**: cada botón puede ser un link externo, un Beneficio VIP o un Recurso de Valor del propio negocio.
- **Estilo**: color de fondo y texto de botones, radio de esquinas.
- **Bloque final** (a elegir uno):
  - Herramientas del negocio (hasta 5 links con iconos).
  - Invitación a un amigo (referral con link compartible).
  - Imagen con link personalizado.
- **Espaciado avanzado**: ajuste fino de márgenes y padding.

**Características destacadas:**
- Vista previa en tiempo real en formato móvil (con marco de teléfono).
- Autoguardado inteligente: guarda 1,5 segundos después del último cambio.
- Asistente IA integrado (si módulo `module_ai_landing` activo): genera cambios de configuración automáticamente con chat.
- Reset a valores por defecto con un clic.

---

### 📄 Recurso de Valor / Lead Magnet (`/lead-magnet`)

Crear guías, checklists y recomendaciones en PDF para atraer o fidelizar clientes.

**Modos de creación:**
- **Asistente guiado (5 pasos)**: elige tipo de recurso, objetivo, puntos clave. Genera el PDF automáticamente con plantillas optimizadas.
- **Editor Avanzado**: edición libre, múltiples páginas, añadir testimonios y productos (si el admin lo ha activado globalmente).

**Tipos de recurso:**
- Guía Estratégica
- Checklist
- Recomendación

**Objetivos:**
- Captar nuevos clientes
- Hacer que los clientes vuelvan
- Vender más
- Conseguir referidos

**Gestión:**
- Lista de recursos creados con filtros.
- Descarga directa del PDF.
- Editar o eliminar.
- Indicador de estado (con PDF generado / sin PDF).

**IA opcional** (`module_ai_recursos`): asistente que ayuda a redactar el contenido del recurso.

---

### 🏆 Beneficios VIP (`/vip-benefits`)

Crear descuentos y beneficios exclusivos que el negocio puede ofrecer a sus clientes.

**Modos de creación:**
- **Asistente guiado (4 pasos)**: plantillas por objetivo, vista previa en tiempo real.
- **Editor Avanzado**: personalización completa, todos los tipos disponibles.

**Tipos de beneficio:**
- Descuento en porcentaje (ej. "20% de descuento")
- Descuento en importe fijo (ej. "10€ de descuento")
- 2x1 o combo
- Regalo incluido
- Upgrade de servicio
- Servicio o envío gratis

**Gestión:**
- Listar beneficios creados.
- Editar o eliminar.
- Vincular directamente desde botones de la landing.

---

### 🔧 Herramientas del Negocio (`/acciones`)

Centraliza todos los links de acción del negocio para poder usarlos en la landing, recursos y beneficios.

**Tipos de herramientas disponibles:**
- WhatsApp (con generador de link `wa.me` + mensaje inicial)
- Agendar citas (Calendly, Google Calendar, etc.)
- Ubicación (Google Maps, Waze)
- Reseñas (Google Reviews, TripAdvisor)
- Pagos (Stripe, PayPal, Bizum)
- Videollamada (Zoom, Google Meet)
- Formularios externos (Google Forms, Typeform)
- Catálogo propio
- Redes Sociales (Instagram, Facebook, YouTube)
- Web / Landing propia

**Funciones:**
- Crear, editar y eliminar links.
- Copiar al portapapeles.
- Usar en cualquier otro módulo de la plataforma.

---

### 📋 Formularios (`/formularios`)

Crear formularios y encuestas personalizadas.

**Tipos:**
- Captación: formularios de contacto, reserva, recogida de datos, opinión.
- Fidelización: formularios para motivar el retorno, crear comunidad.

**Modos de creación:**
- **Asistente guiado (5 pasos)**: máximo 3 preguntas, preview en tiempo real.
- **Editor Avanzado**: edición libre, todas las opciones.

**Opciones de recolección:**
- Recolectar datos del cliente (nombre, teléfono, email).
- Modo anónimo.
- Página de gracias personalizada.

**Gestión:**
- Lista de formularios con estado (activo/inactivo).
- Activar, desactivar, editar o eliminar.

---

### 🤖 GPT de Fidelización (`/gpt-fidelizacion`)

Herramienta para crear un perfil personalizado que el negocio puede usar en ChatGPT para obtener respuestas adaptadas a su negocio.

**Cómo funciona:**
- El negocio responde 11 preguntas sobre su negocio (servicios, clientes, valores, estilo de comunicación…).
- La plataforma genera un perfil completo y estructurado.

**Acciones:**
- Guardar las respuestas automáticamente (autoguardado con debounce de 1 segundo).
- Descargar el perfil como PDF.
- Copiar el perfil completo como texto.
- Abrir ChatGPT directamente para pegar el perfil.

---

### ⚡ Generador de WhatsApp (`/whatsapp-generator`)

Herramienta rápida independiente para crear links de WhatsApp con mensaje predefinido.

- Introduce teléfono y mensaje → genera link `wa.me` al instante.
- Guardar en base de datos para reutilizar.
- Copiar al portapapeles.

---

### 📁 Documentos (`/documents`)

Almacenamiento de documentos del negocio en la nube:
- Lista de archivos almacenados en Supabase Storage.
- Abrir o descargar desde la plataforma.

---

## PARTE 4 — Landing Pública (`/l/[slug]`)

La página que ve el cliente final cuando toca el llavero NFC.

- **Sin autenticación** — acceso directo desde cualquier móvil.
- **Diseño móvil primero** — optimizada para apertura rápida desde móvil.
- Muestra toda la configuración creada en el editor de landing: logo, nombre, botones CTA, bloque final.
- Los botones pueden abrir: links externos, documentos PDF (recursos de valor), páginas de beneficios VIP, WhatsApp, redes sociales, etc.
- **Rendimiento crítico**: debe cargar en menos de 2 segundos con conexión 4G móvil.

---

## PARTE 5 — Sistema de Módulos

El admin puede activar o desactivar módulos por negocio. Esto controla exactamente qué herramientas ve y usa cada cliente.

| Módulo | Qué activa |
|--------|-----------|
| `module_lead_magnet` | Sección Recurso de Valor |
| `module_vip_benefits` | Sección Beneficios VIP |
| `module_whatsapp` | Integración WhatsApp en landing y herramientas |
| `module_tools` | Sección Herramientas del Negocio |
| `module_forms` | Sección Formularios |
| `module_gpt` | GPT de Fidelización |
| `module_ai_landing` | Asistente IA en el editor de landing |
| `module_ai_recursos` | Asistente IA en creación de recursos de valor |

---

## PARTE 6 — Flujos Principales

### Flujo del Admin
1. Crea un negocio nuevo (nombre, email, contraseña, sector).
2. Asigna los módulos que corresponden al plan contratado.
3. El negocio ya puede hacer login y empezar a usar la plataforma.
4. El admin puede resetear contraseñas, ver actividad y estadísticas globales en cualquier momento.

### Flujo del Negocio (cliente de Miguel)
1. Hace login en `/business/login`.
2. Completa su perfil: nombre, logo, slug, descripción.
3. Construye su landing pública con el editor visual.
4. Crea recursos de valor, beneficios VIP y configura sus herramientas de acción.
5. Comparte el link de su landing (o usa el llavero NFC) con sus propios clientes.

### Flujo del Cliente Final
1. Toca el llavero NFC del negocio con su móvil.
2. Se abre automáticamente la landing pública del negocio.
3. Puede hacer clic en los botones CTA: WhatsApp, descargar recurso gratuito, acceder a beneficio VIP, reservar cita, etc.
4. Si hay formulario, puede dejar sus datos (se guardan como leads en la plataforma).

---

## PARTE 7 — Propuestas de Valor por Perfil de Cliente

### Para el negocio local (cliente de Miguel):
- Tener presencia digital profesional sin necesitar un desarrollador.
- Crear recursos de valor (guías, checklists) que captan leads automáticamente.
- Fidelizar con beneficios VIP exclusivos para clientes habituales.
- Centralizar todas sus herramientas de contacto (WhatsApp, Google Maps, Instagram, etc.) en un solo lugar.
- Acceder a un asistente IA para crear contenido sin saber de marketing.
- Todo gestionado desde el móvil, sin fricciones.

### Para Miguel (el operador de la plataforma):
- Gestionar todos sus clientes desde un único panel de control.
- Activar o desactivar funcionalidades por negocio sin tocar código.
- Ver actividad, logs y estadísticas de todos los negocios en tiempo real.
- Escalar a más clientes sin aumentar carga operativa.

---

## Stack y características técnicas relevantes

- **Next.js 16 + React 19 + TypeScript** (App Router, strict mode).
- **Supabase** para base de datos, autenticación y almacenamiento de archivos.
- **PDF generado dinámicamente** (pdf-lib) para recursos y GPT profiles.
- **Autoguardado inteligente** en todos los formularios principales.
- **Multi-tenant real**: cada negocio solo ve sus propios datos (Row Level Security en todas las tablas).
- **Desplegado en Vercel** + Supabase cloud.
- **Puerto de desarrollo**: 3012.

---

*Konecta3D — Plataforma de presencia digital para negocios locales.*
*Documento generado: mayo 2026*
