// Tries to solve a puzzle provided by a puzzle string
// @Param {string} puzzleString - The puzzle string to solve
// @Returns {object} - the steps to solve the puzzle as an array of objects {cellId: number, color: 'red'|'blue'}
function solve(puzzle) {
}

// Get cells that can be filled because the other color has reached half the line
function getHalfFullSolves(puzzle) {
    // Get vertical and horizontal lines
    const lines = puzzle.getRows().concat(puzzle.getColumns());
    for (const line of lines) {
        const redCount = line.filter(cell => puzzle.getColor(cell) === 'red').length;
        const blueCount = line.filter(cell => puzzle.getColor(cell) === 'blue').length;
        const size = puzzle.getSize();
        if (redCount == size / 2 || blueCount == size / 2) {
            // Return the indices of the cells that can be filled
            const results = [];
            for (let i = 0; i < line.length; i++) {
                if (line[i] === 0 && redCount == size / 2) {
                    results.push({ cellId: i, color: 'blue' });
                } else if (line[i] === 0 && blueCount == size / 2) {
                    results.push({ cellId: i, color: 'red' });
                }
            }
            return results;
        }
    }
    return [];
}