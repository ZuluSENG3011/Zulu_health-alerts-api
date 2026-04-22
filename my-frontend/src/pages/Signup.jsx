import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { signupUser, saveAuth } from "../api/auth";
import styles from "./Auth.module.css";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const data = await signupUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // save token + user
      saveAuth(data);

      // redirect to home (already logged in)
      navigate("/");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />

      <main id="main-content" className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Sign Up</h1>
            <p className={styles.subtitle}>
              Join Health Alert to start tracking personalized disease alerts worldwide.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Username <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email <span className={styles.required}>*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.passwordGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Password <span className={styles.required}>*</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Confirm Password <span className={styles.required}>*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={styles.input}
                  required
                />
              <span className={styles.fieldHint}>Must match the password entered above.</span>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className={styles.footerText}>
            Already have an account?{" "}
            <Link to="/login" className={styles.link}>
              Log in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

export default Signup;