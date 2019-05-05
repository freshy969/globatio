// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')

//-------------------------------------------------------------
const globatio=require('./globatio.js')
const path = require('path')
const statefile = path.resolve(__dirname, '../state.json')
//-------------------------------------------------------------

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

//-------------------------------------------------------------
//-------------------------------------------------------------
const {ipcMain} = require('electron')

//-------------------------------------------------------------
// search related 
//-------------------------------------------------------------
ipcMain.on('asynchronous-request-search', (event, arg) => {
//ipcMain.on('asynchronous-searchrequest', (event, arg) => {
	globatio.searchresults.length=0
	console.log('searching ...')
	globatio.search(arg)
	//console.log(globatio.searchresults)
	event.sender.send('asynchronous-searchrequest-reply', globatio.searchresults)
})

//-------------------------------------------------------------
ipcMain.on('asynchronous-refresh-searchresults', (event, arg) => {

//ipcMain.on('asynchronous-searchrefresh', (event, arg) => {
  //console.log(globatio.searchresults)
  event.sender.send('asynchronous-refresh-searchresults-reply', globatio.searchresults)//txtsearchreply)

//	event.sender.send('asynchronous-searchrefresh-reply', globatio.searchresults)//txtsearchreply)
})
//-------------------------------------------------------------
// basket items related
//-------------------------------------------------------------
//ipcMain.on('asynchronous-save-item', (event, arg) => {
ipcMain.on('asynchronous-addbasketitem', (event, arg) => {


  console.log('asynchronous-addbasketitem : ',arg)
  
  var newitem={description:globatio.searchresults[arg].description,
      link:globatio.searchresults[arg].link,
      attachementdirectory:''
      
  }
  
  //globatio.basketitems.push(newbasketitem)
  globatio.addBasketItem(newitem)
  globatio.saveState(statefile)
  })
//-------------------------------------------------------------
//ipcMain.on('asynchronous-refresh-basketitems', (event, arg) => {

ipcMain.on('asynchronous-refresh-basketitems', (event, arg) => {
  //console.log('sending :',p2pitems.returnAddedItems()) // prints "ping"
  
  event.sender.send('asynchronous-refresh-basketitems-reply', globatio.basketitems)
})
//-------------------------------------------------------------
//ipcMain.on('asynchronous-delete-basketitem', (event, arg) => {

ipcMain.on('asynchronous-delete-basketitem', (event, arg) => {
  console.log('deleting basket item number: %s',arg) // prints "ping"
globatio.destroyBasketItem(parseInt(arg))
globatio.saveState(statefile)
    
  //event.sender.send('asynchronous-addeditemsrequest-reply', p2pitems.returnAddedItems())
})
//-------------------------------------------------------------
//-------------------------------------------------------------
// profile items related
//-------------------------------------------------------------
//ipcMain.on('asynchronous-save-item', (event, arg) => {
ipcMain.on('asynchronous-addprofileitem', (event, arg) => {


  //console.log('asynchronous-addprofileitem : ',arg)
  /*var tempitemdetails=arg.split(";")
  var tempitemfiles=tempitemdetails[1]
  var newitem={description:globatio.searchresults[arg].description,
      link:globatio.searchresults[arg].link,
      attachementdirectory:''
      
  }*/
  
  //globatio.basketitems.push(newbasketitem)
  globatio.addProfileItem(arg)
  globatio.saveState(statefile)
  
  })
//-------------------------------------------------------------
//ipcMain.on('asynchronous-refresh-basketitems', (event, arg) => {

ipcMain.on('asynchronous-refresh-profileitems', (event, arg) => {
  //console.log('sending :',p2pitems.returnAddedItems()) // prints "ping"
  
  event.sender.send('asynchronous-refresh-profileitems-reply', globatio.profileitems)
})
//-------------------------------------------------------------
//ipcMain.on('asynchronous-delete-basketitem', (event, arg) => {

ipcMain.on('asynchronous-delete-profileitem', (event, arg) => {
  console.log('deleting profile item number: %s',arg) // prints "ping"
globatio.destroyProfileItem(parseInt(arg))
globatio.saveState(statefile)
    
  //event.sender.send('asynchronous-addeditemsrequest-reply', p2pitems.returnAddedItems())
})
//-------------------------------------------------------------

//-------------------------------------------------------------

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon:'./icons/logo.png',
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow)

app.on('ready', function(){

  createWindow()
  globatio.start()
  globatio.loadState(statefile)
  
  setTimeout(function (){
    globatio.initItems()
  }, 1000);
  
  })

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

//-------------------------------------
app.on('quit', function () {
  globatio.saveState(statefile)
  })
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
