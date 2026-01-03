import { Cell, Color } from "./cell.js";
import { UrjoBoard } from "./urjoboard.js";

export class Line extends Array<Cell> {
    type: "row" | "col" | null = null;
    maxColorCount: number;
    cells: Cell[] = [];
    board: UrjoBoard | null = null;

    constructor(cells: Cell[], type: "row" | "col" | null = null) {
        super(...cells);
        this.type = type;
        if (this.type == null) throw new Error("Please don't instantiate Line directly.");
        this.maxColorCount = 0; // Will be set in the next line
        this.calculateMaxColorCount();
        this.cells = cells;
    }

    _cmp_key(): null | Array<any> {
        var colors: Color[] = []
        this.getCells().forEach((cell: Cell) => {
            var color = cell.getColor();
            if (color === null) return; // Uncolored
            colors.push(color);
        })
        var redCount = colors.filter(c => c === "red").length;
        var blueCount = colors.filter(c => c === "blue").length;
        if (this.maxColorCount !== null && redCount === this.maxColorCount) {
            return colors.map((color, index) => color === "red" ? index : null).filter(i => i !== null);
        }
        if (this.maxColorCount !== null && blueCount === this.maxColorCount) {
            return colors.map((color, index) => color === "blue" ? index : null).filter(i => i !== null);
        }
        return colors;
    };

    calculateMaxColorCount() {
        this.maxColorCount = this.getCells().length / 2;
    }

    checkColorCountValid(): boolean {
        var { redCount, blueCount } = getColorCounts(this);
        return redCount <= this.maxColorCount && blueCount <= this.maxColorCount;
    }

    getCells(): Cell[] {
        return this.cells;
    }


    forEach = this.getCells().forEach;
    join = this.getCells().join;
    get length() {
        return this.getCells().length;
    }


    fillHalfFull(): Cell[] {
        var changedCells: Cell[] = [];
        const { redCount, blueCount } = getColorCounts(this);
        if (redCount == this.maxColorCount) {
            this.forEach((cell: Cell, index: number) => {
                if (cell.getColor() == null) {
                    cell.color = "blue";
                    cell.hidden = false;
                    changedCells.push(cell);
                }
            });
            return changedCells;
        }
        if (blueCount == this.maxColorCount) {
            this.forEach((cell: Cell, index: number) => {
                if (cell.getColor() == null) {
                    cell.color = "red";
                    cell.hidden = false;
                    changedCells.push(cell);
                }
            });
            return changedCells;
        }
        return [];
    }

    unfill() {
        this.cells.sort(() => Math.random() - 0.5); // Shuffle cells
        this.cells.forEach((cell: Cell, index: number) => {
            if (index >= this.maxColorCount) return;
            cell.color = null;
            cell.hidden = true;
        });
    }


}

export class Row extends Line {
    type: "row" = "row";

    constructor(cells: Cell[]) {
        super(cells, "row");
        this.calculateMaxColorCount();
    }
}

export class Column extends Line {
    type: "col" = "col";

    constructor(cells: Cell[]) {
        super(cells, "col");
        this.calculateMaxColorCount();
    }
}

export function nonIdentical(lines: Row[] | Column[], lineIndex: number) {
    // checks if the lines around the cell are identical
    if (lineIndex > 0) {
        // If not first line, check previous line
        if (lines[lineIndex - 1] === lines[lineIndex]) {
            return false;
        }
    }
    if (lineIndex < (lines.length - 1)) {
        // If not last line, check next line
        if (lines[lineIndex + 1] === lines[lineIndex]) {
            return false;
        }
    }
    return true;
};

export function linesDifferent(line1: Row | Column, line2: typeof line1) {
    if (line1.getCells().length !== line2.getCells().length) {
        return true;
    }

    for (let i = 0; i < line1.getCells().length; i++) {

        var cell1 = line1.getCells()[i];
        if (cell1 === undefined) continue;

        var cell2 = line2.getCells()[i];
        if (cell2 === undefined) continue;

        if (cell1.getColor() !== cell2.getColor()) {
            return true;
        }
    }
    return false;
}

export function getColorCounts(line: (Cell | null)[] | Line): { redCount: number, blueCount: number, uncoloredCount: number } {
    var redCount = 0;
    var blueCount = 0;
    var uncoloredCount = 0;
    if (line instanceof Line) {
        line = line.getCells()
    }
    line.forEach((cell: Cell | null) => {
        if (cell == null) return;
        var color = cell.getColor();
        if (color === "red") {
            redCount++;
        } else if (color === "blue") {
            blueCount++;
        } else {
            uncoloredCount++;
        }
    });
    return { redCount, blueCount, uncoloredCount };
}