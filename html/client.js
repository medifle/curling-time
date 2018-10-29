
// TODO:
// IIFE (pass window obj into)
// deploy to heroku

//connect to server and retain the socket
let socket = io('http://' + window.document.location.host)

// Whenever client receives balls data(not including alias balls)
socket.on('balls', (data) => {
  let ballsData = JSON.parse(data)
  for (let ball of ballArray) {
    let ballData = ballsData[ball.id]
    ball.x = ballData.x
    ball.y = ballData.y
    ball.group = ballData.group
    ball.colour = ballData.colour
  }
})

socket.on('error_duplicate_name', () => {
  divider.textContent = 'try another name'
})

socket.on('error_duplicate_colour', () => {
  divider.textContent = 'try another colour'
})

socket.on('players_update', (data) => {
  let playersData = JSON.parse(data)
  console.log(playersData) //test
  // reset name, group colour to default
  group1ColourEle.style.backgroundColor = ballColourDefault
  group2ColourEle.style.backgroundColor = ballColourDefault
  player1NameEle.textContent = playNameDefault
  player2NameEle.textContent = playNameDefault

  // update name, group colour
  for (let id in playersData) {
    let player = playersData[id]
    if (player.group === group1) {
      player1NameEle.textContent = player.nickname
      group1ColourEle.style.backgroundColor = player.colour
    }
    else if (player.group === group2) {
      player2NameEle.textContent = player.nickname
      group2ColourEle.style.backgroundColor = player.colour
    }
  }

  let playerNum = Object.keys(playersData).length
  // if this client joined game, wait and start
  if (playersData.hasOwnProperty(socket.id)) {
    // update player group
    group = playersData[socket.id]['group']
    // update start button disabled status
    startButton.disabled = true
    // update divider text
    if (playerNum < 2) {
      divider.textContent = 'waiting player'
    } else if (playerNum === 2) {
      divider.textContent = 'playing'
    }
    // update exit button disabled status
    exitButton.disabled = false
  }
  // if this client did not join, enter spectator mode
  else {
    exitButton.disabled = true // update start and exit button disabled status
    group = '' //reset player's permission
    // update divider text
    if (playerNum === 2) {
      divider.textContent = 'spectator mode'
      startButton.disabled = true
    } else {
      divider.textContent = 'waiting player'
      startButton.disabled = false
    }
  }
})

// send necessary data of the ball being shot (only one ball)
const shootBall = (data) => {
  let ballData = JSON.stringify(data)
  socket.emit('ballBeingShot', ballData)
}


function Ball(x, y, radius, id) {
  this.radius = radius
  this.x = x //position X
  this.y = y //position Y
  this.id = id //identity
  this.group = '' // membership
  this.colour = 'white' // default colour when no group is joined
  this.draw = function() {
    // draw outer circle
    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = 'gray'
    ctx.fill()
    ctx.strokeStyle = 'rgb(50, 50, 50)'
    ctx.stroke()

    // draw inner circle
    ctx.beginPath()
    ctx.arc(Math.round(this.x), Math.round(this.y), this.radius * 1 / 2, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = this.colour
    ctx.fill()
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

const player1NameEle = document.getElementById('player1')
const player2NameEle = document.getElementById('player2')
const group1ColourEle = document.getElementById('group1_colour')
const group2ColourEle = document.getElementById('group2_colour')
const divider = document.getElementById('divider_text')
const nicknameEle = document.getElementById('nickname')
const colourEle = document.getElementById('colour')
const startButton = document.getElementById('join')
const exitButton = document.getElementById('exit')
const canvas = document.getElementById('canvas1') //our drawing canvas
const ctx = canvas.getContext('2d') // get 2D context
const ballArray = []
const aliasBalls = {}
const targetArray = []
const group1 = 'group1'
const group2 = 'group2'
const ballColourDefault = 'white'
const playNameDefault = 'waiting'
let raf // for window.requestAnimationFrame()
let ballClicked = null
let mouseLoc // {object} mouse location in canvas
let mouseDrag = false
let group = ''
let pause = false

// init circle target and its alias
let miniViewWidth = 150
let miniViewHeight = 500
let miniTargetRadius = 60
let miniTarget = new Target(miniViewWidth * 4.5, miniViewWidth / 2, miniTargetRadius)
targetArray[targetArray.length] = miniTarget
let aliasTarget = new Target(miniViewWidth * 2, miniViewWidth * 2, miniTargetRadius * 4)
targetArray[targetArray.length] = aliasTarget

// init balls and its alias
let miniBallRadius = 10

function spawnBalls() {
  // spawn small balls
  for (let i = 0; i < 6; i++) {
    let miniBall = new Ball(-100, -100, miniBallRadius, i)
    ballArray[ballArray.length] = miniBall
  }

  // spawn large alias
  for (let ball of ballArray) {
    let aliasBall = { ...ball }
    aliasBall.radius = ball.radius * 4
    aliasBalls[ball.id] = aliasBall
  }
}

function drawLayout() {
  ctx.beginPath()
  ctx.strokeStyle = '#000'
  ctx.strokeRect(miniViewWidth * 4, 0, miniViewWidth, miniViewHeight)
  ctx.strokeRect(0, 0, miniViewWidth * 4, miniViewHeight * 4)
}

// game loop using raf(requestAnimationFrame)
function drawCanvas() {
  // clear canvas before next draw
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // draw
  drawLayout()
  drawTargets()
  drawBalls()
  drawAliasBalls()
  if (mouseDrag && ballClicked && mouseLoc) {
    drawCatapultLine()
  }

  //test for selecting ball
  ctx.strokeStyle = 'rgba(255, 0, 0, .5)'
  ctx.strokeRect(ballRect.x, ballRect.y, ballRect.width, ballRect.height)

  // used to render canvas at 60FPS
  raf = requestAnimationFrame(drawCanvas)
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

// map miniBall position, group, colour to magnified view
function drawAliasBalls() {
  for (let ball of ballArray) {
    // calculate position
    let alias = aliasBalls[ball.id]
    alias.x = (ball.x - miniViewWidth * 4) * 4
    alias.y = ball.y * 4
    // update group, colour
    alias.group = ball.group
    alias.colour = ball.colour
    // draw
    alias.draw()
  }
}

function drawCatapultLine() {
  ctx.beginPath()
  ctx.save()
  ctx.setLineDash([5, 5])
  ctx.moveTo(ballClicked.x, ballClicked.y)
  ctx.lineTo(mouseLoc.x, mouseLoc.y)
  ctx.strokeStyle = 'rgba(50, 50, 50, 0.75)'
  ctx.stroke()
  ctx.restore()
}

//test for selecting ball
ballRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
}

/**
 * Get the mini ball clicked
 * @param {Number} canvasX mouseDown position of x
 * @param {Number} canvasY mouseDown position of y
 * @return {object} ball clicked
 */
function getBall(canvasX, canvasY) {
  for (let i = 0; i < ballArray.length; i++) {
    let ball = ballArray[i]

    if (
      Math.abs(canvasX - ball.x) < ball.radius &&
      Math.abs(canvasY - ball.y) < ball.radius
    ) {

      //test for selecting ball
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

// get mouse location relative to canvas top left
// which is the location inside canvas as well
function getMouseLocation(e) {
  let rect = canvas.getBoundingClientRect()
  let canvasX = e.clientX - rect.left
  let canvasY = e.clientY - rect.top
  return { x: canvasX, y: canvasY }
}

function handleMouseDown(e) {
  mouseLoc = getMouseLocation(e)
  let canvasX = mouseLoc.x
  let canvasY = mouseLoc.y
  console.log('mouse down:' + canvasX + ', ' + canvasY)

  ballClicked = getBall(canvasX, canvasY)
  if (ballClicked != null && ballClicked.group === group) {
    //attache mouse move and mouse up handlers
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
  }

  e.stopPropagation()
  e.preventDefault()
}

function handleMouseMove(e) {
  mouseDrag = true
  mouseLoc = getMouseLocation(e)
  // console.log('mouse moving at:' + mouseLoc.x + ', ' + mouseLoc.y) //test

  e.stopPropagation()
}

// var shotData = {id:2, vx:8.735999999999999, vy:0.46799999999999997} //test
var shotData = {id:2, vx:8.735, vy:0.46799999999999997} //test
function test() {
  shootBall(shotData)
}

function handleMouseUp(e) {
  console.log('mouse up after clicking a ball')
  mouseDrag = false

  // send JSON obj str containing: angle, vx vy
  if (ballClicked && mouseLoc) {

    let vx = (ballClicked.x - mouseLoc.x) * .052
    let vy = (ballClicked.y - mouseLoc.y) * .052
    let shootData = {
      id: ballClicked.id,
      vx,
      vy
    }
    // console.log(shootData) //test
    // shotData = shootData //test {id:2, vx:8.735999999999999, vy:0.46799999999999997}
    shootBall(shootData)
  }

  canvas.removeEventListener('mousemove', handleMouseMove)
  canvas.removeEventListener('mouseup', handleMouseUp)

  e.stopPropagation()
}

function sendLoginInfo(e) {
  let nickname = nicknameEle.value
  let colour = colourEle.value
  if (nickname && colour) {
    nicknameEle.value = ''
    colourEle.value = ''
    let loginData = {nickname, colour}
    socket.emit('login', JSON.stringify(loginData))
  }

  e.stopPropagation()
  e.preventDefault()
}

function sendExitInfo(e) {
  socket.emit('exit')

  e.stopPropagation()
  e.preventDefault()
}


// optimize for retina display
function initCanvas() {
  let canvasWidth = miniViewWidth * 5.5 + 2
  let canvasHeight = 725
  canvas.style.width = canvasWidth + 'px'
  canvas.style.height = canvasHeight + 'px'
  let scale = window.devicePixelRatio
  canvas.width = canvasWidth * scale
  canvas.height = canvasHeight * scale
  ctx.scale(scale, scale)
}

// add animation for login panel
function addLoginAnim() {
  let login = document.querySelector('.login')
  login.classList.add('login_ready')
}

// start after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initCanvas()
  canvas.addEventListener('mousedown', handleMouseDown)
  startButton.addEventListener('click', sendLoginInfo)
  exitButton.addEventListener('click', sendExitInfo)
  spawnBalls()
  drawCanvas()

  setTimeout(addLoginAnim, 180)
})
