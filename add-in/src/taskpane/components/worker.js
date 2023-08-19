import {buildClassMap, DefaultButton, PrimaryButton} from "@fluentui/react";
import { Stack, IStackTokens } from '@fluentui/react';
import { Toggle } from '@fluentui/react/lib/Toggle';
import * as React from "react";
import { TacoApi } from "../../api/taco";
import Progress from "./Progress";
import Graph, { GraphMeta } from "./Graph";
import cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";

function buildGraph(elements) {
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
            <CytoscapeComponent
                elements={elements}
                style={{ width: "95%", height: "600px", left: "2.5%", borderStyle: "solid", borderWidth: "thin"}}
                stylesheet={cytoscapeStylesheet}
                pan={{ x: 0, y: 0 }}
                zoom={1}
            />
        </>
    );
}

self.onmessage = function (event) {
    return <p className="ms-font-m-plus">"success"</p>;
    const element = event.data;
    // const result = buildGraph(element);
    const result = <p className="ms-font-m-plus">"success"</p>;
    self.postMessage(result);
}
