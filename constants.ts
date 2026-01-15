
import { Question } from './types';
import { RAW_SPS } from './questionsSPS';
import { RAW_STT } from './questionsSTT';

const IMAGE_KEYWORDS = ["obrázku", "náčrtu", "vidíš", "schéma", "diagram", "pozice", "kóta"];

// Seznam ID otázek pro SPS, které NEMAJÍ mít obrázek, i když obsahují klíčové slovo
const SPS_EXCLUDED_IMAGES = [211];

const parseQuestions = (raw: any[], subject: 'SPS' | 'STT'): Question[] => {
  return raw.map(item => {
    const [id, text, options, correct] = item;
    
    // 1. Základní kontrola klíčových slov
    let hasImage = IMAGE_KEYWORDS.some(k => text.toLowerCase().includes(k));

    // 2. Vynucení obrázků pro STT v rozsahu 91-174
    // Tyto otázky často neobsahují slovo "obrázek", ale ptají se "O jakou technologii se jedná?" a vyžadují obrázek.
    if (subject === 'STT' && id >= 91 && id <= 174) {
        hasImage = true;
    }

    // 3. Výjimky pro SPS (otázky, které obrázek mít nemají)
    if (subject === 'SPS' && SPS_EXCLUDED_IMAGES.includes(id)) {
        hasImage = false;
    }
    
    // Vše převádíme na malá písmena.
    // Očekáváme strukturu: /images/sps/q1.png
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
