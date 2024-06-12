import * as aiRoutes from './routes/aiRoutes.mjs';

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

export async function handler(event) {
    let response;
    if (event.path === aiPath) {
        if (event.httpMethod === 'GET') {
            const requestBody = JSON.parse(event.body);
            const content = requestBody.content;
            if (content == 'create thread') {
                response = await aiRoutes.createNewThread();
            } else if (content == 'read messages') {
                const threadId = requestBody.threadId;
                response = await aiRoutes.readMessages(threadId);
            }
        } else if (event.httpMethod === 'POST') {
            const threadId = requestBody.threadId;
            response = await aiRoutes.sendMessage(threadId);
        }
    } else {
        response = buildResponse(404, 'Not Found ');
    }
    return response;
}
