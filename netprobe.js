const SysTray = require('systray2').default;
const notifier = require('node-notifier');
const isonline = require('is-online');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs').promises;

let isEnabled = true;
let checkInterval;

let downtimeStart = null;
let totalDowntime = 0;
let lastState = null;

const stuffInTray = {
  clearDNS: { title: 'Clear DNS Cache', tooltip: 'Clear the local DNS cache', enabled: true },
  toggle: { title: 'Disable', tooltip: 'Enable or Disable NetProbe', enabled: true },
  openLog: { title: 'Open Logs', tooltip: 'Open logs created by NetProbe', enabled: true },
  exit: { title: 'Exit', tooltip: 'Exit the application', enabled: true },
  downtime: { title: 'Downtime: 00:00:00', tooltip: 'Shows internet downtime', enabled: false },
};

const systray = new SysTray({
  menu: {
    icon: './assets/netprobe.ico',
    isTemplateIcon: os.platform() === 'darwin',
    title: 'NetProbe Mk.2',
    tooltip: 'NetProbe',
    items: [
      stuffInTray.downtime,
      stuffInTray.clearDNS,
      stuffInTray.toggle,
      SysTray.separator,
      stuffInTray.openLog,
      stuffInTray.exit,
    ],
  },
  debug: false,
  copyDir: true,
});

const formatDowntime = (milliseconds) => {
  const hours = String(Math.floor(milliseconds / 3600000)).padStart(2, '0');
  const minutes = String(Math.floor((milliseconds % 3600000) / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((milliseconds % 60000) / 1000)).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

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
    appID: 'NetProbe Mk.2'.trim(),
    icon: './assets/restored.png',
    sound: true,
    wait: false,
  });
  logConnectionStatus('RESTORED');
};

const connLost = () => {
  downtimeStart = new Date();
  notifier.notify({
    title: 'Connection Lost',
    message: 'Internet Connection Lost',
    appID: 'NetProbe Mk.2'.trim(),
    icon: './assets/lost.png',
    sound: true,
    wait: false,
  });
  logConnectionStatus('LOST');
};


const updateDowntimeWhileOffline = () => {
  if (downtimeStart) {
    const currentDowntime = new Date() - downtimeStart + totalDowntime;
    stuffInTray.downtime.title = `Downtime: ${formatDowntime(currentDowntime)}`;
    systray.sendAction({
      type: 'update-item',
      item: {
        ...stuffInTray.downtime,
        title: stuffInTray.downtime.title,
      },
    });
  }
};

const logConnectionStatus = (status) => {
  const logConnStat = `Connection ${status} :: ${new Date().toString()}\n`;
  fs.appendFile('netprobe_log.txt', logConnStat).catch(console.error);
};

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
    logConnectionStatus(`OS doesnt support DNS cache clearing`);
    fs.appendFile('netprobe_log.txt', `OS doesnt support DNS cache clearing :: ${new Date().toString()}\n`);
    return;
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      fs.appendFile('netprobe_log.txt', `Error clearing DNS cache: ${error.message} :: ${new Date().toString()}\n`);
      logConnectionStatus(`Error clearing DNS cache: ${error.message}`);
      return;
    }
    if (stderr) {
      fs.appendFile('netprobe_log.txt', `STDERR while clearing DNS cache${stderr} :: ${new Date().toString()}\n`);
      logConnectionStatus(`STDERR while clearing DNS cache: ${stderr}`);
      return;
    }
    logConnectionStatus(`DNS cache cleared: ${stdout}`);
  });
};

const checkIfLogExists = async () => {
  try {
    await fs.stat('./netprobe_log.txt');
    openFile('./netprobe_log.txt');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile('./netprobe_log.txt', 'NetProbe Log File was absent/deleted before opening. Hence a blank file was created.');
      openFile('./netprobe_log.txt');
    } else {
      console.error('Error checking or creating the log file:', err);
    }
  }
};

const openFile = (filePath) => {
  const platform = os.platform();
  const command = platform === 'win32' || platform === 'win64' ? `start ${filePath}` : platform === 'darwin' ? `open ${filePath}` : `xdg-open ${filePath}`;
  exec(command, (err) => {
    if (err) console.error('Error opening log file:', err);
  });
};

systray.onClick((action) => {
  if (action.item.title === 'Exit') {
    systray.kill(false);
  } else if (action.item.title === 'Open Logs') {
    checkIfLogExists();
  } else if (action.item.title === 'Clear DNS Cache') {
    clearDnsCache();
  } else if (action.item.title === 'Disable' || action.item.title === 'Enable') {
    isEnabled = !isEnabled;
    action.item.title = isEnabled ? 'Disable' : 'Enable';
    systray.sendAction({
      type: 'update-item',
      item: {
        ...action.item,
        title: action.item.title,
      },
      seq_id: action.seq_id,
    });

    if (isEnabled) {
      startCheckingInternet();
    } else {
      clearInterval(checkInterval);
    }
  }
});

let lastStatus = null;
let isFirstCheck = true; 
let debounceTimer = null;

const startCheckingInternet = () => {
  checkInterval = setInterval(async () => {
    if (!isEnabled) return;

    const online = await isonline.default();

    // debounce logic: wait for a stable state
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      if (isFirstCheck) {
        lastStatus = online ? 'online' : 'offline';
        isFirstCheck = false;
        return;
      }

      if (online && lastStatus !== 'online') {
        connRestored();
        lastStatus = 'online';
      } else if (!online && lastStatus !== 'offline') {
        connLost();
        lastStatus = 'offline';
      }
    }, 1000); // debounce interval: 1 second
  }, 2000); // polling interval: 2 seconds
};



systray.ready().then(() => {
  fs.appendFile('./netprobe_log.txt', `NetProbe initialized in the system tray :: ${new Date().toString()}\n`);
 // console.log('NetProbe initialized in the system tray');
  startCheckingInternet();
}).catch((err) => {
  fs.appendFile('netprobe_log.txt', `NetProbe failed to start ${err} :: ${new Date().toString()}\n`);
  console.error('NetProbe failed to start:', err);
});
