/**
 * Sentimiento hacia Atlas FC vía OpenAI.
 * Devuelve "Nota Positiva 🟢" | "Nota Negativa 🔴" | "Nota Neutral ⚪"
 */

function getSentimientoTexto(title, description) {
  var apiKey = getOpenAiKey();
  if (!apiKey) return 'Nota Neutral ⚪';

  var text = (title + '\n' + (description || '')).trim();
  if (!text) return 'Nota Neutral ⚪';

  var payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un clasificador de sentimiento. Responde ÚNICAMENTE con una de estas tres palabras: Positiva, Negativa, Neutral. Nada más.'
      },
      {
        role: 'user',
        content: 'Clasifica el sentimiento de esta noticia hacia el club Atlas FC de Guadalajara (fútbol mexicano, Los Zorros). Responde solo: Positiva, Negativa o Neutral.\n\n' + text
      }
    ],
    max_tokens: 10,
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
    var json = JSON.parse(response.getContentText());
    var choice = json.choices && json.choices[0];
    var word = (choice && choice.message && choice.message.content) ? choice.message.content.trim() : '';
    if (word.indexOf('Positiva') !== -1) return 'Nota Positiva 🟢';
    if (word.indexOf('Negativa') !== -1) return 'Nota Negativa 🔴';
    return 'Nota Neutral ⚪';
  } catch (e) {
    Logger.log('Sentimiento error: ' + e.toString());
    return 'Nota Neutral ⚪';
  }
}

function getOpenAiKey() {
  return PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY') || '';
}
