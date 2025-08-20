# Q-A Web Application

A full-stack document chat application that allows users to upload documents (PDF, DOC, DOCX) and have AI-powered conversations about their content using Groq Playground API. Built with React, TypeScript, Node.js, and MySQL.

## 🚀 Features

- **User Authentication**: Secure login/signup with JWT tokens
- **Document Upload**: Support for PDF, DOC, and DOCX files
- **Text Extraction**: Automatic text extraction from uploaded documents
- **AI Chat Interface**: ChatGPT-like interface powered by Groq Playground API
- **Conversation Management**: Create, manage, and delete chat conversations
- **Real-time Chat**: Interactive chat interface with message history
- **Responsive Design**: Modern UI with dark/light theme support
- **File Validation**: Comprehensive file type and content validation
- **Security**: CORS protection, input validation, and secure file handling
- **Free AI Integration**: Uses Groq's free Playground API for AI responses

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context for authentication
- **Routing**: React Router DOM
- **UI Components**: Custom components with Radix UI primitives
- **Theme**: Dark/light mode support

### Backend (Node.js + Express + TypeScript)
- **Runtime**: Node.js with Express
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT with refresh tokens
- **AI Integration**: Groq Playground API for document-based conversations
- **File Processing**: PDF parsing with pdf-parse, DOC/DOCX with mammoth
- **Security**: Helmet, CORS, input validation
- **Logging**: Winston logger
- **File Upload**: Multer with validation

### Database Schema
- **Users**: Authentication and user management
- **Documents**: File metadata and extracted text content
- **Conversations**: Chat sessions
- **Messages**: Individual chat messages
- **Document Chunks**: For future RAG implementation
- **Conversation Documents**: Many-to-many relationship between conversations and documents

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm (v10.12.1 or higher)
- MySQL (v8.0 or higher)
- Git
- Groq Playground API Key (Free - Get it from [Groq Console](https://console.groq.com/))

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Q-A-Web-Application
```

### 2. Backend Setup

#### Navigate to the auth-server directory:
```bash
cd auth-server
```

#### Install dependencies:
```bash
pnpm install
```

#### Environment Configuration:
Create a `.env` file in the `auth-server` directory:
```env
# Server Configuration
PORT=8080
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Database Configuration (Development)
DEV_DB_USERNAME=your_mysql_username
DEV_DB_PASSWORD=your_mysql_password
DEV_DB_NAME=aiQaApp
DEV_DB_HOST=localhost
DEV_DB_PORT=3306

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
```

#### Database Setup:
1. Create a MySQL database:
```sql
CREATE DATABASE aiQaApp;
```

2. Run database migrations:
```bash
npx sequelize-cli db:migrate
```

#### Start the backend server:
```bash
# Development mode
pnpm run dev

# Production build
pnpm run build
pnpm start
```

### 3. Frontend Setup

#### Navigate to the client directory:
```bash
cd ../client
```

#### Install dependencies:
```bash
pnpm install
```

#### Environment Configuration:
Create a `.env` file in the `client` directory:
```env
VITE_API_BASE_URL=http://localhost:8080
```

#### Start the frontend development server:
```bash
pnpm run dev
```

## 🚀 Running the Application

1. **Start the backend server** (from `auth-server` directory):
   ```bash
   pnpm run dev
   ```
   The server will run on `http://localhost:8080`

2. **Start the frontend application** (from `client` directory):
   ```bash
   pnpm run dev
   ```
   The application will run on `http://localhost:5173`

3. **Access the application**:
   - Open your browser and navigate to `http://localhost:5173`
   - Sign up for a new account or log in with existing credentials
   - Upload documents and start chatting!

## 📁 Project Structure

```
Q-A-Web-Application/
├── auth-server/                 # Backend API server
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Route controllers
│   │   ├── middlewares/        # Express middlewares
│   │   ├── migrations/         # Database migrations
│   │   ├── models/             # Sequelize models
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic services
│   │   └── index.ts            # Server entry point
│   ├── uploads/                # File upload directory
│   └── package.json
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility libraries
│   │   └── main.tsx            # App entry point
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get specific document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/ask` - Ask question about document

### Conversations
- `GET /api/conversations` - Get user's conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get conversation details
- `DELETE /api/conversations/:id` - Delete conversation
- `POST /api/conversations/:id/messages` - Add message to conversation
- `POST /api/conversations/:id/documents` - Link documents to conversation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **File Type Validation**: Strict file type checking
- **Content Security**: Helmet.js for security headers
- **Rate Limiting**: Protection against abuse
- **SQL Injection Prevention**: Sequelize ORM with parameterized queries

## 📝 File Processing

### Supported Formats
- **PDF**: Text-based PDFs (scanned PDFs are rejected)
- **DOC**: Microsoft Word documents
- **DOCX**: Microsoft Word Open XML documents

### Processing Pipeline
1. File upload with validation
2. Text extraction using appropriate libraries
3. Content normalization and storage
4. Integration with chat system

## 🎨 UI/UX Features

- **Modern Design**: Clean, intuitive interface
- **Dark/Light Theme**: User preference support
- **Responsive Layout**: Mobile and desktop optimized
- **Real-time Feedback**: Loading states and progress indicators
- **Drag & Drop**: Easy file upload interface
- **Conversation Management**: Sidebar with chat history
- **Message Attachments**: Visual file attachment indicators

## 🧪 Development

### Backend Development
```bash
cd auth-server
pnpm run dev          # Start development server
pnpm run build        # Build for production
npx sequelize-cli db:migrate  # Run database migrations
```

### Frontend Development
```bash
cd client
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run lint         # Run ESLint
```

### Database Management
```bash
cd auth-server
npx sequelize-cli db:migrate  # Run migrations
```

## 🚀 Deployment

### Backend Deployment
1. Set up production environment variables
2. Build the application: `pnpm run build`
3. Start the production server: `pnpm start`
4. Configure reverse proxy (nginx recommended)
5. Set up SSL certificates

### Frontend Deployment
1. Build the application: `pnpm run build`
2. Deploy the `dist` folder to your web server
3. Configure environment variables for production API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

## 🔮 Future Enhancements

- **RAG Implementation**: Vector embeddings for better document search
- **Multi-language Support**: Internationalization
- **Advanced File Types**: Support for more document formats
- **Collaboration Features**: Shared conversations and documents
- **Analytics Dashboard**: Usage statistics and insights
- **API Rate Limiting**: Enhanced abuse prevention
- **WebSocket Support**: Real-time chat updates
- **Document Versioning**: Track document changes over time
- **Advanced AI Models**: Integration with more Groq models for enhanced responses
