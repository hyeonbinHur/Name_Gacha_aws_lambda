import { pool, buildResponse } from '../index.mjs';

export async function getFunction(functionId) {
    try {
        const query = 'SELECT * FROM public.functions WHERE "functionId" = $1';
        const { rows } = await pool.query(query, [functionId]);
        return buildResponse(200, rows);
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

export async function getFunctions() {
    try {
        const query = 'SELECT * FROM public.functions';
        const { rows } = await pool.query(query);
        return buildResponse(200, rows);
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

export async function updateFunction(functionId, functionExp, functionName) {
    try {
        const query =
            'UPDATE public.functions SET "functionName" = $1, "functionExp" = $2 WHERE "functionId" = $3 RETURNING *';
        const values = [functionName, functionExp, functionId];
        const result = await pool.query(query, values);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to update function: ' + err.message);
    }
}

export async function deleteFunction(functionId) {
    try {
        const query =
            'DELETE FROM public.functions WHERE "functionId" = $1 RETURNING *;';
        const result = await pool.query(query, [functionId]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to delete function: ' + err.message);
    }
}

export async function deleteFunctionsInPage(pageId) {
    try {
        const query =
            'DELETE FROM public.functions WHERE "pageId_frk" = $1 RETURNING *;';
        const result = await pool.query(query, [pageId]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to delete function: ' + err.message);
    }
}

export async function createFunction(functionName, functionExp, pageId) {
    try {
        const query =
            'INSERT INTO public.functions ("functionName","functionExp","pageId_frk") VALUES ($1,$2,$3) RETURNING *;';
        const result = await pool.query(query, [
            functionName,
            functionExp,
            pageId,
        ]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to create function: ' + err.message);
    }
}
