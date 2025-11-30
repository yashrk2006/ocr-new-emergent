'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Search,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [search, status, language, page]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (language) params.append('language', language);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await api.get(`/ocr/documents?${params.toString()}`);
      if (response.data.success) {
        setDocuments(response.data.data.documents);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Documents</h1>
                <p className="text-muted-foreground">Manage and view all your OCR documents</p>
              </div>
              <Link href="/upload">
                <Button size="lg" className="w-full sm:w-auto">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload New
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search filename or text..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">All Status</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="FAILED">Failed</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>

                  {/* Language Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        setPage(1);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">All Languages</option>
                      <option value="eng">English</option>
                      <option value="spa">Spanish</option>
                      <option value="fra">French</option>
                      <option value="deu">German</option>
                      <option value="hin">Hindi</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Documents {pagination && `(${pagination.total})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No documents found</h3>
                    <p className="text-muted-foreground mb-4">
                      {search || status || language
                        ? 'Try adjusting your filters'
                        : 'Upload your first file to get started'}
                    </p>
                    <Link href="/upload">
                      <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <Link
                        key={doc._id}
                        href={`/document/${doc._id}`}
                        className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{doc.filename}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(doc.createdAt), 'MMM d, yyyy h:mm a')}
                              </div>
                              {doc.characterCount > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {doc.characterCount} characters extracted
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getStatusBadge(doc.status)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
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
