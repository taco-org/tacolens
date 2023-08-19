package dataspread;

import static spark.Spark.*;
import spark.Filter;

import java.net.URL;
import java.net.URLClassLoader;

import dataspread.formulas.FormulasController;
import dataspread.taco.TacoController;
import dataspread.utils.Controller;

/**
 * Entry point for the formula detection API.
 */
public class App {

  // Add more controllers here!
  public static Controller[] controllers = {
      new FormulasController(),
      new TacoController(),
  };

  public static void main(String[] args) {
    port(4567);

    after((Filter) (request, response) -> {
      response.header("Access-Control-Allow-Origin", "*");
      response.header("Access-Control-Allow-Methods", "*");
      response.header("Access-Control-Allow-Headers", "*");
      response.header("Content-Encoding", "gzip");
    });

    path("/api", () -> {
      for (Controller c : App.controllers) {
        path(c.getPrefix(), c.getRoutes());
      }
    });

  }
}
