import { useEffect, useMemo, useRef } from 'react';

import { indentLess, insertTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { EditorView as CodeMirrorEditorView } from 'codemirror';

import { customSetup } from '@/features/editor/extensions/custom-setup';
import { getLanguageExtension } from '@/features/editor/extensions/language-extension';
import { minimap } from '@/features/editor/extensions/minimap';
import { quickEdit } from '@/features/editor/extensions/quick-edit';
import { suggestion } from '@/features/editor/extensions/suggestion';
import { customTheme } from '@/features/editor/extensions/theme';

interface CodeEditorProps {
  fileName: string;
  initialValue?: string;
  onChange: (value: string) => void;
}

export const CodeEditor = ({ fileName, initialValue = '', onChange }: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<CodeMirrorEditorView | null>(null);

  const languageExtension = useMemo(() => getLanguageExtension(fileName), [fileName]);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new CodeMirrorEditorView({
      doc: initialValue,
      parent: editorRef.current,
      extensions: [
        oneDark,
        customTheme,
        customSetup,
        languageExtension,
        suggestion(fileName),
        quickEdit(fileName),
        keymap.of([
          { key: 'Tab', run: insertTab },
          { key: 'Shift-Tab', run: indentLess },
        ]),
        minimap(),
        indentationMarkers(),
        CodeMirrorEditorView.updateListener.of((update) => {
          if (update.docChanged) onChange(update.state.doc.toString());
        }),
      ],
    });

    viewRef.current = view;

    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialValue is only used for initial document
  }, [languageExtension]);

  return <div ref={editorRef} className='size-full bg-background pl-4' />;
};
