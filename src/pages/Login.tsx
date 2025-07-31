import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent">
      <h2 className="text-2xl mb-6">{isSignup ? 'Sign Up' : 'Log In'}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="email"
          placeholder="Email"
          className="p-2 rounded bg-slate-800 border border-slate-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="p-2 rounded bg-slate-800 border border-slate-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="p-2 bg-blue-600 rounded hover:bg-blue-700">
          {isSignup ? 'Sign Up' : 'Log In'}
        </button>
      </form>
      <button
        className="mt-4 text-sm underline"
        onClick={() => setIsSignup(!isSignup)}
      >
        {isSignup ? 'Already have an account? Log in' : 'New here? Sign up'}
      </button>
    </div>
  );
};

export default Login;