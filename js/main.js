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
  hints: 3,
  isHint: false,
  score: 0,
  safeClick: 3,
}

var gMovesHistory = []

function onInit() {
  gGame.isOn = true
  gGame.isFirstClick = true
  gBoard = buildBoard()
  renderBoard(gBoard)
  showGameOver()
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

      var cellStyle = cell.isCovered
      ? "background-color: grey"
      :cell.isMine
      ? "background-color: red; color: white;" 
      : "background-color: white;";

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
      if (!cell.isMine && cell.minesAroundCount === 0 && !cell.isCovered) {
        document.querySelector(`.${className}`).style.backgroundColor = "#fff"
      }
    }
    strHTML += "</tr>"
  }
  const elBoard = document.querySelector(".board")
  elBoard.innerHTML = strHTML
}

function placeMines(board, firstI, firstJ) {
  var emptyCells = []

  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      if (i === firstI && j === firstJ) continue
      if (!board[i][j].isMine) {
        emptyCells.push({ i, j })
      }
    }
  }
  for (var k = 0; k < gLevel.MINES; k++) {
    if (emptyCells.length === 0) break

    var randIdx = getRandomInt(0, emptyCells.length - 1)
    var cell = emptyCells.splice(randIdx, 1)[0]
    board[cell.i][cell.j].isMine = true
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
if (!gGame.isOn) return
saveGameStatus()


  const cell = gBoard[i][j]
  if (!cell.isCovered || cell.isMarked) return
  cell.isCovered = false
  renderBoard(gBoard)
  checkWin()

  if (gGame.isHint) {
    gGame.isHintCells = false
    gGame.hints--
    placeMines(gBoard, i, j)
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
    return
  }

  if (gGame.isFirstClick) {
    gGame.isFirstClick = false
    placeMines(gBoard, i, j)
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
  }
  if (cell.isMine) {
    gGame.lives--
    gGame.score -= 10
    updateScore()
    updateLivesDisplay()
    updateSmiley()
    elCell.style.backgroundColor = "red"
    cell.isCovered = false

    if (gGame.lives === 0) {
      showGameModal()
      console.log("you lost")
      revealBoard()
      return
    } else {
      cell.isCovered = false
      gGame.score += 10
      updateScore()
      console.log(`Oops! You hit a mine! Lives left: ${gGame.lives}`)
      if (cell.minesAroundCount === 0) expandReveal(gBoard, i, j)
      renderBoard(gBoard)
      checkWin()
      // renderCell({ i, j }, "💣")
      return
    }
  }
  if (cell.minesAroundCount === 0) expandReveal(gBoard, i, j)
  renderBoard(gBoard)
  showGameOver()
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
  if (!gGame.isOn) return

  const cell = gBoard[i][j]
  if (!cell.isCovered) return

  cell.isMarked = !cell.isMarked

  renderCell({ i, j }, cell.isMarked ? "🚩" : "")
  console.log(`🛑 onCellMarked called at (${i},${j})`)

  if (cell.isMine && cell.isMarked) {
    gGame.score += 5
  } else if (cell.isMine && !cell.isMarked) {
    gGame.score -= 5
  }
  updateScore()
  // console.log(gBoard[i][j])
}

function updateScore() {
  const elScore = document.querySelector(".score")
  if (!elScore) {
    return
  }
  console.log("📢 ניקוד מעודכן:", gGame.score)
  elScore.innerText = gGame.score
}

function howManyBomb(SIZE) {
  if (SIZE === 4) gLevel.MINES = 2
  else if (SIZE === 8) gLevel.MINES = 12
  else if (SIZE === 12) gLevel.MINES = 30
  console.log(`Number of bombs set to: ${gLevel.MINES}`)
}

function expandReveal(board, rowIdx, colIdx) {
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= board[0].length || (i === rowIdx && j === colIdx))
        continue

      const cellNeighbor = board[i][j]

      if (!cellNeighbor.isCovered) continue

      cellNeighbor.isCovered = false
      if (cellNeighbor.minesAroundCount === 0) {
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
  closeGameModal()
  gGame.score = 0
  updateScore()

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

  if (value === "💣") {
    elCell.style.backgroundColor = "red"
    elCell.style.color = "white"
  }
  elCell.innerHTML = value
}

function setDifficulty(newSize) {
  gLevel.SIZE = newSize
  howManyBomb(newSize)
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
    // elSmiley.innerText = "😎"
  } else if (gGame.lives === 0) {
    elSmiley.innerText = "☠️"
  } else if (gGame.lives === 1) {
    elSmiley.innerText = "😥"
  } else if (gGame.lives === 2) {
    elSmiley.innerText = "😊"
  } else if (gGame.lives === 3) {
    elSmiley.innerText = "😁"
  }
}

function safeClick() {
  if (gGame.safeClick === 0) {
    console.log("No more safe clicks")
    return
  }

  var safeCells = []

  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      const cell = gBoard[i][j]
      if (!cell.isMine && cell.isCovered) {
        safeCells.push({ i, j })
      }
    }
  }
  if (safeCells.length === 0) {
    console.log("No more safe clicks")
    return
  }

  var randIdx = Math.floor(Math.random() * safeCells.length)
  var safeCell = safeCells[randIdx]
  var elCell = document.querySelector(`.cell-${safeCell.i}-${safeCell.j}`)

  setTimeout(() => {
    elCell.style.backgroundColor = ''
  }, 1500);

  gGame.safeClick--
  updateSafeClicksDisplay()
}

function updateSafeClicksDisplay(){
  const elSafeClicks = document.querySelector('.safe-clicks')
  if (!elSafeClicks) return
  elSafeClicks.innerText = `Safe clicks: ${gGame.safeClick}`
}

function showGameOver() {
  if (!gGame.isOn) return

  if (gGame.lives === 0) {
    console.log("Game over!")
    gGame.isOn = false
    showGameModal(false)
    return
  }

  var totalCells = gLevel.SIZE ** 2
  var noneMineCells = totalCells - gLevel.MINES
  var revealedCells = 0

  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      const cell = gBoard[i][j]
      if (!cell.isCovered && !cell.isCovered) {
        revealedCells++
      }
      if (!cell.isMine && !cell.isCovered) {
        revealedCells++
      }
    }
  }
  if (revealedCells === noneMineCells) {
    console.log("you win")
    gGame.isOn = false
    gGame.score += Math.max(0, 100 - gGame.secsPassed * 2)
    updateScore()
    showGameModal()
  }
}

function showGameModal(isWin) {
  const elModal = document.querySelector(".modal")
  const elMsg = document.querySelector(".modal-msg")

  elModal.classList.remove("hidden")
  elModal.style.display = "block"
  elMsg.innerText = isWin ? "You win" : "Game over"
}

function closeGameModal() {
  const elModal = document.querySelector(".modal")
  if (!elModal) return
  elModal.classList.add("hidden")
  elModal.style.display = "none"
}

function activateHint(elHints) {
  if (elHints.classList.contains("used")) return
  elHints.style.backgroundColor = "yellow"
  elHints.classList.add("used")

  var emptyCells = []

  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      const cell = gBoard[i][j]
      if (!cell.isMine && cell.isCovered) {
        emptyCells.push(i, j)
      }
    }
  }
  if (emptyCells.length === 0) return
  var randIdx = Math.floor(Math.random() * emptyCells.length)

  setTimeout(() => {
    cellElement.innerHTML = ""
    cellElement.style.backgroundColor = "blue"
  }, 1500)
  console.log(`elHints:`, elHints)
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode")
}

function checkWin() {
  if (!gGame.isOn) return

  var totalCells = gLevel.SIZE ** 2
  var noneMineCells = totalCells - gLevel.MINES
  var revealedCells = 0

  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      const cell = gBoard[i][j]
      if (!cell.isMine && !cell.isCovered) revealedCells++
    }
  }
  if (revealedCells === noneMineCells) {
    console.log("You win")
    gGame.isOn = false
    showGameModal(true)
  }
}

function saveGameStatus (){
  const boardCopy = gBoard.map(row => row.map(cell => ({...cell })))
  gMovesHistory.push(boardCopy)
}

function undoMove(){
  if (gMovesHistory.length === 0) {
    return
  }

  gBoard =gMovesHistory.pop()
  renderBoard(gBoard)
}