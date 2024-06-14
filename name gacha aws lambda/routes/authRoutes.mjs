import { pool, buildResponse } from '../index.mjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// find user(userId)
const findUser = (userId) => {
    return new Promise((resolve, reject) => {
        pool.query(
            'SELECT * FROM public.user WHERE "userId" = $1',
            [userId],
            (err, queryRes) => {
                if (err) {
                    console.error(err);
                    reject('Failed to retrieve data');
                } else {
                    if (queryRes.rows.length > 0) {
                        resolve(queryRes.rows);
                    } else {
                        resolve('Not existing ID');
                    }
                }
            }
        );
    });
};

const buildCookieResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        multiValueHeaders: {
            'Access-Control-Allow-Origin': ['http://localhost:5173'],
            'Access-Control-Allow-Methods': ['POST, GET, PUT, DELETE'],
            'Access-Control-Allow-Credentials': ['true'],
        },
    };
};

//sign up (post)
export async function signUpUser(userId, userPassword) {
    try {
        const checkUser = await findUser(userId);

        if (checkUser == 'Not existing ID') {
            const inputPassword = userPassword;
            const salt = crypto.randomBytes(128).toString('base64');
            const hashPassword = crypto
                .createHash('sha512')
                .update(inputPassword + salt)
                .digest('hex');
            const query =
                'INSERT INTO public.user ("userId", "userPassword", "salt") VALUES ($1,$2,$3) RETURNING *';
            const values = [userId, hashPassword, salt];
            const result = await pool.query(query, values);
            return buildResponse(200, result.rows[0]);
        } else {
            return buildResponse(500, 'User already existing');
        }
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}
export async function optionsHandler(event) {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE',
            'Access-Control-Allow-Headers':
                'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify(''),
    };
}

//sign in (post) -> return uuid, issue access & refresh token
export async function signInUser(userId, userPassword) {
    try {
        const query = 'SELECT * FROM public.user WHERE "userId" = $1';
        const { rows } = await pool.query(query, [userId]);
        if (rows.length === 0) {
            return buildResponse(404, 'User not found');
        }
        const user = rows[0];
        const salt = user.salt;
        const hashPassword = crypto
            .createHash('sha512')
            .update(userPassword + salt)
            .digest('hex');

        if (hashPassword !== user.userPassword) {
            return buildResponse(401, 'Invalid password');
        } else {
            const accessToken = jwt.sign(
                { uuid: user.uuid },
                process.env.ACCESS_SECRET,
                { expiresIn: '1m', issuer: 'uncle.hb' }
            );
            const refreshToken = jwt.sign(
                { uuid: user.uuid },
                process.env.REFRESH_SECRET,
                { expiresIn: '24h', issuer: 'uncle.hb' }
            );

            return {
                statusCode: 200,
                body: JSON.stringify('Login successful'),
                multiValueHeaders: {
                    'Access-Control-Allow-Origin': ['http://localhost:5173'],
                    'Access-Control-Allow-Methods': ['POST, GET, PUT, DELETE'],
                    'Access-Control-Allow-Credentials': ['true'],
                    'Set-Cookie': [
                        `accessToken=${accessToken}; HttpOnly; Path=/; Max-Age=60; SameSite=None; Secure`,
                        `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=None; Secure`,
                    ],
                },
            };
        }
    } catch (err) {
        return {
            statusCode: 501,
            body: JSON.stringify(err.message),
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE',
                'Access-Control-Allow-Credentials': 'true',
            },
        };
    }
}

//sign out (post) -> remove access token, refresh token

export async function signOutUser() {
    try {
        return {
            statusCode: 200,
            body: JSON.stringify('sign out successful'),
            multiValueHeaders: {
                'Access-Control-Allow-Origin': ['http://localhost:5173'],
                'Access-Control-Allow-Methods': ['POST, GET, PUT, DELETE'],
                'Access-Control-Allow-Credentials': ['true'],
                'Set-Cookie': [
                    `accessToken=' '; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure`,
                    `refreshToken=' '; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure`,
                ],
            },
        };
    } catch (err) {
        return buildCookieResponse(
            500,
            'Failed to retrieve data: ' + err.message
        );
    }
}
//check access token (post) // check login status
export async function accessToken(cookies) {
    const accessToken = cookies['accessToken'];
    console.log('access Token : ' + accessToken);
    if (!accessToken) {
        return buildCookieResponse(401, 'Access token missing');
    } else {
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET);
            return {
                statusCode: 200,
                body: JSON.stringify(decoded),
                headers: {
                    'Access-Control-Allow-Origin': 'http://localhost:5173', // 또는 특정 도메인
                    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE',
                    'Access-Control-Allow-Credentials': 'true',
                },
            };
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                return buildCookieResponse(401, 'Access token expired');
            } else if (err instanceof jwt.JsonWebTokenError) {
                return buildCookieResponse(401, 'Invalid access token');
            } else {
                return buildCookieResponse(500, 'Internal Server Error');
            }
        }
    }
}

//check refresh token & reissue access token (post) // check login status 2
export async function refreshToken(cookies) {
    const refreshToken = cookies['refreshToken'];
    if (!refreshToken) {
        return buildCookieResponse(401, 'Refresh token missing');
    } else {
        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_SECRET
            );
            const accessToken = jwt.sign(
                { uuid: decoded.uuid },
                process.env.ACCESS_SECRET,
                { expiresIn: '24h', issuer: 'uncle.hb' }
            );
            return {
                statusCode: 200,
                body: JSON.stringify(decoded),
                multiValueHeaders: {
                    'Access-Control-Allow-Origin': ['http://localhost:5173'],
                    'Access-Control-Allow-Methods': ['POST, GET, PUT, DELETE'],
                    'Access-Control-Allow-Credentials': ['true'],
                    'Set-Cookie': [
                        `accessToken=${accessToken}; HttpOnly; Path=/; Max-Age=60; SameSite=None; Secure`,
                    ],
                },
            };
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                return buildCookieResponse(401, 'Refresh token expired');
            } else if (err instanceof jwt.JsonWebTokenError) {
                return buildCookieResponse(401, 'Invalud refresh token');
            } else {
                return buildCookieResponse(500, 'Internal Server Error');
            }
        }
    }
}

export async function updateUser(userId, userOldPassword, userNewPassword) {
    try {
        const query = 'SELECT * FROM public.user WHERE "userId" = $1';
        const { rows } = await pool.query(query, [userId]);
        if (rows.length === 0) {
            return buildResponse(404, 'User not found');
        }
        const user = rows[0];
        const salt = user.salt;
        const hashPassword = crypto
            .createHash('sha512')
            .update(userOldPassword + salt)
            .digest('hex');

        if (hashPassword !== user.userPassword) {
            return buildResponse(401, 'Invalid password');
        } else {
            const newSalt = crypto.randomBytes(128).toString('base64');
            const newHashPassword = crypto
                .createHash('sha512')
                .update(userNewPassword + salt)
                .digest('hex');

            const query =
                'UPDATE public.user SET "userPassword" = $1, "salt" = $2 WHERE "userId" = $3 RETURNING *';
            const values = [newHashPassword, newSalt, userId];
            const result = await pool.query(query, values);
            return buildResponse(200, result.rows[0]);
        }
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}

export async function getUser(uuid) {
    try {
        const query = 'SELECT * FROM public.user WHERE "uuid" = $1';
        const { rows } = await pool.query(query, [uuid]);
        return buildResponse(200, rows[0]);
    } catch (err) {
        return buildResponse(500, 'Failed to retrieve data: ' + err.message);
    }
}
//update user (password) (put) // update user pasword only
