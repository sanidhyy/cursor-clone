'use client';

import { useEffect, useRef } from 'react';

import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

interface PreviewTerminalProps {
  output: string;
}

export const PreviewTerminal = ({ output }: PreviewTerminalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || !!terminalRef.current) return;

    const terminal = new Terminal({
      convertEol: true,
      disableStdin: true,
      fontSize: 12,
      fontFamily: 'monospace',
      theme: { background: '#1f2228' },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    if (!!output) {
      terminal.write(output);
      lastLengthRef.current = output.length;
    }

    requestAnimationFrame(() => fitAddon.fit());

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- "output" does not need to be a dependency since it is not indented to update anything, just used on mount
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    if (output.length < lastLengthRef.current) {
      terminalRef.current.clear();
      lastLengthRef.current = 0;
    }

    const newData = output.slice(lastLengthRef.current);
    if (!!newData) {
      terminalRef.current.write(newData);
      lastLengthRef.current = output.length;
    }
  }, [output]);

  return (
    <div
      ref={containerRef}
      className='min-h-0 flex-1 bg-sidebar p-3 [&_.xterm]:h-full! [&_.xterm-screen]:h-full! [&_.xterm-viewport]:h-full!'
    />
  );
};
