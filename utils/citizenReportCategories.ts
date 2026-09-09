export type CitizenReportSeverity = 'grave' | 'medio'

export type CitizenReportCategory = {
  topic: string
  severity: CitizenReportSeverity
  description: string
}

export const citizenReportSeverities: Record<CitizenReportSeverity, { label: string, color: string, glyphColor: string }> = {
  grave: { label: 'Grave', color: '#d94841', glyphColor: '#9f302d' },
  medio: { label: 'Medio', color: '#e0ad2f', glyphColor: '#74530a' },
}

export const citizenReportCategories: CitizenReportCategory[] = [
  {
    "topic": "Boca de tormenta obstruida",
    "severity": "medio",
    "description": "Boca de tormenta tapada por basura, escombros, ramas u otros elementos que dificultan el escurrimiento del agua."
  },
  {
    "topic": "Acumulación de basura",
    "severity": "medio",
    "description": "Microbasural o acumulación de residuos en esquinas, veredas, calles u otros espacios que puedan dificultar el escurrimiento del agua."
  },
  {
    "topic": "Calle inundada",
    "severity": "grave",
    "description": "Calle, esquina o sector donde se acumula agua luego de lluvias o donde el agua permanece sin escurrir durante un tiempo."
  },
  {
    "topic": "Canales o zanjones obstruidos",
    "severity": "medio",
    "description": "Canal, zanjón o desagüe a cielo abierto con basura, vegetación u otros elementos que dificultan la circulación del agua."
  },
  {
    "topic": "Población en zona de riesgo hídrico",
    "severity": "grave",
    "description": "Viviendas o asentamientos ubicados en reservorios, zonas inundables o por fuera de los anillos de defensa, expuestos a posibles inundaciones."
  },
  {
    "topic": "Defensa o terraplén en mal estado",
    "severity": "grave",
    "description": "Problemas, daños o situaciones que puedan afectar el estado o funcionamiento de las defensas."
  },
  {
    "topic": "Obra paralizada",
    "severity": "medio",
    "description": "Obra hídrica o de desagüe iniciada que se encuentra detenida, abandonada o sin avances visibles."
  },
  {
    "topic": "Otro",
    "severity": "medio",
    "description": "Situación vinculada al drenaje, escurrimiento del agua o riesgo hídrico que no se encuentre contemplada en las categorías anteriores."
  }
]

export function citizenReportSeverity(topic: string): CitizenReportSeverity {
  return citizenReportCategories.find(category => category.topic === topic)?.severity ?? 'medio'
}
