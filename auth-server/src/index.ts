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
  .then(() => console.log('Database connected successfully!'))
  .catch(err => console.error('Database connection failed:', err));
  



// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;