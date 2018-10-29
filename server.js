

function Ball(x, y, radius, id, group) {
  this.radius = radius
  this.x = x //position X
  this.y = y //position Y
  this.vx = 0 //velocity X
  this.vy = 0 //velocity Y
  this.fx = 0.991 //friction X
  this.fy = 0.991 //friction Y
  this.id = id //identity
  this.group = group //membership
  this.colour = ballColourDefault //default colour when no group is joined
  this.speed = function() {
    // magnitude of velocity vector
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
  }
  this.angle = function() {
    // angle of ball with the x axis
    return Math.atan2(this.vy, this.vx)
  }
  this.wallCollision = { //helper object to avoid double hit
    horizontal: false,
    vertical: false
  }
}

// for sending necessary ball data to clients
function BallEmit(x, y, radius, id, group) {
  this.x = x //position X
  this.y = y //position Y
  this.id = id //identity
  this.group = group // membership
  this.colour = ballColourDefault // default colour when no group is joined
}

// init server and socket.io
const http = require('http')
const ecStatic = require('ecstatic')
const PORT = process.env.PORT || 3000
const ROOT_DIR = 'html' //dir to serve static files from
//static file server based on npm module ecstatic
const server = http.createServer(ecStatic({
  root: __dirname + '/' + ROOT_DIR
}))
const io = require('socket.io')(server) //wrap server app in npm socket.io capability
server.listen(PORT) //start server listening on PORT

// keep track of players
const players = {}

const updateBallsColour = () => {
  // reset balls colour to default
  for (let i in ballsData) {
    ballsData[i].colour = ballColourDefault
  }

  // update balls colour from players
  for (let id in players) {
    let playerGroup = players[id].group
    let playerColour = players[id].colour
    for (let i in ballsData) {
      let ball = ballsData[i]
      if (ball.group === playerGroup) {
        ball.colour = playerColour
      }
    }
  }
}

io.on('connection', (socket) => {
  console.log(socket.id + ' is connected')
  io.emit('players_update', JSON.stringify(players))
  // handle game login
  socket.on('login', (data) => {
    let loginData = JSON.parse(data)
    loginData.id = socket.id
    // if seats are avaialble
    let playerKeys = Object.keys(players)

    // check duplicate name or colour
    if (playerKeys.length === 1) {
      if (loginData.nickname.toLowerCase() === players[playerKeys[0]].nickname.toLowerCase()) {
        socket.emit('error_duplicate_name')
        return
      } else if (loginData.colour === players[playerKeys[0]].colour) {
        socket.emit('error_duplicate_colour')
        return
      }
    }

    if (playerKeys.length < 2) {
      if (playerKeys.length === 0) {
        loginData['group'] = group1
      } else if (playerKeys.length === 1) {
        let activePlayer = players[playerKeys[0]]
        if (activePlayer.group === group1) {
          loginData['group'] = group2
        } else if (activePlayer.group === group2) {
          loginData['group'] = group1
        }
      }
      players[socket.id] = loginData
      updateBallsColour()
      // console.log(players) //test
      console.log(`Player ${socket.id} is ready`)
      if (Object.keys(players).length === 2) {
        reset()
      }
    }
    io.emit('players_update', JSON.stringify(players))
  })

  const exitGame = () => {
    // if it's a player, remove it from players
    let id = socket.id
    if (players.hasOwnProperty(id)) {
      delete players[id]
      updateBallsColour()
      console.log(`Player ${socket.id} exited game`)
    }
    io.emit('players_update', JSON.stringify(players))
  }

  socket.on('exit', () => {
    exitGame()
  })

  socket.on('disconnect', () => {
    exitGame()
    console.log(`Player ${socket.id} is disconnected`)
  })

  socket.on('ballBeingShot', (data) => {
    let ballShotData = JSON.parse(data)
    let ball = ballsData[ballShotData.id]
    ball.vx = ballShotData.vx
    ball.vy = ballShotData.vy
  })

})

// init balls
let pause = false
let ballsData = {}
let ballsEmitData = {} //necessary balls info sending to clients
const ballColourDefault = 'white'
let miniViewWidth = 150
let miniViewHeight = 500
let miniBallRadius = 10
const group1 = 'group1'
const group2 = 'group2'

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

const distance = (a, b) => {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// when two balls are overlapped when they are static for some reason (like random spawned)
// place one of them to a position so that the distance between them is 0
const staticCollision = () => {
  // for two balls
  let ballsArr = Object.values(ballsData) //convert ballsData to an array
  for (let i = 0; i < ballsArr.length - 1; i++) {
    for (let j = i + 1; j < ballsArr.length; j++) {
      let b1 = ballsArr[i]
      let b2 = ballsArr[j]
      if (distance(b1, b2) < b1.radius + b2.radius) {
        let theta = Math.atan2((b1.y - b2.y), (b1.x - b2.x))
        let overlap = (b1.radius + b2.radius) - distance(b1, b2)
        b2.x -= overlap * Math.cos(theta)
        b2.y -= overlap * Math.sin(theta)
      }
    }
  }
  // for wall
  for (let ball of ballsArr) {
    if (ball.x - ball.radius < miniViewWidth * 4) {
      ball.x = miniViewWidth*4 + ball.radius + ball.x
    }
    if (ball.x + ball.radius > miniViewWidth * 5) {
      ball.x = miniViewWidth*5 - ball.radius - ball.x
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius + ball.vy
    }
    if (ball.y + ball.radius > miniViewHeight) {
      ball.y = miniViewHeight - ball.radius - ball.vy
    }
  }
}

// handle ball collision with wall
const wallCollision = (ball) => {
  if (ball.x - ball.radius + ball.vx < miniViewWidth * 4 ||
    ball.x + ball.radius + ball.vx > miniViewWidth * 5)
  {
    if (ball.wallCollision.horizontal === false) {
      ball.vx *= -1;
      ball.wallCollision.horizontal = true
    }
  } else {
    ball.wallCollision.horizontal = false
  }

  if (ball.y - ball.radius + ball.vy < 0 ||
    ball.y + ball.radius + ball.vy > miniViewHeight)
  {
    if (ball.wallCollision.vertical === false) {
      ball.vy *= -1;
      ball.wallCollision.vertical = true
      // if (ball.id === 1) console.log(ball) //test
    }
  } else {
    ball.wallCollision.vertical = false
    // if (ball.id === 1) console.log(ball) //test
  }
}

const distanceNextFrame = (a, b) => {
  return Math.sqrt((a.x + a.vx - b.x - b.vx)**2 + (a.y + a.vy - b.y - b.vy)**2) - a.radius - b.radius;
}

// handle two balls collision
const ballsCollision = () => {
  let ballsArr = Object.values(ballsData)
  for (let b1 of ballsArr) {
    for (let b2 of ballsArr) {
      if (b1 !== b2 && distanceNextFrame(b1, b2) <= 0) {
        let theta1 = b1.angle()
        let theta2 = b2.angle()
        let phi = Math.atan2(b2.y - b1.y, b2.x - b1.x)
        let v1 = b1.speed()
        let v2 = b2.speed()

        b1.vx  = v2*Math.cos(theta2 - phi) * Math.cos(phi) + v1*Math.sin(theta1-phi) * Math.cos(phi+Math.PI/2)
        b1.vy  = v2*Math.cos(theta2 - phi) * Math.sin(phi) + v1*Math.sin(theta1-phi) * Math.sin(phi+Math.PI/2)
        b2.vx  = v1*Math.cos(theta1 - phi) * Math.cos(phi) + v2*Math.sin(theta2-phi) * Math.cos(phi+Math.PI/2)
        b2.vy  = v1*Math.cos(theta1 - phi) * Math.sin(phi) + v2*Math.sin(theta2-phi) * Math.sin(phi+Math.PI/2)
      }
    }
    wallCollision(b1)
  }
}

const updateBalls = () => {
  moveBalls()
  staticCollision()
  ballsCollision()
}

const updateClients = () => {
  if (!pause) {
    updateBalls()
    updateBallsEmitData()
    io.emit('balls', JSON.stringify(ballsEmitData))
  }
}

let delay = 1000 / 60
// let delay = 1000 / 5 //test
const start = () => {
  setInterval(updateClients, delay)
}

const reset = () => {
  pause = true
  ballsData = {}
  ballsEmitData = {}
  spawnBalls()
  updateBallsColour()
  pause = false
  console.log('Game start')
}

// main
spawnBalls()
setTimeout(start, 500)

console.log('Server Running at PORT: 3000  CNTL-C to quit')
console.log('To Test:')
console.log('Open several browsers at: http://localhost:3000/index.html')
