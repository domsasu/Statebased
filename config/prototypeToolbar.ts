/** Prototype toolbar config — https://github.com/nella-droid/coursera-prototype-toolbar */

import { AI_SUMMARY_ACTIVITY_STATES } from './aiSummaryActivityStates';

export const PROTO_EXPERIMENT_STORAGE_KEY = 'proto-experiment';

export const PROTO_REPLAY_AI_SUMMARY_EVENT = 'proto-replay-ai-summary';

export const PROTO_AI_SUMMARY_STATE_EVENT = 'proto-ai-summary-state';

export type PrototypeExperimentId = 'a' | 'b' | 'c' | 'd';

declare global {
  interface Window {
    __getProtoLayouts?: () => Record<string, unknown[]>;
    PrototypeToolbar?: {
      init: (config: Record<string, unknown>) => void;
      getExperiment: () => string | null;
      setExperiment: (id: string) => void;
    };
  }
}

function dispatchReplayAiSummary(): void {
  window.dispatchEvent(new CustomEvent(PROTO_REPLAY_AI_SUMMARY_EVENT));
}

function dispatchAiSummaryState(stateId: string): void {
  window.dispatchEvent(new CustomEvent(PROTO_AI_SUMMARY_STATE_EVENT, { detail: { stateId } }));
}

const aiSummaryStateTriggers = AI_SUMMARY_ACTIVITY_STATES.map((state) => ({
  label: state.label,
  icon: 'auto_awesome' as const,
  onClick: () => dispatchAiSummaryState(state.id),
}));

export function buildPrototypeToolbarConfig(): Record<string, unknown> {
  const experimentBFeatureItems = [
    { text: 'Course progress bar (faster fill)', hl: '#proto-course-progress' },
    { text: 'Up next course card', hl: '#proto-up-next-card' },
    {
      text: 'AI summary (activity states)',
      hl: '#proto-ai-summary',
      children: AI_SUMMARY_ACTIVITY_STATES.map((s) => ({
        text: `${s.label}: “${s.title}”`,
      })),
    },
    { text: 'Replay entrance animation', action: 'replayAiSummary' },
  ];

  return {
    home: { href: '/', label: 'Home' },

    experiments: [
      { id: 'a', label: 'Control' },
      { id: 'b', label: 'State: Enrolled Active' },
      { id: 'c', label: 'State: Enrolled At Risk' },
      { id: 'd', label: 'State: Seeking' },
    ],

    storageKey: PROTO_EXPERIMENT_STORAGE_KEY,
    reloadOnExperimentChange: false,

    features: {
      a: {
        notice: 'Baseline — static AI summary and grey card border.',
        sections: [
          {
            title: 'Home (Experiment A)',
            items: [
              { text: 'Course progress bar', hl: '#proto-course-progress' },
              { text: 'Up next course card', hl: '#proto-up-next-card' },
              {
                text: 'AI summary (static)',
                hl: '#proto-ai-summary',
                children: [
                  { text: 'Grey border, no loading animation' },
                  { text: 'Header: “By continuing, you will learn:”' },
                  { text: 'Full description shown immediately' },
                ],
              },
            ],
          },
        ],
      },
      b: {
        notice: 'Video Preview V2 — activity-based AI summary. Default: Course progress.',
        sections: [
          {
            title: 'Home (Experiment B)',
            items: experimentBFeatureItems,
          },
        ],
      },
      d: {
        notice: 'Seeking — no active enrollment. Core job: find something worth starting. New learners have high guidance needs; established seekers get more targeted recommendations. Layout is identical because the job is the same.',
        sections: [
          {
            title: 'Home (Seeking)',
            items: [
              { text: 'Course recommendations', hl: '#proto-course-recs' },
              { text: 'Skills', hl: '#proto-skills' },
            ],
          },
        ],
      },
      c: {
        notice: 'Enrolled At Risk — engagement has dropped. Tone: aspirational, not guilt-inducing. Core job: make one step feel easy.',
        sections: [
          {
            title: 'Home (Enrolled At Risk)',
            items: [
              { text: 'Course progress bar', hl: '#proto-course-progress' },
              { text: 'Up next course card', hl: '#proto-up-next-card' },
            ],
          },
        ],
      },
    },

    actions: {
      replayAiSummary: () => {
        dispatchReplayAiSummary();
        return true;
      },
      ...Object.fromEntries(
        AI_SUMMARY_ACTIVITY_STATES.map((s) => [
          `setAiSummary_${s.id}`,
          () => {
            dispatchAiSummaryState(s.id);
            return true;
          },
        ])
      ),
    },

    triggers: [
      {
        label: 'Mid-fi',
        icon: 'grid_view',
        onClick: () => {
          document.body.classList.add('proto-midfi');
          document.body.classList.remove('proto-hifi');
        },
      },
      {
        label: 'Hi-fi',
        icon: 'dashboard',
        onClick: () => {
          document.body.classList.add('proto-hifi');
          document.body.classList.remove('proto-midfi');
        },
      },
      {
        label: 'Hi-Fi Vision',
        icon: 'dashboard',
        onClick: () => {
          document.body.classList.add('proto-hifi');
          document.body.classList.remove('proto-midfi');
        },
      },
      {
        label: 'Save layout',
        icon: 'save',
        onClick: () => {
          const layouts = window.__getProtoLayouts?.();
          if (!layouts || Object.keys(layouts).length === 0) {
            alert('No layout changes to save — drag blocks first, then click Save layout.');
            return;
          }
          const json = JSON.stringify(layouts, null, 2);
          navigator.clipboard.writeText(json).then(() => {
            alert('Layout JSON copied to clipboard!\n\nPaste it to Claude and say "save this as default" to write it into the config file.');
          }).catch(() => {
            prompt('Copy this and paste to Claude to save as default:', json);
          });
        },
      },
    ],
  };
}

export function parsePrototypeExperiment(raw: string | null): PrototypeExperimentId {
  if (raw === 'b') return 'b';
  if (raw === 'c') return 'c';
  if (raw === 'd') return 'd';
  return 'a';
}
