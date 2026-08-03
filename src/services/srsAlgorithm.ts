import { SRSRecord, Rating } from '../types';

const INITIAL_EASE = 250;
const MIN_EASE = 130;
const LEARNING_STEPS_MINUTES = [1, 10]; // 1 min, 10 min

export interface SRSNextState {
  record: SRSRecord;
  intervalLabel: string;
}

export function createInitialSRSRecord(cardId: string, instanceId: string): SRSRecord {
  return {
    cardId,
    instanceId,
    phase: 'new',
    due: Date.now(),
    interval: 0,
    easeFactor: INITIAL_EASE,
    repetitions: 0,
    lapses: 0,
    stepIndex: 0,
    lastReviewed: 0,
  };
}

export function formatInterval(days: number): string {
  if (days < 1 / (24 * 60)) {
    return '<1m';
  }
  const minutes = Math.round(days * 24 * 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const roundDays = Math.round(days);
  if (roundDays < 30) {
    return `${roundDays}d`;
  }
  const months = Math.round(roundDays / 30);
  if (months < 12) {
    return `${months}mo`;
  }
  const years = (roundDays / 365).toFixed(1);
  return `${years}y`;
}

export function calculateNextSRS(record: SRSRecord, rating: Rating): SRSNextState {
  const now = Date.now();
  let { phase, interval, easeFactor, repetitions, lapses, stepIndex } = record;
  let newPhase = phase;
  let newInterval = interval; // in days
  let newEase = easeFactor;
  let newStepIndex = stepIndex;
  let newLapses = lapses;
  let newRepetitions = repetitions;

  if (phase === 'new' || phase === 'learning') {
    if (rating === 1) { // Again
      newStepIndex = 0;
      newInterval = LEARNING_STEPS_MINUTES[0] / (24 * 60); // 1 min in days
      newPhase = 'learning';
    } else if (rating === 2) { // Hard
      newInterval = (LEARNING_STEPS_MINUTES[newStepIndex] || 5) / (24 * 60);
      newPhase = 'learning';
    } else if (rating === 3) { // Good
      if (newStepIndex < LEARNING_STEPS_MINUTES.length - 1) {
        newStepIndex++;
        newInterval = LEARNING_STEPS_MINUTES[newStepIndex] / (24 * 60);
        newPhase = 'learning';
      } else {
        // Graduate to Review
        newPhase = 'review';
        newInterval = 1; // 1 day
        newRepetitions = 1;
      }
    } else if (rating === 4) { // Easy
      // Immediate graduation with easy interval
      newPhase = 'review';
      newInterval = 4; // 4 days
      newRepetitions = 1;
    }
  } else if (phase === 'review') {
    newRepetitions++;
    if (rating === 1) { // Again (Lapse)
      newLapses++;
      newEase = Math.max(MIN_EASE, easeFactor - 20);
      newPhase = 'relearning';
      newStepIndex = 0;
      newInterval = LEARNING_STEPS_MINUTES[0] / (24 * 60);
    } else if (rating === 2) { // Hard
      newEase = Math.max(MIN_EASE, easeFactor - 15);
      newInterval = Math.max(1, interval * 1.2);
    } else if (rating === 3) { // Good
      newInterval = Math.max(1, interval * (newEase / 100));
    } else if (rating === 4) { // Easy
      newEase = easeFactor + 15;
      newInterval = Math.max(1, interval * (newEase / 100) * 1.3);
    }
  } else if (phase === 'relearning') {
    if (rating === 1) {
      newStepIndex = 0;
      newInterval = LEARNING_STEPS_MINUTES[0] / (24 * 60);
    } else if (rating === 3 || rating === 4) {
      newPhase = 'review';
      newInterval = Math.max(1, interval * 1.5);
    }
  }

  const nextDue = now + Math.round(newInterval * 24 * 60 * 60 * 1000);

  const updatedRecord: SRSRecord = {
    ...record,
    phase: newPhase,
    due: nextDue,
    interval: newInterval,
    easeFactor: newEase,
    repetitions: newRepetitions,
    lapses: newLapses,
    stepIndex: newStepIndex,
    lastReviewed: now,
  };

  return {
    record: updatedRecord,
    intervalLabel: formatInterval(newInterval),
  };
}

export function getPreviewIntervals(record: SRSRecord): Record<Rating, string> {
  return {
    1: calculateNextSRS(record, 1).intervalLabel,
    2: calculateNextSRS(record, 2).intervalLabel,
    3: calculateNextSRS(record, 3).intervalLabel,
    4: calculateNextSRS(record, 4).intervalLabel,
  };
}
