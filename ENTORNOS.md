# Sistema de 3 Entornos — Konecta3D

## Los 3 entornos

| Entorno | Dónde corre | Base de datos | Quién lo usa |
|---------|------------|---------------|--------------|
| **Local** | Tu ordenador (puerto 3020) | Supabase DEV | Solo tú |
| **Preview** | Vercel (URL temporal automática) | Supabase DEV | Tú + pruebas en móvil real |
| **Producción** | Vercel (konecta3d.com) | Supabase PROD | Los negocios clientes |

## Ramas de git

```
main  →  producción  (NUNCA desarrollar aquí directamente)
 └── dev  →  base de desarrollo
       └── feature/nombre-cambio  →  donde trabajas
```

---

## CONFIGURACIÓN INICIAL (hacer una sola vez)

### PASO 1 — Crear el proyecto Supabase DEV

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Pulsa **New project**
3. Nombre: `konecta3d-dev`
4. Contraseña de base de datos: guárdala en un lugar seguro
5. Región: la misma que tu proyecto de producción
6. Espera a que termine de crearse (~2 minutos)

### PASO 2 — Aplicar el schema en el proyecto DEV

1. En el panel de `konecta3d-dev`, ve a **SQL Editor**
2. Abre el archivo `supabase/schema-dev.sql` de este proyecto
3. Copia todo el contenido y pégalo en el SQL Editor
4. Pulsa **Run** — deberías ver: `Schema DEV creado correctamente ✓`

### PASO 3 — Crear el usuario admin en el proyecto DEV

1. En `konecta3d-dev`, ve a **Authentication → Users**
2. Pulsa **Add user → Create new user**
3. Email: `admin@konecta3d-dev.com` (o el que prefieras)
4. Password: uno que recuerdes para pruebas
5. Marca **Auto Confirm User**

### PASO 4 — Configurar tu .env.local para DEV

1. Copia el archivo `.env.dev.example` como `.env.local`:
   ```
   copy .env.dev.example .env.local
   ```
   > ⚠️ Si ya tienes un `.env.local` con las claves de producción,
   > guárdalo antes como `.env.prod.backup` (no se sube a git).

2. En el panel de `konecta3d-dev`, ve a **Project Settings → API**
3. Copia y pega en tu `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
4. Actualiza `NEXT_PUBLIC_ADMIN_EMAIL` con el email del admin que creaste en el Paso 3

### PASO 5 — Subir la rama dev a GitHub

```bash
git push -u origin dev
```

### PASO 6 — Configurar variables de entorno en Vercel

1. Ve a [vercel.com](https://vercel.com) → tu proyecto → **Settings → Environment Variables**
2. Para cada variable, selecciona en qué entornos aplica:

| Variable | Production | Preview | Development |
|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de PROD | URL de DEV | URL de DEV |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key PROD | Anon key DEV | Anon key DEV |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role PROD | Service role DEV | Service role DEV |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Email admin PROD | Email admin DEV | Email admin DEV |
| `OPENAI_API_KEY` | Tu key | Tu key | Tu key |
| `CHROMIUM_REMOTE_EXEC_URL` | URL chromium | URL chromium | — |

   > En Vercel puedes añadir la misma variable con valores distintos
   > según el entorno seleccionando Production / Preview / Development
   > por separado al crearla.

3. Una vez configuradas, los deploys de ramas distintas a `main` usarán
   automáticamente las claves DEV.

---

## FLUJO DE TRABAJO DEL DÍA A DÍA

### Empezar a trabajar en algo nuevo

```bash
# Asegúrate de estar en dev y actualizado
git checkout dev
git pull origin dev

# Crea tu rama de trabajo
git checkout -b feature/nombre-del-cambio
```

### Desarrollar y probar en local

```bash
npm run dev
# Abre http://localhost:3020
# Estás trabajando contra Supabase DEV — puedes romper cosas sin miedo
```

### Probar en móvil real (antes de subir a producción)

```bash
# Sube tu rama a GitHub
git push origin feature/nombre-del-cambio
```

Vercel detecta la nueva rama automáticamente y genera una URL de preview:
```
konecta3d-git-feature-nombre-del-cambio-tu-usuario.vercel.app
```
Ábrela en tu móvil. Usa esta URL para probar formularios NFC, landings, etc.

### Cuando todo está bien → mergear a dev

```bash
git checkout dev
git merge feature/nombre-del-cambio
git push origin dev
```

Vercel genera una preview de `dev` también. Última revisión antes de producción.

### Lanzar a producción

```bash
git checkout main
git merge dev
git push origin main
# Vercel despliega automáticamente a producción
```

Los clientes ven los cambios en ~1-2 minutos.

---

## AÑADIR CAMBIOS A LA BASE DE DATOS (migraciones)

Cuando necesites añadir tablas o columnas nuevas:

1. Escribe el SQL en un archivo nuevo en `supabase/`:
   ```
   supabase/add-captacion-tables.sql
   ```

2. Pruébalo primero en el proyecto DEV:
   - SQL Editor de `konecta3d-dev` → pega y ejecuta

3. Cuando funcione correctamente, aplícalo en PROD:
   - SQL Editor de `konecta3d-prod` → pega y ejecuta

> ⚠️ Nunca apliques una migración directamente en PROD sin haberla
> probado antes en DEV.

---

## REFERENCIA RÁPIDA

```bash
# Ver en qué rama estás
git branch

# Ver estado de cambios
git status

# Crear rama nueva desde dev
git checkout dev && git checkout -b feature/mi-cambio

# Subir cambios a GitHub (genera preview en Vercel)
git push origin feature/mi-cambio

# Ir a producción
git checkout main && git merge dev && git push origin main
```

---

## ARCHIVOS DE ENTORNO

| Archivo | Para qué | ¿Se sube a git? |
|---------|----------|-----------------|
| `.env.local` | Tu entorno local actual (DEV) | ❌ No (en .gitignore) |
| `.env.dev.example` | Plantilla para DEV | ✅ Sí (sin secretos) |
| `.env.local.example` | Plantilla general | ✅ Sí (sin secretos) |
| `.env.production.example` | Referencia para Vercel PROD | ✅ Sí (sin secretos) |

---

*Las claves reales de producción viven únicamente en Vercel — nunca en el repositorio.*
