import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '~/components/ui/button';
import { Separator } from "~/components/ui/separator";
import { useTranslation } from 'react-i18next';
import useAuthStore from '~/stores/authStore';
import httpRequest from '~/utils/httpRequest';
import { toast } from 'react-toastify';

const GoogleButton = () => {
    const { t } = useTranslation('auth');
    const { setUser, setIsAuth } = useAuthStore();

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const accessToken = tokenResponse.access_token;
                
                const res = await httpRequest.post('/auth/google/login', {
                    credential: accessToken
                });

                if (res.data.success) {
                    setUser(res.data.user);
                    setIsAuth(true);
                    toast.success(t('auth.success'));
                }
            } catch (err) {
                console.error('Google login error:', err);
                toast.error(err.response?.data?.msg || t('auth.error'));
            }
        },
        onError: (error) => {
            console.error('Google OAuth error:', error);
            toast.error(t('auth.error'));
        },
        scope: 'email profile',
        flow: 'implicit'
    });

    return (
        <div className="space-y-4">
            <Button 
                variant="outline"
                type="button"
                className="w-full h-11 px-4 relative flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700 dark:hover:border-neutral-600 dark:text-white transition-all duration-200"
                onClick={() => login()}
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 48 48" 
                    className="w-5 h-5"
                >
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t('continueWithGoogle')}</span>
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="bg-gray-200 dark:bg-neutral-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-neutral-800 px-2 text-gray-500 dark:text-gray-400">
                        {t('or')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GoogleButton;