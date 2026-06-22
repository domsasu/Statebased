
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { averageAssessmentScorePercent, type AiSummaryBodyContext } from '../config/aiSummaryActivityStates';
import { CourseData, Lesson, Status } from '../types';
import { courseCompletionDisplayPercent } from '../skills';
import { AiTodaySummaryCard, AI_SUMMARY_REVEAL_DELAY_MS } from './AiTodaySummaryCard';
import { LetterAvatar } from './WeeklyLearningLeaderboard';

interface MyLearningProps {
  onContinueCourse: () => void;
  activeLesson: Lesson;
  courseData: CourseData;
  totalSP: number;
  dailyGoalCompletions: number;
  onTakeSkillAssessment?: () => void;
  assessmentResults?: Record<string, number> | null;
}

type TabId = 'my-plan' | 'in-progress' | 'completed' | 'saved' | 'skills' | 'certificates';

const TABS: { id: TabId; label: string }[] = [
  { id: 'my-plan', label: 'My plan' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'saved', label: 'Saved' },
  { id: 'skills', label: 'Skills' },
  { id: 'certificates', label: 'Certificates' },
];

/* ------------------------------------------------------------------ */
/*  April 2026 calendar (Figma — My Learning)                         */
/* ------------------------------------------------------------------ */
const APRIL_2026_DAYS = 30;
/** April 1, 2026 is Wednesday; Monday-first grid → 2 leading blanks */
const APRIL_2026_LEADING_BLANKS_MON = 2;
const CAL_TODAY = 15;
const COMPLETED_DAYS = new Set([2, 3, 5, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 23]);
const ALL_GOALS_DAYS = new Set([3, 10, 11, 17, 18, 19]);

/* ------------------------------------------------------------------ */
/*  Left Sidebar                                                      */
/* ------------------------------------------------------------------ */

function TodaysGoals() {
  const items = [
    { icon: 'star', text: 'Complete any 3 learning items · 0/3' },
    { icon: 'menu_book', text: 'Complete a reading' },
    { icon: 'local_fire_department', text: 'Progress toward your weekly streak' },
  ];
  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-4">
      <h3 className="cds-action-secondary text-[var(--cds-color-grey-975)] mb-3">
        Today&apos;s goals
      </h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.text} className="flex items-start gap-2">
            <span className="material-symbols-rounded text-[var(--cds-color-blue-700)] shrink-0" style={{ fontSize: 20 }}>
              {item.icon}
            </span>
            <span className="cds-body-secondary text-[var(--cds-color-grey-700)]">
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LearningPlanCalendar() {
  const dayHeaderLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const blanks = Array.from({ length: APRIL_2026_LEADING_BLANKS_MON }, (_, i) => (
    <div key={`blank-${i}`} />
  ));

  const days = Array.from({ length: APRIL_2026_DAYS }, (_, i) => {
    const day = i + 1;
    const isToday = day === CAL_TODAY;
    const isAllGoals = ALL_GOALS_DAYS.has(day);
    const isCompleted = COMPLETED_DAYS.has(day);

    let cellClass =
      'flex h-9 w-9 items-center justify-center rounded-full cds-body-secondary transition-colors cursor-default';
    if (isToday) {
      cellClass += ' border-2 border-[var(--cds-color-emphasis-quaternary-bg-strong)] text-[var(--cds-color-emphasis-quaternary-bg-strong)]';
    } else if (isCompleted || isAllGoals) {
      cellClass += ' relative text-[var(--cds-color-grey-975)]';
    } else if (day > CAL_TODAY) {
      cellClass += ' text-[var(--cds-color-grey-400)]';
    } else {
      cellClass += ' text-[var(--cds-color-grey-975)]';
    }

    return (
      <div key={day} className="flex items-center justify-center">
        <div className={cellClass}>
          {day}
          {isCompleted && !isToday && (
            <span className={`absolute bottom-[5px] left-0 right-0 mx-auto rounded-full ${isAllGoals ? 'h-[2px] w-3 bg-[var(--cds-color-emphasis-quaternary-bg-strong)]' : 'h-[5px] w-[5px] bg-[var(--cds-color-emphasis-quaternary-bg-strong)]'}`} />
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-5">
      {/* Month header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="cds-subtitle-md text-[var(--cds-color-grey-975)]">April 2026</span>
        <div className="flex items-center gap-1">
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-600)]">
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>chevron_left</span>
          </button>
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--cds-color-grey-50)] text-[var(--cds-color-grey-600)]">
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center mb-1">
        {dayHeaderLabels.map((h) => (
          <div key={h} className="cds-body-tertiary text-[var(--cds-color-grey-600)] py-1.5">{h}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {blanks}
        {days}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 cds-body-tertiary text-[var(--cds-color-grey-600)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--cds-color-emphasis-quaternary-bg-strong)]" />
          1+ daily goals completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 rounded-full bg-[var(--cds-color-emphasis-quaternary-bg-strong)]" />
          All daily goals completed
        </span>
      </div>

      {/* Last 4 weeks */}
      <div className="mt-4 pt-4 border-t border-[var(--cds-color-grey-100)]">
        <p className="cds-subtitle-md text-[var(--cds-color-grey-600)] mb-3">Last 4 weeks</p>
        <div className="flex gap-6">
          <div>
            <p className="cds-title-xs text-[var(--cds-color-grey-975)]">0</p>
            <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Daily goals completed</p>
          </div>
          <div>
            <p className="cds-title-xs text-[var(--cds-color-grey-975)]">2</p>
            <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Items completed</p>
          </div>
          <div>
            <p className="cds-title-xs text-[var(--cds-color-grey-975)]">49</p>
            <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">Minutes learned</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cohort Selection                                                  */
/* ------------------------------------------------------------------ */

export type CohortId = 'enrolled' | 'ai' | 'workingparents';

export const COHORTS: { id: CohortId; label: string; members: number; summary: string }[] = [
  {
    id: 'workingparents',
    label: '#workingparents',
    members: 634,
    summary:
      'Parents fitting coursework around nap time, daycare, and school pickups—small daily blocks add up.',
  },
  {
    id: 'enrolled',
    label: '#coursera',
    members: 1255,
    summary: 'The broader Coursera learner community. Track how your cohort engages with courses over time.',
  },
  {
    id: 'ai',
    label: '#AIpowered',
    members: 842,
    summary: 'Focused on AI, ML, and data. Compare study habits and stay motivated with learners on a similar path.',
  },
];

export interface LeaderboardPeer {
  rank: number;
  letter: string;
  name: string;
  hours: string;
  isLive?: boolean;
}

export const COHORT_LEADERBOARD: Record<CohortId, { top3: LeaderboardPeer[]; around: LeaderboardPeer[]; userRank: number }> = {
  enrolled: {
    top3: [
      { rank: 1, letter: 'M', name: 'Maria Montessori', hours: '16h', isLive: true },
      { rank: 2, letter: 'J', name: 'John Dewey', hours: '15.5h' },
      { rank: 3, letter: 'P', name: 'Paulo Freire', hours: '15h' },
    ],
    around: [
      { rank: 14, letter: 'T', name: 'Thomas Gallaudet', hours: '9.5h' },
      { rank: 15, letter: 'P', name: 'Priya', hours: '9h' },
      { rank: 16, letter: 'A', name: 'Anton Makarenko', hours: '8.5h', isLive: true },
    ],
    userRank: 15,
  },
  ai: {
    top3: [
      { rank: 1, letter: 'A', name: 'Ada Lovelace', hours: '19h', isLive: true },
      { rank: 2, letter: 'A', name: 'Alan Turing', hours: '17.5h' },
      { rank: 3, letter: 'G', name: 'Geoffrey Hinton', hours: '17h' },
    ],
    around: [
      { rank: 5, letter: 'Y', name: 'Yann LeCun', hours: '16h' },
      { rank: 6, letter: 'P', name: 'Priya', hours: '15h' },
      { rank: 7, letter: 'A', name: 'Andrew Ng', hours: '15h' },
    ],
    userRank: 6,
  },
  workingparents: {
    top3: [
      { rank: 1, letter: 'M', name: 'Maya Chen', hours: '15h', isLive: true },
      { rank: 2, letter: 'R', name: 'Ravi Patel', hours: '14.5h' },
      { rank: 3, letter: 'S', name: 'Sam Okonkwo', hours: '14h' },
    ],
    around: [
      { rank: 17, letter: 'V', name: 'Vik Desai', hours: '7h' },
      { rank: 18, letter: 'P', name: 'Priya', hours: '6.5h' },
      { rank: 19, letter: 'Z', name: 'Zoe Martin', hours: '6h', isLive: true },
    ],
    userRank: 18,
  },
};

export const HONOR_MEDAL_SRC: Record<1 | 2 | 3, string> = {
  1: '/1%20honor.svg',
  2: '/2%20honor.svg',
  3: '/3%20honor.svg',
};

export function MiniLeaderboardRow({
  peer,
  isUser,
  isMedal,
  compact,
}: {
  peer: LeaderboardPeer;
  isUser: boolean;
  isMedal: boolean;
  /** Tighter row for condensed layouts (e.g. Home). Parent panel should use `p-3` when compact. */
  compact?: boolean;
}) {
  const pad = compact ? '-mx-3 px-3' : '-mx-5 px-5';
  return (
    <div
      className={`flex items-center gap-1.5 ${
        compact ? 'h-8 min-h-8' : 'h-[38px] min-h-[38px]'
      } ${isUser ? `rounded-none bg-[#FFF4E8] ${pad}` : ''}`}
    >
      <span className={`${compact ? 'w-6' : 'w-7'} shrink-0 text-left`}>
        {isMedal ? (
          <img
            src={HONOR_MEDAL_SRC[peer.rank as 1 | 2 | 3]}
            alt=""
            className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} inline-block`}
            aria-hidden
          />
        ) : (
          <span
            className={`tabular-nums text-left text-xs ${isUser ? 'cds-action-secondary text-[var(--cds-color-grey-975)]' : 'cds-body-secondary text-[var(--cds-color-grey-600)]'}`}
          >
            {peer.rank}
          </span>
        )}
      </span>
      <LetterAvatar
        letter={peer.letter}
        seed={peer.name}
        isLive={isUser || !!peer.isLive}
        size={compact ? 'compact' : 'leaderboard'}
      />
      <span
        className={`min-w-0 flex-1 truncate ${compact ? 'text-xs' : ''} ${isUser ? 'cds-action-secondary text-[var(--cds-color-grey-975)]' : 'cds-body-secondary text-[var(--cds-color-grey-975)]'}`}
      >
        {peer.name}
      </span>
      <span
        className={`shrink-0 tabular-nums ${compact ? 'text-xs' : ''} ${isUser ? 'cds-action-secondary text-[var(--cds-color-grey-975)]' : 'cds-body-secondary text-[var(--cds-color-grey-600)]'}`}
      >
        {peer.hours}
      </span>
    </div>
  );
}

function RecentCertificates() {
  const items = [
    { title: 'AI-Powered Productivity for Business Comm' },
    { title: 'Generative AI: Introduction and Application' },
  ];
  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-5">
      <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)] mb-4">Recent certificates</h3>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.title} className="border-b border-[var(--cds-color-grey-100)] pb-4 last:border-0 last:pb-0">
            <p className="cds-action-secondary text-[var(--cds-color-grey-975)] mb-2 line-clamp-2">{item.title}</p>
            <div className="flex flex-wrap gap-4">
              <button type="button" className="cds-action-secondary text-[var(--cds-color-blue-700)] hover:underline">
                Add to LinkedIn
              </button>
              <button type="button" className="cds-action-secondary text-[var(--cds-color-blue-700)] hover:underline">
                View certificate
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Unenrolled / not-started course rows — copy from Figma List (node 1421:8278), Video Preview V2 */
const GOOGLE_DA_PROGRAM_NOT_STARTED_LIST = [
  { title: 'Ask Questions to Make Data-Driven Decisions', courseNum: 2 },
  { title: 'Prepare Data for Exploration', courseNum: 3 },
  { title: 'Process Data from Dirty to Clean', courseNum: 4 },
  { title: 'Analyze Data to Answer Questions', courseNum: 5 },
  { title: 'Share Data Through the Art of Visualization', courseNum: 6 },
  { title: 'Data Analysis with R Programming', courseNum: 7 },
] as const;

const GOOGLE_DA_PROGRAM_TOTAL_COURSES = 7;

/** Next-video row — IBM Generative AI program (Figma Video Preview V2 ~1422:3608). */
const OTHER_PROGRAMS_NEXT_VIDEO_TITLE = 'Discovering Data Skill Sets';

function FeaturedInProgressProgramCard({
  courseData,
  activeLesson,
  onContinue,
  assessmentResults,
}: {
  courseData: CourseData;
  activeLesson: Lesson;
  onContinue: () => void;
  assessmentResults?: Record<string, number> | null;
}) {
  const totalLessons = courseData.modules.reduce((a, m) => a + m.lessons.length, 0);
  const completedLessons = courseData.modules.reduce(
    (a, m) => a + m.lessons.filter((l) => l.status === Status.COMPLETED).length,
    0
  );
  const pct = courseCompletionDisplayPercent(completedLessons, totalLessons);
  const moduleCount = courseData.modules.length;

  const activeModuleIndex = useMemo(
    () => courseData.modules.findIndex((m) => m.lessons.some((l) => l.id === activeLesson.id)),
    [courseData.modules, activeLesson.id]
  );
  const mi = activeModuleIndex >= 0 ? activeModuleIndex : 0;
  const currentModule = courseData.modules[mi] ?? courseData.modules[0];
  const featuredLesson =
    currentModule?.lessons.find((l) => l.id === activeLesson.id) ??
    currentModule?.lessons.find((l) => l.status !== Status.COMPLETED) ??
    currentModule?.lessons[0];

  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [aiSummaryReplayKey, setAiSummaryReplayKey] = useState(0);

  const handleAiSummaryClick = useCallback(() => {
    setAiSummaryOpen(true);
    setAiSummaryReplayKey((k) => k + 1);
  }, []);

  const onAiEntranceConsumed = useCallback(() => {}, []);

  const aiSummaryBodyContext = useMemo<AiSummaryBodyContext>(() => {
    const lessonTitle = featuredLesson?.title ?? activeLesson.title;
    const tl = lessonTitle.toLowerCase();
    const keywords: string[] = [];
    if (tl.includes('chart')) keywords.push('charts');
    if (tl.includes('visual')) keywords.push('visualizations');
    if (tl.includes('data')) keywords.push('data analysis');
    if (tl.includes('clean')) keywords.push('data cleaning');
    if (tl.includes('practice') || tl.includes('best')) keywords.push('best practices');
    const uniqueTopics = [...new Set(keywords)].slice(0, 3);
    const explore = uniqueTopics.length > 0 ? uniqueTopics.join(', ') : 'core course topics';
    return {
      courseProgressDescription: `Today you'll explore ${explore}. Complete your daily goal and keep your streak going!`,
      careerGoal: 'Data Analyst',
      moduleFocus: 'your enrolled program',
      moduleSkills: 'analytics and visualization skills',
      assessmentScorePercent: averageAssessmentScorePercent(assessmentResults),
    };
  }, [featuredLesson?.title, activeLesson.title, assessmentResults]);

  const lessonBlock = (
    <div className="min-w-0 flex-1">
      <p className="cds-action-secondary text-[var(--cds-color-grey-975)]">
        {featuredLesson?.title ?? activeLesson.title}
      </p>
      <p className="cds-body-secondary mt-1 text-[var(--cds-color-grey-600)]">
        Course {mi + 1} of {moduleCount} · {pct}% complete · Estimated completion: May 30, 2025
      </p>
    </div>
  );

  const actionsRow = (
    <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end sm:pt-0.5">
      <button
        type="button"
        onClick={handleAiSummaryClick}
        aria-expanded={aiSummaryOpen}
        aria-controls="proto-ai-summary-featured-in-progress"
        className="inline-flex items-center gap-1.5 rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-400)] bg-[var(--cds-color-white)] px-4 py-2 cds-action-secondary text-[var(--cds-color-grey-975)] transition-colors hover:bg-[var(--cds-color-grey-25)]"
      >
        <span className="material-symbols-rounded text-[var(--cds-color-blue-700)]" style={{ fontSize: 20 }}>
          auto_awesome
        </span>
        AI summary
      </button>
      <button
        type="button"
        onClick={onContinue}
        className="rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] px-5 py-2 cds-action-secondary text-[var(--cds-color-white)] hover:bg-[var(--cds-color-blue-800)] transition-colors"
      >
        Continue
      </button>
    </div>
  );

  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)]">
            <img
              src={courseData.logoUrl || '/google-logo-9822%201.svg'}
              alt=""
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="cds-subtitle-md text-[var(--cds-color-grey-975)] leading-snug">{courseData.title}</h2>
              <div className="flex shrink-0 items-center text-[var(--cds-color-grey-500)]">
                <span className="material-symbols-rounded" style={{ fontSize: 22 }} aria-hidden>
                  expand_more
                </span>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-3 sm:mt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              {lessonBlock}
              {actionsRow}
            </div>
          </div>
        </div>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--cds-color-grey-100)]">
          <div
            className="h-full rounded-full bg-[var(--cds-color-purple-700)] transition-all"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {aiSummaryOpen ? (
          <div className="mt-4 min-w-0">
            <AiTodaySummaryCard
              domId="proto-ai-summary-featured-in-progress"
              summaryRootClassName="mt-0 w-full max-w-full"
              activityStateId="course-progress"
              bodyContext={aiSummaryBodyContext}
              start
              playEntranceAnimation
              replayKey={aiSummaryReplayKey}
              onEntranceAnimationConsumed={onAiEntranceConsumed}
            />
          </div>
        ) : null}

        <ul className="mt-4 divide-y divide-[var(--cds-color-grey-100)] border-t border-[var(--cds-color-grey-100)]">
          {GOOGLE_DA_PROGRAM_NOT_STARTED_LIST.map((row) => (
            <li key={row.title} className="py-2">
              <p className="cds-action-secondary text-[var(--cds-color-grey-975)] line-clamp-2">{row.title}</p>
              <p className="cds-body-secondary mt-0.5 text-[var(--cds-color-grey-600)]">
                Course {row.courseNum} of {GOOGLE_DA_PROGRAM_TOTAL_COURSES} · Not started
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OtherProgramsRow({
  onContinue,
  assessmentResults,
}: {
  onContinue: () => void;
  assessmentResults?: Record<string, number> | null;
}) {
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [aiSummaryReplayKey, setAiSummaryReplayKey] = useState(0);
  const [pillGradientBorder, setPillGradientBorder] = useState(false);
  const [resumeCtaRevealed, setResumeCtaRevealed] = useState(false);

  const handleAiSummaryClick = useCallback(() => {
    setAiSummaryOpen(true);
    setAiSummaryReplayKey((k) => k + 1);
    setPillGradientBorder(true);
  }, []);

  useEffect(() => {
    if (!pillGradientBorder) return undefined;
    const t = window.setTimeout(() => {
      setPillGradientBorder(false);
    }, AI_SUMMARY_REVEAL_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [pillGradientBorder, aiSummaryReplayKey]);

  useEffect(() => {
    if (!aiSummaryOpen) {
      setResumeCtaRevealed(false);
      return;
    }
    setResumeCtaRevealed(false);
  }, [aiSummaryOpen, aiSummaryReplayKey]);

  const onAiEntranceConsumed = useCallback(() => {
    setResumeCtaRevealed(true);
  }, []);

  const aiSummaryBodyContext = useMemo<AiSummaryBodyContext>(() => {
    const tl = OTHER_PROGRAMS_NEXT_VIDEO_TITLE.toLowerCase();
    const keywords: string[] = [];
    if (tl.includes('chart')) keywords.push('charts');
    if (tl.includes('visual')) keywords.push('visualizations');
    if (tl.includes('data')) keywords.push('data analysis');
    if (tl.includes('clean')) keywords.push('data cleaning');
    if (tl.includes('skill')) keywords.push('skill sets');
    if (tl.includes('practice') || tl.includes('best')) keywords.push('best practices');
    const uniqueTopics = [...new Set(keywords)].slice(0, 3);
    const explore = uniqueTopics.length > 0 ? uniqueTopics.join(', ') : 'core course topics';
    return {
      courseProgressDescription: `Today you'll explore ${explore}. Complete your daily goal and keep your streak going!`,
      careerGoal: 'Data Analyst',
      moduleFocus: 'your other in-progress programs',
      moduleSkills: 'analytics and visualization skills',
      assessmentScorePercent: averageAssessmentScorePercent(assessmentResults),
    };
  }, [assessmentResults]);

  const playResumeCta = (
    <button
      type="button"
      onClick={onContinue}
      className={`flex h-12 items-center justify-center rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-blue-700)] cds-action-secondary text-[var(--cds-color-white)] transition-[min-width,padding,gap,transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--cds-color-blue-800)] ${
        aiSummaryOpen
          ? resumeCtaRevealed
            ? 'min-w-[120px] gap-1.5 px-5 sm:min-w-[132px] scale-100 opacity-100'
            : 'min-w-[72px] gap-0 px-4 scale-[0.98] opacity-[0.88]'
          : 'min-w-[72px] shrink-0 gap-0 px-4'
      }`}
      aria-label={aiSummaryOpen ? (resumeCtaRevealed ? 'Resume' : 'Play') : 'Play'}
      aria-busy={aiSummaryOpen && !resumeCtaRevealed ? true : undefined}
    >
      <span className="material-symbols-rounded shrink-0" style={{ fontSize: 24 }}>
        play_arrow
      </span>
      {aiSummaryOpen && resumeCtaRevealed ? <span className="max-w-[5.5rem] truncate sm:max-w-[6.5rem]">Resume</span> : null}
    </button>
  );

  return (
    <div
      className={`${aiSummaryOpen ? 'overflow-visible' : 'overflow-hidden'} rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)]`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:items-stretch">
        <div className="min-w-0 w-full border-b border-[var(--cds-color-grey-100)] px-4 py-4 sm:px-4 sm:py-5 lg:border-b-0 lg:py-5 lg:pr-6">
          <div className="flex flex-col gap-0.5">
            <div className="flex h-6 items-center gap-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--cds-border-radius-50)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)]">
                <span className="cds-body-tertiary leading-none text-[var(--cds-color-grey-975)]" style={{ fontSize: 9 }}>
                  IBM
                </span>
              </div>
            </div>
            <p className="cds-subtitle-md mt-1.5 text-[var(--cds-color-grey-975)] leading-snug">
              Generative AI: Prompt Engineering Basics
            </p>
            <p className="cds-body-secondary mt-1 text-[var(--cds-color-grey-600)]">
              Course<span className="mx-0.5" aria-hidden>
                ·
              </span>
              30% complete
            </p>
            <div className="mt-2 h-1 w-full max-w-full rounded-[2px] bg-[var(--cds-color-grey-50)]">
              <div
                className="h-full w-[30%] rounded-full border border-[var(--cds-color-white)] bg-[var(--cds-color-emphasis-quaternary-bg-strong)]"
                role="progressbar"
                aria-valuenow={30}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 w-full items-stretch gap-2 p-3 sm:gap-3 sm:p-4">
          <div className="flex min-w-0 flex-1 items-stretch gap-2">
            {pillGradientBorder ? (
              <div className="program-row-pill__loading-shell">
                <div
                  className={`program-row-pill__loading-shell-inner ${aiSummaryOpen ? 'justify-start' : 'justify-center'}`}
                >
                  <div
                    className={`flex min-w-0 w-full flex-nowrap items-center gap-3 overflow-hidden px-3 sm:gap-4 sm:px-4 ${
                      aiSummaryOpen ? 'py-1' : 'py-1.5 sm:py-2'
                    }`}
                  >
                    <div className="-mr-[20pt] flex min-w-0 flex-1 flex-col justify-center gap-0 overflow-hidden pr-1">
                      <p className="cds-subtitle-sm min-w-0 truncate whitespace-nowrap text-[var(--cds-color-grey-975)] leading-tight">
                        {OTHER_PROGRAMS_NEXT_VIDEO_TITLE}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1 whitespace-nowrap cds-body-secondary text-[var(--cds-color-grey-600)]">
                        <span className="material-symbols-rounded shrink-0 text-[var(--cds-color-grey-600)]" style={{ fontSize: 12 }}>
                          smart_display
                        </span>
                        Video (1 min)
                      </div>
                    </div>
                    <div
                      className={
                        aiSummaryOpen
                          ? 'ml-auto flex shrink-0 items-center gap-0 self-center'
                          : 'ml-auto flex shrink-0 items-center gap-2 self-center'
                      }
                    >
                      <button
                        type="button"
                        onClick={handleAiSummaryClick}
                        aria-expanded={aiSummaryOpen}
                        aria-controls="proto-ai-summary-other-programs-row"
                        className={`flex h-12 shrink-0 items-center justify-center rounded-[var(--cds-border-radius-100)] transition-all duration-300 ease-out ${
                          aiSummaryOpen
                            ? 'pointer-events-none w-0 min-w-0 scale-95 overflow-hidden border-0 p-0 opacity-0'
                            : 'w-12 border border-[var(--cds-color-blue-700)] bg-[var(--cds-color-white)] text-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-25)]'
                        }`}
                        aria-label="AI summary"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
                          auto_awesome
                        </span>
                      </button>
                      {playResumeCta}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`flex min-w-0 flex-1 flex-col bg-[var(--cds-color-white)] ${
                  aiSummaryOpen
                    ? 'overflow-hidden rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-purple-700)]'
                    : 'rounded-[calc((var(--cds-border-radius-100)+var(--cds-border-radius-200))/2)] border border-[var(--cds-color-grey-100)]'
                } ${aiSummaryOpen ? 'justify-start' : 'justify-center'}`}
              >
                {aiSummaryOpen ? (
                  <div className="min-w-0 rounded-t-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)] px-3 pb-[10pt] pt-1 sm:px-4 sm:pb-[10pt] sm:pt-1">
                    <AiTodaySummaryCard
                      containment="nested"
                      domId="proto-ai-summary-other-programs-row"
                      summaryRootClassName="mt-0 w-full min-w-0 max-w-full"
                      activityStateId="course-progress"
                      bodyContext={aiSummaryBodyContext}
                      start
                      playEntranceAnimation
                      replayKey={aiSummaryReplayKey}
                      onEntranceAnimationConsumed={onAiEntranceConsumed}
                      omitAnalyzingPhase
                    />
                  </div>
                ) : null}
                <div
                  className={`flex min-w-0 w-full flex-nowrap items-center gap-3 overflow-hidden px-3 sm:gap-4 sm:px-4 ${
                    aiSummaryOpen
                      ? 'rounded-b-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)] py-1'
                      : 'py-1.5 sm:py-2'
                  }`}
                >
                  <div className="-mr-[20pt] flex min-w-0 flex-1 flex-col justify-center gap-0 overflow-hidden pr-1">
                    <p className="cds-subtitle-sm min-w-0 truncate whitespace-nowrap text-[var(--cds-color-grey-975)] leading-tight">
                      {OTHER_PROGRAMS_NEXT_VIDEO_TITLE}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 whitespace-nowrap cds-body-secondary text-[var(--cds-color-grey-600)]">
                      <span className="material-symbols-rounded shrink-0 text-[var(--cds-color-grey-600)]" style={{ fontSize: 12 }}>
                        smart_display
                      </span>
                      Video (1 min)
                    </div>
                  </div>
                  <div
                    className={
                      aiSummaryOpen
                        ? 'ml-auto flex shrink-0 items-center gap-0 self-center'
                        : 'ml-auto flex shrink-0 items-center gap-2 self-center'
                    }
                  >
                    <button
                      type="button"
                      onClick={handleAiSummaryClick}
                      aria-expanded={aiSummaryOpen}
                      aria-controls="proto-ai-summary-other-programs-row"
                      className={`flex h-12 shrink-0 items-center justify-center rounded-[var(--cds-border-radius-100)] transition-all duration-300 ease-out ${
                        aiSummaryOpen
                          ? 'pointer-events-none w-0 min-w-0 scale-95 overflow-hidden border-0 p-0 opacity-0'
                          : 'w-12 border border-[var(--cds-color-blue-700)] bg-[var(--cds-color-white)] text-[var(--cds-color-blue-700)] hover:bg-[var(--cds-color-blue-25)]'
                      }`}
                      aria-label="AI summary"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
                        auto_awesome
                      </span>
                    </button>
                    {playResumeCta}
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onContinue}
              className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-[var(--cds-border-radius-100)] text-[var(--cds-color-grey-600)] transition-colors hover:bg-[var(--cds-color-grey-25)]"
              aria-label="More actions"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                more_horiz
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PickUpBanner() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-yellow-200)] bg-[var(--cds-color-yellow-25)] px-5 py-4">
      <span className="material-symbols-rounded text-[var(--cds-color-yellow-700)] shrink-0 sm:mt-0.5" style={{ fontSize: 20 }}>
        info
      </span>
      <div className="min-w-0 flex-1">
        <p className="cds-action-secondary text-[var(--cds-color-grey-975)]">Pick up where you left off</p>
        <p className="cds-body-secondary text-[var(--cds-color-grey-700)] mt-0.5">
          Don&apos;t let the great things you learned fade away! Reset your deadlines and complete your assignments every
          week.
        </p>
      </div>
      <button
        type="button"
        className="cds-action-secondary shrink-0 self-start rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-red-700)] px-4 py-1.5 text-[var(--cds-color-red-700)] hover:bg-[var(--cds-color-red-25)] transition-colors whitespace-nowrap"
      >
        Reset my deadlines
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export const MyLearning: React.FC<MyLearningProps> = (props) => {
  const { onContinueCourse, activeLesson, courseData, assessmentResults } = props;
  const [activeTab, setActiveTab] = useState<TabId>('in-progress');

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[var(--cds-color-white)] custom-scrollbar">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Hero — Figma purple band + illustration */}
        <div className="relative overflow-hidden bg-[var(--cds-color-purple-25)] px-6 py-8">
          <img
            src="/Data analyst background.svg"
            alt=""
            className="pointer-events-none absolute bottom-0 right-0 h-[min(380px,52vh)] w-auto translate-x-[12%] translate-y-[18%] select-none opacity-[0.42]"
          />
          <div className="relative z-10 flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] cds-title-xs">
              PP
            </div>
            <div className="min-w-0">
              <h1 className="cds-title-sm text-[var(--cds-color-grey-975)]">Good morning, Priya</h1>
              <p className="cds-body-secondary mt-2 text-[var(--cds-color-grey-600)]">
                Your goal is to start your career as a{' '}
                <span className="underline decoration-[var(--cds-color-grey-400)]">Data Analyst</span>{' '}
                <button type="button" className="cds-action-secondary text-[var(--cds-color-blue-700)] hover:underline">
                  Edit goal
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-10 border-b border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] px-6">
          <div className="-mb-px flex flex-wrap gap-x-6 gap-y-0">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`cds-body-secondary border-b-2 py-3 transition-colors ${
                    isActive
                      ? 'border-[var(--cds-color-grey-975)] text-[var(--cds-color-grey-975)]'
                      : 'border-transparent text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-grey-975)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 pb-10 pt-6 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-5">
            {activeTab === 'my-plan' && (
              <div className="space-y-4">
                <PickUpBanner />
                <p className="cds-body-secondary text-[var(--cds-color-grey-600)]">
                  Your plan highlights deadlines, recommended weekly minutes, and the next certificate milestone. Switch to
                  &quot;In progress&quot; to continue your primary program.
                </p>
              </div>
            )}

            {activeTab === 'in-progress' && (
              <>
                <FeaturedInProgressProgramCard
                  courseData={courseData}
                  activeLesson={activeLesson}
                  onContinue={onContinueCourse}
                  assessmentResults={assessmentResults}
                />
                <OtherProgramsRow onContinue={onContinueCourse} assessmentResults={assessmentResults} />
              </>
            )}

            {activeTab === 'saved' && (
              <EmptyTab
                icon="bookmark"
                title="Saved courses"
                body="Courses you save will appear here so you can come back to them later."
              />
            )}

            {activeTab === 'completed' && (
              <EmptyTab
                icon="check_circle"
                title="Completed courses"
                body="Courses you finish will appear here along with your certificates."
              />
            )}

            {activeTab === 'skills' && (
              <EmptyTab
                icon="psychology"
                title="Skills"
                body="Track skill assessments, practice recommendations, and role-aligned skill paths here."
              />
            )}

            {activeTab === 'certificates' && <RecentCertificates />}
          </div>

          <aside className="hidden w-full shrink-0 flex-col gap-4 lg:flex lg:w-[380px] xl:w-[400px]">
            <TodaysGoals />
            <LearningPlanCalendar />
            {activeTab !== 'certificates' ? <RecentCertificates /> : null}
          </aside>
        </div>
      </div>
    </div>
  );
};

function EmptyTab({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-10 text-center">
      <span className="material-symbols-rounded text-[var(--cds-color-grey-300)] mb-3 inline-block" style={{ fontSize: 48 }}>
        {icon}
      </span>
      <h3 className="cds-subtitle-md text-[var(--cds-color-grey-975)] mb-2">{title}</h3>
      <p className="cds-body-secondary text-[var(--cds-color-grey-600)] max-w-md mx-auto">{body}</p>
    </div>
  );
}
