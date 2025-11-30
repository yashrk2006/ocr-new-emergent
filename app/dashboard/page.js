'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, docsRes] = await Promise.all([
        api.get('/stats'),
        api.get('/ocr/documents?limit=5'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (docsRes.data.success) {
        setRecentDocuments(docsRes.data.data.documents);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here's your OCR overview.</p>
              </div>
              <Link href="/upload">
                <Button size="lg" className="w-full sm:w-auto">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload New File
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-muted rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.completedDocuments || 0}</div>
                    <p className="text-xs text-muted-foreground">Successfully processed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.failedDocuments || 0}</div>
                    <p className="text-xs text-muted-foreground">Need attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Last Processed</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.lastProcessed
                        ? format(new Date(stats.lastProcessed), 'MMM d')
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.lastProcessed
                        ? format(new Date(stats.lastProcessed), 'yyyy')
                        : 'No documents yet'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Documents */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Documents</CardTitle>
                    <CardDescription>Your latest OCR processed files</CardDescription>
                  </div>
                  <Link href="/documents">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between animate-pulse">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                    <p className="text-muted-foreground mb-4">Upload your first file to get started</p>
                    <Link href="/upload">
                      <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentDocuments.map((doc) => (
                      <Link
                        key={doc._id}
                        href={`/document/${doc._id}`}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{doc.filename}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(doc.createdAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.status)}
                        </div>
                      </Link>
                    ))}
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
