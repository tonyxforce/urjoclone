var base36Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
function fromBase36(str) {
    var result = [];
    for (var i = 0; i < str.length; i++) {
        result.push(base36Chars.indexOf(str.charAt(i)));
    }
    return result;
}

var gameHolder = document.getElementById("gameHolder");

var url = new URL(document.URL);
var gameString = url.hash.substring(1);
var size = Math.sqrt(gameString.length);

var completedCells = 0;
var mistakes = 0;

for (let x = 0; x < size; x++) {
    var cellRow = document.createElement("div");
    cellRow.classList.add("cell-row");
    for (let y = 0; y < size; y++) {
        var id = x * size + y;
        var cell = document.createElement("div");
        cell.classList.add("cell");
        cell.id = "cell-" + id;
        var char = fromBase36(gameString)[id];
        var cellNumber = Math.floor(char / 4) - 1
        var cellLabel = document.createElement("span");
        cellLabel.classList.add("cell-label");

        cellLabel.innerText = ""
        if (cellNumber >= 0) {
            cellLabel.innerText = cellNumber;
        }

        cellLabel.style.zIndex = "1";

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

        cellButtonRed.addEventListener("click", function () {
            buttonClick(this, 'red');
        });
        cellButtonBlue.addEventListener("click", function () {
            buttonClick(this, 'blue');
        });

        cell.appendChild(cellLabel);
        switch (char % 4) {
            case 0:
                cell.classList.add("cell-UB");
                cell.appendChild(cellButtonRed);
                cell.appendChild(cellButtonBlue);
                break;
            case 1:
                cell.classList.add("cell-blue");
                completedCells += 1;
                break;
            case 2:
                cell.classList.add("cell-UR");
                cell.appendChild(cellButtonRed);
                cell.appendChild(cellButtonBlue);
                break;
            case 3:
                cell.classList.add("cell-red");
                completedCells += 1;
                break;
            default:
                console.error(id, char);
                break;
        }
        cellRow.appendChild(cell);
    }
    gameHolder.appendChild(cellRow);
}

function buttonClick(cellBtn, color) {
    console.log(cellBtn, color);
    var clickedCell = document.getElementById("cell-" + cellBtn.id.split("-")[1]);
    if (color === 'red') {
        if (!clickedCell.classList.contains("cell-UR")) {
            document.getElementById("red-" + cellBtn.id.split("-")[1]).style.backgroundColor = "#00000000";
            document.getElementById("red-" + cellBtn.id.split("-")[1]).disabled = true;
            mistakes += 1;
            return;
        }
        completedCells += 1;
        clickedCell.classList.remove("cell-UR");
        clickedCell.classList.add("cell-red");
        clickedCell.removeChild(document.getElementById("red-" + cellBtn.id.split("-")[1]));
        clickedCell.removeChild(document.getElementById("blue-" + cellBtn.id.split("-")[1]));
    }
    if (color === 'blue') {
        if (!clickedCell.classList.contains("cell-UB")) {
            document.getElementById("blue-" + cellBtn.id.split("-")[1]).style.backgroundColor = "#00000000";
            document.getElementById("blue-" + cellBtn.id.split("-")[1]).disabled = true;
            mistakes += 1;
            return;
        }
        completedCells += 1;
        clickedCell.classList.remove("cell-UB");
        clickedCell.classList.add("cell-blue");
        clickedCell.removeChild(document.getElementById("red-" + cellBtn.id.split("-")[1]));
        clickedCell.removeChild(document.getElementById("blue-" + cellBtn.id.split("-")[1]));
    }
    if (completedCells === size * size) {
        setTimeout(function () {
            alert("Congratulations! You completed the puzzle with " + mistakes + " mistakes.");
        }, 100);
    }
}