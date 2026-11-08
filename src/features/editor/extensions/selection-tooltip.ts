import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { showTooltip, ViewPlugin, type Tooltip, type ViewUpdate } from '@codemirror/view';
import { EditorView as CodeMirrorEditorView } from 'codemirror';

import { quickEditState, showQuickEditEffect } from './quick-edit';

const SELECTION_TOOLTIP_DELAY = 250;
const showSelectionTooltip = StateEffect.define<boolean>();

const createTooltipForSelection = (
  state: EditorState,
  onAddToChat: (code: string) => void
): readonly Tooltip[] => {
  const selection = state.selection.main;

  if (selection.empty) return [];

  const isQuickEditActive = state.field(quickEditState);

  if (isQuickEditActive) return [];

  return [
    {
      pos: selection.to,
      above: false,
      strictSide: false,

      create: (view) => {
        const dom = document.createElement('div');

        dom.className =
          'bg-popover text-popover-foreground z-50 rounded-sm border border-input p-1 shadow-md flex items-center gap-2 text-sm';

        const addToChatButton = document.createElement('button');

        addToChatButton.textContent = 'Add to Chat';
        addToChatButton.className = 'font-sans py-1 px-2 hover:bg-foreground/10 rounded-sm';
        addToChatButton.onclick = () =>
          onAddToChat(state.doc.sliceString(selection.from, selection.to));

        const quickEditButton = document.createElement('button');

        quickEditButton.className =
          'font-sans py-1 px-2 hover:bg-foreground/10 rounded-sm flex items-center gap-1';

        const quickEditButtonText = document.createElement('span');

        quickEditButtonText.textContent = 'Quick Edit';

        const quickEditButtonShortcut = document.createElement('span');

        quickEditButtonShortcut.textContent = '⌘K';
        quickEditButtonShortcut.className = 'text-sm opacity-60';

        quickEditButton.appendChild(quickEditButtonText);
        quickEditButton.appendChild(quickEditButtonShortcut);

        quickEditButton.onclick = () => {
          view.dispatch({ effects: showQuickEditEffect.of(true) });
        };

        dom.appendChild(addToChatButton);
        dom.appendChild(quickEditButton);

        return { dom };
      },
    },
  ];
};

export const selectionTooltip = (onAddToChat: (code: string) => void) => [
  StateField.define<readonly Tooltip[]>({
    create: () => [],

    update: (tooltips, transaction) => {
      if (transaction.docChanged || transaction.selection) return [];

      for (const effect of transaction.effects)
        if (effect.is(showQuickEditEffect)) return [];
        else if (effect.is(showSelectionTooltip))
          return effect.value ? createTooltipForSelection(transaction.state, onAddToChat) : [];

      return tooltips;
    },

    provide: (field) => showTooltip.computeN([field], (state) => state.field(field)),
  }),
  selectionIdlePlugin,
];

const selectionIdlePlugin = ViewPlugin.fromClass(
  class {
    private timer: ReturnType<typeof setTimeout> | null = null;
    private selecting = false;
    private readonly ownerWindow: Window;

    constructor(private readonly view: CodeMirrorEditorView) {
      this.ownerWindow = view.dom.ownerDocument.defaultView!;

      this.ownerWindow.addEventListener('pointerup', this.finishSelection);
      this.ownerWindow.addEventListener('pointercancel', this.finishSelection);
      this.ownerWindow.addEventListener('blur', this.finishSelection);
      this.schedule();
    }

    private cancelTimer() {
      if (this.timer !== null) clearTimeout(this.timer);

      this.timer = null;
    }

    private schedule() {
      this.cancelTimer();

      if (
        this.selecting ||
        this.view.state.selection.main.empty ||
        this.view.state.field(quickEditState)
      )
        return;

      this.timer = setTimeout(() => {
        this.timer = null;

        this.view.dispatch({ effects: showSelectionTooltip.of(true) });
      }, SELECTION_TOOLTIP_DELAY);
    }

    startSelection(event: PointerEvent) {
      // Keep the toolbar available when clicking either of its actions.
      if (event.target instanceof Element && event.target.closest('.cm-tooltip')) return;

      this.selecting = true;

      this.cancelTimer();
      this.view.dispatch({ effects: showSelectionTooltip.of(false) });
    }

    private finishSelection = () => {
      if (!this.selecting) return;

      this.selecting = false;

      this.schedule();
    };

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.transactions.some((transaction) =>
          transaction.effects.some((effect) => effect.is(showQuickEditEffect))
        )
      )
        this.schedule();
    }

    destroy() {
      this.cancelTimer();
      this.ownerWindow.removeEventListener('pointerup', this.finishSelection);
      this.ownerWindow.removeEventListener('pointercancel', this.finishSelection);
      this.ownerWindow.removeEventListener('blur', this.finishSelection);
    }
  },
  {
    eventHandlers: {
      pointerdown(event) {
        this.startSelection(event);
      },
    },
  }
);
