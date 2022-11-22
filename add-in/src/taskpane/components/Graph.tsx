import * as React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import {excelToNums, numsToExcel, getTACOPatterns, getNodeColors, appendToMapValue, scaleWidth} from "../../utils/graphUtils";
import { connected } from "process";

export interface GraphProps {
    graphMeta: GraphMeta;
    scale: number;
}

export interface GraphMeta {
  tacoPatterns: Object;
  colOffset: number;
  rowOffset: number;
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
      edgeOverlap: false
    };
  }
  private setScale(scale: number) {
    this.setState(() => {
      return {scale:  + scale};
    });
  }
  
  private toggleCondense() {
    this.setState((prevState => ({
      condense: !prevState.condense
    })));
  }
  private toggleEdgeOverlap() {
    this.setState((prevState => ({
      edgeOverlap: !prevState.edgeOverlap
    })));
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
            //rowStart: edge.ref._row + graphMeta.rowOffset + 1,
            //rowEnd: edge.ref._lastRow + graphMeta.rowOffset + 1,
            //colStart: edge.ref._column + graphMeta.colOffset,
            //colEnd: edge.ref._column + graphMeta.colOffset
          };

          const patternType = patternMap.get(edge.edgeMeta.patternType);
          let dep;
          if (depCoords.colStart == depCoords.colEnd && depCoords.rowStart == depCoords.rowEnd) {
            dep = `${numsToExcel(depCoords.rowStart, depCoords.colStart)}`;
          } else {
            dep = `${numsToExcel(depCoords.rowStart, depCoords.colStart)}:${numsToExcel(depCoords.rowEnd, depCoords.colEnd)}`;
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
                h: nodeHeight
              },
              classes: patternType,
              position: {
                x: precCol,
                y: precRow
              }
            });
          }
          if (!seenRanges.has(dep)) {
            seenRanges.set(dep, elements.length);
            appendToMapValue(rowsToRange, depRow, elements.length);
            appendToMapValue(colsToRange, depCol, elements.length);
            elements.push(
              { data: 
                {
                  id: dep, 
                  label: dep, 
                  bgColor: colorMap.get(patternType),
                  w: scaleWidth(dep),
                  h: nodeHeight
                },
              classes: patternType,
              position: {
                x: depCol,
                y: depRow
              }
            });
          }
          if (precCol == depCol) {
            appendToMapValue(verticalEdges, precCol, [prec, dep]);
          }
          if (precRow == depRow) {
            appendToMapValue(horizontalEdges, precRow, [prec, dep]);

          }
          elements.push({ data:
            { classes: patternType, 
              source: dep, 
              target: prec, 
              label: `${dep}->${prec}`,
              edgeColor: colorMap.get(patternType)
            }
          });
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
            freeSpace += .33;
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
            freeSpace += .33;
            elements[seenRanges.get(prec)].position.x = freeSpace;
            elements[seenRanges.get(dep)].position.x = freeSpace;
          }
        }
        freeSpace += 1;
      }
    }
    return elements;
  }

  public render(){
    if (this.props.graphMeta.tacoPatterns == null) {
      return <></>
    }
    const elements = this.generateGraph();
    for (let i = 0; i < elements.length; i++) {
      let position = elements[i].position;
      if (position) {
        elements[i].position.x = position.x * this.state.scale;
        elements[i].position.y = position.y * this.state.scale * .5;
      }
    }
    const cytoscapeStylesheet = [
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            width: 3,
            shape: "round-rectangle",
            'line-color': 'data(edgeColor)',
            'target-arrow-color': 'data(edgeColor)',

          }
        },
        {
          selector: "node",
          style: {
            width: "data(w)",
            height: "data(h)",
            shape: "round-rectangle"
          }
        },
        {
          selector: "node[bgColor]",
          style: {
            "background-color": "data(bgColor)"
          }
        },
        {
          selector: "node[label]",
          style: {
            label: "data(label)",
            "font-size": "12",
            color: "white",
            "text-halign": "center",
            "text-valign": "center"
          }
        },
        {
          selector: ":selected",
          style: {
            label: "data(label)",
            "font-size": "12",
            "text-background-color": "white",
            "text-background-opacity": .75,
            "text-background-padding": "2px",
            width: 5,
            "text-halign": "center",
            "text-valign": "center"
          }
        }
      ] as Array<cytoscape.Stylesheet>;
      console.log("elements received: ", elements);
    return <>
      <button onClick={() => this.toggleCondense}>
        toggle condensed graph
      </button>
      <button onClick={() => this.toggleEdgeOverlap}>
        toggle edge overlap prevention
      </button>
      <CytoscapeComponent 
        elements={elements} 
        style={ { width: '95%', height: '600px' , left: '2.5%'} } 
        stylesheet = {cytoscapeStylesheet}
        pan={ { x: 0, y: 0}}
        zoom={1}
      />
    </>;
  }
}