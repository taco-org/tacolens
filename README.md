# **Getting Started**

## **Development Quick Start**

### **Starting the backend server:**

1. Open the project using Intellij IDEA
2. Start the server from `App.java`. In Intellij IDEA you can use the play button at the top right of the editor to launch the app from `App.java`.

### Starting the backend server with Docker image:

1. Docker image download link: https://drive.google.com/file/d/1TSfMQnReg2gNs9Ds5gpZyoqOsG1bQleC/view?usp=sharing
2. Load the image: <code>docker load < tacolen.tar</code>
3. Run the image and map the port: <code>docker run -p 4567:4567 tacolens-backend:1.0.0</code>
4. The backend server should be running and listen to the port 4567, you can keep on starting the excel add-in server.

### **Starting the Excel add-in server:**

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
