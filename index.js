var url = new URL(document.URL);
var gameString = url.searchParams.get("game");

var puzzle = new Puzzle(gameString);

puzzle.render("gameHolder");
puzzle.shuffle();
puzzle.setWinCallback(() => {
    alert("You win with " + puzzle.getMistakeCount() + " mistakes.");
});
puzzle.setMistakeCallback(()=>{
    alert("Wrong move!");
})