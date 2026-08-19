# TAU Nova — guía para agentes

SPA React (Vite) de operaciones FTTH. Solo front; BFF y facade Nova están en `src/config.ts`.

Leé [`docs/arquitectura.md`](docs/arquitectura.md) antes de agregar pantallas, cards o llamadas al BFF.

## Invariantes

- **Fetch por dato, cache compartido** (TanStack Query). Misma API = misma `queryKey` = un GET.
- La **page** pide solo lo que necesita para armarse (layout, modo, breadcrumb).
- Las **cards** pintan. El fetch vive en `hooks/` (`useXxxQuery`), no en `fetch` suelto ni en un store de pantalla.
- Card oculta = no montada = no se pide esa API.
- Zustand no guarda respuestas del BFF (sí: auth, tema, menú, árbol).
- Features por dominio. `shared/` no conoce entidades de un feature.
