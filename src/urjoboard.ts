import { Column, Row, Line } from "./lines.js";
import { Cell, Color } from "./cell.js"

type SurroundingCellsType = {
    upLeft?: Cell,
    up?: Cell,
    upRight?: Cell,
    left?: Cell,
    right?: Cell,
    downLeft?: Cell,
    down?: Cell,
    downRight?: Cell,
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
        Object.assign(this, data);
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

    cells: Cell[] = [];

    contradictionCount: number = 0;

    creativeMode: boolean = false;

    getRows() {
        return this.rows;
    }

    getWidth(): number {
        return this.cols.length;
    }

    getHeight(): number {
        return this.rows.length;
    }

    toString() {
        var lines: String[] = [];
        this.getRows().forEach((row) => {
            var line: string[] = []
            row.cells.forEach((cell: Cell) => {
                var cellValue = "";

                cellValue += cell.hidden ? "?" : " ";

                var cellColor = cell.getColor();
                if (cellColor == "red")
                    cellValue += "R";
                else if (cellColor == "blue")
                    cellValue += "B";
                else if (cellColor == null)
                    cellValue += ".";

                cellValue += cell.getNumber() != null ? cell.getNumber()!.toString() : " ";
                line.push(cellValue);
            })
            lines.push(line.join(" "));
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
            this.creativeMode = true;
            const size = parseInt(parts[0]!, 10);
            if (isNaN(size) || size <= 0) {
                throw new Error(`Invalid size: ${parts[0]}`);
            }
            return { sizeX: size, sizeY: size, puzzleData: new Array(size * size).fill("0").join("") };
        } else if (parts.length === 2) {
            this.creativeMode = true;
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

    decodeString(puzzleString: string): void {
        const { sizeX, sizeY, puzzleData } = this.parsePuzzleFormat(puzzleString);
        // Decode base36 string to numbers
        const decodedPuzzle = puzzleData.split("").map(char => {
            const index = base36Chars.indexOf(char);
            if (index === -1) {
                throw new Error(`Invalid base36 character: ${char}`);
            }
            return index;
        });

        // Ensure we have enough decoded data
        if (decodedPuzzle.length !== sizeX * sizeY) {
            throw new Error(`Decoded puzzle data length (${decodedPuzzle.length}) does not match grid size (${sizeX}*${sizeY})`);
        }

        // Create columns and set board references
        this.cols = [];
        for (let y = 0; y < sizeY; y++) {
            this.cols[y] = new Column([]);
            this.cols[y]!.board = this;
        }

        this.rows = [];
        for (let x = 0; x < sizeX; x++) {
            this.rows[x] = new Row([]);
            this.rows[x]!.board = this;
        }

        for (let x = 0; x < sizeX; x++) {
            for (let y = 0; y < sizeY; y++) {
                var value: number = decodedPuzzle[x * sizeY + y]!;

                var color: Color | null = value >> 4 & 1 ? "blue" : "red";
                if (this.creativeMode) color = null;

                var hidden: boolean = !(value & 1);
                var number: number | null = value >> 2;
                if (number == 0) number == null

                const row = this.rows[x]!;
                const col = this.cols[y]!;
                const cell = new Cell(color, number, hidden, row, col);

                row.cells.push(cell);
                col.cells.push(cell);
                this.cells.push(cell);
            }
        }
    }

    getRawValues(): Cell[] {
        return this.cells;
    }

    setRawValues(values: Cell[]): void {
        this.cells = values;
    }

    getCellAt(x: number, y: number): Cell {
        const id = x * this.getHeight() + y;
        if (id > this.cells.length - 1) throw new Error("Cell position is out of grid!");
        const cell = this.cells[id]!;
        return cell;
    }

    getSurroundingCells(cell: Cell): SurroundingCells {
        if (cell.row == null || cell.column == null) {
            throw new Error("Cell is not properly linked to row/column!");
        }

        var cellX = cell.row.cells.indexOf(cell);
        var cellY = cell.column.cells.indexOf(cell);

        if (cellX == -1 || cellY == -1) throw new Error("Cell is outside of it's row or column!");

        var positions = new SurroundingCells();

        if (cellY != 0) {
            // Not at top edge
            positions.up = this.getCellAt(cellX, cellY - 1);
            if (cellX != 0) {
                // Not at top left corner
                positions.upLeft = this.getCellAt(cellX - 1, cellY - 1);
            }
            if (cellX != this.getWidth() - 1) {
                // Not at top right corner
                positions.upRight = this.getCellAt(cellX + 1, cellY - 1);
            }
        }

        if (cellX != 0) {
            // Not at left edge
            positions.left = this.getCellAt(cellX - 1, cellY);
        }

        if (cellX != this.getWidth() - 1) {
            // Not at right edge
            positions.right = this.getCellAt(cellX + 1, cellY);
        }

        if (cellY != this.getHeight() - 1) {
            // Not at bottom edge
            positions.down = this.getCellAt(cellX, cellY + 1);
            if (cellX != this.getWidth() - 1) {
                // Not at bottom right corner
                positions.downRight = this.getCellAt(cellX + 1, cellY + 1);
            }
            if (cellX != 0) {
                // Not at bottom left corner
                positions.downLeft = this.getCellAt(cellX - 1, cellY + 1)
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
        this.rows.forEach((row: Row) => {
            row.cells.forEach((cell) => {

                const isRed: boolean = cell.getColor() == "red";
                var number: number | null = cell.getNumber();
                if (number == null) number = -1;
                number++; // Align cell number to charmap

                const revealed: boolean = !cell.isHidden();

                const value = number << 2 | (isRed ? 1 : 0) << 1 | (revealed ? 1 : 0);
                cellValues.push(value)
            })
        })
        var puzzleString: string = cellValues.map((val: number) => base36Chars[val]).join("")

        return puzzleString;
    }

    checkIdentical(cell: Cell) {
        if (cell.column == null || cell.row == null) {
            throw new Error("Cell is not properly linked to row/column");
        }
        const rIndex = cell.row.cells.indexOf(cell);
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

    fill(width: number | null, height: number | null, color: Color | null) {
        if (width == null) width = this.getWidth();
        if (height == null) height = this.getHeight();
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const cell = this.getCellAt(x, y);
                if (color != null) {
                    cell.color = color;
                }
                cell.hidden = false;
            }
        };
    };
}