# CLAUDE.md — Reglas de trabajo para oracion-app

## Stack
- Frontend: Angular + PWA
- Backend/DB: Supabase (auth, base de datos, storage de audio)
- Hosting: Vercel
- Lenguaje: TypeScript, SCSS

## Cómo trabajar conmigo

### Regla 1 — Planifica antes de escribir código
Antes de generar cualquier código, muéstrame:
1. Qué archivos vas a crear o modificar
2. Qué hace cada uno en una línea
3. Espera mi aprobación antes de continuar

### Regla 2 — Un módulo a la vez
Trabaja en este orden y no avances sin mi confirmación:
1. Estructura base del proyecto + Supabase conectado
2. Autenticación (registro, login, perfil básico)
3. Iglesias y grupos (estructura, registro, aprobación)
4. Pedidos de oración (crear, listar, feed)
5. Respuestas (texto y audio)
6. Testimonios de respuesta
7. Oración en cadena (contador)
8. Promesa del día
9. Notificaciones
10. Gamificación (puntos, insignias, rachas)
11. Panel Super Admin
12. Panel Admin de Iglesia

### Regla 3 — Ahorra tokens
- No expliques lo que ya entiendo, ve directo al código
- No repitas código que ya existe, solo muestra los cambios
- Si algo es obvio, no lo comentes en el código
- Usa `// ...existing code` para indicar código que no cambia

### Regla 4 — Antes de cambios grandes
Si vas a refactorizar, cambiar arquitectura o borrar archivos:
- Avísame primero con un resumen de 2-3 líneas
- Espera mi aprobación

### Regla 5 — Cuando algo falle
- Muéstrame el error exacto
- Da máximo 2 opciones de solución con sus pros y contras
- No generes código hasta que yo elija

### Regla 6 — Nomenclatura
- Componentes: kebab-case (prayer-feed, user-profile)
- Variables y funciones: camelCase
- Interfaces: PascalCase con prefijo I (IUser, IPrayer)
- Servicios: PascalCase + Service (AuthService, PrayerService)
- Todo en inglés en el código, español solo en la UI

## Estructura de carpetas esperada
```
src/
  app/
    core/           # servicios globales, guards, interceptors
    shared/         # componentes reutilizables, pipes, directivas
    features/
      auth/         # login, registro
      prayers/      # feed, crear pedido, detalle
      churches/     # iglesias, grupos
      profile/      # perfil de usuario
      admin/        # panel super admin
      church-admin/ # panel admin de iglesia
      gamification/ # insignias, puntos, ranking
    models/         # interfaces TypeScript
```

## Contexto del proyecto
Lee el archivo PROYECTO.md para entender qué estamos construyendo.
Siempre tenlo en cuenta antes de tomar decisiones de arquitectura.

## Módulos completados

- **Módulo 1 — Estructura base + Supabase:** `SupabaseService`, `environments/environment.ts`, configuración PWA (`ngsw-config.json`, `manifest.webmanifest`).
- **Módulo 2 — Autenticación:** `AuthService` (signals, `waitForInit`), `authGuard`, `guestGuard`, `IUser`, `LoginComponent`, `RegisterComponent`, `ProfileComponent`.
- **Módulo 3 — Iglesias y grupos:** `ChurchService`, `churchAdminGuard`, `IChurch`/`IGroup`/`IChurchMember`, `ChurchListComponent`, `ChurchRegisterComponent`, `ChurchDetailComponent`, `ChurchAdminComponent`.
- **Módulo 4 — Pedidos de oración:** `PrayerService`, `IPrayer`/`IPrayerFeedItem`, `PrayerFeedComponent` (filtros + actualización optimista del contador 🙏), `PrayerCreateComponent`, `PrayerDetailComponent`. Tablas: `prayers`, `prayer_prays`. Patrón: guards usan `getSession()`, componentes usan signal `user()` con fallback a `getSession()` para el `ngOnInit`.
- **Módulo 5 — Respuestas:** `ResponseService` (two-query pattern, upload a Storage), `IResponse`/`IResponseWithProfile`, `PrayerResponseComponent` (tabs Texto/Audio, MediaRecorder con cleanup en `ngOnDestroy`). Tabla: `responses`. Bucket Storage: `audio-responses`.
- **Módulo 6 — Testimonios:** `TestimonyService`, `ITestimony`/`ITestimonyWithPrayer`, `PrayerTestifyComponent` (solo owner + status=active), `TestimonyFeedComponent`. Al crear testimonio se marca la oración como `status='answered'`. Badge "Respondido" en feed. Botón "¡Dios respondió!" en `PrayerDetailComponent` (visible solo al owner si status=active). Rutas: `/prayers/:id/testify`, `/testimonies`.
- **Módulo 7 — Oración en cadena:** Ya implementado en Módulo 4. Tabla `prayer_prays`, `PrayerService.addPray/removePray`, botón 🙏 con contador optimista en feed y detalle.
- **Módulo 8 — Promesa del día:** `PromiseService.getToday()` (busca por fecha exacta, fallback a más reciente), `IDailyPromise`, `DailyPromiseComponent` (tarjeta verde con versículo + botón compartir vía Web Share API / clipboard). Tabla: `promises`. Integrado en el feed encima de la lista.
- **Módulo 9 — Notificaciones (in-app):** `NotificationService` (`getAll`, `getUnreadCount`, `markAllRead`), `INotification`, `NotificationListComponent`. Campana 🔔 con badge rojo en el feed. Al abrir la lista se marcan todas como leídas. Tabla: `notifications`. Triggers SQL en `prayer_prays` y `responses` generan notificaciones automáticamente.
- **Módulo 11 — Panel Super Admin:** `superAdminGuard`, `AdminDashboardComponent` (tabs Iglesias/Usuarios). Iglesias: aprobar, rechazar, suspender, reactivar. Usuarios: ver rol e iglesia, suspender/reactivar (`suspended boolean` en profiles). Link visible en perfil solo para super_admin. Rol se asigna manualmente vía SQL. Ruta: `/admin`.
- **Módulo 10 — Gamificación:** `GamificationService` (`getUserBadges`, `getPublicProfile`, `getChurchRanking`), `IBadge`/`IUserBadge`/`IPublicProfile`/`IRankingEntry`, `BadgeListComponent` (grid ganadas+bloqueadas, reutilizable), `PublicProfileComponent` (ruta `/profile/:id`, solo insignias ganadas + iglesia + grupo), `ChurchRankingComponent` (ruta `/ranking`, top 10 por puntos). Nivel visible en tarjetas del feed y detalle. Nombres clickables. Tablas: `badges`, `user_badges`. Triggers SQL para puntos y nivel.
