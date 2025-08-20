import { useEffect, useState } from 'react';
import { Eye, EyeOff, FileText, MessageSquare, Moon, Sparkles, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { z } from 'zod';

interface SignupPageProps {
  onLoginClick: () => void;
  onSignupSuccess: () => void;
}

export default function SignupPage({ onLoginClick, onSignupSuccess }: SignupPageProps) {
  const { theme, setTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const signupSchema = z
    .object({
      name: z.string().min(2, 'Full name must be at least 2 characters'),
      email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters'),
      confirmPassword: z.string().min(1, 'Please confirm your password')
    })
    .superRefine((values, ctx) => {
      if (values.password !== values.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['confirmPassword'],
          message: 'Passwords do not match'
        });
      }
    });

  type SignupFormData = z.infer<typeof signupSchema>;

  const validateAllFields = (data: SignupFormData) => {
    const result = signupSchema.safeParse(data);
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;
      setFieldErrors({
        name: flattened.name?.[0],
        email: flattened.email?.[0],
        password: flattened.password?.[0],
        confirmPassword: flattened.confirmPassword?.[0]
      });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    const isValid = validateAllFields({ name, email, password, confirmPassword });
    if (!isValid) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSignupSuccess();
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50'
    }`}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute animate-pulse ${
              isDark ? 'bg-purple-400/10' : 'bg-indigo-400/20'
            } rounded-full`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`
            }}
          />
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10 group">
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
            isDark
              ? 'bg-slate-800/80 text-yellow-400 hover:bg-slate-700/80 hover:shadow-[0_0_15px_rgba(250,204,21,0.3)]'
              : 'bg-white/80 text-indigo-600 hover:bg-white/90 hover:shadow-[0_0_15px_rgba(79,70,229,0.2)]'
          } backdrop-blur-sm shadow-lg`}
        >
          <div className="relative">
            {isDark ? (
              <Sun size={20} className="animate-pulse" />
            ) : (
              <Moon size={20} className="animate-float" />
            )}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max px-2 py-1 text-xs rounded-md bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className={`w-full max-w-2xl  ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          {/* Main Card */}
          <div className={`${
            isDark 
              ? 'bg-slate-800/90 border-slate-700/50' 
              : 'bg-white/90 border-gray-200/50'
          } backdrop-blur-xl rounded-2xl border shadow-2xl p-8 relative overflow-hidden`}>
            {/* Gradient overlay */}
            <div className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-r from-purple-600/10 to-blue-600/10' 
                : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
            } rounded-2xl`} />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  isDark 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                } shadow-lg transform hover:scale-110 transition-all duration-300`}>
                  <div className="flex items-center space-x-1">
                    <FileText size={14} className="text-white" />
                    <MessageSquare size={16} className="text-white" />
                    <Sparkles size={12} className="text-white animate-pulse" />
                  </div>
                </div>

                <h1 className={`text-2xl font-bold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                } animate-fade-in`}>
                  Create your account
                </h1>

                <p className={`${
                  isDark ? 'text-slate-400' : 'text-gray-600'
                } animate-fade-in-delay`}>
                  Join the AI-Powered Document Intelligence
                </p>
              </div>

              

              {/* Signup Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="group">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  } group-focus-within:text-indigo-600 transition-colors`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => validateAllFields({ name, email, password, confirmPassword })}
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:bg-slate-700/80'
                        : 'bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                    } ${fieldErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500'} backdrop-blur-sm`}
                    placeholder="Enter your name"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="group">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  } group-focus-within:text-indigo-600 transition-colors`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => validateAllFields({ name, email, password, confirmPassword })}
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:bg-slate-700/80'
                        : 'bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                    } ${fieldErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500'} backdrop-blur-sm`}
                    placeholder="Enter your email"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="group">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  } group-focus-within:text-indigo-600 transition-colors`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => validateAllFields({ name, email, password, confirmPassword })}
                      className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-300 focus:ring-2 focus:border-transparent ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:bg-slate-700/80'
                          : 'bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                      } ${fieldErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500'} backdrop-blur-sm`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                        isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                      } transition-colors`}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="group">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  } group-focus-within:text-indigo-600 transition-colors`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => validateAllFields({ name, email, password, confirmPassword })}
                      className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-300 focus:ring-2 focus:border-transparent ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:bg-slate-700/80'
                          : 'bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                      } ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500'} backdrop-blur-sm`}
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                        isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                      } transition-colors`}
                    >
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                {error && (
                  <div className={`sm:col-span-2 ${isDark ? 'text-red-300' : 'text-red-600'} text-sm`}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`sm:col-span-2 w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white focus:ring-purple-500'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white focus:ring-indigo-500'
                  } shadow-lg`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              {/* Footer */}
              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    onLoginClick();
                  }}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Log in here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


