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
  hints: 3,
  isHint: false,
}

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
        // : cell.style.backgroundColor = "#fff"
        : "⬜"
      strHTML += `<td class="${className}" style="${cellStyle}" 
        onclick="onCellClicked(this, ${i}, ${j})"
        oncontextmenu="onCellMarked(event, ${i}, ${j})">
        ${cellContent}
        </td>`
        if (!cell.isMine && cell.minesAroundCount === 0 && !cell.isCovered) {
          document.querySelector(`.${className}`).style.backgroundColor = "#fff";
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

// function placeMines(board, firstI, firstJ) {
//   var placedMines = 0
//   while (placedMines < gLevel.MINES) {
//     var i = getRandomInt(0, gLevel.SIZE - 1)
//     var j = getRandomInt(0, gLevel.SIZE - 1)

//     if (i === firstI && j === firstJ) continue

//     if (!board[i][j].isMine) {
//       board[i][j].isMine = true
//       placedMines++
//     }
//   }
// }

/////////////////////////////////////////////////
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

  const cell = gBoard[i][j]
  if (!cell.isCovered) return

  cell.isMarked = !cell.isMarked

  renderCell({ i, j }, cell.isMarked ? "🚩" : "")
  console.log(gBoard[i][j])
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

// function checkGameOver(isWin) {
//   gGame.isOn = false

//   const elModal = document.querySelector(".modal")
//   elModal.style.display = "block"

//   const elSmiley = document.querySelector(".smiley")
//   if (isWin) {
//     elModal.innerHTML = "🎉 You Win! 🎉"
//     elSmiley.innerText = "😎"
//   } else {
//     elModal.innerHTML = "💀 Game Over! 💀"
//     elSmiley.innerText = "😵"
//   }
//   setTimeout(() => elModal.remove(), 3000)
// }

function showGameOver(isWin) {
  console.log("🔥 showGameOver called with isWin =", isWin) // בדיקה אם הפונקציה רצה

  if (gGame.lives === 0) {
    showGameOver(false)
    console.log("Game over!")
    return
  }
  var totalCells = gLevel.SIZE ** 2
  var noneMineCells = totalCells - gLevel.MINES
  var revealedCells = 0

  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      const cell = gBoard[i][j]
      console
        .log
        // `Cell (${i},${j}): isMine=${cell.isMine}, isCovered=${cell.isCovered}`
        ()

      if (!cell.isMine && !cell.isCovered) {
        revealedCells++
      }
    }
  }
  if (revealedCells === noneMineCells) {
    showGameOver(true)
    gGame.isOn = false
    console.log("you win")
  }
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
  var randIdx = Math.floor(Math.random() *emptyCells.length)
  var chooseCell = emptyCells[randIdx]

  setTimeout(() => {
    cellElement.innerHTML = ""
    cellElement.style.backgroundColor = "grey"
  }, 1500)
  console.log(`elHints:`, elHints)
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

// function revealHintCells(rowIdx, colIdx) {
//   var cellToReveal = []

//   for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
//     if (i < 0 || i >= gBoard.length) continue
//     for (var j = colIdx - 1; j <= colIdx + 1; j++) {
//       if (j < 0 || j >= gBoard[0].length) continue

//       const cell = gBoard[i][j]
//       if (cell.isCovered) {
//         cellToReveal.push({
//           i,
//           j,
//           content: cell.isMine ? "💣" : cell.minesAroundCount || "",
//         })
//         renderCell({ i, j }, cell.isMine ? "💣" : cell.minesAroundCount || "")
//       }
//     }
//   }
//   setTimeout(() => {
//     for (var cell of cellToReveal) {
//       renderCell(cell, "")
//     }
//   }, 1500)
// }
