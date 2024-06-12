import * as aiRoutes from './routes/aiRoutes.mjs';
import axios from 'axios';
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
const rootPath = '/namegacha';
const aiPath = rootPath + '/ai';

async function testInternetConnectivity() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json'); // 외부 IP를 반환하는 간단한 API
        console.log('External IP:', response.data.ip); // 로그에 외부 IP 주소를 출력
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully connected to the internet!',
                ip: response.data.ip,
            }),
        };
    } catch (error) {
        console.error('Error connecting to the internet:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to connect to the internet',
                error: error.message,
            }),
        };
    }
}

export async function handler(event) {
    let response;
    if (event.path === aiPath) {
        if (event.httpMethod === 'GET') {
            const content = event.queryStringParameters.content;
            console.log('Content is : ' + content);
            if (content == 'thread') {
                response = await aiRoutes.createNewThread();
            } else if (content == 'messages') {
                const threadId = event.queryStringParameters.threadId;
                response = await aiRoutes.readMessages(threadId);
            } else if (content == 'test') {
                response = await testInternetConnectivity();
            } else if (content == 'status') {
                const threadId = event.queryStringParameters.threadId;
                const runId = event.queryStringParameters.runId;
                response = await aiRoutes.checkStatus(threadId, runId);
            } else if (content == 'reply') {
                const threadId = event.queryStringParameters.threadId;
                response = await aiRoutes.readReply(threadId);
            }
        } else if (event.httpMethod === 'POST') {
            const requestBody = JSON.parse(event.body);
            const threadId = requestBody.threadId;
            const message = requestBody.message;
            response = await aiRoutes.sendMessage(threadId, message);
        }
    } else {
        response = buildResponse(404, 'Not Found ');
    }
    return response;
}
