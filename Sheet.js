/**
 * Acceso a la hoja y duplicados.
 * Google/Bing: guid/link; además mismo título + misma fuente (p. ej. 1h vs 24h en distintos RSS).
 * Otros feeds: también por título solo (comportamiento previo).
 * Mismo título en otro medio (source distinta) no se considera duplicado.
 */

function titleSourceDedupKey(title, source) {
  var t = (title || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
  var s = (source || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
  if (!t || !s) return '';
  return t + '\x1e' + s;
}

function getSheet() {
  var id = (CONFIG.SPREADSHEET_ID || '').toString().trim();
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Config.js: pon CONFIG.SPREADSHEET_ID o ejecuta el script desde la hoja vinculada.');
  }
  return ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
}

function getExistingIds(sheet) {
  var existingGuids = {};
  var existingLinks = {};
  var existingTitles = {};
  var existingTitleSource = {};
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    return { guids: existingGuids, links: existingLinks, titles: existingTitles, titleSource: existingTitleSource };
  }

  var data = sheet.getDataRange().getValues();

  var TITLE_COL = 0, LINK_COL = 2, SOURCE_COL = 4, GUID_COL = 5;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var guid = (row[GUID_COL] || '').toString().trim();
    var link = (row[LINK_COL] || '').toString().trim();
    var title = (row[TITLE_COL] || '').toString().trim();
    var source = (row[SOURCE_COL] || '').toString().trim();
    if (guid) existingGuids[guid] = true;
    if (link) existingLinks[link] = true;
    if (title) existingTitles[title] = true;
    var tsKey = titleSourceDedupKey(title, source);
    if (tsKey) existingTitleSource[tsKey] = true;
  }
  return { guids: existingGuids, links: existingLinks, titles: existingTitles, titleSource: existingTitleSource };
}

function isDuplicate(item, existing) {
  var guid = (item.guid || '').toString().trim();
  var link = (item.link || '').toString().trim();
  var title = (item.title || '').toString().trim();

  if (existing.guids[guid]) return true;
  if (existing.links[link]) return true;

  var tsKey = titleSourceDedupKey(item.title, item.source);
  if (tsKey && existing.titleSource && existing.titleSource[tsKey]) return true;

  if (!item.isGoogleNews && existing.titles[title]) return true;
  return false;
}

function appendNote(sheet, note) {
  sheet.appendRow([
    note.title,
    note.description,
    note.link,
    note.pubDate,
    note.source,
    note.guid,
    note.relevante || '',
    note.relevanciaMotivo || '',
    note.sentimiento || ''
  ]);
}
