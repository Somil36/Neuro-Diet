// Screen-time guidance grounded in published research rather than guesses.
// Key sources behind the thresholds/figures used below:
// - "Excessive" screen time defined as >8h/day smartphone, >6h tablet, >5h
//   computer (Frontiers in Psychiatry, 2025 - Southern University student study).
// - High daily screen time teens: depression symptoms 25.9% vs 9.5%, anxiety
//   27.1% vs 12.3%, versus lower-use peers (CDC, Preventing Chronic Disease, 2025).
// - Average sustained attention on one screen has fallen to ~47 seconds (from
//   ~2.5 minutes two decades ago), and a single interruption costs ~23 minutes
//   to fully recover deep focus - Gloria Mark (UC Irvine) attention research.
// - Evening screen/blue-light exposure suppresses melatonin and delays sleep
//   onset (Frontiers in Neurology meta-analysis, 2025; Sleep Advances, Oxford).
import type { ScreenTimeLevel } from '../store/useAppStore';

const HOURS_ESTIMATE: Record<ScreenTimeLevel, number> = {
  'Under 2h': 1.5,
  '2-4h': 3,
  '4-6h': 5,
  '6-8h': 7,
  '8h+': 9,
};

export interface ScreenTimeInsight {
  severity: 'good' | 'moderate' | 'high';
  headline: string;
  message: string;
  source: string;
}

export function getScreenTimeInsight(level: ScreenTimeLevel, cognitiveGoal: string): ScreenTimeInsight {
  const hours = HOURS_ESTIMATE[level];

  if (level === 'Under 2h') {
    return {
      severity: 'good',
      headline: 'Your screen time is in a healthy range',
      message: 'Lower daily screen time is consistently linked to better mood and sleep quality in the research below. Keep it up.',
      source: 'CDC, Preventing Chronic Disease (2025)',
    };
  }

  if (cognitiveGoal === 'Improve Sleep Quality') {
    return {
      severity: hours >= 6 ? 'high' : 'moderate',
      headline: `Try a screen-free hour before bed to support sleep`,
      message: 'Evening screen exposure suppresses melatonin and delays your body clock, directly extending how long it takes to fall asleep - one of the most consistent findings in sleep research.',
      source: 'Blue-light/melatonin meta-analyses, Frontiers in Neurology & Sleep Advances (2025)',
    };
  }

  if (hours >= 8) {
    return {
      severity: 'high',
      headline: 'Bring your screen time down by about 3 hours',
      message: `At ${level} a day you're in the range studies classify as excessive. High daily screen time is associated with depression symptoms in roughly 26% of teens/young adults vs 9.5% of lower-use peers, and anxiety in 27% vs 12%.`,
      source: 'CDC, Preventing Chronic Disease (2025); Frontiers in Psychiatry (2025)',
    };
  }

  if (hours >= 6) {
    return {
      severity: 'high',
      headline: 'Bring your screen time down by about 2 hours',
      message: "You're close to the range research associates with meaningfully higher anxiety and depression. Reclaiming even a couple of hours for movement, sleep, or offline time shows up reliably in the data.",
      source: 'Cross-sectional adolescent/young-adult screen time studies (PMC, 2025)',
    };
  }

  // 4-6h: moderate range, message tailored to the focus-relevant goals since
  // the attention-fragmentation research is most directly about them.
  const isFocusGoal = cognitiveGoal === 'Enhance Focus' || cognitiveGoal === 'Reduce Brain Fog';
  return {
    severity: 'moderate',
    headline: `Try trimming about 1 hour to support ${cognitiveGoal || 'your goal'}`,
    message: isFocusGoal
      ? "It's frequent checking and notifications - more than total screen time alone - that fragments attention. Tracked usage shows average focus on one screen has fallen to about 47 seconds, and a single interruption costs roughly 23 minutes to fully recover from."
      : "This is a moderate range, but small reductions still compound, especially in the evening.",
    source: isFocusGoal
      ? 'Gloria Mark (UC Irvine), attention-span & task-switching research'
      : 'Cross-sectional screen time & mental health studies (2024-2025)',
  };
}
