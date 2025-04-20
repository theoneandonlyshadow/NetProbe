# NetProbe Mk.2
🖤 FOSS by MaxTac

NetProbe Mk.2 is a system tray application that monitors internet connectivity, logs connection status changes, and provides utility features like clearing DNS cache and viewing logs. Built using Node.js, it is designed to work seamlessly on Windows, macOS, and Linux.

---
[Codebase Documentation](https://github.com/theoneandonlyshadow/NetProbe/blob/Mk.2/moreDocs.md)
---

## Features

- **Real-Time Internet Monitoring**:
  - Notifies when the internet connection is lost or restored.
  - Tracks total internet downtime and displays it in the system tray.

- **DNS Cache Management**:
  - Clear the local DNS cache directly from the system tray.

- **Log Management**:
  - Automatically logs connection status changes to a file (`netprobe_log.txt`).
  - Open logs directly from the system tray for easy access.

- **Cross-Platform Support**:
  - Works on Windows, macOS, and Linux.
  - DNS cache clearing commands tailored for each operating system.

---

## Installation

### Prerequisites
- Node.js >= 16
- npm (Node.js package manager)

### Steps for development
1. Clone this repository:
   ```bash
   git clone https://github.com/theoneandonlyshadow/netprobe.git
   cd netprobe-mk2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application:
   ```bash
   node netprobe.js
   ```

---

# [Steps to download](https://github.com/theoneandonlyshadow/NetProbe/releases/tag/Mk.2)

## Usage

Once launched, NetProbe Mk.2 will initialize in the system tray with the following options:

1. **Downtime**:
   - Displays total internet downtime in `HH:MM:SS` format.
   - Updates dynamically as downtime is tracked.

2. **Clear DNS Cache**:
   - Clears the DNS cache of your system based on the platform-specific command.

3. **Open Logs**:
   - Opens the `netprobe_log.txt` file, which contains detailed logs of connection status changes.
   - If NetProbe did not start or is having issues, check logs.

4. **Enable/Disable NetProbe**:
   - Toggle NetProbe monitoring on or off.

5. **Exit**:
   - Closes the application and stops all monitoring.

---

## Notifications

- **Connection Lost**:
  - Displays a system notification with the message "Internet Connection Lost".
  - Starts tracking downtime.

- **Connection Restored**:
  - Displays a system notification with the message "Internet Connection Restored".
  - Stops tracking downtime and updates the total downtime in the system tray.

---

## Logs

All events are logged in `netprobe_log.txt`. Feel free to open it and clear logs if you think the size built up is too much.

---

## System Requirements

- **Operating Systems**:
  - Windows 7/10/11
  - macOS High Sierra or later
  - Linux (Debian-based distributions)

- **Node.js**:
  - Version 16 or higher

---

## Development

### File Structure
```
/assets                 # Icons for notifications and system tray
netprobe.js             # Main application script
netprobe_log.txt        # Auto-generated log file
package.json            # npm configuration
README.md               # Documentation
```

### Key Dependencies
- [`systray2`](https://www.npmjs.com/package/systray2) - For creating system tray menus.
- [`node-notifier`](https://www.npmjs.com/package/node-notifier) - For cross-platform notifications.
- [`is-online`](https://www.npmjs.com/package/is-online) - For internet connectivity checks.

---

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

---

## License

This project is licensed by MaxTac under the [MIT License](LICENSE).

---

## Project Activity

![Alt](https://repobeats.axiom.co/api/embed/8337f992a8449db1bac59a4d4fec14003c7f5547.svg "Repobeats analytics image")

## Credits

- **Developer**: [Madhav Nair](https://github.com/theoneandonlyshadow)
- **Icons**: made by [Canva](https://canva.com)
