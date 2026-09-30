import { EditorView as CodeMirrorEditorView } from 'codemirror';

export const customTheme = CodeMirrorEditorView.theme({
  '&': {
    outline: 'none !important',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono), monospace',
    fontSize: '14px',
  },
  '.cm-scroller': {
    scrollbarWidth: 'thin',
    scrollbarColor: '#3f3f46 transparent',
  },
});
