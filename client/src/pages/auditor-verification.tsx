import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShieldCheck, Search, CheckCircle, AlertTriangle, Clock, FileText, Award, Eye, Hash, Calendar, MapPin, Zap, FlaskConical, User } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuditorVerification() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    } else if (!isLoading && isAuthenticated && user?.role !== 'auditor') {
      setLocation('/login');
    }
  }, [isAuthenticated, user, setLocation, isLoading]);

  const { data: certificates = [] } = useQuery({
    queryKey: ['/api/certificates'],
    queryFn: () => api.certificates.getAll()
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => api.transactions.getAll()
  });

  const verifyCertificate = useMutation({
    mutationFn: (certificateId: string) => api.certificates.verify(certificateId),
    onSuccess: (response) => {
      toast({
        title: "Certificate Verified",
        description: response.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      setSelectedCertificate(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Unable to verify certificate. Please try again."
      });
    }
  });

  const flagCertificate = useMutation({
    mutationFn: (certificateId: string) => api.certificates.flag(certificateId, "Flagged for review"),
    onSuccess: (response) => {
      toast({
        title: "Certificate Flagged",
        description: response.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      setSelectedCertificate(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Flag Failed",
        description: "Unable to flag certificate. Please try again."
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'auditor') {
    return null;
  }

  const filteredCertificates = certificates.filter((cert: any) => {
    const matchesSearch = searchTerm === "" || 
      cert.certificateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.producerAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "All" || 
      cert.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const pendingCertificates = certificates.filter((cert: any) => cert.status === 'pending').length;
  const validCertificates = certificates.filter((cert: any) => cert.status === 'valid').length;
  const flaggedCertificates = certificates.filter((cert: any) => cert.status === 'flagged').length;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'valid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'flagged':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background role-auditor">
      <Navigation role="auditor" currentSection="verification" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="verification-title">
            Certificate Verification
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="verification-subtitle">
            Review and verify green hydrogen production certificates
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="total-certificates">
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

          <Card data-testid="pending-verification">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                  <p className="text-2xl font-bold text-foreground">{pendingCertificates}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="verified-certificates">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-foreground">{validCertificates}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="flagged-certificates">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged</p>
                  <p className="text-2xl font-bold text-foreground">{flaggedCertificates}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate List */}
          <div className="lg:col-span-2">
            <Card data-testid="certificate-list">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Certificates for Review
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Search certificates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48"
                      data-testid="input-search-certificates"
                    />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32" data-testid="select-status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="valid">Valid</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCertificates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="no-certificates">
                    No certificates found matching your criteria.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCertificates.slice(0, 10).map((certificate: any) => (
                      <Card 
                        key={certificate.id} 
                        className={`cursor-pointer transition-all border ${
                          selectedCertificate?.id === certificate.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedCertificate(certificate)}
                        data-testid={`certificate-${certificate.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">
                                  {certificate.certificateId}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {certificate.hydrogenKg} kg H₂ • {certificate.energySource}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(certificate.status)}>
                              {certificate.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <span className="text-foreground ml-1">{certificate.location}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date:</span>
                              <span className="text-foreground ml-1">{formatDate(certificate.productionDate)}</span>
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

          {/* Certificate Details & Actions */}
          <div className="lg:col-span-1">
            <Card data-testid="certificate-details">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Certificate Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedCertificate ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a certificate to view details
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-2">Certificate Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">ID:</span>
                          <span className="text-foreground ml-2">{selectedCertificate.certificateId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Producer:</span>
                          <span className="text-foreground ml-2 font-mono text-xs">
                            {selectedCertificate.producerAddress.substring(0, 10)}...
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="text-foreground ml-2">{selectedCertificate.hydrogenKg} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Energy Source:</span>
                          <span className="text-foreground ml-2">{selectedCertificate.energySource}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <span className="text-foreground ml-2">{selectedCertificate.location}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Production Date:</span>
                          <span className="text-foreground ml-2">{formatDate(selectedCertificate.productionDate)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={`ml-2 ${getStatusColor(selectedCertificate.status)}`}>
                            {selectedCertificate.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedCertificate.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => verifyCertificate.mutate(selectedCertificate.certificateId)}
                            disabled={verifyCertificate.isPending}
                            className="w-full"
                            data-testid="button-verify-certificate"
                          >
                            {verifyCertificate.isPending ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Verify Certificate
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="destructive"
                            onClick={() => flagCertificate.mutate(selectedCertificate.certificateId)}
                            disabled={flagCertificate.isPending}
                            className="w-full"
                            data-testid="button-flag-certificate"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Flag for Review
                          </Button>
                        </>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full"
                            data-testid="button-view-full-details"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center text-xl">
                              <Award className="w-6 h-6 mr-2 text-primary" />
                              Certificate #{selectedCertificate.certificateId} - Full Details
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Certificate Status */}
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-foreground">Certificate Status</h3>
                              <Badge className={getStatusColor(selectedCertificate.status)}>
                                {selectedCertificate.status?.toUpperCase()}
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
                                        <p className="text-xl font-bold text-foreground">{selectedCertificate.hydrogenKg} kg</p>
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
                                        <p className="text-lg font-semibold text-foreground">{selectedCertificate.energySource}</p>
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
                                        <p className="text-lg font-semibold text-foreground">{selectedCertificate.location}</p>
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
                                        <p className="text-lg font-semibold text-foreground">{formatDate(selectedCertificate.productionDate)}</p>
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
                                    <p className="font-semibold text-foreground">{selectedCertificate.certifierName}</p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                                  <Calendar className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Issue Date</p>
                                    <p className="font-semibold text-foreground">{formatDate(selectedCertificate.issueDate)}</p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                                  <Hash className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Producer Address</p>
                                    <p className="font-mono text-sm text-foreground">
                                      {selectedCertificate.producerAddress}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                                  <Hash className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Digital Signature</p>
                                    <p className="font-mono text-sm text-foreground break-all">
                                      {selectedCertificate.signature ? `${selectedCertificate.signature.substring(0, 20)}...${selectedCertificate.signature.substring(selectedCertificate.signature.length - 20)}` : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Audit Trail */}
                            <Separator />
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-4">Audit Trail</h3>
                              <div className="space-y-3">
                                {(() => {
                                  const relatedTransactions = transactions.filter((tx: any) => 
                                    tx.data?.certificateId === selectedCertificate.certificateId
                                  );
                                  
                                  return relatedTransactions.length > 0 ? (
                                    relatedTransactions.map((tx: any) => (
                                      <div key={tx.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div>
                                          <p className="font-medium text-foreground">{tx.txType.toUpperCase()} Transaction</p>
                                          <p className="text-sm text-muted-foreground">
                                            {tx.amount} GHC • {new Date(tx.timestamp).toLocaleDateString()}
                                          </p>
                                        </div>
                                        <Badge className={getStatusColor(tx.status)}>
                                          {tx.status}
                                        </Badge>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-muted-foreground text-center py-4">No related transactions found</p>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Environmental Impact */}
                            <Separator />
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-4">Environmental Impact</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                  <CardContent className="p-4 text-center">
                                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                      {(selectedCertificate.hydrogenKg * 10.4).toFixed(1)} kg
                                    </p>
                                    <p className="text-sm text-green-600 dark:text-green-400">CO₂ Emissions Avoided</p>
                                  </CardContent>
                                </Card>
                                
                                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                  <CardContent className="p-4 text-center">
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                      {selectedCertificate.hydrogenKg} GHC
                                    </p>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">Credits Generated</p>
                                  </CardContent>
                                </Card>

                                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                                  <CardContent className="p-4 text-center">
                                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                      {(selectedCertificate.hydrogenKg * 0.033).toFixed(2)} MWh
                                    </p>
                                    <p className="text-sm text-purple-600 dark:text-purple-400">Renewable Energy</p>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>

                            {/* Verification Actions */}
                            {selectedCertificate.status === 'pending' && (
                              <>
                                <Separator />
                                <div className="flex space-x-4">
                                  <Button
                                    onClick={() => {
                                      verifyCertificate.mutate(selectedCertificate.certificateId);
                                    }}
                                    disabled={verifyCertificate.isPending}
                                    className="flex-1"
                                  >
                                    {verifyCertificate.isPending ? (
                                      <>
                                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                                        Verifying...
                                      </>
                                    ) : (
                                      <>
                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                        Verify Certificate
                                      </>
                                    )}
                                  </Button>
                                  
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      flagCertificate.mutate(selectedCertificate.certificateId);
                                    }}
                                    disabled={flagCertificate.isPending}
                                    className="flex-1"
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Flag for Review
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}