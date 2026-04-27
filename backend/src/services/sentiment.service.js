// Diccionario de frases (multi-palabra) — se comprueban antes que las palabras individuales
// Scores: negativo fuerte -5 a -3, negativo leve -2 a -1, positivo leve +1 a +2, positivo fuerte +3 a +5
const PHRASES = {
  // Desesperación / urgencia extrema
  "llevo dias esperando": -5,
  "llevo semanas esperando": -5,
  "llevo horas esperando": -5,
  "llevo dias sin respuesta": -5,
  "llevo semanas sin respuesta": -5,
  "nadie me hace caso": -5,
  "nadie me responde": -5,
  "me tienen abandonado": -5,
  "me tienen tirado": -5,
  "estoy hasta las narices": -5,
  "estoy hasta los huevos": -5,
  "me tiene hasta las narices": -5,
  "ya no aguanto mas": -5,
  "no puedo mas": -5,
  "esto es insoportable": -5,
  "esto es intolerable": -5,
  "voy a denunciar": -5,
  "voy a poner una queja": -5,
  "voy a ponerme en contacto con el defensor": -5,

  // Enfado directo
  "estoy muy enfadado": -4,
  "estoy muy enojado": -4,
  "estoy muy cabreado": -4,
  "estoy muy molesto": -4,
  "estoy harto": -4,
  "estoy hasta arriba": -4,
  "estoy desesperado": -4,
  "estoy indignado": -4,
  "me tienen loco": -4,
  "me tiene harto": -4,
  "me tienen harto": -4,
  "que rabia": -4,
  "que asco": -4,
  "qué rabia": -4,
  "qué asco": -4,
  "me parece fatal": -4,
  "me parece una verguenza": -4,
  "me parece una vergüenza": -4,
  "sois un desastre": -4,
  "son un desastre": -4,
  "esto es un desastre": -4,
  "esto es una verguenza": -4,
  "esto es una vergüenza": -4,
  "muy mala experiencia": -4,
  "pesima atencion": -4,
  "pésima atención": -4,
  "pesimo servicio": -4,
  "pésimo servicio": -4,
  "no funciona nada": -4,
  "nada funciona": -4,
  "basta ya": -4,
  "no me ayudais": -4,
  "no me ayudáis": -4,
  "no me han resuelto": -4,
  "sin solucion": -4,
  "sin solución": -4,
  "lleváis mucho tiempo": -4,
  "llevais mucho tiempo": -4,

  // Frustración / impaciencia
  "qué lentos": -3,
  "que lentos": -3,
  "que lentitud": -3,
  "qué lentitud": -3,
  "cuanto tardais": -3,
  "cuánto tardáis": -3,
  "cuando me vais a": -3,
  "cuando me van a": -3,
  "sigo esperando": -3,
  "llevo esperando": -3,
  "todavia esperando": -3,
  "todavía esperando": -3,
  "madre mia": -3,
  "madre mía": -3,
  "por dios": -3,
  "dios mio": -3,
  "dios mío": -3,
  "no me lo puedo creer": -3,
  "no puedo creerme": -3,
  "esto no puede ser": -3,
  "es increible": -3,
  "es increíble": -3,
  "muy mal": -3,
  "que mal": -3,
  "qué mal": -3,
  "muy malo": -3,
  "muy mala": -3,
  "tardais mucho": -3,
  "tardáis mucho": -3,
  "por favor ya": -3,
  "a ver si podeis": -3,
  "a ver si podéis": -3,
  "no entiendo nada": -3,
  "no me aclarais": -3,
  "no me aclaráis": -3,
  "no hay derecho": -3,
  "esto no es normal": -3,
  "no es normal": -3,
  "fatal todo": -3,
  "todo fatal": -3,

  // Decepción leve
  "un poco decepcionado": -2,
  "algo decepcionado": -2,
  "bastante molesto": -2,
  "no estoy contento": -2,
  "no estoy satisfecho": -2,
  "podria ser mejor": -2,
  "podría ser mejor": -2,
  "deja que desear": -2,
  "deja bastante que desear": -3,
  "esperaba mas": -2,
  "esperaba más": -2,

  // Positivo fuerte
  "muchas gracias": 4,
  "muchísimas gracias": 5,
  "muy amable": 4,
  "muy buena atencion": 4,
  "muy buena atención": 4,
  "excelente servicio": 5,
  "excelente atencion": 5,
  "excelente atención": 5,
  "perfecto gracias": 4,
  "genial gracias": 4,
  "muy rapido": 3,
  "muy rápido": 3,
  "super rapido": 4,
  "súper rápido": 4,
  "muy eficiente": 4,
  "muy profesional": 4,
  "encantado con": 3,
  "muy contento": 3,
  "muy satisfecho": 4,
  "todo perfecto": 4,
  "todo genial": 4,
  "ha sido un placer": 4,
  "os recomiendo": 4,
  "lo recomiendo": 4,

  // Positivo moderado
  "gracias por todo": 3,
  "gracias de verdad": 3,
  "muy bien": 3,
  "muy bueno": 3,
  "muy buena": 3,
  "bien resuelto": 3,
  "solucionado rapido": 3,
  "solucionado rápido": 3,
};

// Diccionario de palabras individuales
const WORDS = {
  // Enfado intenso
  furioso: -5,
  furiosa: -5,
  iracundo: -5,
  iracunda: -5,
  indignadisimo: -5,
  indignada: -4,
  indignado: -4,
  cabreado: -4,
  cabreada: -4,
  harto: -4,
  harta: -4,
  desesperado: -4,
  desesperada: -4,
  desesperacion: -4,
  desesperación: -4,
  enfurecido: -4,
  enfurecida: -4,
  intolerante: -3,

  // Insatisfacción fuerte
  inaceptable: -5,
  intolerable: -5,
  vergonzoso: -4,
  vergonzosa: -4,
  verguenza: -4,
  vergüenza: -4,
  desastre: -4,
  catastrofe: -5,
  catástrofe: -5,
  incompetentes: -4,
  incompetente: -4,
  inutiles: -4,
  inútiles: -4,
  inutil: -4,
  inútil: -4,
  lamentable: -4,
  nefasto: -5,
  nefasta: -5,
  pesimo: -5,
  pésimo: -5,
  pesima: -5,
  pésima: -5,
  horrible: -4,
  terrible: -4,
  malísimo: -5,
  malisimo: -5,
  deplorable: -5,

  // Insatisfacción moderada
  enfadado: -3,
  enfadada: -3,
  enojado: -3,
  enojada: -3,
  molesto: -3,
  molesta: -3,
  irritado: -3,
  irritada: -3,
  frustrado: -3,
  frustrada: -3,
  frustracion: -3,
  frustración: -3,
  decepcionado: -3,
  decepcionada: -3,
  decepcion: -3,
  decepción: -3,
  impaciente: -2,
  impotente: -3,
  resignado: -2,
  resignada: -2,
  absurdo: -3,
  absurda: -3,
  ridiculo: -3,
  ridículo: -3,
  ridicula: -3,
  ridícula: -3,
  injusto: -3,
  injusta: -3,
  injusticia: -4,
  fatal: -4,
  ineficiente: -3,
  ineficaz: -3,

  // Quejas / problemas
  problema: -1,
  problemas: -2,
  error: -2,
  errores: -2,
  fallo: -2,
  fallos: -2,
  queja: -2,
  quejas: -2,
  reclamo: -2,
  reclamos: -2,
  reclamacion: -3,
  reclamación: -3,
  incidencia: -2,
  averia: -2,
  avería: -2,
  rotura: -2,
  danado: -2,
  dañado: -2,
  danada: -2,
  dañada: -2,
  roto: -2,
  rota: -2,
  perdido: -2,
  perdida: -2,

  // Espera / lentitud
  tardando: -2,
  esperando: -2,
  espera: -1,
  retraso: -2,
  retrasos: -2,
  tardais: -2,
  tardáis: -2,
  tarde: -2,
  lento: -2,
  lenta: -2,
  lentos: -2,
  lentas: -2,
  lentitud: -3,

  // Positivo fuerte
  excelente: 4,
  perfecto: 3,
  perfecta: 3,
  maravilloso: 4,
  maravillosa: 4,
  fantastico: 4,
  fantástico: 4,
  fantastica: 4,
  fantástica: 4,
  fenomenal: 4,
  estupendo: 3,
  estupenda: 3,
  increible: 3, // en contexto positivo
  increíble: 3,
  genial: 3,
  espectacular: 4,

  // Positivo moderado
  gracias: 2,
  agradecido: 3,
  agradecida: 3,
  contento: 3,
  contenta: 3,
  satisfecho: 3,
  satisfecha: 3,
  feliz: 3,
  alegre: 2,
  encantado: 3,
  encantada: 3,
  amable: 3,
  rapido: 2,
  rápido: 2,
  eficiente: 3,
  eficaz: 3,
  profesional: 2,
  resuelto: 2,
  solucionado: 3,
  funciona: 1,
  bien: 1,
  correcto: 1,
  correcta: 1,
  ok: 1,
};

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .replace(/[^a-z0-9\s]/g, " ")    // reemplaza puntuación por espacio
    .replace(/\s+/g, " ")
    .trim();
}

function analyzeSentiment(text) {
  if (!text || typeof text !== "string") return { score: 0, label: "neutral" };

  const normalized = normalize(text);
  let score = 0;
  const matched = [];

  // 1. Buscar frases (multi-palabra) — ordenadas por longitud descendente para match más largo primero
  const sortedPhrases = Object.entries(PHRASES).sort((a, b) => b[0].length - a[0].length);
  for (const [phrase, phraseScore] of sortedPhrases) {
    const normalizedPhrase = normalize(phrase);
    if (normalized.includes(normalizedPhrase)) {
      score += phraseScore;
      matched.push({ phrase, score: phraseScore });
    }
  }

  // 2. Buscar palabras individuales en los tokens del texto
  const tokens = normalized.split(" ");
  for (const token of tokens) {
    if (token && WORDS[token] !== undefined) {
      score += WORDS[token];
      matched.push({ word: token, score: WORDS[token] });
    }
  }

  const label =
    score <= -5 ? "angry" :
    score < -1  ? "negative" :
    score <= 1  ? "neutral" :
    "positive";

  return { score, label, matched };
}

module.exports = { analyzeSentiment };
