// ============================================================
// SKYREAD — script.js
// Usando Open-Meteo: gratuita, sem API Key, funciona na hora!
// Funciona em 2 etapas:
//   1. Geocoding API → converte nome da cidade em coordenadas
//   2. Weather API   → usa as coordenadas para buscar o clima
// ============================================================


// ========== URLs DAS APIs ==========
// API de Geocoding: transforma nome de cidade em latitude/longitude
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

// API de Clima: retorna dados meteorológicos pelas coordenadas
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// Sem API Key! Open-Meteo é totalmente gratuita e aberta 🎉


// ========== REFERÊNCIAS AOS ELEMENTOS HTML ==========
// document.getElementById(): busca um elemento pelo id no HTML
const inputCidade = document.getElementById("city-input");
const resultado   = document.getElementById("resultado");
const erroMsg     = document.getElementById("erro");


// ========== EVENTO: BUSCAR AO PRESSIONAR ENTER ==========
inputCidade.addEventListener("keypress", function(evento) {
  if (evento.key === "Enter") {
    buscarClima();
  }
});


// ========== FUNÇÃO PRINCIPAL ==========
async function buscarClima() {

  const cidade = inputCidade.value.trim();

  if (!cidade) {
    mostrarErro();
    return;
  }

  esconderResultado();
  esconderErro();

  try {

    // ---- ETAPA 1: GEOCODING ----
    // Monta a URL para buscar as coordenadas da cidade digitada
    const urlGeo = `${GEOCODING_URL}?name=${cidade}&count=1&language=pt&format=json`;
    // name=cidade    → nome da cidade que o usuário digitou
    // count=1        → queremos só o 1º resultado
    // language=pt    → nomes em português quando possível
    // format=json    → resposta no formato JSON

    const respostaGeo = await fetch(urlGeo);
    const dadosGeo    = await respostaGeo.json();

    // Verifica se a API encontrou resultados
    // Optional chaining (?.) evita erro se 'results' não existir
    if (!dadosGeo.results?.length) {
      mostrarErro();
      return;
    }

    // Pega o primeiro resultado (cidade mais relevante)
    const lugar = dadosGeo.results[0];

    // Desestruturação: extrai latitude, longitude, nome e país do objeto
    const { latitude, longitude, name, country_code } = lugar;


    // ---- ETAPA 2: CLIMA ----
    // Monta a URL com as coordenadas encontradas na etapa 1
    const urlClima = `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,visibility&wind_speed_unit=kmh&timezone=auto`;
    // current=...          → quais dados queremos agora (temperatura, umidade, etc.)
    // temperature_2m       → temperatura a 2 metros do solo (padrão meteorológico)
    // apparent_temperature → sensação térmica
    // relative_humidity_2m → umidade relativa do ar
    // weather_code         → código numérico que representa o tipo de clima
    // wind_speed_10m       → velocidade do vento a 10m de altura
    // visibility           → visibilidade em metros
    // wind_speed_unit=kmh  → vento em km/h (padrão é m/s)
    // timezone=auto        → detecta o fuso horário automaticamente

    const respostaClima = await fetch(urlClima);
    const dadosClima    = await respostaClima.json();

    // Passa todos os dados para a função que preenche a tela
    exibirDados(dadosClima.current, name, country_code);

  } catch (erro) {
    console.error("Erro na requisição:", erro);
    mostrarErro();
  }
}


// ========== FUNÇÃO: INTERPRETAR O CÓDIGO DO CLIMA ==========
// A Open-Meteo retorna um número (weather_code) para cada tipo de clima.
// Esta função converte esse número em descrição e emoji legíveis.

function interpretarClima(codigo) {

  // Objeto: estrutura de dados com pares chave: valor
  // Aqui mapeamos cada código para { descrição, emoji }
  const codigos = {
    0:  { descricao: "Céu limpo",              emoji: "☀️"  },
    1:  { descricao: "Predominantemente limpo", emoji: "🌤️" },
    2:  { descricao: "Parcialmente nublado",    emoji: "⛅"  },
    3:  { descricao: "Nublado",                 emoji: "☁️"  },
    45: { descricao: "Neblina",                 emoji: "🌫️" },
    48: { descricao: "Neblina com geada",       emoji: "🌫️" },
    51: { descricao: "Garoa leve",              emoji: "🌦️" },
    53: { descricao: "Garoa moderada",          emoji: "🌦️" },
    55: { descricao: "Garoa intensa",           emoji: "🌧️" },
    61: { descricao: "Chuva leve",              emoji: "🌧️" },
    63: { descricao: "Chuva moderada",          emoji: "🌧️" },
    65: { descricao: "Chuva forte",             emoji: "🌧️" },
    71: { descricao: "Neve leve",               emoji: "🌨️" },
    73: { descricao: "Neve moderada",           emoji: "❄️"  },
    75: { descricao: "Neve intensa",            emoji: "❄️"  },
    80: { descricao: "Pancadas de chuva",       emoji: "🌦️" },
    81: { descricao: "Chuva com trovoada",      emoji: "⛈️"  },
    95: { descricao: "Trovoada",                emoji: "⛈️"  },
    99: { descricao: "Trovoada com granizo",    emoji: "⛈️"  },
  };

  // Retorna o código correspondente, ou um padrão se não encontrar
  return codigos[codigo] || { descricao: "Tempo variado", emoji: "🌡️" };
}


// ========== FUNÇÃO: EXIBIR OS DADOS NA TELA ==========
function exibirDados(clima, nomeCidade, pais) {

  // Pega o objeto com descrição e emoji baseado no código do clima
  const tipoClima = interpretarClima(clima.weather_code);

  // Preenche nome da cidade e país
  document.getElementById("cidade-nome").textContent = nomeCidade;
  document.getElementById("cidade-pais").textContent = pais;

  // Temperatura: Math.round() arredonda para inteiro
  document.getElementById("temperatura").textContent = `${Math.round(clima.temperature_2m)}°C`;
  document.getElementById("sensacao").textContent    = `${Math.round(clima.apparent_temperature)}°C`;

  // Descrição do clima (texto interpretado do weather_code)
  document.getElementById("descricao").textContent = tipoClima.descricao;

  // Ícone: usamos o emoji diretamente (sem precisar de imagem da API)
  const icone = document.getElementById("clima-icone");
  icone.style.display = "none"; // esconde a tag <img> que não vamos usar

  // Cria um elemento de texto para o emoji no lugar da imagem
  // Verifica se já existe para não duplicar
  let emojiEl = document.getElementById("clima-emoji");
  if (!emojiEl) {
    emojiEl = document.createElement("span"); // cria um novo elemento <span>
    emojiEl.id = "clima-emoji";
    emojiEl.style.fontSize = "5rem";          // tamanho grande do emoji
    icone.parentNode.insertBefore(emojiEl, icone); // insere antes da <img>
  }
  emojiEl.textContent = tipoClima.emoji;

  // Umidade, vento e visibilidade
  document.getElementById("umidade").textContent     = `${clima.relative_humidity_2m}%`;
  document.getElementById("vento").textContent       = `${clima.wind_speed_10m} km/h`;

  // Visibilidade: API retorna em metros, convertemos para km
  const visKm = (clima.visibility / 1000).toFixed(1);
  document.getElementById("visibilidade").textContent = `${visKm} km`;

  mostrarResultado();
  inputCidade.value = ""; // limpa o campo de busca
}


// ========== FUNÇÕES AUXILIARES ==========
function mostrarResultado()  { resultado.style.display = "block"; }
function esconderResultado() { resultado.style.display = "none";  }
function mostrarErro()       { erroMsg.style.display   = "block"; }
function esconderErro()      { erroMsg.style.display   = "none";  }


// ========== INICIALIZAÇÃO ==========
inputCidade.focus(); // foco automático no input ao abrir a página
