import * as React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import {
  excelToNums,
  numsToExcel,
  getTACOPatterns,
  getNodeColors,
  appendToMapValue,
  scaleWidth, numToCol,
} from "../../utils/graphUtils";
import { connected } from "process";

export interface GraphProps {
  graphMeta: GraphMeta;
  scale: number;
}

export interface GraphMeta {
  tacoPatterns: Object;
  colOffset: number;
  rowOffset: number;
  type: String;
}

interface GraphState {
  graphMeta: GraphMeta;
  scale: number;
  condense: boolean;
  edgeOverlap: boolean;
}

export default class Graph extends React.Component<GraphProps, GraphState> {
  constructor(props) {
    super(props);
    this.state = {
      graphMeta: props.graphMeta,
      scale: props.scale,
      condense: true,
      edgeOverlap: true,
    };
  }
  private setScale(scale: number) {
    this.setState(() => {
      return { scale: +scale };
    });
  }

  private toggleCondense() {
    this.setState((prevState) => ({
      condense: !prevState.condense,
    }));
  }
  private toggleEdgeOverlap() {
    this.setState((prevState) => ({
      edgeOverlap: !prevState.edgeOverlap,
    }));
  }

  private generateGraph() {
    const patternMap = getTACOPatterns();
    const colorMap = getNodeColors();
    const elements = [];
    const seenRanges = new Map();
    const rowsToRange = new Map();
    const colsToRange = new Map();
    const verticalEdges = new Map();
    const horizontalEdges = new Map();
    const nodeHeight = "24px";
    const graphMeta = this.props.graphMeta;
    for (let [, sheet] of Object.entries(graphMeta.tacoPatterns)) {
      for (let [prec, edges] of Object.entries(sheet)) {
        prec = prec.replace("default:", "").replace("(", "").replace(")", "");

        let precCoords = prec.match(/[A-Z]+[0-9]+/g);
        let precRow = 0;
        let precCol = 0;
        for (let coord of precCoords) {
          let c = excelToNums(coord);
          precRow += c[0];
          precCol += c[1];
        }
        precRow = precRow / precCoords.length;
        precCol = precCol / precCoords.length;
        for (let edge of edges as Array<any>) {
          const depCoords = {
            rowStart: edge.ref._row + 1,
            rowEnd: edge.ref._lastRow + 1,
            colStart: edge.ref._column,
            colEnd: edge.ref._lastColumn,
          };

          const patternType = patternMap.get(edge.edgeMeta.patternType);
          let dep;
          if (depCoords.colStart == depCoords.colEnd && depCoords.rowStart == depCoords.rowEnd) {
            dep = `${numsToExcel(depCoords.rowStart, depCoords.colStart)}`;
          } else {
            dep = `${numsToExcel(depCoords.rowStart, depCoords.colStart)}:${numsToExcel(
              depCoords.rowEnd,
              depCoords.colEnd
            )}`;
          }
          let depRow = (depCoords.rowStart + depCoords.rowEnd) / 2;
          let depCol = (depCoords.colStart + depCoords.colEnd) / 2;

          if (!seenRanges.has(prec)) {
            seenRanges.set(prec, elements.length);
            appendToMapValue(rowsToRange, precRow, elements.length);
            appendToMapValue(colsToRange, precCol, elements.length);
            elements.push({
              data: {
                id: prec,
                label: prec,
                bgColor: colorMap.get(patternType),
                w: scaleWidth(prec),
                h: nodeHeight,
              },
              classes: patternType,
              position: {
                x: precCol,
                y: precRow,
              },
            });
          }
          if (!seenRanges.has(dep)) {
            seenRanges.set(dep, elements.length);
            appendToMapValue(rowsToRange, depRow, elements.length);
            appendToMapValue(colsToRange, depCol, elements.length);
            elements.push({
              data: {
                id: dep,
                label: dep,
                bgColor: colorMap.get(patternType),
                w: scaleWidth(dep),
                h: nodeHeight,
              },
              classes: patternType,
              position: {
                x: depCol,
                y: depRow,
              },
            });
          }
          if (precCol == depCol) {
            appendToMapValue(verticalEdges, precCol, [prec, dep]);
          }
          if (precRow == depRow) {
            appendToMapValue(horizontalEdges, precRow, [prec, dep]);
          }

          let [rowStartOffset, rowEndOffSet] = Object.entries(edge.edgeMeta.startOffset);
          let [colStartOffset, colEndOffSet] = Object.entries(edge.edgeMeta.endOffset);
          // @ts-ignore
          [, rowStartOffset] = rowStartOffset;
          // @ts-ignore
          [, rowEndOffSet] = rowEndOffSet;
          // @ts-ignore
          [, colStartOffset] = colStartOffset;
          // @ts-ignore
          [, colEndOffSet] = colEndOffSet;
          if (graphMeta.type == "Precedents") {
            elements.push({
              data: {
                classes: patternType,
                source: dep,
                target: prec,
                label: `${dep}<-${prec}`,
                edgeColor: colorMap.get(patternType),
                annotation: this.getAnnotation(
                    precCoords, depCoords,
                    rowStartOffset, rowEndOffSet,
                    colStartOffset, colEndOffSet,
                    patternType),
              },
            });
          } else {
            elements.push({
              data: {
                classes: patternType,
                source: dep,
                target: prec,
                label: `${dep}->${prec}`,
                edgeColor: colorMap.get(patternType),
                annotation: this.getAnnotation(
                    precCoords, depCoords,
                    rowStartOffset, rowEndOffSet,
                    colStartOffset, colEndOffSet,
                    patternType),
              },
            });
          }
        }
      }
    }

    // Prevent overlapping nodes and condenses graph
    if (this.state.condense) {
      const sortedRows = Array.from(rowsToRange.keys()).sort((a, b) => a - b);
      let freeSpace = 0;
      for (let row of sortedRows) {
        for (let elemIndex of rowsToRange.get(row)) {
          elements[elemIndex].position.y = freeSpace;
        }
        if (this.state.edgeOverlap && horizontalEdges.has(row) && rowsToRange.get(row).length > 2) {
          for (let [prec, dep] of horizontalEdges.get(row)) {
            freeSpace += 0.33;
            elements[seenRanges.get(prec)].position.y = freeSpace;
            elements[seenRanges.get(dep)].position.y = freeSpace;
          }
        }
        freeSpace += 1;
      }

      const sortedCols = Array.from(colsToRange.keys()).sort((a, b) => a - b);
      freeSpace = 0;
      for (let col of sortedCols) {
        for (let elemIndex of colsToRange.get(col)) {
          elements[elemIndex].position.x = freeSpace;
        }
        if (this.state.edgeOverlap && verticalEdges.has(col) && colsToRange.get(col).length > 2) {
          for (let [prec, dep] of verticalEdges.get(col)) {
            freeSpace += 0.33;
            elements[seenRanges.get(prec)].position.x = freeSpace;
            elements[seenRanges.get(dep)].position.x = freeSpace;
          }
        }
        freeSpace += 2;
      }
    }
    return elements;
  }

  private getAnnotation(
    precCoords: any,
    depCoords: any,
    startOffSet: any,
    endOffSet: any,
    colStartOffSet: any,
    colEndOffSet: any,
    patternType: string
  ) {
    if (!patternType) {
      return "NoComp";
    }

    let precAnnot, depAnnot;
    let precRowStart, precRowEnd, precColStart, precColEnd;
    if (precCoords.length == 1) {
      let coord = precCoords[0];
      let c = excelToNums(coord);
      precRowStart = c[0];
      precRowEnd = c[0];
      precColStart = c[1];
      precColEnd = c[1];
    } else {
      let coord = precCoords[0];
      let c = excelToNums(coord);
      precRowStart = c[0];
      precColStart = c[1];
      coord = precCoords[1];
      c = excelToNums(coord);
      precRowEnd = c[0];
      precColEnd = c[1];
    }

    let precIsCell = precColStart == precColEnd && precRowStart == precRowEnd;
    let depIsCell = depCoords.colStart == depCoords.colEnd && depCoords.rowStart == depCoords.rowEnd;
    if (precIsCell) {
      precAnnot = `${numToCol(precColStart)}${precRowStart}`;
      if (depIsCell) {
        depAnnot = `${numToCol(depCoords.colStart)}${depCoords.rowStart}`;
      } else {
        // TODO: what if deps have multiple columns
        depAnnot = `${numToCol(depCoords.colStart)}i`;
        depAnnot += ", i in [" + depCoords.rowStart + ": " + depCoords.rowEnd + "]";
      }
    } else {
      if (depIsCell) {
        precAnnot = `${numsToExcel(precRowStart, precColStart)}:${numsToExcel(precRowEnd, precColEnd)}`;
        depAnnot = `${numToCol(depCoords.colStart)}${depCoords.rowStart}`;
      } else {
        depAnnot = `${numToCol(depCoords.colStart)}i`;
        depAnnot += ", i in [" + depCoords.rowStart + ": " + depCoords.rowEnd + "]";
        if (patternType == "RR") {
          if (startOffSet > 0) {
            precAnnot = `${numToCol(precColStart)}i-${startOffSet}`;
          } else if (startOffSet < 0) {
            precAnnot = `${numToCol(precColStart)}i+${startOffSet}`;
          } else {
            precAnnot = `${numToCol(precColStart)}i`;
          }
        } else if (patternType == "RF") {
          if (startOffSet > 0) {
            precAnnot = `${numToCol(precColStart)}i-${startOffSet}`;
          } else if (startOffSet < 0) {
            precAnnot = `${numToCol(precColStart)}i+${startOffSet}`;
          } else {
            precAnnot = `${numToCol(precColStart)}i`;
          }
          precAnnot = `${precAnnot}:${numToCol(precColEnd)}${precRowEnd}`;
        } else if (patternType == "FR") {
          precAnnot = `${numToCol(precColStart)}${precRowStart}`;
          if (endOffSet > 0) {
            precAnnot = `${precAnnot}:${numToCol(precColEnd)}i-${endOffSet}`;
          } else if (startOffSet < 0) {
            precAnnot = `${precAnnot}:${numToCol(precColEnd)}i+${endOffSet}`;
          } else {
            precAnnot = `${precAnnot}:${numToCol(precColEnd)}i`;
          }
        } else {
          precAnnot = `${numToCol(precColStart)}${precRowStart}:${numToCol(precColEnd)}${precRowEnd}`;
        }
      }
    }
    let str = startOffSet + " " + endOffSet + " " + colStartOffSet + " " + colEndOffSet;
    // return patternType;
    return `${precAnnot} <- ${depAnnot}`;
  }

  public render() {
    if (this.props.graphMeta.tacoPatterns == null) {
      return <></>;
    }
    const elements = this.generateGraph();
    for (let i = 0; i < elements.length; i++) {
      let position = elements[i].position;
      if (position) {
        elements[i].position.x = position.x * this.state.scale;
        elements[i].position.y = position.y * this.state.scale * 0.5;
      }
    }
    const cytoscapeStylesheet = [
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          width: 2,
          shape: "round-rectangle",
          "line-color": "data(edgeColor)",
          "target-arrow-color": "data(edgeColor)",
          label: "data(annotation)",
          "font-size": "11",
          'text-rotation': "autorotate",
          //'text-margin-x': 28,
          'text-margin-y': -8
        },
      },
      {
        selector: "node",
        style: {
          width: "data(w)",
          height: "data(h)",
          shape: "round-rectangle",
        },
      },
      {
        selector: "node[bgColor]",
        style: {
          "background-color": "data(bgColor)",
        },
      },
      {
        selector: "node[label]",
        style: {
          label: "data(label)",
          "font-size": "12",
          color: "white",
          "text-halign": "center",
          "text-valign": "center",
        },
      },
      {
        selector: ":selected",
        style: {
          label: "data(label)",
          "font-size": "12",
          "text-background-color": "white",
          "text-background-opacity": 0.75,
          "text-background-padding": "2px",
          width: 5,
          "text-halign": "center",
          "text-valign": "center",
        },
      },
    ] as Array<cytoscape.Stylesheet>;
    console.log("elements received: ", elements);
    return (
      <>
        <button onClick={() => this.toggleCondense}>toggle condensed graph</button>
        <button onClick={() => this.toggleEdgeOverlap}>toggle edge overlap prevention</button>
        <CytoscapeComponent
          elements={elements}
          style={{ width: "95%", height: "600px", left: "2.5%" }}
          stylesheet={cytoscapeStylesheet}
          pan={{ x: 0, y: 0 }}
          zoom={1}
        />
      </>
    );
  }
}
