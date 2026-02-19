import { VertexAI } from '@google-cloud/vertexai';

const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT ?? 'kat-v3',
    location: process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1',
});

export const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
});
