import { NextRequest, NextResponse } from 'next/server';
import { NodeSSH } from 'node-ssh';

interface TerminalRequest {
  ipAddress: string;
  username: string;
  password: string;
  port: number;
  command: string;
}

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function POST(request: NextRequest) {
  let ssh: NodeSSH | null = null;

  try {
    const body: TerminalRequest = await request.json();

    ssh = new NodeSSH();
    await ssh.connect({
      host: body.ipAddress,
      port: body.port,
      username: body.username,
      password: body.password,
      readyTimeout: 20000,
      tryKeyboard: true,
    });

    const result = await ssh.execCommand(body.command);

    ssh.dispose();

    return NextResponse.json({
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code
    }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('Terminal command error:', error);
    if (ssh) ssh.dispose();
    return NextResponse.json(
      { success: false, error: error.message || 'Command execution failed' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
