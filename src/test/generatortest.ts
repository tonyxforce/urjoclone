import { UrjoGenerator } from "../generator.js";

const generator = new UrjoGenerator();
generator.initBoard(4, 4);
const generatedBoard = generator.createPuzzle({
    numberOfNumbers: 5,
    contradictionCount: 2,
    identicalChecks: false
});
console.log(generatedBoard.toString());
console.log(generatedBoard.toUrl());