package dataspread.formulas;

import dataspread.utils.ApiFormulaParser;

import org.apache.poi.ss.formula.ptg.ScalarConstantPtg;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.poi.ss.formula.ptg.OperationPtg;
import org.apache.poi.ss.formula.ptg.OperandPtg;
import org.apache.poi.ss.formula.ptg.Ptg;
import java.io.IOException;
import java.util.Arrays;

public class FormulasService {

  private static String hashFormula(Ptg[] ptgs) {
    StringBuilder cleanedFormula = new StringBuilder();
    for (Ptg ptg : ptgs) {
      if (ptg instanceof OperationPtg) {
        // Include mathematical operators in the cleaned formula
        OperationPtg tok = (OperationPtg) ptg;
        String[] operands = new String[tok.getNumberOfOperands()];
        Arrays.fill(operands, "");
        cleanedFormula.append(tok.toFormulaString(operands));
      } else if (ptg instanceof ScalarConstantPtg || ptg instanceof OperandPtg) {
        // Only exclude constants and cells from the cleaned formula
        continue;
      } else {
        // Include ArrayPtg, UnknownPtg, and ControlPtg in the cleaned formula
        cleanedFormula.append(ptg.toFormulaString());
      }
    }
    return DigestUtils.md5Hex(cleanedFormula.toString()).toUpperCase();
  }

  public static String[][] hashFormulae(String[][] formulaMtx) throws IOException {
    String[][] hashes = new String[formulaMtx.length][formulaMtx[0].length];
    ApiFormulaParser.parseFormulae(formulaMtx, (ptgs, i, j) -> {
      if (ptgs != null) {
        hashes[i][j] = FormulasService.hashFormula(ptgs);
      } else {
        hashes[i][j] = null;
      }
    });
    return hashes;
  }

}
