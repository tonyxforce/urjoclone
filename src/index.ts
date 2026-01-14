import { Puzzle } from "./puzzle.js";
import { UrjoGenerator } from "./generator.js";

var url = new URL(document.URL);



function setNewPuzzle() {

    var gameString = url.searchParams.get("game");

    if (!gameString) {
        const generator = new UrjoGenerator();
        generator.initBoard(4, 4);
        const generatedBoard = generator.createPuzzle({
            numberOfNumbers: 1,
            contradictionCount: 2,
            identicalChecks: true
        });
        console.log(generatedBoard.toString());
        console.log(generatedBoard.toUrl());
        gameString = generatedBoard.toUrl();
    }

    const puzzle = new Puzzle(gameString);

    puzzle.render("gameHolder");

    puzzle.setWinCallback(() => {
        alert("You win with " + puzzle.getMistakeCount() + " mistakes.");
        setNewPuzzle();
    });

    puzzle.setMistakeCallback(() => {
        alert("Wrong move!");
    })
}

setNewPuzzle();

