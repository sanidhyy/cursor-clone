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
import { selectionTooltip } from '@/features/editor/extensions/selection-tooltip';
import { suggestion } from '@/features/editor/extensions/suggestion';
import { customTheme } from '@/features/editor/extensions/theme';

interface CodeEditorProps {
  fileName: string;
  initialValue?: string;
  onChange: (value: string) => void;
  onAddToChat: (code: string) => void;
}

export const CodeEditor = ({
  fileName,
  initialValue = '',
  onChange,
  onAddToChat,
}: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const onAddToChatRef = useRef(onAddToChat);

  useEffect(() => {
    onAddToChatRef.current = onAddToChat;
  }, [onAddToChat]);

  const languageExtension = useMemo(() => getLanguageExtension(fileName), [fileName]);

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = new CodeMirrorEditorView({
      doc: initialValue,
      parent: editorRef.current,
      extensions: [
        oneDark,
        customTheme,
        customSetup,
        languageExtension,
        suggestion(fileName),
        quickEdit(fileName),
        selectionTooltip((code) => onAddToChatRef.current(code)),
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

    return () => editor.destroy();

    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialValue is only used for initial document
  }, [languageExtension]);

  return <div ref={editorRef} className='size-full bg-background pl-4' />;
};
