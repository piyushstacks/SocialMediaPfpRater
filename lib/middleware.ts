// lib/middleware.ts

import * as nc from 'next-connect';
import cors from 'cors';

const middleware = nc.nextConnect();

middleware.use(cors({
  origin: '*', // Adjust according to your needs
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

export default middleware;
