/**
 * Configuración — Noticias de Parabuses.
 * Google News RSS (24h y 1h) con término exacto "Parabuses" + Awario.
 * Sin filtros de contenido: se captura TODO el feed tal cual.
 */

var CONFIG = {
  SPREADSHEET_ID: '1-T1feAyrL2MXdpcoTDScgv8OM6-AaxEtVHyHORz5GeA',
  SHEET_NAME: 'Hoja 1',

  GOOGLE_NEWS_FEEDS: [
    'https://news.google.com/rss/search?q=%22Parabuses%22+when%3A1d&hl=es-419&gl=MX&ceid=MX%3Aes-419',
    'https://news.google.com/rss/search?q=%22Parabuses%22+when%3A1h&hl=es-419&gl=MX&ceid=MX%3Aes-419'
  ],

  BING_NEWS_FEEDS: [],

  OTHER_FEEDS: [],

  MAX_AGE_HOURS: 24,
  DATE_TIMEZONE: 'America/Mexico_City',
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  /** Sin filtros — se captura todo lo que salga del feed. */
  MATCH_REPORT_FILTER: { ENABLED: false, PHRASES: [] },
  LOW_VALUE_FILTER:    { ENABLED: false, PHRASES: [] },

  AWARIO: {
    ENABLED: true,
    AUTH_MODE: 'api_key_query',
    ALERT_ID: '600132317',
    ALERT_IDS: [],
    LIMIT_PER_ALERT: 40,
    API_BASE: 'https://api.awario.com/v1.0',
    API_KEY_QUERY_PARAM: 'access_token',
    LIMIT_QUERY_PARAM: 'limit',
    TOKEN_PATH: '/oauth2/token',
    BEARER_API_BASE: 'https://api.awario.com',
    MENTIONS_PATH_V3: '/api/v3/mentions',
    SOURCE_PREFIX: '',
    ACCEPT_MISSING_DATE: true
  }
};
