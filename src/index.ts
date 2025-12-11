import { Puzzle } from "./puzzle.js";

var url = new URL(document.URL);

var gameString = url.searchParams.get("game");

if(!gameString){
    gameString = "$0"
}

const puzzle = new Puzzle(gameString);

//puzzle.shuffle();
puzzle.render("gameHolder");

puzzle.setWinCallback(() => {
    alert("You win with " + puzzle.getMistakeCount() + " mistakes.");
});

puzzle.setMistakeCallback(()=>{
    alert("Wrong move!");
})
