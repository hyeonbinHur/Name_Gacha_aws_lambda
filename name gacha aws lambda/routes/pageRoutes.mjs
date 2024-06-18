import { pool, buildResponse } from '../index.mjs';

export async function getPage(pageId) {
    try {
        const query = `
        SELECT 
        pa."pageId", pa."pageName", 
        v."variableId", v."variableName", 
        f."functionId", f."functionName"
        FROM 
        pages pa 
        LEFT JOIN 
        variables v ON pa."pageId" = v."pageId_frk"
        LEFT JOIN 
        functions f ON pa."pageId" = f."pageId_frk"
        WHERE 
        pa."pageId" = $1;
        `;
        const { rows } = await pool.query(query, [pageId]);
        const data = {
            pageId: rows[0].pageId,
            pageExp: rows[0].pageExp,
            pageName: rows[0].pageName,
            variables: [],
            functions: [],
        };
        rows.forEach((row) => {
            if (
                row.variableId &&
                !data.variables.some((v) => v.variableId === row.variableId)
            ) {
                data.variables.push({
                    variableId: row.variableId,
                    variableName: row.variableName,
                    variableExp: row.variableExp,
                });
            }
            if (
                row.functionId &&
                !data.functions.some((f) => f.functionId === row.functionId)
            ) {
                data.functions.push({
                    functionId: row.functionId,
                    functionName: row.functionName,
                    functionExp: row.functionExp,
                });
            }
        });

        return buildResponse(200, data);
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

export async function getPages() {
    try {
        const query = 'SELECT * FROM public.pages';
        const { rows } = await pool.query(query);
        return buildResponse(200, rows);
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

// export async function getCertainPages(projectId) {
//     try {
//         const query 'SELECT * FROM public.pages'
//     } catch (err) {
//         return buildResponse(500, 'Failed to retrieve data: ' + err.message);
//     }
// }

export async function updatePage(pageId, pageName) {
    try {
        const query =
            'UPDATE public.pages SET "pageName" = $1 WHERE "pageId" = $2 RETURNING *';
        const values = [pageName, pageId];
        const result = await pool.query(query, values);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to update page: ' + err.message);
    }
}

export async function deletePage(pageId) {
    try {
        const query =
            'DELETE FROM public.pages WHERE "pageId" = $1 RETURNING *;';
        const result = await pool.query(query, [pageId]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to delete page: ' + err.message);
    }
}

export async function createPage(pageName, projectId) {
    try {
        const query =
            'INSERT INTO public.pages ("pageName", "projectId_frk") VALUES ($1,$2) RETURNING *;';
        const result = await pool.query(query, [pageName, projectId]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to create page: ' + err.message);
    }
}
