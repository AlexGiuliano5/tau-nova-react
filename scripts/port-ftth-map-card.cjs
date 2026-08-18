const fs = require('fs')
const path = require('path')

const srcPath = 'D:/TAU/tau-nova/components/ui/map/FtthSinglePointMapCard.tsx'
const outDir = 'D:/TAU/tau-nova-react/src/features/ont/ui/map'
const outPath = path.join(outDir, 'FtthSinglePointMapCard.tsx')

let src = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n')
src = src.replace(/^'use client';\n/, '')

const oldImports = `import { requestManager } from '@/lib/api/request-manager';
import { fetchApi } from '@/lib/http/fetch-api';
import {
  formatStatusLabel,
  getOltRxColor,
  getOltTxColor,
  getOntRxColor
} from '@/components/ui/table/ftthOntMetricsGridTableShared';`

const newImports = `import { apiFetch } from '@/shared/api/http'
import {
  formatStatusLabel,
  getOltRxColor,
  getOltTxColor,
  getOntRxColor,
} from '@/features/ont/lib/ftth-map-metric-colors'

import 'maplibre-gl/dist/maplibre-gl.css'`

if (!src.includes(oldImports)) {
  console.error('Import block not found')
  process.exit(1)
}
src = src.replace(oldImports, newImports)

src = src.replace(/requestManager\.removeController\(previous\);\n\s*/g, '')
src = src.replace(/requestManager\.removeController\(controller\);\n\s*/g, '')
src = src.replace(
  /const controller = requestManager\.createController\(\);/g,
  'const controller = new AbortController();',
)
src = src.replace(
  /\/\/ Registrado: abortAll\(\) al soft-nav cancela streetImg al click, no al unmount\.\n\s*/g,
  '',
)
src = src.replace(
  /\/\/ Abortamos streetImg al desmontar \(y requestManager\.abortAll\(\) al soft-nav lo corta al click\)\./g,
  '// Abortamos streetImg al desmontar.',
)

const oldFetch = `    const params = new URLSearchParams({
      minLon: payload.minLon,
      minLat: payload.minLat,
      maxLon: payload.maxLon,
      maxLat: payload.maxLat,
      size: payload.size,
      rotation: payload.rotation,
      layers: payload.layers.join(',')
    });

    const response = await fetchApi(\`/api/maps/streetImg?\${params.toString()}\`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal
    });`

const newFetch = `    const response = await apiFetch('/api/maps/streetImg', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });`

if (!src.includes(oldFetch)) {
  console.error('Fetch block not found')
  process.exit(1)
}
src = src.replace(oldFetch, newFetch)

if (src.includes('requestManager') || src.includes('fetchApi')) {
  console.error('Leftover requestManager/fetchApi')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outPath, src)
console.log('Wrote', outPath, src.length)
