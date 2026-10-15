import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/ui/Button.js';
import { getApiErrorMessage } from '../services/apiClient.js';
import { Lock, Mail, AlertCircle, ArrowRight, Shield, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const isSessionExpired = queryParams.get('expired') === 'true';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setAuthError(getApiErrorMessage(err));
    }
  };

  const setDemoCredentials = (role: 'admin' | 'dev') => {
    if (role === 'admin') {
      setValue('email', 'admin@infrapilot.local');
      setValue('password', 'AdminPass123!');
    } else {
      setValue('email', 'developer@infrapilot.local');
      setValue('password', 'DevPass123!');
    }
    setAuthError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
        <p className="text-sm text-slate-500 mt-1">
          Select role credentials below or type your company credentials.
        </p>
      </div>

      {isSessionExpired && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Your previous session expired. Please sign in again.</span>
        </div>
      )}

      {authError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{authError}</span>
        </div>
      )}

      {/* Demo Credentials Quick Switcher */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Demo Persona Fast-Login
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDemoCredentials('admin')}
            className="flex items-center gap-2 p-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-medium transition-colors text-left"
          >
            <Shield className="w-4 h-4 text-purple-700 flex-shrink-0" />
            <div>
              <div className="font-semibold">Admin Demo</div>
              <div className="text-[10px] text-purple-600">Full Access</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setDemoCredentials('dev')}
            className="flex items-center gap-2 p-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-medium transition-colors text-left"
          >
            <User className="w-4 h-4 text-blue-700 flex-shrink-0" />
            <div>
              <div className="font-semibold">Developer Demo</div>
              <div className="text-[10px] text-blue-600">Self-Service</div>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Work Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="email"
              {...register('email')}
              placeholder="e.g. developer@infrapilot.local"
              className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>
    </div>
  );
};
