
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

let deltaX, deltaY //location where mouse is pressed
const canvas = document.getElementById("canvas1") //our drawing canvas
const ctx = canvas.getContext("2d")
const ballArray = []
const targetArray = []
let group = null

function Ball(x, y, radius) {
  this.radius = radius
  this.x = x
  this.y = y
  this.vx = 0
  this.vy = 0
  this.color = '#000000'
  this.draw = function() {
    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(50, 50, 50, 0.25)'
    ctx.stroke()
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
    ctx.arc(Math.round(this.x), Math.round(this.y), (this.radius * 3/4), 0, 2 * Math.PI)
    ctx.fillStyle = 'white'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius * 1/2, 0, 2 * Math.PI)
    ctx.fillStyle = 'red'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius * 1/4, 0, 2 * Math.PI)
    ctx.fillStyle = 'white'
    ctx.fill()
  }
}

let smallViewWidth = 150
let smallViewHeight = 500
let smallTargetRadius = 60
let smallTarget = new Target(smallViewWidth*4.5, smallViewWidth/2, smallTargetRadius)
targetArray[targetArray.length] = smallTarget
let largeTarget = new Target(smallViewWidth*2, smallViewWidth*2, smallTargetRadius*4)
targetArray[targetArray.length] = largeTarget


function drawLayout() {
  ctx.beginPath()
  ctx.strokeStyle = "#000"
  ctx.strokeRect(smallViewWidth*4, 0, smallViewWidth, smallViewHeight)
  ctx.strokeRect(0, 0, smallViewWidth*4, smallViewHeight*4)
}

function drawCanvas() {
  // clear canvas before next draw
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  drawLayout()
  drawTargets()
  drawBalls()
  staticCollision()
  ballCollision()

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

function ballCollision() {}

function staticCollision() {}



function handleMouseDown(e) {
  //get mouse location relative to canvas top left
  let rect = canvas.getBoundingClientRect()
  //var canvasX = e.clientX - rect.left
  //var canvasY = e.clientY - rect.top
  let canvasX = e.pageX - rect.left //use  event object pageX and pageY
  let canvasY = e.pageY - rect.top
  console.log("mouse down:" + canvasX + ", " + canvasY)

  // wordBeingMoved = getWordAtLocation(canvasX, canvasY)
  // if (wordBeingMoved != null) {
  //   deltaX = wordBeingMoved.x - canvasX
  //   deltaY = wordBeingMoved.y - canvasY
  //   //attache mouse move and mouse up handlers
  //   canvas.addEventListener("mousemove", handleMouseMove)
  //   canvas.addEventListener("mouseup", handleMouseUp)
  // }


  e.stopPropagation()
  e.preventDefault()

  drawCanvas()
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

  drawCanvas()
}

function handleMouseUp(e) {
  console.log("mouse up")
  e.stopPropagation()

  canvas.removeEventListener("mousemove", handleMouseMove)
  canvas.removeEventListener("mouseup", handleMouseUp)

  drawCanvas()
}

function initCanvas() {
  let canvasWidth = 752
  let canvasHeight = 560
  canvas.style.width = canvasWidth + "px"
  canvas.style.height = canvasHeight + "px"
  let scale = window.devicePixelRatio
  canvas.width = canvasWidth * scale
  canvas.height = canvasHeight * scale
  ctx.scale(scale,scale)

}

// starts after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initCanvas()
  canvas.addEventListener("mousedown", handleMouseDown)
  drawCanvas()
})
