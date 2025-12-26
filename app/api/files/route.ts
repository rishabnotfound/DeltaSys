import { NextRequest, NextResponse } from 'next/server';
import { NodeSSH } from 'node-ssh';

interface FileRequest {
  ipAddress: string;
  username: string;
  password: string;
  port: number;
  action: 'list' | 'read' | 'write' | 'delete' | 'mkdir' | 'rename' | 'upload';
  path: string;
  content?: string;
  newPath?: string;
  encoding?: 'base64';
}

async function connectSSH(config: FileRequest) {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: config.ipAddress,
    port: config.port,
    username: config.username,
    password: config.password,
    readyTimeout: 20000,
    tryKeyboard: true,
  });
  return ssh;
}

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function POST(request: NextRequest) {
  let ssh: NodeSSH | null = null;

  try {
    const body: FileRequest = await request.json();
    ssh = await connectSSH(body);

    switch (body.action) {
      case 'list': {
        const result = await ssh.execCommand(`ls -la "${body.path}"`);
        const lines = result.stdout.split('\n').slice(1); // Skip "total" line

        const files = lines
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split(/\s+/);
            const permissions = parts[0];
            const name = parts.slice(8).join(' ');

            if (name === '.' || name === '..') return null;

            return {
              name,
              isDirectory: permissions.startsWith('d'),
              permissions,
              size: parts[4],
              modified: `${parts[5]} ${parts[6]} ${parts[7]}`,
            };
          })
          .filter(Boolean);

        ssh.dispose();
        return NextResponse.json({ success: true, files }, { headers: noCacheHeaders });
      }

      case 'read': {
        const result = await ssh.execCommand(`cat "${body.path}"`);
        ssh.dispose();
        return NextResponse.json({ success: true, content: result.stdout }, { headers: noCacheHeaders });
      }

      case 'write': {
        // Escape content for safe transmission
        const escapedContent = body.content?.replace(/'/g, "'\\''") || '';
        await ssh.execCommand(`echo '${escapedContent}' > "${body.path}"`);
        ssh.dispose();
        return NextResponse.json({ success: true }, { headers: noCacheHeaders });
      }

      case 'upload': {
        // Handle file upload with base64 encoding
        if (!body.content) {
          ssh.dispose();
          return NextResponse.json(
            { success: false, error: 'No content provided' },
            { status: 400, headers: noCacheHeaders }
          );
        }

        const tempFile = `/tmp/upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        try {
          // Write base64 content to temp file
          await ssh.execCommand(`echo '${body.content}' | base64 -d > "${tempFile}"`);

          // Move to final destination
          await ssh.execCommand(`mv "${tempFile}" "${body.path}"`);

          // Set proper permissions
          await ssh.execCommand(`chmod 644 "${body.path}"`);

          ssh.dispose();
          return NextResponse.json({ success: true }, { headers: noCacheHeaders });
        } catch (uploadError: any) {
          // Cleanup temp file if it exists
          await ssh.execCommand(`rm -f "${tempFile}" 2>/dev/null`);
          ssh.dispose();
          return NextResponse.json(
            { success: false, error: uploadError.message || 'Upload failed' },
            { status: 500, headers: noCacheHeaders }
          );
        }
      }

      case 'delete': {
        await ssh.execCommand(`rm -rf "${body.path}"`);
        ssh.dispose();
        return NextResponse.json({ success: true }, { headers: noCacheHeaders });
      }

      case 'mkdir': {
        await ssh.execCommand(`mkdir -p "${body.path}"`);
        ssh.dispose();
        return NextResponse.json({ success: true }, { headers: noCacheHeaders });
      }

      case 'rename': {
        if (!body.newPath) {
          ssh.dispose();
          return NextResponse.json(
            { success: false, error: 'New path required' },
            { status: 400, headers: noCacheHeaders }
          );
        }
        await ssh.execCommand(`mv "${body.path}" "${body.newPath}"`);
        ssh.dispose();
        return NextResponse.json({ success: true }, { headers: noCacheHeaders });
      }

      default:
        ssh.dispose();
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400, headers: noCacheHeaders }
        );
    }
  } catch (error: any) {
    console.error('File operation error:', error);
    if (ssh) ssh.dispose();
    return NextResponse.json(
      { success: false, error: error.message || 'File operation failed' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
