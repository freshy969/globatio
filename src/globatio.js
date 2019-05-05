

const fork = require('child_process').fork;
//-------------------------------------------------------

const crypto = require('crypto')
const Swarm = require('discovery-swarm')
const defaults = require('dat-swarm-defaults')
const getPort = require('get-port')


var WebTorrent = require('webtorrent')
var client = new WebTorrent()

const fs = require('fs')
const path = require('path');


const jsonfile = require('jsonfile')

const maxrelayed=7

 // Here we will save our TCP peer connections
 // using the peer id as key: { peer_id: TCP_Connection }
 
const peers = {}
// Counter for connections, used for identify connections
let connSeq = 0

// Peer Identity, a random hash for identify your peer
const localid = crypto.randomBytes(32)
console.log('Your identity: ' + localid.toString('hex'))
console.log(path.resolve(__dirname, '../'))


// * Default DNS and DHT servers
// * This servers are used for peer discovery and establishing connection

const config = defaults({
  // peer-id
  id: localid,
})

// discovery-swarm library establishes a TCP p2p connection and uses
// discovery-channel library for peer discovery
 
const sw = Swarm(config)


module.exports=new class {
//----------------------------------------
constructor(){

this.searchresults = []
//this.searchresultslastid=0

this.addeditems= []// items user added
this.addeditemslastid=0

this.basketitems= []// items user found in the search results and basket
this.basketitemslastid=0

this.taggeditems= []// loved items
this.taggeditemslastid=0

this.localcache=1
this.searchtext=''

}
//----------------------------------------
loadState(statefile){
jsonfile.readFile(statefile,this)
  .then(obj => {

	this.searchresults = obj.searchresults
	//this.searchresultslastid=obj.

	this.addeditems= obj.addeditems
	this.addeditemslastid=obj.addeditemslastid

	this.basketitems= obj.basketitems
	this.basketitemslastid=obj.basketitemslastid

	this.taggeditems= obj.taggeditems
	this.taggeditemslastid=obj.taggeditemslastid


})
  .catch(error => console.log(error))

//-----------------------------------------
//-----------------------------------------

}
//----------------------------------------
saveState(statefile){
jsonfile.writeFile(statefile, this)
  .then(res => {
    console.log('Write complete')
  })
  .catch(error => console.error(error))
}
//----------------------------------------
start(){

;(async () => {

  const port = await getPort()

  sw.listen(port)
  console.log('Listening to port: ' + port)
 
  sw.join('globatio-channel')

  sw.on('connection', (conn, info) => {
    const seq = connSeq

    const peerid = info.id.toString('hex')
    console.log(`Connected #${seq} to peer: ${peerid} ${conn.remoteAddress}`)
    //console.log(conn.remoteAddress)
    // Keep alive TCP connection with peer
    if (info.initiator) {
      try {
        conn.setKeepAlive(true, 600)
      } catch (exception) {
        console.log('exception', exception)
      }
    }

    conn.on('data', data => {
//var self=this
	console.log('message from',conn.remoteAddress)


	var messages = data.toString().split(';');
	var self=this
//console.log(words);
messages.forEach(function(message) {
  if (message!=''){
   self.handleMessage(message,peerid,conn.remoteAddress)
  }
})

	
	
      //---------------------------------------------
      //---------------------------------------------
    }) 

    conn.on('close', () => {
      // Here we handle peer disconnection
      console.log(`Connection ${seq} closed, peer id: ${peerid}`)
      // If the closing connection is the last connection with the peer, removes the peer
      if (peers[peerid].seq === seq) {
        delete peers[peerid]
      }
    })

    // Save the connection
    if (!peers[peerid]) {
      peers[peerid] = {}
    }
    peers[peerid].conn = conn
    peers[peerid].seq = seq
    connSeq++

  })

})()

}
//----------------------------------------
search(text){
var searchtext=text.toLowerCase()
console.log('searching for :',text)
this.searchtext=searchtext

this.sendSwarm(JSON.stringify({type:'searchrequest',
				searchtext:searchtext,
				originid:localid.toString('hex'),
				originip:'',
				relayerid:[localid.toString('hex')]//['']
				}))

//------------------------------------------------------------------


}
//----------------------------------------
handleMessage(data,peerid,peerip){
var parsedmsg=JSON.parse(data)

//console.log('incoming message type',parsedmsg.type,peerip)
console.log('incoming message type',parsedmsg)

if (parsedmsg.originip==''){
	//parsedmsg.originip=peerip
	parsedmsg.originid=peerid
	//parsedmsg.relayerid[0]=peerid
}
// TODO check the validity of the request if invalid it must be rejected

//-- searchrequest --
if (parsedmsg.type=='searchrequest'){

//---------------------------------------------------------------------------------

//---------------------------------------------------------------------------------
//*********************************************************************************
//---------------------------------------------------------------------------------

	//TODO:loop through addeditems

	//this.basketitems.forEach(function(addeditem) {
		//if (StringSearch(addeditem.description,parsedmsg.searchtext)>0){

		//{type:'searchrequest',searchtext:searchtext,originid:localid.toString('hex')}
		//{description:msgarr[1].toString(),link:msgarr[2].toString(),progress:0,status:'Initialization',seeds:0,loved:0,tagged:0}

		// reply to with the found item
			this.sendPeer(JSON.stringify({type:'searchreply',
					item:{description:'addeditem.description',link:'addeditem.link'},
					originid:parsedmsg.originid,
					originip:parsedmsg.originip,
					relayerid:parsedmsg.relayerid//['']
					}),parsedmsg.relayerid[parsedmsg.relayerid.length-1])
		//return//break
		//}
	//})
	
//
//-- relaying --
//TODO:optimize to check if we are not relying to the peer that relayed the message of to the origin peer
var newmsg=parsedmsg
newmsg.relayerid[newmsg.relayerid.length]=peerid
//this.sendSwarm(JSON.stringify(parsedmsg))
console.log('relaying ...')
this.sendRelay(JSON.stringify(parsedmsg),peerid)
//-- end relaying --




}
//-- searchreply --
else if (parsedmsg.type=='searchreply'){
console.log('origin',parsedmsg.originid)
if (parsedmsg.originid==localid.toString('hex')){
console.log('got my response')
} /*else if (parsedmsg.relayerid[parsedmsg.relayerid.length-1]==localid.toString('hex')){
	
	//this.sendSwarm(JSON.stringify({type:'searchreply',item:parsedmsg.item,originid:parsedmsg.originid,nbrelayed:(parsedmsg.nbrelayed)-1}))
	parsedmsg.relayerid.splice((parsedmsg.relayerid.length)-1,1)
	this.sendPeer(JSON.stringify(parsedmsg))
}*/

}
//-- end searchreply --

}
//----------------------------------------
returnAddedItems(){
}
//----------------------------------------
addBasketItem(newbasketitem){

var self=this
var itemalreadyexist=0
this.basketitems.forEach(function(basketitem) {
	if (basketitem.link===newbasketitem.link) {
			itemalreadyexist=1
			console.log('item already exist')
		}
})

if (itemalreadyexist==0) {

newbasketitem.attachementdirectory=path.resolve(__dirname,'../basket/item'+(this.basketitemslastid).toString())

while ( fs.existsSync(newbasketitem.attachementdirectory, err => {if (err) throw err;}) ) {
	this.basketitemslastid++
	newbasketitem.attachementdirectory=path.resolve(__dirname,'../basket/item'+(this.basketitemslastid).toString())
}


this.basketitems.push(newbasketitem)
this.basketitemslastid++
this.downloadItem(newbasketitem)
}
}
//----------------------------------------
initItems(){
//-------------------------------------------------
var self=this
this.addeditems.forEach(function(addeditem) {
	self.downloadItem(addeditem)
})
this.basketitems.forEach(function(basketitem) {
	self.downloadItem(basketitem)
})
//-------------------------------------------------
}
//----------------------------------------
downloadItem(newbasketitem){
var magnetURI=newbasketitem.link
var itemdirectory=newbasketitem.attachementdirectory
var selfitem=newbasketitem
selfitem.status='Initialization'
//-----------------------------------
client.add(magnetURI,{
 // announce: [String],        // Torrent trackers to use (added to list in .torrent or magnet uri)
 // getAnnounceOpts: Function, // Custom callback to allow sending extra parameters to the tracker
 // maxWebConns: Number,       // Max number of simultaneous connections per web seed [default=4]
  path: itemdirectory,              // Folder to download files to (default=`/tmp/webtorrent/`)
 // store: Function            // Custom chunk store (must follow [abstract-chunk-store](https://www.npmjs.com/package/abstract-chunk-store) API)
}, function (torrent) {
  // Got torrent metadata!
  //console.log('Client is downloading:', torrent)
//console.log(torrent.files)
//selfitem.object=torrent


setInterval(onProgress, 500)

// Statistics
        function onProgress () {
          // Peers
          //$numPeers.innerHTML = torrent.numPeers + (torrent.numPeers === 1 ? ' peer' : ' peers')

          // Progress
          var percent = Math.round(torrent.progress * 100 * 100) / 100
          //$progressBar.style.width = percent + '%'
          
          

          // Remaining time
          /*var remaining
          if (torrent.done) {
            remaining = 'Done.'
          } else {
            remaining = moment.duration(torrent.timeRemaining / 1000, 'seconds').humanize()
            remaining = remaining[0].toUpperCase() + remaining.substring(1) + ' remaining.'
          }*/
          //$remaining.innerHTML = remaining

          // Speed rates
   
	if (selfitem.status!='Done'){
		selfitem.status='Downloading '+(torrent.downloadSpeed/1000.0).toString()+'Kb /s '+ 'Progress '+percent+'%'//+remaining
		}
        }


/*
//---------------------------------------------
torrent.on('download', function (bytes) {
  //console.log('just downloaded: ' + bytes)
  //console.log('total downloaded: ' + torrent.downloaded)
  //console.log('download speed: ' + torrent.downloadSpeed)
  //console.log('progress: ' + torrent.progress)
if (torrent.downloadSpeed>0){
	var downspeed=(torrent.downloadSpeed/1000).toFixed(2)
	var downprogress=(torrent.progress*100).toFixed(1)
	selfitem.status='Downloading '+downspeed.toString()+' Kb/s '+ 'Progress '+downprogress.toString()+'%'
	//selfitem.status='Downloading '
} else{
	selfitem.status='Stalled'
}
	
})
*/
//---------------------------------------------
torrent.on('done', function(){
  console.log('torrent finished downloading')

selfitem.status='Done'
  


 // torrent.files.forEach(function(file){
     // do something with file
 // })
})
//---------------------------------------------
torrent.on('noPeers', function (announceType) {
  //console.log('torrent finished downloading')
selfitem.status='Stalled'


})

//---------------------------------------------
})

}
//----------------------------------------
destroyBasketItem(tempid){
var self=this
var templink=this.basketitems[tempid].link
//var tempid=parseInt(arg)
//client.get(this.basketitems[arg].itemextralink).destroy()

this.basketitems.splice(tempid, 1);
if ((templink!=='')&&(templink!==undefined)){
	console.log('Deleting torrent',templink)
	client.remove(templink.toString())
}


//torrent.destroy
}
//----------------------------------------
destroyProfileItem(tempid){
	var self=this
	var templink=this.profileitems[tempid].link
	//var tempid=parseInt(arg)
	//client.get(this.basketitems[arg].itemextralink).destroy()
	
	this.profileitems.splice(tempid, 1);
	if ((templink!=='')&&(templink!==undefined)){
		console.log('Deleting torrent',templink)
		client.remove(templink.toString())
	}
}
//----------------------------------------
addSearchResult(newsearchresult){
this.searchresults.push(newsearchresult)
}
//----------------------------------------
addProfileItem(newiteminfo){
	var tempitemdetails=arg.split(";")
	var tempitemdescription=tempitemdetails[0]
	var tempitemfiles=tempitemdetails[1].split('     ')
	console.log(tempitemdescription,tempitemfiles)
  /*var newitem={description:globatio.searchresults[arg].description,
      link:globatio.searchresults[arg].link,
      attachementdirectory:''
      
	}*/

//var newitem=JSON.parse(newiteminfo)
	/*if ((newitem.link!=='')&& (newitem.link!== undefined)){
		this.addeditems.push(newitem)
		this.addeditemslastid++
	} else {
	//TODO create torrent from files directory
	console.log('no link provided')
	//newitem.link='5645444'
	//console.log('new link',newitem.link)
	}*/
}
//----------------------------------------
/*
sendPeerItem(peerid,message,time,filedirectory,hash,datlink){
}*/
//----------------------------------------

sendPeer(message,peerid){
console.log('---------> sendPeer',message,peerid)
	peers[peerid].conn.write(message+';')
}
//----------------------------------------
sendSwarm(text){
console.log('sendSwarm',text)
   // Broadcast to peers
    for (let id in peers) {
      peers[id].conn.write(text+';')
    }
}
//----------------------------------------

sendRelay(text,peerid){
console.log('sendRelay',text,peerid)
   // Broadcast to peers
    for (let id in peers) {
	if (peerid!=peerid){
      		peers[id].conn.write(text+';')
	}
    }
}


//----------------------------------------
/*sortResult(sortby){
}*/
//----------------------------------------
}
//-------------------------------------

function StringSearch(string,searchtext){
var searchweight=0
var newstring=string.toLowerCase()
  var searchtextsplited = searchtext.toLowerCase().split(" ");
  
  searchtextsplited.forEach(function(element) {
  
  if (newstring.search(element)>0){
  		searchweight++
  }
});


return searchweight
}

