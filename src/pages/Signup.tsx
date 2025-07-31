// pages/Login.tsx
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Logged in!");
      window.location.href = "/"; // redirect to home
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="p-4 text-white">
      <h2 className="text-2xl mb-4">Sign Up</h2>
      <input className="block w-full p-2 mb-2 text-black" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input className="block w-full p-2 mb-2 text-black" type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button className="bg-blue-600 px-4 py-2 rounded" onClick={login}>Login</button>
    </div>
  );
}