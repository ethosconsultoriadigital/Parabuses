/**
 * Awario API → { title, description, link, pubDate, source, guid, isGoogleNews }.
 * API v1.0 (API key en query) o AUTH_MODE 'bearer_v3' para /api/v3/mentions + Bearer.
 */

function awarioPick_(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var v = obj[keys[i]];
    if (v !== undefined && v !== null && String(v).trim()) return v;
  }
  return '';
}

function awarioHostnameFromLink_(url) {
  var s = String(url).trim();
  var m = s.match(/^https?:\/\/([^/?#:]+)(?::\d+)?/i);
  if (!m) return '';
  return m[1].replace(/^www\./i, '');
}

function awarioFormatPubDateForSheet_(pub) {
  if (pub === undefined || pub === null) return '';
  var raw = String(pub).trim();
  if (!raw) return '';
  var n = typeof pub === 'number' ? pub : parseFloat(raw.replace(/,/g, ''));
  if (!isNaN(n) && n > 1e11 && n < 1e14) {
    var dMs = new Date(Math.floor(n));
    if (!isNaN(dMs.getTime())) {
      var tz = (CONFIG.DATE_TIMEZONE || 'America/Mexico_City');
      return Utilities.formatDate(dMs, tz, 'yyyy-MM-dd HH:mm:ss');
    }
  }
  var d = new Date(raw);
  if (!isNaN(d.getTime())) {
    var tz2 = (CONFIG.DATE_TIMEZONE || 'America/Mexico_City');
    return Utilities.formatDate(d, tz2, 'yyyy-MM-dd HH:mm:ss');
  }
  return '';
}

function parseAwarioMentionsPayload_(text) {
  try {
    var j = JSON.parse(text);
    if (Array.isArray(j)) return j;
    if (j.alert_data && j.alert_data.mentions && Array.isArray(j.alert_data.mentions)) return j.alert_data.mentions;
    if (j.data && j.data.mentions && Array.isArray(j.data.mentions)) return j.data.mentions;
    if (j.data && Array.isArray(j.data)) return j.data;
    if (j.mentions && Array.isArray(j.mentions)) return j.mentions;
    if (j.results && Array.isArray(j.results)) return j.results;
    if (j.items && Array.isArray(j.items)) return j.items;
    if (j.response && Array.isArray(j.response)) return j.response;
    return [];
  } catch (e) {
    Logger.log('Awario JSON: ' + e.toString());
    return [];
  }
}

function mapAwarioMention_(m) {
  if (!m || typeof m !== 'object') return null;
  var link = awarioPick_(m, ['url', 'link', 'post_url', 'page_url', 'source_url', 'permalink']);
  if (!link) return null;
  var id = awarioPick_(m, ['id', 'mention_id', 'uuid']);
  var title = awarioPick_(m, ['title', 'page_title', 'name']) || '';
  var desc = awarioPick_(m, ['text', 'content', 'description', 'snippet', 'body']) || '';
  if (!title && desc) title = String(desc).substring(0, 220).trim();
  var pub = awarioPick_(m, ['published', 'published_at', 'date', 'timestamp', 'created_at', 'posted_at']);
  var source = '';
  if (m.source && typeof m.source === 'object') {
    source = awarioPick_(m.source, ['name', 'title', 'domain']) || '';
  }
  if (!source) source = awarioPick_(m, ['source_name', 'resource_name', 'domain', 'source_domain', 'hostname']) || '';
  if (!source && m.author && typeof m.author === 'object') {
    source = awarioPick_(m.author, ['name', 'title']) || '';
  }
  var host = awarioHostnameFromLink_(link);
  if (!source) source = host;
  if (!source && typeof m.source === 'string' && m.source.trim()) source = m.source.trim();
  if (!source) source = host;
  var prefix = (CONFIG.AWARIO && CONFIG.AWARIO.SOURCE_PREFIX) ? String(CONFIG.AWARIO.SOURCE_PREFIX) : '';
  return {
    title: String(title).trim(),
    description: String(desc).trim(),
    link: String(link).trim(),
    pubDate: awarioFormatPubDateForSheet_(pub) || '',
    source: (prefix + source).trim(),
    guid: 'awario:' + (id || link),
    isGoogleNews: true
  };
}

function getAwarioApiKeyFromProps_() {
  var props = PropertiesService.getScriptProperties();
  return (props.getProperty('AWARIO_API_KEY') || props.getProperty('AWARIO_ACCESS_TOKEN') || '').trim();
}

function getAwarioBearerToken_() {
  var props = PropertiesService.getScriptProperties();
  var direct = (props.getProperty('AWARIO_ACCESS_TOKEN') || props.getProperty('AWARIO_API_KEY') || '').trim();
  if (direct && CONFIG.AWARIO && CONFIG.AWARIO.AUTH_MODE === 'bearer_v3') return direct;

  var clientId = (props.getProperty('AWARIO_CLIENT_ID') || '').trim();
  var clientSecret = (props.getProperty('AWARIO_CLIENT_SECRET') || '').trim();
  if (!clientId || !clientSecret) return '';

  var cache = CacheService.getScriptCache();
  var cached = cache.get('awario_oauth_token');
  if (cached) return cached;

  var cfg = CONFIG.AWARIO || {};
  var base = String(cfg.BEARER_API_BASE || 'https://api.awario.com').replace(/\/$/, '');
  var tokenPath = cfg.TOKEN_PATH || '/oauth2/token';
  var tokenUrl = base + tokenPath;

  var resp = UrlFetchApp.fetch(tokenUrl, {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    muteHttpExceptions: true,
    payload: {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    }
  });

  if (resp.getResponseCode() !== 200) {
    Logger.log('Awario token HTTP ' + resp.getResponseCode() + ' ' + String(resp.getContentText()).substring(0, 400));
    return '';
  }

  var json = JSON.parse(resp.getContentText());
  var token = (json.access_token || json.token || '').toString().trim();
  if (!token) return '';

  var ttl = 3300;
  var exp = parseInt(json.expires_in, 10);
  if (!isNaN(exp) && exp > 120) ttl = Math.min(exp - 60, 3500);
  cache.put('awario_oauth_token', token, ttl);
  return token;
}

function getAwarioAlertIds_() {
  var cfg = CONFIG.AWARIO;
  if (!cfg) return [];
  var list = cfg.ALERT_IDS;
  if (list && list.length) return list;
  var one = (cfg.ALERT_ID || '').toString().trim();
  return one ? [one] : [];
}

function awarioNormalizePath_(path) {
  if (!path) return '/mentions';
  var p = String(path).trim();
  if (p.indexOf('/') !== 0) p = '/' + p;
  return p;
}

function fetchAwarioMentionItems() {
  if (!CONFIG.AWARIO || !CONFIG.AWARIO.ENABLED) return [];

  var cfg = CONFIG.AWARIO;
  var authMode = (cfg.AUTH_MODE || 'api_key_query').toString().trim();
  var limit = cfg.LIMIT_PER_ALERT || 30;
  var alertIds = getAwarioAlertIds_();
  if (!alertIds.length) {
    Logger.log('Awario: define CONFIG.AWARIO.ALERT_ID o ALERT_IDS.');
    return [];
  }

  var out = [];
  var headers = { 'Accept': 'application/json' };

  if (authMode === 'bearer_v3') {
    var bearerBase = String(cfg.BEARER_API_BASE || 'https://api.awario.com').replace(/\/$/, '');
    var v3Path = awarioNormalizePath_(cfg.MENTIONS_PATH_V3 || '/api/v3/mentions');
    var token = getAwarioBearerToken_();
    if (!token) {
      Logger.log('Awario bearer_v3: falta AWARIO_ACCESS_TOKEN o CLIENT_ID + CLIENT_SECRET.');
      return [];
    }
    headers['Authorization'] = 'Bearer ' + token;
    for (var b = 0; b < alertIds.length; b++) {
      var urlB = bearerBase + v3Path;
      var sepB = urlB.indexOf('?') === -1 ? '?' : '&';
      urlB += sepB + 'alert_id=' + encodeURIComponent(alertIds[b]) + '&limit=' + encodeURIComponent(String(limit));
      var respB = UrlFetchApp.fetch(urlB, { muteHttpExceptions: true, headers: headers });
      if (respB.getResponseCode() !== 200) {
        Logger.log('Awario mentions HTTP ' + respB.getResponseCode() + ' ' + String(respB.getContentText()).substring(0, 350));
        continue;
      }
      var rowsB = parseAwarioMentionsPayload_(respB.getContentText());
      for (var ib = 0; ib < rowsB.length; ib++) {
        var itemB = mapAwarioMention_(rowsB[ib]);
        if (itemB) out.push(itemB);
      }
    }
    return out;
  }

  var apiKey = getAwarioApiKeyFromProps_();
  if (!apiKey) {
    Logger.log('Awario: falta AWARIO_API_KEY (o alias AWARIO_ACCESS_TOKEN) en propiedades del script.');
    return [];
  }

  var base = String(cfg.API_BASE || 'https://api.awario.com/v1.0').replace(/\/$/, '');
  var keyName = (cfg.API_KEY_QUERY_PARAM || 'access_token').toString();
  var limitName = (cfg.LIMIT_QUERY_PARAM || 'limit').toString();

  for (var a = 0; a < alertIds.length; a++) {
    var alertId = String(alertIds[a]).trim();
    var url = base + '/alerts/' + encodeURIComponent(alertId) + '/mentions';
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    url += sep +
      encodeURIComponent(keyName) + '=' + encodeURIComponent(apiKey) +
      '&' + encodeURIComponent(limitName) + '=' + encodeURIComponent(String(limit));

    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: headers });
    if (resp.getResponseCode() !== 200) {
      Logger.log('Awario mentions HTTP ' + resp.getResponseCode() + ' ' + String(resp.getContentText()).substring(0, 350));
      continue;
    }
    var rows = parseAwarioMentionsPayload_(resp.getContentText());
    for (var i = 0; i < rows.length; i++) {
      var item = mapAwarioMention_(rows[i]);
      if (item) out.push(item);
    }
  }

  return out;
}
