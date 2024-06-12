import { OpenAI } from 'openai';
import { buildResponse } from '../index.mjs';

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
});

const assistant_id = process.env.ASSISTANT_ID;

async function handleOpenAIError(error) {
    if (error.response) {
        console.error(
            `API Error Response: ${error.response.status} ${error.response.statusText}`
        );
        console.error(`Error Details: ${error.response.data.error}`);

        switch (error.response.status) {
            case 401:
                return buildResponse(401, 'Check your API key.');
            case 429:
                return buildResponse(
                    426,
                    'API usage limit exceeded. Check your usage.'
                );
            default:
                return buildResponse(404, 'An unexpected error occurred.');
        }
    } else if (error.request) {
        return buildResponse(404, 'No response received from the API.');
    } else {
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
        return handleOpenAIError(error);
    }
}

async function addMessage(threadId, message) {
    const response = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
    });
}

async function runAI(threadId) {
    console.log('start run');
    const response = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistant_id,
    });
    return response;
}

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
    console.log('Starting to send message');
    try {
        await addMessage(threadId, message);
        const run = await runAI(threadId);
        return buildResponse(200, run.id);
    } catch (error) {
        console.error('Failed to send message or start AI run:', error);
        return buildResponse(500, error.message);
    }
}

export async function checkStatus(threadId, runId) {
    try {
        console.log('status check start');
        const runObject = await openai.beta.threads.runs.retrieve(
            threadId,
            runId
        );
        const status = runObject.status;
        console.log(status);
        return buildResponse(200, status);
    } catch (err) {
        return buildResponse(500, err.message);
    }
}

export async function readReply(threadId) {
    try {
        const messageList = await openai.beta.threads.messages.list(threadId);
        const messages = messageList.body.data;
        const lastMessage = messages[0].content;
        return buildResponse(200, lastMessage);
    } catch (err) {
        return buildResponse(500, err.message);
    }
}
