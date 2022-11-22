export const transpose = <T>(mtx: T[][]) => {
  return mtx[0].map((_, colIdx) => mtx.map((row) => row[colIdx]));
};
