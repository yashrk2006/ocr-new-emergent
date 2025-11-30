'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  FileText,
  Zap,
  Globe,
  Clock,
  Download,
  Shield,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">OCR Platform</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Extract Text from Images
            <span className="text-primary block mt-2">Instantly with AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload images or PDFs and extract high-quality text instantly. Powered by advanced OCR
            technology with support for multiple languages.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground text-lg">Everything you need for OCR processing</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Process images in seconds with our optimized OCR engine
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Multi-Language Support</CardTitle>
              <CardDescription>
                Support for English, Spanish, French, German, and many more languages
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CheckCircle className="h-10 w-10 text-primary mb-2" />
              <CardTitle>High Accuracy</CardTitle>
              <CardDescription>
                Advanced AI models ensure 98%+ accuracy in text extraction
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Document History</CardTitle>
              <CardDescription>
                Access all your processed documents anytime, anywhere
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Download className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Multiple Export Formats</CardTitle>
              <CardDescription>
                Download as TXT, PDF, or copy to clipboard instantly
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your documents are encrypted and stored securely
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground text-lg">Choose the plan that works for you</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>For getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  10 documents/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  Basic OCR
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  English only
                </li>
              </ul>
              <Button className="w-full mt-6">Get Started</Button>
            </CardContent>
          </Card>
          <Card className="border-primary shadow-lg">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Most popular</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  500 documents/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  Advanced OCR
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  All languages
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  Priority support
                </li>
              </ul>
              <Button className="w-full mt-6">Get Started</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>For large teams</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  Unlimited documents
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  Custom OCR models
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  All languages
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  24/7 support
                </li>
              </ul>
              <Button className="w-full mt-6">Contact Sales</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl">Ready to get started?</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-lg">
              Join thousands of users extracting text from images every day
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 OCR Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
