import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from './Icons';
import {
  AI_SUMMARY_LOADING_TITLE,
  getAiSummaryState,
  type AiSummaryActivityStateId,
  type AiSummaryBodyContext,
} from '../config/aiSummaryActivityStates';

export const AI_SUMMARY_REVEAL_DELAY_MS = 1500;
const TYPE_INTERVAL_MS = 25;

type Phase = 'waiting' | 'analyzing' | 'typing' | 'done';

interface AiTodaySummaryCardProps {
  activityStateId: AiSummaryActivityStateId;
  bodyContext: AiSummaryBodyContext;
  /** When true (after progress bar fill), the card may mount and run its sequence. */
  start: boolean;
  /** Run analyzing border + typewriter (initial load or Replay). */
  playEntranceAnimation: boolean;
  /** Bumped on replay to reset internal phase timers. */
  replayKey: number;
  onEntranceAnimationConsumed: () => void;
  /** Override root wrapper id when multiple summaries can exist in the DOM. */
  domId?: string;
  /** Extra classes on the root wrapper (default includes `mt-5`). */
  summaryRootClassName?: string;
  /** `nested` — no inner purple frame; for use inside another bordered surface (Figma Video Preview V2). */
  containment?: 'standalone' | 'nested';
  /** Skip analyzing delay + inner loading chrome; go straight to typewriter (e.g. parent already showed pill border). */
  omitAnalyzingPhase?: boolean;
}

/** Video Preview V2 — activity-based AI summary (Figma 1412:11290). */
export function AiTodaySummaryCard({
  activityStateId,
  bodyContext,
  start,
  playEntranceAnimation,
  replayKey,
  onEntranceAnimationConsumed,
  domId = 'proto-ai-summary',
  summaryRootClassName,
  containment = 'standalone',
  omitAnalyzingPhase = false,
}: AiTodaySummaryCardProps) {
  const isNested = containment === 'nested';
  const state = useMemo(() => getAiSummaryState(activityStateId), [activityStateId]);
  const fullTitle = state.title;
  const fullBody = useMemo(() => state.getBody(bodyContext), [state, bodyContext]);

  const [phase, setPhase] = useState<Phase>('waiting');
  const [typedText, setTypedText] = useState('');
  const sequenceRef = useRef(0);

  useEffect(() => {
    if (!start) {
      setPhase('waiting');
      setTypedText('');
      return;
    }

    const sequenceId = ++sequenceRef.current;

    if (!playEntranceAnimation) {
      setPhase('done');
      setTypedText(fullBody ?? '');
      return;
    }

    if (omitAnalyzingPhase) {
      if (fullBody == null) {
        setPhase('done');
        setTypedText('');
        onEntranceAnimationConsumed();
        return;
      }
      setPhase('typing');
      setTypedText('');
      return () => {
        sequenceRef.current += 1;
      };
    }

    setPhase('analyzing');
    setTypedText('');

    const revealTimer = window.setTimeout(() => {
      if (sequenceId !== sequenceRef.current) return;
      if (fullBody == null) {
        setPhase('done');
        onEntranceAnimationConsumed();
        return;
      }
      setPhase('typing');
    }, AI_SUMMARY_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(revealTimer);
      sequenceRef.current += 1;
    };
  }, [start, playEntranceAnimation, omitAnalyzingPhase, activityStateId, fullBody, replayKey, onEntranceAnimationConsumed]);

  useEffect(() => {
    if (phase !== 'typing' || fullBody == null) return;

    const sequenceId = sequenceRef.current;
    let index = 0;
    setTypedText('');

    const typeInterval = window.setInterval(() => {
      if (sequenceId !== sequenceRef.current) {
        window.clearInterval(typeInterval);
        return;
      }
      if (index < fullBody.length) {
        index += 1;
        setTypedText(fullBody.slice(0, index));
      } else {
        setPhase('done');
        onEntranceAnimationConsumed();
        window.clearInterval(typeInterval);
      }
    }, TYPE_INTERVAL_MS);

    return () => window.clearInterval(typeInterval);
  }, [phase, fullBody, onEntranceAnimationConsumed]);

  if (phase === 'waiting') {
    return null;
  }

  const isAnalyzing = phase === 'analyzing';
  const header = isAnalyzing ? AI_SUMMARY_LOADING_TITLE : fullTitle;
  const showBody = !isAnalyzing && fullBody != null;

  const rootClass = ['mt-5 w-full', summaryRootClassName].filter(Boolean).join(' ');

  const headerRow = (
    <div className="flex items-start gap-1">
      <Icons.AIGenerateBranded className="h-4 w-4 shrink-0 text-[var(--cds-color-grey-975)]" />
      <h3 className="cds-subtitle-sm text-[var(--cds-color-grey-975)]">{header}</h3>
    </div>
  );

  return (
    <div id={domId} className={rootClass} data-ai-summary-state={activityStateId} data-ai-summary-containment={containment}>
      <div
        className={
          isAnalyzing
            ? [
                'ai-summary-card--loading min-h-[50px]',
                isNested ? 'ai-summary-card--nested' : '',
              ]
                .filter(Boolean)
                .join(' ')
            : isNested
              ? 'flex w-full flex-col gap-0 border-0 bg-transparent p-0'
              : 'flex w-full flex-col gap-2 rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-purple-700)] bg-[var(--cds-color-white)] p-4'
        }
      >
        <div
          className={
            isAnalyzing
              ? [
                  'ai-summary-card__inner flex w-full flex-col gap-2',
                  isNested ? 'p-3 sm:p-4' : 'p-4',
                  isNested ? 'ai-summary-card__inner--nested' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              : isNested
                ? 'flex w-full flex-col gap-0'
                : 'flex w-full flex-col gap-2'
          }
        >
          {headerRow}
          {showBody && (
            <p className="cds-body-tertiary line-clamp-3 min-h-[18px] text-[var(--cds-color-grey-600)] leading-[18px]">
              {typedText}
              {phase === 'typing' && (
                <span
                  className="ml-0.5 inline-block h-[14px] w-px animate-pulse bg-[var(--cds-color-grey-600)] align-[-2px]"
                  aria-hidden
                />
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Experiment A — static grey-border card, no loading sequence. */
export function AiTodaySummaryBaseline({ description }: { description: string }) {
  return (
    <div id="proto-ai-summary" className="mt-5 w-full">
      <div className="w-full rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-4">
        <div className="mb-3 flex items-start gap-2.5">
          <Icons.CoachSparkle className="h-4 w-4 shrink-0" />
          <h3 className="cds-subtitle-sm text-[var(--cds-color-grey-975)]">By continuing, you will learn:</h3>
        </div>
        <p className="cds-body-secondary line-clamp-3 max-h-[54px] text-[var(--cds-color-grey-600)] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
