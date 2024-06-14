// index.mjs
import pkg from 'pg';
import * as projectRoutes from './routes/projectRoutes.mjs';
import * as pageRoutes from './routes/pageRoutes.mjs';
import * as functionRoutes from './routes/functionRoutes.mjs';
import * as variableRoutes from './routes/variableRoutes.mjs';
// import * as masterRoutes from './routes/masterRoutes.mjs';
import * as authRoutes from './routes/authRoutes.mjs';
const { Pool } = pkg;
import axios from 'axios';

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

export const buildCookieResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        multiValueHeaders: {
            'Access-Control-Allow-Origin': ['http://localhost:5173'],
            'Access-Control-Allow-Methods': ['POST, GET, PUT, DELETE'],
            'Access-Control-Allow-Credentials': ['true'],
        },
    };
};

export function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,

        headers: {
            'Access-Control-Allow-Origin': '*', // 또는 특정 도메인
            'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },

        body: JSON.stringify(body),
    };
}
function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(function (cookie) {
            var parts = cookie.match(/(.*?)=(.*)$/);
            if (parts) {
                cookies[parts[1].trim()] = (parts[2] || '').trim();
            }
        });
    }
    return cookies;
}

const rootPath = '/namegacha';
const projectPath = rootPath + '/project';
const projectsPath = projectPath + '/projects';
const pagePath = rootPath + '/page';
const pagesPath = pagePath + '/pages';
const functionPath = rootPath + '/function';
const functionsPath = functionPath + '/functions';
const variablePath = rootPath + '/variable';
const variablesPath = variablePath + '/variables';
const masterPath = rootPath + '/master';
const mastersPath = masterPath + '/masters';
const authPath = rootPath + '/auth';

export async function handler(event) {
    let response;
    if (event.path === projectPath) {
        if (event.httpMethod === 'GET') {
            // get an existing project
            response = await projectRoutes.getProject(
                event.queryStringParameters.projectId
            );
        } else if (event.httpMethod === 'POST') {
            // create a new project
            const requestBody = JSON.parse(event.body);
            response = await projectRoutes.createProject(
                requestBody.projectName
            );
        } else if (event.httpMethod === 'PUT') {
            // update an existing project
            const requestBody = JSON.parse(event.body);
            const projectId = event.queryStringParameters.projectId;
            const projectName = requestBody.projectName;
            response = await projectRoutes.updateProject(
                projectId,
                projectName
            );
        } else if (event.httpMethod === 'DELETE') {
            // delete an exsisting project
            response = await projectRoutes.deleteProject(
                event.queryStringParameters.projectId
            );
        }
    } else if (event.path === projectsPath) {
        if (event.httpMethod === 'GET') {
            // get all projects

            const content = event.queryStringParameters.content;
            if (content === 'all') {
                response = await projectRoutes.getProjects();
            } else if (content === 'certain') {
                const uuid = event.queryStringParameters.uuid;
                response = await projectRoutes.getCertainProjects(uuid);
            }
        }
    } else if (event.path === pagePath) {
        if (event.httpMethod === 'GET') {
            // get one page info
            response = await pageRoutes.getPage(
                event.queryStringParameters.pageId
            );
        } else if (event.httpMethod === 'POST') {
            // create new page
            const requestBody = JSON.parse(event.body);
            const pageName = requestBody.pageName;
            const projectId = requestBody.projectId;
            response = await pageRoutes.createPage(pageName, projectId);
        } else if (event.httpMethod === 'PUT') {
            // update page info
            const requestBody = JSON.parse(event.body);
            const pageName = requestBody.pageName;
            const pageId = event.queryStringParameters.pageId;
            response = await pageRoutes.updatePage(pageId, pageName);
        } else if (event.httpMethod === 'DELETE') {
            // delete page
            const pageId = event.queryStringParameters.pageId;
            response = await pageRoutes.deletePage(pageId);
        }
    } else if (event.path === pagesPath) {
        if (event.httpMethod === 'GET') {
            //get all page info
            response = await pageRoutes.getPages();
        }
    } else if (event.path === variablePath) {
        if (event.httpMethod === 'GET') {
            //get one variable info
            const varId = event.queryStringParameters.variableId;
            response = await variableRoutes.getVariable(varId);
        } else if (event.httpMethod === 'POST') {
            // create new variable
            const requestBody = JSON.parse(event.body);
            const variableName = requestBody.variableName;
            const pageId = requestBody.pageId;
            response = await variableRoutes.createVariable(
                variableName,
                pageId
            );
        } else if (event.httpMethod === 'PUT') {
            //update variable info
            const requestBody = JSON.parse(event.body);
            const variableName = requestBody.variableName;
            const varId = event.queryStringParameters.variableId;
            response = await variableRoutes.updateVariable(varId, variableName);
        } else if (event.httpMethod === 'DELETE') {
            //delete variable
            const varId = event.queryStringParameters.variableId;
            response = await variableRoutes.deleteVariable(varId);
        }
    } else if (event.path === variablesPath) {
        if (event.httpMethod === 'GET') {
            //get all variables
            response = await variableRoutes.getVariables();
        }
    } else if (event.path === functionPath) {
        if (event.httpMethod === 'GET') {
            const functionId = event.queryStringParameters.functionId;
            const result = await functionRoutes.getFunction(functionId);
            response = buildResponse(200, result);
        } else if (event.httpMethod === 'POST') {
            const requestBody = JSON.parse(event.body);
            const functionName = requestBody.functionName;
            const pageId = requestBody.pageId;
            response = await functionRoutes.createFunction(
                functionName,
                pageId
            );
        } else if (event.httpMethod === 'PUT') {
            const requestBody = JSON.parse(event.body);
            const functionName = requestBody.functionName;
            const functionId = event.queryStringParameters.functionId;
            response = await functionRoutes.updateFunction(
                functionId,
                functionName
            );
        } else if (event.httpMethod === 'DELETE') {
            const functionId = event.queryStringParameters.functionId;
            response = await functionRoutes.deleteFunction(functionId);
        }
    } else if (event.path === functionsPath) {
        if (event.httpMethod === 'GET') {
            response = await functionRoutes.getFunctions();
        }
    } else if (event.path === masterPath) {
        if (event.httpMethod === 'GET') {
        } else if (event.httpMethod === 'POST') {
        } else if (event.httpMethod === 'PUT') {
        } else if (event.httpMethod === 'DELETE') {
        }
    } else if (event.path === mastersPath) {
        if (event.httpMethod === 'GET') {
        }
    } else if (event.path === authPath) {
        if (event.httpMethod === 'POST') {
            const requestBody = JSON.parse(event.body);
            const content = requestBody.content;
            if (content == 'sign up') {
                const userId = requestBody.userId;
                const userPassword = requestBody.userPassword;
                response = await authRoutes.signUpUser(userId, userPassword);
            } else if (content == 'sign in') {
                const userId = requestBody.userId;
                const userPassword = requestBody.userPassword;
                response = await authRoutes.signInUser(userId, userPassword);
            } else if (content === 'sign out') {
                response = await authRoutes.signOutUser();
            } else if (content === 'access token') {
                const cookies = parseCookies(event.headers.cookie);
                console.log('header : ' + event.headers);
                console.log('refresh Token : ' + cookies['refreshToken']);
                console.log('access Token : ' + cookies['accessToken']);
                response = await authRoutes.accessToken(cookies);
            } else if (content === 'refresh token') {
                const cookies = parseCookies(event.headers.cookie);
                response = await authRoutes.refreshToken(cookies);
            }
        } else if (event.httpMethod === 'PUT') {
            const requestBody = JSON.parse(event.body);
            const userId = requestBody.userId;
            const userOldPassword = requestBody.userOldPassword;
            const userNewPassword = requestBody.userNewPassword;
            response = await authRoutes.updateUser(
                userId,
                userOldPassword,
                userNewPassword
            );
        } else if (event.httpMethod === 'GET') {
            const uuid = event.queryStringParameters.uuid;
            response = await authRoutes.getUser(uuid);
        } else if (event.httpMethod === 'OPTION') {
            response = await authRoutes.optionsHandler(event);
        }
    } else {
        response = buildResponse(404, 'Not Found');
    }
    return response;
}
