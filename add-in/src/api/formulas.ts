import { BASE_URL } from "../utils/constants";
import { Requests } from "../utils/requests";

export class FormulasApi {
  public static readonly PREFIX = "formulas";

  public static async hashFormulae(formulae: unknown[][]) {
    const url = `${BASE_URL}/${FormulasApi.PREFIX}/hash`;
    return await Requests.post(
      url,
      {
        body: JSON.stringify({ formulae }),
      },
      async (payload: { data: (string | null)[][] }) => {
        return payload.data;
      }
    );
  }
}
