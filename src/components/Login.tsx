// MP42 Jadaene Brown 1903233
import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Sprout } from 'lucide-react';
import { OperationType, handleFirestoreError } from '../lib/authError';

export function Login() {
  const [error, setError] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isRegistering, setIsRegistering] = React.useState(false);

  const setupUserProfile = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create the user profile
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await setupUserProfile(result.user);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in was cancelled or blocked by the browser. If you are viewing this in an embedded preview, please open the application in a new tab.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError(err.message || 'An error occurred during sign in');
      }
      console.error(err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Support the specific admin requirement
    let authEmail = email;
    if (email.toLowerCase() === 'admin') {
      authEmail = 'admin@wnmhelper.com';
    }

    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, authEmail, password);
        await setupUserProfile(result.user);
      } else {
        try {
          const result = await signInWithEmailAndPassword(auth, authEmail, password);
          await setupUserProfile(result.user);
        } catch (signInErr: any) {
          // Auto-register admin if it doesn't exist
          if ((signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/user-not-found') 
              && email.toLowerCase() === 'admin' && password === 'admin123') {
            try {
              const result = await createUserWithEmailAndPassword(auth, authEmail, password);
              await setupUserProfile(result.user);
              return;
            } catch (regErr: any) {
              if (regErr.code !== 'auth/operation-not-allowed') {
                console.error('Failed to auto-register admin', regErr);
              }
            }
          }
          throw signInErr;
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError(err.message || 'An error occurred.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 pb-6 bg-emerald-600 text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white mb-4 overflow-hidden shadow-md">
            <img src="./WNM%20logo%202.png" alt="WNM Logo" className="w-full h-full object-contain p-2" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">WNM Helper</h1>
          <p className="text-emerald-100 text-sm mt-2">{isRegistering ? 'Create your account' : 'Sign in to your account'}</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 border border-red-100">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email or Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-sm"
                placeholder={isRegistering ? "Email address" : "Email or 'admin'"}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-sm"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3 mt-2"
            >
              {isRegistering ? 'Register' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>
          
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3 mb-6 shadow-sm shadow-slate-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm font-medium text-slate-600">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button" 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setEmail(''); setPassword(''); }} 
              className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
            >
              {isRegistering ? 'Sign In' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
