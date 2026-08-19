# TAU Nova (SPA)

Migración a React + Vite. Fase 1: **login** + **home FTTH**.

App **solo front**: sin backend propio ni `.env`. Las requests van directo al BFF
(`src/config.ts` → `BFF_API_BASE_URL`).

Arquitectura y convenciones: [`docs/arquitectura.md`](docs/arquitectura.md).

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- React Router 7
- Zustand · TanStack Query · Zod

## Cómo levantarlo

```bash
npm install
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173).

En Network vas a ver llamadas a `https://tau-bff.telecom.com.ar/...` (CORS debe
permitir el origen de la SPA; en local, `http://localhost:5173`).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server (puerto 5173) |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |

## Config del BFF

La URL está en `src/config.ts`. Si cambia el ambiente, editá esa constante
(o más adelante un `public/config.json` cargado al inicio).

## Qué incluye esta fase

- Login usuario/contraseña → BFF directo
- Home FTTH (hero + búsqueda + recientes)
- **Pantalla ONT** `/ftth/ont/:ont/info` (cards + tabla vecinos Tailwind)
- **Preferencias ONT** `/ftth/preferencias/ont` (orden/visibilidad cards y métricas)

