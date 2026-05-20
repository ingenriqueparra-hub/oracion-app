# CLAUDE.md — Reglas de trabajo para oracion-app

## Stack
- Frontend: Angular + PWA (nombre de la app: **Intercede**)
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
      prayers/      # feed, crear pedido, detalle, mis pedidos
      churches/     # iglesias, grupos
      profile/      # perfil de usuario
      admin/        # panel super admin
      church-admin/ # panel admin de iglesia (dentro de churches/)
      gamification/ # insignias, puntos, ranking
      promises/     # promesa del día
      notifications/# lista de notificaciones
      testimonies/  # feed de testimonios
    models/         # interfaces TypeScript
```

## Contexto del proyecto
Lee el archivo PROYECTO.md para entender qué estamos construyendo.
Siempre tenlo en cuenta antes de tomar decisiones de arquitectura.

## Módulos completados

- **Módulo 1 — Estructura base + Supabase:** `SupabaseService`, `environments/environment.ts`, configuración PWA (`ngsw-config.json`, `manifest.webmanifest`).
- **Módulo 2 — Autenticación:** `AuthService` (signals, `waitForInit`, `refreshProfile()`), `authGuard`, `guestGuard`, `IUser`, `LoginComponent`, `RegisterComponent`, `ProfileComponent`.
- **Módulo 2b — Cuenta rápida con PIN:** `WelcomeComponent` (pantalla de entrada unificada, ruta `/welcome`, refactorizado a 3 pasos internos: root | login | register; "cuenta rápida" renombrado a "sin correo"; Google y email como opciones separadas), `PinRegisterComponent` (flujo 2 pasos nombre→PIN, ruta `/pin-register`), `PinLoginComponent` (login nombre+PIN + selector de duplicados, ruta `/pin-login`). Métodos en `AuthService`: `registerWithPin()`, `findPinAccounts()`, `loginWithPinEmail()`, `addEmailToAccount()`, `normalizeNameSlug()`, `generateRandomSuffix()`. Tabla: `pin_accounts`. Campo nuevo en `profiles`: `is_pin_account boolean`. `authGuard` redirige a `/welcome`. `logout()` navega a `/welcome`. Sección "Asegurar cuenta" en `ProfileComponent` (visible si `is_pin_account`). Requiere "Confirm email" desactivado en Supabase Auth.
- **Módulo 3 — Iglesias y grupos:** `ChurchService` (`uploadChurchPhoto(churchId, file)` — sube a bucket `church-photos` público y actualiza `photo_url`; `getChurchStats(churchId)` — devuelve `{ totalMembers, prayersThisWeek, totalPrayers, answeredPrayers }`, usado en admin y en detalle mapeando `{ members, answered }`), `churchAdminGuard`, `IChurch`/`IGroup`/`IChurchMember`, `ChurchListComponent`, `ChurchRegisterComponent`, `ChurchDetailComponent` (sección de grupos reemplazada por stats de miembros + pedidos respondidos; `join-section` convertida en `join-card` con borde, border-radius y padding), `ChurchAdminComponent`.
- **Módulo 4 — Pedidos de oración:** `PrayerService` (`getFeedScoped`, `getById`, `create`, `getMyPrayers`, `addPray`, `removePray`), `IPrayer`/`IPrayerFeedItem`, `PrayerFeedComponent` (tabs/sub-tabs + infinite scroll), `PrayerCreateComponent`, `PrayerDetailComponent`, `MyPrayersComponent`. Tablas: `prayers`, `prayer_prays`. Patrón: guards usan `getSession()`, componentes usan signal `user()` con fallback a `getSession()` para el `ngOnInit`.
- **Módulo 5 — Respuestas:** `ResponseService` (two-query pattern, upload a Storage), `IResponse`/`IResponseWithProfile`, `PrayerResponseComponent` (tabs Texto/Audio, MediaRecorder con cleanup en `ngOnDestroy`, límite 30s automático). Tabla: `responses`. Bucket Storage: `audio-responses`.
- **Módulo 6 — Testimonios:** `TestimonyService`, `ITestimony`/`ITestimonyWithPrayer`, `PrayerTestifyComponent` (solo owner + status=active), `TestimonyFeedComponent`. Al crear testimonio se marca la oración como `status='answered'`. Badge "Respondido" en feed. Botón "¡Dios respondió!" en `PrayerDetailComponent` (visible solo al owner si status=active). Rutas: `/prayers/:id/testify`, `/testimonies`.
- **Módulo 7 — Oración en cadena:** Ya implementado en Módulo 4. Tabla `prayer_prays`, `PrayerService.addPray/removePray`, botón 🙏 con contador optimista en feed y detalle.
- **Módulo 8 — Promesa del día:** `PromiseService.getToday()` (busca por fecha exacta, fallback a más reciente), `IDailyPromise`, `DailyPromiseComponent` (tarjeta verde con versículo + botón compartir vía Web Share API / clipboard). Tabla: `promises`. Integrado en el feed encima de la lista. **Oculta si ya se vio hoy** (persiste en `localStorage` con key `promise_shown_date`).
- **Módulo 9 — Notificaciones (in-app):** `NotificationService` (`getAll`, `getUnreadCount`, `markAllRead`, `subscribeToNotifications(userId, onNew)` → `RealtimeChannel`, `unsubscribe(channel)`), `INotification`, `NotificationListComponent`. Campana 🔔 con badge rojo en `LeftNavComponent` y `BottomNavComponent`. Al abrir la lista se marcan todas como leídas. Tabla: `notifications`. Triggers SQL en `prayer_prays` y `responses` generan notificaciones automáticamente. **Realtime activo:** `LeftNavComponent` y `BottomNavComponent` abren canal `notifications:${userId}` en el `effect()` del constructor y limpian con `ngOnDestroy`. Requiere SQL: `alter publication supabase_realtime add table notifications`.
- **Módulo 10 — Gamificación:** `GamificationService` (`getUserBadges`, `getPublicProfile`, `getChurchRanking`), `IBadge`/`IUserBadge`/`IPublicProfile`/`IRankingEntry`, `BadgeListComponent` (grid ganadas+bloqueadas, reutilizable), `PublicProfileComponent` (ruta `/profile/:id`, solo insignias ganadas + iglesia + grupo), `ChurchRankingComponent` (ruta `/ranking`, top 10 por puntos). Nivel visible en tarjetas del feed y detalle. Nombres clickables. Tablas: `badges`, `user_badges`. Triggers SQL para puntos y nivel.
- **Módulo 11 — Panel Super Admin:** `superAdminGuard`, `AdminDashboardComponent` (tabs Iglesias/Usuarios). Iglesias: aprobar, rechazar, suspender, reactivar. Usuarios: ver rol e iglesia, suspender/reactivar (`suspended boolean` en profiles). Link visible en perfil solo para super_admin. Rol se asigna manualmente vía SQL. Ruta: `/admin`.
- **Módulo 12 — Panel Admin de Iglesia:** `ChurchAdminComponent` (tabs Miembros/Grupos/Estadísticas/Iglesia). Miembros pendientes: aprobar (RPC `approve_church_member`)/rechazar. Miembros aprobados: ver, asignar grupo (RPC `assign_member_group`), expulsar (RPC `remove_church_member`). Grupos: crear/eliminar. Estadísticas: totalMembers, prayersThisWeek, totalPrayers, answeredPrayers. Editar nombre/descripción de la iglesia. **Upload de foto de iglesia** en tab "Iglesia" (signals `photoUploading`, `photoError`, `churchTimestamp`; `onPhotoSelected()` llama `ChurchService.uploadChurchPhoto()`; bucket `church-photos` debe crearse manualmente en Supabase Storage como público). Ruta: `/churches/:id/admin`.

## Reglas de negocio implementadas

### Feed de oración — Tabs y sub-tabs
```
MainTab: 'group' | 'church' | 'all'
  └─ SubTab: 'new' | 'prayed'
```
- **Tab por defecto:** Si `user.group_id` → 'group'; si `user.church_id` → 'church'; si ninguno → 'all'
- **Tab Mi grupo** (`group`): pedidos del `group_id` del usuario
- **Tab Mi iglesia** (`church`): pedidos del `church_id` del usuario
- **Tab Otros** (`all`): pedidos de otras iglesias (`church_id IS NULL OR church_id != user.church_id`)
- **Sub-tab Nuevos** (`new`): pedidos donde `!has_prayed && user_id !== currentUser`
- **Sub-tab Ya oré** (`prayed`): pedidos donde `has_prayed === true`
- Al cambiar `mainTab` se resetea `subTab` a 'new' y se recarga el feed

### Infinite scroll
- `PAGE_SIZE = 5` pedidos por página
- Sentinel div al final de la lista; listener de scroll en el contenedor padre
- Al detectar que el sentinel está a ≤300px del borde inferior se llama `loadMore()`
- Se desactiva si `loading`, `loadingMore` o `!hasMore`

### Límites de contenido
- **Texto de pedido:** mínimo 10 chars, máximo **1000** chars
- **Respuesta de audio:** máximo **30 segundos** (se detiene automáticamente con `setInterval` + `stopRecording()`)

### Promesa del día
- Se guarda en `localStorage` la fecha ISO en que se mostró (`promise_shown_date`)
- Si `localStorage.getItem('promise_shown_date') === hoy (en-CA)` → no se vuelve a mostrar

### Flujo de membresía en iglesias
1. Usuario ve lista de iglesias aprobadas (`/churches`)
2. Entra al detalle (`/churches/:id`) y pulsa "Solicitar unirse"
3. Se crea registro en `church_members` con `status: 'pending'`
4. Si fue rechazado previamente, puede volver a solicitar con `reRequestJoin()` (cambia a 'pending')
5. El admin de la iglesia ve la solicitud en `/churches/:id/admin` → tab Miembros
6. Al aprobar se llama RPC `approve_church_member` que actualiza `church_members.status = 'approved'` y escribe `church_id` en el `profile` del usuario
7. Al rechazar se elimina el registro de `church_members`
8. El admin puede asignar al miembro aprobado a un grupo con `assign_member_group` (RPC)
9. El admin puede expulsar con `remove_church_member` (RPC)

## Estructura de menú por rol

### Left Nav (desktop)
| Ítem | Rol/condición |
|------|---------------|
| 🏠 Oración | Siempre |
| 🏛️ Mi Iglesia | Solo `church_admin` con `church_id` (link al panel admin) |
| ⛪ Mi Iglesia | Solo `member` con `church_id` (link al detalle) |
| 📋 Mis pedidos | Siempre |
| ⭐ Testimonios | Siempre |
| 🏆 Ranking | Siempre |
| 🔔 Notificaciones | Siempre (con badge de no leídas) |
| 👤 Perfil | Siempre |
| 🗺️ Iglesias | Si `church_admin` O si no tiene `church_id` |
| ⚙️ Admin | Solo `super_admin` |

### Bottom Nav (mobile)
| Ítem | Condición |
|------|-----------|
| 🏠 Oración | Siempre |
| ⛪ Mi Iglesia | Si tiene `church_id` (link al detalle) |
| ⛪ Iglesias | Si NO tiene `church_id` |
| ⭐ Testimonios | Siempre |
| 👤 Perfil | Siempre |

### Cuenta rápida con PIN
- **Email ficticio:** `${nameSlug}.${randomSuffix4}@intercede.app` — nunca visible para el usuario
- **Contraseña:** `PIN + environment.pinSalt` (`'intrc_s4lt_2025'`) — el PIN nunca se guarda en texto plano
- **`normalizeNameSlug`:** minúsculas → quitar tildes (NFD) → quitar espacios → solo `[a-z0-9]`
- **Registro:** `signUp` con fake email → update `profiles` (`name`, `is_pin_account=true`) → insert `pin_accounts`
- **Login:** buscar en `pin_accounts` por `name_slug` → si 1 resultado, login directo; si >1, mostrar selector (nombre + "Con iglesia" / "Sin iglesia")
- **Recuperar cuenta:** si `accounts.length === 0` → error "Cuenta no encontrada"; PIN incorrecto → `signInWithPassword` falla
- **Añadir email real:** `supabase.auth.updateUser({ email })` (envía confirmación al email real) + `is_pin_account = false` en profiles
- **Solo para `role = 'member'`** — church_admin y super_admin siempre usan email
- **Tabla `pin_accounts`:** RLS con dos políticas SELECT: `auth.uid() = user_id` (owner) y `true` (búsqueda pública para login)
- **Supabase Auth:** "Confirm email" debe estar **desactivado** para que el registro PIN funcione

## Componentes shared relevantes
- `ShellComponent`: layout de 3 columnas (left-nav + router-outlet + right-panel) + bottom-nav mobile
- `PageHeaderComponent`: cabecera de página con `backLink` y `title`
- `RightPanelComponent`: panel derecho en desktop (contenido complementario)
- `BadgeListComponent`: grid de insignias (reutilizable en perfil propio y público)
