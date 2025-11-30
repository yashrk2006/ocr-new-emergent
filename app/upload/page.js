'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, X, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('eng');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'hin', name: 'Hindi' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Please upload a valid image file (PNG, JPG, JPEG, or WebP)');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(droppedFile.type)) {
        toast.error('Please upload a valid image file (PNG, JPG, JPEG, or WebP)');
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setProcessing(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      const response = await api.post('/ocr/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const docId = response.data.data.documentId;
        setDocumentId(docId);
        toast.success('File uploaded successfully!');
        setUploading(false);
        setProcessing(true);

        // Poll for completion
        pollDocumentStatus(docId);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
      setUploading(false);
    }
  };

  const pollDocumentStatus = async (docId) => {
    const maxAttempts = 30;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await api.get(`/ocr/document/${docId}`);
        if (response.data.success) {
          const status = response.data.data.document.status;

          if (status === 'COMPLETED') {
            clearInterval(interval);
            setProcessing(false);
            toast.success('OCR processing completed!');
            setTimeout(() => {
              router.push(`/document/${docId}`);
            }, 1000);
          } else if (status === 'FAILED') {
            clearInterval(interval);
            setProcessing(false);
            toast.error('OCR processing failed');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setProcessing(false);
        toast.info('Processing is taking longer than expected. Check documents page.');
      }
    }, 2000);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Upload File for OCR</h1>
              <p className="text-muted-foreground">Upload an image to extract text using OCR</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Select File</CardTitle>
                <CardDescription>
                  Supported formats: PNG, JPG, JPEG, WebP (Max 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag and Drop Zone */}
                {!file ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Drag and drop your file here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                    <Button type="button">
                      <FileText className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      disabled={uploading || processing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Language Selection */}
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">
                    Select Language
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={uploading || processing}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload Button */}
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading || processing}
                  className="w-full"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing OCR...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Upload and Process
                    </>
                  )}
                </Button>

                {/* Processing Status */}
                {processing && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          Processing your document...
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          This may take a few moments. Please wait.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
