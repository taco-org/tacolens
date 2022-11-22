const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function numToCol(col:number) {
    let letters = "";
    while (col >= 0) {
        letters = alphabet[col % 26] + letters;
        col = Math.floor(col / 26) - 1;
    }
    return letters;
  }
  
export function numsToExcel (row: number, col: number) {
    return `${numToCol(col)}${row}`;
}

export function excelToNums (coord: String) {
    let colString = coord.match("[A-Z]+")[0];
    let row = parseInt(coord.match("[0-9]+")[0]);
    let col = 0;
    for(let i = 0; i < colString.length; i++) {
        col = colString.charCodeAt(i) - 64 + col * 26;
    }
    return [row, col - 1];
}

export function getTACOPatterns() {
    const TACOPAtterns = new Map();
    TACOPAtterns.set("TYPEZERO","RR");
    TACOPAtterns.set("TYPEONE","RR");
    TACOPAtterns.set("TYPETWO","RF");
    TACOPAtterns.set("TYPETHREE","FR");
    TACOPAtterns.set("TYPEFOUR","FF");
    TACOPAtterns.set("TYPEFIVE","RR Gap 1");
    TACOPAtterns.set("TYPESIX","RR Gap 2");
    TACOPAtterns.set("TYPESEVEN","RR Gap 3");
    TACOPAtterns.set("TYPEEIGHT","RR Gap 4");
    TACOPAtterns.set("TYPENINE","RR Gap 5");
    TACOPAtterns.set("TYPETEN","RR Gap 6");
    TACOPAtterns.set("TYPEELEVEN","RR Gap 7");
    TACOPAtterns.set("NOTYPE","");
    return TACOPAtterns;
}

export function getNodeColors() {
    const nodeColors = new Map();
    nodeColors.set("RR", "#2274A5");
    nodeColors.set("RF", "#F1C40F");
    nodeColors.set("FR", "#D90368");
    nodeColors.set("FF", "#F75C03");
    return nodeColors;
}

export function appendToMapValue(map: Map<object, Array<object>>, key, value) {
    if (map.has(key)) {
        map.get(key).push(value);
    } else {
        map.set(key, [value]);
    }
}

function numToPX(num: number) {
    return num.toString() + "px"
}

export function scaleWidth(word: string) {
    return numToPX(word.length * 8 + 8);
}