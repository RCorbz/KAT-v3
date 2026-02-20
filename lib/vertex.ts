import { VertexAI } from '@google-cloud/vertexai';

// Lazily initialize to bypass static build crashes when credentials are not present
export const model = new Proxy({} as any, {
    get: (target, prop) => {
        const vertexAI = new VertexAI({
            project: process.env.GOOGLE_CLOUD_PROJECT || 'kat-v3',
            location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
        });
        const generativeModel: any = vertexAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
        });
        return typeof generativeModel[prop] === 'function'
            ? generativeModel[prop].bind(generativeModel)
            : generativeModel[prop];
    }
});
