"use strict"

var gBoard = {
  minesAroundCount: 4,
  isCovered: true,
  isMine: false,
  isMarked: false,
}

var gLevel = {
  SIZE: 4,
  MINES: 3,
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

      var cellStyle = ""
      if (!cell.isCovered && cell.isMine) {
        cellStyle = "background-color: red; color: white;"
      }

      const cellContent = cell.isCovered
        ? cell.isMarked
          ? "🚩"
          : ""
        : cell.isMine
        ? "💣"
        : cell.minesAroundCount > 0
        ? cell.minesAroundCount
        : ""
      strHTML += `<td class="${className}" style="${cellStyle}" 
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
  if (!cell.isCovered || cell.isMarked) return

  if (gGame.isFirstClick) {
    gGame.isFirstClick = false
    placeMines(gBoard, i, j)
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
  }
  if (cell.isMine) {
    gGame.lives--
    updateLivesDisplay()
    updateSmiley()
    elCell.style.backgroundColor = "red"
    cell.isCovered = false

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
  if (cell.isCovered) return

  cell.isMarked = !cell.isMarked

  renderCell({ i, j }, cell.isMarked ? "🚩" : "")
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
  updateSmiley()
  updateLivesDisplay()
  onInit()
}

function renderCell(location, value) {
  const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
  if (!elCell) return

  const cell = gBoard[location.i][location.j]

  if (cell.isMarked) {
    elCell.innerHTML = "🚩"
    return
  }

  // if (!elCell.isConnected && cell.isMine){
  //   elCell.innerHTML = "💣"
  //   elCell.style.backgroundColor = "red"
  //   elCell.style.color = "white"
  //   return
  if (value === "💣") {
    elCell.style.backgroundColor = "red"
    elCell.style.color = "white"
  }
  elCell.innerHTML = value
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

function updateSmiley(isWin = null) {
  const elSmiley = document.querySelector(".restart")
  if (isWin === true) {
    elSmiley.innerText = "😎"
  } else if (gGame.lives === 0) {
    elSmiley.innerText = "☠️"
  } else if (gGame.lives < 3) {
    elSmiley.innerText = "😨"
  } else if (gGame.lives === 3) {
    elSmiley.innerText = "🙂"
  }
}

function checkGameOver(isWin) {
  gGame.isOn = false

  const elModal = document.querySelector(".modal")
  elModal.style.display = "block"

  const elSmiley = document.querySelector(".smiley")
  if (isWin) {
    elModal.innerHTML = "🎉 You Win! 🎉"
    elSmiley.innerText = "😎"
  } else {
    elModal.innerHTML = "💀 Game Over! 💀"
    elSmiley.innerText = "😵"
  }
  setTimeout(() => elModal.remove(), 3000)
}

function checkGameOver() {
  if (gGame.lives === 0) {
    showGameOver(false)
    console.log("Game over!")
    return
  }
  var allCellsRevealed = true
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      const cell = gBoard[i][j]
      if (!cell.isMine && cell.isCovered) {
        allCellsRevealed = false
      }
    }
  }
  if (allCellsRevealed) {
    showGameOver(true)
  }
}
