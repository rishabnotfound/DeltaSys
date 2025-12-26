import { NextRequest, NextResponse } from 'next/server';
import { NodeSSH } from 'node-ssh';

interface StatsRequest {
  ipAddress: string;
  username: string;
  password: string;
  port: number;
}

async function executeSSHCommands(config: StatsRequest, commands: string[]): Promise<string[]> {
  const ssh = new NodeSSH();

  try {
    await ssh.connect({
      host: config.ipAddress,
      port: config.port,
      username: config.username,
      password: config.password,
      readyTimeout: 20000,
      tryKeyboard: true,
    });

    const results: string[] = [];

    for (const command of commands) {
      try {
        const result = await ssh.execCommand(command);
        results.push(result.stdout || '0');
      } catch (err) {
        results.push('0');
      }
    }

    ssh.dispose();
    return results;
  } catch (error: any) {
    ssh.dispose();
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: StatsRequest = await request.json();

    const commands = [
      "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'",
      "free | grep Mem | awk '{print ($3/$2) * 100.0}'",
      "free -m | grep Mem | awk '{printf \"%.1f\", $3/1024}'",
      "free -m | grep Mem | awk '{printf \"%.1f\", $2/1024}'",
      "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'",
      "df -h / | tail -1 | awk '{print $3}'",
      "df -h / | tail -1 | awk '{print $2}'",
      "awk '{print $1}' /proc/uptime",
      "cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1 | awk '{rx=$2/1024/1024/1024; printf \"%.2f GB\", rx}'",
      "cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1 | awk '{tx=$10/1024/1024/1024; printf \"%.2f GB\", tx}'",
      "nproc",
      "uptime | awk -F'load average:' '{print $2}' | awk '{print $1, $2, $3}'",
      // Network speed calculation (sample over 1 second)
      "rx1=$(cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1 | awk '{print $2}'); sleep 1; rx2=$(cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1 | awk '{print $2}'); echo \"$rx1 $rx2\" | awk '{speed=($2-$1)/1024; if(speed>1024) printf \"%.2f MB/s\", speed/1024; else printf \"%.2f KB/s\", speed}'",
      "tx1=$(cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1 | awk '{print $10}'); sleep 1; tx2=$(cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1 | awk '{print $10}'); echo \"$tx1 $tx2\" | awk '{speed=($2-$1)/1024; if(speed>1024) printf \"%.2f MB/s\", speed/1024; else printf \"%.2f KB/s\", speed}'"
    ];

    const outputs = await executeSSHCommands(body, commands);

    const stats = {
      cpu: parseFloat(outputs[0].trim()) || 0,
      ram: parseFloat(outputs[1].trim()) || 0,
      ramUsed: parseFloat(outputs[2].trim()) || 0,
      ramTotal: parseFloat(outputs[3].trim()) || 0,
      disk: parseFloat(outputs[4].trim()) || 0,
      diskUsed: outputs[5].trim() || '0',
      diskTotal: outputs[6].trim() || '0',
      uptime: parseFloat(outputs[7].trim()) / 86400 || 0,
      networkRx: outputs[8].trim() || '0 GB',
      networkTx: outputs[9].trim() || '0 GB',
      cpuCores: parseInt(outputs[10].trim()) || 0,
      loadAverage: outputs[11].trim() || '0',
      networkRxSpeed: outputs[12].trim() || '0 KB/s',
      networkTxSpeed: outputs[13].trim() || '0 KB/s',
      lastUpdated: Date.now(),
    };

    return NextResponse.json({ success: true, stats }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    const errorLevel = error?.level || 'unknown';

    console.error('Error fetching server stats:', {
      message: errorMessage,
      level: errorLevel,
      fullError: error
    });

    let userMessage = 'Failed to fetch server stats';
    if (errorLevel === 'client-authentication') {
      userMessage = 'Authentication failed. Please check username and password.';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      userMessage = 'Connection refused. Check IP address and port.';
    } else if (errorMessage.includes('ETIMEDOUT')) {
      userMessage = 'Connection timeout. Check firewall settings.';
    } else if (errorMessage.includes('ENOTFOUND')) {
      userMessage = 'Server not found. Check IP address.';
    }

    return NextResponse.json(
      { success: false, error: userMessage, details: errorMessage },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}
