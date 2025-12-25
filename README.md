<p align="center">
      <img
        src="./public/logo.png"
        width="200"
        height="200"
      />
    </p>

# <p align="center">DeltaSys</p>

A modern server management dashboard for monitoring and managing your VPS servers via SSH. Built with Next.js and featuring a sleek true black theme.

## Features

- **Real-time SSH Monitoring** - Live CPU, RAM, disk usage, and network speed tracking
- **File Manager** - Browse, create, edit, and delete files directly on your servers
- **Integrated Terminal** - Execute commands via built-in xterm.js terminal
- **Server Management** - Add, edit, and delete server configurations with SSH verification
- **Detailed Stats View** - Circular progress bars, network traffic graphs, and system information
- **Data Import/Export** - Backup and restore your server configurations
- **Smart Validation** - Prevents duplicate IPs and verifies SSH credentials before saving

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Visit `http://localhost:3000` to access the dashboard.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **node-ssh** - SSH2 client for server connections
- **xterm.js** - Terminal emulation

## Usage

### Adding a Server

1. Click the **+** button in the top-right corner
2. Fill in server details (IP, SSH credentials, etc.)
3. The system will verify SSH connection before saving
4. Server appears in your dashboard with live stats

### Managing Servers

- **View Stats** - Click the graph icon for detailed metrics and network speed
- **File Manager & Terminal** - Click the terminal icon for full server access
- **Edit** - Modify server details (validates SSH connection)
- **Delete** - Remove server (requires IP confirmation)

### Settings

Access via the gear icon in the navbar:
- **Export** - Download server configurations as JSON
- **Import** - Restore from backup file
- **Clear All Data** - Delete all servers (requires typing "DELETE IT")

## Security Notes

⚠️ **Important**: Server credentials are stored in browser localStorage. This application is intended for:
- Personal development environments
- Local network servers
- Non-production use cases

For production deployments, implement proper encryption and backend authentication.

## Configuration

Edit `config.js` to customize the project name:
```js
export const project_name = 'DeltaSys';
```

## License

MIT - Made with ❤️ by R

## Links

- [GitHub Repository](https://github.com/rishabnotfound/DeltaSys)
