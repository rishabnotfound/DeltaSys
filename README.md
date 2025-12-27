<p align="center">
      <img
        src="./public/logo.png"
        width="200"
        height="200"
      />
    </p>

# <p align="center">DeltaSys</p>

A modern server management dashboard for monitoring and managing your VPS servers via SSH & Xterm.js terminal emulation.

## Features

### Server Management
- **Real-time SSH Monitoring** - Live CPU, RAM, disk usage, and network speed tracking
- **Server Cards** - Hover glow effects, copy credentials to clipboard
- **Smart Validation** - Prevents duplicate IPs and verifies SSH credentials
- **Data Import/Export** - Backup and restore server configurations

### File Explorer
- **Hierarchical Sorting** - Hidden files first, then folders A-Z, then files A-Z
- **Drag & Drop Upload** - 1 file at a time, 100KB max, images & code only
- **Monaco Code Editor** - Syntax highlighting, Ctrl+S to save and auto-close
- **Image Viewer** - Pan with mouse, zoom with scroll wheel (50%-500%)
- **Smart File Operations** - Create, rename, delete with progress indicators

### Terminal
- **Full Keybind Support** - Ctrl+C, Ctrl+L, Ctrl+A/E/U/K/W, arrows, Home/End, Delete
- **Command History** - Navigate with up/down arrows
- **Directory Persistence** - cd commands persist across sessions
- **File Explorer Sync** - Terminal directory syncs with file explorer

### UI/UX
- **Custom Notifications** - Toast messages instead of browser alerts
- **Loading Progress** - Visual feedback for all operations
- **Split View** - Resizable file explorer and terminal panels

## Preview

<p align="center">
  <img src="https://github.com/user-attachments/assets/4f67151a-66f0-44a2-a292-e2686054cdb6" width="720" alt="Preview 1" />
</p>

<br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/3288e06f-b7c3-460c-9c57-d1f54debeead" width="310" alt="Preview 2" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://github.com/user-attachments/assets/c0375eec-b570-4bb7-846c-2635c1130926" width="310" alt="Preview 3"/>
</p>

<br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/9db48703-a08f-4b5b-be1b-ce039bf173c0" width="720" alt="Preview 4" />
</p>

<br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/20992516-901c-4118-9cfc-f84371affaf8" width="900" alt="Preview 5" />
</p>


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
- **Monaco Editor** - VS Code editor for file editing

## Usage

### Adding a Server

1. Click the **+** button in the top-right corner
2. Fill in server details (IP, SSH credentials, etc.)
3. The system will verify SSH connection before saving
4. Server appears in your dashboard with live stats

### Managing Servers

- **View Stats** - Click the graph icon for detailed metrics and network speed
- **File Explorer & Terminal** - Click the terminal icon for split-view access
  - Drag files to upload (100KB max, images & code only)
  - Double-click to edit with Monaco, click images to view with zoom
  - Use terminal with full keybinds and persistent directories
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

Edit `config.js` to customize:
```js
export const project_name = 'DeltaSys';
export const ascii_art = '...'; // Terminal welcome ASCII art
export const terminal_welcome_message = '...'; // Terminal welcome text
```

## License

[MIT](LICENSE) - Made with ❤️ by R

## Links

- [GitHub Repository](https://github.com/rishabnotfound/DeltaSys)
