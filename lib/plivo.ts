import plivo from 'plivo';

export const plivoClient = new plivo.Client(
    process.env.PLIVO_AUTH_ID,
    process.env.PLIVO_AUTH_TOKEN
);
