# NetProbe Mk.2 Codebase Documentation

## Overview
NetProbe Mk.2 is a system tray application for monitoring internet connectivity. It provides functionalities such as clearing DNS cache, monitoring internet downtime, viewing logs, and enabling/disabling internet connection monitoring. This application is built using Node.js and integrates several useful libraries.

---

### Libraries Used
- `systray2`: For managing the system tray.
- `node-notifier`: For showing system notifications.
- `is-online`: To check internet connectivity.
- `fs/promises`: For asynchronous file system operations.
- `child_process`: To execute system commands.
- `os`: For platform-specific operations.

---

### Core Variables
```javascript
let isEnabled = true; // Tracks whether monitoring is enabled
let checkInterval; // Interval for periodic internet checks
let downtimeStart = null; // Tracks when downtime starts
let totalDowntime = 0; // Total downtime
let lastState = null; // Tracks the last known connection state
```

### System Tray Menu
The system tray menu is defined with multiple items:
```javascript
const stuffInTray = {
  clearDNS: { title: 'Clear DNS Cache', tooltip: 'Clear the local DNS cache', enabled: true },
  toggle: { title: 'Disable', tooltip: 'Enable or Disable NetProbe', enabled: true },
  openLog: { title: 'Open Logs', tooltip: 'Open logs created by NetProbe', enabled: true },
  exit: { title: 'Exit', tooltip: 'Exit the application', enabled: true },
  downtime: { title: 'Downtime: 00:00:00', tooltip: 'Shows internet downtime', enabled: false },
};
```

The menu items are updated dynamically based on user actions and internet status.

### Core Functions

#### Format Downtime
Formats the downtime in `hh:mm:ss` format.
```javascript
const formatDowntime = (milliseconds) => {
  const hours = String(Math.floor(milliseconds / 3600000)).padStart(2, '0');
  const minutes = String(Math.floor((milliseconds % 3600000) / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((milliseconds % 60000) / 1000)).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};
```

#### Update Downtime
Updates the displayed downtime in the system tray.
```javascript
const updateDowntimeInTray = () => {
  const formattedDowntime = formatDowntime(totalDowntime);
  stuffInTray.downtime.title = `Downtime: ${formattedDowntime}`;
  systray.sendAction({
    type: 'update-item',
    item: {
      ...stuffInTray.downtime,
      title: stuffInTray.downtime.title,
    },
  });
};
```

#### Connection Events
- **Connection Restored:** Logs and notifies when the connection is restored.
```javascript
const connRestored = () => {
  if (downtimeStart) {
    const downtimeEnd = new Date();
    totalDowntime += downtimeEnd - downtimeStart;
    downtimeStart = null;
    updateDowntimeInTray();
  }
  notifier.notify({
    title: 'Connection Restored',
    message: 'Internet Connection Restored',
    appID: 'NetProbe Mk.2',
    icon: './assets/restored.png',
    sound: true,
    wait: false,
  });
  logConnectionStatus('RESTORED');
};
```
- `sound` is set to `true` which means that there will be sound when the notification is shown.
- `wait` is set to `false` which means that the notification isnt gonna wait for user's interaction.

- **Connection Lost:** Logs and notifies when the connection is lost.
```javascript
const connLost = () => {
  downtimeStart = new Date();
  notifier.notify({
    title: 'Connection Lost',
    message: 'Internet Connection Lost',
    appID: 'NetProbe Mk.2',
    icon: './assets/lost.png',
    sound: true,
    wait: false,
  });
  logConnectionStatus('LOST');
};
```
- `sound` is set to `true` which means that there will be sound when the notification is shown.
- `wait` is set to `false` which means that the notification isnt gonna wait for user's interaction.

#### Clear DNS Cache
Clears the DNS cache based on the detected operating system.
```javascript
const clearDnsCache = () => {
  const platform = os.platform();
  let command = '';

  if (platform === 'win32' || platform === 'win64') {
    command = 'ipconfig /flushdns';
  } else if (platform === 'darwin') {
    command = 'sudo killall -HUP mDNSResponder';
  } else if (platform === 'linux') {
    command = 'sudo systemd-resolve --flush-caches';
  } else {
    logConnectionStatus(`OS doesn\'t support DNS cache clearing`);
    return;
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      logConnectionStatus(`Error clearing DNS cache: ${error.message}`);
      return;
    }
    logConnectionStatus(`DNS cache cleared: ${stdout}`);
  });
};
```
- `win64` means windows 64-bit OS.
- `darwin` means apple mac OS.
- `linux` means linux distributions.

#### Open Logs
Checks if the log file exists, creates it if necessary, and opens it.
```javascript
const checkIfLogExists = async () => {
  try {
    await fs.stat('./netprobe_log.txt');
    openFile('./netprobe_log.txt');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile('./netprobe_log.txt', 'NetProbe Log File was created.');
      openFile('./netprobe_log.txt');
    } else {
      console.error('Error checking or creating the log file:', err);
    }
  }
};
```

#### Start Monitoring
Periodically checks internet connectivity and logs status changes.
```javascript
const startCheckingInternet = () => {
  checkInterval = setInterval(async () => {
    if (!isEnabled) return;

    const online = await isonline.default();
    if (online && lastState !== 'online') {
      connRestored();
      lastState = 'online';
    } else if (!online && lastState !== 'offline') {
      connLost();
      lastState = 'offline';
    }
  }, 2000);
};
```

### Initialization
The application initializes the system tray and starts monitoring:
```javascript
systray.ready().then(() => {
  fs.appendFile('./netprobe_log.txt', `NetProbe initialized in the system tray :: ${new Date().toString()}\n`);
  startCheckingInternet();
}).catch((err) => {
  fs.appendFile('netprobe_log.txt', `NetProbe failed to start ${err} :: ${new Date().toString()}\n`);
  console.error('NetProbe failed to start:', err);
});
```

---

## [All other basic details](https://github.com/theoneandonlyshadow/netprobe/readme.md)

---

## Supported Platforms
- Windows
- macOS
- Linux

---

## License
MIT License under MaxTac distrubutions.
