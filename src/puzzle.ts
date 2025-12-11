export class Puzzle {
    #puzzleString;
    #decodedPuzzle;
    #currentState: number[];
    #mistakes = 0;
    #completedCells = 0;
    #shownCellsIDs: Array<[number, "red" | "blue" | "white"]> = [];
    #isCreativeMode = false;
    #sizeX = 0;
    #sizeY = 0;
    #mistakeCallback = function (mistakeCount: number) { };
    #winCallback = function () { };

    // Class constructor
    // @Param {string} puzzleString - The puzzle string to decode
    constructor(puzzleString: string) {
        if (puzzleString.startsWith("$")) {
            // format $<sizeX>$<sizeY>$<puzzleString>, but also do validation
            const parts = puzzleString.split("$") as Array<string>;
            if (parts.length < 2) {
                console.error("Invalid puzzle string format");
            } else {
                if (parts.length == 2) {
                    // Creative mode square
                    this.#isCreativeMode = true;
                    this.#sizeX = parseInt(parts[1] as any);
                    this.#sizeY = this.#sizeX;
                    puzzleString = new Array(this.#sizeX * this.#sizeY)
                        .fill("0")
                        .join("");
                } else if (parts.length == 3) {
                    // Creative mode
                    this.#isCreativeMode = true;
                    this.#sizeX = parseInt(parts[1] as any);
                    this.#sizeY = parseInt(parts[2] as any);
                    puzzleString = new Array(this.#sizeX * this.#sizeY)
                        .fill("0")
                        .join("");
                } else if (parts.length == 4) {
                    this.#sizeX = parseInt(parts[1] as any);
                    this.#sizeY = parseInt(parts[2] as any);

                    // additional validation to check sizeX and sizeY are valid numbers
                    if (
                        isNaN(this.#sizeX) ||
                        isNaN(this.#sizeY) ||
                        this.#sizeX <= 0 ||
                        this.#sizeY <= 0
                    ) {
                        console.error(
                            "Invalid puzzle size in puzzle string, defaulting to square based on length"
                        );
                        this.#sizeX = Math.sqrt((parts[3] as any).length);
                        this.#sizeY = this.#sizeX;
                    } else {
                        puzzleString = parts[3] as any;
                    }
                } else {
                    console.error("Invalid puzzle string format", puzzleString);
                }
            }
        }
        this.#puzzleString = puzzleString;
        if (this.#sizeX == 0 || this.#sizeY == 0) {
            this.#sizeX = Math.sqrt(puzzleString.length);
            this.#sizeY = this.#sizeX;
        }
        const base36Chars =
            "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
                ""
            );
        const result = [];
        for (var i = 0; i < this.#puzzleString.length; i++) {
            result.push(base36Chars.indexOf(puzzleString.charAt(i)));
        }
        this.#decodedPuzzle = result.slice();
        this.#currentState = result.slice();
        this.#decodedPuzzle.forEach((color, index) => {
            if (color == 1) {
                this.#shownCellsIDs.push([index, "blue"]);
            }
            if (color == 3) {
                this.#shownCellsIDs.push([index, "red"]);
            }
        });
    }

    // Set the callback function to be called when the puzzle is won
    // @Param {function} callback - The callback function
    setWinCallback(callback: () => void) {
        this.#winCallback = callback;
    }

    // Get an array of the cell IDs that the player has successfully selected as a color
    // @Returns {Array<Array<number, string>>} - An array of value pairs [cellID, color]
    getShownCells() {
        return this.#shownCellsIDs;
    }

    // Get shown cell colors as columns
    // @Returns {Array<"red" | "blue" | "white">} - An array of columns, each column is an array of cell colors
    getShownColumns() {
        var columns: Array<Array<number | "red" | "blue" | "white">> = [];
        for (let x = 0; x < this.getWidth(); x++) {
            columns.push([]);
            for (let y = 0; y < this.getHeight(); y++) {
                var cellId = y * this.getWidth() + x;
                var color = this.#shownCellsIDs.find(
                    (pair) => pair[0] == cellId
                ) as unknown as Array<number | "red" | "blue" | "white">;
                while (!columns[x]) columns.push([]);
                (columns as any)[x].push(color[1] ? color[1] : "white");
            }
        }
        return columns;
    }

    // Get shown cell colors as columns
    // @Returns {Array<"red" | "blue" | "white">} - An array of rows, each row is an array of cell colors
    getShownRows() {
        var rows: Array<Array<number | "red" | "blue" | "white">> = [];
        for (let y = 0; y < this.getHeight(); y++) {
            rows.push([]);
            for (let x = 0; x < this.getWidth(); x++) {
                var cellId = y * this.getWidth() + x;
                var color = this.#shownCellsIDs.find((pair) => pair[0] == cellId);
                (rows as any)[y].push(color ? color[1] : "white");
            }
        }
        return rows;
    }

    // Randomly rotates, mirrors, or inverts the puzzle to create a new variation
    // @Param {horizontalMirror: boolean, verticalMirror: boolean, invert: boolean} options - Options for shuffling
    shuffle(
        options: {
            horizontalMirror?: boolean;
            verticalMirror?: boolean;
            invert?: boolean;
        } = {}
    ) {
        const doVerticalMirror =
            options.verticalMirror ?? Math.round(Math.random());
        const doHorizontalMirror =
            options.horizontalMirror ?? Math.round(Math.random());
        const doInvert = options.invert ?? Math.round(Math.random());
        if (doInvert)
            this.#decodedPuzzle = this.#decodedPuzzle.map((value) => {
                return value ^ (1 << 1);
            });
        if (doVerticalMirror) {
            const size = this.getWidth();
            const mirrored: Array<number> = [];
            for (let row = 0; row < size; row++) {
                for (let col = size - 1; col >= 0; col--) {
                    mirrored.push(this.#decodedPuzzle[row * size + col] as any);
                }
            }
            this.#decodedPuzzle = mirrored;
        }
        if (doHorizontalMirror) {
            const size = this.getWidth();
            const mirrored: Array<number> = [];
            for (let row = size - 1; row >= 0; row--) {
                for (let col = 0; col < size; col++) {
                    mirrored.push(this.#decodedPuzzle[row * size + col] as any);
                }
            }
            this.#decodedPuzzle = mirrored;
        }
    }

    // Set the callback function to be called when a mistake is made
    // @Param {function} callback - The callback function
    setMistakeCallback(callback: (mistakeCount: number) => void) {
        this.#mistakeCallback = callback;
    }

    // Get number of mistakes made by the player
    // @Returns {number} - number of mistakes
    getMistakeCount() {
        return this.#mistakes;
    }

    // Get wether the puzzle is square
    // @Returns {boolean} - true if the puzzle is square, false otherwise
    isSquare() {
        return this.#sizeX === this.#sizeY;
    }

    // Get the width of the puzzle
    // @Returns {number} - The width of the puzzle
    getWidth() {
        return this.#sizeX;
    }

    // Get the height of the puzzle
    // @Returns {number} - The height of the puzzle
    getHeight() {
        return this.#sizeY;
    }

    // Get the columns of the puzzle as arrays
    // @Returns {Array} - An array of columns, each column is an array of cell values
    getColumns(): number[][] {
        const rows: number[][] = this.getRows();
        const columns: number[][] = [];
        for (let y = 0; y < this.getWidth(); y++) {
            const column: number[] = [];
            for (let x = 0; x < this.getHeight(); x++) {
                var row = rows[x];
                if(row === undefined) throw new Error("Row is undefined");
                
                var cell = row[y];
                if(cell === undefined) throw new Error("Cell is undefined");
                column.push(cell);
            }
            columns.push(column);
        }
        return columns;
    }

    // Get the rows of the puzzle as arrays
    // @Param {string} puzzleString - The puzzle string
    // @Returns {Array} - An array of rows, each row is an array of cell values
    getRows() {
        // split the array into N sized chunks
        const size = this.getWidth();
        const rows = [];
        for (let i = 0; i < this.#decodedPuzzle.length; i += size) {
            rows.push(this.#decodedPuzzle.slice(i, i + size));
        }
        return rows;
    }

    // Get the current state of the puzzle as a puzzle string
    // @Returns {string} - The current state of the puzzle as a puzzle string
    getCurrentState() {
        const base36Chars =
            "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
                ""
            );
        let result = "";
        for (let i = 0; i < this.#currentState.length; i++) {
            var currentChar = this.#currentState[i];
            if(currentChar === undefined) throw new Error("Current char is undefined");
            result += base36Chars[currentChar];
        }
        return result;
    }

    // Get the color of a cell by its id
    // @Param {number} cellId - The id of the cell
    // @Returns {string} - 'red', 'blue', or 'white'
    getColor(cellId: number): "red" | "blue" | "white" {
        const cellValue = this.#decodedPuzzle[cellId];
        if (cellValue === 1) return "blue";
        if (cellValue === 3) return "red";
        if (cellValue === 2 || cellValue === 0) return "white";
        throw new Error("Cell value is invalid");
    }

    // Get the raw value of a cell by its id
    // @Param {number} cellId - The id of the cell
    // @Returns {number} - The raw value of the cell
    getCellValue(cellId: number): number {
        var value = this.#decodedPuzzle[cellId];
        if(value === undefined) throw new Error("Cell value is undefined");
        return value;
    }

    // Get the decoded puzzle values
    // @Returns {Array} - The decoded puzzle values as an array of numbers
    getRawValues(): number[] {
        return this.#decodedPuzzle;
    }

    // Get the original puzzle string
    // @Returns {string} - The original puzzle string
    getRawString(): string {
        return this.#puzzleString;
    }

    // Render the puzzle into an HTML element
    // @Param {string} elementId - The id of the HTML element to render the puzzle into
    render(elementId: string) {
        var gameHolder = document.getElementById(elementId);

        if(!gameHolder) throw new Error("Element with id " + elementId + " not found");
        
        gameHolder.innerHTML = "";

        for (let x = 0; x < this.#sizeX; x++) {
            var cellRow = document.createElement("div");
            cellRow.classList.add("cell-row");

            for (let y = 0; y < this.#sizeY; y++) {
                var id = x * this.#sizeY + y;
                var cell = document.createElement("div");

                cell.classList.add("cell");
                cell.id = "cell-" + id;

                var char = this.getCellValue(id);
                var cellNumber = Math.floor(char / 4) - 1;

                var cellLabel = document.createElement("span");
                cellLabel.classList.add("cell-label");
                cellLabel.innerText = "";
                if (cellNumber >= 0) {
                    cellLabel.innerText = cellNumber.toString();
                }

                var cellButtonRed = document.createElement("button");
                cellButtonRed.classList.add("cell-btn-red");
                cellButtonRed.classList.add("cell-btn");
                cellButtonRed.style.zIndex = "0";
                cellButtonRed.id = "red-" + id;

                var cellButtonBlue = document.createElement("button");
                cellButtonBlue.classList.add("cell-btn-blue");
                cellButtonBlue.classList.add("cell-btn");
                cellButtonBlue.style.zIndex = "0";
                cellButtonBlue.id = "blue-" + id;

                cellButtonRed.addEventListener("click", (e) => {
                    this.#buttonClick(e.target as HTMLButtonElement);
                });
                cellButtonBlue.addEventListener("click", (e) => {
                    this.#buttonClick(e.target as HTMLButtonElement);
                });

                cell.appendChild(cellLabel);
                switch (char % 4) {
                    case 0:
                        cell.classList.add("cell-UB");
                        cell.appendChild(cellButtonBlue);
                        cell.appendChild(cellButtonRed);
                        break;
                    case 1:
                        cell.classList.add("cell-blue");
                        this.#completedCells += 1;
                        break;
                    case 2:
                        cell.classList.add("cell-UR");
                        cell.appendChild(cellButtonBlue);
                        cell.appendChild(cellButtonRed);
                        break;
                    case 3:
                        cell.classList.add("cell-red");
                        this.#completedCells += 1;
                        break;
                    default:
                        console.error(id, char);
                        break;
                }
                cellRow.appendChild(cell);
            }
            gameHolder.appendChild(cellRow);
        }
    }

    // Internal function that handles button clicks
    // @Param {HTMLElement} cellBtn - The button element that was clicked
    // @Param {string} color - The color associated with the button click ('red' or 'blue')
    #buttonClick(cellBtn: HTMLButtonElement) {
        var cellBtnId = cellBtn.id;
        if(!cellBtnId) throw new Error("Cell button ID is undefined");
        if(!cellBtnId.includes("-")) throw new Error("Cell button ID is invalid");
        
        var cellId: number = parseInt(cellBtn.id.split("-")[1] as string);

        var clickedCell = document.getElementById("cell-" + cellId);
        
        if(!clickedCell) throw new Error("Clicked cell not found");

        var blueBtn = document.getElementById("blue-" + cellId);
        if(!blueBtn) throw new Error("Blue button not found in cell");
        var redBtn = document.getElementById("red-" + cellId);
        if(!redBtn) throw new Error("Red button not found in cell");

        var color = cellBtn.id.split("-")[0];
        if (color === "red") {
            if (!clickedCell.classList.contains("cell-UR") && !this.#isCreativeMode) {
                cellBtn.style.backgroundColor =
                    "#00000000";
                cellBtn.disabled = true;

                this.#mistakeCallback(this.#mistakes);
                this.#mistakes += 1;
                return;
            }
            clickedCell.classList.add("cell-red");
            clickedCell.classList.remove("cell-UR");
            clickedCell.removeChild(redBtn);
            clickedCell.removeChild(blueBtn);
            this.#currentState[cellId] = 3; // Set the state of this cell to revealed red
            this.#shownCellsIDs.push([cellId, color]);
            this.#completedCells += 1;
        }
        if (color === "blue") {
            if (!clickedCell.classList.contains("cell-UB") && !this.#isCreativeMode) {
                cellBtn.style.backgroundColor =
                    "#00000000";
                cellBtn.disabled = true;

                this.#mistakeCallback(this.#mistakes);
                this.#mistakes += 1;
                return;
            }
            clickedCell.classList.add("cell-blue");
            clickedCell.classList.remove("cell-UB");

            clickedCell.removeChild(redBtn);
            clickedCell.removeChild(blueBtn);
            this.#completedCells += 1;
            this.#currentState[cellId] = 1; // Set the state of this cell to revealed blue
            this.#shownCellsIDs.push([cellId, color]);
        }
        if (
            this.#completedCells === this.#sizeX * this.#sizeY &&
            !this.#isCreativeMode
        ) {
            setTimeout(this.#winCallback, 100);
        }
    }
}
