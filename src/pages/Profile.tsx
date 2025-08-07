import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBanks } from '../hooks/useBanks';
import { useFinancialForecastApp } from '../hooks/useFinancialForecastApp';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  CreditCard,
  Bell,
  Eye,
  EyeOff,
  ChevronRight,
  Building2,
  Calendar,
  Save
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const { banks } = useBanks();
  const { savedScenarios, allEvents } = useFinancialForecastApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'privacy'>('dashboard');
  const [showNotifications, setShowNotifications] = useState(true);
  const [showBalanceAlerts, setShowBalanceAlerts] = useState(true);

  // AI Recommendations
  const generateAIRecommendations = () => {
    const recommendations = [];
    
    // Analyze recurring expenses
    const recurringExpenses = allEvents.filter(e => e.frequency !== 'once' && e.type === 'expense');
    const totalRecurringExpenses = recurringExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
    
    if (totalRecurringExpenses > 0) {
      const highExpenseItems = recurringExpenses.filter(e => Math.abs(e.amount) > 100);
      if (highExpenseItems.length > 0) {
        recommendations.push({
          type: 'warning',
          title: 'High Recurring Expenses',
          message: `You have ${highExpenseItems.length} recurring expenses over $100. Consider reviewing these for potential savings.`,
          icon: AlertTriangle
        });
      }
    }

    // Analyze saved scenarios
    if (savedScenarios.length > 0) {
      const recentScenarios = savedScenarios.slice(-3);
      const hasLowBalanceScenario = recentScenarios.some(s => 
        s.chartData.some(d => d.balance < 500)
      );
      
      if (hasLowBalanceScenario) {
        recommendations.push({
          type: 'danger',
          title: 'Low Balance Warning',
          message: 'Some of your scenarios show balances dropping below $500. Consider adjusting your spending plans.',
          icon: AlertTriangle
        });
      }
    }

    // Connected banks analysis
    if (banks.length > 0) {
      recommendations.push({
        type: 'success',
        title: 'Bank Integration Active',
        message: `You have ${banks.length} bank account${banks.length > 1 ? 's' : ''} connected. Your financial data is being tracked automatically.`,
        icon: Building2
      });
    }

    // Default recommendation if none generated
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        title: 'Getting Started',
        message: 'Connect your bank accounts and create some events to get personalized financial insights.',
        icon: TrendingUp
      });
    }

    return recommendations;
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const recommendations = generateAIRecommendations();

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-20">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#333] p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-gray-400">Manage your account and view insights</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* User Info Card */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-[#007a33] rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {user?.displayName || 'User'}
              </h2>
              <p className="text-gray-400">{user?.email}</p>
              <p className="text-sm text-gray-500">
                Member since {user?.metadata?.creationTime ? 
                  new Date(user.metadata.creationTime).toLocaleDateString() : 
                  'Recently'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-[#1a1a1a] border border-[#333] rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-[#007a33] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#007a33] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'bg-[#007a33] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Privacy
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Connected Banks</p>
                    <p className="text-2xl font-bold">{banks.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-[#007a33]" />
                </div>
              </div>
              
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Saved Scenarios</p>
                    <p className="text-2xl font-bold">{savedScenarios.length}</p>
                  </div>
                  <Save className="w-8 h-8 text-[#007a33]" />
                </div>
              </div>
              
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Events</p>
                    <p className="text-2xl font-bold">{allEvents.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-[#007a33]" />
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-[#007a33]" />
                AI Insights & Recommendations
              </h3>
              
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      rec.type === 'warning' ? 'border-yellow-500/20 bg-yellow-500/10' :
                      rec.type === 'danger' ? 'border-red-500/20 bg-red-500/10' :
                      rec.type === 'success' ? 'border-green-500/20 bg-green-500/10' :
                      'border-blue-500/20 bg-blue-500/10'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <rec.icon className={`w-5 h-5 mt-0.5 ${
                        rec.type === 'warning' ? 'text-yellow-400' :
                        rec.type === 'danger' ? 'text-red-400' :
                        rec.type === 'success' ? 'text-green-400' :
                        'text-blue-400'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-gray-300 mt-1">{rec.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-[#007a33]" />
                App Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-400">Receive alerts about your finances</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      showNotifications ? 'bg-[#007a33]' : 'bg-[#333]'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      showNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Balance Alerts</p>
                      <p className="text-sm text-gray-400">Get notified when balance is low</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBalanceAlerts(!showBalanceAlerts)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      showBalanceAlerts ? 'bg-[#007a33]' : 'bg-[#333]'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      showBalanceAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-[#007a33]" />
                Connected Banks
              </h3>
              
              {banks.length > 0 ? (
                <div className="space-y-3">
                  {banks.map((bank, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-[#007a33]" />
                        <span>{bank.institution?.name || 'Bank Account'}</span>
                      </div>
                      <span className="text-sm text-gray-400">Connected</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No banks connected yet.</p>
              )}
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-[#007a33]" />
                Privacy Policy
              </h3>
              
              <div className="space-y-4 text-sm text-gray-300">
                <div>
                  <h4 className="font-medium text-white mb-2">Data We Collect</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your email address and display name</li>
                    <li>App usage data and preferences</li>
                    <li>Saved financial scenarios and events</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-2">Data We Do NOT Store</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Bank account credentials or passwords</li>
                    <li>Raw transaction descriptions or account numbers</li>
                    <li>Plaid access tokens (stored securely by Plaid)</li>
                    <li>Personal financial information</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-2">External Services</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Firebase:</strong> Authentication and data storage</li>
                    <li><strong>Plaid:</strong> Secure bank account connections</li>
                    <li><strong>Google:</strong> Optional sign-in service</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-2">Your Rights</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Request deletion of your data at any time</li>
                    <li>Disconnect bank accounts instantly</li>
                    <li>Export your data in standard formats</li>
                    <li>Opt out of data collection</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Data Deletion</h3>
              <p className="text-sm text-gray-300 mb-4">
                You can request complete deletion of your account and all associated data. This action cannot be undone.
              </p>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm">
                Request Data Deletion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
