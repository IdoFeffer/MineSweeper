'use strict'

var gBoard = { 
    minesAroundCount: 4, 
    isCovered: true, 
    isMine: false, 
    isMarked: false 
} 

var gLevel = { 
    SIZE: 4, 
    MINES: 2 
} 

var gGame = { 
    isOn: false, 
    revealedCount: 0, 
    markedCount: 0, 
    secsPassed: 0 
} 


function onInit(){
    renderBoard()
}

function buildBoard(){
    const size = 10
    const board = []
    gFoodCount = 0
  
    for (var i = 0; i < size; i++) {
      board.push([])
  
      for (var j = 0; j < size; j++) {
        board[i][j] = FOOD
        gFoodCount++
      }
    }  
}

var  setMinesNegsCount(board){

}

function renderBoard(board) {

}

function onCellClicked(elCell, i, j) {

}

function onCellMarked(elCell) {

}

function checkGameOver(){

}

function expandReveal(board, elCell, i, j){

} 