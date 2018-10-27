
// TODO:
// R1.3 R3.3
// R3.7 R3.8 R3.9

function Ball(x, y, radius, id, group) {
  this.radius = radius
  this.x = x //position X
  this.y = y //position Y
  this.vx = 0 //velocity X
  this.vy = 0 //velocity Y
  this.fx = 0.991 //friction X
  this.fy = 0.991 //friction Y
  this.id = id //identity
  this.group = group // membership
  this.colour = 'white' // default colour when no group is joined
  this.speed = function() {
    // magnitude of velocity vector
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
  }
  this.angle = function() {
    //angle of ball with the x axis
    return Math.atan2(this.vy, this.vx)
  }
}

// for sending necessary ball data to clients
function BallEmit(x, y, radius, id, group) {
  this.x = x //position X
  this.y = y //position Y
  this.id = id //identity
  this.group = group // membership
  this.colour = 'white' // default colour when no group is joined
}

// init server and socket.io
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

io.on('connection', function(socket) {
  console.log(socket.id + ' are connected')

  socket.on('ballBeingShot', function(data) {
    let ballShotData = JSON.parse(data)
    let ball = ballsData[ballShotData.id]
    ball.vx = ballShotData.vx
    ball.vy = ballShotData.vy
  })
})

// init balls
const ballsData = {}
const ballsEmitData = {} // necessary balls info sending to clients
let miniViewWidth = 150
let miniViewHeight = 500
let miniBallRadius = 10
let group1 = "husky"
let group2 = "raven"

const spawnBalls = () => {
  // spawn small balls
  for (let i = 0; i < 6; i++) {
    if (i < 3)
      var miniBall = new Ball(miniViewWidth * 4 + 12 + i * 25, miniViewHeight - 11, miniBallRadius, i, group1)
    else
      var miniBall = new Ball(miniViewWidth * 4 + 13 + i * 25, miniViewHeight - 11, miniBallRadius, i, group2)
    ballsData[miniBall.id] = miniBall
  }

  for (let id in ballsData) {
    let ball = ballsData[id]
    ballsEmitData[id] = new BallEmit(ball.x, ball.y, ball.radius, ball.id, ball.group);
  }
}

const updateBallsEmitData = () => {
  for (let id in ballsData) {
    let ball = ballsData[id]
    let ballEmit = ballsEmitData[id]
    ballEmit.x = ball.x
    ballEmit.y = ball.y
    ballEmit.group = ball.group
    ballEmit.colour = ball.colour
  }
}

let stopThresholdY = 0.127
let stopThresholdX = 0.015
function moveBalls() {
  for (let id in ballsData) {
    // console.log(ball.vx, ball.vy) //test
    let ball = ballsData[id]
    // stop if velocity is trivial
    if (Math.abs(ball.vx) < stopThresholdX) ball.vx = 0
    if (Math.abs(ball.vy) < stopThresholdY) ball.vy = 0

    // friction
    ball.vx *= ball.fx
    ball.vy *= ball.fy
    // moving
    ball.x += ball.vx
    ball.y += ball.vy
  }
}

const staticCollision = () => {

}

const ballCollision = () => {

}


const updateBalls = () => {
  moveBalls()
  staticCollision()
  ballCollision()
}

const updateClients = () => {
  updateBalls()
  updateBallsEmitData()
  io.emit('balls', JSON.stringify(ballsEmitData))
}

// main
spawnBalls()
let delay = 1000 / 60
const start = () => {
  setInterval(updateClients, delay)
}
setTimeout(start, 500)

console.log("Server Running at PORT: 3000  CNTL-C to quit")
console.log("To Test:")
console.log("Open several browsers at: http://localhost:3000/index.html")
