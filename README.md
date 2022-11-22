# **Getting Started**

## **Development Quick Start**

### **Starting the backend server:**

1. Open the project using VS Code

2. Make sure you have the [recommended extensions](https://code.visualstudio.com/docs/java/extensions#_fundamental-java-development) for Java installed

3. Start the server from `App.java`. In VS Code you can use the play button at the top right of the editor to launch the app from `App.java`.

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
4. A new Excel workbook should open automatically and you should be able to access the task plane for the add-in. Please refer to the [official documentation](https://docs.microsoft.com/en-us/office/dev/add-ins/quickstarts/excel-quickstart-react) if you receive errors.

## **Running the Project with Docker**

To run the project with docker, use the following command:

```sh
docker-compose up -d
```

Currently, only the backend API is started with docker.
