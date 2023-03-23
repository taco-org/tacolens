package dataspread.taco;

import static org.dataspread.sheetanalyzer.dependency.util.RefUtils.fromStringToCell;
import static spark.Spark.post;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import org.dataspread.sheetanalyzer.SheetAnalyzer;
import org.dataspread.sheetanalyzer.dependency.util.RefWithMeta; //for testing
import org.dataspread.sheetanalyzer.util.Ref;

import dataspread.taco.TacoService.PatternType;
import dataspread.utils.Controller;
import dataspread.utils.Utils;
import spark.RouteGroup;

public class TacoController implements Controller {

  private SheetAnalyzer sheetAnalyzer = null;
  private static String defaultSheetName = "default-sheet-name";

  @Override
  public String getPrefix() {
    return "/taco";
  }

  @Override
  public RouteGroup getRoutes() {
    return () -> {
      post("/patterns", (req, res) -> {
        JsonObject body = new Gson().fromJson(req.body(), JsonObject.class);
        String type = body.get("type").toString().toLowerCase();
        if (type.contains("build")) {
          // For building graphs, content should be [][]string
          JsonElement formulae = body.get("formulae");
          if (formulae != null) {
            // Building the dependency graph
            JsonArray mtx = formulae.getAsJsonArray();
            String[][] fMtx = Utils.jsonMtxToStringMtx(mtx);
            PatternType[][] hMtx = TacoService.getPatterns(fMtx);
            Map<String, String[][]> spreadsheetContent = new HashMap<>();
            spreadsheetContent.put(defaultSheetName, fMtx);
            sheetAnalyzer = SheetAnalyzer.createSheetAnalyzer(spreadsheetContent);
            return new Gson().toJson(Map.of("data", hMtx, "taco", sheetAnalyzer.getTACODepGraphs()));
          } else {
            // Return empty json
            return new Gson().toJson(Map.of("data", new String[0]));
          }
        } else {
          // For finding dependents/precedents, content should be a string indicating the range (A1:B10)
          String range = body.get("range").toString();
          range = TacoService.parseAddressString(range);
          if (sheetAnalyzer != null) {
            Ref target = TacoService.fromStringtoRange(range);
            Map<Ref, List<RefWithMeta>> result;
            if (type.contains("dep")) {
              result = sheetAnalyzer.getDependentsSubGraph(defaultSheetName, target);
            } else {
              result = sheetAnalyzer.getPrecedentsSubGraph(defaultSheetName, target);
            }
            Map<String, Map<Ref, List<RefWithMeta>>> subgraph = new HashMap<>();
            subgraph.put(defaultSheetName, result);
            return new Gson().toJson(Map.of("data", new String[0], "taco", subgraph));
          } else {
            // Return empty json
            return new Gson().toJson(Map.of("data", new String[0]));
          }
        }
      });
    };
  }

  private void debug(Map<String,Map<Ref,List<RefWithMeta>>> data) {
    for (String r: data.keySet()) {
      Map<Ref,List<RefWithMeta>> ref = data.get(r);
      System.out.println(r + ": ");
      for (Map.Entry<Ref,List<RefWithMeta>> deps : ref.entrySet()) {
        System.out.println("\t" + deps.getKey() + ":");
        for (RefWithMeta meta : deps.getValue()) {
          System.out.println("\t\t" + meta.getRef() + " | " + meta.getPatternType());
        }
      }
    }
  }
}
