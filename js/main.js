"use strict"

var gBoard = {
  minesAroundCount: 4,
  isCovered: true,
  isMine: false,
  isMarked: false,
}

var gLevel = {
  SIZE: 4,
  MINES: 2,
}

var gGame = {
  isOn: false,
  revealedCount: 0,
  markedCount: 0,
  secsPassed: 0,
  isFirstClick: true,
  lives: 3,
}

function onInit() {
  gGame.isFirstClick = true
  gBoard = buildBoard()
  renderBoard(gBoard)
}

function buildBoard() {
  const board = []

  for (var i = 0; i < gLevel.SIZE; i++) {
    board.push([])
    for (var j = 0; j < gLevel.SIZE; j++) {
      board[i][j] = {
        minesAroundCount: 0,
        isCovered: true,
        isMine: false,
        isMarked: false,
        isFirstClick: true,
      }
    }
  }
  console.table(board)
  return board
}

function renderBoard(board) {
  var strHTML = ""

  for (var i = 0; i < board.length; i++) {
    strHTML += "<tr>"
    for (var j = 0; j < board[0].length; j++) {
      const cell = board[i][j]
      const className = getClassName({ i, j })

      let cellStyle = ""
      if (!cell.isCovered && cell.minesAroundCount === 0)
        cellStyle = "background-color: lightgreen;"

      const cellContent = cell.isCovered
        ? ""
        : cell.isMine
        ? "💣"
        : cell.minesAroundCount > 0
        ? cell.minesAroundCount
        : ""
      // const cellClass = cell.isMine ? "mine" : "safe"
      strHTML += `<td class="${className}" 
      onclick="onCellClicked(this, ${i}, ${j})"
      oncontextmenu="onCellMarked(event, ${i}, ${j})">
      ${cellContent}
                </td>`
    }
    strHTML += "</tr>"
  }
  const elBoard = document.querySelector(".board")
  elBoard.innerHTML = strHTML
}

function placeMines(board, firstI, firstJ) {
  var placedMines = 0
  while (placedMines < gLevel.MINES) {
    var i = getRandomInt(0, gLevel.SIZE - 1)
    var j = getRandomInt(0, gLevel.SIZE - 1)

    if (i === firstI && j === firstJ) continue

    if (!board[i][j].isMine) {
      board[i][j].isMine = true
      placedMines++
    }
  }
}

function setMinesNegsCount(board) {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      if (!board[i][j].isMine) {
        board[i][j].minesAroundCount = minesAroundCount(board, i, j)
        // console.log(`Cell (${i},${j}) has ${board[i][j].minesAroundCount} mines around`)
      }
    }
  }
}

function minesAroundCount(board, rowIdx, colIdx) {
  var count = 0
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= board[0].length || (i === rowIdx && j === colIdx))
        continue
      if (board[i][j].isMine) count++
    }
  }
  return count
}

function onCellClicked(elCell, i, j) {
  const cell = gBoard[i][j]
  if (!cell.isCovered) return

  if (gGame.isFirstClick) {
    gGame.isFirstClick = false
    placeMines(gBoard, i, j)
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
  }

  if (cell.isMine) {
    gGame.lives--
    updateLivesDisplay()
    elCell.style.backgroundColor = "red"

    if (gGame.lives === 0) {
      console.log("you lost")
      revealBoard()
      return
    } else {
      console.log(`Oops! You hit a mine! Lives left: ${gGame.lives}`)
      renderCell({ i, j }, "💣")
      return
    }
  }
  cell.isCovered = false
  if (cell.minesAroundCount === 0) expandReveal(gBoard, i, j)
  renderBoard(gBoard)
}

function revealBoard() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[i].length; j++) {
      const cell = gBoard[i][j]
      cell.isCovered = false
      const cellContent = cell.isMine
        ? "💣"
        : cell.minesAroundCount > 0
        ? cell.minesAroundCount
        : ""
      renderCell({ i, j }, cellContent)
    }
  }
}

function onCellMarked(event, i, j) {
  event.preventDefault()
  const cell = gBoard[i][j]
  if (!cell.isCovered) return

  cell.isMarked = !cell.isMarked

  const cellFlag = cell.isMarked ? "🚩" : ""
  renderCell({ i, j }, cellFlag)
  checkGameOver()
}




function expandReveal(board, rowIdx, colIdx) {
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= board[0].length || (i === rowIdx && j === colIdx))
        continue
      const neighbor = board[i][j]
      
      if (!neighbor.isCovered) continue
      
      neighbor.isCovered = false
      if (neighbor.minesAroundCount === 0) {
        expandReveal(board, i, j)
      }
    }
  }
  renderBoard(board)
}

function getClassName(location) {
  const cellClass = "cell-" + location.i + "-" + location.j
  return cellClass
}

function onRestart() {
  document.querySelector(".restart")
  gGame.lives = 3
  onInit()
}

function renderCell(location, value) {
  const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
  if (elCell) elCell.innerHTML = value
}

function setDifficulty(newSize) {
  gLevel.SIZE = newSize
  onRestart()
}

function updateLivesDisplay() {
  const elLives = document.querySelector(".lives")
  if (!elLives) return
  
  elLives.innerText = `❤️ Lives: ${gGame.lives}`
}

// function checkGameOver() {
//   for (var i = 0; i < gBoard.length; i++) {
//     for (j = 0; j < gBoard[0].length; j++) {
//       var cell = gBoard[i][j]

//       if (!cell.isMine && cell.isCovered) {
//         return
//       }
//     }
//   }
// console.log('win');
// }
function checkGameOver(gBoard) {
  var isGameOver = true
  var totalCoveredCells = 0
  var totalCells = gLevel.SIZE * gLevel.SIZE
  
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      var currCell = gBoard[i][j]
      if (currCell.isCovered) {
        totalCoveredCells++
      }
      
      if (currCell.isCovered && !currCell.isMine) {
        isGameOver = false
      }
    }
  }
  
  if (totalCoveredCells === gGame.lives) {
    alert('You Win!')
    gGame.isOn = false
  }
  
  return isGameOver
}