
// TODO:
// add mouse events to shot ball
// wall collision
// io
// group select, user permission
// static ball collision (two ball are static but collide somehow)
// dynamic ball collision (one or two balls are dynamic)


//connect to server and retain the socket
let socket = io('http://' + window.document.location.host)

// socket.on('blueBoxData', function(data) {
//   let locationData = JSON.parse(data)
//   movingBox.x = locationData.x
//   movingBox.y = locationData.y
//   drawCanvas()
// })

// const updateBoxLoc = (locData) => {
//   let jsonLocData = JSON.stringify(locData)
//   socket.emit('blueBoxData', jsonLocData)
// }


function Ball(x, y, radius, id, group) {
  this.radius = radius
  this.x = x
  this.y = y
  this.vx = 0
  this.vy = -Math.floor(Math.random() * Math.floor(3)) //test
  this.id = id
  this.group = group
  this.color = 'white'
  this.draw = function() {
    // draw outer circle
    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = 'gray'
    ctx.fill()
    ctx.strokeStyle = 'rgba(50, 50, 50, 0.25)'
    ctx.stroke()

    // draw inner circle
    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius * 1 / 2, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = this.color
    ctx.fill()
  }
  this.speed = function() {
    // magnitude of velocity vector
    return Math.sqrt(this.dx * this.dx + this.dy * this.dy)
  }
  this.angle = function() {
    //angle of ball with the x axis
    return Math.atan2(this.dy, this.dx)
  }
}

function Target(x, y, radius) {
  this.radius = radius
  this.x = x
  this.y = y
  this.draw = function() {
    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, 2 * Math.PI)
    ctx.fillStyle = 'blue'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), (this.radius * 3 / 4), 0, 2 * Math.PI)
    ctx.fillStyle = 'white'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius * 1 / 2, 0, 2 * Math.PI)
    ctx.fillStyle = 'red'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius * 1 / 4, 0, 2 * Math.PI)
    ctx.fillStyle = 'white'
    ctx.fill()
  }
}

const canvas = document.getElementById("canvas1") //our drawing canvas
const ctx = canvas.getContext("2d")
const ballArray = []
const aliasBalls = {}
const targetArray = []
let group = ""
let pause = false


let miniViewWidth = 150
let miniViewHeight = 500
let miniTargetRadius = 60
let miniTarget = new Target(miniViewWidth * 4.5, miniViewWidth / 2, miniTargetRadius)
targetArray[targetArray.length] = miniTarget
let aliasTarget = new Target(miniViewWidth * 2, miniViewWidth * 2, miniTargetRadius * 4)
targetArray[targetArray.length] = aliasTarget

let miniBallRadius = 10

function spawnBalls() {
  // spawn small balls
  for (let i = 0; i < 6; i++) {
    if (i < 3)
      var miniBall = new Ball(miniViewWidth * 4 + 12 + i * 25, miniViewHeight - 11, miniBallRadius, i, "husky")
    else
      var miniBall = new Ball(miniViewWidth * 4 + 13 + i * 25, miniViewHeight - 11, miniBallRadius, i, "raven")
    ballArray[ballArray.length] = miniBall
  }

  // spawn large alias
  for (let ball of ballArray) {
    var aliasBall = { ...ball }
    aliasBall.radius = ball.radius * 4
    aliasBalls[ball.id] = aliasBall
  }
}

function drawLayout() {
  ctx.beginPath()
  ctx.strokeStyle = "#000"
  ctx.strokeRect(miniViewWidth * 4, 0, miniViewWidth, miniViewHeight)
  ctx.strokeRect(0, 0, miniViewWidth * 4, miniViewHeight * 4)
}

function moveBalls() {
  for (let ball of ballArray) {
    ball.x += ball.vx
    ball.y += ball.vy
  }
}

function drawCanvas() {
  // clear canvas before next draw
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  drawLayout()
  drawTargets()
  drawBalls()
  drawAliasBalls()
  if (!pause) {
    moveBalls()
  }
  staticCollision()
  ballCollision()

  //test
  ctx.strokeStyle = "rgba(255, 0, 0, .5)"
  ctx.strokeRect(ballRect.x, ballRect.y, ballRect.width, ballRect.height)

  requestAnimationFrame(drawCanvas)
}

function drawTargets() {
  for (let target of targetArray) {
    target.draw()
  }
}

function drawBalls() {
  for (let ball of ballArray) {
    ball.draw()
  }
}

// map miniBall's position, color to magnified view
function drawAliasBalls() {
  for (let ball of ballArray) {
    let alias = aliasBalls[ball.id]
    alias.x = (ball.x - miniViewWidth * 4) * 4
    alias.y = ball.y * 4
    alias.group = ball.group
    alias.color = ball.color
    alias.draw()
  }
}

function ballCollision() {}

function staticCollision() {}


//test
ballRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
}

/**
 * Get the mini ball being clicked
 * @param {*} canvasX mouseDown position of x
 * @param {*} canvasY mouseDown position of y
 * @return ball object
 */
function getBall(canvasX, canvasY) {
  for (let i = 0; i < ballArray.length; i++) {
    let ball = ballArray[i]

    if (
      Math.abs(canvasX - ball.x) < ball.radius &&
      Math.abs(canvasY - ball.y) < ball.radius
    ) {

      //test
      ballRect = {
        x: ball.x - ball.radius,
        y: ball.y - ball.radius,
        width: ball.radius * 2,
        height: ball.radius * 2
      }

      return ball
    }
  }
  return null
}

function handleMouseDown(e) {
  //get mouse location relative to canvas top left
  let rect = canvas.getBoundingClientRect()
  let canvasX = e.clientX - rect.left
  let canvasY = e.clientY - rect.top
  console.log(e.clientY, e.pageY, rect.top)
  console.log(e.clientX, e.pageX, rect.left)
  console.log("mouse down:" + canvasX + ", " + canvasY)

  ballClicked = getBall(canvasX, canvasY)
  if (ballClicked != null) {
    //attache mouse move and mouse up handlers
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)
  }


  e.stopPropagation()
  e.preventDefault()
}

function handleMouseMove(e) {
  console.log("mouse move")

  //get mouse location relative to canvas top left
  let rect = canvas.getBoundingClientRect()
  let canvasX = e.pageX - rect.left
  let canvasY = e.pageY - rect.top

  // wordBeingMoved.x = canvasX + deltaX
  // wordBeingMoved.y = canvasY + deltaY

  e.stopPropagation()
}

function handleMouseUp(e) {
  console.log("mouse up")

  // send JSON obj str containing: angle, vx vy

  canvas.removeEventListener("mousemove", handleMouseMove)
  canvas.removeEventListener("mouseup", handleMouseUp)

  e.stopPropagation()
}

//test
function handleKeyDown(event) {
  if (event.which == 80) pause = !pause
  console.log("key pressed:", event.keyCode)
}

// optimized for retina display
function initCanvas() {
  let canvasWidth = miniViewWidth * 5 + 2
  let canvasHeight = 560
  canvas.style.width = canvasWidth + "px"
  canvas.style.height = canvasHeight + "px"
  let scale = window.devicePixelRatio
  canvas.width = canvasWidth * scale
  canvas.height = canvasHeight * scale
  ctx.scale(scale, scale)
}

// starts after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initCanvas()
  canvas.addEventListener("mousedown", handleMouseDown)
  document.addEventListener("keydown", handleKeyDown)
  spawnBalls()
  drawCanvas()
})
