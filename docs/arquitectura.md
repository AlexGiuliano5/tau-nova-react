# Arquitectura — TAU Nova

SPA de operaciones FTTH. Solo front: las requests van al BFF o al facade Nova (`src/config.ts`).

Este documento es la fuente de verdad. Las reglas de Cursor (`.cursor/rules/`) la refuerzan al generar código.

## Capas

```
src/
  app/                 rutas
  config.ts            URL del BFF y del facade Nova
  features/<dominio>/  api, hooks, pages, ui, lib, types, stores
  shared/              http, tema, UI sin dominio FTTH
```

| Capa | Responsabilidad |
|------|-----------------|
| `pages/` | Orquesta layout, modo de vista, breadcrumb. Pide **solo** lo que la pantalla necesita para armarse. |
| `ui/` presentacional | Pinta. Recibe props. No habla con el BFF. |
| `ui/*Client` | Puente: llama hooks de query y elige el recorte para la card. |
| `hooks/` | `useQuery` / `useMutation`. Dueño del fetch de **un dato**. |
| `api/` | `apiFetch` + parseo. Sin React. |
| `shared/` | No conoce entidades de un feature. |

Una feature no importa `ui/` de otra. Si hay que compartir, subir a un feature de dominio común (`ftth/`) o a `shared/` (genérico).

## Datos: fetch por dato, cache compartido

No es “la page pide todo” ni “cada card es una isla”.

**Dueño del fetch = el dato**, no la card ni la page.

1. Una sola card necesita esa API → el hook vive con esa card. La page no se entera.
2. Dos o más consumidores (u otra card + la page para layout) → **un** `useQuery`, **misma** `queryKey`. Quien monte primero dispara la red; el resto lee cache.
3. Card oculta por preferencias = no montada = esa API no se pide.
4. No hay store/context de “datos de pantalla” hasta que 3+ cards lean el mismo blob y Query se vuelva incómodo.

Eso resuelve “la card llama y no llama”: llama al hook; si el dato ya está, no hay segundo GET.

### Query keys

Nuevas queries: `['<feature>', '<recurso>', ...ids]`.

```ts
['ont', 'context', ontId]
['ont', 'neighbors-grid', entityId]
['ont', 'client', ontId]
```

Keys ya existentes (`['ont-context', ontId]`, `['ont-neighbors-grid', entityId]`) no se renombran sin necesidad. No inventar una key distinta para la misma API.

### Qué no va en Zustand

Zustand es estado de **app**: sesión, tema, menú, caché del árbol FTTH.

Las respuestas del BFF no viven en Zustand. Van a TanStack Query.

### Acciones del usuario

GET de lectura → `useQuery`.  
Recalcular, cambiar filtro, guardar preferencia → `useMutation` (o un GET disparado a mano que **invalide** la misma key). No un segundo `useEffect` paralelo “parecido”.

## Ilustración: pantalla ONT

Hoy el solape aparece en detalle ONT. La page pide **contexto** (`useOntContextQuery`) porque **ella** lo necesita: modo normal/infraco y qué cards montar.

| Dato | Consumidores |
|------|----------------|
| Contexto (LastMetrics / infraco) | Page + info, métricas, interrupciones, vecinos, mapas |
| Grid de vecinos | Tabla y mapa — `useOntNeighborsQuery` |
| Cliente, alertas, down, agg… | Una card cada una |

Otras pantallas pueden seguir con un dato por card. Si dos cards pasan a necesitar el mismo recurso, se extrae un hook con la misma key. No se adelanta un orquestador de page.

Hay cards de lectura todavía con `useEffect` (`ClienteCardClient`). Es deuda: el código nuevo usa Query, como `NeighborsCardClient`.

## Auth y HTTP

- Token JWT en `sessionStorage` (`auth-store`).
- Requests autenticadas: `apiFetch` (`src/shared/api/http.ts`). Default BFF; `baseUrl` para el facade Nova. Siempre Bearer salvo login.
- APIs Nova: envelope `{ type, title, status, detail, data }`. El `status` del JSON no tiene que coincidir con el HTTP. Parseo: `readApiEnvelope`. 200 OK · 206 sin datos · 202 error técnico · 400 inválido · 204 auth.
- Login no usa Bearer.
- 401: logout y redirect a `/login`. No tratar 403 igual que 401 en código nuevo (un 403 de recurso no debería echar la sesión).

## UI

- Tailwind + tokens (`--primary`, `--card`, `.dm`). Evitar hex sueltos salvo pantallas hero ya existentes.
- PrimeReact: DataTable (y lo que ya esté). No sumar otro kit.
- Loading: skeleton de la **card**, no de toda la página, salvo que falte un dato sin el cual la vista no existe.
- Breakpoint de layout: `md`.

## Rutas FTTH (referencia)

- `/ftth` home
- `/ftth/olt/:olt` resumen OLT
- `/ftth/olt/:olt/placa/:placa/puerto/:puerto` puerto
- `/ftth/ont/:ont/info` detalle ONT
- `/ftth/preferencias/ont` layout de cards
