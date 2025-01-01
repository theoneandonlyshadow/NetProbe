const SysTray = require('systray2').default;
const notifier = require('node-notifier');
const isonline = require('is-online');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs').promises;

let isEnabled = true; 
let checkInterval;

const stuffInTray = {
  clearDNS: { title: 'Clear DNS Cache', tooltip: 'Clear the local DNS cache', enabled: true },
  toggle: { title: 'Disable', tooltip: 'Enable or Disable NetProbe', enabled: true },
  openLog: { title: 'Open Logs', tooltip: 'Open logs created by NetProbe', enabled: true },
  exit: { title: 'Exit', tooltip: 'Exit the application', enabled: true },
};

const systray = new SysTray({
  menu: {
      icon: './tau.png',
      isTemplateIcon: os.platform() === 'darwin',
      title: 'NetProbe Mk.2',
      tooltip: 'NetProbe',
      items: [
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

// Notification function
const connRestored = () => {
  notifier.notify({
    title: 'Connection Restored',
    message: 'Internet Connection Restored',
    appID: 'NetProbe Mk.2'.trim(),
    icon: './restored.png',
    sound: true, // Play system notification sound
    wait: false, // Do not wait for user interaction
  });
  logConnectionStatus('RESTORED');
};

const connLost = () => {
  notifier.notify({
    title: 'Connection Lost',
    message: 'Internet Connection Lost',
    appID: 'NetProbe Mk.2'.trim(),
    icon: './lost.png',
    sound: true, // Play system notification sound
    wait: false, // Do not wait for user interaction
  });
    logConnectionStatus('LOST');
};

const logConnectionStatus = (status) => {
    const logConnStat = `Connection ${status} :: ${new Date().toString()}\n`;
    fs.appendFile('netprobe_log.txt', logConnStat, (err) => {
      if (err) {
        console.error('Error logging connection status:', err);
      } else {
        console.log('Connection status logged.');
      }
    });
  };

  const logDNSCache = (response) => {
    const logDNSCat = `${response} :: ${new Date().toString()}\n`;
    fs.appendFile('netprobe_log.txt', logDNSCat, (err) => {
      if (err) {
        console.error('Error logging DNS Cache status:', err);
      } else {
        console.log('DNS status logged.');
      }
    });
  };

  const logDisDis = () => {
    const logDisCat = `NetProbe DISABLED BY USER :: ${new Date().toString()}\n`;
    fs.appendFile('netprobe_log.txt', logDisCat, (err) => {
      if (err) {
        console.error('Error logging NetProbe Disbaled status:', err);
      } else {
        console.log('Disable status logged.');
      }
    });
  };

  const logDisEn = () => {
    const logEnCat = `NetProbe ENABLED BY USER :: ${new Date().toString()}\n`;
    fs.appendFile('netprobe_log.txt', logEnCat, (err) => {
      if (err) {
        console.error('Error logging NetProbe Enabled status:', err);
      } else {
        console.log('Enable status logged.');
      }
    });
  };

const clearDnsCache = () => {
    const platform = os.platform();
  
    let command = '';
  
    if (platform === 'win32' || 'win64') {
      command = 'ipconfig /flushdns';  // For Windows
    } else if (platform === 'darwin') {
      command = 'sudo killall -HUP mDNSResponder';  // For macOS
    } else if (platform === 'linux') {
      command = 'sudo systemd-resolve --flush-caches';  // For most Linux distros
    } else {
      logDNSCache('OS doesnt support DNS cache clearing');
      return;
    }
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logDNSCache(`Error clearing DNS cache: ${error.message}`);
        return;
      }
      if (stderr) {
        logDNSCache(`STDERR while performing DNS cache clear: ${stderr}`);
        return;
      }
      logDNSCache(`DNS cache cleared: ${stdout}`);
    });
  };

  const logNPExit = () => {
    const logExitCat = `NetProbe SHUTDOWN BY USER :: ${new Date().toString()}\n`;
    fs.appendFile('netprobe_log.txt', logExitCat, (err) => {
      if (err) {
        console.error('Error logging NetProbe Exit status:', err);
      } else {
        console.log('Exit status logged');
      }
    });
  };

  let openFile=function(filePath,mute){
    let command=(function() {
      switch (process.platform) { 
          case 'darwin' : return 'open '+filePath+' && lsof -p $! +r 1 &>/dev/null';
          case 'win32' : return 'start /wait '+filePath;
          case 'win64' : return 'start /wait '+filePath;
          default : return 'xdg-open '+filePath+' && tail --pid=$! -f /dev/null';
      }
  })();
    if(!mute)console.log(command);
    let child=exec(command);
    if(!mute)child.stdout.pipe(process.stdout);
    
    return new function(){
        this.on=function(type,callback){
            if(type==='data')child.stdout.on('data',callback);
            else if(type==='error')child.stderr.on('data',callback);
            else child.on('exit',callback);
            return this;
        };
        this.toPromise=function(){
            return new Promise((then,fail)=>{
                let out=[];
                this.on('data',d=>out.push(d))
                .on('error',err=>fail(err))
                .on('exit',()=>then(out));
            });
        };
    }();
};

async function checkIfLogExists() {
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
}

  // main fn

  systray.onClick(action => {
    if (action.item.title === "Exit") {
      logNPExit();
      systray.kill(false);
    } else if (action.item.title === "Open Logs") {
      checkIfLogExists();
    } else if (action.item.title === "Clear DNS Cache") {
      clearDnsCache();
      console.log("DNS Cache Cleared");
    } else if (action.item.title === "Disable" || action.item.title === "Enable") {
      isEnabled = !isEnabled; // Toggle the enabled state
      action.item.title = isEnabled ? 'Disable' : 'Enable';
      console.log(isEnabled ? "NetProbe Enabled" : "NetProbe Disabled");
        systray.sendAction({
        type: 'update-item',
        item: {
          ...action.item,
          title: action.item.title,
        },
        seq_id: action.seq_id,
      });
  
      if (isEnabled) {
        logDisEn();
        startCheckingInternet();
      } else {
        logDisDis();
        clearInterval(checkInterval);
      }
    }
  });
  
  let notificationShown = false; // for connection lost
  let onlineNotificationShown = false; // for connection restored
  
  // Function to start internet checking
  const startCheckingInternet = () => {
    checkInterval = setInterval(async () => {
      if (!isEnabled) return; // Stop checking if disabled
  
      const online = await isonline.default();
      if (!online && !notificationShown) {
        connLost();
        notificationShown = true;
        onlineNotificationShown = false; // Reset the online notification flag
      } else if (online && !onlineNotificationShown) {
        connRestored();
        onlineNotificationShown = true;
        notificationShown = false; // Reset the offline notification flag
      }
    }, 400); // checks every second
  };
  
const NPInit = () => {
    const logNPCat = `NetProbe INITIALIZED :: ${new Date().toString()}\n`;
    fs.appendFile('netprobe_log.txt', logNPCat, (err) => {
      if (err) {
        console.error('Error logging NetProbe Initilization status:', err);
      } else {
        console.log('NetProbe Initalization status logged.');
      }
    });
  };

systray.ready().then(() => {
  NPInit();
  startCheckingInternet();
}).catch(err => {
  console.log('NetProbe failed to start:' + err.message);
});
