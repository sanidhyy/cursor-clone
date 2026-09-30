import { useEffect, useMemo, useRef } from 'react';

import { indentLess, insertTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { EditorView as CodeMirrorEditorView } from 'codemirror';

import { customSetup } from '@/features/editor/extensions/custom-setup';
import { getLanguageExtension } from '@/features/editor/extensions/language-extension';
import { minimap } from '@/features/editor/extensions/minimap';
import { customTheme } from '@/features/editor/extensions/theme';

interface CodeEditorProps {
  fileName: string;
}

export const CodeEditor = ({ fileName }: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<CodeMirrorEditorView | null>(null);

  const languageExtension = useMemo(() => getLanguageExtension(fileName), [fileName]);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new CodeMirrorEditorView({
      doc: `const Counter = () => {
  const [value, setValue] = useState(0);

  const onIncrease = setValue((value) => value + 1);
  const onDecrease = setValue((value) => value - 1);

  return (
    <div>
      <button onClick={onIncrease}>{value}</button>
    </div>
  )
}
`,
      parent: editorRef.current,
      extensions: [
        oneDark,
        customTheme,
        customSetup,
        languageExtension,
        keymap.of([
          { key: 'Tab', run: insertTab },
          { key: 'Shift-Tab', run: indentLess },
        ]),
        minimap(),
        indentationMarkers(),
      ],
    });

    viewRef.current = view;

    return () => view.destroy();
  }, [languageExtension]);

  return <div ref={editorRef} className='size-full bg-background pl-4' />;
};
