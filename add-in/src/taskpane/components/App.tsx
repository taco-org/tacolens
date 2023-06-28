import {buildClassMap, DefaultButton, PrimaryButton} from "@fluentui/react";
import { Stack, IStackTokens } from '@fluentui/react';
import { Toggle } from '@fluentui/react/lib/Toggle';
import * as React from "react";
import { TacoApi } from "../../api/taco";
import Progress from "./Progress";
import Graph, { GraphMeta } from "./Graph";


async function getSelectedRange(context: Excel.RequestContext) {
  // Only contain used range
  let range = context.workbook.getSelectedRange().getUsedRange();
  range.load({ rowIndex: true, columnIndex: true, rowCount: true, columnCount: true, address: true });
  await context.sync();
  const address = range.address;
  const rowOffset = range.rowIndex;
  const colOffset = range.columnIndex;
  return { address, rowOffset, colOffset,  };
}

async function setDependencyGraphType(type: String) {
  try {
    await TacoApi.setGraphType(type);
  } catch (error) {
    console.error(error);
  }
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

async function getAllGraph(setGraphMeta: React.Dispatch<React.SetStateAction<GraphMeta>>, isBuild: boolean) {
  try {
    await Excel.run(async (context) => {
      const startTime = new Date();
      const { formulas, rowOffset, colOffset } = await getAllFormulas(context);
      let tacoPatterns;
      if (isBuild) {
        tacoPatterns = await TacoApi.buildDepGraph(formulas, "build");
      } else {
        tacoPatterns = await TacoApi.buildDepGraph(formulas, "get");
      }
      const endTime = new Date();
      const responseTime = endTime.getTime() - startTime.getTime();
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

async function getDependents(setGraphMeta: React.Dispatch<React.SetStateAction<GraphMeta>>, isDirect: String) {
  try {
    await Excel.run(async (context) => {
      const startTime = new Date();
      const { address, rowOffset, colOffset } = await getSelectedRange(context);
      const subGraph = await TacoApi.getSubGraph(address, "dependents", isDirect);
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

async function getPrecedents(setGraphMeta: React.Dispatch<React.SetStateAction<GraphMeta>>, isDirect: String) {
  try {
    await Excel.run(async (context) => {
      const startTime = new Date();
      const { address, rowOffset, colOffset } = await getSelectedRange(context);
      const subGraph = await TacoApi.getSubGraph(address, "precedents", isDirect);
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

const stackTokens: IStackTokens = { childrenGap: 5 };

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

  function _onChange(_ev: React.MouseEvent<HTMLElement>, checked?: boolean) {
    if (checked) {
      setDependencyGraphType("TACO");
      getAllGraph(setGraphMeta, false);
    } else {
      setDependencyGraphType("NoComp");
      getAllGraph(setGraphMeta, false);
    }
  }

  return (
    <div className="ms-welcome">
      {/* eslint-disable-next-line no-undef */}
      <p className="ms-font-m-plus">
        <Toggle label="Select the type of formula graphs:" inlineLabel defaultChecked
                onText="TACO" offText="NoComp"
                onChange={_onChange} />
      </p>
      <p className="ms-font-m-plus">
      <PrimaryButton
          className="ms-welcome__action"
          iconProps={{ iconName: "ChevronRight" }}
          onClick={() => getAllGraph(setGraphMeta, true)}
      >
        Generate the Entire Graph
      </PrimaryButton>
      </p>

      <Stack tokens={stackTokens}>
        <Stack horizontal horizontalAlign={'start'} tokens={stackTokens}>
          <DefaultButton
              className="ms-welcome__action"
              iconProps={{ iconName: "ChevronRight" }}
              onClick={() => getDependents(setGraphMeta, "true")}
          >
            Find Direct Dependents
          </DefaultButton>
          <DefaultButton
              className="ms-welcome__action"
              iconProps={{ iconName: "ChevronRight" }}
              onClick={() => getDependents(setGraphMeta, "false")}
          >
            Find Dependents
          </DefaultButton>
          <DefaultButton
              className="ms-welcome__action"
              iconProps={{ iconName: "ChevronRight" }}
              onClick={() => getPrecedents(setGraphMeta, "true")}
          >
            Find Direct Precedents
          </DefaultButton>
          <DefaultButton
              className="ms-welcome__action"
              iconProps={{ iconName: "ChevronRight" }}
              onClick={() => getPrecedents(setGraphMeta, "false")}
          >
            Find Precedents
          </DefaultButton>
        </Stack>
      </Stack>

      <Stack tokens={{ childrenGap: 10 }}>
        <Graph graphMeta={graphMeta} scale={100} />
      </Stack>
    </div>
  );
}
