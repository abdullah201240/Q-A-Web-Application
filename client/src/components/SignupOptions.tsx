import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useTheme } from "@/hooks/use-theme";
import { User, Mail, Building2, ArrowRight } from 'lucide-react';

interface SignupOptionsProps {
  onSelect: (option: string) => void;
  onLoginClick: () => void;
}

export function SignupOptions({ onSelect, onLoginClick }: SignupOptionsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className={`${isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/90 border-gray-200/50'} backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden`}>
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Choose how you want to sign up
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button 
            variant="outline" 
            className="w-full h-12 text-base"
            onClick={() => onSelect('email')}
          >
            <Mail className="mr-2 h-4 w-4" />
            Sign up with Email
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-12 text-base"
            onClick={() => onSelect('google')}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={`px-2 ${isDark ? 'bg-slate-800/90 text-gray-400' : 'bg-white/90 text-gray-500'}`}>
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-12"
              onClick={() => onSelect('individual')}
            >
              <User className="mr-2 h-4 w-4" />
              Individual
            </Button>
            <Button 
              variant="outline" 
              className="h-12"
              onClick={() => onSelect('business')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Business
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <Button 
            className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            onClick={() => onSelect('getStarted')}
          >
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-sm text-center">
            Already have an account?{' '}
            <button 
              onClick={onLoginClick}
              className="text-blue-500 hover:underline font-medium"
            >
              Log in
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
