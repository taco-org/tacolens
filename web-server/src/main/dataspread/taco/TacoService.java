package dataspread.taco;

import dataspread.utils.ApiFormulaParser;
import dataspread.utils.Utils;

import org.apache.poi.ss.util.CellRangeAddress;
import org.dataspread.sheetanalyzer.util.Ref;
import org.dataspread.sheetanalyzer.util.RefImpl;

import java.io.IOException;

public class TacoService {

  public enum PatternType {
    RR_GAP_ONE,
    RR_CHAIN,
    UNKNOWN,
    NO_COMP,
    RR,
    RF,
    FR,
    FF,
  }

  public static Ref fromStringtoRange(String cellStr) {
    String[] content = cellStr.split(":");

    String start = content[0];
    String end;
    if (content.length > 1) {
      end = content[1];
    } else {
      end = content[0];
    }
    StringBuilder startRowStr = new StringBuilder();
    StringBuilder endRowStr = new StringBuilder();
    StringBuilder startColStr = new StringBuilder();
    StringBuilder endColStr = new StringBuilder();

    // Start
    for (int i = 0; i < start.length(); ++i) {
      char s = start.charAt(i);
      if (Character.isDigit(s)) {
        startRowStr.append(s);
      } else {
        startColStr.append(s);
      }
    }
    String col = startColStr.toString();
    int rowIdx = Integer.parseInt(startRowStr.toString()) - 1;
    int colIdx = 0;
    char[] colChars = col.toLowerCase().toCharArray();
    for(int i = 0; i < colChars.length; ++i) {
      colIdx = (int)((double)colIdx + (double)(colChars[i] - 97 + 1) * Math.pow(26.0D, (double)(colChars.length - i - 1)));
    }
    --colIdx;

    // End
    for (int i = 0; i < end.length(); ++i) {
      char s = end.charAt(i);
      if (Character.isDigit(s)) {
        endRowStr.append(s);
      } else {
        endColStr.append(s);
      }
    }
    col = endColStr.toString();
    int endRowIdx = Integer.parseInt(endRowStr.toString()) - 1;
    int endColIdx = 0;
    colChars = col.toLowerCase().toCharArray();
    for(int i = 0; i < colChars.length; ++i) {
      endColIdx = (int)((double)endColIdx + (double)(colChars[i] - 97 + 1) * Math.pow(26.0D, (double)(colChars.length - i - 1)));
    }
    --endColIdx;
    return new RefImpl(rowIdx, colIdx, endRowIdx, endColIdx);
  }

  public static String parseAddressString(String address) {
    int startIdx = 0, endIdx = address.length() - 1;
    while (startIdx < address.length()) {
      char ch = address.charAt(startIdx);
      if (Character.toString(ch).equals("!")) {
        break;
      } else {
        startIdx += 1;
      }
    }
    while (endIdx > startIdx) {
      char ch = address.charAt(endIdx);
      if (Character.isDigit(ch)) {
        break;
      } else {
        endIdx -= 1;
      }
    }
    return address.substring(startIdx+1, endIdx+1);
  }

  private static boolean isRRPattern(CellRangeAddress prev, CellRangeAddress curr) {
    return
      curr != null && prev != null &&
      curr.getFirstColumn() != curr.getLastColumn() &&
      curr.getFirstRow() != curr.getLastRow() &&
      prev.getFirstColumn() != prev.getLastColumn() &&
      prev.getFirstRow() != prev.getLastRow() && 
      prev.getFirstColumn() == curr.getFirstColumn() &&
      prev.getLastColumn() == curr.getLastColumn() && 
      prev.getFirstRow() + 1 == curr.getFirstRow() &&
      prev.getLastRow() + 1 == curr.getLastRow();
  }

  private static boolean isRFPattern(CellRangeAddress prev, CellRangeAddress curr) {
    return 
      curr != null && prev != null &&
      prev.getFirstColumn() == curr.getFirstColumn() &&
      prev.getLastColumn() == curr.getLastColumn() && 
      prev.getFirstRow() + 1 == curr.getFirstRow() &&
      prev.getLastRow() == curr.getLastRow();
  }

  private static boolean isFRPattern(CellRangeAddress prev, CellRangeAddress curr) {
    return 
      curr != null && prev != null &&
      prev.getFirstColumn() == curr.getFirstColumn() &&
      prev.getLastColumn() == curr.getLastColumn() && 
      prev.getFirstRow() == curr.getFirstRow() &&
      prev.getLastRow() + 1 == curr.getLastRow();
  }

  private static boolean isFFPattern(CellRangeAddress prev, CellRangeAddress curr) {
    return 
      curr != null && prev != null &&
      prev.getFirstColumn() == curr.getFirstColumn() &&
      prev.getLastColumn() == curr.getLastColumn() && 
      prev.getFirstRow() == curr.getFirstRow() &&
      prev.getLastRow() == curr.getLastRow();
  }

  private static boolean isRRChainPattern(CellRangeAddress prev, CellRangeAddress curr) {
    return 
      curr != null && prev != null &&
      curr.getFirstColumn() == curr.getLastColumn() &&
      curr.getFirstRow() == curr.getLastRow() &&
      prev.getFirstColumn() == prev.getLastColumn() &&
      prev.getFirstRow() == prev.getLastRow() && 
      curr.getFirstColumn() == prev.getFirstColumn() && 
      curr.getFirstRow() == prev.getFirstRow() + 1;
  }

  private static void classifyPattern(CellRangeAddress[][] ranges, PatternType[][] patterns, int r, int c) {
    // The formula parser iterates over cells row by row, so when
    // this function is called, the cell above the current cell
    // and the cell directly to the left of the current cell have
    // already been visited and we know if they have exactly one
    // range or not.
    CellRangeAddress top = r - 1 >= 0 ? ranges[r - 1][c] : null;
    CellRangeAddress lft = c - 1 >= 0 ? ranges[r][c - 1] : null;
    CellRangeAddress cur = ranges[r][c];
    if (top != null && lft != null) {
      // If both the left and top cells have exactly one cell range
      // or cell reference, then we check if the current cell matches
      // the patterns in both the top and left cells. If they do, then
      // the current cell also follows the same pattern.
      if (
        TacoService.isRRPattern(top, cur) &&
        TacoService.isRRPattern(lft, cur)
      ) {
        patterns[r][c] = patterns[r - 1][c] = patterns[r][c - 1] = PatternType.RR;
      } else if (
        TacoService.isRFPattern(top, cur) &&
        TacoService.isRFPattern(lft, cur)
      ) {
        patterns[r][c] = patterns[r - 1][c] = patterns[r][c - 1] = PatternType.RF;
      } else if (
        TacoService.isFRPattern(top, cur)&&
        TacoService.isFRPattern(lft, cur)
      ) {
        patterns[r][c] = patterns[r - 1][c] = patterns[r][c - 1] = PatternType.FR;
      } else if (
        TacoService.isFFPattern(top, cur) &&
        TacoService.isFFPattern(lft, cur)
      ) {
        patterns[r][c] = patterns[r - 1][c] = patterns[r][c - 1] = PatternType.FF;
      } else if (
        TacoService.isRRChainPattern(top, cur) &&
        TacoService.isRRChainPattern(lft, cur)
      ) {
        patterns[r][c] = patterns[r - 1][c] = patterns[r][c - 1] = PatternType.RR_CHAIN;
      } else {
        // If both the top and left cells have exactly one cell range (or 
        // cell reference), but the current cell does not match the patterns 
        // in both the top and left cells, then we arbitrarily use the left 
        // cell for classification first. If there are no pattern matches, 
        // then the top cell is used next. If there are still no matches, 
        // then the cell is marked as incompressable.
        if (TacoService.isRRPattern(lft, cur)) {
          patterns[r][c] = patterns[r][c - 1] = PatternType.RR;
        } else if (TacoService.isRFPattern(lft, cur)) {
          patterns[r][c] = patterns[r][c - 1] = PatternType.RF;
        } else if (TacoService.isFRPattern(lft, cur)) {
          patterns[r][c] = patterns[r][c - 1] = PatternType.FR;
        } else if (TacoService.isFFPattern(lft, cur)) {
          patterns[r][c] = patterns[r][c - 1] = PatternType.FF;
        } else if (TacoService.isRRChainPattern(lft, cur)) {
          patterns[r][c] = patterns[r][c - 1] = PatternType.RR_CHAIN;
        } else if (TacoService.isRRPattern(top, cur)) {
          patterns[r][c] = patterns[r - 1][c] = PatternType.RR;
        } else if (TacoService.isRFPattern(top, cur)) {
          patterns[r][c] = patterns[r - 1][c] = PatternType.RF;
        } else if (TacoService.isFRPattern(top, cur)) {
          patterns[r][c] = patterns[r - 1][c] = PatternType.FR;
        } else if (TacoService.isFFPattern(top, cur)) {
          patterns[r][c] = patterns[r - 1][c] = PatternType.FF;
        } else if (TacoService.isRRChainPattern(top, cur)) {
          patterns[r][c] = patterns[r - 1][c] = PatternType.RR_CHAIN;
        } else {
          patterns[r][c] = PatternType.NO_COMP;
        }
      }
    } else if (top != null) {
      // If only the top cell has one cell range (or cell reference),
      // then we simply check for a pattern between it and the current
      // cell.
      if (TacoService.isRRPattern(top, cur)) {
        patterns[r][c] = patterns[r - 1][c] = PatternType.RR;
      } else if (TacoService.isRFPattern(top, cur)) {
        patterns[r][c] = patterns[r - 1][c] = PatternType.RF;
      } else if (TacoService.isFRPattern(top, cur)) {
        patterns[r][c] = patterns[r - 1][c] = PatternType.FR;
      } else if (TacoService.isFFPattern(top, cur)) {
        patterns[r][c] = patterns[r - 1][c] = PatternType.FF;
      } else if (TacoService.isRRChainPattern(top, cur)) {
        patterns[r][c] = patterns[r - 1][c] = PatternType.RR_CHAIN;
      } else {
        patterns[r][c] = PatternType.NO_COMP;
      }
    } else if (lft != null) {
      // If only the left cell has one cell range (or cell reference),
      // then we simply check for a pattern between it and the current
      // cell.
      if (TacoService.isRRPattern(lft, cur)) {
        patterns[r][c] = patterns[r][c - 1] = PatternType.RR;
      } else if (TacoService.isRFPattern(lft, cur)) {
        patterns[r][c] = patterns[r][c - 1] = PatternType.RF;
      } else if (TacoService.isFRPattern(lft, cur)) {
        patterns[r][c] = patterns[r][c - 1] = PatternType.FR;
      } else if (TacoService.isFFPattern(lft, cur)) {
        patterns[r][c] = patterns[r][c - 1] = PatternType.FF;
      } else if (TacoService.isRRChainPattern(lft, cur)) {
        patterns[r][c] = patterns[r][c - 1] = PatternType.RR_CHAIN;
      } else {
        patterns[r][c] = PatternType.NO_COMP;
      }
    } else {
      // At this point, both the top cell and left cell don't have exactly
      // one cell range (or cell reference), so we don't have enough info
      // to classify the current cell.
      patterns[r][c] = PatternType.UNKNOWN;
    }
  }
  
  /**
   * Given a matrix of Excel formula strings, find all the TACO patterns
   * in the matrix.
   *  
   * @param formulaMtx
   * @return A matrix of TACO patterns with the same shape as the input.
   * @throws IOException
   */
  public static PatternType[][] getPatterns(String[][] formulaMtx) throws IOException {
    PatternType[][] patterns = new PatternType[formulaMtx.length][formulaMtx[0].length];
    CellRangeAddress[][] ranges = new CellRangeAddress[formulaMtx.length][formulaMtx[0].length];
    ApiFormulaParser.parseFormulae(formulaMtx, (ptgs, i, j) -> {
      if (ptgs != null) {
        CellRangeAddress rng = Utils.hasExactlyOneCellRange(ptgs);
        CellRangeAddress ref = Utils.hasExactlyOneCellReference(ptgs);
        if (rng != null) {
          ranges[i][j] = rng;
        } else if (ref != null) {
          ranges[i][j] = ref;
        }
        TacoService.classifyPattern(ranges, patterns, i, j);
      }
    });
    return patterns;
  }

}
