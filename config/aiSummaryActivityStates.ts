/**
 * AI summary activity states — Video Preview V2 (Figma 1412:11290).
 * https://www.figma.com/design/BwDIomHs1xh3cv2YV98lHs/Video-Preview-V2?node-id=1412-11290
 */

export type AiSummaryActivityStateId =
  | 'course-progress'
  | 'default'
  | 'stalled-lt-no-goal'
  | 'stalled-lt-goal'
  | 'streak-progress'
  | 'assessment-success'
  | 'module-complete';

export const AI_SUMMARY_DEFAULT_STATE: AiSummaryActivityStateId = 'course-progress';

export const AI_SUMMARY_LOADING_TITLE = 'Analyzing your progress';

/** ~3 lines at 12px / 18px lh in the Home card (~356px wide). */
export const AI_SUMMARY_BODY_MAX_CHARS = 148;

export interface AiSummaryActivityState {
  id: AiSummaryActivityStateId;
  /** Toolbar trigger label */
  label: string;
  title: string;
  /** null = loading-only header (Variant8) */
  getBody: (ctx: AiSummaryBodyContext) => string | null;
}

export interface AiSummaryBodyContext {
  courseProgressDescription: string;
  careerGoal?: string;
  moduleFocus?: string;
  moduleSkills?: string;
  assessmentScorePercent?: number | null;
}

const RAW_STATES: AiSummaryActivityState[] = [
  {
    id: 'course-progress',
    label: 'Course progress',
    title: "Welcome back! Here's today's focus:",
    getBody: (ctx) =>
      buildTodayPlanLine(ctx, 'Complete your daily goal to keep your streak.'),
  },
  {
    id: 'default',
    label: 'Welcome (new learner)',
    title: 'Welcome to the course!',
    getBody: (ctx) =>
      buildTodayPlanLine(ctx, 'Applied learning items are ready when you begin.'),
  },
  {
    id: 'stalled-lt-no-goal',
    label: 'Stalled LT — no goal',
    title: 'By continuing, you will learn:',
    getBody: () =>
      'Pick up core analytical skills in your next session. Earn 12XP by finishing your daily goal.',
  },
  {
    id: 'stalled-lt-goal',
    label: 'Stalled LT — goal',
    title: 'By continuing, you will learn:',
    getBody: (ctx) => {
      const role = ctx.careerGoal ?? 'Data Analyst';
      return `This course builds skills for your ${role} path. Continue now — your goal is one step away.`;
    },
  },
  {
    id: 'streak-progress',
    label: 'Streak progress',
    title: 'Great job on reaching your streak!',
    getBody: (ctx) =>
      buildTodayPlanLine(ctx, 'Keep the streak alive with your next learning items.'),
  },
  {
    id: 'assessment-success',
    label: 'Assessment success',
    title: 'Great work on your past assessment!',
    getBody: (ctx) => {
      const score = formatAssessmentScoreShort(ctx.assessmentScorePercent);
      const skills = formatSkillsShort(ctx.courseProgressDescription);
      return `${score} In just 5 minutes you'll cover ${skills} to build on what you know.`;
    },
  },
  {
    id: 'module-complete',
    label: 'Module complete',
    title: 'Whoa! You completed a module!',
    getBody: () =>
      'Module complete. Up next: data visualization and reporting. Keep going to strengthen those skills in your next module.',
  },
];

const STATE_BY_ID = Object.fromEntries(
  RAW_STATES.map((s) => [s.id, s])
) as Record<AiSummaryActivityStateId, AiSummaryActivityState>;

export const AI_SUMMARY_ACTIVITY_STATES: AiSummaryActivityState[] = RAW_STATES.map((state) => ({
  ...state,
  getBody: (ctx) => {
    const raw = state.getBody(ctx);
    return raw == null ? null : clampAiSummaryBody(raw);
  },
}));

export function getAiSummaryState(id: AiSummaryActivityStateId): AiSummaryActivityState {
  return AI_SUMMARY_ACTIVITY_STATES.find((s) => s.id === id) ?? AI_SUMMARY_ACTIVITY_STATES[0];
}

export function parseAiSummaryActivityState(raw: string | null): AiSummaryActivityStateId {
  if (raw && raw in STATE_BY_ID) return raw as AiSummaryActivityStateId;
  return AI_SUMMARY_DEFAULT_STATE;
}

export function clampAiSummaryBody(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= AI_SUMMARY_BODY_MAX_CHARS) return normalized;
  return `${normalized.slice(0, AI_SUMMARY_BODY_MAX_CHARS - 1).trimEnd()}…`;
}

function buildTodayPlanLine(ctx: AiSummaryBodyContext, closing: string): string {
  const skills = formatSkillsShort(ctx.courseProgressDescription);
  return `In just 5 minutes you'll cover ${skills}. ${closing}`;
}

function extractSkillPhrase(courseProgressDescription: string): string {
  const match = courseProgressDescription.match(/Today you'll explore ([^.]+)/i);
  return match?.[1]?.trim() ?? 'data analysis and visualization';
}

/** At most two skill topics so the body stays within three lines. */
function formatSkillsShort(courseProgressDescription: string): string {
  const phrase = extractSkillPhrase(courseProgressDescription);
  const parts = phrase.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return 'data analysis';
  if (parts.length === 1) return shortenPhrase(parts[0], 36);
  return `${shortenPhrase(parts[0], 18)} and ${shortenPhrase(parts[1], 18)}`;
}

function formatAssessmentScoreShort(scorePercent: number | null | undefined): string {
  if (scorePercent == null) return 'Strong work on your skills assessment.';
  if (scorePercent >= 90) return `You scored ${scorePercent}% — excellent work.`;
  if (scorePercent >= 70) return `You scored ${scorePercent}% — great work.`;
  return `You scored ${scorePercent}% — solid progress.`;
}

function shortenPhrase(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen - 1).trimEnd();
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > maxLen * 0.5 ? `${cut.slice(0, lastSpace)}…` : `${cut}…`;
}

/** Average sub-skill assessment points (each 0–100) for AI summary copy. */
export function averageAssessmentScorePercent(
  results: Record<string, number> | null | undefined
): number | null {
  if (!results) return null;
  const values = Object.values(results);
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}
