var url = new URL(document.URL);
var gameString = url.hash.substring(1);

var puzzle = new Puzzle(gameString);

puzzle.renderPuzzle("gameHolder");
puzzle.setWinCallback(() => {
    alert("You win with " + puzzle.getMistakeCount() + " mistakes.");
});