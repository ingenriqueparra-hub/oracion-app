# App de Oración Comunitaria — PROYECTO.md

## Visión General
Red social cristiana centrada en pedidos de oración, respuestas de aliento y testimonios.
Orientada a iglesias evangélicas/protestantes de Latinoamérica, con foco inicial en Perú.
**Nombre de la app: Intercede**

---

## Stack Tecnológico
| Parte | Servicio |
|---|---|
| Frontend | Angular (PWA) |
| Backend / Base de datos | Supabase |
| Almacenamiento de audio | Supabase Storage (bucket: `audio-responses`) |
| Fotos de iglesias | Supabase Storage (bucket: `church-photos`, público) |
| Autenticación | Supabase Auth |
| Hosting | Vercel |
| App móvil (Fase 2) | TWA empaquetado desde la PWA para Google Play |

---

## Fases de Lanzamiento

### Fase 1 — MVP (PWA) ← Estado actual
- Lanzar como web progresiva (PWA) instalable desde el navegador
- Validar con la iglesia inicial (~80 personas)
- Costo de infraestructura: $0 (free tiers)
- **Deploy en Vercel, listo para producción**

### Fase 2 — Google Play
- Empaquetar la misma PWA como TWA
- Publicar en Google Play ($25 pago único)
- La web detecta Android y sugiere descargar la app
- Web y app conviven

### Fase 3 — Escala
- Abrir registro a otras iglesias
- Evaluar funciones nativas avanzadas (React Native / Flutter) si es necesario

---

## Modelo de Negocio
- **Clientes:** Pastores / líderes de iglesia
- **Precio sugerido:** S/50–100/mes por iglesia
- **Meta inicial:** 20 iglesias = S/1,000–2,000/mes
- **Diferenciador:** Plataforma específica para iglesias latinas, no genérica

---

## Roles de Usuario

### Super Admin (dueño de la plataforma)
- Aprobar, rechazar, suspender o reactivar solicitudes de nuevas iglesias
- Ver todos los usuarios, suspender/reactivar cuentas (`suspended boolean` en profiles)
- Rol asignado manualmente vía SQL
- Accede al panel desde `/admin`

### Admin de Iglesia (pastor o líder)
- Gestionar iglesia propia: editar nombre, descripción y foto (upload a `church-photos`)
- Aprobar o rechazar solicitudes de membresía
- Asignar miembros a grupos
- Expulsar miembros
- Crear y eliminar grupos/células
- Ver estadísticas (miembros totales, pedidos esta semana, pedidos totales, respondidos)
- Panel en `/churches/:id/admin`

### Usuario / Creyente (miembro)
- Publicar pedidos de oración (máx. 1000 chars)
- Responder pedidos con texto o audio (máx. 30 s)
- Ver feed filtrado por grupo, iglesia u otras iglesias
- Marcar pedidos como "¡Dios respondió!" y publicar testimonio
- Ver sus propios pedidos en "Mis pedidos"
- Ver perfil público de otros usuarios
- Editar su perfil
- **Registrarse con cuenta rápida** (nombre + PIN de 4 dígitos, sin email)
- Opcionalmente añadir email real desde el perfil para asegurar la cuenta

---

## Registro de Iglesias
1. Un líder solicita registrar su iglesia desde la app (`/churches/register`)
2. El Super Admin verifica y aprueba/rechaza/suspende desde `/admin`
3. El líder aprobado tiene rol `church_admin` en su iglesia
4. El Admin gestiona su comunidad desde el panel `/churches/:id/admin`

---

## Estructura de Comunidad
```
Iglesia (status: pending → approved)
  └── Grupos / Células
        └── Miembros (status: pending → approved | rejected)
```

---

## Funcionalidades implementadas

### Feed de oración — Estructura de tabs
```
┌─────────────────────────────────────┐
│  Mi grupo  │  Mi iglesia  │  Otros  │  ← MainTab
│            ├─────────────────────────
│            │  Nuevos  │  Ya oré    │  ← SubTab
└─────────────────────────────────────┘
```

**Lógica de tab por defecto:**
- Usuario con grupo → abre en "Mi grupo"
- Usuario con iglesia pero sin grupo → abre en "Mi iglesia"
- Usuario sin iglesia → abre en "Otros"

**Scopes del feed:**
- **Mi grupo**: filtra `group_id = user.group_id`
- **Mi iglesia**: filtra `church_id = user.church_id`
- **Otros**: filtra `church_id IS NULL OR church_id != user.church_id`

**Sub-tabs:**
- **Nuevos**: pedidos donde el usuario NO ha orado y NO son suyos propios
- **Ya oré**: pedidos donde el usuario SÍ ha marcado 🙏

**Infinite scroll:**
- 5 pedidos por página (`PAGE_SIZE = 5`)
- Carga más al acercarse 300px al sentinel del final
- Se resetea al cambiar de tab principal

### Pedido de oración
- Texto entre 10 y **1000 caracteres**
- Asociado a `church_id` y `group_id` del usuario al momento de publicar
- Estado: `active` → `answered` (al publicar testimonio)
- Contador de oraciones (🙏) con actualización optimista

### Respuestas
- **Texto**: sin límite de caracteres explícito en UI
- **Audio**: grabación con MediaRecorder, límite automático de **30 segundos**; preview antes de enviar; se sube a Supabase Storage (`audio-responses`)
- Dos modos de respuesta en el detalle del pedido

### Testimonio de Respuesta
- Solo el dueño del pedido puede marcar "¡Dios respondió!" (si status=active)
- Al publicar testimonio: el pedido cambia a `status='answered'`
- Los testimonios aparecen en feed propio (`/testimonies`)
- Badge "Respondido" visible en tarjetas del feed

### Oración en cadena
- Tabla `prayer_prays` (user_id, prayer_id)
- Botón 🙏 con contador: actualización optimista, rollback si falla
- Genera notificación automática al dueño del pedido (trigger SQL)

### Promesa del día
- Tarjeta verde con versículo bíblico + referencia
- Compartible vía Web Share API o clipboard
- **Oculta si ya fue vista hoy** (fecha guardada en `localStorage['promise_shown_date']`)
- Aparece encima del feed en `/prayers`

### Notificaciones in-app
- Campana 🔔 en el nav con badge de no leídas (máx "9+")
- Se marcan todas como leídas al abrir `/notifications`
- Triggers SQL generan notificaciones automáticas al:
  - Alguien orar por tu pedido (`prayer_prays`)
  - Alguien responder tu pedido (`responses`)
- **Realtime activo**: el badge se actualiza en tiempo real sin recargar. Canal `notifications:${userId}` vía Supabase Realtime. Requiere SQL: `alter publication supabase_realtime add table notifications`

### Mis pedidos
- Vista `/my-prayers` con todos los pedidos del usuario autenticado
- Muestra estado (activo/respondido), contador de oraciones, fecha

### Gamificación
- **Puntos y niveles**: Triggers SQL actualizan puntos y nivel al realizar acciones
- **Niveles**: Creyente → Intercesor → Guerrero → Anciano (visible en tarjetas del feed)
- **Insignias**: Grid de ganadas+bloqueadas en perfil propio; solo ganadas en perfil público
- **Ranking**: Top 10 de iglesias por puntos en `/ranking`
- **Perfil público**: `/profile/:id` — insignias, iglesia y grupo

### Cuenta rápida con PIN

Flujo de registro alternativo para miembros comunes (no admins). El usuario nunca ve ni escribe un email.

**Registro (`/pin-register`):**
1. Paso 1: usuario escribe su nombre (2–40 chars)
2. Paso 2: crea un PIN de 4 dígitos y lo confirma
3. Se genera un email ficticio: `${nameSlug}.${random4}@intercede.app`
4. La contraseña enviada a Supabase Auth es `PIN + pinSalt` (salt fijo en `environment.ts`)
5. Se insertan `name` e `is_pin_account=true` en `profiles`; se registra en tabla `pin_accounts`

**Login (`/pin-login`):**
1. Usuario escribe su nombre y PIN
2. Se busca en `pin_accounts` por `name_slug` (nombre normalizado)
3. Si 1 cuenta → login directo
4. Si >1 cuenta → selector "¿Cuál eres tú?" (muestra nombre + "Con iglesia" / "Sin iglesia")
5. PIN incorrecto → `signInWithPassword` falla con mensaje claro

**Recuperación de cuenta:**
- Desde `/profile`, sección "Asegurar cuenta" (visible solo si `is_pin_account`)
- El usuario añade su email real → Supabase envía confirmación → `is_pin_account` pasa a `false`

**Pantalla de entrada (`/welcome`):**
- Refactorizado a 3 pasos internos: root | login | register (sin rutas separadas para cada paso)
- "Cuenta rápida" renombrado a "sin correo" en toda la UI
- Opción principal: "Entrar sin correo" (PIN) → `/pin-login`
- Google y email como opciones separadas; "Crear cuenta sin correo" → `/pin-register`

**Restricciones:**
- Solo para `role = 'member'`; admins y super_admin usan email
- "Confirm email" debe estar desactivado en Supabase Auth Settings
- El PIN nunca se guarda en texto plano en ninguna tabla

---

### Flujo de membresía completo
1. Usuario solicita unirse a una iglesia → `church_members.status = 'pending'`
2. Si fue rechazado antes, puede re-solicitar (vuelve a 'pending')
3. Admin ve solicitudes en su panel → tab "Miembros"
4. Admin aprueba: RPC `approve_church_member` actualiza `church_members.status` y escribe `church_id` en el perfil del usuario
5. Admin rechaza: elimina el registro de `church_members`
6. Admin puede asignar grupo: RPC `assign_member_group` actualiza `profiles.group_id`
7. Admin puede expulsar: RPC `remove_church_member` limpia `church_id`/`group_id` del perfil

---

## Tablas en Supabase (implementadas)

```
profiles
  - id, name, email, avatar_url, church_id, group_id
  - level, points, role (member|church_admin|super_admin), suspended
  - is_pin_account (boolean, default false)

churches
  - id, name, description, photo_url, status (pending|approved|rejected|suspended), admin_id

groups
  - id, name, church_id

church_members
  - id, user_id, church_id, group_id, status (pending|approved|rejected)

prayers
  - id, user_id, church_id, group_id, text, status (active|answered), created_at

prayer_prays
  - id, prayer_id, user_id, created_at

responses
  - id, prayer_id, user_id, text, audio_url, created_at

testimonies
  - id, prayer_id, user_id, text, created_at

promises
  - id, text, reference, date

notifications
  - id, user_id, title, body, read (boolean), created_at

badges
  - id, name, description, icon

user_badges
  - id, user_id, badge_id, earned_at

pin_accounts
  - id, user_id (→ profiles), fake_email, name_slug, created_at
```

**RPCs implementadas:**
- `approve_church_member(p_member_id, p_user_id, p_church_id)`
- `assign_member_group(p_member_id, p_group_id, p_user_id)`
- `remove_church_member(p_member_id, p_user_id)`

**Triggers SQL:**
- `prayer_prays` → genera notificación al dueño del pedido
- `responses` → genera notificación al dueño del pedido
- Acciones de gamificación → actualiza points y level en profiles

---

## Contexto de Validación
- Iglesia inicial: ~80 personas, mayoría adultos mayores
- El usuario mayor es ventaja: si funciona para ellos, funciona para cualquiera
- El líder/pastor es el cliente de pago, no el miembro
- Competencia existente (Hozana, Pray.com) es genérica y global — no atiende iglesias locales latinas
