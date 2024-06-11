import { OpenAI } from 'openai';
import { buildResponse } from '../index.mjs';

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
});

const assistant = await openai.beta.assistants.create({
    name: 'nameGacha AI',
    instructions:
        "Objective:You are required to generate nine possible names for a function or variable based on the description provided by the user. After generating these names, you will also provide a brief explanation (one or two sentences) describing the suitability or relevance of these names.Input from User: The user will provide:A brief description or definition of the function or variable.The desired naming convention (e.g., camelCase, PascalCase, snake_case).Output Requirements:Names: Suggest nine potential names that fit the user's description and specified naming convention.Explanation: Provide a general explanation (one sentence) that relates to all suggested names, explaining how they match the function or variable's purpose.",
    tools: [
        {
            type: 'code_interpreter',
        },
    ],
    model: 'gpt-4o',
});

let poolingInterval;

const createThread = async () => {
    const thread = await openai.beta.threads.create();
    return thread;
};

const addMessage = async (threadId, message) => {
    const response = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
    });
};

const runAI = async (threadId) => {
    const response = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistant.id,
    });
    return response;
};

const checkStatus = async (res, threadId, runId) => {
    const runObject = await openai.beta.threads.runs.retrieve(threadId, runId);
    const status = runObject.status;
    if (status == 'completed') {
        clearInterval(poolingInterval);

        const messageList = await openai.beta.threads.messages.list(threadId);
        const messages = messageList.body.data;

        // 마지막 메시지만 추출
        const lastMessage = messages[messages.length - 1].content;
        return buildResponse(200, lastMessage);
    }
};

export async function createThread() {}
export async function readMessages() {}
export async function sendMessage() {}
