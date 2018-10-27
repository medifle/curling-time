
// TODO:
// R1.3 R2.1 R3.3
// R3.5 R3.7 R3.8 R3.9

const http = require('http')
const ecStatic = require('ecstatic')
const PORT = process.env.PORT || 3000

const ROOT_DIR = "html" //dir to serve static files from
//static file server based on npm module ecstatic
const server = http.createServer(ecStatic({
  root: __dirname + '/' + ROOT_DIR
}))
const io = require('socket.io')(server) //wrap server app in npm socket.io capability

server.listen(PORT) //start server listening on PORT

//server maintained location of moving box
let movingBoxLocation = {}


io.on('connection', function(socket) {
  console.log(socket.id + ' are connected')
  io.emit('blueBoxData', JSON.stringify(movingBoxLocation)) //broadcast to everyone including sender

  socket.on('blueBoxData', function(data) {
    console.log('RECEIVED BOX DATA: ' + data)
    let locData = JSON.parse(data)
    movingBoxLocation.x = locData.x
    movingBoxLocation.y = locData.y
    //to broadcast message to everyone including sender:
    io.emit('blueBoxData', JSON.stringify(movingBoxLocation)) //broadcast to everyone including sender
  })
})


console.log("Server Running at PORT: 3000  CNTL-C to quit")
console.log("To Test:")
console.log("Open several browsers at: http://localhost:3000/index.html")
