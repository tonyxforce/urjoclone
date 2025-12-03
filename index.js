var url = new URL(document.URL);

var gameString = url.searchParams.get("game");

if (!gameString) {
    puzzles = levels["6"]; // 6 for 6x6 puzzles
    gameString = puzzles[Math.floor(Math.random() * puzzles.length)];
}

var puzzle = new Puzzle(gameString);

puzzle.shuffle();
puzzle.render("gameHolder");

puzzle.setWinCallback(() => {
    alert("You win with " + puzzle.getMistakeCount() + " mistakes.");
});

puzzle.setMistakeCallback(()=>{
    alert("Wrong move!");
})