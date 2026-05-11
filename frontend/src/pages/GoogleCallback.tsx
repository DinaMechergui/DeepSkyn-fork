import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { setSession } from '@/lib/authSession';
import GoogleRealOAuthService from '@/services/googleRealOAuthService';
import { historyService } from '@/services/historyService';
import { aiService } from '@/services/aiService';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const processingRef = useRef(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          bg: 'bg-green-100',
          icon: <CheckCircle2 className="h-8 w-8 text-green-600" strokeWidth={2} aria-hidden />,
          title: 'Success!'
        };
      case 'error':
        return {
          bg: 'bg-red-100',
          icon: <XCircle className="h-8 w-8 text-red-600" strokeWidth={2} aria-hidden />,
          title: 'Authentication Failed'
        };
      default:
        return {
          bg: 'bg-blue-100',
          icon: <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />,
          title: 'Authenticating with Google...'
        };
    }
  };

  const config = getStatusConfig();

  const handleAuthError = async (error: any) => {
    console.error('Google callback error:', error);
    await historyService.recordLoginAttempt({
      loginMethod: 'google',
      status: 'failed',
      failureReason: error instanceof Error ? error.message : 'Authentication failed',
      used2FA: false,
    });
    setStatus('error');
    const errMessage = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
    setMessage(errMessage);
    setTimeout(() => navigate('/auth/login'), 4000);
  }

  const handleAuthSuccess = async (backendData: any, googleUserInfo: any, aiVerification: any) => {
    const backendToken = backendData.accessToken ?? backendData.token;
    if (!backendToken) throw new Error('Backend did not return an access token');

    const accessExp = backendData.accessTokenExpiresAt
      ? new Date(backendData.accessTokenExpiresAt).toISOString()
      : new Date(Date.now() + 3600000).toISOString();
    const refreshExp = backendData.refreshTokenExpiresAt
      ? new Date(backendData.refreshTokenExpiresAt).toISOString()
      : new Date(Date.now() + 7 * 24 * 3600000).toISOString();

    setSession({
      accessToken: backendToken,
      refreshToken: backendData.refreshToken || 'google_refresh_fallback',
      accessTokenExpiresAt: accessExp,
      refreshTokenExpiresAt: refreshExp,
      user: { ...backendData.user, authMethod: 'google' }
    });

    await historyService.recordLoginAttempt({
      loginMethod: 'google',
      status: 'success',
      used2FA: false,
      aiScore: aiVerification.score,
      aiDetails: aiVerification.details,
    });

    console.log(`✅ Google login successful | Score: ${Math.round(aiVerification.score * 100)}%`);
    setStatus('success');
    setMessage(`Welcome, ${googleUserInfo.name}! Authentication successful. Redirecting...`);
    window.history.replaceState(null, '', window.location.pathname);

    setTimeout(() => {
      const userRole = backendData.user?.role?.toLowerCase()
      navigate(userRole === 'admin' ? '/admin' : '/profile', { replace: true });
    }, 1500);
  }

  const authenticateWithBackend = async (googleUserInfo: any, aiVerification: any) => {
    const backendResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: googleUserInfo.id,
        email: googleUserInfo.email,
        name: googleUserInfo.name,
        picture: googleUserInfo.picture,
        given_name: googleUserInfo.given_name,
        family_name: googleUserInfo.family_name,
        verified_email: googleUserInfo.verified_email,
        aiScore: aiVerification.score,
        photoAnalysis: { quality: aiVerification.details.photoQuality },
        emailAnalysis: { score: aiVerification.details.emailTrust },
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Backend authentication failed');
    }
    return backendResponse.json();
  }

  const getOAuthParams = () => {
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = hash ? new URLSearchParams(hash.substring(1)) : new URLSearchParams();
    return { searchParams, hashParams };
  }

  useEffect(() => {
    const handleCallback = async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        const { searchParams, hashParams } = getOAuthParams();
        const oauthError = searchParams.get('error') || hashParams.get('error');

        if (oauthError) {
          const errorDesc = searchParams.get('error_description') || hashParams.get('error_description') || oauthError;
          throw new Error(errorDesc);
        }

        const idToken = hashParams.get('id_token');
        const accessToken = hashParams.get('access_token');

        if (!idToken && !accessToken) {
          if (searchParams.get('code')) throw new Error('Received authorization code instead of tokens.');
          throw new Error('No authentication data received from Google.');
        }

        const googleUserInfo = await GoogleRealOAuthService.getRealGoogleUserInfo();
        GoogleRealOAuthService.storeUserInfo(googleUserInfo);

        const aiVerification = await aiService.verifyIdentity({
          name: googleUserInfo.name,
          email: googleUserInfo.email,
          picture: googleUserInfo.picture,
          googleName: googleUserInfo.name,
        });

        const backendData = await authenticateWithBackend(googleUserInfo, aiVerification);
        await handleAuthSuccess(backendData, googleUserInfo, aiVerification);

      } catch (error) {
        await handleAuthError(error);
      }
    };
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${config.bg}`}>
            {config.icon}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {config.title}
        </h1>

        <p className="text-slate-600 max-w-sm mx-auto">
          {message}
        </p>

        {status === 'error' && (
          <button
            onClick={() => navigate('/auth/login')}
            className="mt-4 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0a7a70] transition-colors"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
