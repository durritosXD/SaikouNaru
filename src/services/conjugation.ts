import { ConjugationFormKey, ConjugationForms } from '../types';

export const CONJUGATION_LABELS: Record<ConjugationFormKey, { label: string; jp: string; desc: string }> = {
  root: { label: 'Root Form', jp: '辞書形', desc: 'Dictionary / Plain Present' },
  short: { label: 'Shortform', jp: '普通形', desc: 'Plain Form' },
  pastPos: { label: 'Past +ve', jp: '過去肯定', desc: 'Past Positive (~た / ~ました)' },
  pastNeg: { label: 'Past -ve', jp: '過去否定', desc: 'Past Negative (~なかった)' },
  teForm: { label: 'Te form', jp: 'て形', desc: 'Conjunctive / Sequential (~て)' },
  taiForm: { label: 'Tai form', jp: 'たい形', desc: 'Desire / Want form (~たい)' },
};

/**
 * Returns the conjugated text & reading for a given card conjugation mapping and key.
 */
export function getFormValue(
  conjugations: ConjugationForms | undefined,
  fallbackText: string,
  fallbackReading: string,
  key: ConjugationFormKey
): { text: string; reading?: string } {
  if (!conjugations) {
    return { text: fallbackText, reading: fallbackReading };
  }

  switch (key) {
    case 'root':
      return {
        text: conjugations.root || fallbackText,
        reading: conjugations.rootReading || fallbackReading,
      };
    case 'short':
      return {
        text: conjugations.short || fallbackText,
        reading: conjugations.shortReading || fallbackReading,
      };
    case 'pastPos':
      return {
        text: conjugations.pastPos || fallbackText + 'た',
        reading: conjugations.pastPosReading || fallbackReading + 'た',
      };
    case 'pastNeg':
      return {
        text: conjugations.pastNeg || fallbackText + 'なかった',
        reading: conjugations.pastNegReading || fallbackReading + 'なかった',
      };
    case 'teForm':
      return {
        text: conjugations.teForm || fallbackText + 'て',
        reading: conjugations.teFormReading || fallbackReading + 'て',
      };
    case 'taiForm':
      return {
        text: conjugations.taiForm || fallbackText + 'たい',
        reading: conjugations.taiFormReading || fallbackReading + 'たい',
      };
    default:
      return { text: fallbackText, reading: fallbackReading };
  }
}
