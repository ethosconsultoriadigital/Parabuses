/**
 * Configuración — Atlas FC (club de fútbol, Guadalajara).
 * Google News + Bing RSS + otros feeds + Awario (opcional).
 * Dedupe: guid/link + título+fuente (igual que IMU/MOTA).
 */

var CONFIG = {
  SPREADSHEET_ID: '',
  SHEET_NAME: 'Hoja 1',

  GOOGLE_NEWS_FEEDS: [
    'https://news.google.com/rss/search?q=club%20atlas%20fc%20when%3A1d&hl=es-419&gl=MX&ceid=MX%3Aes-419',
    'https://news.google.com/rss/search?q=club%20atlas%20fc%20when%3A1h&hl=es-419&gl=MX&ceid=MX%3Aes-419',
    'https://news.google.com/rss/search?q=atlas%20fc%20guadalajara%20when%3A1d&hl=es-419&gl=MX&ceid=MX%3Aes-419',
    'https://news.google.com/rss/search?q=atlas%20fc%20guadalajara%20when%3A1h&hl=es-419&gl=MX&ceid=MX%3Aes-419',
    'https://news.google.com/rss/search?q=atlas%20de%20guadalajara%20futbol%20when%3A1d&hl=es-419&gl=MX&ceid=MX%3Aes-419',
    'https://news.google.com/rss/search?q=atlas%20de%20guadalajara%20futbol%20when%3A1h&hl=es-419&gl=MX&ceid=MX%3Aes-419',
    'https://news.google.com/rss/search?q=los%20zorros%20atlas%20when%3A1d&hl=es-419&gl=MX&ceid=MX%3Aes-419',
    'https://news.google.com/rss/search?q=los%20zorros%20atlas%20when%3A1h&hl=es-419&gl=MX&ceid=MX%3Aes-419'
  ],

  BING_NEWS_FEEDS: [
    'https://www.bing.com/news/search?q=atlas+fc+guadalajara&qft=interval%3d%227%22&format=rss&setlang=es&cc=MX',
    'https://www.bing.com/news/search?q=club+atlas+fc&qft=interval%3d%227%22&format=rss&setlang=es&cc=MX',
    'https://www.bing.com/news/search?q=atlas+de+guadalajara+futbol&qft=interval%3d%227%22&format=rss&setlang=es&cc=MX'
  ],

  OTHER_FEEDS: [
    { url: 'https://www.eleconomista.com.mx/rss/ultimas-noticias', isGoogle: false }
  ],

  KEYWORDS: [
    'Atlas FC', 'ATLAS FC', 'atlas fc',
    'Club Atlas', 'club atlas', 'CLUB ATLAS',
    'Atlas Guadalajara', 'atlas guadalajara',
    'Atlas de Guadalajara', 'atlas de guadalajara',
    'Los Zorros', 'los zorros', 'Zorros del Atlas', 'zorros del atlas',
    'Atlas de GDL', 'Atlas GDL'
  ],

  MAX_AGE_HOURS: 24,
  DATE_TIMEZONE: 'America/Mexico_City',
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  /**
   * Descarta notas que parecen cobertura de partido (previa, vivo, minuto a minuto, etc.).
   * Ajusta PHRASES si te come notas buenas o deja pasar partidos.
   */
  MATCH_REPORT_FILTER: {
    ENABLED: true,
    PHRASES: [
      'minuto a minuto',
      'minuto a minuto:',
      'previa:',
      'previa |',
      'previa del partido',
      'previa del juego',
      'dónde ver',
      'donde ver',
      'cómo ver en vivo',
      'como ver en vivo',
      'transmisión en vivo',
      'transmision en vivo',
      'en vivo por',
      'alineación',
      'alineaciones',
      'alineacion',
      'once titular',
      'cronica del partido',
      'crónica del partido',
      'resumen del partido',
      'post partido',
      'postpartido',
      'highlights',
      'goles del',
      'marcador final',
      'marcador:',
      ' resultado ',
      'tanda de penales',
      'penales definen',
      'jornada del apertura',
      'jornada del clausura'
    ]
  },

  /** Ruido barato: apuestas, tablas genéricas (la IA afina el resto). */
  LOW_VALUE_FILTER: {
    ENABLED: true,
    PHRASES: [
      'pronóstico',
      'pronostico',
      'mejores cuotas',
      'mejor cuota',
      'cuotas |',
      'sportytrader',
      'futbol24',
      'tabla de posiciones',
      '¿cómo va la tabla',
      'como va la tabla',
      'apuestas deportivas',
      '¡gol!',
      '!gol!',
      'dónde y cuándo ver la jornada',
      'donde y cuando ver la jornada',
      'liga mx: ¿',
      'liga mx ¿'
    ]
  },

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
    SOURCE_PREFIX: 'Awario · ',
    ACCEPT_MISSING_DATE: true
  }
};
