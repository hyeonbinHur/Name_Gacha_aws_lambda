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

export async function updateVariable(variableId, variableName) {
    try {
        const query =
            'UPDATE public.variables SET "variableName" = $1 WHERE "variableId" = $2 RETURNING *';
        const values = [variableName, variableId];
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

export async function createVariable(variableName, pageId) {
    try {
        const query =
            'INSERT INTO public.variables ("variableName","pageId_frk") VALUES ($1,$2) RETURNING *;';
        const result = await pool.query(query, [variableName, pageId]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to create variable: ' + err.message);
    }
}
