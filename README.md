# FanHub MVP 🏆

**Red Social Gamificada para Hinchas Deportivos**  
Piloto: Chile — Fútbol Primera División 2026

FanHub convierte la pasión deportiva en puntaje, estatus y premios reales. Los hinchas verifican asistencias a partidos, forman clanes, completan desafíos y compiten por ser el mejor hincha de su equipo.

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14+ (App Router) |
| Lenguaje | TypeScript estricto |
| Estilos | Tailwind CSS |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | NextAuth.js (Google + email/password) |
| Estado global | Zustand (preparado) |
| Forms/Validación | React Hook Form + Zod |
| Deploy | Vercel |

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/JPPinkyLabs/fanhub-mvp.git
cd fanhub-mvp

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 4. Configurar la base de datos
npx prisma generate
npx prisma db push

# 5. Cargar datos iniciales (equipos, configs, usuarios de prueba)
npm run db:seed

# 6. Iniciar en modo desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`

---

## Variables de Entorno

Ver `.env.example` para documentación completa. Variables obligatorias:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de PostgreSQL |
| `NEXTAUTH_SECRET` | Secret para JWT de NextAuth (generar con `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL base de la aplicación |
| `GOOGLE_CLIENT_ID` | OAuth App ID de Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Secret de Google |

---

## Credenciales de Prueba

Después de correr el seed:

| Usuario | Email | Contraseña | Rol | Tier |
|---------|-------|------------|-----|------|
| Admin FanHub | admin@fanhub.cl | admin123 | SUPER_ADMIN | PLATINUM |
| Carlos Mendes | carlos@test.cl | test1234 | USER | FREE |
| María González | maria@test.cl | test1234 | USER | PREMIUM |
| Pedro Rojas | pedro@test.cl | test1234 | USER | PLATINUM |
| Ana Muñoz | ana@test.cl | test1234 | USER | FREE |
| Luis Pérez | luis@test.cl | test1234 | USER | PREMIUM |

---

## CRUD de Entidades

### Users (Usuarios)

```bash
# Listar usuarios (admin)
GET /api/users?page=1&pageSize=20&search=carlos

# Obtener usuario por ID
GET /api/users/{id}

# Crear usuario (SUPER_ADMIN)
POST /api/users
{
  "email": "nuevo@test.cl",
  "name": "Nuevo Hincha",
  "password": "pass123",
  "role": "USER",
  "teamId": "COLO"
}

# Actualizar rol/tier (SUPER_ADMIN, COUNTRY_MANAGER)
PATCH /api/users/{id}
{ "role": "CLUB_MANAGER", "tier": "PREMIUM" }

# Eliminar usuario (SUPER_ADMIN)
DELETE /api/users/{id}

# Ver/actualizar mi perfil
GET  /api/me
PATCH /api/me
{ "name": "...", "bio": "...", "teamId": "...", "activeBadges": ["badge1"] }
```

### Teams (Equipos)

```bash
# Listar equipos
GET /api/teams

# Obtener equipo con clanes y stats
GET /api/teams/{id}

# Crear equipo (SPORT_MANAGER+)
POST /api/teams
{
  "name": "Club Ejemplo",
  "shortName": "EJMP",
  "city": "Santiago",
  "stadiumName": "Estadio Ejemplo",
  "stadiumLat": -33.4489,
  "stadiumLng": -70.6693
}

# Actualizar equipo (SPORT_MANAGER+)
PATCH /api/teams/{id}
{ "name": "Nuevo nombre", "logoUrl": "https://..." }

# Desactivar equipo (SUPER_ADMIN)
DELETE /api/teams/{id}
```

### Clans (Clanes)

```bash
# Listar clanes (filtrar por equipo)
GET /api/clans?teamId=COLO&search=guerreros&page=1

# Obtener clan con miembros
GET /api/clans/{id}

# Crear clan
POST /api/clans
{
  "name": "Los Invencibles",
  "teamId": "COLO",
  "description": "El mejor clan de Colo-Colo"
}

# Actualizar clan (FOUNDER/ADMIN del clan)
PATCH /api/clans/{id}
{ "description": "Nueva descripción", "emblemConfig": {} }

# Unirse a un clan
POST /api/clans/{id}/members

# Salir de un clan
DELETE /api/clans/{id}/members

# Disolver clan (SUPER_ADMIN)
DELETE /api/clans/{id}
```

### Scores (Puntaje)

```bash
# Ver historial de puntaje (propio o de otro usuario si eres admin)
GET /api/scores?userId={id}&page=1&pageSize=20
# Responde: { data, total, totalPoints }
```

### Verifications (Verificaciones)

```bash
# Listar verificaciones (propias; admin ve todas)
GET /api/verifications?status=PENDING&page=1

# Crear verificación de asistencia
POST /api/verifications
{
  "type": "LOCAL_ATTENDANCE",
  "matchId": "match-local-1",
  "geoLat": -33.4975,
  "geoLng": -70.6126,
  "evidenceUrl": "https://i.imgur.com/ejemplo.jpg"
}

# Ver detalle (admin)
GET /api/verifications/{id}

# Aprobar/rechazar (admin)
PATCH /api/verifications/{id}
{ "action": "approve" }
{ "action": "reject", "reviewNote": "Imagen inválida" }
```

**Tipos de verificación disponibles:**
- `LOCAL_ATTENDANCE` — Partido de local (+100 pts base)
- `AWAY_ATTENDANCE` — Partido de visita (+100 pts + distancia)
- `INTL_ATTENDANCE` — Partido internacional (+200 pts + distancia)
- `MEMBERSHIP` — Socio del club (+300 pts, revisión manual)
- `SEASON_PASS` — Abono de temporada (+250 pts, revisión manual)

### Challenges (Desafíos)

```bash
# Listar desafíos activos
GET /api/challenges?status=ACTIVE&type=INTERNAL

# Obtener desafío
GET /api/challenges/{id}

# Crear desafío (SPORT_MANAGER+)
POST /api/challenges
{
  "type": "INTERNAL",
  "title": "Hincha de Invierno",
  "description": "Asiste a todos los partidos de julio",
  "conditionsJson": { "type": "ALL_HOME_GAMES", "month": 7 },
  "rewardJson": { "badge": "Fiel de Invierno", "bonusPts": 500 },
  "bonusPct": 10,
  "startDate": "2026-07-01T00:00:00Z",
  "endDate": "2026-07-31T23:59:59Z"
}

# Actualizar estado (admin)
PATCH /api/challenges/{id}
{ "status": "ACTIVE" }

# Participar en desafío
POST /api/challenges/{id}/participate

# Eliminar desafío (SUPER_ADMIN)
DELETE /api/challenges/{id}
```

### Rankings

```bash
# Ranking individual por equipo, temporada
GET /api/rankings?teamId=COLO&type=individual&period=season

# Ranking de clanes, mensual
GET /api/rankings?type=clan&period=monthly

# Parámetros:
# teamId: ID del equipo (opcional, sin teamId = global)
# type: "individual" | "clan"
# period: "weekly" | "monthly" | "season"
# page, pageSize: paginación
```

### Badges

```bash
# Listar todos los badges (marcados con earned=true si los tienes)
GET /api/badges

# Crear badge (SUPER_ADMIN, COUNTRY_MANAGER)
POST /api/badges
{
  "name": "Nuevo Badge",
  "description": "Descripción del badge",
  "rarity": "RARE",
  "iconEmoji": "🏆",
  "conditionJson": { "type": "CUSTOM" }
}
```

### AppConfig (Configuración)

```bash
# Listar toda la configuración
GET /api/config?scope=GLOBAL&search=points

# Obtener config por clave
GET /api/config/{key}

# Actualizar valor (SUPER_ADMIN/SPORT_MANAGER según editableByRole)
PATCH /api/config/points.local_attendance
{ "value": 150 }

# Crear nueva config (SUPER_ADMIN)
POST /api/config
{
  "key": "custom.param",
  "value": 42,
  "scope": "GLOBAL",
  "dataType": "number",
  "description": "Parámetro personalizado"
}
```

---

## Arquitectura

```
fanhub-mvp/
├── prisma/
│   ├── schema.prisma        # 12 entidades con relaciones
│   └── seed.ts              # 16 equipos + datos de prueba
├── app/
│   ├── (auth)/              # Login, Registro, Forgot Password
│   ├── (dashboard)/         # Dashboard, Ranking, Perfil, Clanes, Desafíos, Verificación
│   ├── (admin)/             # Panel Admin: Config, Users, Verifications, Challenges
│   └── api/                 # API Routes con RBAC server-side
├── components/
│   ├── ui/                  # Componentes reutilizables
│   └── layout/              # Sidebar, MobileNav
├── lib/
│   ├── scoring.ts           # Motor de puntaje (Haversine, multiplicadores)
│   ├── permissions.ts       # RBAC: requireRole, requireAuth
│   ├── config.ts            # Lectura desde AppConfig con cache
│   ├── distance.ts          # Fórmula Haversine
│   ├── verification.ts      # Lógica de verificaciones
│   └── db.ts                # Prisma singleton
└── types/                   # TypeScript types
```

### Motor de Puntaje

La fórmula implementada (sección 3.4 del brief):

```
Puntaje Total = (Pts_Orgánicos × Multiplicador_Tier) + Pts_Activación_Interna + Pts_Club + Pts_Marca
```

Todos los valores se leen desde la tabla `AppConfig` — **nada hardcodeado**.

### RBAC

Cada API route usa `requireRole()` o `requireAuth()`:

```typescript
import { requireRole } from '@/lib/permissions';

// En una API route:
const auth = await requireRole(['SUPER_ADMIN', 'SPORT_MANAGER']);
if (auth instanceof NextResponse) return auth; // 401/403
// auth.id, auth.role disponibles
```

---

## Deploy en Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

**Variables de entorno en Vercel:**
1. Ve a tu proyecto en vercel.com → Settings → Environment Variables
2. Agrega todas las variables de `.env.example`
3. Para `DATABASE_URL`, usa una base de datos PostgreSQL en la nube (Supabase, Neon, Railway)

**Base de datos en producción (recomendado):**
- [Supabase](https://supabase.com) — Free tier disponible
- [Neon](https://neon.tech) — Serverless PostgreSQL
- [Railway](https://railway.app) — Simple y rápido

Después del deploy, correr el seed:
```bash
DATABASE_URL="tu-db-prod-url" npx prisma db push
DATABASE_URL="tu-db-prod-url" npm run db:seed
```

---

## Roadmap (post-MVP)

Ver sección 15.2 del Brief v1.0:
- Suscripción Platinum
- Marketplace P2P
- Feed social y stories
- Predicciones de partidos
- App móvil (React Native)
- Expansión a otros deportes y países

---

*FanHub MVP v0.1 — Piloto Chile Q3 2026*  
*[Created with Perplexity Computer](https://www.perplexity.ai/computer)*
