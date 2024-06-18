import { pool, buildResponse } from '../index.mjs';

export async function getProject(projectId) {
    try {
        // const query = 'SELECT * FROM public.projects WHERE "projectId" = $1';

        const query = `
                    SELECT 
                    p."projectId", p."projectName", 
                    pa."pageId", pa."pageName", 
                    v."variableId", v."variableName", 
                    f."functionId", f."functionName"
                    FROM 
                    projects p
                    LEFT JOIN 
                    pages pa ON p."projectId" = pa."projectId_frk"
                    LEFT JOIN 
                    variables v ON pa."pageId" = v."pageId_frk"
                    LEFT JOIN 
                    functions f ON pa."pageId" = f."pageId_frk"
                    WHERE 
                    p."projectId" = $1;
                    `;
        const { rows } = await pool.query(query, [projectId]);
        const data = {
            projectId: rows[0].projectId,
            projectName: rows[0].projectName,
            pages: [],
        };
        rows.forEach((row) => {
            let page = data.pages.find((p) => p.pageId === row.pageId);
            if (!page) {
                page = {
                    pageId: row.pageId,
                    pageName: row.pageName,
                    variables: [],
                    functions: [],
                };
                data.pages.push(page);
            }
            if (
                row.variableId &&
                !page.variables.find((v) => v.variableId === row.variableId)
            ) {
                page.variables.push({
                    variableId: row.variableId,
                    variableName: row.variableName,
                });
            }
            if (
                row.functionId &&
                !page.functions.find((f) => f.functionId === row.functionId)
            ) {
                page.functions.push({
                    functionId: row.functionId,
                    functionName: row.functionName,
                });
            }
        });

        return buildResponse(200, data);
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

function formattingProject(rows) {
    const projects = {};
    rows.forEach((row) => {
        if (!projects[row.projectId]) {
            projects[row.projectId] = {
                projectId: row.projectId,
                projectName: row.projectName,
                pages: [],
            };
        }
        let project = projects[row.projectId];
        let page = project.pages.find((p) => p.pageId === row.pageId);
        if (!page && row.pageId) {
            page = {
                pageId: row.pageId,
                pageName: row.pageName,
                variables: [],
                functions: [],
            };
            project.pages.push(page);
        }

        if (page) {
            if (
                row.variableId &&
                !page.variables.find((v) => v.variableId === row.variableId)
            ) {
                page.variables.push({
                    variableId: row.variableId,
                    variableName: row.variableName,
                });
            }

            if (
                row.functionId &&
                !page.functions.find((f) => f.functionId === row.functionId)
            ) {
                page.functions.push({
                    functionId: row.functionId,
                    functionName: row.functionName,
                });
            }
        }
    });

    return projects;
}

export async function getProjects() {
    try {
        const query = `
                    SELECT 
                    p."projectId", p."projectName", 
                    pa."pageId", pa."pageName", 
                    v."variableId", v."variableName", 
                    f."functionId", f."functionName"
                    FROM 
                    projects p
                    LEFT JOIN 
                    pages pa ON p."projectId" = pa."projectId_frk"
                    LEFT JOIN 
                    variables v ON pa."pageId" = v."pageId_frk"
                    LEFT JOIN 
                    functions f ON pa."pageId" = f."pageId_frk"
                    ORDER BY p."projectId", pa."pageId", v."variableId", f."functionId"
                    `;
        const { rows } = await pool.query(query);
        const projects = formattingProject(rows);

        return buildResponse(200, Object.values(projects));
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

export async function getCertainProjects(uuid) {
    try {
        const query = `
            SELECT 
                p."projectId", p."projectName", 
                pa."pageId", pa."pageName", 
                v."variableId", v."variableName", 
                f."functionId", f."functionName"
            FROM 
                projects p
            LEFT JOIN 
                pages pa ON p."projectId" = pa."projectId_frk"
            LEFT JOIN 
                variables v ON pa."pageId" = v."pageId_frk"
            LEFT JOIN 
                functions f ON pa."pageId" = f."pageId_frk"
            WHERE 
                p."userId_frk" = $1 
            ORDER BY 
                p."projectId", pa."pageId", v."variableId", f."functionId"
        `;

        const { rows } = await pool.query(query, [uuid]);
        const projects = formattingProject(rows);
        return buildResponse(200, Object.values(projects));
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

export async function updateProject(projectId, projectName) {
    try {
        const query =
            'UPDATE public.projects SET "projectName" = $1 WHERE "projectId" = $2 RETURNING *';
        const values = [projectName, projectId];
        const result = await pool.query(query, values);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to update project: ' + err.message);
    }
}

export async function deleteProject(projectId) {
    try {
        const query =
            'DELETE FROM public.projects WHERE "projectId" = $1 RETURNING *;';
        const result = await pool.query(query, [projectId]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to delete project: ' + err.message);
    }
}

export async function createProject(projectName, uuid) {
    try {
        const query =
            'INSERT INTO public.projects ("projectName", "userId_frk") VALUES ($1, $2) RETURNING *;';
        const result = await pool.query(query, [projectName, uuid]);
        return buildResponse(200, result.rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to create project: ' + err.message);
    }
}
