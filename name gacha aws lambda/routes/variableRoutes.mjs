import { pool, buildResponse } from '../index.mjs';

export async function getVariable(variableId) {
    try {
        const query = 'SELECT * FROM public.variables WHERE "variableId" = $1';
        const { rows } = await pool.query(query, [variableId]);
        return buildResponse(200, rows);
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

export async function getVariables() {
    try {
        const query = 'SELECT * FROM public.variables';
        const { rows } = await pool.query(query);
        return buildResponse(200, rows);
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

export async function updateVariable(variableId, variableExp, variableName) {
    try {
        const query =
            'UPDATE public.variables SET "variableName" = $1, "variableExp" = $2 WHERE "variableId" = $3 RETURNING *';
        const values = [variableName, variableExp, variableId];
        const result = await pool.query(query, values);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to update variable: ' + err.message);
    }
}

export async function deleteVariable(variableId) {
    try {
        const query =
            'DELETE FROM public.variables WHERE "variableId" = $1 RETURNING *;';
        const result = await pool.query(query, [variableId]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to delete variable: ' + err.message);
    }
}

export async function deleteVariablesInPage(pageId) {
    try {
        const query =
            'DELETE FROM public.variables WHERE "pageId_frk" = $1 RETURNING *;';
        const result = await pool.query(query, [pageId]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to delete function: ' + err.message);
    }
}

export async function createVariable(variableName, variableExp, pageId) {
    try {
        const query =
            'INSERT INTO public.variables ("variableName","variableExp","pageId_frk") VALUES ($1,$2,$3) RETURNING *;';
        const result = await pool.query(query, [
            variableName,
            variableExp,
            pageId,
        ]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to create variable: ' + err.message);
    }
}
