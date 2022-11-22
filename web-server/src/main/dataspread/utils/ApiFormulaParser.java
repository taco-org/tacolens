package dataspread.utils;

import org.apache.poi.ss.formula.FormulaParsingWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.formula.FormulaParser;
import org.apache.poi.ss.formula.FormulaType;
import org.apache.poi.ss.formula.ptg.Ptg;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import java.io.IOException;

public class ApiFormulaParser {
  
  /**
   * Parses an excel formula into ptg tokens.
   * 
   * @param workbook
   * @param cell
   * @param formula
   * @return The parsed formula.
   */
  private static Ptg[] parseFormula(FormulaParsingWorkbook workbook, Cell cell, String formula) {
    try {
      if (formula.startsWith("=")) {
        cell.setCellFormula(formula.substring(1));
        return FormulaParser.parse(
          cell.getCellFormula()
          , workbook
          , FormulaType.CELL
          , cell.getSheet().getWorkbook().getSheetIndex(cell.getSheet())
          , cell.getRowIndex()
        );
      } else {
        return null;
      }
    } catch (Exception err) {
      err.printStackTrace();
      return null;
    }
  }

  /**
   * Given a matrix of Excel spreadsheet formula, iterate over the 
   * range row by row and perform a callback operation on each tokenized 
   * formula.
   * 
   * @param formulae
   * @param callback
   * @throws IOException
   */
  public static void parseFormulae(String[][] formulae, TriConsumer<Ptg[], Integer, Integer> callback) throws IOException {
    try (XSSFWorkbook workbook = new XSSFWorkbook()) {
      Row row = workbook.createSheet().createRow(0);
      for (int i = 0; i < formulae.length; i++) {
        for (int j = 0; j < formulae[i].length; j++) {
          Ptg[] parsed = ApiFormulaParser.parseFormula(
            workbook.createEvaluationWorkbook(), 
            row.createCell(0), 
            formulae[i][j]
          );
          callback.accept(parsed, i, j);
        }
      }
    }
  }

}
