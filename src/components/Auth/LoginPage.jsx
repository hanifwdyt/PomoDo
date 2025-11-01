import { useState, useEffect } from "react";
import { authAPI } from "../../services/api";
import { Moon, Sun, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }, [darkMode])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        await authAPI.register(email, password);
        setSuccessMessage("Registration successful! Please check your email to verify.");
        // Reset form
        setEmail("");
        setPassword("");
        // Auto switch to login after 3 seconds
        setTimeout(() => {
          setIsRegister(false);
          setSuccessMessage("");
        }, 3000);
      } else {
        await authAPI.login(email, password);
        setSuccessMessage("Welcome back! Redirecting...");
        // Small delay for better UX
        setTimeout(() => {
          onLoginSuccess?.();
        }, 800);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark-bg' : 'bg-neutral-50'} font-lora transition-colors`}>
      {/* Mobile: Full height layout with proper spacing */}
      <div className="min-h-screen flex flex-col justify-between md:justify-center md:items-center py-8 md:py-0">
        {/* Theme toggle - Better mobile position */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`fixed top-4 right-4 p-2.5 rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300 hover:text-white' : 'bg-white text-neutral-600 hover:text-neutral-800'} transition-all shadow-sm z-50 md:absolute md:shadow-none md:bg-transparent`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-sm px-5 md:px-4 mx-auto">
          {/* Branding - Responsive sizing */}
          <div className="text-center mb-6 md:mb-8 mt-4 md:mt-0">
            <h1 className={`text-4xl md:text-5xl font-light tracking-tight ${darkMode ? 'text-dark-text' : 'text-neutral-800'} mb-1.5 md:mb-2`}>
              PomoDo
            </h1>
            <p className={`text-xs md:text-sm ${darkMode ? 'text-dark-muted' : 'text-neutral-500'}`}>Focus, Complete, Achieve</p>
          </div>

          {/* Card - Responsive padding */}
          <div className={`${darkMode ? 'bg-dark-card border-dark-border/30' : 'bg-white border-neutral-200'} border rounded-lg md:rounded-xl p-6 md:p-8 shadow-sm md:shadow-md`}>
          <h2 className={`text-xl md:text-2xl font-light text-center mb-6 md:mb-8 ${darkMode ? 'text-dark-text' : 'text-neutral-900'}`}>
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-3 ${darkMode ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-600'} border rounded text-sm flex items-start gap-2 animate-slideIn`}>
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className={`mb-4 p-3 ${darkMode ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-green-50 border-green-200 text-green-600'} border rounded text-sm flex items-start gap-2 animate-slideIn`}>
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4" role="form" aria-label={isRegister ? "Registration form" : "Login form"}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border ${darkMode ? 'bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500' : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'} rounded focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-500' : 'focus:ring-neutral-300'} transition-all`}
                required
                disabled={loading}
                autoComplete="email"
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
              />
            </div>

            {/* Password Input with Toggle */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border ${darkMode ? 'bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500' : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'} rounded focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-500' : 'focus:ring-neutral-300'} transition-all`}
                required
                disabled={loading}
                minLength={6}
                autoComplete={isRegister ? "new-password" : "current-password"}
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
                aria-describedby="password-hint"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${darkMode ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-700'} transition-colors`}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {isRegister && (
                <p id="password-hint" className={`text-xs ${darkMode ? 'text-dark-muted' : 'text-neutral-500'} mt-1.5 ml-1`}>
                  Minimum 6 characters
                </p>
              )}
            </div>

            {/* Forgot Password Link (only on login) */}
            {!isRegister && (
              <div className="text-right">
                <button
                  type="button"
                  className={`text-xs ${darkMode ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-700'} transition-colors`}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 ${darkMode ? 'bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200' : 'bg-neutral-800 text-white hover:bg-neutral-900 active:bg-black'} rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2`}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isRegister ? "Creating account..." : "Signing in..."}</span>
                </>
              ) : (
                <span>{isRegister ? "Create Account" : "Sign In"}</span>
              )}
            </button>
          </form>

          <p className={`text-center text-sm ${darkMode ? 'text-dark-muted' : 'text-neutral-500'} mt-5 md:mt-4`}>
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className={`${darkMode ? 'text-white hover:underline' : 'text-neutral-800 hover:underline'} ml-1 transition-colors`}
              disabled={loading}
            >
              {isRegister ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>

        {/* Subtle footer - only on mobile */}
        <div className="md:hidden text-center pb-6 px-4">
          <p className={`text-xs ${darkMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Made with focus and simplicity
          </p>
        </div>
      </div>
    </div>
  );
}
