# **Overview**
TACO-Lens is an Excel plugin that is based on TACO, a framework that efficiently compresses, queries, and maintains spreadsheet formula graphs. In TACO-Lens, users can visually inpsect formula graphs in a compact representation provided by TACO and efficiently trace dependents or precedents given a selected spreadsheet range. 

TACO-Lens is published in VLDB'23 as a [demo paper](https://people.eecs.berkeley.edu/~totemtang/paper/TACO-Lens.pdf), TACO is published in [ICDE'23](https://people.eecs.berkeley.edu/~totemtang/paper/TACO-TR.pdf), and the TACO source code is [here](https://github.com/taco-org/taco).

# **Using TACO-Lens**

### Start the backend server using Docker:

1. Start the backend web server
   ```sh
   docker-decompose up
   ```

### **Start the Excel add-in:**

1. Open a new terminal and move to the `add-in` folder.
   ```sh
   cd add-in
   ```

2. Install dependencies:
   ```sh
   npm i
   ```

3. Run the following command to start the add in.
   ```sh
   npm run start
   ```

4. A new Excel workbook should open automatically along with the add-in. You can also use this add-in for your own Excel workbook by opening one Excel file. To hide or open this add-in, you can click the **TACO Add-in** icon.

   ![demo](./img/demo-screenshot.png)
