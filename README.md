# CotizaPro

Sistema de gestión de cotizaciones comerciales. Permite crear, gestionar y exportar cotizaciones en PDF para clientes.

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router, fullstack)
- **Lenguaje**: TypeScript
- **Base de datos**: SQLite (desarrollo) / Supabase PostgreSQL (producción)
- **ORM**: Prisma
- **UI**: Tailwind CSS v4 + shadcn/ui + Radix UI
- **Formularios**: React Hook Form + Zod
- **PDF**: @react-pdf/renderer

## Setup Local

1. Clonar el repositorio e instalar dependencias:

```bash
npm install
```

2. Crear archivo `.env` con las variables necesarias (ver sección abajo).

3. Generar el cliente de Prisma y preparar la base de datos:

```bash
npx prisma generate
npx prisma db push
```

4. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`.

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Genera cliente Prisma + build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Linting con ESLint |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:push` | Sincroniza schema con la DB |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:seed` | Ejecuta seed de la base de datos |

## Deploy en Vercel

1. Conectar el repositorio a [Vercel](https://vercel.com).
2. Configurar las variables de entorno en el dashboard de Vercel.
3. Vercel detecta automáticamente Next.js y ejecuta `npm run build`.
4. El script `postinstall` genera el cliente de Prisma automáticamente.

Para la migración a Supabase PostgreSQL, actualizar `DATABASE_URL` en las variables de entorno de Vercel y ejecutar:

```bash
npx prisma migrate deploy
```

## Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión a la base de datos | Sí |

Para producción con Supabase:
```
DATABASE_URL=postgresql://usuario:password@host:5432/database?pgbouncer=true
DIRECT_URL=postgresql://usuario:password@host:5432/database
```
