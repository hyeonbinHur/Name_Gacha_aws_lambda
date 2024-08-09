# NameGacha lambda function

<div align="center">
<img src="https://img.shields.io/badge/AWS Lambda-FF9900?style=for-the-badge&logo=awslambda&logoColor=white">
<img src="https://img.shields.io/badge/AWS RDS-527FFF?style=for-the-badge&logo=awsrds&logoColor=white">
<img src="https://img.shields.io/badge/AWS API Gateway-FF4F8B?style=for-the-badge&logo=amazonapigateway&logoColor=white">
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
<img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white">
<img src="https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logoColor=white">

</div>

<div align="center">
  <img src="https://github.com/user-attachments/assets/4c42d3da-e9c5-463e-aa6a-fb6439f30767">
  
</div>

## Project Overview

This project is an AI-powered chatting application built with AWS Lambda functions written in Node.js. The main feature of the project is to provide identifier names and explanations for developers. When a developer gives a simple explanation to the AI, it returns 9 sample names with explanations. The developer can choose one of these names and save the name and explanation to their database. The database consists of five tables: project, page, variable, function, and user. A user is associated with projects, each project contains pages, and each page contains variables and functions. The application is implemented using REST APIs with AWS Lambda functions, API Gateway, RDS, and OpenAI's Assistant API.

## Techonologies Used

-   AWS-Lambda Function
-   AWS-RDS
-   AWS-API Gateway
-   OpenAI Assitant API
-   PostgreSQL

## Lambda Function Layers

-   pg
    > npm install pg
-   dotenv
    > npm install dotenv
-   cors
    > npm install cors
-   jwt & cookie-parse
    > npm install jsonwebtoken cookie-parser
-   open ai
    > npm install openai

## Database

### ERD

![alt text](image.png)

### Lambda + RDS

```javascript
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
    host: process.env.HOST,
    port: 5432,
    user: process.env.USER_NAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: {
        rejectUnauthorized: false,
    },
});
```

# REST APIs

|   Event Path   |         Name          | Method |                                                      Feature                                                      |
| :------------: | :-------------------: | :----: | :---------------------------------------------------------------------------------------------------------------: |
|   Auth Path    |        getUser        |  GET   |                                                 Get all user data                                                 |
|                |      signInUser       |  POST  |                                           Verify username and password                                            |
|                |      signUpUser       |  POST  |                                                  Create new user                                                  |
|                |      signOutUser      |  POST  |                                                 Delete all tokens                                                 |
|                |      accessToken      |  POST  |                                                Check access token                                                 |
|                |     refreshToken      |  POST  |                                                Check refresh token                                                |
| Projects Path  |  getSpecificProject   |  GET   |                   Get all information for a specific project (including pages and identifiers)                    |
|                |      getProjects      |  GET   |                                    Get all project information (for debugging)                                    |
|  Project Path  |     createProject     |  POST  |                                   Create a new project with a specific user ID                                    |
|                |     updateProject     |  PUT   |                                     Update an existing project's information                                      |
|                |     deleteProject     | DELETE |                                            Delete an existing project                                             |
|   Pages Path   |       getPages        |  GET   |                                     Get all page information (for debugging)                                      |
|   Page Path    |        getPage        |  GET   |                          Get all information for a specific page (including identifiers)                          |
|                |      createPage       |  POST  |                                   Create a new page with a specific project ID                                    |
|                |      updatePage       |  PUT   |                                       Update an existing page's information                                       |
|                |      deletePage       | DELETE |                                              Delete an existing page                                              |
| Variables Path |     getVariables      |  GET   |                                         Get all variables (for debugging)                                         |
| Variable Path  |      getVariable      |  GET   |                                      Get information for a specific variable                                      |
|                |    createVariable     |  POST  |                                   Create a new variable with a specific page ID                                   |
|                |    updateVariable     |  PUT   |                                     Update an existing variable's information                                     |
|                |    deleteVariable     | DELETE |                                            Delete an existing variable                                            |
|                | deleteVariablesInPage | DELETE |                                      Delete all variables in a specific page                                      |
| Functions Path |     getFunctions      |  GET   |                                         Get all functions (for debugging)                                         |
| Function Path  |      getFunction      |  GET   |                                      Get information for a specific function                                      |
|                |    createFunction     |  POST  |                                   Create a new function with a specific page ID                                   |
|                |    updateFunction     |  PUT   |                                     Update an existing function's information                                     |
|                |    deleteFunction     | DELETE |                                            Delete an existing function                                            |
|                | deleteFunctionsInPage | DELETE |                                      Delete all functions in a specific page                                      |
|    AI Path     |    createNewThread    |  POST  |                                             Create a new chat thread                                              |
|                |     readMessages      |  GET   |                                              Read last reply from AI                                              |
|                |      checkStatus      |  GET   | Check current AI chat status (if complete, ready to return the reply; if in queue, not ready to return the reply) |
|                |       readReply       |  GET   |                   Read all messages in a specific thread (including both user and AI messages)                    |
|                |      sendMessage      |  POST  |                                      Send user message to a specific thread                                       |

## Sample API code

```javascript
export function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },

        body: JSON.stringify(body),
    };
}

export async function handler(event) {
    let response;
    if (event.path === projectPath) {
        if (event.httpMethod === 'GET') {
            // get an existing project
            response = await projectRoutes.getProject(
                event.queryStringParameters.projectId
            );
        }
    }
    return response;
}

export async function getProject(projectId) {
    try {
        const query = 'SELECT * FROM public.projects WHERE "projectId" = $1';
        const { rows } = await pool.query(query, [projectId]);
        return buildResponse(200, rows);
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}
```
