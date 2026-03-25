/**
 * Punto de entrada — Noticias de Parabuses.
 * Captura TODO el feed (sin filtro de relevancia IA).
 * Solo clasifica Sentimiento directo para cada nota.
 * Columnas: Title | Description | Link | PubDate | Source | guid | Sentimiento
 */

var COL_SENTIMIENTO = 7;

function run() {
  var sheet = getSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Title', 'Description', 'Link', 'PubDate', 'Source', 'guid', 'Sentimiento'
    ]);
  }
  var existing = getExistingIds(sheet);
  var candidates = getAllCandidates();

  var added = 0;
  candidates.forEach(function(item) {
    if (isDuplicate(item, existing)) return;

    item.sentimiento = getSentimientoTexto(item.title, item.description);
    Utilities.sleep(200);

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
 * Reclasifica sentimiento en las últimas 25 filas.
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
