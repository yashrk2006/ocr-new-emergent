# OCR Platform - AI-Powered Text Extraction

A modern, full-stack OCR (Optical Character Recognition) platform built with Next.js, MongoDB, and Tesseract.js. Upload images and extract text with high accuracy, supporting multiple languages.

## 🚀 Features

### Core Features
- ✅ **AI-Powered OCR**: Extract text from images using Tesseract.js
- ✅ **Multi-Language Support**: English, Spanish, French, German, Hindi, and more
- ✅ **User Authentication**: Secure JWT-based authentication
- ✅ **Document Management**: Upload, view, edit, and delete documents
- ✅ **Real-time Processing**: Live status updates during OCR processing
- ✅ **Text Editing**: Edit extracted text directly in the browser
- ✅ **Multiple Export Options**: Download as TXT or copy to clipboard
- ✅ **Search & Filter**: Find documents by name, text, status, or language
- ✅ **Dashboard Analytics**: Track your OCR processing statistics
- ✅ **Responsive Design**: Works perfectly on mobile, tablet, and desktop

### User Features
- **Landing Page**: Beautiful hero section with features and pricing
- **Authentication**: Secure signup and login with validation
- **Dashboard**: Overview of stats and recent documents
- **Upload Interface**: Drag-and-drop file upload with language selection
- **Documents List**: Search, filter, and paginate through your documents
- **Document Details**: View, edit, and download extracted text
- **Profile Management**: Update name and change password

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Tesseract.js** - OCR engine
- **Formidable** - File upload handling

## 📦 Installation

### Prerequisites
- Node.js 18+ and yarn
- MongoDB running locally or remote connection

### Setup Steps

1. **Clone the repository**
```bash
cd /app
```

2. **Install dependencies**
```bash
yarn install
```

3. **Configure environment variables**
The `.env` file is already set up with:
```env
MONGO_URL=mongodb://localhost:27017/ocr_platform
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NEXT_PUBLIC_BASE_URL=http://localhost:3000
UPLOAD_DIR=./uploads
```

**Important**: Change `JWT_SECRET` in production!

4. **Create uploads directory**
```bash
mkdir -p uploads
```

5. **Start MongoDB**
MongoDB should already be running via supervisor. Check status:
```bash
sudo supervisorctl status mongodb
```

6. **Start the development server**
```bash
yarn dev
```

The application will be available at `http://localhost:3000`

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  passwordHash: String,
  role: 'USER' | 'ADMIN',
  createdAt: Date,
  updatedAt: Date
}
```

### Document Model
```javascript
{
  userId: ObjectId (ref: User),
  filename: String,
  originalFilePath: String,
  mimeType: String,
  language: String,
  ocrText: String,
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  errorMessage: String,
  characterCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to account
- `GET /api/auth/me` - Get current user

### OCR & Documents
- `POST /api/ocr/upload` - Upload file and process OCR
- `GET /api/ocr/documents` - List user's documents (with filters)
- `GET /api/ocr/document/:id` - Get single document
- `PATCH /api/ocr/document/:id` - Update document text
- `DELETE /api/ocr/document/:id` - Delete document

### User Profile
- `PATCH /api/profile` - Update profile name or password

### Statistics
- `GET /api/stats` - Get user's OCR statistics

## 🎨 UI Components

The platform uses shadcn/ui components:
- Button, Card, Input, Textarea
- Badge, Select, Dialog
- Alert Dialog for confirmations
- Toast notifications via Sonner

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Route Protection**: Client and server-side validation
- **User Isolation**: Users can only access their own documents
- **Input Validation**: Server-side validation for all inputs

## 📱 Responsive Design

- **Mobile-first approach**: Optimized for small screens
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-friendly**: Large buttons and interactive areas
- **Adaptive layouts**: Stacked on mobile, grid on desktop
- **Hamburger menu**: Collapsible navigation on mobile

## 🚀 Production Deployment

### Environment Variables
1. Update `JWT_SECRET` with a strong random key
2. Update `MONGO_URL` with production database URL
3. Update `NEXT_PUBLIC_BASE_URL` with your domain

### Build for Production
```bash
yarn build
yarn start
```

### Recommended Enhancements
- Add Redis for job queue (background OCR processing)
- Implement rate limiting
- Add file size limits
- Use cloud storage (S3, Cloudinary) for files
- Add email verification
- Implement 2FA
- Add OCR confidence scores
- Support PDF files (multi-page)
- Add batch upload
- Implement webhooks for processing complete

## 🧪 Testing

### Test User Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📝 Code Structure

```
/app
├── app/
│   ├── api/[[...path]]/route.js    # All API endpoints
│   ├── dashboard/page.js            # Dashboard page
│   ├── documents/page.js            # Documents list
│   ├── document/[id]/page.js        # Document details
│   ├── upload/page.js               # Upload interface
│   ├── profile/page.js              # User profile
│   ├── login/page.js                # Login page
│   ├── signup/page.js               # Signup page
│   ├── page.js                      # Landing page
│   ├── layout.js                    # Root layout
│   └── globals.css                  # Global styles
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── Navbar.jsx                   # Navigation bar
│   └── ProtectedRoute.jsx           # Auth guard
├── lib/
│   ├── mongodb.js                   # Database connection
│   ├── auth.js                      # Auth utilities
│   ├── ocrService.js                # OCR processing
│   ├── api.js                       # API client
│   └── utils.js                     # Helper functions
├── models/
│   ├── User.js                      # User schema
│   └── Document.js                  # Document schema
├── context/
│   └── AuthContext.js               # Auth state management
└── uploads/                         # Uploaded files storage
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check MongoDB status
sudo supervisorctl status mongodb

# Restart MongoDB
sudo supervisorctl restart mongodb
```

### OCR Processing Slow
- Tesseract.js can be slow for large images
- Consider resizing images before processing
- For production, use a job queue (Bull, BullMQ)

### File Upload Errors
- Check `uploads/` directory exists and is writable
- Verify file size limits in your reverse proxy
- Check file type validation in code

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using Next.js, MongoDB, and Tesseract.js
