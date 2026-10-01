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

const setSuggestionEffect = StateEffect.define<string | null>();

const suggestionState = StateField.define<string | null>({
  create: () => '',
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
  renderPlugin,
  acceptSuggestionKeymap,
];
