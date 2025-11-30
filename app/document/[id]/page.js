'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Copy,
  Save,
  Trash2,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ocrText, setOcrText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDocument();
    }
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      const response = await api.get(`/ocr/document/${params.id}`);
      if (response.data.success) {
        setDocument(response.data.data.document);
        setOcrText(response.data.data.document.ocrText || '');
      }
    } catch (error) {
      toast.error('Failed to load document');
      router.push('/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.patch(`/ocr/document/${params.id}`, {
        ocrText,
      });
      if (response.data.success) {
        toast.success('Document updated successfully');
        setDocument(response.data.data.document);
      }
    } catch (error) {
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ocrText);
    toast.success('Text copied to clipboard');
  };

  const handleDownloadText = () => {
    const blob = new Blob([ocrText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.filename.split('.')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Text file downloaded');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await api.delete(`/ocr/document/${params.id}`);
      if (response.data.success) {
        toast.success('Document deleted successfully');
        router.push('/documents');
      }
    } catch (error) {
      toast.error('Failed to delete document');
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Link href="/documents">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-bold truncate">{document?.filename}</h1>
                <p className="text-muted-foreground">
                  {document && format(new Date(document.createdAt), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>

            {/* Document Info */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Document Information</CardTitle>
                    <CardDescription>OCR processing details and metadata</CardDescription>
                  </div>
                  {document && getStatusBadge(document.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Language</div>
                    <div className="font-medium">
                      {document?.language === 'eng'
                        ? 'English'
                        : document?.language === 'spa'
                        ? 'Spanish'
                        : document?.language === 'fra'
                        ? 'French'
                        : document?.language || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Characters</div>
                    <div className="font-medium">
                      {document?.characterCount?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">File Type</div>
                    <div className="font-medium">{document?.mimeType || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium">{document?.status || 'Unknown'}</div>
                  </div>
                </div>
                {document?.errorMessage && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-900 dark:text-red-100">
                      <strong>Error:</strong> {document.errorMessage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Extracted Text */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Extracted Text</CardTitle>
                    <CardDescription>
                      Edit the text below and save your changes
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      disabled={!ocrText}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadText}
                      disabled={!ocrText}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {document?.status === 'PROCESSING' ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium mb-2">Processing...</h3>
                    <p className="text-muted-foreground">
                      OCR is extracting text from your document. Please wait.
                    </p>
                  </div>
                ) : document?.status === 'FAILED' ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Processing Failed</h3>
                    <p className="text-muted-foreground">
                      {document.errorMessage || 'An error occurred during OCR processing.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      value={ocrText}
                      onChange={(e) => setOcrText(e.target.value)}
                      placeholder="Extracted text will appear here..."
                      className="min-h-[400px] font-mono text-sm"
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {ocrText.length.toLocaleString()} characters
                      </div>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete Section */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription>
                  Deleting a document is permanent and cannot be undone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Document
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the document
                        and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
