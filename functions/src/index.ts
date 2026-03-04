import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import { mountHiyveRoutes, loadHiyveConfig } from '@hiyve/admin';

admin.initializeApp();

const app = express();
app.use(express.json());

const apiRouter = express.Router();
mountHiyveRoutes(apiRouter, loadHiyveConfig());
app.use('/api', apiRouter);

export const api = functions.https.onRequest(app);
