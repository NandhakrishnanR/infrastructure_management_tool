import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { requestApi } from '../services/apiServices.js';
import { getApiErrorMessage } from '../services/apiClient.js';
import { PageHeader } from '../components/PageHeader.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { ArrowLeft, Cpu, HardDrive, Database, Server, Info, AlertTriangle } from 'lucide-react';

const createRequestSchema = z.object({
  name: z
    .string()
    .min(3, 'VM Name must be at least 3 characters')
    .max(50, 'VM Name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Only letters, numbers, hyphens, and underscores are allowed'),
  description: z.string().max(255).optional(),
  provider: z.literal('Demo Provider'),
  operatingSystem: z.string().min(1, 'Please select an operating system'),
  cpu: z.coerce.number().min(1, 'Minimum 1 vCPU').max(32, 'Maximum 32 vCPU'),
  ramMb: z.coerce.number().min(1024, 'Minimum 1024 MB (1 GB)').max(65536, 'Maximum 65536 MB (64 GB)'),
  diskGb: z.coerce.number().min(10, 'Minimum 10 GB storage').max(1000, 'Maximum 1000 GB storage'),
  region: z.string().min(1, 'Please select a region'),
  environment: z.enum(['Development', 'Testing', 'Production']),
  justification: z
    .string()
    .min(10, 'Business justification must be at least 10 characters')
    .max(1000, 'Justification cannot exceed 1000 characters'),
});

type CreateRequestFormValues = z.infer<typeof createRequestSchema>;

export const CreateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestFormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      name: '',
      description: '',
      provider: 'Demo Provider',
      operatingSystem: 'Ubuntu 22.04 LTS',
      cpu: 2,
      ramMb: 4096,
      diskGb: 50,
      region: 'us-east-1',
      environment: 'Development',
      justification: '',
    },
  });

  const watchedCpu = watch('cpu');
  const watchedRamMb = watch('ramMb');
  const watchedDiskGb = watch('diskGb');

  const onSubmit = async (values: CreateRequestFormValues) => {
    setServerError(null);
    try {
      const created = await requestApi.create(values);
      navigate(`/requests/${created.id}?created=true`);
    } catch (err: unknown) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <Link to="/requests" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Requests
        </Link>
      </div>

      <PageHeader
        title="Request Virtual Machine"
        description="Specify compute, memory, and environment requirements for your simulated infrastructure."
      />

      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Submission Blocked</h4>
            <p className="mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Configuration */}
        <Card header={<h3 className="text-sm font-semibold text-slate-900">1. Basic Identification</h3>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                VM Name *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. dev-auth-service"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Environment *
              </label>
              <select
                {...register('environment')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Development">Development (Dev)</option>
                <option value="Testing">Testing (QA / Staging)</option>
                <option value="Production">Production (Prod)</option>
              </select>
              {errors.environment && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.environment.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Workload Description
              </label>
              <input
                type="text"
                {...register('description')}
                placeholder="e.g. Primary web worker handling customer authentication tokens"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Compute & OS Specifications */}
        <Card header={<h3 className="text-sm font-semibold text-slate-900">2. Resource Specifications & OS</h3>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Operating System *
              </label>
              <select
                {...register('operatingSystem')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS (Jammy Jellyfish)</option>
                <option value="Ubuntu 24.04 LTS">Ubuntu 24.04 LTS (Noble Numbat)</option>
                <option value="Debian 12">Debian 12 (Bookworm)</option>
                <option value="RHEL 9">Red Hat Enterprise Linux 9</option>
                <option value="Windows Server 2022">Windows Server 2022 Datacenter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Infrastructure Provider
              </label>
              <input
                type="text"
                value="Demo Provider (Terraform Local)"
                disabled
                className="w-full px-3.5 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200 rounded-lg cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                vCPU Cores *
              </label>
              <select
                {...register('cpu')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 Core (Small)</option>
                <option value={2}>2 Cores (General Purpose)</option>
                <option value={4}>4 Cores (Compute Intensive)</option>
                <option value={8}>8 Cores (Heavy Processing)</option>
                <option value={16}>16 Cores (High Performance)</option>
              </select>
              {errors.cpu && <p className="text-xs text-red-600 mt-1">{errors.cpu.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                RAM Allocation *
              </label>
              <select
                {...register('ramMb')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1024}>1 GB (1,024 MB)</option>
                <option value={2048}>2 GB (2,048 MB)</option>
                <option value={4096}>4 GB (4,096 MB)</option>
                <option value={8192}>8 GB (8,192 MB)</option>
                <option value={16384}>16 GB (16,384 MB)</option>
                <option value={32768}>32 GB (32,768 MB)</option>
              </select>
              {errors.ramMb && <p className="text-xs text-red-600 mt-1">{errors.ramMb.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Disk Storage (GB) *
              </label>
              <input
                type="number"
                {...register('diskGb')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.diskGb && <p className="text-xs text-red-600 mt-1">{errors.diskGb.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Region *
              </label>
              <select
                {...register('region')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="us-east-1">us-east-1 (N. Virginia)</option>
                <option value="us-west-2">us-west-2 (Oregon)</option>
                <option value="eu-west-1">eu-west-1 (Ireland)</option>
                <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Business Justification */}
        <Card header={<h3 className="text-sm font-semibold text-slate-900">3. Business Justification</h3>}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Justification & Purpose *
            </label>
            <textarea
              {...register('justification')}
              rows={3}
              placeholder="Explain the technical necessity, expected project duration, and business impact to facilitate administrator approval..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.justification && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.justification.message}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Requests are reviewed by infrastructure administrators before Terraform provisioning commences.</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link to="/requests">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="lg" isLoading={isSubmitting}>
            Submit Request for Approval
          </Button>
        </div>
      </form>
    </div>
  );
};
