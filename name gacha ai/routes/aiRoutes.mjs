import { OpenAI } from 'openai';
import { buildResponse } from '../index.mjs';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const assistant_id = process.env.ASSISTANT_ID;

let poolingInterval;

// const createThread = async () => {
//     console.log('start to create thred');
//     try {
//         const thread = await openai.beta.threads.create();
//         console.log("thread id is  : "+thread.id);
//         return thread;
//     } catch (err) {
//         console.log("error is : "+err);
//         return err.message;
//     }
// };

function handleOpenAIError(error) {
    if (error.response) {
        // API 요청이 서버에 도달했으나 서버가 2XX가 아닌 상태 코드로 응답
        console.error(
            `API Error Response: ${error.response.status} ${error.response.statusText}`
        );
        console.error(`Error Details: ${error.response.data.error}`);

        // 상태 코드에 따른 조치
        switch (error.response.status) {
            case 401: // Unauthorized
                return buildResponse(401, 'Check your API key.');
            case 429: // Too Many Requests
                return buildResponse(
                    426,
                    'API usage limit exceeded. Check your usage.'
                );
            default:
                return buildResponse(404, 'An unexpected error occurred.');
        }
    } else if (error.request) {
        // 요청이 이루어졌으나 응답을 받지 못함
        return buildResponse(404, 'No response received from the API.');
    } else {
        // 요청 설정 중에 문제가 발생함
        return buildResponse(
            404,
            'Error setting up the request:',
            error.message
        );
    }
}

async function createThread() {
    try {
        console.log('create thread start');
        const thread = await openai.beta.threads.create();
        console.log('Thread created:', thread);
        return thread;
    } catch (error) {
        console.error('Failed to create thread:', error);
        handleOpenAIError(error);
    }
}
const addMessage = async (threadId, message) => {
    const response = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
    });
};

const runAI = async (threadId) => {
    const response = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistant_id,
    });
    return response;
};

const checkStatus = async (threadId, runId) => {
    const runObject = await openai.beta.threads.runs.retrieve(threadId, runId);
    const status = runObject.status;
    if (status == 'completed') {
        clearInterval(poolingInterval);
        const messageList = await openai.beta.threads.messages.list(threadId);
        const messages = messageList.body.data;
        const lastMessage = messages[messages.length - 1].content;
        return buildResponse(200, lastMessage);
    }
};

export async function createNewThread() {
    const response = await createThread();
    return buildResponse(200, response.id);
}

export async function readMessages(threadId) {
    try {
        console.log('read msg start');

        const timeout = new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error('Request timed out'));
            }, 100000);
        });

        const messageList = await Promise.race([
            openai.beta.threads.messages.list(threadId),
            timeout,
        ]);

        let messages = [];
        messageList.body.data.forEach((message) => {
            messages.push(message.content);
        });
        console.log('read msg done');
        return buildResponse(200, { messages });
    } catch (err) {
        console.log('detect err:', err.message);

        const statusCode = err.message === 'Request timed out' ? 408 : 404;
        return buildResponse(statusCode, { error: err.message });
    }
}

export async function sendMessage(threadId, message) {
    try {
        await addMessage(threadId, message);
        const run = await runAI(threadId);
        const runId = run.id;
        const statusCheck = await checkStatus(threadId, runId); // 상태 확인 로직을 수정하여 즉시 결과를 반환하도록 함
        return statusCheck;
    } catch (error) {
        return buildResponse(500, error.message);
    }
}
