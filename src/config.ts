/**
 * Config de la SPA (solo front).
 * Sin backend propio ni variables de entorno.
 * BFF legado: histórico, vecinos, auth, preferencias, etc.
 * Facade Nova: APIs nuevas de info ONT (envelope `{ status, data }`).
 */
export const BFF_API_BASE_URL = 'https://tau-bff.telecom.com.ar'

export const NOVA_FACADE_API_BASE_URL =
  'https://nova-facade-novaservices-prod.apps.ocp4-ph.cloudteco.com.ar'

/** Prefijo same-origin en `vite dev` / `preview` (el proxy ignora el cert TLS). */
export const NOVA_FACADE_DEV_PROXY_PATH = '/nova-facade'
