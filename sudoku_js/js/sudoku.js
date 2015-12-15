/*
*
* Exceptions 
*
*/

var InvalidPuzzleError = function () {
	this.reason = "Puzzle is Invalid!";
}



/*
*
* To create a cell object
*
*/
var Cell = function (xPos, yPos, value) {
	this.value = !!value && (typeof value == 'number') && (value > 0) && (value < 10) ? value : 0;
	this.row = "r"+yPos;
	this.column = 'c'+xPos;
	this.block = 'b' + ( (Math.floor(yPos/3) * 3) + Math.floor(xPos/3) );
	this.possibles = this.value == 0 ? [1,2,3,4,5,6,7,8,9] : [this.value];
	this.xPos = xPos;
	this.yPos = yPos;
	this.cellPos = yPos * 9 + xPos
	this.listeners = [];
}

Cell.prototype.getCellPos = function () {
	return this.cellPos;
}

Cell.prototype.getRow = function () {
	return this.row;
}

Cell.prototype.getXPos = function () {
	return this.xPos;
}

Cell.prototype.getYPos = function () {
	return this.yPos;
}

Cell.prototype.getColumn = function () {
	return this.column;
}

Cell.prototype.getBlock = function () {
	return this.block;
}

Cell.prototype.getValue = function () {
	return this.value;
}

Cell.prototype.getPossibilities = function () {
	return this.possibles;
}

Cell.prototype.setValue = function (value) {
	this.value = !!value && (typeof value == 'number') && (value > 0) && (value < 10) ? value : 0;
	this.triggerListeners("valueUpdate");
}

Cell.prototype.listen = function (name, fn, context, params) {
	this.listeners.push({name : name, fn : fn, context : context, params : params});
}

Cell.prototype.triggerListeners = function (name) {
	for (var i = 0; i < this.listeners.length; i++) {
		if (this.listeners[i].name == name)
			this.listeners[i].fn.apply(this.listeners[i].context, this.listeners[i].params);
	};
}

Cell.prototype.removePossibility = function (i) {
	var index = this.possibles.indexOf(i);
	if (index > -1) this.possibles.splice(index, 1);
	this.checkPossibilities();
}

Cell.prototype.checkPossibilities = function () {
	if (this.possibles.length == 1) 
		this.setValue(this.possibles[0]);
	else
		this.triggerListeners("possiblesUpdate");
}

Cell.prototype.filled = function () {
	return this.value != 0;
}

Cell.prototype.isPossible = function (i) {
	return this.possibles.indexOf(i) != -1;
}

/*
*
*Will contain the sudoku puzzle.
*
*/

var SudokuBoard = function (array) {
	this.cells = [];
	this.blocks = {};
	this.rows = {};
	this.columns = {};
	this.solvingBlocks = [];
	this.options = {};

	for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
			var value = !!array ? array[i*9 + j] : 0;
			var cell = new Cell(j, i, value);
			this.cells.push(cell);

			if (!this.rows[cell.getRow()] && typeof this.rows[cell.getRow()] != "Array") this.rows[cell.getRow()] = [];
			this.rows[cell.getRow()].push(cell);

			if (!this.columns[cell.getColumn()] && typeof this.columns[cell.getColumn()] != "Array") this.columns[cell.getColumn()] = [];
			this.columns[cell.getColumn()].push(cell);

			if (!this.blocks[cell.getBlock()] && typeof this.blocks[cell.getBlock()] != "Array") this.blocks[cell.getBlock()] = [];
			this.blocks[cell.getBlock()].push(cell);

			this.setListeners(cell);
		};
	};

}

SudokuBoard.prototype.setListeners = function (cell) {
	cell.listen("possiblesUpdate", this.checkBlock, this, [cell.getBlock()]);
	cell.listen("possiblesUpdate", this.checkRow, this, [cell.getRow()]);
	cell.listen("possiblesUpdate", this.checkColumn, this, [cell.getColumn()]);
	cell.listen("valueUpdate", this.checkBlock, this, [cell.getBlock()]);
	cell.listen("valueUpdate", this.checkRow, this, [cell.getRow()]);
	cell.listen("valueUpdate", this.checkColumn, this, [cell.getColumn()]);
	cell.listen("valueUpdate", this.checkValue, this, [cell]);

	cell.listen("valueUpdate", this.setChanged, this, [this.options]);
	cell.listen("possiblesUpdate", this.setChanged, this, [this.options]);

}

SudokuBoard.prototype.setChanged = function (settings) {
	settings.changed = true;
};

SudokuBoard.prototype.checkValue = function (cell) {
	var possibility = this.isPossible(cell.getRow(), cell.getColumn(), cell.getBlock(), cell.getValue());
	if (!possibility) 
		throw new InvalidPuzzleError();
}

SudokuBoard.prototype.isNotSolvingBlock = function(block) {
	return this.solvingBlocks.indexOf(block) == -1
};

SudokuBoard.prototype.checkBlock = function (block) {
	for (var number = 1; number <= 9; number++) {
		var numberPossibles = [];
		for (var i = 0; i < this.blocks[block].length; i++) {
			if (this.isNotSolvingBlock(this.blocks[block][i].getBlock()) || this.blocks[block][i].filled() || !this.blocks[block][i].isPossible(number)) continue;
			var possibility = this.isPossible(this.blocks[block][i].getRow(), this.blocks[block][i].getColumn(), this.blocks[block][i].getBlock(), number);
			if(!possibility) this.blocks[block][i].removePossibility(number);
			else numberPossibles.push(this.blocks[block][i]);
		};
		if (numberPossibles.length == 1) 
			numberPossibles[0].setValue(number);
	};
}

SudokuBoard.prototype.checkRow = function (row) {
	for (var number = 1; number <= 9; number++) {
		var numberPossibles = [];
		for (var i = 0; i < this.rows[row].length; i++) {
			if (this.isNotSolvingBlock(this.rows[row][i].getBlock()) || this.rows[row][i].filled() || !this.rows[row][i].isPossible(number)) continue;
			var possibility = this.isPossible(this.rows[row][i].getRow(), this.rows[row][i].getColumn(), this.rows[row][i].getBlock(), number);
			if(!possibility) this.rows[row][i].removePossibility(number);
			else numberPossibles.push(this.rows[row][i]);
		};
		if (numberPossibles.length == 1) 
			numberPossibles[0].setValue(number);
	};
}

SudokuBoard.prototype.checkColumn = function (column) {
	for (var number = 1; number <= 9; number++) {
		var numberPossibles = [];
		for (var i = 0; i < this.columns[column].length; i++) {
			if (this.isNotSolvingBlock(this.columns[column][i].getBlock()) || this.columns[column][i].filled() || !this.columns[column][i].isPossible(number)) continue;
			var possibility = this.isPossible(this.columns[column][i].getRow(), this.columns[column][i].getColumn(), this.columns[column][i].getBlock(), number);
			if(!possibility) this.columns[column][i].removePossibility(number);
			else numberPossibles.push(this.columns[column][i]);
		};
		if (numberPossibles.length == 1) 
			numberPossibles[0].setValue(number);
	};
}


SudokuBoard.prototype.toArray = function (newBoard) {
	var arr = [];
	for (var i = 0; i < this.cells.length; i++) {
		//arr.push(this.cells[i].getValue());
		arr[this.cells[i].getCellPos()] = this.cells[i].getValue();
	};
	return arr;
}

SudokuBoard.prototype.solveBlock = function (block, settings) {
	this.solvingBlocks.push(block);
	this.options = settings;
	this.checkBlock(block);
}

SudokuBoard.prototype.isPossible = function(row, column, block, value) {
	for (var i = 0; i < this.blocks[block].length; i++) {
		if(this.blocks[block][i].getValue() == value && this.blocks[block][i].getRow() != row && this.blocks[block][i].getColumn() != column)
			return false;
	};
	for (var i = 0; i < this.rows[row].length; i++) {
		if(this.rows[row][i].getValue() == value && this.rows[row][i].getColumn() != column)
			return false;
	};
	for (var i = 0; i < this.columns[column].length; i++) {
		if(this.columns[column][i].getValue() == value && this.columns[column][i].getRow() != row)
			return false;
	};
	return true;
};


/*
*
*Will contain the sudoku puzzle.
*
*/

var Sudoku = function (array) {
	this.sudoku = new SudokuBoard(array);
}

Sudoku.prototype.solve = function (argument) {
	var settings = {changed: true};
	while(settings.changed){
		settings.changed = false;
		for (var i = 0; i < 9; i++) {
			this.sudoku.solveBlock("b"+i, settings);
		};
	}
	console.log(this.sudoku.toArray());
}

