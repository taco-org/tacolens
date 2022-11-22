package dataspread.utils;

import spark.RouteGroup;

/**
 * An interface for definining API controllers.
 */
public interface Controller {
  public String getPrefix();
  public RouteGroup getRoutes();
}
