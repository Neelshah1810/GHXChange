import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  ArrowRight, 
  Target, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Users, 
  Factory,
  Zap,
  Award,
  Globe,
  CheckCircle,
  UserPlus,
  Wallet,
  ShieldCheck,
  FileText,
  Eye,
  Coins,
  RefreshCw,
  ShoppingCart,
  CreditCard,
  Trash2,
  Database,
  GitBranch
} from 'lucide-react';

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'initiatives' | 'workflow' | 'future'>('initiatives');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // No automatic redirect for authenticated users - let them stay on home page
  // They can manually navigate back to their dashboard using the login buttons

  // Show loading state if auth is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading Green Hydrogen Chain...</p>
        </div>
      </div>
    );
  }

  const handleLogin = () => {
    // If user is authenticated, go directly to their dashboard
    if (isAuthenticated && user) {
      if (user.role === 'producer') {
        setLocation('/producer/dashboard');
      } else if (user.role === 'buyer') {
        setLocation('/buyer/dashboard');
      } else if (user.role === 'auditor') {
        setLocation('/auditor');
      }
    } else {
      // Not authenticated, go to login page
      setLocation('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      {/* Welcome message for authenticated users */}
      {isAuthenticated && user && (
        <div className="bg-green-600 text-white px-4 py-2 text-center text-sm">
          Welcome back, {user.name}! You're currently logged in as a {user.role}. Click "Login to Dashboard" to return to your workspace.
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Green Hydrogen Chain</h1>
                <p className="text-xs text-gray-600">Government of India Initiative</p>
              </div>
            </div>
            <Button 
              onClick={handleLogin}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg"
            >
              <Users className="w-4 h-4 mr-2" />
              {isAuthenticated ? 'Go to Dashboard' : 'Register/Login to Dashboard'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-10 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 border-green-300 text-green-700 bg-green-50">
            <Zap className="w-3 h-3 mr-1" />
            National Green Hydrogen Mission 2023-2030
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="block">Green Hydrogen</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              Future of India
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transforming India into a global hub for green hydrogen production, utilization, and export through 
            blockchain-powered transparency and innovation.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={handleLogin} 
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-xl"
            >
              {isAuthenticated ? 'Go to My Dashboard' : 'Access GHC Platform'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Factory className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">₹19,744 Cr</h3>
              <p className="text-gray-600">Total Investment</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">5 MMT</h3>
              <p className="text-gray-600">Annual Production Target</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">2030</h3>
              <p className="text-gray-600">Target Achievement</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">125 GW</h3>
              <p className="text-gray-600">Renewable Capacity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-lg p-1 shadow-lg border border-gray-200">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 rounded-md transition-all ${
                  activeTab === 'history' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Historical Journey
              </button>
              <button
                onClick={() => setActiveTab('initiatives')}
                className={`px-6 py-3 rounded-md transition-all ${
                  activeTab === 'initiatives' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Target className="w-4 h-4 inline mr-2" />
                Current Initiatives
              </button>
              <button
                onClick={() => setActiveTab('workflow')}
                className={`px-6 py-3 rounded-md transition-all ${
                  activeTab === 'workflow' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <GitBranch className="w-4 h-4 inline mr-2" />
                Blockchain Process
              </button>
              <button
                onClick={() => setActiveTab('future')}
                className={`px-6 py-3 rounded-md transition-all ${
                  activeTab === 'future' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Future Enhancements
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeTab === 'history' && (
              <>
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
                  <CardHeader>
                    <CardTitle className="text-2xl text-green-800 flex items-center">
                      <Calendar className="w-6 h-6 mr-2" />
                      Policy Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-bold text-lg">2021 - National Hydrogen Mission</h4>
                      <p className="text-gray-600">India announced the National Hydrogen Mission to make India a global hub for green hydrogen production and export.</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-bold text-lg">2022 - Green Hydrogen Policy</h4>
                      <p className="text-gray-600">Comprehensive policy framework for green hydrogen and green ammonia manufacturing launched.</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-bold text-lg">2023 - SIGHT Programme</h4>
                      <p className="text-gray-600">Strategic Interventions for Green Hydrogen Transition launched with ₹19,744 crore outlay.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-800 flex items-center">
                      <Shield className="w-6 h-6 mr-2" />
                      Key Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <h5 className="font-semibold">Global Recognition</h5>
                        <p className="text-sm text-gray-600">India recognized as potential global leader in green hydrogen production</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <h5 className="font-semibold">Industry Partnerships</h5>
                        <p className="text-sm text-gray-600">Major industrial partnerships established for green hydrogen projects</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <h5 className="font-semibold">Technology Development</h5>
                        <p className="text-sm text-gray-600">Indigenous technology development and innovation programs launched</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'initiatives' && (
              <>
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
                  <CardHeader>
                    <CardTitle className="text-2xl text-green-800 flex items-center">
                      <Target className="w-6 h-6 mr-2" />
                      SIGHT Programme Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-100 rounded-lg">
                      <h5 className="font-bold text-green-800">Component I - Incentive for Electrolyzer Manufacturing</h5>
                      <p className="text-sm text-green-700 mt-1">₹4,440 crore allocation for domestic electrolyzer manufacturing</p>
                    </div>
                    <div className="p-4 bg-blue-100 rounded-lg">
                      <h5 className="font-bold text-blue-800">Component II - Incentive for Green Hydrogen Production</h5>
                      <p className="text-sm text-blue-700 mt-1">₹13,050 crore for green hydrogen production incentives</p>
                    </div>
                    <div className="p-4 bg-purple-100 rounded-lg">
                      <h5 className="font-bold text-purple-800">Research & Development</h5>
                      <p className="text-sm text-purple-700 mt-1">₹2,254 crore for R&D and skill development programs</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-800 flex items-center">
                      <Factory className="w-6 h-6 mr-2" />
                      Current Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-l-4 border-green-400 pl-4">
                      <h5 className="font-bold">Green Hydrogen Hubs</h5>
                      <p className="text-sm text-gray-600">Development of integrated green hydrogen hubs across India</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4">
                      <h5 className="font-bold">Industrial Partnerships</h5>
                      <p className="text-sm text-gray-600">Collaborations with steel, fertilizer, and petrochemical industries</p>
                    </div>
                    <div className="border-l-4 border-purple-400 pl-4">
                      <h5 className="font-bold">Export Infrastructure</h5>
                      <p className="text-sm text-gray-600">Building infrastructure for green hydrogen and ammonia exports</p>
                    </div>
                    <div className="border-l-4 border-orange-400 pl-4">
                      <h5 className="font-bold">Blockchain Integration</h5>
                      <p className="text-sm text-gray-600">GHC platform for transparent tracking and trading of green hydrogen credits</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'workflow' && (
              <>
                {/* Blockchain Process spans full width */}
                <div className="lg:col-span-2">
                  <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
                    <CardHeader>
                      <CardTitle className="text-2xl text-green-800 flex items-center justify-center">
                        <GitBranch className="w-6 h-6 mr-2" />
                        Blockchain Credit Lifecycle
                      </CardTitle>
                      <p className="text-center text-gray-600 mt-2">5-Step blockchain process for green hydrogen credits</p>
                    </CardHeader>
                    <CardContent>
                      {/* Horizontal Process Flow */}
                      <div className="flex items-center justify-between mb-8 overflow-x-auto">
                        {/* Step 1: Blockchain Block */}
                        <div className="flex flex-col items-center min-w-[120px] text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                            <Database className="w-8 h-8 text-white" />
                          </div>
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">1</div>
                          <h4 className="font-semibold text-blue-800 text-sm mb-1">Blockchain Block</h4>
                          <p className="text-xs text-gray-600 leading-tight">Secure distributed ledger foundation</p>
                        </div>

                        <ArrowRight className="w-6 h-6 text-gray-400 mx-2 flex-shrink-0" />

                        {/* Step 2: Credit Issuance */}
                        <div className="flex flex-col items-center min-w-[120px] text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                            <Coins className="w-8 h-8 text-white" />
                          </div>
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">2</div>
                          <h4 className="font-semibold text-green-800 text-sm mb-1">Credit Issuance</h4>
                          <p className="text-xs text-gray-600 leading-tight">Digital credits minted on blockchain</p>
                        </div>

                        <ArrowRight className="w-6 h-6 text-gray-400 mx-2 flex-shrink-0" />

                        {/* Step 3: Credit Verification */}
                        <div className="flex flex-col items-center min-w-[120px] text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                            <ShieldCheck className="w-8 h-8 text-white" />
                          </div>
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">3</div>
                          <h4 className="font-semibold text-orange-800 text-sm mb-1">Credit Verification</h4>
                          <p className="text-xs text-gray-600 leading-tight">Auditor validates authenticity</p>
                        </div>

                        <ArrowRight className="w-6 h-6 text-gray-400 mx-2 flex-shrink-0" />

                        {/* Step 4: Credit Transfer */}
                        <div className="flex flex-col items-center min-w-[120px] text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                            <CreditCard className="w-8 h-8 text-white" />
                          </div>
                          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">4</div>
                          <h4 className="font-semibold text-purple-800 text-sm mb-1">Credit Transfer</h4>
                          <p className="text-xs text-gray-600 leading-tight">Secure ownership transfer</p>
                        </div>

                        <ArrowRight className="w-6 h-6 text-gray-400 mx-2 flex-shrink-0" />

                        {/* Step 5: Credit Retirement */}
                        <div className="flex flex-col items-center min-w-[120px] text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-gray-600 rounded-lg flex items-center justify-center mb-3 shadow-lg">
                            <Trash2 className="w-8 h-8 text-white" />
                          </div>
                          <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">5</div>
                          <h4 className="font-semibold text-red-800 text-sm mb-1">Credit Retirement</h4>
                          <p className="text-xs text-gray-600 leading-tight">Permanent removal from circulation</p>
                        </div>
                      </div>

                      {/* Blockchain Description */}
                      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold text-gray-800 mb-3 text-center">Blockchain Technology in GHC Platform</h4>
                        <div className="space-y-3 text-center">
                          <p className="text-gray-700 leading-relaxed">
                            Our platform leverages blockchain technology to create an immutable and transparent ledger for green hydrogen credit transactions, ensuring complete traceability from issuance to retirement.
                          </p>
                          <p className="text-gray-700 leading-relaxed">
                            Each credit is tokenized as a unique digital asset on the blockchain, providing cryptographic proof of ownership and preventing double-spending or fraudulent activities.
                          </p>
                          <p className="text-gray-700 leading-relaxed">
                            Smart contracts automatically execute compliance rules and facilitate secure peer-to-peer trading, while maintaining a permanent audit trail for regulatory reporting and environmental impact verification.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === 'future' && (
              <>
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
                  <CardHeader>
                    <CardTitle className="text-2xl text-green-800 flex items-center">
                      <TrendingUp className="w-6 h-6 mr-2" />
                      2030 Vision & Beyond
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                      <h5 className="font-bold text-green-800">Global Leadership</h5>
                      <p className="text-sm text-gray-700">Position India as the global green hydrogen hub with 5 MMT annual production</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                      <h5 className="font-bold text-blue-800">Export Excellence</h5>
                      <p className="text-sm text-gray-700">Become a major exporter of green hydrogen and its derivatives globally</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                      <h5 className="font-bold text-purple-800">Technology Innovation</h5>
                      <p className="text-sm text-gray-700">Lead in electrolyzer technology and green hydrogen production innovations</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-800 flex items-center">
                      <Zap className="w-6 h-6 mr-2" />
                      Future Enhancements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold">AI-Powered Optimization</h5>
                        <p className="text-sm text-gray-600">Machine learning algorithms for production and distribution optimization</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold">IoT Integration</h5>
                        <p className="text-sm text-gray-600">Real-time monitoring and automation of hydrogen production facilities</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold">International Standards</h5>
                        <p className="text-sm text-gray-600">Development of global standards for green hydrogen certification</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold">Carbon Credit Integration</h5>
                        <p className="text-sm text-gray-600">Enhanced carbon credit marketplace and environmental impact tracking</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to be Part of India's Green Revolution?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join the Green Hydrogen Chain platform as a producer, buyer, or auditor and contribute to India's sustainable energy future.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-white text-green-600 hover:bg-gray-100 shadow-xl text-lg px-8 py-4"
          >
            <Users className="w-5 h-5 mr-2" />
            {isAuthenticated ? 'Return to My Dashboard' : 'Access GHC Dashboard'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Green Hydrogen Chain</span>
              </div>
              <p className="text-gray-400">
                Empowering India's transition to a clean energy future through transparent, blockchain-powered green hydrogen trading.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Government Initiatives</h3>
              <ul className="space-y-2 text-gray-400">
                <li>National Green Hydrogen Mission</li>
                <li>SIGHT Programme</li>
                <li>Green Hydrogen Policy 2022</li>
                <li>PLI Scheme for Electrolyzers</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Transparent Credit Trading</li>
                <li>Blockchain Verification</li>
                <li>Compliance Tracking</li>
                <li>Real-time Analytics</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Green Hydrogen Chain Platform. Government of India Initiative.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
