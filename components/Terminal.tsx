'use client';

import { useEffect, useRef, useState } from 'react';
import { Server } from '@/types';

interface TerminalProps {
  server: Server;
}

export default function Terminal({ server }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !terminalRef.current || xtermRef.current) return;

    let term: any;
    let fitAddon: any;

    const initTerminal = async () => {
      const { Terminal: XTerm } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { Unicode11Addon } = await import('@xterm/addon-unicode11');
      await import('@xterm/xterm/css/xterm.css');

      term = new XTerm({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#0a0a0a',
          foreground: '#ffffff',
          cursor: '#3b82f6',
          cursorAccent: '#000000',
        },
        rows: 30,
        cols: 120,
        allowProposedApi: true,
        convertEol: true,
      });

      const unicode11Addon = new Unicode11Addon();
      term.loadAddon(unicode11Addon);
      term.unicode.activeVersion = '11';

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      if (terminalRef.current) {
        term.open(terminalRef.current);
        setTimeout(() => fitAddon.fit(), 0);
      }

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      term.writeln(`\x1b[1;36mConnected to ${server.nickname} (${server.ipAddress})\x1b[0m`);
      term.writeln('');
      writePrompt(term);

      let lineBuffer = '';

      term.onData((data: string) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter
          term.write('\r\n');
          const command = lineBuffer.trim();

          if (command) {
            executeCommand(command, term);
            setCommandHistory(prev => [...prev, command]);
          } else {
            writePrompt(term);
          }

          lineBuffer = '';
          setCurrentCommand('');
          setHistoryIndex(-1);
        } else if (code === 127) {
          // Backspace
          if (lineBuffer.length > 0) {
            lineBuffer = lineBuffer.slice(0, -1);
            term.write('\b \b');
            setCurrentCommand(lineBuffer);
          }
        } else if (code === 27) {
          // Escape sequences (arrow keys)
          if (data === '\x1b[A') {
            // Up arrow
            if (commandHistory.length > 0) {
              const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
              const cmd = commandHistory[commandHistory.length - 1 - newIndex];
              if (cmd) {
                clearLine(term, lineBuffer.length);
                term.write(cmd);
                lineBuffer = cmd;
                setCurrentCommand(cmd);
                setHistoryIndex(newIndex);
              }
            }
          } else if (data === '\x1b[B') {
            // Down arrow
            if (historyIndex > 0) {
              const newIndex = historyIndex - 1;
              const cmd = commandHistory[commandHistory.length - 1 - newIndex];
              clearLine(term, lineBuffer.length);
              term.write(cmd);
              lineBuffer = cmd;
              setCurrentCommand(cmd);
              setHistoryIndex(newIndex);
            } else if (historyIndex === 0) {
              clearLine(term, lineBuffer.length);
              lineBuffer = '';
              setCurrentCommand('');
              setHistoryIndex(-1);
            }
          }
        } else if (code >= 32) {
          // Printable characters
          lineBuffer += data;
          term.write(data);
          setCurrentCommand(lineBuffer);
        }
      });

      const handleResize = () => {
        if (fitAddon) fitAddon.fit();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (term) term.dispose();
      };
    };

    initTerminal();
  }, [mounted]);

  const clearLine = (term: any, length: number) => {
    term.write('\r' + ' '.repeat(length + 2) + '\r');
    term.write('\x1b[1;32m$\x1b[0m ');
  };

  const writePrompt = (term: any) => {
    term.write('\x1b[1;32m$\x1b[0m ');
  };

  const executeCommand = async (command: string, term: any) => {
    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          command,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.stdout) {
          // Write each line separately to preserve formatting
          const lines = data.stdout.split('\n');
          lines.forEach((line: string) => {
            term.writeln(line);
          });
        }
        if (data.stderr) {
          const lines = data.stderr.split('\n');
          lines.forEach((line: string) => {
            term.writeln(`\x1b[31m${line}\x1b[0m`);
          });
        }
      } else {
        term.writeln(`\x1b[31mError: ${data.error}\x1b[0m`);
      }
    } catch (error) {
      term.writeln(`\x1b[31mFailed to execute command\x1b[0m`);
    }

    writePrompt(term);
  };

  return <div ref={terminalRef} className="h-full w-full p-2 bg-card" />;
}
