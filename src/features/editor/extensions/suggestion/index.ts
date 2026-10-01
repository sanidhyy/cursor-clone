import { StateEffect, StateField } from '@codemirror/state';
import {
  EditorView as CodeMirrorEditorView,
  Decoration,
  DecorationSet,
  keymap,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';

import { SUGGESTION_DEBOUNCE_MS } from '@/features/editor/constants';

const setSuggestionEffect = StateEffect.define<string | null>();

const suggestionState = StateField.define<string | null>({
  create: () => null,
  update: (value, transaction) => {
    for (const effect of transaction.effects)
      if (effect.is(setSuggestionEffect)) return effect.value;

    return value;
  },
});

class SuggestionWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');

    span.textContent = this.text;
    span.style.opacity = '0.4';
    span.style.pointerEvents = 'none';

    return span;
  }
}

let debounceTimer: number | null = null;
let isWaitingForSuggestion = false;

const generateFakeSuggestion = (textBeforeCursor: string): string | null => {
  const trimmed = textBeforeCursor.trimEnd();
  if (trimmed.endsWith('const')) return ' myVariable = ';
  if (trimmed.endsWith('function')) return ' myFunction() {\n \n}';
  if (trimmed.endsWith('console.')) return 'log()';
  if (trimmed.endsWith('return')) return ' null;';

  return null;
};

const createDebouncePlugin = (fileName: string) => {
  return ViewPlugin.fromClass(
    class {
      constructor(view: CodeMirrorEditorView) {
        this.triggerSuggestion(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) this.triggerSuggestion(update.view);
      }

      triggerSuggestion(view: CodeMirrorEditorView) {
        if (debounceTimer !== null) clearTimeout(debounceTimer);

        isWaitingForSuggestion = true;

        debounceTimer = window.setTimeout(async () => {
          const cursor = view.state.selection.main.head;
          const line = view.state.doc.lineAt(cursor);
          const textBeforeCursor = line.text.slice(0, cursor - line.from);
          const suggestion = generateFakeSuggestion(textBeforeCursor);

          isWaitingForSuggestion = false;
          view.dispatch({
            effects: setSuggestionEffect.of(suggestion),
          });
        }, SUGGESTION_DEBOUNCE_MS);
      }

      destroy() {
        if (debounceTimer !== null) clearTimeout(debounceTimer);
      }
    }
  );
};

const renderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: CodeMirrorEditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      const suggestionChanged = update.transactions.some((transaction) =>
        transaction.effects.some((effect) => effect.is(setSuggestionEffect))
      );
      const shouldRebuild = update.docChanged || update.selectionSet || suggestionChanged;

      if (shouldRebuild) this.decorations = this.build(update.view);
    }

    build(view: CodeMirrorEditorView) {
      if (isWaitingForSuggestion) return Decoration.none;

      const suggestion = view.state.field(suggestionState);
      if (!suggestion) return Decoration.none;

      const cursor = view.state.selection.main.head;
      return Decoration.set([
        Decoration.widget({
          widget: new SuggestionWidget(suggestion),
          side: 1,
        }).range(cursor),
      ]);
    }
  },
  { decorations: (plugin) => plugin.decorations }
);

const acceptSuggestionKeymap = keymap.of([
  {
    key: 'Tab',
    run: (view) => {
      const suggestion = view.state.field(suggestionState);
      if (!suggestion) return false;

      const cursor = view.state.selection.main.head;
      view.dispatch({
        changes: { from: cursor, insert: suggestion },
        selection: { anchor: cursor + suggestion.length },
        effects: setSuggestionEffect.of(null),
      });

      return true;
    },
  },
]);

export const suggestion = (fileName: string) => [
  suggestionState,
  createDebouncePlugin(fileName),
  renderPlugin,
  acceptSuggestionKeymap,
];
