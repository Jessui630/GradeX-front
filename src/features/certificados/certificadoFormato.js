export const DICTAMENES = {
  AUTENTICO: 'Auténtico',
  NO_AUTENTICO: 'No auténtico',
  INCONCLUSO: 'Inconcluso',
}

export function etiquetaDictamen(dictamen) {
  return DICTAMENES[dictamen] ?? 'Sin dictamen'
}

export function tonoDictamen(dictamen) {
  if (dictamen === 'AUTENTICO') return 'success'
  if (dictamen === 'NO_AUTENTICO') return 'danger'
  if (dictamen === 'INCONCLUSO') return 'warn'
  return 'neutral'
}

export function enlaceVerificacion(token, origen = window.location.origin) {
  if (!token) return null
  return `${origen}/verificar/${token}`
}

export function formatearCalificacion(valor) {
  if (valor === null || valor === undefined || valor === '') return 'No registrada'
  return `${Number(valor).toFixed(2)} / 10`
}
