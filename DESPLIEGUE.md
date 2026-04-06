# Despliegue de Konecta3D

## Requisitos Previos

1. Cuenta en [Supabase](https://supabase.com)
2. Cuenta en [Vercel](https://vercel.com)
3. Código en GitHub

---

## Paso 1: Configurar Supabase

### 1.1 Crear proyecto nuevo en Supabase
- Ve a [supabase.com](https://supabase.com)
- Crea un nuevo proyecto
- Anota las credenciales:

```
NEXT_PUBLIC_SUPABASE_URL: https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJxxx
SUPABASE_SERVICE_ROLE_KEY: eyJxxx
```

### 1.2 Ejecutar SQL
Abre el **SQL Editor** en Supabase y ejecuta el contenido de:
- `sql-produccion.sql` (o el contenido de `supabase-tables.sql`)

Esto creará todas las tablas necesarias.

---

## Paso 2: Desplegar a Vercel

### 2.1 Conectar GitHub
1. Ve a [vercel.com](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Selecciona el proyecto `konecta3d-platform`

### 2.2 Configurar Variables de Entorno
En la configuración del proyecto en Vercel, añade:

| Variable | Valor | Tipo |
|----------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service role key | Secret |

**IMPORTANTE:** La `SUPABASE_SERVICE_ROLE_KEY` debe marcarse como variable de entorno del lado del servidor (Server-side only).

### 2.3 Desplegar
- Click en "Deploy"
- Espera a que termine el build

---

## Paso 3: Verificar Funcionamiento

### URLs de prueba:
- Panel Admin: `https://tu-dominio.vercel.app/admin`
- Login Admin: `https://tu-dominio.vercel.app/admin/login`
- Login Negocios: `https://tu-dominio.vercel.app/business/login`

### Tests a realizar:
1. [ ] Crear nuevo negocio desde Admin
2. [ ] Login con el nuevo negocio
3. [ ] Crear una landing
4. [ ] Verificar que aparece en la lista
5. [ ] Cambiar contraseña desde Admin

---

## Estructura de Archivos de Producción

```
konecta3d-platform/
├── .env.local          # Desarrollo (tu PC)
├── .env.production.example  # Template para producción
├── vercel.json         # Configuración Vercel
├── sql-produccion.sql   # SQL para Supabase producción
├── package.json
└── src/
    └── app/
        └── api/        # API routes (server-side)
```

---

## Dominio Personalizado (Opcional)

1. En Vercel: Settings > Domains
2. Añadir tu dominio
3. Configurar DNS según instrucciones de Vercel
4. SSL se configura automáticamente

---

## Problemas Comunes

### Error: "Table does not exist"
- Solución: Ejecutar el SQL en Supabase

### Error: "Invalid API key"
- Verificar que las variables de entorno están correctas

### Error: "CORS"
- Verificar que el dominio está permitido en Supabase (Settings > API)

---

## Siguientes Pasos (Opcional)

1. **Dominio propio**: Configurar en Vercel
2. **Email**: Configurar SendGrid o Resend para emails transaccionales
3. **Analytics**: Añadir Google Analytics o similar
4. **Monitoring**: Configurar Sentry para errores

---

## Soporte

Si tienes problemas, revisa:
1. Logs en Vercel (Dashboard > Deployments > View Logs)
2. Console del navegador
3. Red en DevTools
