import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocationSummary } from "../api/alerts";
import { isLoggedIn } from "../api/auth";
import styles from "./TravelInsightChatbot.module.css";
import chatbotIcon from "../assets/chat-bot.svg";

function TravelInsightChatbot({ location, resetKey }) {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [options, setOptions] = useState([]);
  const [loadingDots, setLoadingDots] = useState(".");
  const [showNotification, setShowNotification] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);

  useEffect(() => {
    setIsOpen(false);
    setSummaryData(null);
    setError("");
    setMessages([]);
    setOptions([]);
    setLoading(false);
    setLoadingDots(".");
    setShowNotification(!!location);
    setLoginRequired(false);
  }, [resetKey, location]);

  useEffect(() => {
    if (!isOpen || !location || loading) return;

    if (!isLoggedIn()) {
      setLoginRequired(true);
      setSummaryData(null);
      setMessages([]);
      setOptions([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoginRequired(false);

    async function fetchSummary() {
      try {
        setLoading(true);
        setError("");

        const data = await getLocationSummary({
          location,
          window: "6month",
        });

        setSummaryData(data);
        setMessages([
          {
            sender: "bot",
            text: `Here is the travel health insight for ${location}. What would you like to view?`,
          },
        ]);
        setOptions([
          "Overall Summary",
          "Risk Level",
          "Key Reasons",
          "Major Threats",
          "Potential Threats",
        ]);
      } catch (err) {
        setError(err.message || "Failed to load AI insight.");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [isOpen, location]);

  const resetMenu = () => {
    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: `What would you like to view next for ${location}?`,
      },
    ]);

    setOptions([
      "Overall Summary",
      "Risk Level",
      "Key Reasons",
      "Major Threats",
      "Potential Threats",
    ]);
  };

  const handleOptionClick = (option) => {
    if (!summaryData?.summary) return;

    const overall = summaryData.summary.overall_assessment;
    const majorThreats = summaryData.summary.major_threats;
    const potentialThreats = summaryData.summary.potential_threats;

    setMessages((prev) => [...prev, { sender: "user", text: option }]);

    if (option === "Overall Summary") {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: overall?.summary || "No summary available.",
        },
      ]);
      setOptions([
        "Risk Level",
        "Key Reasons",
        "Major Threats",
        "Back to Menu",
      ]);
      return;
    }

    if (option === "Risk Level") {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `The current risk level for ${location} is ${overall?.overall_risk_level || "unknown"}.`,
        },
      ]);
      setOptions([
        "Key Reasons",
        "Major Threats",
        "Potential Threats",
        "Back to Menu",
      ]);
      return;
    }

    if (option === "Key Reasons") {
      const reasons = overall?.key_reasons || [];
      const text =
        reasons.length > 0
          ? `Main reasons:\n• ${reasons.join("\n• ")}`
          : "No key reasons available.";

      setMessages((prev) => [...prev, { sender: "bot", text }]);
      setOptions(["Major Threats", "Potential Threats", "Back to Menu"]);
      return;
    }

    if (option === "Major Threats") {
      const highExposure = majorThreats?.high_exposure || [];
      const highSeverity = majorThreats?.high_severity || [];
      const allThreats = [...highExposure, ...highSeverity];
      const uniqueDiseases = [
        ...new Set(allThreats.map((item) => item.disease)),
      ];

      const text =
        uniqueDiseases.length > 0
          ? `Major threats:\n• ${uniqueDiseases.join("\n• ")}`
          : "No major threats available.";

      setMessages((prev) => [...prev, { sender: "bot", text }]);
      setOptions(["Potential Threats", "Back to Menu"]);
      return;
    }

    if (option === "Potential Threats") {
      const threats = potentialThreats?.other_relevant_threats || [];
      const uniqueDiseases = [...new Set(threats.map((item) => item.disease))];

      const text =
        uniqueDiseases.length > 0
          ? `Potential threats:\n• ${uniqueDiseases.join("\n• ")}`
          : "No potential threats available.";

      setMessages((prev) => [...prev, { sender: "bot", text }]);
      setOptions(["Back to Menu"]);
      return;
    }

    if (option === "Back to Menu") {
      resetMenu();
    }
  };

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setLoadingDots((prev) => {
        if (prev === "...") return ".";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setShowNotification(false);
      }
      return next;
    });
  };

  if (!location) return null;

  return (
    <div className={styles.wrapper}>
      {isOpen && (
        <div className={styles.chatbox}>
          <div className={styles.header}>AI Travel Insight</div>

          <div className={styles.messages}>
            {loading && (
              <div className={styles.botMessage}>
                Loading AI travel insight{loadingDots}
              </div>
            )}

            {loginRequired && (
              <div className={styles.botMessage}>
                You need to{" "}
                <span
                  onClick={() => navigate("/login")}
                  style={{
                    color: "#255ad4",
                    cursor: "pointer",
                    fontWeight: "600",
                    textDecoration: "underline",
                  }}
                >
                  login
                </span>{" "}
                to access the AI feature.
              </div>
            )}

            {error && <div className={styles.botMessage}>Error: {error}</div>}

            {!loading &&
              !error &&
              !loginRequired &&
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={
                    msg.sender === "bot"
                      ? styles.botMessage
                      : styles.userMessage
                  }
                >
                  {msg.text.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              ))}
          </div>

          {!loading && !error && !loginRequired && options.length > 0 && (
            <div className={styles.options}>
              {options.map((option) => (
                <button
                  key={option}
                  className={styles.optionButton}
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button className={styles.floatingTab} onClick={handleToggle}>
        {showNotification && <span className={styles.redDot}></span>}

        {isOpen ? (
          <>
            <span className={styles.closeIcon}>⌄</span>
            <span className={styles.tabLabel}>Close</span>
          </>
        ) : (
          <>
            <span className={styles.tabLabel}>AI Summary</span>
            <img
              src={chatbotIcon}
              alt="AI chatbot"
              className={styles.tabIcon}
            />
          </>
        )}
      </button>
    </div>
  );
}

export default TravelInsightChatbot;
