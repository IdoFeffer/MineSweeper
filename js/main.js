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
}

function onInit() {
  gBoard = buildBoard()
  placeMines(gBoard)
  setMinesNegsCount(gBoard)
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
      }
    }
  }
  placeMines(board)
  setMinesNegsCount(board)
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
      const cellContent = cell.isCovered
        ? ""
        : cell.isMine
        ? "💣"
        : cell.minesAroundCount > 0
        ? cell.minesAroundCount
        : ""
      const cellClass = cell.isMine ? "mine" : "safe"
      strHTML += `<td class="${className} ${cellClass}" 
                      onclick="onCellClicked(this, ${i}, ${j})">${cellContent}
                  </td>`
    }
    strHTML += "</tr>"
  }
  const elBoard = document.querySelector(".board")
  elBoard.innerHTML = strHTML
}

function placeMines(board) {
  var placedMines = 0
  while (placedMines < gLevel.MINES) {
    var i = getRandomInt(0, gLevel.SIZE - 1)
    var j = getRandomInt(0, gLevel.SIZE - 1)

    if (!board[i][j].isMine) {
      board[i][j].isMine = true
      placedMines++
      // console.log(`Mine placed at (${i},${j})`)
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
  // console.log(`onCellClicked called for cell (${i}, ${j})`)

  if (!gBoard[i] || !gBoard[i][j]) return

  const cell = gBoard[i][j]
  if (!cell.isCovered) return
  console.log("Cell clicked: ", elCell, i, j)

  if (cell.isMine) {
    console.log("Game over")
    revealBoard()
    return
  }

  cell.isCovered = false
  const cellContent = minesAroundCount(gBoard, i, j)
  renderCell({ i, j }, cellContent)
}

function revealBoard() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[i].length; j++) {
      const cell = gBoard[i][j]
      cell.isCovered = false
      const cellContent = cell.isMine ? "💣" : (cell.minesAroundCount > 0 ? cell.minesAroundCount : "")
      renderCell({ i, j }, cellContent)
    }
  }
}

function onCellMarked(elCell) {
  event.preventDefault()
  const cell = gBoard[i][j]
  if(!cell.isCovered) return

}

// function checkGameOver() {}

function expandReveal(board, elCell, i, j) {
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++){
    if (i < 0 || i >= board.length) continue
    for (var j = colIdx - 1; j <= colIdx + 1; j++){
      if (j < 0 || j >= board[0].length || (i === rowIdx && j === colIdx)) continue
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
