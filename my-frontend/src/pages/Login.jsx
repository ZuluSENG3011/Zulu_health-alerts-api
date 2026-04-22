import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { loginUser, saveAuth } from "../api/auth";
import styles from "./Auth.module.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
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
    setLoading(true);

    try {
      const data = await loginUser({
        username: formData.username,
        password: formData.password,
      });

      saveAuth(data);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
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
            <h1 className={styles.title}>Log in</h1>
            <p className={styles.subtitle}>
              Welcome back. Please enter your details.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
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
              <label className={styles.label}>Password</label>
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

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className={styles.footerText}>
            Don&apos;t have an account?{" "}
            <Link to="/signup" className={styles.link}>
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

export default Login;