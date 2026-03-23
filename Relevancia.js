/**
 * Relevancia para monitoreo Atlas FC (brief cliente) vía OpenAI.
 * Devuelve { relevante: 'SÍ'|'NO', motivo: string }.
 */

function getRelevanciaAtlas(title, description) {
  var apiKey = getOpenAiKey();
  if (!apiKey) {
    return { relevante: 'SÍ', motivo: '(Sin OPENAI_API_KEY: revisa relevancia a mano)' };
  }

  var text = ((title || '') + '\n' + (description || '')).trim();
  if (!text) return { relevante: 'NO', motivo: 'Sin texto' };

  var instruccion =
    'Eres filtro editorial para el club Atlas FC (Guadalajara). Marca SÍ si la noticia es relevante para comunicación/institucional del CLIENTE según ESTOS EJES (prioriza venta del club y rumores):\n' +
    '— Administración, propiedad, VENTA del club, compradores, procesos, RUMORES de venta o compra del club.\n' +
    '— Sede Copa del Mundo en Guadalajara vinculada al club o sus instalaciones; ciudad como sede deportiva en clave Atlas.\n' +
    '— Eventos de marca (ej. Clásico Tapatío en Los Ángeles), impacto mediático del club fuera del partido de liga rutinario.\n' +
    '— Riesgo reputacional: incidentes con afición, seguridad, violencia en contexto Atlas.\n' +
    '— Mercado de fichajes: compras, ventas, préstamos, rumores donde Atlas sea protagonista (llega, sale, negocia).\n' +
    '— Liguilla o clasificación SOLO si el foco es claramente el Atlas (escenarios del club), no guías genéricas de la jornada.\n' +
    'Marca NO si: cobertura rutinaria del próximo partido (previa/vivo/goles), pronósticos/apuestas/cuotas, nota centrada en OTRO equipo con mención lateral de Atlas, guías "dónde ver toda la jornada" o tabla genérica sin foco Atlas, fútbol internacional u otros clubes sin eje Atlas/administración/venta.\n' +
    'Responde SOLO un JSON válido en una línea, sin markdown: {"relevante":"SI" o "NO","motivo":"máximo 140 caracteres en español"}';

  var payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Solo JSON. Claves: relevante (SI o NO), motivo (breve).' },
      { role: 'user', content: instruccion + '\n\nNOTICIA:\n' + text }
    ],
    max_tokens: 120,
    temperature: 0
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
    var raw = response.getContentText();
    var json = JSON.parse(raw);
    var choice = json.choices && json.choices[0];
    var content = (choice && choice.message && choice.message.content) ? choice.message.content.trim() : '';
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    var parsed = JSON.parse(content);
    var rel = (parsed.relevante || parsed.Relevante || '').toString().toUpperCase();
    var motivo = (parsed.motivo || parsed.Motivo || '').toString().trim().substring(0, 200);
    if (rel === 'SI' || rel === 'SÍ') return { relevante: 'SÍ', motivo: motivo || '—' };
    if (rel === 'NO') return { relevante: 'NO', motivo: motivo || '—' };
    return { relevante: 'SÍ', motivo: '(Respuesta IA no clara)' };
  } catch (e) {
    Logger.log('Relevancia error: ' + e.toString());
    return { relevante: 'SÍ', motivo: '(Error IA; revisar manual)' };
  }
}
