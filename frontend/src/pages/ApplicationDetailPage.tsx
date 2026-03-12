import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, Circle, Loader2, Upload, Shield, FileText,
  Key, Send, AlertTriangle, RotateCcw, ChevronLeft, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationAPI, kycAPI, documentAPI, esignAPI } from '../services/api';
import { useAuthStore } from '../store/auth.store';

const STEP_ICONS: Record<string, React.ReactNode> = {
  IDENTITY_VERIFICATION: <Shield size={18} />,
  DOCUMENT_UPLOAD: <Upload size={18} />,
  DATA_CONFIRMATION: <FileText size={18} />,
  APPLICATION_REVIEW: <FileText size={18} />,
  ESIGN: <Key size={18} />,
  PORTAL_SUBMISSION: <Send size={18} />,
};

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  // KYC state
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [kycName, setKycName] = useState('');
  const [kycLoading, setKycLoading] = useState(false);
  const [kycResult, setKycResult] = useState<any>(null);

  // Document state
  const [uploadType, setUploadType] = useState('AADHAAR');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // eSign state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [esignLoading, setEsignLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationAPI.getApplication(id!).then(r => r.data.data),
    refetchInterval: (data: any) =>
      data?.status === 'RETRYING' || data?.status === 'SUBMITTED' ? 3000 : false,
  });

  const advanceMutation = useMutation({
    mutationFn: (stepData?: any) => applicationAPI.advance(id!, stepData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application', id] });
      toast.success('Step completed!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const submitMutation = useMutation({
    mutationFn: () => applicationAPI.submit(id!),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['application', id] });
      const result = res.data.data;
      if (result.success) {
        toast.success(`🎉 Submitted! Ref: ${result.referenceNumber}`);
      } else {
        toast.error(result.finalMessage);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Submission failed'),
  });

  const handleKYC = async () => {
    if (!aadhaar || !kycName || !dob) return toast.error('Fill all KYC fields');
    setKycLoading(true);
    try {
      await kycAPI.recordConsent('AADHAAR_KYC_VERIFICATION');
      const [aadhaarRes, panRes] = await Promise.all([
        kycAPI.verifyAadhaar({ aadhaarNumber: aadhaar, name: kycName, dob, applicationId: id }),
        pan ? kycAPI.verifyPAN({ panNumber: pan, name: kycName, dob, applicationId: id }) : Promise.resolve(null),
      ]);
      const result = { aadhaar: aadhaarRes.data.data, pan: panRes?.data.data };
      setKycResult(result);
      if (result.aadhaar.verified) {
        toast.success('Identity verified successfully!');
      } else {
        toast.error('Aadhaar verification failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'KYC failed');
    } finally {
      setKycLoading(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!uploadFile) return toast.error('Select a file first');
    setUploadLoading(true);
    try {
      const res = await documentAPI.upload(id!, uploadType, uploadFile);
      setUploadResult(res.data.data);
      toast.success('Document uploaded and OCR extracted!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!user?.phone) return toast.error('Phone not found');
    setEsignLoading(true);
    try {
      const res = await esignAPI.sendOTP(id!, user.phone);
      setOtpSent(true);
      setOtpMessage(res.data.data.message);
      toast.success('OTP sent!');
    } catch (err: any) {
      toast.error('Failed to send OTP');
    } finally {
      setEsignLoading(false);
    }
  };

  const handleVerifySign = async () => {
    if (!otp || !user?.phone) return;
    setEsignLoading(true);
    try {
      const res = await esignAPI.verifyAndSign(id!, user.phone, otp);
      if (res.data.data.signed) {
        toast.success('Document signed successfully!');
        await advanceMutation.mutateAsync({ signedAt: new Date(), signatureHash: res.data.data.signatureHash });
      } else {
        toast.error(res.data.data.message);
      }
    } catch (err: any) {
      toast.error('eSign failed');
    } finally {
      setEsignLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    );
  }

  if (!application) return null;

  const currentStepObj = application.workflowSteps?.find((s: any) => s.stepNumber === application.currentStep + 1);
  const stepName = currentStepObj?.stepName || '';
  const isComplete = ['APPROVED', 'REJECTED'].includes(application.status);
  const isFailed = application.status === 'FAILED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-surface-400 hover:text-white text-sm mb-4 transition-colors">
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">{application.type.replace(/_/g, ' ')}</h1>
            <p className="text-surface-400 mt-1 font-mono text-sm">{application.id}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-surface-400">Overall Progress</span>
          <span className="text-sm font-medium text-white">
            {application.currentStep}/{application.totalSteps} steps
          </span>
        </div>
        <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-500"
            style={{ width: `${(application.currentStep / application.totalSteps) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {application.workflowSteps?.map((step: any) => (
            <div key={step.id} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                step.status === 'COMPLETED'
                  ? 'bg-green-400/10 text-green-400 border-green-400/30'
                  : step.stepNumber === application.currentStep + 1
                  ? 'bg-brand-600/20 text-brand-400 border-brand-500/40'
                  : 'bg-surface-800 text-surface-500 border-surface-700'
              }`}>
                {step.status === 'COMPLETED'
                  ? <CheckCircle2 size={12} />
                  : step.stepNumber === application.currentStep + 1
                  ? <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                  : <Circle size={12} />
                }
                {step.stepName.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approved / Rejected state */}
      {application.status === 'APPROVED' && (
        <div className="card border-green-400/30 bg-green-400/5">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-green-400" />
            <div>
              <h3 className="text-green-400 font-semibold">Application Approved!</h3>
              <p className="text-surface-300 text-sm mt-0.5">
                Reference: <span className="font-mono text-white">{(application.metadata as any)?.referenceNumber || 'N/A'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {(application.status === 'FAILED' || application.status === 'REJECTED') && (
        <div className="card border-red-400/30 bg-red-400/5">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-red-400" />
            <div>
              <h3 className="text-red-400 font-semibold">
                {application.status === 'FAILED' ? 'Submission Failed' : 'Application Rejected'}
              </h3>
              <p className="text-surface-300 text-sm mt-0.5">
                Maximum retry attempts exhausted. Please try submitting again.
              </p>
            </div>
          </div>
          {application.retryLogs?.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-surface-400 text-sm font-medium">Retry History:</p>
              {application.retryLogs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-2 text-xs text-surface-400">
                  <RotateCcw size={10} />
                  Attempt {log.attempt}: {log.reason} — {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RETRYING state */}
      {application.status === 'RETRYING' && (
        <div className="card border-orange-400/30 bg-orange-400/5">
          <div className="flex items-center gap-3">
            <RotateCcw size={24} className="text-orange-400 animate-spin" />
            <div>
              <h3 className="text-orange-400 font-semibold">Retrying Submission...</h3>
              <p className="text-surface-300 text-sm mt-0.5">Portal is temporarily unavailable. Retrying automatically...</p>
            </div>
          </div>
        </div>
      )}

      {/* Active workflow step */}
      {!isComplete && !isFailed && application.status !== 'RETRYING' && stepName && (
        <div className="card border-brand-500/20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-brand-600/20 border border-brand-500/30 rounded-xl flex items-center justify-center text-brand-400">
              {STEP_ICONS[stepName] || <FileText size={18} />}
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">{stepName.replace(/_/g, ' ')}</h3>
              <p className="text-surface-400 text-sm">Step {application.currentStep + 1} of {application.totalSteps}</p>
            </div>
          </div>

          {/* Step content */}
          {stepName === 'IDENTITY_VERIFICATION' && (
            <div className="space-y-4">
              <p className="text-surface-300 text-sm">Verify your identity using Aadhaar and PAN details.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input-field" value={kycName} onChange={e => setKycName(e.target.value)} placeholder="As on Aadhaar" />
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  <input type="date" className="input-field" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <div>
                  <label className="label">Aadhaar Number</label>
                  <input className="input-field font-mono" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="XXXX XXXX XXXX" maxLength={14} />
                </div>
                <div>
                  <label className="label">PAN Number (optional)</label>
                  <input className="input-field font-mono uppercase" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
                </div>
              </div>

              {kycResult && (
                <div className="p-4 bg-green-400/10 border border-green-400/30 rounded-xl">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle2 size={16} />
                    <span className="font-medium text-sm">Identity Verified</span>
                  </div>
                  <div className="text-surface-300 text-sm space-y-1">
                    <div>Name: <span className="text-white">{kycResult.aadhaar?.name}</span></div>
                    <div>DOB: <span className="text-white">{kycResult.aadhaar?.dob}</span></div>
                    <div>Address: <span className="text-white">{kycResult.aadhaar?.address}</span></div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!kycResult ? (
                  <button onClick={handleKYC} disabled={kycLoading} className="btn-primary">
                    {kycLoading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                    {kycLoading ? 'Verifying...' : 'Verify Identity'}
                  </button>
                ) : (
                  <button onClick={() => advanceMutation.mutate({ kycVerified: true, name: kycResult.aadhaar?.name })} disabled={advanceMutation.isPending} className="btn-primary">
                    {advanceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Confirm & Continue
                  </button>
                )}
              </div>
            </div>
          )}

          {stepName === 'DOCUMENT_UPLOAD' && (
            <div className="space-y-4">
              <p className="text-surface-300 text-sm">Upload your documents. OCR will auto-extract the information.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Document Type</label>
                  <select className="input-field" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="PHOTO">Passport Photo</option>
                    <option value="ADDRESS_PROOF">Address Proof</option>
                    <option value="INCOME_PROOF">Income Proof</option>
                  </select>
                </div>
                <div>
                  <label className="label">File (JPG, PNG, PDF)</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    className="input-field file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-brand-600 file:text-white cursor-pointer"
                  />
                </div>
              </div>

              {uploadResult && (
                <div className="p-4 bg-surface-800 border border-surface-700 rounded-xl">
                  <div className="flex items-center gap-2 text-brand-400 mb-2 font-medium text-sm">
                    <FileText size={14} />
                    OCR Result (Confidence: {(uploadResult.ocr.confidence * 100).toFixed(0)}%)
                  </div>
                  <div className="text-surface-300 text-sm space-y-1 font-mono">
                    {uploadResult.ocr.name && <div>Name: <span className="text-white">{uploadResult.ocr.name}</span></div>}
                    {uploadResult.ocr.dob && <div>DOB: <span className="text-white">{uploadResult.ocr.dob}</span></div>}
                    {uploadResult.ocr.aadhaarNumber && <div>Aadhaar: <span className="text-white">{uploadResult.ocr.aadhaarNumber}</span></div>}
                    {uploadResult.ocr.panNumber && <div>PAN: <span className="text-white">{uploadResult.ocr.panNumber}</span></div>}
                  </div>
                  {uploadResult.validation.warnings.length > 0 && (
                    <div className="mt-2 text-yellow-400 text-xs">{uploadResult.validation.warnings.join(', ')}</div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleDocumentUpload} disabled={uploadLoading || !uploadFile} className="btn-primary">
                  {uploadLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploadLoading ? 'Uploading...' : 'Upload & Extract'}
                </button>
                {uploadResult && (
                  <button onClick={() => advanceMutation.mutate({ documentsUploaded: true })} disabled={advanceMutation.isPending} className="btn-primary">
                    {advanceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Confirm & Continue
                  </button>
                )}
              </div>
            </div>
          )}

          {(stepName === 'DATA_CONFIRMATION' || stepName === 'APPLICATION_REVIEW') && (
            <div className="space-y-4">
              <p className="text-surface-300 text-sm">Review the extracted information and confirm it's accurate.</p>
              <div className="p-4 bg-surface-800 border border-surface-700 rounded-xl space-y-2">
                {application.verificationLog && (
                  <>
                    <DataRow label="Name" value={application.verificationLog.name} />
                    <DataRow label="DOB" value={application.verificationLog.dob} />
                    <DataRow label="Address" value={application.verificationLog.address} />
                    <DataRow label="Aadhaar" value={application.verificationLog.aadhaarVerified ? '✅ Verified' : '❌ Not verified'} />
                    <DataRow label="PAN" value={application.verificationLog.panVerified ? '✅ Verified' : '⚠️ Not verified'} />
                  </>
                )}
              </div>
              <button onClick={() => advanceMutation.mutate({ dataConfirmed: true })} disabled={advanceMutation.isPending} className="btn-primary">
                {advanceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Confirm Data & Continue
              </button>
            </div>
          )}

          {stepName === 'ESIGN' && (
            <div className="space-y-4">
              <p className="text-surface-300 text-sm">Sign the application digitally using OTP on your registered phone.</p>
              <div className="p-3 bg-surface-800 border border-surface-700 rounded-xl text-sm text-surface-300">
                📱 OTP will be sent to: <span className="text-white font-mono">{user?.phone}</span>
              </div>

              {otpMessage && (
                <div className="p-3 bg-brand-600/10 border border-brand-500/30 rounded-xl text-sm text-brand-300 font-mono">
                  {otpMessage}
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {!otpSent ? (
                  <button onClick={handleSendOTP} disabled={esignLoading} className="btn-primary">
                    {esignLoading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                    Send OTP
                  </button>
                ) : (
                  <div className="flex gap-3 items-end flex-wrap">
                    <div>
                      <label className="label">Enter OTP</label>
                      <input
                        className="input-field w-40 font-mono text-center text-lg tracking-widest"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <button onClick={handleVerifySign} disabled={esignLoading || otp.length < 6} className="btn-primary">
                      {esignLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Verify & Sign
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {stepName === 'PORTAL_SUBMISSION' && (
            <div className="space-y-4">
              <p className="text-surface-300 text-sm">
                Submit your application to the government portal. If it fails, the system will retry automatically up to 3 times.
              </p>
              <div className="p-3 bg-surface-800 border border-surface-700 rounded-xl text-sm">
                <div className="flex items-center gap-2 text-surface-300">
                  <RotateCcw size={14} />
                  Auto-retry enabled: up to 3 attempts with increasing delays
                </div>
              </div>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="btn-primary"
              >
                {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitMutation.isPending ? 'Submitting (with retry)...' : 'Submit to Government Portal'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Retry logs */}
      {application.retryLogs?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white mb-3">Submission Attempts</h3>
          <div className="space-y-2">
            {application.retryLogs.map((log: any) => (
              <div key={log.id} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                log.success
                  ? 'bg-green-400/5 border-green-400/20'
                  : 'bg-red-400/5 border-red-400/20'
              }`}>
                {log.success
                  ? <CheckCircle2 size={14} className="text-green-400" />
                  : <AlertTriangle size={14} className="text-red-400" />}
                <span className={log.success ? 'text-green-300' : 'text-red-300'}>
                  Attempt {log.attempt}: {log.reason}
                </span>
                <span className="text-surface-500 ml-auto text-xs">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Draft', color: 'text-surface-400 bg-surface-800 border-surface-600' },
    DATA_COLLECTED: { label: 'Data Collected', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
    VALIDATED: { label: 'Validated', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
    SUBMITTED: { label: 'Submitted', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
    FAILED: { label: 'Failed', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
    RETRYING: { label: 'Retrying...', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
    APPROVED: { label: 'Approved ✓', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
    REJECTED: { label: 'Rejected', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  };
  const c = cfg[status] || cfg.DRAFT;
  return <span className={`status-badge border px-3 py-1.5 text-sm ${c.color}`}>{c.label}</span>;
}

function DataRow({ label, value }: { label: string; value?: string | null }) {
  return value ? (
    <div className="flex gap-3">
      <span className="text-surface-400 text-sm w-24 flex-shrink-0">{label}:</span>
      <span className="text-white text-sm">{value}</span>
    </div>
  ) : null;
}
