# FlowCheck 2.0

> Plataforma de salud financiera para estudiantes universitarios.
> No es un gestor de gastos. Es un asesor conductual que interviene antes de la compra y recompensa buenas decisiones financieras.

---

## Estructura del proyecto

```
FlowCheck/
├── frontend/          ← React + Vite + TypeScript (web responsivo)
├── backend/           ← Spring Boot 3 + Java 17 (API REST)
└── supabase/
    └── schema.sql     ← Schema de PostgreSQL (ejecutar en Supabase)
```

## Arquitectura

```
[Frontend React/Vite]
       ↓ (directo a Supabase para Auth + CRUD simple)
   [Supabase]
       ↑ (mismo PostgreSQL)
[Backend Spring Boot]
       ↑ (para lógica de negocio compleja, cálculo ISF, futuras integraciones)
```

- El **frontend** se comunica directamente con Supabase para autenticación y datos básicos.
- El **backend** ofrece una API REST para lógica de negocio avanzada y es la capa que escalaría en producción.

## Inicio rápido

### 1. Base de datos (Supabase)
```bash
# Ejecutar en el SQL Editor de tu proyecto Supabase:
supabase/schema.sql
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env          # Completar con tus credenciales de Supabase
npm install
npm run dev                   # → http://localhost:5173
```

### 3. Backend
```bash
cd backend
# Configurar variables de entorno (ver backend/.env.example)
./mvnw spring-boot:run        # → http://localhost:8080
```

## Funcionalidades implementadas

- ✅ **Autenticación** — Registro e inicio de sesión con Supabase Auth
- ✅ **Onboarding de 6 pasos** — Identidad, ingresos, egresos, deuda, metas, perfil de riesgo
- ✅ **ISF (Índice de Salud Financiera)** — Score 0-100 calculado a partir del perfil
- ✅ **Semáforo de presupuesto** — Verde/Amarillo/Rojo según compromisos vs ingreso
- ✅ **Dashboard** — Visualización de salud financiera y resumen mensual

## Próximamente
- 📝 Registro de transacciones
- 🧠 Asesor conductual pre-compra
- 🏆 Sistema de recompensas por buenas decisiones
