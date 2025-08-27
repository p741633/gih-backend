import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import yml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = fs.readFileSync(
  path.resolve(__dirname, '../swagger.yaml'),
  'utf8',
);
const swaggerDocument = yml.parse(file);

const swaggerServe = swaggerUi.serve;
const swaggerSetup = swaggerUi.setup(swaggerDocument);

export { swaggerServe, swaggerSetup };
