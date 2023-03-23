import { buildClassMap, DefaultButton, Stack } from "@fluentui/react";
import * as React from "react";
import { FormulasApi } from "../../api/formulas";
import { TacoApi } from "../../api/taco";
import { ColorMap } from "../../utils/colormap";
import Header from "./Header";
import Progress from "./Progress";
import Graph, { GraphMeta } from "./Graph";

const colormap = new ColorMap();

async function getSelectedRange(context: Excel.RequestContext) {
  let range = context.workbook.getSelectedRange().getUsedRange();
  range.load({ rowIndex: true, columnIndex: true, rowCount: true, columnCount: true, address: true });
  await context.sync();
  const address = range.address;
  const rowOffset = range.rowIndex;
  const colOffset = range.columnIndex;
  return { address, rowOffset, colOffset };
}

async function getFormulas(context: Excel.RequestContext) {
  let range = context.workbook.getSelectedRange().getUsedRange();
  range.load({ formulas: true, cellCount: true, rowIndex: true, columnIndex: true });
  await context.sync();
  const analyzeFullSheet = range.cellCount < 2;
  if (analyzeFullSheet) {
    range = context.workbook.worksheets.getActiveWorksheet().getUsedRange();
    range.load({ formulas: true, rowIndex: true, columnIndex: true });
    await context.sync();
  }
  const rowOffset = range.rowIndex;
  const colOffset = range.columnIndex;
  const formulas = range.formulas;
  return { formulas, rowOffset, colOffset };
}

async function getAllFormulas(context: Excel.RequestContext) {
  let range = context.workbook.worksheets.getActiveWorksheet().getUsedRange();
  range.load({ formulas: true, rowIndex: true, columnIndex: true });
  await context.sync();
  const rowOffset = range.rowIndex;
  const colOffset = range.columnIndex;
  const formulas = range.formulas;
  return { formulas, rowOffset, colOffset };
}

async function getAllTacoPatterns() {
  try {
    await Excel.run(async (context) => {
      const { formulas, rowOffset, colOffset } = await getAllFormulas(context);
      const sheetPatterns = await TacoApi.buildDepGraph(formulas, "build");

      for (let [, sheet] of Object.entries(sheetPatterns)) {
        for (let [, edges] of Object.entries(sheet)) {
          for (let edge of edges) {
            const {
              ref: { _row, _column, _lastColumn, _lastRow },
            } = edge;
            const patternType = edge.edgeMeta.patternType;
            const targetRange = context.workbook.worksheets
              .getActiveWorksheet()
              .getRangeByIndexes(rowOffset + _row, colOffset + _column, _lastRow - _row + 1, _lastColumn - _column + 1);
            targetRange.format.fill.color = colormap.add(patternType);
          }
        }
      }
    });
  } catch (error) {
    console.error(error);
    if (error instanceof OfficeExtension.Error) {
      console.log("Debug info: " + JSON.stringify(error.debugInfo));
    }
  }
}

async function getAllGraph(setGraphMeta: React.Dispatch<React.SetStateAction<GraphMeta>>) {
  try {
    await Excel.run(async (context) => {
      const startTime = new Date();
      const { formulas, rowOffset, colOffset } = await getAllFormulas(context);
      const tacoPatterns = await TacoApi.buildDepGraph(formulas, "build");
      const endTime = new Date();
      var responseTime = endTime.getTime() - startTime.getTime();
      setGraphMeta({
        tacoPatterns: tacoPatterns,
        rowOffset: rowOffset,
        colOffset: colOffset,
        type: "Dependents",
        responseTime: responseTime,
      });
    });
  } catch (error) {
    console.error(error);
    if (error instanceof OfficeExtension.Error) {
      console.log("Debug info: " + JSON.stringify(error.debugInfo));
    }
  }
}

async function getDependents(setGraphMeta: React.Dispatch<React.SetStateAction<GraphMeta>>) {
  try {
    await Excel.run(async (context) => {
      const startTime = new Date();
      const { address, rowOffset, colOffset } = await getSelectedRange(context);
      const subGraph = await TacoApi.getSubGraph(address, "dependents");
      const endTime = new Date();
      var responseTime = endTime.getTime() - startTime.getTime();
      setGraphMeta({
        tacoPatterns: subGraph,
        rowOffset: rowOffset,
        colOffset: colOffset,
        type: "Dependents",
        responseTime: responseTime,
      });
    });
  } catch (error) {
    console.error(error);
    if (error instanceof OfficeExtension.Error) {
      console.log("Debug info: " + JSON.stringify(error.debugInfo));
    }
  }
}

async function getPrecedents(setGraphMeta: React.Dispatch<React.SetStateAction<GraphMeta>>) {
  try {
    await Excel.run(async (context) => {
      const startTime = new Date();
      const { address, rowOffset, colOffset } = await getSelectedRange(context);
      const subGraph = await TacoApi.getSubGraph(address, "precedents");
      const endTime = new Date();
      var responseTime = endTime.getTime() - startTime.getTime();
      setGraphMeta({
        tacoPatterns: subGraph,
        rowOffset: rowOffset,
        colOffset: colOffset,
        type: "Precedents",
        responseTime: responseTime,
      });
    });
  } catch (error) {
    console.error(error);
    if (error instanceof OfficeExtension.Error) {
      console.log("Debug info: " + JSON.stringify(error.debugInfo));
    }
  }
}

export default function App({ title, isOfficeInitialized }: { title: string; isOfficeInitialized: boolean }) {
  const [graphMeta, setGraphMeta] = React.useState({
    responseTime: 0,
    tacoPatterns: null,
    rowOffset: 0,
    colOffset: 0,
    type: "Dependents",
  });
  console.log(graphMeta);
  if (!isOfficeInitialized) {
    return (
      <Progress
        title={title}
        logo={require("./../../../assets/taco-logo.png")}
        message="Please sideload your addin to see app body."
      />
    );
  }

  return (
    <div className="ms-welcome">
      {/* eslint-disable-next-line no-undef */}
      <p className="ms-font-m-plus">
        Select the type of formula graphs: &nbsp;
        <button onClick={() => getAllGraph(setGraphMeta)}>
          TACO
        </button>
        <button onClick={() => getAllGraph(setGraphMeta)}>
          NoComp
        </button>
      </p>

      <Stack tokens={{ childrenGap: 5 }}>
        <DefaultButton
          className="ms-welcome__action"
          iconProps={{ iconName: "ChevronRight" }}
          onClick={() => getAllGraph(setGraphMeta)}
        >
          Generate the Entire Graph
        </DefaultButton>
          <DefaultButton
              className="ms-welcome__action"
              iconProps={{ iconName: "ChevronRight" }}
              onClick={() => getDependents(setGraphMeta)}
          >
            Find Direct Dependents
          </DefaultButton>
            <DefaultButton
                className="ms-welcome__action"
                iconProps={{ iconName: "ChevronRight" }}
                onClick={() => getDependents(setGraphMeta)}
            >
              Find Dependents
            </DefaultButton>
        <DefaultButton
          className="ms-welcome__action"
          iconProps={{ iconName: "ChevronRight" }}
          onClick={() => getPrecedents(setGraphMeta)}
        >
          Find Direct Precedents
        </DefaultButton>
        <DefaultButton
          className="ms-welcome__action"
          iconProps={{ iconName: "ChevronRight" }}
          onClick={() => getPrecedents(setGraphMeta)}
        >
          Find Precedents
        </DefaultButton>
        <Graph graphMeta={graphMeta} scale={100} />
      </Stack>
    </div>
  );
}
