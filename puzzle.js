class Puzzle {
    #puzzleString;
    decodedPuzzle;
    #mistakes = 0;
    #completedCells = 0;
    #shownCellsIDs = [];
    #isCreativeMode = false;
    #sizeX = 0;
    #sizeY = 0;
    #mistakeCallback = function () { };
    #winCallback = function () { };

    // Class constructor
    // @Param {string} puzzleString - The puzzle string to decode
    constructor(puzzleString) {
        if (puzzleString.startsWith("$")) {
            // format $<sizeX>$<sizeY>$<puzzleString>, but also do validation
            const parts = puzzleString.split("$");
            if (parts.length < 2) {
                console.error("Invalid puzzle string format");
            } else {
                if(parts.length == 2){
                    // Creative mode square
                    this.#isCreativeMode = true;
                    this.sizeX = parseInt(parts[1]);
                    this.sizeY = this.sizeX;
                    puzzleString = new Array(this.sizeX * this.sizeY).fill("0").join("");
                }else
                if (parts.length == 3) {
                    // Creative mode
                    this.#isCreativeMode = true;
                    this.#sizeX = parseInt(parts[1]);
                    this.#sizeY = parseInt(parts[2]);
                    puzzleString = new Array(this.#sizeX * this.#sizeY).fill("0").join("");
                } else {

                    this.#sizeX = parseInt(parts[1]);
                    this.#sizeY = parseInt(parts[2]);

                    // additional validation to check sizeX and sizeY are valid numbers
                    if (isNaN(this.#sizeX) || isNaN(this.#sizeY) || this.#sizeX <= 0 || this.#sizeY <= 0) {
                        console.error("Invalid puzzle size in puzzle string, defaulting to square based on length");
                        this.#sizeX = Math.sqrt(parts[3].length);
                        this.#sizeY = this.#sizeX;
                    } else {
                        puzzleString = parts[3];
                    }
                }
            }
        }
        this.#puzzleString = puzzleString;
        if (this.#sizeX == 0 || this.#sizeY == 0) {
            this.#sizeX = Math.sqrt(puzzleString.length);
            this.#sizeY = this.#sizeX;
        }
        const base36Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const result = [];
        for (var i = 0; i < this.#puzzleString.length; i++) {
            result.push(base36Chars.indexOf(puzzleString.charAt(i)));
        }
        this.decodedPuzzle = result;
        this.decodedPuzzle.forEach((color, index) => {
            if (color == 1) {
                this.#shownCellsIDs.push([index, "blue"]);
            };
            if (color == 3) {
                this.#shownCellsIDs.push([index, "red"]);
            };
        });
    };

    // Set the callback function to be called when the puzzle is won
    // @Param {function} callback - The callback function
    setWinCallback(callback) {
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
        var columns = [];
        for (let x = 0; x < this.getSize(); x++) {
            columns.push([]);
            for (let y = 0; y < this.getSize(); y++) {
                var cellId = y * this.getSize() + x;
                var color = this.#shownCellsIDs.find(pair => pair[0] == cellId);
                columns[x].push(color ? color[1] : "white");
            }
        }
        return columns;
    }

    // Get shown cell colors as columns
    // @Returns {Array<"red" | "blue" | "white">} - An array of rows, each row is an array of cell colors
    getShownRows() {
        var rows = [];
        for (let y = 0; y < this.getSize(); y++) {
            rows.push([]);
            for (let x = 0; x < this.getSize(); x++) {
                var cellId = y * this.getSize() + x;
                var color = this.#shownCellsIDs.find(pair => pair[0] == cellId);
                rows[y].push(color ? color[1] : "white");
            }
        }
        return rows;
    }

    // Randomly rotates, mirrors, or inverts the puzzle to create a new variation
    // @Param {horizontalMirror: boolean, verticalMirror: boolean, invert: boolean} options - Options for shuffling
    shuffle(options = {}) {
        const doVerticalMirror = options.verticalMirror ?? Math.round(Math.random());
        const doHorizontalMirror = options.horizontalMirror ?? Math.round(Math.random());
        const doInvert = options.invert ?? Math.round(Math.random());
        if (doInvert)
            this.decodedPuzzle = this.decodedPuzzle.map(value => {
                if (value === 1) return 3;
                if (value === 3) return 1;
                return value;
            });
        if (doVerticalMirror) {
            const size = this.getWidth();
            const mirrored = [];
            for (let row = 0; row < size; row++) {
                for (let col = size - 1; col >= 0; col--) {
                    mirrored.push(this.decodedPuzzle[row * size + col]);
                }
            }
            this.decodedPuzzle = mirrored;
        }
        if (doHorizontalMirror) {
            const size = this.getWidth();
            const mirrored = [];
            for (let row = size - 1; row >= 0; row--) {
                for (let col = 0; col < size; col++) {
                    mirrored.push(this.decodedPuzzle[row * size + col]);
                }
            }
            this.decodedPuzzle = mirrored;
        }
    }

    // Set the callback function to be called when a mistake is made
    // @Param {function} callback - The callback function
    setMistakeCallback(callback) {
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
    getColumns() {
        const rows = this.getRows();
        const size = this.getSize();
        const columns = [];
        for (let col = 0; col < size; col++) {
            const column = [];
            for (let row = 0; row < size; row++) {
                column.push(rows[row][col]);
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
        const size = this.getSize();
        const rows = [];
        for (let i = 0; i < this.decodedPuzzle.length; i += size) {
            rows.push(this.decodedPuzzle.slice(i, i + size));
        }
        return rows;
    }

    // Get the color of a cell by its id
    // @Param {number} cellId - The id of the cell
    // @Returns {string} - 'red', 'blue', or 'white'
    getColor(cellId) {
        const cellValue = this.decodedPuzzle[cellId];
        if (cellValue === 1) return 'blue';
        if (cellValue === 3) return 'red';
        if (cellValue === 2 || cellValue === 0) return 'white';
        return null;
    }

    // Get the raw value of a cell by its id
    // @Param {number} cellId - The id of the cell
    // @Returns {number} - The raw value of the cell
    getCellValue(cellId) {
        return this.decodedPuzzle[cellId];
    }

    // Get the decoded puzzle values
    // @Returns {Array} - The decoded puzzle values as an array of numbers
    getRawValues() {
        return this.decodedPuzzle;
    }

    // Get the original puzzle string
    // @Returns {string} - The original puzzle string
    getRawString() {
        return this.#puzzleString;
    }

    // Render the puzzle into an HTML element
    // @Param {string} elementId - The id of the HTML element to render the puzzle into
    render(elementId) {
        var gameHolder = document.getElementById(elementId);
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
                var cellNumber = Math.floor(char / 4) - 1

                var cellLabel = document.createElement("span");
                cellLabel.classList.add("cell-label");
                cellLabel.innerText = ""
                if (cellNumber >= 0) {
                    cellLabel.innerText = cellNumber;
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
                    this.#buttonClick(e.target);
                });
                cellButtonBlue.addEventListener("click", (e) => {
                    this.#buttonClick(e.target);
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
    #buttonClick(cellBtn) {
        var cellId = cellBtn.id.split("-")[1];
        var clickedCell = document.getElementById("cell-" + cellId);
        var color = cellBtn.id.split("-")[0];
        if (color === 'red') {
            if ((!clickedCell.classList.contains("cell-UR")) && !this.#isCreativeMode) {
                document.getElementById("red-" + cellId).style.backgroundColor = "#00000000";
                document.getElementById("red-" + cellId).disabled = true;

                this.#mistakeCallback(this.#mistakes);
                this.#mistakes += 1;
                return;
            }
            clickedCell.classList.add("cell-red");
            clickedCell.classList.remove("cell-UR");
            clickedCell.removeChild(document.getElementById("red-" + cellId));
            clickedCell.removeChild(document.getElementById("blue-" + cellId));
            this.#shownCellsIDs.push([cellId, color]);
            this.#completedCells += 1;
        }
        if (color === 'blue') {
            if ((!clickedCell.classList.contains("cell-UB")) && !this.#isCreativeMode) {
                document.getElementById("blue-" + cellId).style.backgroundColor = "#00000000";
                document.getElementById("blue-" + cellId).disabled = true;

                this.#mistakeCallback(this.#mistakes);
                this.#mistakes += 1;
                return;
            }
            clickedCell.classList.add("cell-blue");
            clickedCell.classList.remove("cell-UB");
            clickedCell.removeChild(document.getElementById("red-" + cellId));
            clickedCell.removeChild(document.getElementById("blue-" + cellId));
            this.#completedCells += 1;
            this.#shownCellsIDs.push([cellId, color]);
        }
        if (this.#completedCells === this.#sizeX * this.#sizeY && !this.#isCreativeMode) {
            setTimeout(this.#winCallback, 100);
        }
    }
}
