export const reportDesignIcons: Record<string, string> = {
  'Desague tapado': 'drain',
  'Boca de tormenta obstruida': 'storm-drain',
  'Acumulación de basura': 'waste',
  'Calle inundada': 'street',
  'Canales o zanjones obstruidos': 'drainage',
  'Población en zona de riesgo hídrico': 'housing',
  'Defensa o terraplén en mal estado': 'defense',
  'Obra paralizada': 'construction',
  'Otro': 'other',
}

export const reportDesignOrder = [...Object.keys(reportDesignIcons).filter(topic => topic !== 'Otro'), 'Desague tapado', 'Otro']
