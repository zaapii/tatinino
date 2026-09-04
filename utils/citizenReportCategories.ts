export type CitizenReportSeverity = 'grave' | 'medio'

export type CitizenReportCategory = {
  topic: string
  severity: CitizenReportSeverity
}

export const citizenReportSeverities: Record<CitizenReportSeverity, { label: string, color: string, glyphColor: string }> = {
  grave: { label: 'Grave', color: '#d94841', glyphColor: '#9f302d' },
  medio: { label: 'Medio', color: '#e0ad2f', glyphColor: '#74530a' },
}

export const citizenReportCategories: CitizenReportCategory[] = [
  { topic: 'Boca de tormenta obstruida', severity: 'medio' },
  { topic: 'Basura o residuos', severity: 'medio' },
  { topic: 'Calle anegada', severity: 'grave' },
  { topic: 'Canal o desagüe', severity: 'medio' },
  { topic: 'Defensa o terraplén', severity: 'grave' },
  { topic: 'Otro', severity: 'medio' },
]

export function citizenReportSeverity(topic: string): CitizenReportSeverity {
  return citizenReportCategories.find(category => category.topic === topic)?.severity ?? 'medio'
}
