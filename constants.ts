
import { Question, Category } from './types';
import { RAW_SPS } from './questionsSPS';
import { RAW_STT } from './questionsSTT';

const SPS_IMAGE_IDS: (number | [number, number])[] = [
  [16, 20], [36, 40], [56, 60], [76, 80], [96, 100],
  [116, 120], [136, 140], [156, 160], [176, 180],
  [216, 220], [236, 240], [256, 260], [276, 280], [296, 300],
  [316, 320], [336, 340], [356, 360], [376, 380], [396, 400],
  [416, 420], [436, 440], [456, 460], [476, 480], [496, 500]
];

const STT_IMAGE_IDS: (number | [number, number])[] = [
  [91, 174], 186, 235, [241, 246], [247, 263], [265, 273],
  [283, 289], 293, [295, 298], [302, 303], [305, 308], [375, 377], 
  [380, 381], 384, 390, 393, 396, 401, [404, 406], [409, 413], 
  [420, 425], [426, 429], 432, 433, [438, 450], 452, 453, 
  [456, 463], 467, [472, 474], [475, 479], [483, 485], [489, 492], 
  [496, 497], 499, 500, 505, [511, 513], [516, 522], [524, 529], 
  [676, 677], 679, [680, 681], [685, 686], 688, 689
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
    const [id, text, options, correct, acceptable] = item;
    const hasImage = checkHasImage(id, imageConfig);
    const imagePath = hasImage ? `/images/${subject.toLowerCase()}/q${id}.png` : undefined;
    return { id, text, options, correctAnswerIndex: correct, acceptableAnswerIndex: acceptable, imageUrl: imagePath };
  });
};

export const QUESTIONS_SPS: Question[] = parseQuestions(RAW_SPS, 'SPS');
export const QUESTIONS_STT: Question[] = parseQuestions(RAW_STT, 'STT');
export const QUESTIONS_SPS_FILTERED: Question[] = QUESTIONS_SPS.filter(q => q.id !== 253 && q.id !== 254);

export const CATEGORIES_SPS: Category[] = [
  { id: 'sps_1', name: 'Spoje a spojovací součásti', subject: 'SPS', questionRanges: [[1, 120]] },
  { id: 'sps_2', name: 'Hřídele, ložiska a převody', subject: 'SPS', questionRanges: [[121, 200]] },
  { id: 'sps_3', name: 'Hydraulika a pneumatika', subject: 'SPS', questionRanges: [[201, 220]] },
  { id: 'sps_4', name: 'Dopravní a zdvihací stroje', subject: 'SPS', questionRanges: [[221, 300]] },
  { id: 'sps_5', name: 'Pístové a lopatkové stroje', subject: 'SPS', questionRanges: [[301, 440]] },
  { id: 'sps_6', name: 'Energetika a vytápění', subject: 'SPS', questionRanges: [[441, 500]] },
];

export const CATEGORIES_STT: Category[] = [
  { id: 'stt_1', name: 'Obrábění a řezné nástroje', subject: 'STT', questionRanges: [[1, 174], [236, 250], [687, 687]] },
  { id: 'stt_2', name: 'Materiály a krystalizace', subject: 'STT', questionRanges: [[175, 221], [309, 330], [519, 538], [674, 683]] },
  { id: 'stt_3', name: 'Tepelné zpracování', subject: 'STT', questionRanges: [[186, 186], [222, 235], [331, 371], [576, 583], [688, 688]] },
  { id: 'stt_4', name: 'Svařování a pájení', subject: 'STT', questionRanges: [[293, 295], [539, 575], [671, 671]] },
  { id: 'stt_5', name: 'Tváření (stříhání, ohýbání)', subject: 'STT', questionRanges: [[296, 303], [629, 670], [685, 686]] },
  { id: 'stt_6', name: 'Speciální metody (Laser, EDM, ECM)', subject: 'STT', questionRanges: [[277, 292], [464, 518]] },
  { id: 'stt_7', name: 'Ostatní (Plasty, Koroze, NDT)', subject: 'STT', questionRanges: [[275, 276], [280, 281], [304, 308], [372, 393], [394, 433], [689, 693]] },
];

export const getCategoryForQuestion = (qId: number, subject: 'SPS' | 'STT'): Category | undefined => {
  const cats = subject === 'SPS' ? CATEGORIES_SPS : CATEGORIES_STT;
  return cats.find(cat => cat.questionRanges.some(range => qId >= range[0] && qId <= range[1]));
};
