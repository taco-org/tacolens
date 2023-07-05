import * as React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import {
  excelToNums,
  numsToExcel,
  getTACOPatterns,
  getNodeColors,
  appendToMapValue,
  scaleWidth,
  numToCol,
} from "../../utils/graphUtils";

export interface GraphProps {
  graphMeta: GraphMeta;
  scale: number;
}

export interface GraphMeta {
  tacoPatterns: Object;
  colOffset: number;
  rowOffset: number;
  type: String;
  responseTime: number;
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

          let [rowStartOffset, colStartOffset] = Object.entries(edge.edgeMeta.startOffset);
          let [rowEndOffSet, colEndOffSet] = Object.entries(edge.edgeMeta.endOffset);
          // @ts-ignore
          [, rowStartOffset] = rowStartOffset;
          // @ts-ignore
          [, rowEndOffSet] = rowEndOffSet;
          // @ts-ignore
          [, colStartOffset] = colStartOffset;
          // @ts-ignore
          [, colEndOffSet] = colEndOffSet;

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
                annotation: this.getAnnotation(
                    graphMeta.type,
                  precCoords,
                  depCoords,
                  rowStartOffset,
                  rowEndOffSet,
                  colStartOffset,
                  colEndOffSet,
                  patternType
                ),
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
                annotation: this.getAnnotation(
                    graphMeta.type,
                  precCoords,
                  depCoords,
                  rowStartOffset,
                  rowEndOffSet,
                  colStartOffset,
                  colEndOffSet,
                  patternType
                ),
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

          if (graphMeta.type == "Precedents") {
            // Find_Precedent
            elements.push({
              data: {
                classes: patternType,
                source: dep,
                target: prec,
                label: `${prec}->${dep}`,
                edgeColor: colorMap.get(patternType),
                annotation: this.getAnnotation(
                    graphMeta.type,
                    precCoords,
                    depCoords,
                    rowStartOffset,
                    rowEndOffSet,
                    colStartOffset,
                    colEndOffSet,
                    patternType
                ),
                text_y_margin: -10,
              },
            });
          } else {
            // Find_Dependent
            elements.push({
              data: {
                classes: patternType,
                source: prec,
                target: dep,
                label: `${prec}->${dep}`,
                edgeColor: colorMap.get(patternType),
                annotation: this.getAnnotation(
                    graphMeta.type,
                    precCoords,
                    depCoords,
                    rowStartOffset,
                    rowEndOffSet,
                    colStartOffset,
                    colEndOffSet,
                    patternType
                ),
                text_y_margin: -10,
              },
            });
          }

        }
      }
    }
    let fontRatio = 24;
    // Prevent overlapping nodes and condenses graph
    if (this.state.condense) {
      const sortedRows = Array.from(rowsToRange.keys()).sort((a, b) => a - b);
      let freeSpace = 0;
      let maxAnnoLength = 1;
      for (let row of sortedRows) {
        for (let elemIndex of rowsToRange.get(row)) {
          elements[elemIndex].position.y = freeSpace;
          let annoLength = elements[elemIndex].data.annotation.length;
          if (annoLength >= maxAnnoLength) {
            maxAnnoLength = annoLength;
          }
        }
        if (this.state.edgeOverlap && horizontalEdges.has(row) && rowsToRange.get(row).length > 2) {
          let count = 0;
          for (let [prec, dep] of horizontalEdges.get(row)) {
            if (count > 0) {
              freeSpace += 1.0;
              elements[seenRanges.get(prec)].position.y = freeSpace;
              elements[seenRanges.get(dep)].position.y = freeSpace;
            }
            count += 1;
          }
        }
        freeSpace += maxAnnoLength / fontRatio;
        freeSpace += 1;
      }

      const sortedCols = Array.from(colsToRange.keys()).sort((a, b) => a - b);
      freeSpace = 0;
      maxAnnoLength = 1;
      for (let col of sortedCols) {
        for (let elemIndex of colsToRange.get(col)) {
          elements[elemIndex].position.x = freeSpace;
          let annoLength = elements[elemIndex].data.annotation.length;
          if (annoLength >= maxAnnoLength) {
            maxAnnoLength = annoLength;
          }
        }
        if (this.state.edgeOverlap && verticalEdges.has(col) && colsToRange.get(col).length > 2) {
          let count = 0;
          for (let [prec, dep] of verticalEdges.get(col)) {
            if (count > 0) {
              freeSpace += 1.0;
              elements[seenRanges.get(prec)].position.x = freeSpace;
              elements[seenRanges.get(dep)].position.x = freeSpace;
            }
            count += 1;
          }
        }
        freeSpace += maxAnnoLength / fontRatio;
        freeSpace += 1;
      }
    }
    return elements;
  }

  private getAnnotation(
      graphType: any,
      precCoords: any,
      depCoords: any,
      startOffSet: any,
      endOffSet: any,
      colStartOffSet: any,
      colEndOffSet: any,
      patternType: string
  ) {
    if (!patternType) {
      return "Single";
    }

    let precAnnot, depAnnot;
    // Find_Dep: prec -> source, dep -> target
    // Find_Prec: dep -> source, prec -> target
    let sourceRowStart, sourceRowEnd, sourceColStart, sourceColEnd;
    let targetRowStart, targetRowEnd, targetColStart, targetColEnd;

    if (precCoords.length == 1) {
      let coord = precCoords[0];
      let c = excelToNums(coord);
      sourceRowStart = c[0];
      sourceRowEnd = c[0];
      sourceColStart = c[1];
      sourceColEnd = c[1];
    } else {
      let coord = precCoords[0];
      let c = excelToNums(coord);
      sourceRowStart = c[0];
      sourceColStart = c[1];
      coord = precCoords[1];
      c = excelToNums(coord);
      sourceRowEnd = c[0];
      sourceColEnd = c[1];
    }

    targetRowStart = depCoords.rowStart;
    targetRowEnd = depCoords.rowEnd;
    targetColStart = depCoords.colStart;
    targetColEnd = depCoords.colEnd;

    let precRowStart, precRowEnd, precColStart, precColEnd;
    let depRowStart, depRowEnd, depColStart, depColEnd;

    if (graphType == "Precedents") {
      precRowStart = targetRowStart;
      precRowEnd = targetRowEnd;
      precColStart = targetColStart;
      precColEnd = targetColEnd;
      depRowStart = sourceRowStart;
      depRowEnd = sourceRowEnd;
      depColStart = sourceColStart;
      depColEnd = sourceColEnd;
    } else {
      depRowStart = targetRowStart;
      depRowEnd = targetRowEnd;
      depColStart = targetColStart;
      depColEnd = targetColEnd;
      precRowStart = sourceRowStart;
      precRowEnd = sourceRowEnd;
      precColStart = sourceColStart;
      precColEnd = sourceColEnd;
    }

    let str1 = precRowStart + " " + precRowEnd + " " + precColStart + " " + precColEnd;
    let str2 = depRowStart + " " + depRowEnd + " " + depColStart + " " + depColEnd;
    str1 = str1 + " " + str2;

    let precIsCell = precColStart == precColEnd && precRowStart == precRowEnd;
    let depIsCell = depColStart == depColEnd && depRowStart == depRowEnd;
    let depIsMultiCol = depColStart != depColEnd;
    if (precIsCell) {
      precAnnot = `${numToCol(precColStart)}${precRowStart}`;
      if (depIsCell) {
        depAnnot = `${numToCol(depColStart)}${depRowStart}`;
      } else {
        if (depIsMultiCol) {
          depAnnot = `j${depRowStart}`;
          depAnnot += ", j in [" + numToCol(depColStart) + ": " + numToCol(depColEnd) + "]";
        } else {
          depAnnot = `${numToCol(depColStart)}i`;
          depAnnot += ", i in [" + depRowStart + ": " + depRowEnd + "]";
        }
      }
    } else {
      if (depIsCell) {
        precAnnot = `${numsToExcel(precRowStart, precColStart)}:${numsToExcel(precRowEnd, precColEnd)}`;
        depAnnot = `${numToCol(depColStart)}${depRowStart}`;
      } else {
        if (depIsMultiCol) {
          depAnnot = `j${depRowStart}`;
          depAnnot += ", j in [" + numToCol(depColStart) + ": " + numToCol(depColEnd) + "]";
          if (patternType == "RR") {
            if (colStartOffSet > 0) {
              precAnnot = `(j-${colStartOffSet})${precRowStart}`;
            } else if (startOffSet < 0) {
              precAnnot = `(j+${colStartOffSet})${precRowStart}`;
            } else {
              precAnnot = `j${precRowStart}`;
            }
          } else if (patternType == "RF") {
            if (startOffSet > 0) {
              precAnnot = `(j-${colStartOffSet})${precRowStart}`;
            } else if (startOffSet < 0) {
              precAnnot = `(j+${colStartOffSet})${precRowStart}`;
            } else {
              precAnnot = `j${precRowStart}`;
            }
            precAnnot = `${precAnnot}:${numToCol(precColEnd)}${precRowEnd}`;
          } else if (patternType == "FR") {
            precAnnot = `${numToCol(precColStart)}${precRowStart}`;
            if (colEndOffSet > 0) {
              precAnnot = `${precAnnot}:(j-${colEndOffSet})${precRowStart}`;
            } else if (colEndOffSet < 0) {
              precAnnot = `${precAnnot}:(j+${colEndOffSet})${precRowStart}`;
            } else {
              precAnnot = `${precAnnot}:j${precRowStart}`;
            }
          } else {
            precAnnot = `${numToCol(precColStart)}${precRowStart}:${numToCol(precColEnd)}${precRowEnd}`;
          }
        } else {
          depAnnot = `${numToCol(depColStart)}i`;
          depAnnot += ", i in [" + depRowStart + ": " + depRowEnd + "]";
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
            } else if (endOffSet < 0) {
              precAnnot = `${precAnnot}:${numToCol(precColEnd)}i+${endOffSet}`;
            } else {
              precAnnot = `${precAnnot}:${numToCol(precColEnd)}i`;
            }
          } else {
            precAnnot = `${numToCol(precColStart)}${precRowStart}:${numToCol(precColEnd)}${precRowEnd}`;
          }
        }
      }
    }
    //return str1;
    return `${precAnnot} -> ${depAnnot}`;
  }

  public render() {
    if (this.props.graphMeta.tacoPatterns == null) {
      return <></>;
    }
    const responseTime = this.props.graphMeta.responseTime;
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
          "text-rotation": "autorotate",
          //'text-margin-x': 28,
          "text-margin-y": "data(text_y_margin)",
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
    return (
      <>
        <p className="ms-font-m-plus">Response Time (ms): {responseTime}</p>
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
