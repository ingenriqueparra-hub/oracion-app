# AGENTS.md - oracion-app

## Preferencias de Codex

- Skills: crear e instalar localmente en .agents/skills/ por defecto; usar ~/.agents/skills/ solo cuando aplique a multiples proyectos y Enrique apruebe explicitamente su instalacion global
- Configuracion, permisos y MCP: usar `.codex/config.toml` local al proyecto; no guardar secretos ni tokens en el repositorio
- Memoria: usar la memoria generada de Codex en `~/.codex/memories/`; no duplicarla dentro del repositorio
- Reglas obligatorias y decisiones durables: mantenerlas en `AGENTS.md` o en documentacion versionada del proyecto

## Politica de archivos Markdown

- `AGENTS.md` contiene instrucciones operativas para Codex; `CLAUDE.md`, para el otro agente.
- `README.md` presenta el proyecto para humanos; `docs/` guarda politicas, decisiones y procedimientos extensos.
- Este es un proyecto de desarrollo: `COMANDOS.md` y `docs/ESTADO_ACTUAL.md` son opcionales mientras no tenga tareas operativas repetitivas.
- Si existe `COMANDOS.md`, esta protegido y requiere autorizacion textual explicita de Enrique para modificarlo.
- Antes de crear un `.md`, revisar si la informacion pertenece a uno existente y evitar duplicacion.
- No mover ni borrar `.md` heredados sin aprobacion explicita; requieren revision separada.

## Contexto principal

- Leer CLAUDE.md y PROYECTO.md antes de tomar decisiones de arquitectura.
- Trabajar un modulo a la vez y respetar las reglas de negocio documentadas.
- No guardar credenciales, tokens ni secretos en archivos versionados.