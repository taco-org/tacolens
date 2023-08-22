# **Overview**
TACO-Lens is an Excel plugin that is based on TACO, a framework that efficiently compresses, queries, and maintains spreadsheet formula graphs. In TACO-Lens, users can visually inpsect formula graphs in a compact representation provided by TACO and efficiently trace dependents or precedents given a selected spreadsheet range. 

The TACO paper is published in ICDE'23 and can be found [here](https://people.eecs.berkeley.edu/~totemtang/paper/TACO-TR.pdf). The TACO source code is [here](https://github.com/taco-org/taco).

# **Using TACO-Lens**

### Start the backend server using Docker:

1. Start the backend web server
   ```sh
   docker-decompose up
   ```
2. Stop the backend web server
   ```sh
   docker-decompose down
   ```

### **Start the Excel add-in:**

1. Open a new terminal and navigate to the `add-in` folder.
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

4. A new Excel workbook should open automatically and you should be able to access the task plane for the add-in. 

5. You can also use the add-in in your own Excel workbook.

   ![demo](./img/demo.png)
