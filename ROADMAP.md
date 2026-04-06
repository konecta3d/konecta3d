# Konecta3D - Roadmap de Desarrollo

## Estado Actual
**Fase: Beta** - Funcionalidades core en desarrollo

---

## Versiones

### v1.0 - Foundation (Actual)
**Objetivo:** Sistema base funcional

- [x] Autenticación (Admin + Negocios)
- [x] CRUD de negocios
- [x] Módulos básicos (LM, VIP, WA)
- [x] Landing pages con editor
- [x] Lead magnets (PDF)
- [x] VIP Benefits
- [x] Cambio de contraseñas

### v1.1 - Stabilization
**Objetivo:** Corregir bugs y mejorar estabilidad

- [ ] Fix: API reset-password returning 500
- [ ] Fix: Login con múltiples formatos (email, teléfono, slug, ID)
- [ ] Testing completo de flujo: crear negocio → login → usar módulos
- [ ] Manejo de errores mejorado
- [ ] Logs de actividad más completos

### v1.2 - UX Improvements
**Objetivo:** Mejorar experiencia de usuario

- [ ] Onboarding para nuevos negocios
- [ ] Wizard de configuración inicial
- [ ] Tooltips de ayuda
- [ ] Guardado automático
- [ ] Preview en tiempo real mejorado
- [ ] Mensajes de error más claros

---

## v2.0 - Growth (Q2 2026)

### Plantillas
- [ ] Biblioteca de 5-10 plantillas de landing
- [ ] Plantillas por industria (Restaurant, Clinic, E-commerce)
- [ ] Categorización de plantillas

### Editor
- [ ] Editor drag & drop simplificado
- [ ] Componentes reutilizables
- [ ] Deshacer/Rehacer acciones
- [ ] Duplicar secciones

### Analytics
- [ ] Dashboard de métricas básicas
- [ ] Visitas por landing
- [ ] Leads capturados
- [ ] Tasa de conversión

---

## v2.1 - CRM Light

### Gestión de Leads
- [ ] Lista de leads por negocio
- [ ] Notas por lead
- [ ] Etiquetas/segmentación
- [ ] Exportar a CSV

### Pipeline
- [ ] Kanban básico (Nuevo → Contactado → Cerrado)
- [ ] Mover leads entre etapas
- [ ] Actividades registradas

---

## v2.2 - Email Marketing

### Integración
- [ ] Conectar con proveedor de email (SendGrid/Resend)
- [ ] Enviar leads por webhook
- [ ] Newsletter signup

### Automations
- [ ] Auto-responders
- [ ] Secuencias de email

---

## v3.0 - Scale (Q3 2026)

### Multi-tenant
- [ ] Dominios personalizados
- [ ] SSL automático
- [ ] White-label básico

### APIs
- [ ] API REST pública
- [ ] Webhooks configurables
- [ ] Documentación para developers

### Monetization
- [ ] Planes de suscripción
- [ ] Límites por plan
- [ ] Facturación

---

## v3.1 - AI Features

### Contenido
- [ ] Generador de textos con IA
- [ ] Generador de títulos/descripciones
- [ ] Optimización SEO automática

### Imágenes
- [ ] Generación de imágenes IA
- [ ] Editor básico de imágenes

---

## v4.0 - Enterprise

### Roles y Permisos
- [ ] Multi-usuario por negocio
- [ ] Permisos granulares
- [ ] Roles (Admin, Editor, Viewer)

### Compliance
- [ ] GDPR tools
- [ ] Exportar datos usuario
- [ ] Consent management

---

## Priorities Matrix

| Prioridad | Feature | Impact | Esfuerzo |
|-----------|---------|--------|----------|
| P0 | Fix APIs auth | Alto | Bajo |
| P0 | Testing flujo completo | Alto | Medio |
| P1 | Plantillas landing | Alto | Medio |
| P1 | Analytics básico | Alto | Medio |
| P2 | CRM light | Medio | Alto |
| P2 | Drag & drop | Alto | Alto |
| P3 | Email integration | Medio | Medio |
| P3 | Dominios propios | Medio | Alto |
| P4 | AI features | Bajo | Alto |

---

## Milestones

### M1: Product-Market Fit
- [ ] 10 negocios activos
- [ ] 100+ landings creadas
- [ ] NPS > 40

### M2: Revenue
- [ ] Primer cliente paying
- [ ] MRR > 1000 EUR
- [ ] Churn < 5%

### M3: Scale
- [ ] 50 negocios activos
- [ ] 500+ landings
- [ ] 10k+ leads capturados

---

## Tech Debt

- [ ] Migrar de base64 a Supabase Storage (cuando funcione)
- [ ] Migrar a Next.js App Router completo
- [ ] TypeScript strict mode
- [ ] Tests unitarios
- [ ] Documentación de APIs

---

## Recursos Necesarios

### Equipo
- 1x Full-stack developer
- 1x Designer (para plantillas)
- 1x DevOps (infra)

### Infraestructura
- Supabase Pro (más capacidad)
- CDN para imágenes
- Email service provider
- Monitoring (Sentry)

---

*Last updated: 2026-03-03*
