import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationAPI } from '../services/api';

const APPLICATION_TYPES = [
  {
    type: 'PASSPORT',
    label: 'Passport Application',
    emoji: '🛂',
    description: 'Apply for a fresh passport or renewal',
    steps: 6,
    docs: ['Aadhaar Card', 'PAN Card', 'Address Proof', 'Photo'],
    timeEstimate: '15-20 mins',
  },
  {
    type: 'DRIVING_LICENSE',
    label: 'Driving License',
    emoji: '🚗',
    description: 'Apply for a new driving license or renewal',
    steps: 6,
    docs: ['Aadhaar Card', 'PAN Card', 'Photo', 'Medical Certificate'],
    timeEstimate: '10-15 mins',
  },
  {
    type: 'SUBSIDY',
    label: 'Subsidy Application',
    emoji: '💰',
    description: 'Government schemes: LPG, housing, farming',
    steps: 5,
    docs: ['Aadhaar Card', 'Income Proof', 'Bank Passbook'],
    timeEstimate: '10-12 mins',
  },
  {
    type: 'BIRTH_CERTIFICATE',
    label: 'Birth Certificate',
    emoji: '👶',
    description: 'Register a birth and obtain certificate',
    steps: 5,
    docs: ['Parent Aadhaar', 'Hospital Birth Record'],
    timeEstimate: '8-10 mins',
  },
  {
    type: 'INCOME_CERTIFICATE',
    label: 'Income Certificate',
    emoji: '📄',
    description: 'Get income certificate for government schemes',
    steps: 5,
    docs: ['Aadhaar Card', 'Salary Slip / IT Return', 'Bank Statement'],
    timeEstimate: '8-10 mins',
  },
];

export function NewApplicationPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await applicationAPI.create(selected);
      const app = res.data.data;
      toast.success('Application created successfully!');
      navigate(`/applications/${app.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-surface-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>
        <h1 className="font-display font-bold text-2xl text-white">Start New Application</h1>
        <p className="text-surface-400 mt-1">Choose the government service you need assistance with</p>
      </div>

      {/* Type cards */}
      <div className="grid gap-3">
        {APPLICATION_TYPES.map(appType => (
          <button
            key={appType.type}
            onClick={() => setSelected(appType.type)}
            className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
              selected === appType.type
                ? 'bg-brand-600/15 border-brand-500/50 ring-1 ring-brand-500/30'
                : 'bg-surface-900 border-surface-700/50 hover:border-surface-600 hover:bg-surface-800/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                selected === appType.type ? 'bg-brand-600/20' : 'bg-surface-800'
              }`}>
                {appType.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white">{appType.label}</h3>
                  <span className="text-surface-400 text-xs bg-surface-800 px-2 py-0.5 rounded-full">
                    ⏱ {appType.timeEstimate}
                  </span>
                </div>
                <p className="text-surface-400 text-sm mb-2">{appType.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {appType.docs.map(doc => (
                    <span key={doc} className="text-xs text-surface-300 bg-surface-800 border border-surface-700 px-2 py-0.5 rounded-lg">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
              {selected === appType.type && (
                <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      {selected && (
        <div className="sticky bottom-6">
          <div className="card border-brand-500/30 bg-brand-950/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">
                  {APPLICATION_TYPES.find(t => t.type === selected)?.label}
                </p>
                <p className="text-surface-400 text-sm mt-0.5">
                  {APPLICATION_TYPES.find(t => t.type === selected)?.steps} steps •{' '}
                  {APPLICATION_TYPES.find(t => t.type === selected)?.timeEstimate}
                </p>
              </div>
              <button
                onClick={handleStart}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {loading ? 'Starting...' : 'Start Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
