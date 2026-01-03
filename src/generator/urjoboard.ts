import { Column, Row, Line } from "./lines.js";
import { Cell, Color } from "./cell.js"

type SurroundingCellsType = {
    upLeft?: Cell | null,
    up?: Cell | null,
    upRight?: Cell | null,
    left?: Cell | null,
    right?: Cell | null,
    downLeft?: Cell | null,
    down?: Cell | null,
    downRight?: Cell | null,
}

class SurroundingCells {
    upLeft: Cell | null = null;
    up: Cell | null = null;
    upRight: Cell | null = null;
    left: Cell | null = null;
    right: Cell | null = null;
    downLeft: Cell | null = null;
    down: Cell | null = null;
    downRight: Cell | null = null;
    constructor(data: SurroundingCellsType = {}) {
        this.upLeft = data.upLeft ?? null;
        this.up = data.up ?? null;
        this.upRight = data.upRight ?? null;
        this.left = data.left ?? null;
        this.right = data.right ?? null;
        this.downLeft = data.downLeft ?? null;
        this.down = data.down ?? null;
        this.downRight = data.downRight ?? null;
    }
    toArray() {
        return [
            this.upLeft,
            this.up,
            this.upRight,
            this.left,
            this.right,
            this.downLeft,
            this.down,
            this.downRight,
        ]
    }
};
const base36Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export class UrjoBoard {
    rows: Row[] = [];
    cols: Column[] = [];

    numberedCells: number = 0;
    cells: Cell[] = [];

    sizeX: number = 0;
    sizeY: number = 0;

    contradictionCount: number = 0;

    constructor(rows: Row[]) {
        this.rows = rows;
        this.cells = [];
        this.rows.forEach(row => {
            row.getCells().forEach(cell => {
                this.cells.push(cell);
            })
        })
    }

    getRows() {
        return this.rows;
    }

    getWidth(): number {
        var row0 = this.rows[0];
        if (row0 === undefined) return 0; // No first row => size is 0
        return row0.length;
    }

    getHeight(): number {
        return this.rows.length;
    }

    toString() {
        var lines: String[] = [];
        this.getRows().forEach((row) => {
            var currentRow: string[] = []
            row.forEach((cell: Cell) => {
                var cellColor = cell.getColor();
                if (cellColor == "red")
                    currentRow.push("R");
                else if (cellColor == "blue")
                    currentRow.push("B")
                else if (cellColor == null)
                    currentRow.push(".")
            })
            lines.push(currentRow.join(" "));
        });
        return lines.join("\n")
    }

    // Add this private helper method to the UrjoBoard class (before decodeString)
    private parsePuzzleFormat(puzzleString: string): { sizeX: number; sizeY: number; puzzleData: string } {
        if (!puzzleString.startsWith("$")) {
            // Plain puzzle data: assume square grid based on length
            const length = puzzleString.length;
            const size = Math.sqrt(length);
            if (size !== Math.floor(size)) {
                throw new Error(`Invalid puzzle string length: ${length} (must be a square)`);
            }
            return { sizeX: size, sizeY: size, puzzleData: puzzleString };
        }

        const parts = puzzleString.split("$")
        parts.shift(); // Remove the empty string before the first $
        if (parts.length === 1) {
            // Format: $<size> (creative mode square)
            const size = parseInt(parts[0]!, 10);
            if (isNaN(size) || size <= 0) {
                throw new Error(`Invalid size: ${parts[0]}`);
            }
            return { sizeX: size, sizeY: size, puzzleData: new Array(size * size).fill("0").join("") };
        } else if (parts.length === 2) {
            // Format: $<sizeX>$<sizeY> (creative mode rectangle)
            const sizeX = parseInt(parts[0]!, 10);
            const sizeY = parseInt(parts[1]!, 10);
            if (isNaN(sizeX) || isNaN(sizeY) || sizeX <= 0 || sizeY <= 0) {
                throw new Error(`Invalid sizes: ${parts[0]} x ${parts[1]}`);
            }
            return { sizeX, sizeY, puzzleData: new Array(sizeX * sizeY).fill("0").join("") };
        } else if (parts.length === 3) {
            // Format: $<sizeX>$<sizeY>$<puzzleData>
            const sizeX = parseInt(parts[0]!, 10);
            const sizeY = parseInt(parts[1]!, 10);
            const puzzleData = parts[2]!;
            if (isNaN(sizeX) || isNaN(sizeY) || sizeX <= 0 || sizeY <= 0) {
                // Fallback: assume square based on data length
                console.warn("Invalid sizes in puzzle string, defaulting to square based on data length");
                const size = Math.sqrt(puzzleData.length);
                if (size !== Math.floor(size)) {
                    throw new Error(`Invalid puzzle data length: ${puzzleData.length} (must be a perfect square)`);
                }
                return { sizeX: size, sizeY: size, puzzleData };
            }
            return { sizeX, sizeY, puzzleData };
        } else {
            throw new Error(`Invalid puzzle string format: ${puzzleString}`);
        }
    }

    decodeString(puzzleString: string) {
        const { sizeX, sizeY, puzzleData } = this.parsePuzzleFormat(puzzleString);
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        // Decode base36 string to numbers
        const decodedPuzzle = puzzleData.split("").map(char => {
            const index = base36Chars.indexOf(char);
            if (index === -1) {
                throw new Error(`Invalid base36 character: ${char}`);
            }
            return index;
        });

        // Ensure we have enough decoded data
        if (decodedPuzzle.length !== this.sizeX * this.sizeY) {
            throw new Error(`Decoded puzzle data length (${decodedPuzzle.length}) does not match grid size (${this.sizeX} x ${this.sizeY})`);
        }

        // Create columns and set board references
        this.cols = [];
        for (let y = 0; y < this.sizeY; y++) {
            this.cols[y] = new Column([]);
            this.cols[y]!.board = this;
        }

        this.rows = [];
        for (let x = 0; x < this.sizeX; x++) {
            this.rows[x] = new Row([]);
            this.rows[x]!.board = this;
        }

        for (let x = 0; x < this.sizeX; x++) {
            for (let y = 0; y < this.sizeY; y++) {
                var value: number = decodedPuzzle[x * this.sizeY + y] as number;

                var color: Color = value >> 4 & 1 ? "blue" : "red";
                var hidden: boolean = !(value & 1);
                var number: number = value >> 2;

                const row = this.rows[x]!;
                const col = this.cols[y]!;
                const cell = new Cell(color, number, x, y, hidden, row, col);

                row.push(cell);
                col.push(cell);
            }
        }

        // Update the flat list of all cells
        this.cells = this.rows.flatMap(row => row.getCells());

    }

    getRawValues() {
        return this.cells;
    }

    setRawValues(values: Cell[]) {
        this.cells = values;
    }

    getCellAt(x: number, y: number): Cell {
        const cell = this.cells[x * this.sizeY + y];
        if (cell == undefined) throw new Error("Invalid cell position!");
        return cell;
    }

    getSurroundingCells(cell: Cell): SurroundingCells {
        var cellX = cell.posX;
        var cellY = cell.posY;

        var positions = new SurroundingCells();

        if (cellY != 0) {
            // Not at top edge
            positions.up = this.getCellAt(cellX - 1, cellY);
            if (cellX != 0) {
                // Not at top left corner
                positions.upLeft = this.getCellAt(cellX - 1, cellY - 1);
            }
            if (cellX != this.rows[0]?.length) {
                // Not at top right cornder
                positions.upRight = this.getCellAt(cellX - 1, cellY + 1);
            }
        }

        if (cellX != 0) {
            // Not at left edge
            positions.left = this.getCellAt(cellX, cellY - 1);
        }

        if (cellX != this.getWidth() - 1) {
            // Not at right edge
            positions.right = this.getCellAt(cellX, cellY + 1);
        }

        if (cellY != this.getHeight() - 1) {
            // Not at bottom edge
            positions.down = this.getCellAt(cellX + 1, cellY);
            if (cellX != this.getWidth() - 1) {
                // Not at bottom right corner
                positions.downRight = this.getCellAt(cellX + 1, cellY);
            }
            if (cellX != 0) {
                // Not at bottom left corner
                positions.downLeft = this.getCellAt(cellX - 1, cellY - 1)
            }
        }

        return positions;
    }

    calculateAllNumbers() {
        this.cells.forEach((cell: Cell) => {
            cell.calculateNumber()
        })
    }

    toUrl(): string {
        var cellValues: number[] = [];
        this.cells.forEach((cell: Cell) => {
            const color: boolean = cell.getColor() == "red";
            var number: number | null = cell.getNumber();
            if (number == null) number = -1;
            const hidden: boolean = cell.isHidden();

            const value = number << 2 | (color ? 1 : 0) << 1 | (hidden ? 1 : 0);
            cellValues.push(value)
        })

        var puzzleString: string = cellValues.map((val: number) => base36Chars[val]).join("")

        return puzzleString;
    }

    checkIdentical(cell: Cell) {
        const rIndex = cell.posX;
        if (rIndex > 0) {
            if (this.rows[rIndex - 1]?.getCells() == cell.row?.getCells()) {
                return false;
            }
        }
        if (rIndex < this.rows.length - 1) {
            if (this.rows[rIndex + 1]?.getCells() == cell.row?.getCells()) {
                return false;
            }
        }
        return true;
    }
}