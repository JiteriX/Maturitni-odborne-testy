
import { Question } from './types';
import { RAW_SPS } from './questionsSPS';
import { RAW_STT } from './questionsSTT';

const IMAGE_KEYWORDS = ["obrázku", "náčrtu", "vidíš", "schéma", "diagram", "pozice", "kóta"];

// Seznam ID otázek pro SPS, které NEMAJÍ mít obrázek, i když obsahují klíčové slovo
const SPS_EXCLUDED_IMAGES = [211];

const parseQuestions = (raw: any[], subject: 'SPS' | 'STT'): Question[] => {
  return raw.map(item => {
    const [id, text, options, correct] = item;
    
    // Zjistíme, zda text obsahuje klíčové slovo pro obrázek
    let hasImage = IMAGE_KEYWORDS.some(k => text.toLowerCase().includes(k));

    // Výjimka pro konkrétní otázky v SPS (např. 211 obsahuje slovo "schématech", ale nemá obrázek)
    if (subject === 'SPS' && SPS_EXCLUDED_IMAGES.includes(id)) {
        hasImage = false;
    }
    
    // ZDE JE KLÍČOVÁ ZMĚNA:
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
