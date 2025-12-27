'use client';

import { useEffect, useRef, useState } from 'react';
import { Server } from '@/types';
import '@xterm/xterm/css/xterm.css';
import { ascii_art, terminal_welcome_message } from '../config.js';

interface TerminalProps {
  server: Server;
  onDirectoryChange?: (path: string) => void;
}

export default function Terminal({ server, onDirectoryChange }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const currentDirRef = useRef<string>('/root'); // Track current working directory
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
      term.writeln(`\x1b[1;36m${ascii_art}\x1b[0m`);
      term.writeln(`\x1b[1;36m${terminal_welcome_message}\x1b[0m`);
      term.writeln('');
      writePrompt(term);

      let lineBuffer = '';
      let cursorPos = 0; // Cursor position within the line

      term.onData((data: string) => {
        const code = data.charCodeAt(0);

        // Ctrl+C - Cancel current command
        if (code === 3) {
          term.write('^C\r\n');
          lineBuffer = '';
          cursorPos = 0;
          historyIndexRef.current = -1;
          writePrompt(term);
          return;
        }

        // Ctrl+L - Clear screen
        if (code === 12) {
          term.clear();
          writePrompt(term);
          term.write(lineBuffer);
          // Move cursor back to correct position
          if (cursorPos < lineBuffer.length) {
            term.write('\x1b[' + (lineBuffer.length - cursorPos) + 'D');
          }
          return;
        }

        // Ctrl+A - Move to start of line
        if (code === 1) {
          if (cursorPos > 0) {
            term.write('\x1b[' + cursorPos + 'D');
            cursorPos = 0;
          }
          return;
        }

        // Ctrl+E - Move to end of line
        if (code === 5) {
          if (cursorPos < lineBuffer.length) {
            term.write('\x1b[' + (lineBuffer.length - cursorPos) + 'C');
            cursorPos = lineBuffer.length;
          }
          return;
        }

        // Ctrl+U - Clear line before cursor
        if (code === 21) {
          if (cursorPos > 0) {
            const remaining = lineBuffer.slice(cursorPos);
            lineBuffer = remaining;
            // Move cursor to start and rewrite
            term.write('\r\x1b[K');
            writePrompt(term);
            term.write(lineBuffer);
            cursorPos = 0;
            if (lineBuffer.length > 0) {
              term.write('\x1b[' + lineBuffer.length + 'D');
            }
          }
          return;
        }

        // Ctrl+K - Clear line after cursor
        if (code === 11) {
          if (cursorPos < lineBuffer.length) {
            lineBuffer = lineBuffer.slice(0, cursorPos);
            term.write('\x1b[K');
          }
          return;
        }

        // Ctrl+W - Delete word before cursor
        if (code === 23) {
          if (cursorPos > 0) {
            const beforeCursor = lineBuffer.slice(0, cursorPos);
            const afterCursor = lineBuffer.slice(cursorPos);
            const match = beforeCursor.match(/\s*\S+\s*$/);
            if (match) {
              const deleteCount = match[0].length;
              lineBuffer = lineBuffer.slice(0, cursorPos - deleteCount) + afterCursor;
              cursorPos -= deleteCount;
              // Redraw line
              term.write('\r\x1b[K');
              writePrompt(term);
              term.write(lineBuffer);
              if (cursorPos < lineBuffer.length) {
                term.write('\x1b[' + (lineBuffer.length - cursorPos) + 'D');
              }
            }
          }
          return;
        }

        if (code === 13) {
          // Enter
          term.write('\r\n');
          const command = lineBuffer.trim();

          if (command) {
            executeCommand(command, term);
            commandHistoryRef.current.push(command);
          } else {
            writePrompt(term);
          }

          lineBuffer = '';
          cursorPos = 0;
          historyIndexRef.current = -1;
        } else if (code === 127) {
          // Backspace
          if (cursorPos > 0) {
            lineBuffer = lineBuffer.slice(0, cursorPos - 1) + lineBuffer.slice(cursorPos);
            cursorPos--;
            // Redraw from cursor position
            term.write('\b');
            term.write(lineBuffer.slice(cursorPos) + ' ');
            term.write('\x1b[' + (lineBuffer.length - cursorPos + 1) + 'D');
          }
        } else if (code === 27) {
          // Escape sequences (arrow keys, etc.)
          if (data === '\x1b[A') {
            // Up arrow - Previous command in history
            if (commandHistoryRef.current.length > 0) {
              const newIndex = historyIndexRef.current < commandHistoryRef.current.length - 1 ? historyIndexRef.current + 1 : historyIndexRef.current;
              const cmd = commandHistoryRef.current[commandHistoryRef.current.length - 1 - newIndex];
              if (cmd) {
                clearLine(term, lineBuffer.length);
                term.write(cmd);
                lineBuffer = cmd;
                cursorPos = cmd.length;
                historyIndexRef.current = newIndex;
              }
            }
          } else if (data === '\x1b[B') {
            // Down arrow - Next command in history
            if (historyIndexRef.current > 0) {
              const newIndex = historyIndexRef.current - 1;
              const cmd = commandHistoryRef.current[commandHistoryRef.current.length - 1 - newIndex];
              clearLine(term, lineBuffer.length);
              term.write(cmd);
              lineBuffer = cmd;
              cursorPos = cmd.length;
              historyIndexRef.current = newIndex;
            } else if (historyIndexRef.current === 0) {
              clearLine(term, lineBuffer.length);
              lineBuffer = '';
              cursorPos = 0;
              historyIndexRef.current = -1;
            }
          } else if (data === '\x1b[C') {
            // Right arrow - Move cursor right
            if (cursorPos < lineBuffer.length) {
              term.write('\x1b[C');
              cursorPos++;
            }
          } else if (data === '\x1b[D') {
            // Left arrow - Move cursor left
            if (cursorPos > 0) {
              term.write('\x1b[D');
              cursorPos--;
            }
          } else if (data === '\x1b[3~') {
            // Delete key - Delete character at cursor
            if (cursorPos < lineBuffer.length) {
              lineBuffer = lineBuffer.slice(0, cursorPos) + lineBuffer.slice(cursorPos + 1);
              term.write(lineBuffer.slice(cursorPos) + ' ');
              term.write('\x1b[' + (lineBuffer.length - cursorPos + 1) + 'D');
            }
          } else if (data === '\x1b[H') {
            // Home key - Move to start
            if (cursorPos > 0) {
              term.write('\x1b[' + cursorPos + 'D');
              cursorPos = 0;
            }
          } else if (data === '\x1b[F') {
            // End key - Move to end
            if (cursorPos < lineBuffer.length) {
              term.write('\x1b[' + (lineBuffer.length - cursorPos) + 'C');
              cursorPos = lineBuffer.length;
            }
          }
        } else if (code >= 32) {
          // Printable characters - Insert at cursor position
          lineBuffer = lineBuffer.slice(0, cursorPos) + data + lineBuffer.slice(cursorPos);
          cursorPos++;
          // Redraw from cursor position
          term.write(lineBuffer.slice(cursorPos - 1));
          if (cursorPos < lineBuffer.length) {
            term.write('\x1b[' + (lineBuffer.length - cursorPos) + 'D');
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const clearLine = (term: any, length: number) => {
    // Get current dir for prompt
    const dir = currentDirRef.current.replace(/^\/root/, '~');
    term.write('\r' + ' '.repeat(length + dir.length + 4) + '\r');
    term.write(`\x1b[1;34m${dir}\x1b[0m \x1b[1;32m$\x1b[0m `);
  };

  const writePrompt = (term: any) => {
    // Show current directory in prompt
    const dir = currentDirRef.current.replace(/^\/root/, '~');
    term.write(`\x1b[1;34m${dir}\x1b[0m \x1b[1;32m$\x1b[0m `);
  };

  const executeCommand = async (command: string, term: any) => {
    try {
      let actualCommand = command;
      let isCdCommand = false;

      // Handle cd commands specially to maintain working directory
      if (command.trim().startsWith('cd ') || command.trim() === 'cd') {
        isCdCommand = true;
        // Execute cd and get new working directory
        actualCommand = `cd ${currentDirRef.current} && ${command} && pwd`;
      } else {
        // Prepend current directory to all other commands
        actualCommand = `cd ${currentDirRef.current} && ${command}`;
      }

      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          command: actualCommand,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.stdout) {
          // Write each line separately to preserve formatting
          const lines = data.stdout.split('\n');

          if (isCdCommand) {
            // For cd commands, the last line is the new pwd
            const outputLines = lines.filter((line: string) => line.trim());
            if (outputLines.length > 0) {
              const newDir = outputLines[outputLines.length - 1].trim();
              if (newDir.startsWith('/')) {
                currentDirRef.current = newDir;
                // Notify parent component of directory change
                if (onDirectoryChange) {
                  onDirectoryChange(newDir);
                }
              }
            }
            // Don't print pwd output for cd commands
          } else {
            lines.forEach((line: string) => {
              term.writeln(line);
            });
          }
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
