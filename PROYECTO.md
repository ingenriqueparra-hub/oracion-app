# App de Oración Comunitaria — PROYECTO.md

## Visión General
Red social cristiana centrada en pedidos de oración, respuestas de aliento y testimonios.
Orientada a iglesias evangélicas/protestantes de Latinoamérica, con foco inicial en Perú.

---

## Stack Tecnológico
| Parte | Servicio |
|---|---|
| Frontend | Angular (PWA) |
| Backend / Base de datos | Supabase |
| Almacenamiento de audio | Supabase Storage |
| Autenticación | Supabase Auth |
| Hosting | Vercel |
| App móvil (Fase 2) | TWA empaquetado desde la PWA para Google Play |

---

## Fases de Lanzamiento

### Fase 1 — MVP (PWA)
- Lanzar como web progresiva (PWA) instalable desde el navegador
- Validar con la iglesia inicial (~80 personas)
- Costo de infraestructura: $0 (free tiers)

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
- Aprobar o rechazar solicitudes de nuevas iglesias
- Ver todas las iglesias y usuarios
- Suspender cuentas
- Gestionar pagos y suscripciones

### Admin de Iglesia (pastor o líder)
- Registrar y gestionar su iglesia (nombre, foto, descripción)
- Crear y gestionar grupos o células dentro de la iglesia
- Aprobar miembros de su comunidad
- Invitar miembros
- Ver estadísticas de actividad de su iglesia

### Usuario (miembro)
- Publicar pedidos de oración
- Responder pedidos con texto o audio
- Ver feed de su iglesia y de otras iglesias
- Marcar pedidos como respondidos y compartir testimonio
- Editar su perfil

---

## Registro de Iglesias
1. Un líder solicita registrar su iglesia desde la app
2. El Super Admin verifica y aprueba manualmente
3. El líder aprobado se convierte en Admin de su iglesia
4. El Admin gestiona su comunidad dentro de la plataforma

> Al inicio la verificación puede hacerse por WhatsApp. No necesita automatizarse en el MVP.

---

## Estructura de Comunidad
```
Iglesia
  └── Grupos / Células
        └── Miembros
```
Similar a LinkedIn: Empresa → Departamento → Persona

---

## Funcionalidades

### Core
- Publicar pedido de oración (texto)
- Responder pedido con texto o audio
- Feed de pedidos (iglesia propia primero, otras iglesias después)
- Filtrar por iglesia o grupo

### Testimonio de Respuesta
- Marcar pedido como "¡Dios respondió!"
- Escribir el testimonio de respuesta
- Los testimonios aparecen como historias inspiradoras en el feed

### Oración en Cadena
- Contador simple: "🙏 47 personas han orado por esto"
- Cualquier usuario puede sumar su oración con un toque

### Promesa del Día
- Una promesa bíblica diaria (textos que declaran algo que Dios hará)
- Excusa diaria para abrir la app
- Compartible fácilmente

### Notificaciones Inteligentes
- "Alguien oró por ti hoy"
- "Tu pedido lleva 3 días sin respuesta"
- Recordatorio diario de oración (hora personalizable por el usuario)
- "¡No rompas tu racha de X días!"

---

## Gamificación

### Insignias / Medallas
| Insignia | Condición |
|---|---|
| 🙏 Guerrero de Oración | Respondiste 10 pedidos |
| 🔥 Racha de 7 días | Oraste 7 días seguidos |
| ⭐ Testimonio Vivo | Tu pedido fue respondido |
| 🕊️ Intercesor | 50 oraciones respondidas |

### Puntos y Niveles
- Cada oración respondida suma puntos
- Niveles: Creyente → Intercesor → Guerrero → Anciano

### Rankings
- Top oradores de tu iglesia esta semana
- Top iglesias más activas del mes

---

## Tablas Principales en Supabase (borrador)

```
usuarios
  - id, nombre, foto, email, iglesia_id, grupo_id, nivel, puntos, racha_dias

iglesias
  - id, nombre, foto, descripcion, estado (pendiente/aprobada), admin_id

grupos
  - id, nombre, iglesia_id

pedidos_oracion
  - id, usuario_id, iglesia_id, texto, estado (activo/respondido), contador_oraciones, created_at

respuestas
  - id, pedido_id, usuario_id, texto, audio_url, created_at

testimonios
  - id, pedido_id, usuario_id, texto, created_at

promesas
  - id, texto, referencia_biblica, fecha

insignias
  - id, nombre, descripcion, icono

insignias_usuario
  - id, usuario_id, insignia_id, fecha_obtenida
```

---

## Contexto de Validación
- Iglesia inicial: ~80 personas, mayoría adultos mayores
- El usuario mayor es ventaja: si funciona para ellos, funciona para cualquiera
- El líder/pastor es el cliente de pago, no el miembro
- Competencia existente (Hozana, Pray.com) es genérica y global — no atiende iglesias locales latinas
