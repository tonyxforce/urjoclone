import { UrjoBoard } from "./urjoboard.js";
import { Cell, Color, invertColor } from "./cell.js";
import { Row, Column, getColorCounts, linesDifferent, nonIdentical } from "./lines.js";

let counter = 0;
const weakMap = new WeakMap();
const getObjectId = (obj: any) => (weakMap.get(obj) ?? (weakMap.set(obj, ++counter) && counter));

function log(...args: any[]) {
    if (false) // Set to false to disable logging
        console.log(...args);
};

function all(arr: Array<boolean>): boolean {
    for (const val of arr) {
        if (!val) return false;
    }
    return true;
}

function none(arr: Array<boolean>): boolean {
    for (const val of arr) {
        if (val) return false;
    }
    return true;
}

export class UrjoGenerator {
    board: UrjoBoard = new UrjoBoard();
    removedByIdentical: number = 0;
    constructor(board?: UrjoBoard) {
        this.board = board ?? this.board
        this.removedByIdentical = 0;
    }

    numberCheck(cell: Cell) {
        const number = cell.getNumber()
        if (number == undefined || number == null) return true;

        if (cell.row == null) throw new Error("Cannot be used on a sole cell!");

        const { redCount, blueCount, uncoloredCount } = getColorCounts(this.board.getSurroundingCells(cell).toArray());

        // This is less than 8 when the cell is along an edge
        const surroundingCellCount = redCount + blueCount + uncoloredCount;
        if (number < 0 || number > surroundingCellCount) {
            return false // Impossible number
        };

        // Checks feasibility for a single color
        function feasible(
            requiredSame: number, sameCount: number,
            oppositeCount: number, uncolored: number): boolean {

            // Current cannot exceed target
            if (sameCount > requiredSame) {
                return false;
            }

            // Even if all uncolored cells became same, still cannot reach target

            if (sameCount + uncolored < requiredSame) {
                return false;
            }

            const requiredOpposite = surroundingCellCount - requiredSame;
            if (oppositeCount > requiredOpposite) {
                return false;
            }
            if (oppositeCount + uncolored < requiredOpposite
            ) {
                return false;
            }
            return true;
        }

        const color = cell.getColor();
        if (color != null) {
            if (color == "blue") {
                return feasible(number, blueCount, redCount, uncoloredCount);
            } else {
                return feasible(number, redCount, blueCount, uncoloredCount);
            }
        } else {
            const blueOk = feasible(number, blueCount, redCount, uncoloredCount);
            const redOk = feasible(number, redCount, blueCount, uncoloredCount);
            return blueOk || redOk;
        }
    }

    fillBoardBacktracking(randomizeColors: boolean = true): boolean {
        const cells: Cell[] = this.board.cells;

        const dis = this; // To access the generator in the inner function

        log("Starting fillBoardBacktracking...");
        log(`Total cells: ${cells.length}`);

        function backtrack(index: number = 0) {
            log(`Backtracking at index: ${index}`);
            if (index >= cells.length) {
                log("All cells processed. Verifying rows and columns...");
                for (const row of dis.board.rows) {
                    if (!row.checkColorCountValid()) {
                        log("Row check failed.");
                        log(dis.board.toString())
                        return false;
                    }
                }
                for (const col of dis.board.cols) {
                    if (!col.checkColorCountValid()) {
                        log("Column check failed.");
                        return false;
                    }
                }
                log("Board successfully filled.");
                return true;
            }

            const currentCell: Cell | null = cells[index] ?? null;
            if (currentCell == null) {
                log("Invalid cell index!");
                throw new Error("Invalid cell index!");
            }

            if (currentCell.color != null) {
                log(`Cell already colored: ${currentCell.color}`);
                return backtrack(index + 1);
            }

            var colors: Color[] = ["red", "blue"];
            if (randomizeColors) colors.sort(() => Math.random() - 0.5);

            for (const color of colors) {
                log(`Trying color ${color} for cell at (${currentCell.row?.cells.indexOf(currentCell)}, ${currentCell.column?.cells.indexOf(currentCell)})`);
                currentCell.color = color;

                if (currentCell.row && currentCell.column) {
                    log(`Row valid: ${currentCell.row.checkColorCountValid()}, Column valid: ${currentCell.column.checkColorCountValid()}`);
                }

                if (backtrack(index + 1)) {
                    return true;
                }

                log(`Backtracking: Resetting cell at index ${index}`);
                currentCell.color = null;
            }
            return false;
        }
        return backtrack(0);
    }

    trueCheck(): boolean {
        var checks: boolean[] = [];
        this.board.getRows().forEach(row => {
            row.getCells().forEach(cell => {
                cell.hidden = true;
            });
            checks.push(row.checkColorCountValid());
        });
        this.board.cols.forEach(col => {
            col.getCells().forEach(cell => {
                cell.hidden = true;
            });
            checks.push(col.checkColorCountValid());
        });
        return checks.every(c => c);
    }

    createPuzzle(options: {
        numberChecks?: boolean,
        rowChecks?: boolean,
        identicalChecks?: boolean,
        contradictionCount?: number,
        numberOfNumbers?: number,
        maxStepsWithoutInfo?: number
    } = { numberChecks: true, rowChecks: true, identicalChecks: true, contradictionCount: 1, numberOfNumbers: 0, maxStepsWithoutInfo: 4 }): UrjoBoard {
        // First, fill the board with a valid coloring
        if (!this.fillBoardBacktracking()) {
            throw new Error("Unable to color board with current constraints");
        }

        // Set all numbers on board to null
        // Allows numbers to be numbered
        this.board.cells.forEach(cell => {
            if (cell.getNumber() !== null) {
                cell.number = null;
            }
        });

        // Show only the specified number of numbers
        const shuffledCells = this.board.cells.toSorted(() => Math.random() - 0.5);
        let shownCount = 0;
        for (const cell of shuffledCells) {
            if (shownCount >= options.numberOfNumbers!) {
                break;
            }
            if (cell.getNumber() === null) {
                cell.number = cell.calculateNumber();
                shownCount++;
            }
        }
        // Then uncolor cells
        const shuffledCells2 = this.board.cells.toSorted(() => Math.random() - 0.5); // Shuffle cells
        shuffledCells2.forEach(cell => {
            this.uncolorCell(cell, options.numberChecks, options.rowChecks, options.identicalChecks, options.contradictionCount, options.maxStepsWithoutInfo);
        })

        return this.board;
    }

    initBoard(width: number, height: number) {
        this.board.decodeString(`$${width}$${height}`);
        this.board.fill(null, null, null);
        this.board.rows.forEach(row=>{
            row.calculateMaxColorCount();
        });
        this.board.cols.forEach(column=>{
            column.calculateMaxColorCount();
        })
    };

    uncolorCell(cell: Cell, numberChecks = true, rowChecks = true, identicalChecks = true, contradictionCount = 1, maxStepsWithoutInfo = 4) {
        // Checks if a cell can be uncolored while retaining the information
        // Due to the other color being impossible to be there
        if (this.canBeColor(cell, cell.color, numberChecks, rowChecks, identicalChecks, contradictionCount, contradictionCount, maxStepsWithoutInfo)) {
            return false;
        }
        cell.hidden = true;
        return true;
    }

    canBeColor(cell: Cell, color: Color | null,
        numberChecks = true, rowChecks = true,
        identicalChecks = true, contradictionCount = 1,
        originalContradicion = 1, maxStepsWithoutInfo = 4): boolean {

        var snapshot = this.board.getRawValues();

        cell.color = color;
        cell.hidden = false;

        var queue: Deque<Cell> = new Deque([cell]);
        var queuedIDs: Set<number> = new Set([getObjectId(cell)]);
        var processedIDs: Set<number> = new Set();
        var processedNumbers: Set<number> = new Set();

        while (queue.getLength() > 0) {
            var currentCell = queue.popleft()!;
            var currentID = getObjectId(currentCell);
            queuedIDs.delete(currentID);
            processedIDs.add(currentID);
            if (rowChecks) {
                var rowChanged = currentCell.row!.fillHalfFull();
                var colChanged = currentCell.column!.fillHalfFull();

                rowChanged.forEach(c => {
                    if (!queuedIDs.has(getObjectId(c)) && !processedIDs.has(getObjectId(c))) {
                        queue.append(c);
                        queuedIDs.add(getObjectId(c));
                    }
                });
                colChanged.forEach(c => {
                    if (!queuedIDs.has(getObjectId(c)) && !processedIDs.has(getObjectId(c))) {
                        queue.append(c);
                        queuedIDs.add(getObjectId(c));
                    }
                });
            }
            if (numberChecks) {
                const surrounding = this.board.getSurroundingCells(currentCell).toArray();
                surrounding.forEach((sCell: Cell | null) => {
                    if (sCell == null) return;
                    if (sCell.getNumber() == null) return;
                    const sID = getObjectId(sCell);
                    if (processedNumbers.has(sID)) return
                    processedNumbers.add(sID);

                    var changed = sCell.tryToFill();
                    if (changed.length > 0) {
                        changed.forEach(c => {
                            const cID = getObjectId(c);
                            if (!queuedIDs.has(cID) && !processedIDs.has(cID)) {
                                queue.append(c);
                                queuedIDs.add(cID);
                            }
                        });
                    };
                });
            }
        }

        // did anything get added? used for higher level puzzles to ignore recusion steps where nothing significant happened at a specific recursion step
        const didExpansion = processedIDs.size > 1;

        // run the checks to see if we can quickly conclude anything from the slot
        var checks: boolean[] = [];
        if (numberChecks) {
            checks.push(this.checkSurroundingNumbers(cell));
        }
        if (rowChecks) {
            checks.push(cell.row!.checkColorCountValid());
            checks.push(cell.column!.checkColorCountValid());
        }
        if (identicalChecks) {
            checks.push(this.board.checkIdentical(cell));
            if (contradictionCount == originalContradicion && !checks[checks.length - 1]) {
                if (all(checks.slice(0, checks.length - 1) as boolean[])) {
                    this.removedByIdentical += 1;
                }
            }
        }

        if (!all(checks)) {
            // restore and return false a check fails
            this.board.setRawValues(snapshot);
            return false;
        };

        //only continue deeper if something else got filled in if you are passed some step count in

        const shouldContinue = didExpansion || (contradictionCount + maxStepsWithoutInfo > originalContradicion);
        if (contradictionCount > 0 && shouldContinue) {
            const changeAvailable = this.board.cells.filter(sq => sq.getColor() == null);
            const k = Math.min(10000, changeAvailable.length);
            const samples = k > 0 ? changeAvailable.sort(() => Math.random() - 0.5).slice(0, k) : [];
            for (const sample of samples) {
                const blueOk = this.canBeColor(sample, "blue", numberChecks, rowChecks, identicalChecks, contradictionCount - 1, originalContradicion);
                const redOk = this.canBeColor(sample, "red", numberChecks, rowChecks, identicalChecks, contradictionCount - 1, originalContradicion);
                if (!blueOk && !redOk) {
                    if (contradictionCount == originalContradicion) {
                        this.board.contradictionCount++;
                    }
                    this.board.setRawValues(snapshot);
                    return false;
                }
            }
        }

        this.board.setRawValues(snapshot);

        return true;
    };

    checkSurroundingNumbers(cell: Cell): boolean {
        const surroundingCells = this.board.getSurroundingCells(cell).toArray().filter(c => c != null) as Cell[];
        for (const sCell of surroundingCells) {
            if (sCell.getNumber() == null) continue;
            if (!this.numberCheck(sCell)) {
                return false;
            }
        }
        return true;
    }
}

// Define a simple Deque class with python like function names
class Deque<T> extends Array<T> {
    private items: T[] = [];

    append(item: T): void {
        this.items.push(item);
    }
    popleft(): T | undefined {
        return this.items.shift();
    }
    isEmpty(): boolean {
        return this.items.length === 0;
    }
    toArray(): T[] {
        return this.items;
    }
    peekLeft(): T | undefined {
        return this.items[0];
    }
    peekRight(): T | undefined {
        return this.items[this.items.length - 1];
    }

    constructor(initialItems: T[] = []) {
        super(initialItems.length);
        initialItems.forEach((item, index) => {
            this.items[index] = item;
            this[index] = item;
        });
    };
    getLength(): number {
        return this.items.length;
    }
}