"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";

/**
 * LoginPage Component - A page that allows users to log in using email/password.
 *
 * This component:
 * - Allows the user to input an email and password to log in.
 * - Sends the login credentials to a backend API for authentication.
 * - Handles loading and error states.
 * - Stores user data (UID and email) in `localStorage` upon successful login.
 *
 * @module frontend/page/src/app/login/page.jsx
 * @returns {JSX.Element} The rendered login page.
 */
export default function LoginPage() {
  const router = useRouter();

  /**
   * The form state holding the user's email and password.
   * @type {Object}
   * @property {string} email - The user's email input.
   * @property {string} password - The user's password input.
   */
  const [form, setForm] = useState({ email: "", password: "" });

  /**
   * The loading state of the form, indicating whether the login request is in progress.
   * @type {boolean}
   */
  const [loading, setLoading] = useState(false);

  /**
   * The error state for displaying error messages during login.
   * @type {string|null}
   */
  const [error, setError] = useState(null);

  /**
   * Handles changes to the form input fields (email and password).
   * Updates the form state accordingly.
   * @function handleChange
   * @param {Event} e - The event triggered by user input.
   * @returns {void}
   */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Handles the form submission for login.
   * Sends a request to the backend API for authentication.
   * Stores user data in localStorage upon successful login.
   * @function handleSubmit
   * @async
   * @param {Event} e - The form submission event.
   * @returns {void}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        email: form.email,
        password: form.password,
      }).toString();

      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login fallito: ${text}`);
      }

      const text = await res.text();

      // Cerca il localId (che rappresenta l'UID)
      const match = text.match(/"localId"\s*:\s*"([^"]+)"/);
      if (!match) {
        throw new Error("Impossibile ottenere UID dell'utente");
      }

      const uid = match[1];
      localStorage.setItem("currentUserId", uid);
      localStorage.setItem("currentUserEmail", form.email);
      router.push("/");
    } catch (err) {
      setError(err.message || "Errore durante il login");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Accedi</h1>
            <p>Inserisci le tue credenziali per accedere</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Inserisci la tua email"
                  value={form.email}
                  onChange={handleChange}
                  required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Inserisci la tua password"
                  value={form.password}
                  onChange={handleChange}
                  required
              />
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" name="remember" />
                <label htmlFor="remember">Ricordami</label>
              </div>
              <a href="#" className="forgot-password">Password dimenticata?</a>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Accesso in corso..." : "Accedi"}
            </button>
          </form>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="login-footer">
            <p>Non hai un account? <a href="/register">Registrati</a></p>
          </div>
        </div>
      </div>
  );
}
