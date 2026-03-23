/**
 * Punto de entrada: candidatos → filtros reglas → sin duplicados → relevancia IA → sentimiento (si SÍ) → hoja.
 * Columnas 1-based tras guid: Relevante=7, Relevancia motivo=8, Sentimiento=9.
 * Si la hoja ya tenía 7 columnas, añade manualmente 2 columnas y renombra encabezados.
 */
var COL_RELEVANTE = 7;
var COL_MOTIVO_RELEVANCIA = 8;
var COL_SENTIMIENTO = 9;

function run() {
  var sheet = getSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Title', 'Description', 'Link', 'PubDate', 'Source', 'guid',
      'Relevante', 'Relevancia motivo', 'Sentimiento'
    ]);
  }
  var existing = getExistingIds(sheet);
  var candidates = getAllCandidates();

  var added = 0;
  candidates.forEach(function(item) {
    if (isDuplicate(item, existing)) return;

    var rel = getRelevanciaAtlas(item.title, item.description);
    item.relevante = rel.relevante;
    item.relevanciaMotivo = rel.motivo;
    Utilities.sleep(200);
    if (rel.relevante === 'SÍ') {
      item.sentimiento = getSentimientoTexto(item.title, item.description);
      Utilities.sleep(200);
    } else {
      item.sentimiento = '—';
    }
    appendNote(sheet, item);
    added++;

    existing.guids[item.guid] = true;
    existing.links[item.link] = true;
    existing.titles[item.title] = true;
    var tsKey = titleSourceDedupKey(item.title, item.source);
    if (tsKey) {
      if (!existing.titleSource) existing.titleSource = {};
      existing.titleSource[tsKey] = true;
    }
  });

  Logger.log('Notas nuevas agregadas: ' + added);
  return added;
}

/**
 * Clasifica sentimiento en las últimas 25 filas (perspectiva Atlas FC).
 */
function clasificarSentimientoUltimas25() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('No hay filas de datos (solo encabezado o hoja vacía).');
    return 0;
  }
  var startRow = Math.max(2, lastRow - 24);
  var count = 0;
  for (var row = startRow; row <= lastRow; row++) {
    var title = (sheet.getRange(row, 1).getValue() || '').toString().trim();
    var description = (sheet.getRange(row, 2).getValue() || '').toString().trim();
    if (!title && !description) continue;
    var sentimiento = getSentimientoTexto(title, description);
    sheet.getRange(row, COL_SENTIMIENTO).setValue(sentimiento);
    count++;
    if (row < lastRow) Utilities.sleep(300);
  }
  Logger.log('Sentimiento actualizado en ' + count + ' filas (filas ' + startRow + ' a ' + lastRow + ').');
  return count;
}

/**
 * reclasifica relevancia IA en las últimas 25 filas (columnas Relevante + motivo).
 */
function reclasificarRelevanciaUltimas25() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('No hay filas de datos.');
    return 0;
  }
  var startRow = Math.max(2, lastRow - 24);
  var count = 0;
  for (var row = startRow; row <= lastRow; row++) {
    var title = (sheet.getRange(row, 1).getValue() || '').toString().trim();
    var description = (sheet.getRange(row, 2).getValue() || '').toString().trim();
    if (!title && !description) continue;
    var rel = getRelevanciaAtlas(title, description);
    sheet.getRange(row, COL_RELEVANTE).setValue(rel.relevante);
    sheet.getRange(row, COL_MOTIVO_RELEVANCIA).setValue(rel.motivo);
    count++;
    if (row < lastRow) Utilities.sleep(400);
  }
  Logger.log('Relevancia actualizada en ' + count + ' filas.');
  return count;
}
