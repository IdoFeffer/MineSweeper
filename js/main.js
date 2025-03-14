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
  isManualMode: false,
  isMegaMode: false,
}

var gTimer = 60
var gMovesHistory = []
var gInterval = null

function onInit() {
  gGame.isOn = true
  gGame.isFirstClick = true
  gBoard = buildBoard()
  renderBoard(gBoard)
  showGameOver()
  gTimer = 60
  clearInterval(gInterval)
  gInterval = null
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
        : cell.isMine
        ? "background-color: red; color: white;"
        : "background-color: white;"

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

function updateMinesNegsCount() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (!gBoard[i][j].isMine) {
        gBoard[i][j].minesAroundCount = countMinesAround(i, j)
      }
    }
  }
}

function countMinesAround() {
  var count = 0

  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue

    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= gBoard[0].length) continue
      if (i === rowIdx && j === colIdx) continue

      if (gBoard[i][j].isMine) count++
    }
  }
  return count
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

  if (gGame.isFirstClick) {
    gGame.isFirstClick = false
    placeMines(gBoard, i, j)
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
    startTimer()
  }

  if (gGame.isMegaMode) {
    gGame.megaHintCells.push({ i, j })

    if (gGame.megaHintCells.length === 2) {
      revealMegaHintArea()
      gGame.isMegaMode = false
    }
    return
  }

  if (gGame.isManualMode) {
    if (gBoard[i][j].isMine) return
  }

  if (gGame.isHint) {
    gGame.isHint = false
    revealHintedCells(i, j)
    return
  }

  if (cell.isMine) {
    gGame.lives--
    console.log("💥 Mine hit! Lives left:", gGame.lives)
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
      return
    }
  }

  if (gGame.isMegaMode) {
    if (gGam.megaHintCells.length < 2) {
      gGame.megaHintCells.push({i, j})

      if ( gGame.megaHintCells.length === 2) {
        revealMegaHintArea()
        gGame.isMegaMode = false
      }
    }
    return
  }

  if (cell.minesAroundCount === 0) expandReveal(gBoard, i, j)
  renderBoard(gBoard)
  showGameOver()
}

function revealMegaHintArea() {
if (gGame.megaHintCells.length < 2) return

  // var [first, second] = gGame.megaHintCells
  var first = gGame.megaHintCells[0]
  var second = gGame.megaHintCells[1]

  console.log(`Revealing area from (${first.i}, ${first.j}) to (${second.i}, ${second.j})`)

  for (var i = first.i; i <= second.i; i++) {
    for (var j = first.j; j <= second.j; j++) {
      gBoard[i][j].isCovered = false
    }
  }
  renderBoard(gBoard)

  setTimeout(() => {
    for (var i = first.i; i <= second.i; i++) {
      for (var j = first.j; j <= second.j; j++) {
        gBoard[i][j].isCovered = true
      }
    }
    gGame.isMegaMode = false
    renderBoard(gBoard)
  }, 2000)
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
    cell.isMarked = false
  } else if (cell.isMine && !cell.isMarked) {
    gGame.score -= 5
    cell.isMarked = true
  }
  updateScore()
}

function updateScore() {
  const elScore = document.querySelector(".score")
  if (!elScore) {
    return
  }
  console.log("📢 Score:", gGame.score)
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
  clearInterval(gInterval)
  gInterval = null
  gTimer = 60
  document.querySelector(".timer").innerText = `⏳ Timer: ${gTimer.toFixed(0)}`

  gGame.safeClick = 3
  updateSafeClicksDisplay()

  gGame.lives = 3
  gGame.isFirstClick = true
  gGame.isHint = false

  var elHints = document.querySelectorAll(".hint")
  elHints.forEach(hint => {
    hint.style.backgroundColor = ""
    hint.classList.remove("used") 
  })

  updateSmiley()
  updateLivesDisplay()
  closeGameModal()
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
  if (!elCell) return

  elCell.style.backgroundColor = 'blue'

  setTimeout(() => {
    elCell.style.backgroundColor = ""
  }, 1500)

  gGame.safeClick--
  updateSafeClicksDisplay()
}

function updateSafeClicksDisplay() {
  var elSafeClicks = document.querySelector(".safe-clicks");
  if (!elSafeClicks) {
      return;
  }

  elSafeClicks.innerText = `🛡️ Safe clicks: ${gGame.safeClick}`;
  console.log("Updating safe clicks display:", gGame.safeClick);
}

function showGameOver() {
  if (!gGame.isOn) return

  clearInterval(gInterval)
  gInterval = null

  const elModal = document.querySelector(".modal")

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

function activateHint(elHint) {
  if (gGame.hints === 0 || gGame.isHint) return

  gGame.isHint = true
  elHint.classList.add("used")
  elHint.style.backgroundColor = "yellow"
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode")

  var elToggleBtn = document.getElementById("darkModeLabel")
  if (document.body.classList.contains("dark-mode")) {
    elToggleBtn.innerText = "Light Mode"
  } else {
    elToggleBtn.innerText = "Dark Mode"
  }
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
    clearInterval(gInterval)
    gGame.isOn = false
    showGameModal(true)
    console.log("You win")
  }
}

function saveGameStatus() {
  const boardCopy = gBoard.map((row) => row.map((cell) => ({ ...cell })))
  gMovesHistory.push(boardCopy)
}

function undoMove() {
  if (gMovesHistory.length === 0) {
    return
  }

  gBoard = gMovesHistory.pop()
  renderBoard(gBoard)
}

function startTimer() {
  if (gInterval) return

  var elTimer = document.querySelector(".timer")
  gTimer = 60
  elTimer.innerText = `⏳ Timer: ${gTimer.toFixed(0)}`

  gInterval = setInterval(() => {
    if (!gGame.isOn) {
      clearInterval(gInterval)
      gInterval = null
      return
    }

    gTimer--
    elTimer.innerText = `⏳ Timer: ${gTimer.toFixed(0)}`

    if (gTimer <= 0) {
      clearInterval(gInterval)
      gInterval = null
      elTimer.innerText = "⏳ Timer: 0"
      gGame.isOn = false
      showGameOver(true)
    }
  }, 1000)
}

function revealHintedCells(row, col) {
  var revealedCells = []

  for (var i = row - 1; i <= row + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue
    for (var j = col - 1; j <= col + 1; j++) {
      if (j < 0 || j >= gBoard[0].length) continue

      var cell = gBoard[i][j]
      if (cell.isCovered) {
        cell.isCovered = false
        revealedCells.push({ i, j })
      }
    }
  }
  renderBoard(gBoard)

  setTimeout(() => {
    for (var pos of revealedCells) {
      gBoard[pos.i][pos.j].isCovered = true
    }
    gGame.isHint = false
    renderBoard(gBoard)
  }, 1500)
}

function enableManualMode() {
  gGame.isManualMode = true
  gGame.isFirstClick = false
  gBoard = buildBoard()
  renderBoard(gBoard)
  console.log("Manual mine placement mode ON")
}

function activateMegaHint() {
  if (gGame.isMegaMode) return

  gGame.isMegaMode = true
  gGame.megaHintCells = []
  console.log("Mega Hint mode activated! Select two cells.")
}

function exterminateMines() {
  if (!gGame.isOn) return
  var mines = []

  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      const cell = gBoard[i][j]
      if (cell.isMine === true) mines.push({ i, j })
    }
  }

  if (mines.length < 3) return

  for (var k = 0; k < 3; k++) {
    var randIdx = getRandomInt(0, mines.length - 1)
    var minesToRemove = mines.splice(randIdx, 1)[0]

    gBoard[minesToRemove.i][minesToRemove.j].isMine = false
  }

    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
}
