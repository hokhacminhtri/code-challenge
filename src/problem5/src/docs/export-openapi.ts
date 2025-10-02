import { writeFileSync } from 'fs';
import path from 'path';
import openApiSpec from './openapi';

const outPath = path.join(process.cwd(), 'openapi.json');
writeFileSync(outPath, JSON.stringify(openApiSpec, null, 2));
// eslint-disable-next-line no-console
console.log('OpenAPI spec written to', outPath);
