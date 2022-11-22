export interface TacoResponse {
  [sheetName: string]: TacoSheet;
}

export interface TacoSheet {
  [edgeSummary: string]: TacoEdge[];
}

export interface TacoEdge {
  ref: Ref;
  edgeMeta: EdgeMeta;
}

export interface Ref {
  bookName: string;
  sheetName: string;
  _type: string;
  _row: number;
  _column: number;
  _lastRow: number;
  _lastColumn: number;
  _sheetIdx: number;
}

export interface EdgeMeta {
  patternType: string;
  startOffset: StartOffset;
  endOffset: EndOffset;
}

export interface StartOffset {
  rowOffset: number;
  colOffset: number;
}

export interface EndOffset {
  rowOffset: number;
  colOffset: number;
}
