import { VertexAI } from '@google-cloud/vertexai';

// Lazily initialize to bypass static build crashes when credentials are not present
export const model = new Proxy({} as any, {
    get: (target, prop) => {
        const project = process.env.GOOGLE_CLOUD_PROJECT || 'kat-v3';
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

        const vertexAI = new VertexAI({
            project,
            location,
            googleAuthOptions: (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) ? {
                credentials: {
                    client_email: process.env.GOOGLE_CLIENT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }
            } : undefined
        });
        const generativeModel: any = vertexAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
        });
        return typeof generativeModel[prop] === 'function'
            ? generativeModel[prop].bind(generativeModel)
            : generativeModel[prop];
    }
});
