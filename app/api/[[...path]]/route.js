import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Document from '@/models/Document';
import { generateToken, getUserFromToken, getTokenFromRequest } from '@/lib/auth';
import { processImage, isValidImageFile } from '@/lib/ocrService';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Helper to parse form data in Next.js API routes
async function parseForm(request) {
  const contentType = request.headers.get('content-type') || '';
  
  if (!contentType.includes('multipart/form-data')) {
    const body = await request.json();
    return { fields: body, files: {} };
  }
  
  // For file uploads, we need to handle differently
  const formData = await request.formData();
  const fields = {};
  const files = {};
  
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files[key] = value;
    } else {
      fields[key] = value;
    }
  }
  
  return { fields, files };
}

// Helper to save uploaded file
async function saveUploadedFile(file) {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const ext = path.extname(file.name);
  const filename = `${uuidv4()}${ext}`;
  const filepath = path.join(uploadDir, filename);
  
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
  
  return { filepath, filename };
}

// POST /api/auth/signup
async function handleSignup(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;
    
    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Create user
    const user = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user._id.toString());
    
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}

// POST /api/auth/login
async function handleLogin(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Generate token
    const token = generateToken(user._id.toString());
    
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

// GET /api/auth/me
async function handleGetMe(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// POST /api/ocr/upload
async function handleOcrUpload(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { fields, files } = await parseForm(request);
    const file = files.file;
    const language = fields.language || 'eng';
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!isValidImageFile(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are supported.' },
        { status: 400 }
      );
    }
    
    // Save file
    const { filepath, filename } = await saveUploadedFile(file);
    
    // Create document record
    const document = new Document({
      userId: user._id,
      filename: file.name,
      originalFilePath: filepath,
      mimeType: file.type,
      language: language,
      status: 'PROCESSING',
    });
    
    await document.save();
    
    // Process OCR in background (for production, use a queue)
    setTimeout(async () => {
      try {
        const result = await processImage(filepath, language);
        document.ocrText = result.text;
        document.characterCount = result.text.length;
        document.status = 'COMPLETED';
        await document.save();
      } catch (error) {
        console.error('OCR processing error:', error);
        document.status = 'FAILED';
        document.errorMessage = error.message;
        await document.save();
      }
    }, 100);
    
    return NextResponse.json({
      success: true,
      data: {
        documentId: document._id,
        status: document.status,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}

// GET /api/ocr/documents
async function handleGetDocuments(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const language = searchParams.get('language') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const query = { userId: user._id };
    
    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { ocrText: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (language) {
      query.language = language;
    }
    
    const skip = (page - 1) * limit;
    
    const [documents, total] = await Promise.all([
      Document.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Document.countDocuments(query),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}

// GET /api/ocr/document/:id
async function handleGetDocument(request, id) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const document = await Document.findOne({
      _id: id,
      userId: user._id,
    });
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { document },
    });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get document' },
      { status: 500 }
    );
  }
}

// PATCH /api/ocr/document/:id
async function handleUpdateDocument(request, id) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const body = await request.json();
    const { ocrText } = body;
    
    const document = await Document.findOne({
      _id: id,
      userId: user._id,
    });
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    if (ocrText !== undefined) {
      document.ocrText = ocrText;
      document.characterCount = ocrText.length;
    }
    
    await document.save();
    
    return NextResponse.json({
      success: true,
      data: { document },
    });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/ocr/document/:id
async function handleDeleteDocument(request, id) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const document = await Document.findOne({
      _id: id,
      userId: user._id,
    });
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Delete file
    if (fs.existsSync(document.originalFilePath)) {
      fs.unlinkSync(document.originalFilePath);
    }
    
    // Delete document
    await Document.deleteOne({ _id: id });
    
    return NextResponse.json({
      success: true,
      data: { message: 'Document deleted successfully' },
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// GET /api/stats
async function handleGetStats(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const [totalDocuments, completedDocuments, failedDocuments, lastDocument] = await Promise.all([
      Document.countDocuments({ userId: user._id }),
      Document.countDocuments({ userId: user._id, status: 'COMPLETED' }),
      Document.countDocuments({ userId: user._id, status: 'FAILED' }),
      Document.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean(),
    ]);
    
    // Get language distribution
    const languageStats = await Document.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        totalDocuments,
        completedDocuments,
        failedDocuments,
        lastProcessed: lastDocument?.createdAt || null,
        languageStats,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}

// PATCH /api/profile
async function handleUpdateProfile(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    const body = await request.json();
    const { name, oldPassword, newPassword } = body;
    
    const dbUser = await User.findById(user._id);
    
    if (name) {
      dbUser.name = name;
    }
    
    if (oldPassword && newPassword) {
      const isMatch = await dbUser.comparePassword(oldPassword);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      dbUser.passwordHash = newPassword;
    }
    
    await dbUser.save();
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: dbUser._id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// Main router
export async function GET(request, { params }) {
  const path = params?.path || [];
  const route = '/' + path.join('/');
  
  if (route === '/auth/me') {
    return handleGetMe(request);
  } else if (route === '/ocr/documents') {
    return handleGetDocuments(request);
  } else if (route.startsWith('/ocr/document/')) {
    const id = path[2];
    return handleGetDocument(request, id);
  } else if (route === '/stats') {
    return handleGetStats(request);
  }
  
  return NextResponse.json(
    { success: false, error: 'Not found' },
    { status: 404 }
  );
}

export async function POST(request, { params }) {
  const path = params?.path || [];
  const route = '/' + path.join('/');
  
  if (route === '/auth/signup') {
    return handleSignup(request);
  } else if (route === '/auth/login') {
    return handleLogin(request);
  } else if (route === '/ocr/upload') {
    return handleOcrUpload(request);
  }
  
  return NextResponse.json(
    { success: false, error: 'Not found' },
    { status: 404 }
  );
}

export async function PATCH(request, { params }) {
  const path = params?.path || [];
  const route = '/' + path.join('/');
  
  if (route.startsWith('/ocr/document/')) {
    const id = path[2];
    return handleUpdateDocument(request, id);
  } else if (route === '/profile') {
    return handleUpdateProfile(request);
  }
  
  return NextResponse.json(
    { success: false, error: 'Not found' },
    { status: 404 }
  );
}

export async function DELETE(request, { params }) {
  const path = params?.path || [];
  const route = '/' + path.join('/');
  
  if (route.startsWith('/ocr/document/')) {
    const id = path[2];
    return handleDeleteDocument(request, id);
  }
  
  return NextResponse.json(
    { success: false, error: 'Not found' },
    { status: 404 }
  );
}
