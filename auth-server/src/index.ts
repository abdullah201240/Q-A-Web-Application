import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import hpp from 'hpp';
import db from './config/sequelize'; // Adjust path
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer } from 'http';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import Routes from './routes/index.routes';
import morgan from 'morgan';
import logger from './config/logger';
dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '8080', 10);
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(hpp());
app.use(compression());
app.use(cookieParser());
// HTTP request logging
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
    skip: () => process.env.NODE_ENV === 'test',
  })
);

// CORS configuration
app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      methods: 'GET,POST,PUT,DELETE,PATCH',
      credentials: true,
    })
  );

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Auth server is up');
});
app.use('/api', Routes);

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);
const server = createServer(app);
// Connect to database
db.authenticate()
  .then(() => logger.info('Database connected successfully!'))
  .catch(err => logger.error('Database connection failed', { error: err }));
  



// Start server
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});

// Global process-level logging for crashes
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: { message: error.message, stack: error.stack } });
});

export default app;