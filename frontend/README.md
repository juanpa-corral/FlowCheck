# FlowCheck Web — Frontend

React + Vite + TypeScript + Zustand + Supabase

## Stack
- **Framework**: React 18 + Vite
- **Lenguaje**: TypeScript (estricto)
- **Routing**: React Router v6
- **Estado**: Zustand
- **Backend/BaaS**: Supabase (Auth + PostgreSQL)
- **Estilos**: Tailwind CSS + inline styles (sistema de colores propio)

## Estructura
```
src/
├── lib/
│   └── supabase.ts          # Cliente Supabase
├── types/
│   └── database.ts          # Interfaces TypeScript (Profile, ISF, etc.)
├── constants/
│   └── theme.ts             # Colores y constantes del sistema de diseño
├── stores/
│   ├── authStore.ts         # Estado de autenticación (Zustand)
│   └── onboardingStore.ts   # Estado del onboarding (Zustand)
├── hooks/
│   ├── useISF.ts            # Cálculo del Índice de Salud Financiera
│   └── useProfile.ts        # CRUD del perfil en Supabase
├── utils/
│   └── formatters.ts        # Formateo de moneda, porcentajes, etc.
├── components/
│   ├── Button.tsx
│   ├── ProgressBar.tsx
│   ├── ISFCard.tsx
│   └── Semaphore.tsx
├── pages/
│   ├── auth/
│   │   └── AuthPage.tsx     # Login / Registro
│   ├── onboarding/
│   │   ├── OnboardingLayout.tsx  # Layout compartido + helpers
│   │   ├── Step1Identity.tsx
│   │   ├── Step2Income.tsx
│   │   ├── Step3Expenses.tsx
│   │   ├── Step4Debt.tsx
│   │   ├── Step5Goals.tsx
│   │   └── Step6RiskProfile.tsx
│   └── dashboard/
│       └── DashboardPage.tsx
└── App.tsx                   # Router principal + manejo de auth
```

## Rutas
| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/login` | AuthPage | Inicio de sesión / Registro |
| `/onboarding/1` | Step1Identity | Nombre, universidad, carrera, estrato |
| `/onboarding/2` | Step2Income | Ingresos mensuales y fuentes |
| `/onboarding/3` | Step3Expenses | Gastos fijos, variables, ocio |
| `/onboarding/4` | Step4Debt | Deudas y fondo de emergencia |
| `/onboarding/5` | Step5Goals | Meta de ahorro |
| `/onboarding/6` | Step6RiskProfile | Perfil de riesgo + guardado |
| `/dashboard` | DashboardPage | ISF, semáforo, resumen financiero |

## Inicio rápido

```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 3. Ejecutar en desarrollo
npm run dev
# → http://localhost:5173

# 4. Build para producción
npm run build
```

## Variables de entorno
| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase (Settings → API) |

## Base de datos
El schema SQL está en `/supabase/schema.sql`. Ejecútalo en el SQL Editor de Supabase antes de correr la app.
