/**
 * Obtiene y parsea feeds RSS — Noticias de Parabuses.
 * Sin filtros de contenido: se pasan TODOS los ítems del feed.
 * Devuelve array de { title, description, link, pubDate, source, guid, isGoogleNews }.
 */

function fetchFeed(url) {
  var options = {
    muteHttpExceptions: true,
    headers: { 'User-Agent': CONFIG.USER_AGENT || 'Mozilla/5.0 (compatible; Google-Apps-Script)' }
  };
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) return [];
  return parseRss(response.getContentText());
}

function parseRss(xmlText) {
  var items = [];
  if (!xmlText || xmlText.indexOf('<item') === -1) return items;
  try {
    var doc = XmlService.parse(xmlText);
    var root = doc.getRootElement();
    var channel = root.getChild('channel');
    if (!channel) {
      var children = root.getChildren();
      for (var c = 0; c < children.length; c++) {
        if (children[c].getName() === 'channel') {
          channel = children[c];
          break;
        }
      }
    }
    if (!channel) return items;
    var itemList = channel.getChildren('item');
    if (itemList.length === 0) {
      var all = channel.getChildren();
      for (var a = 0; a < all.length; a++) {
        if (all[a].getName() === 'item') itemList.push(all[a]);
      }
    }
    for (var i = 0; i < itemList.length; i++) {
      var item = parseRssItem(itemList[i]);
      if (item) items.push(item);
    }
  } catch (e) {
    Logger.log('Error parseRss: ' + e.toString());
  }
  return items;
}

function stripHtml(html) {
  if (!html) return '';
  var s = html.toString();
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return s.replace(/\s+/g, ' ').trim();
}

function formatPubDateForSheet(pubDateStr) {
  if (!pubDateStr || !String(pubDateStr).trim()) return '';
  var d = new Date(String(pubDateStr).trim());
  if (isNaN(d.getTime())) return '';
  var tz = (CONFIG.DATE_TIMEZONE || 'America/Mexico_City');
  return Utilities.formatDate(d, tz, 'yyyy-MM-dd HH:mm:ss');
}

function parseRssItem(itemEl) {
  try {
    var title   = getTagText(itemEl, 'title');
    var link    = getTagText(itemEl, 'link');
    var desc    = stripHtml(getTagText(itemEl, 'description'));
    var pubDate = getTagText(itemEl, 'pubDate');
    var guid    = getTagText(itemEl, 'guid');
    var sourceEl = itemEl.getChild('source');
    var source = sourceEl ? sourceEl.getText() : '';

    if (!source && sourceEl) source = sourceEl.getText();
    if (!source) {
      var kids = itemEl.getChildren();
      for (var si = 0; si < kids.length; si++) {
        var nm = kids[si].getName();
        if (nm && /source/i.test(nm)) {
          var st = kids[si].getText();
          if (st) { source = st.trim(); break; }
        }
      }
    }

    return {
      title:       title || '',
      description: desc  || '',
      link:        link  || '',
      pubDate:     pubDate || '',
      source:      source || '',
      guid:        guid || link || '',
      isGoogleNews: link.indexOf('news.google.com') !== -1
    };
  } catch (e) {
    return null;
  }
}

function getTagText(parent, tagName) {
  try {
    var child = parent.getChild(tagName);
    if (!child) return '';
    var t = child.getText();
    return (t && typeof t === 'string') ? t.trim() : '';
  } catch (e) {
    return '';
  }
}

function isWithinLast24Hours(pubDateStr, acceptMissing) {
  if (!pubDateStr || !pubDateStr.trim()) return acceptMissing === true;
  try {
    var date = new Date(pubDateStr);
    if (isNaN(date.getTime())) return acceptMissing === true;
    var now = new Date();
    var diffMs = now - date;
    var maxMs = (CONFIG.MAX_AGE_HOURS || 24) * 60 * 60 * 1000;
    return diffMs >= 0 && diffMs <= maxMs;
  } catch (e) {
    return acceptMissing === true;
  }
}

function getAllFeedEntries() {
  var entries = [];
  (CONFIG.GOOGLE_NEWS_FEEDS || []).forEach(function(u) {
    entries.push({ url: u, isGoogleNews: true });
  });
  (CONFIG.BING_NEWS_FEEDS || []).forEach(function(u) {
    entries.push({ url: u, isGoogleNews: true });
  });
  (CONFIG.OTHER_FEEDS || []).forEach(function(f) {
    entries.push({ url: f.url, isGoogleNews: f.isGoogle === true });
  });
  return entries;
}

function getAllCandidates() {
  var candidates = [];
  var seenGuid = {};
  var entries = getAllFeedEntries();

  entries.forEach(function(entry) {
    var items = fetchFeed(entry.url);
    items.forEach(function(item) {
      item.isGoogleNews = entry.isGoogleNews === true;
      /* Solo filtra por antigüedad (24 h); sin filtros de contenido. */
      if (!isWithinLast24Hours(item.pubDate, true)) return;
      if (seenGuid[item.guid]) return;
      seenGuid[item.guid] = true;
      var formatted = formatPubDateForSheet(item.pubDate);
      if (formatted) item.pubDate = formatted;
      candidates.push(item);
    });
  });

  var awCfg = CONFIG.AWARIO;
  if (awCfg && awCfg.ENABLED) {
    var acceptAw = awCfg.ACCEPT_MISSING_DATE !== false;
    fetchAwarioMentionItems().forEach(function(item) {
      item.isGoogleNews = true;
      if (!isWithinLast24Hours(item.pubDate, acceptAw)) return;
      if (seenGuid[item.guid]) return;
      seenGuid[item.guid] = true;
      var formattedAw = formatPubDateForSheet(item.pubDate);
      if (formattedAw) item.pubDate = formattedAw;
      candidates.push(item);
    });
  }

  return candidates;
}
