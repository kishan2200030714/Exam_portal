import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  // 🔐 Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // 📚 Exam
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  // ⏱️ Timer
  const [timeLeft, setTimeLeft] = useState(null);
  const [examOver, setExamOver] = useState(false);

  // 🧭 Navigation
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🔐 Login
  const handleLogin = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login/", {
        username,
        password,
      });

      if (res.data.success) {
        setIsLoggedIn(true);
        setLoginError("");
      }
    } catch (err) {
      setLoginError("Invalid username or password");
    }
  };

  // 📝 Register
  const handleRegister = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/register/", {
        username,
        password,
      });

      if (res.data.success) {
        alert("Registration successful! Please login.");
        setIsRegister(false);
      }
    } catch (err) {
      alert("Registration failed. Username may already exist.");
    }
  };

  // 🔄 Load questions + timer from backend
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const qRes = await axios.get("http://127.0.0.1:8000/api/questions/");
        setQuestions(qRes.data);

        const sRes = await axios.get("http://127.0.0.1:8000/api/settings/");
        const minutes = sRes.data.duration_minutes || 5;

        setTimeLeft(minutes * 60); // ⏱️ convert to seconds
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // ⏱️ Timer countdown
  useEffect(() => {
    if (timeLeft === null || examOver) return;

    if (timeLeft <= 0) {
      submitExam();
      setExamOver(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, examOver]);

  const handleChange = (qid, oid) => {
    setAnswers((prev) => ({ ...prev, [qid]: oid }));
  };

  // ✅ Submit exam (FIXED PAYLOAD)
  const submitExam = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/submit/", answers);
      setScore(res.data.score);
      setExamOver(true);
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  // ⏱️ Format time
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;

  // 📊 Progress
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progressPercent =
    totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;
  const currentQuestion = questions[currentIndex];

  // 🔐 Login / Register UI
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isRegister ? "Register" : "Login"}
          </h2>

          <input
            className="w-full p-3 mb-4 rounded bg-slate-700"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="w-full p-3 mb-4 rounded bg-slate-700"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {loginError && (
            <p className="text-red-400 text-sm mb-3">{loginError}</p>
          )}

          {isRegister ? (
            <button
              onClick={handleRegister}
              className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-semibold"
            >
              Register
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold"
            >
              Login
            </button>
          )}

          <p
            className="text-center mt-4 text-sm text-blue-400 cursor-pointer"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </p>
        </div>
      </div>
    );
  }

  // 📝 Exam UI
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">📝 Online Exam Portal</h1>
            <div className="text-sm font-semibold text-red-400">
              ⏱️ Time Left: {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>
              Answered: {answeredCount} / {totalQuestions}
            </span>
            <span>{progressPercent}%</span>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-blue-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading && <div className="text-center">Loading...</div>}

        {!loading && currentQuestion && (
          <>
            <div className="mb-6 bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">
                {currentIndex + 1}. {currentQuestion.text}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700"
                  >
                    <input
                      type="radio"
                      name={`q${currentQuestion.id}`}
                      checked={answers[currentQuestion.id] === opt.id}
                      onChange={() =>
                        handleChange(currentQuestion.id, opt.id)
                      }
                      className="accent-blue-500"
                      disabled={examOver}
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-slate-700 rounded"
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setCurrentIndex((i) =>
                    Math.min(i + 1, questions.length - 1)
                  )
                }
                disabled={currentIndex === questions.length - 1}
                className="px-4 py-2 bg-slate-700 rounded"
              >
                Next
              </button>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={submitExam}
                disabled={!allAnswered || examOver}
                className="px-8 py-3 bg-blue-600 rounded font-semibold"
              >
                Submit Exam
              </button>
            </div>
          </>
        )}

        {score !== null && (
          <div className="mt-8 text-center text-green-400 text-2xl">
            ✅ Your Score: {score} / {questions.length}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;