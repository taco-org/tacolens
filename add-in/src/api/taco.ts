import { BASE_URL } from "../utils/constants";
import { Requests } from "../utils/requests";
import { TacoResponse } from "./taco.types";

export class TacoApi {
  public static readonly PREFIX = "taco";

  public static async setGraphType(graphType: String) {
    const url = `${BASE_URL}/${TacoApi.PREFIX}/patterns`;
    let type = "set";
    let content = {
      // TACO / NoComp
      graph: graphType,
      type: type,
    };
    return await Requests.post(
        url,
        {
          body: JSON.stringify(content),
        },
        async (payload: { taco: TacoResponse }) => {
          return payload.taco;
        }
    );
  }

  public static async buildDepGraph(formulae: unknown[][], type: String) {
    // formulae: [][]string, including contents and formula
    const url = `${BASE_URL}/${TacoApi.PREFIX}/patterns`;
    let content = {
      formulae: formulae,
      type: type,
    };
    return await Requests.post(
      url,
      {
        body: JSON.stringify(content),
      },
      async (payload: { taco: TacoResponse }) => {
        return payload.taco;
      }
    );
  }

  public static async getSubGraph(range, type, isDirect) {
    // range: string like A1:B10
    const url = `${BASE_URL}/${TacoApi.PREFIX}/patterns`;
    var content = {
      range: range,
      type: type,
      isDirect: isDirect,
    };
    return await Requests.post(
      url,
      {
        body: JSON.stringify(content),
      },
      async (payload: { taco: TacoResponse }) => {
        return payload.taco;
      }
    );
  }
}
