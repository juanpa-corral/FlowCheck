# FlowCheck Backend

Spring Boot 3 + Java 17 + PostgreSQL (Supabase)

## Stack
- **Framework**: Spring Boot 3.2
- **Lenguaje**: Java 17
- **Persistencia**: Spring Data JPA + PostgreSQL (Supabase)
- **Autenticación**: JWT validado con JJWT (mismo JWT que emite Supabase)
- **Seguridad**: Spring Security (stateless)
- **Build**: Maven

## Arquitectura
```
src/main/java/com/flowcheck/
├── FlowCheckApplication.java          # Entry point
├── model/
│   ├── Profile.java                   # Entidad JPA (tabla profiles)
│   ├── ISFBreakdown.java              # DTO resultado del ISF
│   └── BudgetSemaphore.java           # DTO resultado del semáforo
├── repository/
│   └── ProfileRepository.java        # JPA Repository
├── service/
│   ├── ProfileService.java           # CRUD de perfiles
│   └── ISFService.java               # Lógica del ISF y semáforo
├── controller/
│   └── ProfileController.java        # Endpoints REST
├── security/
│   ├── JwtAuthFilter.java            # Valida Bearer JWT de Supabase
│   └── SecurityConfig.java           # Config Spring Security
└── config/
    └── CorsConfig.java               # Configuración CORS
```

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/health` | ❌ | Health check |
| `GET` | `/api/profile` | ✅ | Obtiene perfil del usuario |
| `PUT` | `/api/profile` | ✅ | Actualiza perfil (patch parcial) |
| `GET` | `/api/isf` | ✅ | Calcula el ISF del usuario |
| `GET` | `/api/semaphore` | ✅ | Calcula el semáforo de presupuesto |
| `GET` | `/api/dashboard` | ✅ | Resumen completo (perfil + ISF + semáforo) |

**Autenticación**: `Authorization: Bearer <token>` (JWT de Supabase)

## Inicio rápido

### Prerrequisitos
- Java 17+
- Maven 3.8+
- Supabase project (PostgreSQL activo)

### Configuración

```bash
cd backend

# Opción A: Variables de entorno
set DB_URL=jdbc:postgresql://db.tuproyecto.supabase.co:5432/postgres
set DB_USER=postgres
set DB_PASSWORD=tu-contrasena
set SUPABASE_JWT_SECRET=tu-jwt-secret
set CORS_ALLOWED_ORIGINS=http://localhost:5173

# Opción B: application.properties (no recomendado para secrets en prod)
# Editar src/main/resources/application.properties directamente
```

### Ejecutar

```bash
# Compilar y ejecutar
./mvnw spring-boot:run

# Build del jar
./mvnw clean package
java -jar target/flowcheck-backend-1.0.0.jar
```

La API estará disponible en `http://localhost:8080`

## Ejemplo de uso

```bash
# Health check (sin auth)
curl http://localhost:8080/api/health

# Obtener perfil (con JWT de Supabase)
curl -H "Authorization: Bearer <supabase-jwt>" \
     http://localhost:8080/api/dashboard
```

## Cómo obtener el JWT Secret de Supabase
1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Settings → API
4. Copiar el valor de **JWT Secret**

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DB_URL` | JDBC URL de PostgreSQL de Supabase |
| `DB_USER` | Usuario de la base de datos (`postgres`) |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `SUPABASE_JWT_SECRET` | JWT Secret del proyecto Supabase |
| `CORS_ALLOWED_ORIGINS` | URL(s) del frontend permitidas (coma-separated) |
