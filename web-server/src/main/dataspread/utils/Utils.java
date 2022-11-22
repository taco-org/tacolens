package dataspread.utils;

import org.apache.poi.ss.formula.ptg.AreaPtgBase;
import org.apache.poi.ss.formula.ptg.RefPtgBase;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.formula.ptg.Ptg;
import com.google.gson.JsonArray;

public class Utils {
  
  /**
   * Converts a JsonArray matrix into a string matrix.
   * 
   * @param mtx
   * @return The string matrix representation of the input
   * json matrix.
   */
  public static String[][] jsonMtxToStringMtx(JsonArray mtx) {
    int rows = mtx.size();
    int cols = mtx.get(0).getAsJsonArray().size();
    String[][] strs = new String[rows][cols];
    for (int i = 0; i < rows; i++) {
      for (int j = 0; j < cols; j++) {
        strs[i][j] = mtx
          .get(i).getAsJsonArray()
          .get(j).getAsString();
      }
    }
    return strs;
  }

  /**
   * If there is exactly one cell range in the parsed formula tokens,
   * returns it. Otherwise returns null.
   *  
   * @param tokens
   * @return null if there are multiple ranges found in the formula 
   * tokens. Otherwise return the only cell range in the formula tokens.
   */
  public static CellRangeAddress hasExactlyOneCellRange(Ptg[] tokens) {
    CellRangeAddress addr = null;
    for (int i = 0; i < tokens.length; i++) {
      if (tokens[i] instanceof AreaPtgBase) {
        if (addr != null) {
          return null;
        } else {
          addr = Utils.areaPtgToAddress((AreaPtgBase) tokens[i]);
        }
      }
    }
    return addr;
  }

  /**
   * If there is exactly one cell reference in the parsed formula tokens,
   * returns it. Otherwise returns null.
   * 
   * @param tokens
   * @return null if there are multiple cell references found in the formula 
   * tokens. Otherwise return the only cell reference in the formula tokens.
   */
  public static CellRangeAddress hasExactlyOneCellReference(Ptg[] tokens) {
    CellRangeAddress addr = null;
    for (int i = 0; i < tokens.length; i++) {
      if (tokens[i] instanceof RefPtgBase) {
        if (addr != null) {
          return null;
        } else {
          addr = Utils.refPtgToAddress((RefPtgBase) tokens[i]);
        }
      }
    }
    return addr;
  }

  /**
   * Converts an AreaPtg to a CellRangeAddress object.
   * 
   * @param area
   * @return The CellRangeAddress representation of the area ptg. 
   */
  public static CellRangeAddress areaPtgToAddress(AreaPtgBase area) {
    return new CellRangeAddress(area.getFirstRow(), area.getLastRow(), area.getFirstColumn(), area.getLastColumn());
  }

  /**
   * Converts an RefPtg to a CellRangeAddress object.
   * 
   * @param ref
   * @return The CellRangeAddress representation of the ref ptg. 
   */
  public static CellRangeAddress refPtgToAddress(RefPtgBase ref) {
    return new CellRangeAddress(ref.getRow(), ref.getRow(), ref.getColumn(), ref.getColumn());
  }

}
