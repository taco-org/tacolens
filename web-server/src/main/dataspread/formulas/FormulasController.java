package dataspread.formulas;

import static spark.Spark.*;

import dataspread.utils.Controller;
import dataspread.utils.Utils;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.Gson;
import spark.RouteGroup;
import java.util.Map;

public class FormulasController implements Controller {
  
  @Override
  public String getPrefix() {
    return "/formulas";
  }

  @Override
  public RouteGroup getRoutes() {
    return () -> {
      post("/hash", (req, res) -> {
        JsonObject body = new Gson().fromJson(req.body(), JsonObject.class);
        JsonElement formulae = body.get("formulae");
        if (formulae != null) {
          JsonArray mtx = formulae.getAsJsonArray();
          String[][] fMtx = Utils.jsonMtxToStringMtx(mtx);
          String[][] hMtx = FormulasService.hashFormulae(fMtx);
          return new Gson().toJson(Map.of("data", hMtx));
        } else {
          return new Gson().toJson(Map.of("data", new String[0]));
        }
      });
    };
  }

}
