import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle, Calendar, MapPin, Zap, FileText, Eye, Hash, User, Clock, FlaskConical } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Certificate } from "@shared/schema";

export default function ProducerCertificates() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'producer')) {
      setLocation('/login');
    }
  }, [isAuthenticated, user, setLocation, isLoading]);

  const { data: certificates = [], isLoading: certificatesLoading } = useQuery({
    queryKey: ['/api/certificates', wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => api.certificates.getByProducer(wallet!.address)
  });

  if (!isAuthenticated || user?.role !== 'producer') {
    return null;
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'valid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const totalHydrogen = certificates.reduce((sum: number, cert: Certificate) => sum + cert.hydrogenKg, 0);
  const validCertificates = certificates.filter((cert: Certificate) => cert.status === 'valid');

  return (
    <div className="min-h-screen bg-background role-producer">
      <Navigation role="producer" currentSection="certificates" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="certificates-title">
            Production Certificates
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="certificates-subtitle">
            View and manage your green hydrogen production certificates
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="certificate-summary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Certificates</p>
                  <p className="text-2xl font-bold text-foreground">{certificates.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="hydrogen-summary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total H₂ Certified</p>
                  <p className="text-2xl font-bold text-foreground">{totalHydrogen} kg</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="valid-summary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valid Certificates</p>
                  <p className="text-2xl font-bold text-foreground">{validCertificates.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificates List */}
        <Card data-testid="certificates-list">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Certificate Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificatesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading certificates...
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-certificates">
                No certificates found. Start by recording a production batch.
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.map((certificate: Certificate) => (
                  <Card key={certificate.id} className="border border-border" data-testid={`certificate-${certificate.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              Certificate #{certificate.certificateId}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Certified by {certificate.certifierName}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(certificate.status!)}>
                          {certificate.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Hydrogen Amount</p>
                            <p className="text-sm font-medium text-foreground">
                              {certificate.hydrogenKg} kg
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Energy Source</p>
                            <p className="text-sm font-medium text-foreground">
                              {certificate.energySource}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="text-sm font-medium text-foreground">
                              {certificate.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Production Date</p>
                            <p className="text-sm font-medium text-foreground">
                              {formatDate(certificate.productionDate)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Issued: {formatDate(certificate.issueDate!)}
                            </span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" data-testid={`view-certificate-${certificate.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Report
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center text-xl">
                                  <Award className="w-6 h-6 mr-2 text-primary" />
                                  Certificate #{certificate.certificateId}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Certificate Status */}
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold text-foreground">Certificate Status</h3>
                                  <Badge className={getStatusColor(certificate.status!)}>
                                    {certificate.status?.toUpperCase()}
                                  </Badge>
                                </div>

                                <Separator />

                                {/* Production Details */}
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground mb-4">Production Details</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                      <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                                            <FlaskConical className="w-5 h-5" />
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Hydrogen Amount</p>
                                            <p className="text-xl font-bold text-foreground">{certificate.hydrogenKg} kg</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                                            <Zap className="w-5 h-5" />
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Energy Source</p>
                                            <p className="text-lg font-semibold text-foreground">{certificate.energySource}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center">
                                            <MapPin className="w-5 h-5" />
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Location</p>
                                            <p className="text-lg font-semibold text-foreground">{certificate.location}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center">
                                            <Calendar className="w-5 h-5" />
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Production Date</p>
                                            <p className="text-lg font-semibold text-foreground">{formatDate(certificate.productionDate)}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>

                                <Separator />

                                {/* Certification Details */}
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground mb-4">Certification Details</h3>
                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                                      <User className="w-5 h-5 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Certifying Authority</p>
                                        <p className="font-semibold text-foreground">{certificate.certifierName}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                                      <Clock className="w-5 h-5 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Issue Date</p>
                                        <p className="font-semibold text-foreground">{formatDate(certificate.issueDate!)}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                                      <Hash className="w-5 h-5 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Digital Signature</p>
                                        <p className="font-mono text-sm text-foreground break-all">
                                          {certificate.signature ? `${certificate.signature.substring(0, 20)}...${certificate.signature.substring(certificate.signature.length - 20)}` : 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Environmental Impact */}
                                <Separator />
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground mb-4">Environmental Impact</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                      <CardContent className="p-4">
                                        <div className="text-center">
                                          <p className="text-sm text-green-600 dark:text-green-400">CO₂ Emissions Avoided</p>
                                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {(certificate.hydrogenKg * 10.4).toFixed(1)} kg
                                          </p>
                                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            vs. gray hydrogen
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                      <CardContent className="p-4">
                                        <div className="text-center">
                                          <p className="text-sm text-blue-600 dark:text-blue-400">Credits Generated</p>
                                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                            {certificate.hydrogenKg} GHC
                                          </p>
                                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            1 kg H₂ = 1 GHC
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>

                                {/* Blockchain Information */}
                                <Separator />
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground mb-4">Blockchain Information</h3>
                                  <div className="bg-muted rounded-lg p-4">
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Producer Address:</span>
                                        <span className="font-mono text-sm text-foreground">
                                          {certificate.producerAddress ? `${certificate.producerAddress.substring(0, 8)}...${certificate.producerAddress.substring(certificate.producerAddress.length - 8)}` : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Certificate ID:</span>
                                        <span className="font-mono text-sm text-foreground">{certificate.certificateId}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Verification Status:</span>
                                        <span className={`font-medium ${
                                          certificate.status === 'valid' ? 'text-green-600 dark:text-green-400' : 
                                          certificate.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : 
                                          'text-red-600 dark:text-red-400'
                                        }`}>
                                          {certificate.status === 'valid' ? '✓ Verified' : 
                                           certificate.status === 'pending' ? '⏳ Pending' : '✗ Invalid'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}