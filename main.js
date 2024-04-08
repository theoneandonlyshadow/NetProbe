const { app, Tray, Menu, Notification } = require('electron');

app.setAppUserModelId('MaxTac Automation'); // this name will display in the very top of the notification like a header.

let tray = null;
let notificationShown = false; // for connection lost
let onlineNotificationShown = false; // Ffor connection restored

app.on('ready', async () => {
  const isOnline = await import('is-online');

  tray = new Tray('pepe.png'); // add your own icon path but first check readme.md
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Fire', type: 'normal', click: () => app.quit() } // you can use Quit instead of Fire. By clicking it, you close the app.
  ]);
  tray.setToolTip('NetProbe - MaxTac'); // when you hover your mouse to the system tray app, you wil see this name.
  tray.setContextMenu(contextMenu);

  setInterval(async () => {
    const online = await isOnline.default();
    if (!online && !notificationShown) {
      new Notification({
        title: 'Connection Lost',
        body: 'Internet Connection has been lost',
        silent: false
      }).show();
      notificationShown = true;
      onlineNotificationShown = false; // reset the online notification flag
    } else if (online && !onlineNotificationShown) {
      new Notification({
        title: 'Connection Restored',
        body: 'Internet Connection has been restored',
        silent: false
      }).show();
      onlineNotificationShown = true;
      notificationShown = false; // reset the offline notification flag
    }
  }, 1000); // checks every second
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
