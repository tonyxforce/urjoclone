import { UrjoGenerator } from "../generator/generator.js";

const generator = new UrjoGenerator();
generator.initBoard(6, 6);
const generatedBoard = generator.createPuzzle();
console.log(generatedBoard.toString());