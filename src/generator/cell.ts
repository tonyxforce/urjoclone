import { Row, Column, getColorCounts } from "./lines.js";

export type Color = "red" | "blue";

export class Cell {
    color: Color | null;

    hidden: boolean = false;
    number: number | null = null;

    posX: number;
    posY: number;

    row: Row | null = null;
    column: Column | null = null;

    getNumber() {
        return this.number;
    }

    calculateNumber(): number | null {
        const board = this.row?.board;

        if (board === null || board === undefined) return null; // This is a cell outside of a board

        const surroundingCells = board.getSurroundingCells(this);

        var number = Object.values(surroundingCells).filter((e) => e != null && e.color == this.color).length

        this.number = number;

        return number;
    }

    getColor(): Color | null {
        return this.color;
    }

    isHidden(): boolean {
        return this.hidden;
    }

    tryToFill(): Cell[] {
        const thisNumber = this.getNumber();
        if (thisNumber == undefined) throw new Error("The cell's number cannot be undefined!");
        if (thisNumber == null) return [];

        if (this.row === undefined || this.row === null) throw new Error("You can't fill a cell outside of a row!");

        if (this.row.board === undefined || this.row.board === null) throw new Error("You can't fill a cell outside of a board!")

        const allSurroundingCells = Object.values(this.row.board.getSurroundingCells(this));
        const surroundingCells = allSurroundingCells.filter(e => e != undefined && e != null);

        if (thisNumber < 0 || thisNumber > 8) throw new Error("A cell's number cannot be over 8 or under 0!");

        const { redCount, blueCount, uncoloredCount } = getColorCounts(surroundingCells);

        var requiredSame = thisNumber;
        var requiredOpposite = 8 - thisNumber;

        var changedCells: Cell[] = [];

        function feasibleIfColor(color: Color): boolean {
            if (color == "red") {
                var sameCount = redCount;
                var oppositeCount = blueCount;
            } else {
                var sameCount = blueCount;
                var oppositeCount = redCount;
            }
            if (sameCount > requiredSame || sameCount + uncoloredCount < requiredSame) {
                return false;
            }
            if (oppositeCount > requiredOpposite || oppositeCount + uncoloredCount < requiredOpposite) {
                return false;
            }
            return true;
        }

        const thisColor = this.getColor();
        if (thisColor == null) {
            const canBeRed = feasibleIfColor("red");
            const canBeBlue = feasibleIfColor("blue");
            if (canBeBlue != canBeRed) {
                this.color = canBeRed ? "red" : "blue";
                this.hidden = false;
                changedCells.push(this);
            }
            if (!canBeRed && !canBeBlue) {
                return changedCells;
            }
            return changedCells
        }

        var sameColor: Color = "red";
        var oppositeColor: Color = "red";
        var sameCount: number = 0;
        var oppositeCount: number = 0;

        if (thisColor == "red") {
            sameCount = redCount;
            oppositeCount = blueCount;
            sameColor = "red";
            oppositeColor = "blue";
        } else {
            sameCount = blueCount;
            oppositeCount = redCount;
            sameColor = "blue";
            oppositeColor = "red";
        }

        if(sameCount == requiredSame && uncoloredCount > 0){
            surroundingCells.forEach((cell: Cell, index: number)=>{
                if(cell.getColor() == null){
                    cell.color = oppositeColor;
                    cell.hidden = false;
                    changedCells.push(cell);
                }
            })
            return changedCells;
        }

        if(oppositeCount == requiredOpposite && uncoloredCount > 0){
            surroundingCells.forEach((cell: Cell, index: number)=>{
                if(cell.getColor() == null){
                    cell.color = sameColor;
                    cell.hidden = false;
                    changedCells.push(cell);
                }
            })
            return changedCells;
        }

        if(sameCount + uncoloredCount == requiredSame && uncoloredCount > 0){
            surroundingCells.forEach((cell: Cell, index: number)=>{
                if(cell.getColor() == null){
                    cell.color = oppositeColor;
                    changedCells.push(cell);
                }
            })
        }

        return [];
    }

    constructor(
        color: Color,
        number: number | null,
        xPos: number,
        yPos: number,
        hidden: boolean,
        row: Row | null,
        column: Column | null,
    ) {
        this.color = color;
        this.number = number;
        this.posX = xPos;
        this.posY = yPos;
        this.hidden = hidden;
        this.row = row;
        this.column = column;
    }
}

export function invertColor(color: Color | null): Color | null {
    if (color === "red") {
        return "blue";
    }
    if (color === "blue") {
        return "red";
    }
    if(color == null){
        return null;
    }
    return "blue"; // This will not run
}
