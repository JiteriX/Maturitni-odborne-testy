
import { Question } from './types';
import { RAW_SPS } from './questionsSPS';
import { RAW_STT } from './questionsSTT';

// Definice rozsahů a konkrétních ID pro SPS
const SPS_IMAGE_IDS: (number | [number, number])[] = [
  [16, 20], [36, 40], [56, 60], [76, 80], [96, 100],
  [116, 120], [136, 140], [156, 160], [176, 180],
  [216, 220], [236, 240], [256, 260], [276, 280], [296, 300],
  [316, 320], [336, 340], [356, 360], [376, 380], [396, 400],
  [416, 420], [436, 440], [456, 460], [476, 480], [496, 500]
];

// Definice rozsahů a konkrétních ID pro STT - PLNÝ SEZNAM
// Pokud soubor chybí, aplikace zobrazí "Obrázek se nenačetl", což slouží jako kontrola.
const STT_IMAGE_IDS: (number | [number, number])[] = [
  [91, 174], 
  186, 
  235, 
  241, 242, 244,
  [247, 263], // Rozšířeno o 247-263
  265, 266, 267, 268, 269, 270, 271, 272, 273, // Rozšířeno o 268, 273
  [283, 289], 
  293, 
  [295, 298], 
  [302, 303], [305, 308], 
  [375, 377], 
  [380, 381], 
  384, 
  390, 
  393, 
  396, 
  401, 
  [404, 406], 
  [409, 413], // Přidáno 409-413
  [420, 425], // Zahrnuje 424
  [426, 429], // Přidáno 426, 427, 429
  [432, 433], // Přidáno 433
  [438, 450], // Zahrnuje 438, 441, 448-450
  [452, 453], // Zahrnuje 453
  [456, 463], // Zahrnuje 456-463
  472, 473, 474, // Přidáno 473, 474 (467 odstraněno)
  [475, 479], // Zahrnuje 478, 479
  483, 484, 485, // Přidáno 484
  [489, 492], // Přidáno 489
  496, 497, 
  499, 500, 
  505, 
  511, 512, 513, // Přidáno 512
  [516, 522], // Zahrnuje 519, 520, 521, 522
  [524, 529], // Zahrnuje 525, 527, 529
  676, 677, // Přidáno 677
  679, 680, 681, // Přidáno 680, 681
  [685, 686], 
  688, 689 // Přidáno 689
];

const checkHasImage = (id: number, config: (number | [number, number])[]): boolean => {
  return config.some(item => {
    if (Array.isArray(item)) {
      return id >= item[0] && id <= item[1];
    }
    return id === item;
  });
};

const parseQuestions = (raw: any[], subject: 'SPS' | 'STT'): Question[] => {
  const imageConfig = subject === 'SPS' ? SPS_IMAGE_IDS : STT_IMAGE_IDS;
  
  return raw.map(item => {
    const [id, text, options, correct] = item;
    
    const hasImage = checkHasImage(id, imageConfig);
    
    const imagePath = hasImage 
        ? `/images/${subject.toLowerCase()}/q${id}.png` 
        : undefined;

    return {
      id,
      text,
      options,
      correctAnswerIndex: correct,
      imageUrl: imagePath
    };
  });
};

export const QUESTIONS_SPS: Question[] = parseQuestions(RAW_SPS, 'SPS');
export const QUESTIONS_STT: Question[] = parseQuestions(RAW_STT, 'STT');
