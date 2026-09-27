import { useEffect, useMemo, useState } from "react";
import {
  getAvailability,
  getAvailabilityData,
  createBooking,
  type AvailabilitySlot,
  type BookingResult,
} from "./services/api";

const MENTOR_IMAGE_URL = `${import.meta.env.BASE_URL}mentor.jpg`;

const formatTimezone = (timezone?: string) => (timezone || "America/New_York").replace(/_/g, " ");

type IconName =
  | "arrow"
  | "calendar"
  | "check"
  | "clock"
  | "code"
  | "copy"
  | "globe"
  | "menu"
  | "message"
  | "moon"
  | "play"
  | "spark"
  | "sun"
  | "book"
  | "user"
  | "shield"
  | "award"
  | "heart"
  | "zap"
  | "chevronDown"
  | "tv"
  | "cpu"
  | "phone"
  | "star";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 7" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    code: <><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 6l-4 12" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    menu: <><path d="M5 8h14M5 16h14" /></>,
    message: <><path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.6L3 21l1.9-5.8A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></>,
    moon: <path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    spark: <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM19 16l.6 1.4L21 18l-1.4.6L19 20l-.6-1.4L17 18l1.4-.6L19 16Z" />,
    sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    award: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>,
    heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    tv: <><rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></>,
    cpu: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></>,
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  style?: React.CSSProperties;
};

function ActionButton({ children, className = "", disabled, onClick, variant = "primary", style }: ButtonProps) {
  return <button type="button" style={style} disabled={disabled} onClick={onClick} className={`button button--${variant} ${className}`}>{children}</button>;
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <div className="brand" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <svg className="brand-logo" aria-hidden="true" viewBox="0 0 280 368" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FFF200" d="M41 0 141 17 123 154 177 164 177 264 0 238Z" />
        <path fill="#FFB900" d="M34 264h244v104H34zM177 125h101v139H177z" />
        <path fill="#FF6428" d="m177 136 82 14-18 126-64-12z" />
      </svg>
      <span>codeyoung</span>
    </div>
  );
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <ActionButton variant="ghost" className={`theme-toggle ${dark ? "is-dark" : ""}`} onClick={onToggle}>
      <span className="theme-toggle__track"><span className="theme-toggle__thumb">{dark ? <Icon name="moon" size={13} /> : <Icon name="sun" size={13} />}</span></span>
      <span className="sr-only">Switch to {dark ? "light" : "dark"} theme</span>
    </ActionButton>
  );
}

function Header({
  activeView,
  onNavigate,
  dark,
  onTheme,
  loading = false,
}: {
  activeView: string;
  onNavigate: (view: "landing" | "booking" | "programs" | "how-it-works" | "for-parents") => void;
  dark: boolean;
  onTheme: () => void;
  loading?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="nav shell">
      <Brand onClick={() => onNavigate("landing")} />
      <div className={`nav-links ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
        <ActionButton
          variant="ghost"
          style={{ color: activeView === "landing" ? "var(--brand)" : "inherit", fontWeight: activeView === "landing" ? 800 : 600 }}
          onClick={() => onNavigate("landing")}
        >
          Home
        </ActionButton>
        <ActionButton
          variant="ghost"
          style={{ color: activeView === "programs" ? "var(--brand)" : "inherit", fontWeight: activeView === "programs" ? 800 : 600 }}
          onClick={() => onNavigate("programs")}
        >
          Programs
        </ActionButton>
        <ActionButton
          variant="ghost"
          style={{ color: activeView === "how-it-works" ? "var(--brand)" : "inherit", fontWeight: activeView === "how-it-works" ? 800 : 600 }}
          onClick={() => onNavigate("how-it-works")}
        >
          How It Works
        </ActionButton>
        <ActionButton
          variant="ghost"
          style={{ color: activeView === "for-parents" ? "var(--brand)" : "inherit", fontWeight: activeView === "for-parents" ? 800 : 600 }}
          onClick={() => onNavigate("for-parents")}
        >
          For Parents
        </ActionButton>
      </div>
      <div className="nav-actions">
        <ThemeToggle dark={dark} onToggle={onTheme} />
        <ActionButton
          className={`nav-cta ${loading ? "is-loading" : ""}`}
          onClick={() => onNavigate("booking")}
          disabled={loading}
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", boxShadow: "0 8px 20px rgba(245, 158, 11, 0.3)" }}
        >
          {loading ? <><span className="button-loader" /> Preparing...</> : <>Book a Free Trial <Icon name="arrow" size={17} /></>}
        </ActionButton>
        <ActionButton variant="ghost" className={`menu-toggle ${menuOpen ? "is-open" : ""}`} onClick={() => setMenuOpen((open) => !open)}><span /><span /></ActionButton>
      </div>
    </div>
  );
}

function DemoChatbotWidget({ onBook }: { onBook: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"booking" | "general">("booking");
  const [messages, setMessages] = useState([
    { id: 1, role: "bot", text: "Hi! 👋 I'm the Codeyoung assistant." },
    { id: 2, role: "bot", text: "Let's book a free coding trial class for your child." },
  ]);
  const [generalMessages, setGeneralMessages] = useState([
    { id: 1, role: "bot", text: "Hi! Ask me anything about our classes, mentors, or free trial." },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "details" | "time" | "mentor" | "review" | "confirmed">("idle");
  const [session, setSession] = useState({
    studentName: "",
    age: "",
    grade: "",
    experience: "",
    studentEmail: "",
    parentName: "",
    parentEmail: "",
    phone: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    date: "",
    time: "",
    mentor: null as null | { id: string; name: string; email: string; role: string; timezone: string },
  });
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const pushBot = (text: string) => {
    setMessages((current) => [...current, { id: Date.now() + Math.random(), role: "bot", text }]);
  };

  const addUserText = (text: string) => {
    setMessages((current) => [...current, { id: Date.now() + Math.random(), role: "user", text }]);
  };

  const sendGeneralMessage = (value = input) => {
    const text = value.trim();
    if (!text || typing) return;

    setGeneralMessages((current) => [...current, { id: Date.now() + Math.random(), role: "user", text }]);
    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      const question = text.toLowerCase();
      let reply = "I can help with our free trial, class format, age groups, programs, mentors, and scheduling. Ask me a question or choose one of the suggestions below.";

      if (/\b(price|cost|free|payment|charge)\b/.test(question)) {
        reply = "The private 45-minute trial is 100% free. No credit card or payment details are needed, and there’s no commitment to continue.";
      } else if (/\b(prepare|bring|equipment|device|laptop|computer|webcam|microphone|browser)\b/.test(question)) {
        reply = "Please use a laptop or desktop with a webcam, microphone, and Chrome or Firefox. A tablet isn’t recommended because your child will be coding during the lesson.";
      } else if (/\b(beginner|experience|first time|never coded|prior coding)\b/.test(question)) {
        reply = "No previous coding experience is needed. The mentor will meet your child at their current level and adjust the lesson as they go.";
      } else if (/\b(age|ages|old|grade|program|course|curriculum)\b/.test(question)) {
        reply = "Programs are available for ages 6–17: Scratch and game design for younger learners, Python and robotics for ages 10–13, and AI, web, and app development for ages 14–17. Lessons are personalized to each learner.";
      } else if (/\b(mentor|teacher|instructor)\b/.test(question)) {
        reply = "Every trial is a private, one-to-one live class with an experienced coding mentor. We match the mentor to the learner’s age, interests, and selected time.";
      } else if (/\b(book|booking|schedule|reserve|time|appointment)\b/.test(question)) {
        reply = "Choose Booking below to get started. Enter the student and parent details, pick a weekday and timezone, then select an available class time and mentor.";
      } else if (/\b(timezone|time zone|local time|weekday|weekend|availability|available)\b/.test(question)) {
        reply = "You can choose a weekday and timezone in the booking flow. Available times are shown in the timezone you select; mentors operate Monday through Friday.";
      } else if (/\b(online|virtual|location|where|video)\b/.test(question)) {
        reply = "Classes are live and online in a private one-to-one classroom. Your booking confirmation includes the class link.";
      } else if (/\b(what happens|what will|learn|project|format|duration|long|minutes|class|trial|lesson|session)\b/.test(question)) {
        reply = "The free trial is a 45-minute live, one-to-one lesson. Your child meets their mentor, explores a coding idea, and builds a small hands-on project—with guidance tailored to their experience.";
      }

      setGeneralMessages((current) => [...current, { id: Date.now() + Math.random(), role: "bot", text: reply }]);
      setTyping(false);
    }, 350);
  };

  const getNextAvailableDate = () => {
    const dates = useDates();
    return dates.find((date) => !date.disabled)?.id || dates[0]?.id || new Date().toISOString().slice(0, 10);
  };

  const loadAvailability = async (nextDate?: string, nextTimezone?: string) => {
    const chosenDate = nextDate || session.date || getNextAvailableDate();
    const chosenTimezone = nextTimezone || session.timezone || "America/New_York";

    setSlotLoading(true);
    setErrorMessage("");

    try {
      const data = await getAvailabilityData(chosenDate, chosenTimezone);
      setAvailableSlots(data.slots.filter((slot) => slot.available));
      setSession((current) => ({ ...current, date: chosenDate, timezone: chosenTimezone }));
      if (data.slots.some((slot) => slot.available)) {
        return true;
      }
      pushBot("I couldn’t find a live slot for that day. Let’s pick another date.");
      return false;
    } catch (err: any) {
      setErrorMessage(err.message || "Live availability is unavailable right now.");
      pushBot("I’m having trouble loading the live booking slots right now. Please try again in a moment.");
      return false;
    } finally {
      setSlotLoading(false);
    }
  };

  const handleStart = async () => {
    setIsOpen(true);
    if (status !== "idle") return;
    setStatus("details");
    setMessages((current) => [...current, { id: Date.now() + Math.random(), role: "bot", text: "Start Booking" }]);
    setTimeout(() => {
      pushBot("Great! First, tell me your child's name.");
    }, 250);
  };

  const validateForm = () => {
    if (!session.studentName.trim()) {
      setErrorMessage("Please enter your child’s name.");
      return false;
    }
    if (!session.age) {
      setErrorMessage("Please select your child’s age.");
      return false;
    }
    if (!session.grade) {
      setErrorMessage("Please select your child’s grade.");
      return false;
    }
    if (!session.parentName.trim()) {
      setErrorMessage("Please enter the parent or guardian’s name.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session.parentEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }
    if (session.studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session.studentEmail)) {
      setErrorMessage("Please enter a valid student email address or leave it blank.");
      return false;
    }
    return true;
  };

  const handleDetailsComplete = async () => {
    if (!validateForm()) {
      return;
    }

    setStatus("time");
    setErrorMessage("");
    pushBot("Great! Now let’s find a convenient time for the trial class.");
    const fallbackDate = getNextAvailableDate();
    setSession((current) => ({ ...current, date: fallbackDate }));
    await loadAvailability(fallbackDate, session.timezone);
  };

  const chooseSlot = async (timeLabel: string) => {
    if (isSubmitting) return;
    setSession((current) => ({ ...current, time: timeLabel }));
    setErrorMessage("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushBot(`I’m checking mentor availability for ${timeLabel} in ${session.timezone}.`);
    }, 350);

    const selectedSlot = availableSlots.find((slot) => slot.time === timeLabel);
    if (!selectedSlot || selectedSlot.available === false) {
      setErrorMessage("That slot is no longer available. Please choose a different time.");
      setStatus("time");
      return;
    }

    const mentorName = selectedSlot.mentorPreview?.name || selectedSlot.availableMentors?.[0]?.name;
    if (!mentorName) {
      setErrorMessage("I couldn’t find a mentor for this time. Please choose another slot.");
      setStatus("time");
      return;
    }

    const chosenMentor = {
      id: selectedSlot.mentorPreview?.id || selectedSlot.availableMentors?.[0]?.id || "",
      name: mentorName,
      email: "",
      role: "Codeyoung Mentor",
      timezone: session.timezone,
    };

    setSession((current) => ({ ...current, mentor: chosenMentor }));
    setStatus("mentor");
    setTimeout(() => {
      pushBot(`You’re matched! 🎉\n${mentorName}\nCodeyoung Mentor`);
      pushBot(`Selected class time: ${session.date} at ${timeLabel} (${formatTimezone(session.timezone)}).`);
    }, 250);
  };

  const handleConfirmBooking = async () => {
    if (isSubmitting || !session.date || !session.time) return;
    setIsSubmitting(true);
    setErrorMessage("");
    pushBot("Confirming your booking and securing the mentor slot...");

    try {
      const result = await createBooking({
        parent: {
          fullName: session.parentName,
          email: session.parentEmail,
          phone: session.phone || undefined,
          timezone: session.timezone,
        },
        student: {
          firstName: session.studentName,
          age: session.age,
          grade: session.grade,
          codingExperience: session.experience || undefined,
          email: session.studentEmail || undefined,
        },
        date: session.date,
        time: session.time,
        timezone: session.timezone,
        mentorId: session.mentor?.id || undefined,
      });

      setBookingResult(result);
      setStatus("confirmed");
      setIsSubmitting(false);
      pushBot(`Your booking is confirmed!\nBooking ID: ${result.id}\nClass link: ${result.classLink}`);
      pushBot("A confirmation email has been triggered for the parent and mentor.");
    } catch (err: any) {
      const msg = err.message || "Something went wrong. Please try again.";
      if (err.statusCode === 409) {
        setErrorMessage("That time was just taken. Let's choose another time.");
        setStatus("time");
        pushBot("That time was just taken. Let’s find another available slot.");
      } else {
        setErrorMessage(msg);
        pushBot("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  const handleFieldSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "general") {
      sendGeneralMessage();
      return;
    }
    if (status === "details") {
      handleDetailsComplete();
      return;
    }
    if (status === "review") {
      handleConfirmBooking();
      return;
    }
    if (status === "idle") {
      handleStart();
      return;
    }
  };

  useEffect(() => {
    if (!isOpen || mode !== "booking") return;
    if (status === "time" && session.date) {
      loadAvailability(session.date, session.timezone);
    }
  }, [status, isOpen, mode, session.date, session.timezone]);

  const dateChoices = useDates();
  const visibleMessages = mode === "booking" ? messages : generalMessages;

  return (
    <>
      {!isOpen && (
        <button type="button" className="demo-chatbot-fab" aria-label="Open booking assistant" onClick={() => setIsOpen(true)}>
          <Icon name="message" size={23} />
        </button>
      )}

      {isOpen && (
        <aside className="demo-chatbot" aria-label="Demo class assistant">
          <div className="demo-chatbot__header">
            <div className="demo-chatbot__avatar">AI</div>
            <div>
              <strong>Codeyoung assistant</strong>
              <span>{mode === "booking" ? "Book a free trial" : "General questions"}</span>
            </div>
            <button type="button" className="demo-chatbot__close" onClick={() => setIsOpen(false)} aria-label="Close assistant">×</button>
          </div>

          <div className="demo-chatbot__messages">
            {visibleMessages.map((message) => (
              <div key={message.id} className={`chat-bubble chat-bubble--${message.role}`}>
                {message.text.split("\n").map((line, index) => (
                  <span key={`${message.id}-${index}`} style={{ display: "block" }}>{line}</span>
                ))}
              </div>
            ))}

            {typing && (
              <div className="chat-bubble chat-bubble--bot chat-bubble--typing" aria-live="polite">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}
          </div>

          {mode === "general" && (
            <div className="demo-chatbot__suggestions">
              <span>Popular questions</span>
              <button type="button" className="chat-option" disabled={typing} onClick={() => sendGeneralMessage("Is the trial class free?")}>Is the trial class free?</button>
              <button type="button" className="chat-option" disabled={typing} onClick={() => sendGeneralMessage("What ages do you teach?")}>What ages do you teach?</button>
              <button type="button" className="chat-option" disabled={typing} onClick={() => sendGeneralMessage("What happens during a trial?")}>What happens during a trial?</button>
              <button type="button" className="chat-option" disabled={typing} onClick={() => sendGeneralMessage("What should my child prepare?")}>What should my child prepare?</button>
              <button type="button" className="chat-option" disabled={typing} onClick={() => sendGeneralMessage("How do I book a class?")}>How do I book a class?</button>
            </div>
          )}

          {mode === "booking" && status === "details" && (
            <div className="chat-form-card">
              <div className="chat-form-row">
                <input
                  value={session.studentName}
                  onChange={(event) => setSession((current) => ({ ...current, studentName: event.target.value }))}
                  placeholder="Child's name"
                />
              </div>
              <div className="chat-form-row chat-form-row--two">
                <select value={session.age} onChange={(event) => setSession((current) => ({ ...current, age: event.target.value }))}>
                  <option value="">Age</option>
                  {AGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <select value={session.grade} onChange={(event) => setSession((current) => ({ ...current, grade: event.target.value }))}>
                  <option value="">Grade</option>
                  {GRADE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="chat-form-row">
                <input
                  value={session.parentName}
                  onChange={(event) => setSession((current) => ({ ...current, parentName: event.target.value }))}
                  placeholder="Parent / guardian name"
                />
              </div>
              <div className="chat-form-row">
                <input
                  type="email"
                  value={session.parentEmail}
                  onChange={(event) => setSession((current) => ({ ...current, parentEmail: event.target.value }))}
                  placeholder="Parent email address"
                />
              </div>
              <div className="chat-form-row">
                <input
                  value={session.studentEmail}
                  onChange={(event) => setSession((current) => ({ ...current, studentEmail: event.target.value }))}
                  placeholder="Student email (optional)"
                />
              </div>
              <div className="chat-form-row">
                <input
                  value={session.phone}
                  onChange={(event) => setSession((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Phone number (optional)"
                />
              </div>
            </div>
          )}

          {mode === "booking" && status === "time" && (
            <div className="chat-booking-panel">
              <div className="chat-form-row">
                <select value={session.timezone} onChange={(event) => {
                  const nextTimezone = event.target.value;
                  setSession((current) => ({ ...current, timezone: nextTimezone, time: "" }));
                  setAvailableSlots([]);
                  if (session.date) loadAvailability(session.date, nextTimezone);
                }}>
                  {TIMEZONES.map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.flag} {zone.city}</option>
                  ))}
                </select>
              </div>

              <div className="chat-date-strip">
                {dateChoices.map((date) => (
                  <button
                    key={date.id}
                    type="button"
                    className={`chat-date ${session.date === date.id ? "is-selected" : ""}`}
                    disabled={date.disabled}
                    onClick={() => {
                      setSession((current) => ({ ...current, date: date.id, time: "" }));
                      loadAvailability(date.id, session.timezone);
                    }}
                  >
                    <span>{date.day}</span>
                    <strong>{date.num}</strong>
                  </button>
                ))}
              </div>

              {slotLoading ? (
                <div className="chat-empty-state">Loading live slots…</div>
              ) : availableSlots.length > 0 ? (
                <div className="chat-time-grid">
                  {availableSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot.time}
                      className={`chat-slot ${session.time === slot.time ? "is-selected" : ""}`}
                      onClick={() => chooseSlot(slot.time)}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="chat-empty-state">No live slots available for this date.</div>
              )}
            </div>
          )}

          {mode === "booking" && status === "mentor" && session.mentor && (
            <div className="chat-review-card">
              <strong className="chat-review-card__title">Mentor assigned</strong>
              <div className="chat-review-card__mentor">{session.mentor.name}</div>
              <p>{session.mentor.role}</p>
              <div className="chat-review-card__meta">
                <span>{session.date}</span>
                <span>{session.time}</span>
                <span>{formatTimezone(session.timezone)}</span>
              </div>
              <div className="chat-review-actions">
                <button type="button" className="chat-option" onClick={() => {
                  setStatus("review");
                  pushBot("Here’s your final review before we confirm the booking.");
                }}>Accept mentor</button>
                <button type="button" className="chat-option chat-option--secondary" onClick={() => {
                  setSession((current) => ({ ...current, time: "", mentor: null }));
                  setStatus("time");
                  pushBot("No problem — let’s pick another time for you.");
                }}>Change time</button>
              </div>
            </div>
          )}

          {mode === "booking" && status === "review" && (
            <div className="chat-review-card">
              <strong className="chat-review-card__title">Review your trial</strong>
              <div className="chat-review-list">
                <span><small>Student</small><b>{session.studentName}</b></span>
                <span><small>Parent</small><b>{session.parentName}</b></span>
                <span><small>Email</small><b>{session.parentEmail}</b></span>
                <span><small>Mentor</small><b>{session.mentor?.name || "Pending"}</b></span>
                <span><small>Date</small><b>{session.date}</b></span>
                <span><small>Time</small><b>{session.time}</b></span>
                <span><small>Timezone</small><b>{formatTimezone(session.timezone)}</b></span>
              </div>
              <div className="chat-review-actions">
                <button type="button" className="chat-option" onClick={handleConfirmBooking} disabled={isSubmitting}>
                  {isSubmitting ? "Confirming..." : "Confirm Booking"}
                </button>
                <button type="button" className="chat-option chat-option--secondary" onClick={() => setStatus("time")}>Edit time</button>
              </div>
            </div>
          )}

          {mode === "booking" && status === "confirmed" && bookingResult && (
            <div className="chat-review-card">
              <strong className="chat-review-card__title">Booking confirmed</strong>
              <div className="chat-review-list">
                <span><small>ID</small><b>{bookingResult.id}</b></span>
                <span><small>Student</small><b>{bookingResult.student.firstName}</b></span>
                <span><small>Mentor</small><b>{bookingResult.mentor.name}</b></span>
                <span><small>Class link</small><b>{bookingResult.classLink}</b></span>
              </div>
            </div>
          )}

          {mode === "booking" && errorMessage && <div className="chat-alert">{errorMessage}</div>}

          {mode === "booking" && status === "idle" && (
            <div className="demo-chatbot__actions">
              <button type="button" className="chat-option" onClick={handleStart}>Start Booking</button>
              <button type="button" className="chat-option chat-option--secondary" onClick={onBook}>Open full booking form</button>
            </div>
          )}

          {mode === "general" ? (
            <form className="demo-chatbot__composer" onSubmit={handleFieldSubmit}>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a question..."
                aria-label="Ask a general question"
              />
              <button type="submit" aria-label="Send message" disabled={!input.trim() || typing}>Send</button>
            </form>
          ) : status !== "idle" && status !== "confirmed" ? (
            <form className="demo-chatbot__composer" onSubmit={handleFieldSubmit}>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={status === "details" ? "Tell us your child’s details..." : "Type a quick note..."}
                aria-label="Chat message input"
              />
              <button type="submit" aria-label="Send message">{status === "review" ? "Go" : "Next"}</button>
            </form>
          ) : null}

          {mode === "booking" && (
            <button type="button" className="demo-chatbot__cta" onClick={onBook}>
              Book a free demo <Icon name="arrow" size={17} />
            </button>
          )}

          <nav className="demo-chatbot__tabs" role="group" aria-label="Assistant options">
            <button
              type="button"
              aria-pressed={mode === "booking"}
              className={mode === "booking" ? "is-active" : ""}
              onClick={() => { setMode("booking"); setInput(""); setErrorMessage(""); }}
            >
              <Icon name="calendar" size={18} /> <span>Booking</span>
            </button>
            <button
              type="button"
              aria-pressed={mode === "general"}
              className={mode === "general" ? "is-active" : ""}
              onClick={() => { setMode("general"); setInput(""); setErrorMessage(""); }}
            >
              <Icon name="message" size={18} /> <span>General chat</span>
            </button>
          </nav>
        </aside>
      )}
    </>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-label="A preview of a live coding class">
      {/* 3D Purple/Violet Orb */}
      <div className="sphere-orb" />

      {/* Pointing Mentor with organic curved backdrop */}
      <div className="mentor-cutout-wrap">
        <img src={MENTOR_IMAGE_URL} alt="Alex, Coding Mentor" className="mentor-cutout-img" />
      </div>

      {/* Center Frosted Glass Code Card */}
      <div className="code-card-glass">
        <div className="card-topline">
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <span>space_adventure.py</span>
          <div style={{ width: "24px" }} />
        </div>
        <div className="code-lines">
          <span><b>1</b><em>hero</em> = <strong>"SuperCoder"</strong></span>
          <span><b>2</b><em>energy</em> = <strong>100</strong></span>
          <span><b>3</b><i>if</i> rocket_ready:</span>
          <span><b>4</b>&nbsp;&nbsp;<span className="teal-call">launch_to_stars()</span></span>
        </div>
        <div className="run-pill">
          <Icon name="play" size={12} /> Run Project
        </div>
      </div>

      {/* Floating Mentor Info Pill */}
      <div className="floating-mentor-card">
        <div className="mentor-thumb-avatar">
          <img src={MENTOR_IMAGE_URL} alt="Alex" />
          <span className="online-dot" />
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "12px", fontFamily: "Manrope" }}>Alex, Coding Mentor</strong>
          <span style={{ display: "block", fontSize: "10px", color: "var(--ink-soft)" }}>Live Mentorship · Ready to inspire</span>
        </div>
      </div>

      {/* Floating Schedule Pill */}
      <div className="floating-schedule-card">
        <div className="cal-icon-box">
          <Icon name="calendar" size={17} />
        </div>
        <div>
          <span style={{ display: "block", fontSize: "9px", color: "var(--ink-soft)" }}>Next live trial</span>
          <strong style={{ display: "block", fontSize: "11px", fontFamily: "Manrope" }}>Today · 45 Mins Private</strong>
        </div>
        <div className="confirmed-badge">
          <Icon name="check" size={12} />
        </div>
      </div>

      {/* Sparkle Icon */}
      <span className="sparkle-decor">✦</span>
    </div>
  );
}

// MAIN LANDING COMPONENT (Aligned with user's reference ed-tech design)
function Landing({
  onBook,
  onNavigate,
  dark,
  onTheme,
}: {
  onBook: () => void;
  onNavigate: (view: "landing" | "booking" | "programs" | "how-it-works" | "for-parents") => void;
  dark: boolean;
  onTheme: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const beginBooking = () => {
    if (starting) return;
    setStarting(true);
    window.setTimeout(onBook, 650);
  };

  const faqs = [
    {
      q: "What happens during the free trial class?",
      a: "Your child meets with an expert mentor in a private, live interactive video classroom. Over 45 minutes, they explore core coding concepts and build a real working game or mini-project from scratch.",
    },
    {
      q: "Is any payment or credit card required to book?",
      a: "No payment details are required whatsoever. The trial class is 100% free with zero commitment and no automatic renewals.",
    },
    {
      q: "What equipment or setup does my child need?",
      a: "A desktop computer or laptop with a working webcam, microphone, and a Google Chrome or Firefox browser. Tablets/iPads are not recommended for coding exercises.",
    },
    {
      q: "How does timezone scheduling work for US/UK families?",
      a: "Our system automatically converts all slot timings to your local timezone (US Eastern, Central, Mountain, Pacific, UK, or Asia). Mentors are scheduled to match your child's after-school or weekend hours.",
    },
    {
      q: "Can complete beginners join?",
      a: "Yes! Over 80% of our trial students have never written a line of code before. Our mentors adapt dynamically to complete beginners as well as intermediate coders.",
    },
  ];

  return (
    <div className="landing page-enter">
      <Header activeView="landing" onNavigate={onNavigate} dark={dark} onTheme={onTheme} loading={starting} />

      {/* 1. HERO SECTION */}
      <div className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> 21ST CENTURY SKILLS FOR KIDS
          </div>
          <h1 className="display">
            Unlock your child's{" "}
            <span className="gradient-headline">full<br />potential</span> with live<br />
            interactive coding.
          </h1>
          <p className="lede">
            Live, personalized STEM and coding classes for kids ages 6–17. Connect with top-rated mentors and watch your child build real apps, games, and AI projects.
          </p>
          <div className="hero-actions">
            <ActionButton
              className={`hero-cta ${starting ? "is-loading" : ""}`}
              onClick={beginBooking}
              disabled={starting}
            >
              {starting ? <><span className="button-loader" /> Preparing your booking...</> : <>Book a Free Trial <Icon name="arrow" size={19} /></>}
            </ActionButton>
            <div className="micro-proof">
              <span className="avatar-stack">
                <i style={{ background: "#10b981", fontSize: "11px" }}>🌱</i>
                <i style={{ background: "#6366f1" }}>4.8</i>
                <i style={{ background: "#f59e0b" }}>4.8</i>
              </span>
              <div>
                <strong>4.9/5 Rating</strong>
                <span>from 10,000+ parents</span>
              </div>
            </div>
          </div>
          <div className="hero-details">
            <span><Icon name="check" size={15} /> 100% Free Trial</span>
            <span><Icon name="check" size={15} /> Dedicated Expert Mentor</span>
            <span><Icon name="check" size={15} /> No Credit Card Required</span>
          </div>
        </div>
        <HeroVisual />
      </div>

      {/* 2. ACCREDITATIONS & GLOBAL PARTNERS STRIP */}
      <div className="shell" style={{ margin: "20px auto 70px" }}>
        <div style={{ padding: "20px 28px", borderRadius: "18px", background: "var(--surface)", border: "1px solid var(--line)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "var(--ink-soft)" }}>Accredited & Recognized Worldwide:</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "center", color: "var(--ink)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px" }}><Icon name="award" size={18} /> STEM.org Accredited</span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px" }}><Icon name="shield" size={18} /> Education 2.0 Award</span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px" }}><Icon name="globe" size={18} /> HolonIQ Top EdTech</span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px" }}><Icon name="user" size={18} /> 15+ Countries</span>
          </div>
        </div>
      </div>

      {/* 3. THE PROVEN ADVANTAGE OF PERSONALIZED LEARNING */}
      <div className="shell" style={{ marginBottom: "85px" }}>
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 40px" }}>
          <div className="eyebrow" style={{ justifyContent: "center", color: "#d97706" }}><Icon name="zap" size={16} /> Accelerated Progress</div>
          <h2 style={{ fontFamily: "Manrope", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, margin: "14px 0 10px", letterSpacing: "-1px" }}>
            The Proven Advantage of <em>Personalized Learning</em>
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "16px", lineHeight: 1.6 }}>
            Group classes leave students behind or held back. Our private individualized model adapts in real time to your child's unique pace, curiosity, and learning style.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div className="details-card" style={{ borderTop: "4px solid #f59e0b" }}>
            <div className="brand-mark" style={{ width: "42px", height: "42px", background: "linear-gradient(135deg, #f59e0b, #d97706)", marginBottom: "16px" }}>
              <Icon name="heart" size={20} />
            </div>
            <h3 style={{ fontFamily: "Manrope", fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>100% Personalized Attention</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              The mentor adjusts lesson difficulty immediately if your child finds a concept too easy or needs extra encouragement.
            </p>
          </div>

          <div className="details-card" style={{ borderTop: "4px solid var(--mint)" }}>
            <div className="brand-mark" style={{ width: "42px", height: "42px", background: "linear-gradient(135deg, var(--mint), #2b8a75)", marginBottom: "16px" }}>
              <Icon name="code" size={20} />
            </div>
            <h3 style={{ fontFamily: "Manrope", fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>Hands-on Project Building</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              Children don't passively watch slides — they write real code, debug errors, and launch working games during every session.
            </p>
          </div>

          <div className="details-card" style={{ borderTop: "4px solid #8c82ff" }}>
            <div className="brand-mark" style={{ width: "42px", height: "42px", background: "linear-gradient(135deg, #6366f1, #4f46e5)", marginBottom: "16px" }}>
              <Icon name="spark" size={20} />
            </div>
            <h3 style={{ fontFamily: "Manrope", fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>Confidence & Problem Solving</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              Coding builds logical thinking, perseverance, and creative confidence that empowers students in math, science, and school.
            </p>
          </div>
        </div>
      </div>

      {/* 4. GETTING STARTED IS SUPER EASY (3 STEPS) */}
      <div className="shell" style={{ marginBottom: "85px" }}>
        <div style={{ background: "color-mix(in srgb, var(--surface) 94%, var(--brand-soft))", borderRadius: "24px", padding: "48px 36px", border: "1px solid var(--line)", textAlign: "center" }}>
          <div className="eyebrow" style={{ justifyContent: "center", color: "#d97706" }}><Icon name="play" size={16} /> Simple 3-Step Process</div>
          <h2 style={{ fontFamily: "Manrope", fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 800, margin: "14px 0 10px" }}>Getting Started is Super Easy</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "15px", maxWidth: "600px", margin: "0 auto 36px" }}>Experience the difference in just one fun, interactive trial class.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", textAlign: "left", marginBottom: "36px" }}>
            <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)" }}>
              <span style={{ width: "36px", height: "36px", display: "grid", placeItems: "center", borderRadius: "10px", background: "#fef3c7", color: "#d97706", fontWeight: 800, fontSize: "16px", marginBottom: "14px" }}>1</span>
              <strong style={{ display: "block", fontSize: "16px", marginBottom: "6px" }}>Select Date & Time</strong>
              <span style={{ fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.5, display: "block" }}>Pick a time slot in your local US/UK timezone. Takes less than a minute.</span>
            </div>

            <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)" }}>
              <span style={{ width: "36px", height: "36px", display: "grid", placeItems: "center", borderRadius: "10px", background: "#e6f8f4", color: "#1e826b", fontWeight: 800, fontSize: "16px", marginBottom: "14px" }}>2</span>
              <strong style={{ display: "block", fontSize: "16px", marginBottom: "6px" }}>Join Live Class</strong>
              <span style={{ fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.5, display: "block" }}>Connect with an assigned expert mentor and build a real coding project.</span>
            </div>

            <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)" }}>
              <span style={{ width: "36px", height: "36px", display: "grid", placeItems: "center", borderRadius: "10px", background: "#ede9fe", color: "#6d28d9", fontWeight: 800, fontSize: "16px", marginBottom: "14px" }}>3</span>
              <strong style={{ display: "block", fontSize: "16px", marginBottom: "6px" }}>Get Learning Report</strong>
              <span style={{ fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.5, display: "block" }}>Receive comprehensive mentor feedback on your child's logic & skills.</span>
            </div>
          </div>

          <ActionButton
            onClick={beginBooking}
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", padding: "0 32px", minHeight: "52px", fontSize: "16px", fontWeight: 800 }}
          >
            Book Free Trial Now <Icon name="arrow" size={18} />
          </ActionButton>
        </div>
      </div>

      {/* 5. ONLINE COURSES FOR KIDS ACROSS ALL LEARNING TRACKS */}
      <div className="shell" style={{ marginBottom: "85px" }}>
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 40px" }}>
          <div className="eyebrow" style={{ justifyContent: "center", color: "#d97706" }}><Icon name="book" size={16} /> Course Catalog</div>
          <h2 style={{ fontFamily: "Manrope", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, margin: "14px 0 10px" }}>
            Online Courses for Kids in All Learning Tracks
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "16px" }}>Age-appropriate tracks designed by MIT and Stanford alumni.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "24px" }}>
          {/* Track 1 */}
          <div className="details-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", padding: "4px 10px", borderRadius: "20px", background: "#fef3c7", color: "#92400e", display: "inline-block", marginBottom: "12px" }}>Ages 6–9</span>
              <h3 style={{ fontFamily: "Manrope", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Scratch & Game Creation</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" }}>
                Introduce visual coding with animations, arcade games, and interactive storytelling.
              </p>
              <div style={{ display: "grid", gap: "6px", fontSize: "12px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <span>✓ Loops, Variables & Coordinates</span>
                <span>✓ Build 6+ playable mini-games</span>
              </div>
            </div>
            <div style={{ marginTop: "20px" }}>
              <ActionButton className="full-button" onClick={() => onNavigate("booking")}>Schedule Trial <Icon name="arrow" size={16} /></ActionButton>
            </div>
          </div>

          {/* Track 2 */}
          <div className="details-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1.5px solid #f59e0b", boxShadow: "0 14px 35px rgba(245, 158, 11, 0.12)" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", padding: "4px 10px", borderRadius: "20px", background: "#e6f8f4", color: "#1e826b", display: "inline-block", marginBottom: "12px" }}>Ages 10–13 · Recommended</span>
              <h3 style={{ fontFamily: "Manrope", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Python & Robotics Foundations</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" }}>
                Master text-based coding syntax, computational logic, data structures, and automation.
              </p>
              <div style={{ display: "grid", gap: "6px", fontSize: "12px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <span>✓ Real-world Python scripts</span>
                <span>✓ Algorithmic problem-solving</span>
              </div>
            </div>
            <div style={{ marginTop: "20px" }}>
              <ActionButton className="full-button" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }} onClick={() => onNavigate("booking")}>Schedule Trial <Icon name="arrow" size={16} /></ActionButton>
            </div>
          </div>

          {/* Track 3 */}
          <div className="details-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", padding: "4px 10px", borderRadius: "20px", background: "#ede9fe", color: "#6d28d9", display: "inline-block", marginBottom: "12px" }}>Ages 14–17</span>
              <h3 style={{ fontFamily: "Manrope", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>AI, Web & App Development</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" }}>
                Full-stack web engineering, React, database integration, and machine learning models.
              </p>
              <div style={{ display: "grid", gap: "6px", fontSize: "12px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <span>✓ Publish live Web Apps & APIs</span>
                <span>✓ Train and integrate AI models</span>
              </div>
            </div>
            <div style={{ marginTop: "20px" }}>
              <ActionButton className="full-button" onClick={() => onNavigate("booking")}>Schedule Trial <Icon name="arrow" size={16} /></ActionButton>
            </div>
          </div>
        </div>
      </div>

      {/* 6. ALL THE PERKS WITH OUR TRIAL */}
      <div className="shell" style={{ marginBottom: "85px" }}>
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 40px" }}>
          <div className="eyebrow" style={{ justifyContent: "center", color: "#d97706" }}><Icon name="spark" size={16} /> Free Trial Inclusions</div>
          <h2 style={{ fontFamily: "Manrope", fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, margin: "14px 0 10px" }}>
            All the Perks with Our Trial
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "16px" }}>Everything included in your free 45-minute trial session.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          <div className="details-card" style={{ padding: "20px" }}>
            <span style={{ color: "#f59e0b", display: "block", marginBottom: "8px" }}><Icon name="clock" size={22} /></span>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "4px" }}>Free 45-Minute Live Class</strong>
            <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>Dedicated personal attention without any group distractions.</span>
          </div>

          <div className="details-card" style={{ padding: "20px" }}>
            <span style={{ color: "var(--mint)", display: "block", marginBottom: "8px" }}><Icon name="user" size={22} /></span>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "4px" }}>Certified Expert Mentor</strong>
            <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>Top-rated computer science educator matched to your child.</span>
          </div>

          <div className="details-card" style={{ padding: "20px" }}>
            <span style={{ color: "#8c82ff", display: "block", marginBottom: "8px" }}><Icon name="code" size={22} /></span>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "4px" }}>Build a Working Project</strong>
            <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>Create and test a real coding game by the end of class.</span>
          </div>

          <div className="details-card" style={{ padding: "20px" }}>
            <span style={{ color: "#d97706", display: "block", marginBottom: "8px" }}><Icon name="award" size={22} /></span>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "4px" }}>Detailed Skill Assessment</strong>
            <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>Receive custom feedback on strengths and logic milestones.</span>
          </div>

          <div className="details-card" style={{ padding: "20px" }}>
            <span style={{ color: "#2b8a75", display: "block", marginBottom: "8px" }}><Icon name="globe" size={22} /></span>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "4px" }}>Your Local Timezone</strong>
            <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>Automatic conversion for US EST/PST, UK, and world hours.</span>
          </div>

          <div className="details-card" style={{ padding: "20px" }}>
            <span style={{ color: "#6366f1", display: "block", marginBottom: "8px" }}><Icon name="shield" size={22} /></span>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "4px" }}>Zero Obligation</strong>
            <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>No payment details required, no automatic subscriptions.</span>
          </div>
        </div>
      </div>

      {/* 7. TRUSTED BY PARENTS, LOVED BY STUDENTS */}
      <div className="shell" style={{ marginBottom: "85px" }}>
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 40px" }}>
          <div className="eyebrow" style={{ justifyContent: "center", color: "#d97706" }}><Icon name="heart" size={16} /> Parent Reviews</div>
          <h2 style={{ fontFamily: "Manrope", fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, margin: "14px 0 10px" }}>
            Trusted by Parents, Loved by Students
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "16px" }}>Read what parents around the world say about their Codeyoung trial.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div className="details-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", gap: "4px", color: "#f59e0b", marginBottom: "12px" }}>
              <Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} />
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", fontStyle: "italic", marginBottom: "16px" }}>
              “My 9-year-old son Lucas was completely hooked after his trial class with Alex. He built his first space game in 45 minutes and could not stop talking about it!”
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
              <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#fef3c7", color: "#92400e", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "12px" }}>EM</span>
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>Emily Miller</strong>
                <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>Parent from New York, USA</span>
              </div>
            </div>
          </div>

          <div className="details-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", gap: "4px", color: "#f59e0b", marginBottom: "12px" }}>
              <Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} />
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", fontStyle: "italic", marginBottom: "16px" }}>
              “The personal attention makes such a huge difference. Priya was patient, engaging, and explained Python syntax so clearly. Highly recommend booking a trial.”
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
              <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#e6f8f4", color: "#1e826b", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "12px" }}>RH</span>
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>Richard Hayes</strong>
                <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>Parent from London, UK</span>
              </div>
            </div>
          </div>

          <div className="details-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", gap: "4px", color: "#f59e0b", marginBottom: "12px" }}>
              <Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} /><Icon name="star" size={16} />
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", fontStyle: "italic", marginBottom: "16px" }}>
              “Booking was seamless and took under a minute. The mentor was prepared, friendly, and sent a thorough report right after class. Outstanding experience!”
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
              <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#ede9fe", color: "#6d28d9", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "12px" }}>SP</span>
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>Sarah Patel</strong>
                <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>Parent from California, USA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. CODEYOUNG IN THE MEDIA */}
      <div className="shell" style={{ marginBottom: "85px", textAlign: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--ink-soft)", display: "block", marginBottom: "20px" }}>
          Featured In Global Media
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "36px", opacity: 0.85, filter: "grayscale(30%)", fontWeight: 800, fontSize: "18px", color: "var(--ink)" }}>
          <span>Forbes</span>
          <span>TechCrunch</span>
          <span>The Economic Times</span>
          <span>YourStory</span>
          <span>Inc. Magazine</span>
        </div>
      </div>

      {/* 9. FAQ ACCORDION */}
      <div className="shell" style={{ maxWidth: "800px", margin: "0 auto 85px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div className="eyebrow" style={{ justifyContent: "center", color: "#d97706" }}><Icon name="spark" size={16} /> Got Questions?</div>
          <h2 style={{ fontFamily: "Manrope", fontSize: "32px", fontWeight: 800, margin: "12px 0 8px" }}>Frequently Asked Questions</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "15px" }}>Everything you need to know about our free trial class.</p>
        </div>

        <div style={{ display: "grid", gap: "12px" }}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={faq.q}
                className="details-card"
                style={{ padding: "20px", cursor: "pointer", transition: "all 0.2s ease" }}
                onClick={() => setActiveFaq(isOpen ? null : index)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "15px", color: "var(--ink)" }}>{faq.q}</strong>
                  <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", color: "#d97706" }}>
                    <Icon name="chevronDown" size={18} />
                  </span>
                </div>
                {isOpen && (
                  <p style={{ margin: "12px 0 0", fontSize: "14px", color: "var(--ink-soft)", lineHeight: 1.6, borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 10. BOTTOM HERO CTA BANNER */}
      <div className="shell" style={{ marginBottom: "60px" }}>
        <div style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: "24px", padding: "50px 32px", color: "white", textAlign: "center", boxShadow: "0 20px 50px rgba(245, 158, 11, 0.25)" }}>
          <h2 style={{ fontFamily: "Manrope", fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, margin: "0 0 12px" }}>
            Give Your Child the Superpower of Coding
          </h2>
          <p style={{ fontSize: "16px", opacity: 0.95, maxWidth: "600px", margin: "0 auto 30px", lineHeight: 1.6 }}>
            Join thousands of happy parents across 15+ countries. Book a free 45-minute live trial class today.
          </p>
          <ActionButton
            onClick={beginBooking}
            style={{ background: "white", color: "#b45309", padding: "0 34px", minHeight: "54px", fontSize: "16px", fontWeight: 800, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
          >
            Book a Free Trial Now <Icon name="arrow" size={18} />
          </ActionButton>
        </div>
      </div>

      {/* 11. FOOTER (Without Blogs or Login) */}
      <footer style={{ borderTop: "1px solid var(--line)", padding: "40px 0 50px", background: "var(--surface)" }}>
        <div className="shell" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
          <div>
            <Brand onClick={() => onNavigate("landing")} />
            <span style={{ display: "block", fontSize: "13px", color: "var(--ink-soft)", marginTop: "8px" }}>
              Empowering the next generation of creators through personalized live STEM education.
            </span>
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "14px", fontWeight: 600 }}>
            <span onClick={() => onNavigate("landing")} style={{ cursor: "pointer" }}>Home</span>
            <span onClick={() => onNavigate("programs")} style={{ cursor: "pointer" }}>Programs</span>
            <span onClick={() => onNavigate("how-it-works")} style={{ cursor: "pointer" }}>How It Works</span>
            <span onClick={() => onNavigate("for-parents")} style={{ cursor: "pointer" }}>For Parents</span>
            <span onClick={() => onNavigate("booking")} style={{ cursor: "pointer", color: "#d97706", fontWeight: 700 }}>Book Free Trial</span>
          </div>
        </div>
        <div className="shell" style={{ borderTop: "1px solid var(--line)", marginTop: "24px", paddingTop: "20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "var(--ink-soft)" }}>
          <span>© {new Date().getFullYear()} Codeyoung. All rights reserved.</span>
          <span>Privacy Policy · Terms of Service · Safety & Safeguarding</span>
        </div>
      </footer>
    </div>
  );
}

// SEPARATE PAGE: PROGRAMS
function ProgramsPage({ onNavigate, dark, onTheme }: { onNavigate: (view: "landing" | "booking" | "programs" | "how-it-works" | "for-parents") => void; dark: boolean; onTheme: () => void }) {
  return (
    <div className="page-enter" style={{ minHeight: "100vh", paddingBottom: "80px" }}>
      <Header activeView="programs" onNavigate={onNavigate} dark={dark} onTheme={onTheme} />
      <div className="shell" style={{ marginTop: "40px" }}>
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 50px" }}>
          <div className="eyebrow" style={{ justifyContent: "center", color: "#d97706" }}><Icon name="spark" size={16} /> STEM Accredited Pathways</div>
          <h1 style={{ fontFamily: "Manrope", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, margin: "16px 0 12px", letterSpacing: "-1.5px" }}>
            Curriculum Built for <em>Every Age & Stage</em>
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "17px", lineHeight: 1.6 }}>
            Explore our project-based coding tracks taught by expert educators with real-world computer science backgrounds.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "50px" }}>
          <div className="details-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span className="brand-mark" style={{ width: "42px", height: "42px", background: "linear-gradient(135deg, #f59e0b, #d97706)" }}><Icon name="spark" size={20} /></span>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "6px 12px", borderRadius: "20px", background: "#fef3c7", color: "#92400e" }}>Ages 6–9</span>
              </div>
              <h3 style={{ fontFamily: "Manrope", fontSize: "21px", fontWeight: 700, margin: "0 0 10px" }}>Scratch & Game Development</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, marginBottom: "18px" }}>
                Visual block-based coding, animated storytelling, interactive games, and computational logic thinking.
              </p>
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                <strong style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--ink-soft)", display: "block", marginBottom: "8px" }}>Key Outcomes:</strong>
                <div style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
                  <span>✓ Build 5+ interactive arcade games</span>
                  <span>✓ Master loops, variables & conditionals</span>
                  <span>✓ Develop creative problem solving</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "24px" }}>
              <ActionButton className="full-button" onClick={() => onNavigate("booking")}>Book Trial for Ages 6–9 <Icon name="arrow" size={17} /></ActionButton>
            </div>
          </div>

          <div className="details-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderColor: "#f59e0b", boxShadow: "0 14px 40px rgba(245, 158, 11, 0.12)" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span className="brand-mark" style={{ width: "42px", height: "42px", background: "linear-gradient(145deg, var(--mint), #3ea791)" }}><Icon name="code" size={20} /></span>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "6px 12px", borderRadius: "20px", background: "#e6f8f4", color: "#1e826b" }}>Ages 10–13 · Most Popular</span>
              </div>
              <h3 style={{ fontFamily: "Manrope", fontSize: "21px", fontWeight: 700, margin: "0 0 10px" }}>Python & Robotics Foundations</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, marginBottom: "18px" }}>
                Transition to real syntax with Python, building algorithms, data structures, automation scripts, and logic games.
              </p>
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                <strong style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--ink-soft)", display: "block", marginBottom: "8px" }}>Key Outcomes:</strong>
                <div style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
                  <span>✓ Write clean text-based Python code</span>
                  <span>✓ Algorithmic thinking & math reasoning</span>
                  <span>✓ Build a custom text adventure game</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "24px" }}>
              <ActionButton className="full-button" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }} onClick={() => onNavigate("booking")}>Book Trial for Ages 10–13 <Icon name="arrow" size={17} /></ActionButton>
            </div>
          </div>

          <div className="details-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span className="brand-mark" style={{ width: "42px", height: "42px", background: "linear-gradient(145deg, var(--accent), #e28a3f)" }}><Icon name="zap" size={20} /></span>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "6px 12px", borderRadius: "20px", background: "#fff2e5", color: "#c26e25" }}>Ages 14–17</span>
              </div>
              <h3 style={{ fontFamily: "Manrope", fontSize: "21px", fontWeight: 700, margin: "0 0 10px" }}>AI, Web & App Development</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, marginBottom: "18px" }}>
                Full-stack web applications, JavaScript/React, machine learning basics, API integrations, and portfolio preparation.
              </p>
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                <strong style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--ink-soft)", display: "block", marginBottom: "8px" }}>Key Outcomes:</strong>
                <div style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
                  <span>✓ Publish live full-stack web applications</span>
                  <span>✓ Train and integrate basic AI models</span>
                  <span>✓ Create an impressive GitHub portfolio</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "24px" }}>
              <ActionButton className="full-button" onClick={() => onNavigate("booking")}>Book Trial for Ages 14–17 <Icon name="arrow" size={17} /></ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SEPARATE PAGE: HOW IT WORKS
function HowItWorksPage({ onNavigate, dark, onTheme }: { onNavigate: (view: "landing" | "booking" | "programs" | "how-it-works" | "for-parents") => void; dark: boolean; onTheme: () => void }) {
  return (
    <div className="page-enter" style={{ minHeight: "100vh", paddingBottom: "80px" }}>
      <Header activeView="how-it-works" onNavigate={onNavigate} dark={dark} onTheme={onTheme} />
      <div className="shell" style={{ marginTop: "40px" }}>
        <div style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 50px" }}>
          <div className="eyebrow" style={{ justifyContent: "center", color: "#d97706" }}><Icon name="play" size={16} /> Transparent Process</div>
          <h1 style={{ fontFamily: "Manrope", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, margin: "16px 0 12px", letterSpacing: "-1.5px" }}>
            How Codeyoung <em>Works</em>
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "17px", lineHeight: 1.6 }}>
            From your first click to your child's live coding creation — here is what to expect every step of the way.
          </p>
        </div>

        <div style={{ display: "grid", gap: "30px", maxWidth: "860px", margin: "0 auto 60px" }}>
          <div className="details-card" style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "24px", alignItems: "center" }}>
            <span style={{ width: "60px", height: "60px", display: "grid", placeItems: "center", borderRadius: "18px", background: "#f59e0b", color: "white", fontSize: "24px", fontWeight: 800 }}>
              1
            </span>
            <div>
              <span style={{ color: "#d97706", fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}>Step 1 · 60 Seconds</span>
              <h3 style={{ fontFamily: "Manrope", fontSize: "20px", fontWeight: 700, margin: "4px 0 6px" }}>Book Your Free 45-Minute Trial</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                Pick a date and time in your local timezone (US Eastern, Pacific, Central, UK, or International). We automatically assign an educator matched to your child's age.
              </p>
            </div>
          </div>

          <div className="details-card" style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "24px", alignItems: "center" }}>
            <span style={{ width: "60px", height: "60px", display: "grid", placeItems: "center", borderRadius: "18px", background: "var(--mint)", color: "white", fontSize: "24px", fontWeight: 800 }}>
              2
            </span>
            <div>
              <span style={{ color: "var(--mint)", fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}>Step 2 · Live Interactive Experience</span>
              <h3 style={{ fontFamily: "Manrope", fontSize: "20px", fontWeight: 700, margin: "4px 0 6px" }}>Join the Live Interactive Classroom</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                You and your mentor receive a secure live class link via email. Your child logs in from any desktop/laptop browser, interacts directly with their mentor, and codes a complete working project.
              </p>
            </div>
          </div>

          <div className="details-card" style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "24px", alignItems: "center" }}>
            <span style={{ width: "60px", height: "60px", display: "grid", placeItems: "center", borderRadius: "18px", background: "var(--accent)", color: "white", fontSize: "24px", fontWeight: 800 }}>
              3
            </span>
            <div>
              <span style={{ color: "var(--accent)", fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}>Step 3 · Growth Insights</span>
              <h3 style={{ fontFamily: "Manrope", fontSize: "20px", fontWeight: 700, margin: "4px 0 6px" }}>Receive Detailed Feedback & Roadmap</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                Following the trial, the mentor provides a personalized assessment of your child's logic, curiosity, and suggested roadmap milestones.
              </p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <ActionButton className="hero-cta" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white" }} onClick={() => onNavigate("booking")}>
            Schedule Your Free Trial Class <Icon name="arrow" size={19} />
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// SEPARATE PAGE: FOR PARENTS
function ForParentsPage({ onNavigate, dark, onTheme }: { onNavigate: (view: "landing" | "booking" | "programs" | "how-it-works" | "for-parents") => void; dark: boolean; onTheme: () => void }) {
  return (
    <div className="page-enter" style={{ minHeight: "100vh", paddingBottom: "80px" }}>
      <Header activeView="for-parents" onNavigate={onNavigate} dark={dark} onTheme={onTheme} />
      <div className="shell" style={{ marginTop: "40px" }}>
        <div style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 50px" }}>
          <div className="eyebrow" style={{ justifyContent: "center", color: "#d97706" }}><Icon name="shield" size={16} /> Parent Trust & Safety</div>
          <h1 style={{ fontFamily: "Manrope", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, margin: "16px 0 12px", letterSpacing: "-1.5px" }}>
            Designed with <em>Parents in Mind</em>
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "17px", lineHeight: 1.6 }}>
            Everything you need to know about safety, mentor qualifications, scheduling flexibility, and our 100% free trial commitment.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "50px" }}>
          <div className="details-card">
            <div className="brand-mark" style={{ width: "38px", height: "38px", background: "linear-gradient(135deg, #f59e0b, #d97706)", marginBottom: "14px" }}><Icon name="award" size={18} /></div>
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "6px" }}>Top 1% Vetted Mentors</strong>
            <p style={{ color: "var(--ink-soft)", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
              All mentors undergo rigorous multi-stage background checks, coding assessments, and specialized pedagogy training for teaching children.
            </p>
          </div>

          <div className="details-card">
            <div className="brand-mark" style={{ width: "38px", height: "38px", background: "linear-gradient(145deg, var(--mint), #3ea791)", marginBottom: "14px" }}><Icon name="globe" size={18} /></div>
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "6px" }}>Timezone Synchronized</strong>
            <p style={{ color: "var(--ink-soft)", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
              Whether you are located in the US (Eastern/Central/Mountain/Pacific), the UK, or Asia, our calendar matches your local daytime schedule effortlessly.
            </p>
          </div>

          <div className="details-card">
            <div className="brand-mark" style={{ width: "38px", height: "38px", background: "linear-gradient(145deg, var(--accent), #e28a3f)", marginBottom: "14px" }}><Icon name="heart" size={18} /></div>
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "6px" }}>Zero-Pressure Guarantee</strong>
            <p style={{ color: "var(--ink-soft)", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
              The trial class is genuinely 100% free. No credit card details required, no automatic renewals, and no high-pressure sales calls.
            </p>
          </div>

          <div className="details-card">
            <div className="brand-mark" style={{ width: "38px", height: "38px", marginBottom: "14px" }}><Icon name="shield" size={18} /></div>
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "6px" }}>Child Safety First</strong>
            <p style={{ color: "var(--ink-soft)", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
              Sessions occur in encrypted private video classrooms with moderation and audio/video safety measures designed specifically for young learners.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <ActionButton className="hero-cta" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white" }} onClick={() => onNavigate("booking")}>
            Book a Free Trial Now <Icon name="arrow" size={19} />
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function Progress({ step, onStepClick }: { step: number; onStepClick?: (step: number) => void }) {
  const labels = ["Details", "Time", "Mentor", "Review", "Confirmed"];
  return (
    <div className="progress">
      {labels.map((label, index) => {
        const stepNum = index + 1;
        const isClickable = Boolean(onStepClick) && stepNum <= 4;
        return (
          <div
            className={`progress-item ${stepNum <= step ? "is-active" : ""}`}
            key={label}
            onClick={() => {
              if (isClickable && onStepClick) {
                onStepClick(stepNum);
              }
            }}
            style={{ cursor: isClickable ? "pointer" : "default" }}
            title={isClickable ? `Click to go to Step ${stepNum}: ${label}` : undefined}
          >
            <span>{stepNum < step ? <Icon name="check" size={13} /> : `0${stepNum}`}</span>
            <b>{label}</b>
            {index < labels.length - 1 && <i />}
          </div>
        );
      })}
    </div>
  );
}

// All 10 mentors in the system
const MENTORS = [
  { id: "m01-uuid-0001", name: "Alex Johnson", initials: "AJ", specialty: "Game development", rating: "5.0" },
  { id: "m02-uuid-0002", name: "Priya Sharma", initials: "PS", specialty: "Creative coding", rating: "4.9" },
  { id: "m03-uuid-0003", name: "Arjun Mehta", initials: "AM", specialty: "Python & robotics", rating: "5.0" },
  { id: "m04-uuid-0004", name: "Neha Kapoor", initials: "NK", specialty: "Web development", rating: "4.9" },
  { id: "m05-uuid-0005", name: "Rohan Verma", initials: "RV", specialty: "App development", rating: "4.8" },
  { id: "m06-uuid-0006", name: "Ananya Rao", initials: "AR", specialty: "Creative computing", rating: "5.0" },
  { id: "m07-uuid-0007", name: "Vikram Singh", initials: "VS", specialty: "AI foundations", rating: "4.9" },
  { id: "m08-uuid-0008", name: "Meera Iyer", initials: "MI", specialty: "Scratch & games", rating: "4.9" },
  { id: "m09-uuid-0009", name: "Kabir Patel", initials: "KP", specialty: "Python projects", rating: "4.8" },
  { id: "m10-uuid-0010", name: "Ishita Das", initials: "ID", specialty: "Robotics & logic", rating: "5.0" },
];

const TIMEZONES = [
  { id: "America/New_York", city: "New York", detail: "Eastern Time (ET)", flag: "🇺🇸" },
  { id: "America/Chicago", city: "Chicago", detail: "Central Time (CT)", flag: "🇺🇸" },
  { id: "America/Denver", city: "Denver", detail: "Mountain Time (MT)", flag: "🇺🇸" },
  { id: "America/Los_Angeles", city: "Los Angeles", detail: "Pacific Time (PT)", flag: "🇺🇸" },
  { id: "Europe/London", city: "London", detail: "United Kingdom (GMT/BST)", flag: "🇬🇧" },
  { id: "Asia/Kolkata", city: "India", detail: "India Standard Time (IST)", flag: "🇮🇳" },
];

function useDates() {
  return useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const year = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, "0");
      const dayStr = String(date.getDate()).padStart(2, "0");
      const id = `${year}-${monthStr}-${dayStr}`;

      return {
        id,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        num: date.getDate(),
        month: date.toLocaleDateString("en-US", { month: "long" }),
        full: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
        disabled: isWeekend,
        isWeekend,
        statusText: isWeekend ? "Weekend" : "Open",
        today: i === 0,
      };
    });
  }, []);
}

type DateInfo = ReturnType<typeof useDates>[number];

function BookingSummary({
  date,
  time,
  onContinue,
  onChange,
  review = false,
  timezone,
  showAction = true,
  mentor,
  canContinue = true,
  actionLabel,
}: {
  date: DateInfo;
  time: string;
  onContinue?: () => void;
  onChange?: () => void;
  review?: boolean;
  timezone: string;
  showAction?: boolean;
  mentor?: typeof MENTORS[number] | { name: string; initials?: string; specialty?: string; rating?: string };
  canContinue?: boolean;
  actionLabel?: string;
}) {
  return (
    <div className={`summary-card ${review ? "summary-card--review" : ""}`}>
      <div className="summary-kicker">Your trial class</div>
      <div className="summary-date">{date.full}</div>
      <div className="summary-time">{time || (date.isWeekend ? "Weekend (Closed)" : "Choose a time")}</div>
      <div className="summary-zone"><Icon name="globe" size={16} /> Your local time · {formatTimezone(timezone)}</div>
      <div className="divider" />
      <div className="class-row">
        <span className="class-icon"><Icon name="code" size={22} /></span>
        <div>
          <strong>Live Coding Trial</strong>
          <span>Personalized interactive class</span>
        </div>
      </div>
      <div className="mentor-assignment">
        <span className="mentor-avatar">{mentor?.initials || <Icon name="spark" size={18} />}</span>
        <div>
          <small>Mentor Assignment</small>
          <strong>{mentor ? mentor.name : "Auto-assigned by system"}</strong>
          <span>{mentor?.specialty ? `${mentor.specialty} · ★ ${mentor.rating || "5.0"}` : "10 active mentors · Matched automatically"}</span>
        </div>
      </div>
      <div className="included">
        <span><Icon name="check" size={15} /> 45 minutes</span>
        <span><Icon name="check" size={15} /> Free</span>
        <span><Icon name="check" size={15} /> Dedicated guidance</span>
      </div>
      {showAction && (
        <ActionButton disabled={!time || !canContinue || date.isWeekend} className="full-button" onClick={onContinue}>
          {actionLabel || (review ? "Confirm Free Trial" : "Continue")} <Icon name="arrow" size={18} />
        </ActionButton>
      )}
      {onChange && <ActionButton variant="ghost" className="change-time" onClick={onChange}>Change time</ActionButton>}
      <div className="secure-note"><Icon name="check" size={14} /> No payment details required</div>
    </div>
  );
}

type LearnerDetails = {
  studentName: string;
  age: string;
  grade: string;
  experience: string;
  interest?: string;
  mentorNote?: string;
  studentEmail: string;
  parentName: string;
  parentEmail: string;
  phone: string;
};

type FieldProps = {
  label: string;
  name: keyof LearnerDetails;
  value: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  error?: string;
  options?: string[];
  type?: string;
  onChange: (name: keyof LearnerDetails, value: string) => void;
};

function FormField({ label, name, value, placeholder, required, optional, helper, error, options, type = "text", onChange }: FieldProps) {
  const valid = Boolean(value) && !error;
  return (
    <label className={`form-field ${error ? "has-error" : ""} ${valid ? "is-valid" : ""}`}>
      <span className="field-label">{label} {required && <b>*</b>}{optional && <em>Optional</em>}</span>
      <span className="field-control">
        {options
          ? <select value={value} onChange={(event) => onChange(name, event.target.value)}><option value="">Select an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          : <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(name, event.target.value)} />}
        {valid && <span className="field-check"><Icon name="check" size={13} /></span>}
      </span>
      {(error || helper) && <small className="field-helper">{error || helper}</small>}
    </label>
  );
}

const AGE_OPTIONS = ["6 years old", "7 years old", "8 years old", "9 years old", "10 years old", "11 years old", "12 years old", "13 years old", "14 years old", "15 years old", "16+ years old"];
const GRADE_OPTIONS = ["Grade 1-2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9+"];
const EXPERIENCE_OPTIONS = [
  "Brand New to Coding (No prior experience)",
  "Beginner (Tried Scratch, Blockly, or basic computer classes)",
  "Intermediate (Has coded with Python, JavaScript, HTML/CSS)",
];
const INTEREST_OPTIONS = [
  "Game Design & Animation (Roblox, Minecraft, Scratch)",
  "Python, Robotics & Smart Algorithms",
  "Web Development & Creative Coding",
  "Logic, Math & Problem Solving",
];

// STEP 1: DETAILS (Professional, Streamlined Registration Form)
function DetailsScreen({
  details,
  setDetails,
  onContinue,
}: {
  details: LearnerDetails;
  setDetails: (details: LearnerDetails) => void;
  onContinue: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.parentEmail);
  const studentEmailValid = !details.studentEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.studentEmail);

  const errors: Partial<Record<keyof LearnerDetails, string>> = submitted ? {
    studentName: details.studentName ? "" : "Please enter the student's name.",
    age: details.age ? "" : "Please select student's age.",
    grade: details.grade ? "" : "Please select student's grade.",
    parentName: details.parentName ? "" : "Please enter parent or guardian's name.",
    parentEmail: emailValid ? "" : "Please enter a valid email address.",
    studentEmail: studentEmailValid ? "" : "Please enter a valid email address.",
  } : {};

  const update = (name: keyof LearnerDetails, value: string) => setDetails({ ...details, [name]: value });

  const submit = () => {
    setSubmitted(true);
    const hasErrors =
      !details.studentName.trim() ||
      !details.age ||
      !details.grade ||
      !details.parentName.trim() ||
      !emailValid ||
      !studentEmailValid;
    if (hasErrors) return;
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      onContinue();
    }, 150);
  };

  return (
    <div className="details-layout step-enter">
      <div className="details-card">
        {/* HEADER OVERVIEW BANNER */}
        <div style={{ background: "color-mix(in srgb, var(--surface) 90%, var(--brand-soft))", border: "1.5px solid #f59e0b", borderRadius: "16px", padding: "20px 24px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="code" size={22} />
            </span>
            <div>
              <strong style={{ fontSize: "17px", color: "var(--ink)", fontFamily: "Manrope", display: "block" }}>
                Free 45-Minute Live Interactive Trial Class
              </strong>
              <span style={{ fontSize: "13px", color: "var(--ink-soft)", display: "block", marginTop: "2px" }}>
                Personalized 1-on-1 session with a certified computer science educator. 100% free with zero obligation.
              </span>
            </div>
          </div>
          <span style={{ padding: "6px 14px", borderRadius: "20px", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", fontWeight: 800, fontSize: "12px" }}>
            ✓ Top 1% STEM Mentors
          </span>
        </div>

        {/* SECTION 1: STUDENT INFORMATION */}
        <div className="form-section">
          <div className="form-section__title">
            <span style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", color: "#d97706" }}><Icon name="user" size={20} /></span>
            <div>
              <strong>1. Student Information</strong>
              <small>Helps us match the appropriate curriculum and mentor for your child.</small>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-span">
              <FormField
                label="Student full name"
                name="studentName"
                value={details.studentName}
                placeholder="e.g. Alex Johnson"
                required
                error={errors.studentName}
                onChange={update}
              />
            </div>

            <FormField
              label="Student age"
              name="age"
              value={details.age}
              options={AGE_OPTIONS}
              required
              error={errors.age}
              onChange={update}
            />

            <FormField
              label="Grade / School year"
              name="grade"
              value={details.grade}
              options={GRADE_OPTIONS}
              required
              error={errors.grade}
              onChange={update}
            />

            <div className="form-span">
              <FormField
                label="Prior coding experience"
                name="experience"
                value={details.experience}
                options={EXPERIENCE_OPTIONS}
                optional
                helper="Select your child's current familiarity with coding."
                onChange={update}
              />
            </div>

            <div className="form-span">
              <FormField
                label="Primary area of interest"
                name="interest"
                value={details.interest || ""}
                options={INTEREST_OPTIONS}
                optional
                helper="Optional — helps the mentor customize the hands-on project."
                onChange={update}
              />
            </div>
          </div>
        </div>

        <div className="form-divider" />

        {/* SECTION 2: PARENT & CONTACT INFORMATION */}
        <div className="form-section">
          <div className="form-section__title">
            <span style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", color: "#059669" }}><Icon name="spark" size={20} /></span>
            <div>
              <strong>2. Parent & Contact Details</strong>
              <small>Where we should deliver the live class invitation and mentor progress report.</small>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-span">
              <FormField
                label="Parent / Guardian full name"
                name="parentName"
                value={details.parentName}
                placeholder="e.g. Sarah Johnson"
                required
                error={errors.parentName}
                onChange={update}
              />
            </div>

            <FormField
              label="Parent email address"
              name="parentEmail"
              value={details.parentEmail}
              type="email"
              placeholder="parent@example.com"
              required
              error={errors.parentEmail}
              helper="Classroom access link and calendar invite sent via Resend."
              onChange={update}
            />

            <FormField
              label="Phone number"
              name="phone"
              value={details.phone}
              type="tel"
              placeholder="+1 (555) 000-0000"
              optional
              helper="Optional — for class reminder notifications."
              onChange={update}
            />

            <div className="form-span">
              <FormField
                label="Notes for the mentor"
                name="mentorNote"
                value={details.mentorNote || ""}
                placeholder="e.g. Learning goals, child's hobbies, or specific topics of interest..."
                optional
                helper="Optional — reviewed by the mentor before the live class."
                onChange={update}
              />
            </div>
          </div>
        </div>

        {/* TRUST BADGE */}
        <div style={{ background: "color-mix(in srgb, var(--surface) 95%, var(--brand-soft))", border: "1px solid var(--line)", borderRadius: "14px", padding: "14px 20px", marginTop: "28px", display: "flex", alignItems: "center", gap: "12px", color: "var(--ink-soft)", fontSize: "13px" }}>
          <span style={{ color: "#f59e0b" }}><Icon name="shield" size={20} /></span>
          <span><b>Privacy & Zero-Obligation Guarantee:</b> 100% Free 45-Minute Live Interactive Trial. No credit card required, zero spam, and complete student privacy protection.</span>
        </div>

        <div className="details-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginTop: "32px" }}>
          <ActionButton variant="ghost" onClick={onContinue} style={{ fontSize: "14px", fontWeight: 700 }}>
            Skip to Choose Time →
          </ActionButton>
          <ActionButton onClick={submit} disabled={loading} style={{ minWidth: "240px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white" }}>
            {loading ? <><span className="button-loader" /> Saving details...</> : <>Continue to Step 2: Choose Time <Icon name="arrow" size={18} /></>}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// STEP 2: TIME (Date, Timezone, Time Slot & Daily Capacity)
function ChooseTime({
  dates = [],
  selectedDate,
  setSelectedDate,
  time,
  setTime,
  onBack,
  onContinue,
  slots = [],
  loading = false,
  error = "",
  timezone = "America/New_York",
  onTimezone,
  capacityInfo,
}: {
  dates: DateInfo[];
  selectedDate: DateInfo;
  setSelectedDate: (date: DateInfo) => void;
  time: string;
  setTime: (time: string) => void;
  onBack: () => void;
  onContinue: () => void;
  slots: AvailabilitySlot[];
  loading: boolean;
  error: string;
  timezone: string;
  onTimezone: (timezone: string) => void;
  capacityInfo?: { totalCapacity: number; remainingCapacity: number; bookedCount: number } | null;
}) {
  const currDate = selectedDate || dates.find((d) => !d.disabled) || dates[0] || {
    id: "2026-09-28",
    day: "Mon",
    num: 28,
    month: "September",
    full: "Monday, September 28",
    disabled: false,
    isWeekend: false,
    statusText: "Open",
    today: false,
  };

  const safeSlots = Array.isArray(slots) ? slots : [];

  const totalDayCapacity = capacityInfo?.totalCapacity ?? 20;
  const remainingDaySlots = currDate.isWeekend ? 0 : (capacityInfo?.remainingCapacity ?? 0);
  const safeTimezoneStr = formatTimezone(timezone);

  return (
    <div className="booking-grid step-enter">
      <div className="booking-main">
        {/* TIMEZONE SELECTION CONTROL: High-visibility dropdown + 1-click pills */}
        <div style={{ background: "color-mix(in srgb, var(--surface) 90%, var(--brand-soft))", border: "1.5px solid #f59e0b", borderRadius: "16px", padding: "18px 20px", marginBottom: "24px", boxShadow: "0 6px 20px rgba(245, 158, 11, 0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "40px", height: "40px", display: "grid", placeItems: "center", borderRadius: "12px", background: "#f59e0b", color: "white" }}>
                <Icon name="globe" size={22} />
              </span>
              <div>
                <strong style={{ display: "block", fontSize: "16px", color: "var(--ink)", fontFamily: "Manrope" }}>Select Your Timezone</strong>
                <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>All class timings automatically sync to your local clock.</span>
              </div>
            </div>

            <div style={{ minWidth: "240px" }}>
              <select
                value={timezone || "America/New_York"}
                onChange={(e) => {
                  if (onTimezone) onTimezone(e.target.value);
                  setTime("");
                }}
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #f59e0b",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.flag} {zone.city} ({zone.detail})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink-soft)", marginRight: "4px" }}>Quick Select:</span>
            {TIMEZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => {
                  if (onTimezone) onTimezone(zone.id);
                  setTime("");
                }}
                style={{
                  border: timezone === zone.id ? "1.5px solid #f59e0b" : "1px solid var(--line)",
                  background: timezone === zone.id ? "#f59e0b" : "var(--surface)",
                  color: timezone === zone.id ? "white" : "var(--ink)",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {zone.flag} {zone.city}
              </button>
            ))}
          </div>
        </div>

        {/* DAILY PARENT CAPACITY CARD (20 parents max per day) */}
        <div className="daily-capacity-card" style={{ border: currDate.isWeekend ? "1.5px solid #ef4444" : "1.5px solid #f59e0b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "10px", background: currDate.isWeekend ? "#ef4444" : "#f59e0b", color: "white", display: "grid", placeItems: "center" }}>
                <Icon name={currDate.isWeekend ? "clock" : "zap"} size={20} />
              </span>
              <div>
                <strong style={{ fontSize: "15px", color: "var(--ink)", fontFamily: "Manrope", display: "block" }}>
                  {currDate.isWeekend
                    ? "Weekend: 0 of 20 Parent Slots Available (Mentors Offline)"
                    : capacityInfo
                    ? `Daily Trial Capacity: ${remainingDaySlots} of ${totalDayCapacity} Parent Slots Remaining`
                    : "Live availability is unavailable"}
                </strong>
                <span style={{ fontSize: "13px", color: "var(--ink-soft)", display: "block", marginTop: "2px" }}>
                  Selected: <b>{currDate.full}</b> · {currDate.isWeekend ? "Mentors operate Monday–Friday (10:00 AM – 9:00 PM IST)" : capacityInfo ? "Max 20 parents per day (10 mentors × 2 slots/day)" : "The booking service did not return capacity data."}
                </span>
              </div>
            </div>
            <span style={{ padding: "6px 14px", borderRadius: "20px", background: currDate.isWeekend ? "#fee2e2" : "#ecfdf5", color: currDate.isWeekend ? "#991b1b" : "#065f46", fontWeight: 800, fontSize: "13px" }}>
              {currDate.isWeekend ? "🔴 Weekend Closed" : !capacityInfo ? (loading ? "Checking…" : "🔴 Unavailable") : remainingDaySlots > 0 ? `🟢 ${remainingDaySlots} Slots Open Today` : "🔴 Fully Booked"}
            </span>
          </div>
          <div className="capacity-bar-track">
            <div className="capacity-bar-fill" style={{ width: `${(remainingDaySlots / totalDayCapacity) * 100}%`, background: currDate.isWeekend ? "#ef4444" : undefined }} />
          </div>
        </div>

        {currDate.isWeekend && (
          <div style={{ background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: "12px", padding: "14px 18px", margin: "14px 0 20px", display: "flex", alignItems: "center", gap: "12px", color: "#9f1239", fontSize: "13px" }}>
            <Icon name="clock" size={20} />
            <div>
              <strong>Weekend Note:</strong>
              <span style={{ display: "block", marginTop: "2px" }}>Mentors are offline on Saturday & Sunday. Please choose an upcoming weekday (Monday–Friday) below to book your free trial.</span>
            </div>
          </div>
        )}

        <div className="section-heading"><span>01</span><div><strong>Choose a date</strong><small>Pick a day that works best for your family (Monday – Friday).</small></div></div>
        <div className="month-row"><strong>{currDate.month} {new Date().getFullYear()}</strong><span>Times converted for {safeTimezoneStr}</span></div>
        <div className="date-strip">
          {dates.map((d) => (
            <ActionButton
              variant="secondary"
              disabled={d.disabled}
              onClick={() => { setSelectedDate(d); setTime(""); }}
              className={`date-cell ${d.id === currDate.id ? "is-selected" : ""} ${d.today ? "is-today" : ""} ${d.isWeekend ? "is-weekend" : ""}`}
              key={d.id}
            >
              <span>{d.day}</span>
              <strong>{d.num}</strong>
              <small style={{ color: d.isWeekend ? "#ef4444" : undefined }}>
                {d.isWeekend ? "Weekend" : d.today ? "Today" : "Open"}
              </small>
            </ActionButton>
          ))}
        </div>

        <div className="selection-rule" />
        <div className="section-heading"><span>02</span><div><strong>Choose a time slot</strong><small>{currDate.isWeekend ? "No slots available on weekends. Please pick a weekday." : "Available 45-minute trial classes in your local timezone."}</small></div></div>
        <div className="time-grid">
          {safeSlots.map((slot, index) => {
            const isAvailable = slot.available && !currDate.isWeekend;
            return (
              <ActionButton
                variant="secondary"
                disabled={loading || !isAvailable}
                onClick={() => setTime(slot.time)}
                className={`time-slot ${time === slot.time ? "is-selected" : ""} ${!isAvailable ? "is-unavailable" : ""}`}
                key={slot.time}
              >
                <Icon name="clock" size={17} /> {loading ? "Checking..." : slot.time}
                {index === 2 && isAvailable && <span>Popular</span>}
              </ActionButton>
            );
          })}
        </div>
        {error && <div className="availability-alert"><Icon name="clock" size={20} /><div><strong>Notice:</strong><span>{error}</span></div></div>}

        <div className="details-actions" style={{ marginTop: "36px" }}>
          <ActionButton variant="ghost" onClick={onBack}>
            ← Back to Details
          </ActionButton>
          <ActionButton disabled={!time || currDate.isWeekend} onClick={onContinue} style={{ minWidth: "220px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white" }}>
            Continue to Step 3: Choose Mentor <Icon name="arrow" size={18} />
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// STEP 3: MENTOR (Only mentors available for the selected time can be chosen)
function ChooseMentor({
  date,
  time,
  timezone = "America/New_York",
  selectedMentor,
  setSelectedMentor,
  onBack,
  onContinue,
  slots = [],
}: {
  date: DateInfo;
  time: string;
  timezone: string;
  selectedMentor: string;
  setSelectedMentor: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
  slots: AvailabilitySlot[];
}) {
  const currDate = date || { full: "Monday, September 28", isWeekend: false };
  const safeSlots = Array.isArray(slots) ? slots : [];
  const selectedSlot = safeSlots.find((slot) => slot.time === time);
  const safeTimezoneStr = formatTimezone(timezone);

  const isMentorAvailable = (mentorId: string) =>
    Boolean(selectedSlot?.availableMentors?.some((availableMentor) => availableMentor.id === mentorId));

  return (
    <div className="booking-grid step-enter">
      <div className="booking-main">
        {/* TIME SLOT SUMMARY BANNER */}
        <div style={{ background: "color-mix(in srgb, var(--surface) 90%, var(--brand-soft))", border: "1.5px solid var(--line-strong)", borderRadius: "14px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#f59e0b", color: "white", display: "grid", placeItems: "center" }}>
              <Icon name="clock" size={18} />
            </span>
            <div>
              <small style={{ color: "var(--ink-soft)", textTransform: "uppercase", fontSize: "11px", fontWeight: 700 }}>Selected Class Timing</small>
              <strong style={{ display: "block", fontSize: "15px", color: "var(--ink)", fontFamily: "Manrope" }}>
                {currDate.full} at {time || "Selected Time"} ({safeTimezoneStr})
              </strong>
            </div>
          </div>
          <ActionButton variant="ghost" onClick={onBack} style={{ padding: "4px 12px", fontSize: "13px", height: "auto" }}>
            Change Time
          </ActionButton>
        </div>

        <div className="section-heading">
          <span>03</span>
          <div>
            <strong>Mentors Available for This Time</strong>
            <small>
              Select your preferred educator from our top 1% certified coding mentors.
            </small>
          </div>
        </div>

        <div style={{ background: "color-mix(in srgb, var(--surface) 95%, var(--brand-soft))", border: "1px solid var(--line)", borderRadius: "12px", padding: "12px 16px", margin: "14px 0 20px", fontSize: "13px", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#f59e0b" }}><Icon name="shield" size={18} /></span>
          <span><b>Capacity Guarantee:</b> Each mentor accepts at most 2 trial classes per calendar day (Asia/Kolkata 10:00 AM – 9:00 PM IST). Total daily parent limit: 20 parents.</span>
        </div>

        <div className="mentor-grid step-enter" style={{ maxHeight: "none", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "14px" }}>
          {MENTORS.map((item, index) => {
            const available = isMentorAvailable(item.id);
            const isAssigned = selectedMentor === item.id;

            return (
              <div
                className={`mentor-option ${isAssigned ? "is-selected" : ""} ${!available ? "is-unavailable" : ""}`}
                key={item.id}
                onClick={() => {
                  if (available) setSelectedMentor(item.id);
                }}
                style={{ cursor: available ? "pointer" : "not-allowed", padding: "16px" }}
              >
                <span className={`mentor-avatar mentor-tone-${(index % 3) + 1}`} style={{ width: "48px", height: "48px", fontSize: "16px" }}>
                  {item.initials}
                  <i className={`online-dot ${!available ? "offline" : ""}`} style={{ background: available ? "#10b981" : "#94a3b8" }} />
                </span>
                <span className="mentor-option__copy">
                  <strong style={{ fontSize: "15px" }}>{item.name}</strong>
                  <small style={{ fontSize: "12px" }}>{item.specialty} · ★ {item.rating}</small>
                  <b style={{ color: available ? "#10b981" : "#e11d48", fontSize: "12px", marginTop: "4px" }}>
                    {available ? "✓ Available for this time" : "✕ Not available for this time"}
                  </b>
                </span>
                <span className="mentor-radio">
                  {available ? <Icon name="check" size={14} /> : <Icon name="clock" size={14} />}
                </span>
              </div>
            );
          })}
        </div>

        <div className="details-actions" style={{ marginTop: "32px" }}>
          <ActionButton variant="ghost" onClick={onBack}>
            ← Back to Time
          </ActionButton>
          <ActionButton onClick={onContinue} style={{ minWidth: "200px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white" }}>
            Continue to Step 4: Review <Icon name="arrow" size={18} />
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ title, rows }: { title: string; rows: Array<[string, string | undefined]> }) {
  return <div className="review-section"><strong>{title}</strong>{rows.filter(([, value]) => value).map(([label, value]) => <span key={label}><small>{label}</small><b>{value}</b></span>)}</div>;
}

// STEP 4: REVIEW
function Review({
  date,
  time,
  onBack,
  onConfirm,
  timezone = "America/New_York",
  details,
  mentor,
  error,
  submitting,
}: {
  date: DateInfo;
  time: string;
  onBack: () => void;
  onConfirm: () => void;
  timezone: string;
  details: LearnerDetails;
  mentor?: typeof MENTORS[number];
  error?: string;
  submitting?: boolean;
}) {
  const currDate = date || { full: "Monday, September 28", isWeekend: false };
  const safeTimezoneStr = formatTimezone(timezone);

  return (
    <div className="review-details-layout step-enter">
      <div className="review-details-card">
        {error && (
          <div className="availability-alert" style={{ marginBottom: "20px" }}>
            <Icon name="clock" size={18} />
            <div>
              <strong>Booking update</strong>
              <span>{error}</span>
            </div>
          </div>
        )}
        <ReviewSection
          title="Student Profile"
          rows={[
            ["Student name", details.studentName],
            ["Age", details.age],
            ["Grade / School year", details.grade],
            ["Coding experience", details.experience || "Brand New to Coding"],
            ["Primary interest", details.interest || "General Coding & Problem Solving"],
            ["Notes for mentor", details.mentorNote],
            ["Student email", details.studentEmail],
          ]}
        />
        <ReviewSection
          title="Parent / Guardian"
          rows={[
            ["Parent name", details.parentName],
            ["Email address", details.parentEmail],
            ["Phone number", details.phone || "Not provided"],
          ]}
        />
        <ReviewSection
          title="Trial Class Details"
          rows={[
            ["Date", currDate.full],
            ["Time", `${time || "Selected Time"} (Your local time)`],
            ["Timezone", safeTimezoneStr],
            ["Session format", "45-Minute Private 1-on-1 Class"],
            ["Assigned Mentor", mentor?.name || "Auto-assigned certified educator"],
            ["Cost", "100% Free (No payment required)"],
          ]}
        />
        <div className="confirmation-email"><span><Icon name="check" size={18} /></span><div><small>Booking email recipient</small><strong>{details.parentEmail || "your email"}</strong><p>Booking details and the class link will be emailed here.</p>{details.studentEmail && <b>Student email · {details.studentEmail}</b>}</div></div>
        <div className="details-actions">
          <ActionButton variant="ghost" onClick={onBack} disabled={submitting}>← Edit Mentor / Details</ActionButton>
          <ActionButton onClick={onConfirm} disabled={submitting} style={{ minWidth: "220px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white" }}>
            {submitting ? <><span className="button-loader" /> Securing slot...</> : <>Confirm Free Trial <Icon name="arrow" size={18} /></>}
          </ActionButton>
        </div>
      </div>
      <BookingSummary date={currDate} time={time} timezone={timezone} showAction={false} review mentor={mentor} />
    </div>
  );
}

function MentorSearch({ mentorName }: { mentorName: string }) {
  const [phase, setPhase] = useState(0);
  const messages = [
    ["Matching expert mentor...", `Checking educator availability for your selected slot`],
    ["Securing your trial session...", "Holding your chosen date and time"],
    ["Sending confirmation via Resend...", "Preparing your personalized class link"],
    ["Mentor confirmed", "Preparing your class details"],
  ];
  useEffect(() => {
    const timers = [600, 1200, 1800].map((delay, index) => window.setTimeout(() => setPhase(index + 1), delay));
    return () => timers.forEach(window.clearTimeout);
  }, []);
  return (
    <div className="search-state step-enter">
      <div className="search-orbit">
        <div className="orbit-ring" /><span className="search-center"><Icon name="code" size={28} /></span>
        <span className="search-node node-one"><Icon name="calendar" size={17} /></span>
        <span className="search-node node-two"><Icon name="spark" size={16} /></span>
        <span className="search-node node-three"><Icon name="check" size={16} /></span>
      </div>
      <div className="title search-message" key={phase}>{messages[phase]?.[0] || messages[3][0]}{phase >= 3 && <span className="found-check"><Icon name="check" size={18} /></span>}</div>
      <p className="search-message" key={`copy-${phase}`}>{messages[phase]?.[1] || messages[3][1]}</p>
      <div className="search-dots"><i /><i /><i /></div>
      <div className="loading-track"><span /></div>
      <small>Personalizing your trial experience</small>
    </div>
  );
}

// STEP 5: SUCCESS / CONFIRMED
function Success({ date, time, booking, timezone, parentEmail }: { date: DateInfo; time: string; booking: BookingResult; timezone: string; parentEmail: string }) {
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const mentorInitials = (booking.mentor?.name || "Mentor")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const copyLink = () => {
    navigator.clipboard?.writeText(booking.classLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const joinClass = () => {
    setJoining(true);
    window.setTimeout(() => {
      setJoining(false);
      window.open(booking.classLink, "_blank", "noopener,noreferrer");
    }, 600);
  };
  return (
    <div className="success-layout step-enter">
      <div className="success-head">
        <div className="success-check"><Icon name="check" size={39} /></div>
        <div className="eyebrow">Booking confirmed · #{booking.id.slice(0, 8).toUpperCase()}</div>
        <div className="title">You're all set!</div>
        <p>Your child's trial class has been successfully booked. We can't wait to meet you.</p>
        <div className="sent-confirmation"><Icon name="check" size={16} /><span><strong>Booking confirmed</strong> A confirmation email is being processed for <b>{parentEmail}</b>. If it does not arrive shortly, check spam or contact support.</span></div>
      </div>
      <div className="confirmation-grid">
        <div className="confirmation-card">
          <div className="mentor-ready">
            <div className="mentor-ready__status"><span /><strong>Your mentor is ready</strong></div>
            <div className="mentor-ready__profile">
              <div className="mentor-avatar mentor-avatar--featured">{mentorInitials}<span className="online-dot" /></div>
              <div>
                <strong>{booking.mentor.name}</strong>
                <span>{booking.mentor.role || "Coding Mentor"} · ★★★★★</span>
                <small>“Ready to help your child discover the joy of coding.”</small>
              </div>
              <b>Assigned</b>
            </div>
          </div>
          <div className="confirm-top"><span>Trial class</span><b><i /> Confirmed</b></div>
          <div className="confirm-date">{date.full}</div>
          <div className="confirm-time">{time}</div>
          <div className="summary-zone"><Icon name="globe" size={15} /> {booking.parentTime || time} · {formatTimezone(timezone)}</div>
          <div className="summary-zone"><Icon name="clock" size={15} /> Mentor local time · {booking.mentorTime}</div>
          <div className="divider" />
          <div className="confirm-actions">
            <ActionButton className={`join-button ${joining ? "is-loading" : ""}`} onClick={joinClass} disabled={joining}>{joining ? <><span className="button-loader" /> Connecting...</> : <><Icon name="play" size={17} /> Join Live Class</>}</ActionButton>
            <ActionButton variant="secondary" onClick={copyLink}><Icon name={copied ? "check" : "copy"} size={17} /> {copied ? "Link copied" : "Copy class link"}</ActionButton>
          </div>
        </div>
        <div className="next-card">
          <div className="next-icon"><Icon name="calendar" size={22} /></div>
          <strong>What's next?</strong>
          <p>We've sent a calendar invite and class link to your email.</p>
          <span><i>1</i><b>Check your inbox</b><small>Booking details are on their way via Resend</small></span>
          <span><i>2</i><b>Join 5 minutes early</b><small>Test your audio and video</small></span>
          <span><i>3</i><b>Bring your curiosity</b><small>We'll take care of the rest</small></span>
        </div>
      </div>
    </div>
  );
}

function Booking({
  onHome,
  onNavigate,
  dark,
  onTheme,
}: {
  onHome: () => void;
  onNavigate: (view: "landing" | "booking" | "programs" | "how-it-works" | "for-parents") => void;
  dark: boolean;
  onTheme: () => void;
}) {
  const dates = useDates();
  const [date, setDate] = useState(() => dates.find((d) => !d.disabled) || dates[0]);
  const [time, setTime] = useState("");
  const [step, setStep] = useState(1);
  const [searching, setSearching] = useState(false);
  // No mentor pre-selected — user must explicitly pick one on Step 3.
  const [selectedMentor, setSelectedMentor] = useState("");
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [timezone, setTimezone] = useState(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return tz || "America/New_York";
    } catch {
      return "America/New_York";
    }
  });

  const [details, setDetails] = useState<LearnerDetails>({
    studentName: "", age: "", grade: "", experience: "", studentEmail: "",
    parentName: "", parentEmail: "", phone: "",
  });

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [capacityInfo, setCapacityInfo] = useState<{ totalCapacity: number; remainingCapacity: number; bookedCount: number } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch real availability from backend whenever date or timezone changes
  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    setSlotError("");
    setSlots([]);
    setCapacityInfo(null);

    getAvailabilityData(date.id, timezone)
      .then((data) => {
        if (!active) return;
        setSlots(data.slots);
        setCapacityInfo({
          totalCapacity: data.totalCapacity,
          remainingCapacity: data.remainingCapacity,
          bookedCount: data.bookedCount,
        });
        setLoadingSlots(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Could not fetch availability from backend:", err.message);
        setSlots([]);
        setCapacityInfo(null);
        setSlotError("Live availability could not be loaded. Please refresh or try again later.");
        setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [date.id, timezone]);

  const mentor = MENTORS.find((item) => item.id === selectedMentor);

  const confirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setBookingError("");
    setSearching(true);

    const startTime = Date.now();

    try {
      const result = await createBooking({
        parent: {
          fullName: details.parentName,
          email: details.parentEmail,
          phone: details.phone || undefined,
          timezone,
        },
        student: {
          firstName: details.studentName,
          age: details.age,
          grade: details.grade,
          codingExperience: details.experience || undefined,
          email: details.studentEmail || undefined,
        },
        date: date.id,
        time,
        timezone,
        mentorId: selectedMentor || undefined,
      });

      const elapsed = Date.now() - startTime;
      const delayRemaining = Math.max(0, 1800 - elapsed);

      window.setTimeout(() => {
        setBooking(result);
        setSearching(false);
        setSubmitting(false);
        setStep(5);
      }, delayRemaining);
    } catch (err: any) {
      console.error("Booking error:", err);
      const elapsed = Date.now() - startTime;
      const delayRemaining = Math.max(0, 1000 - elapsed);

      window.setTimeout(() => {
        setSearching(false);
        setSubmitting(false);
        const errMsg = err.message || "Unable to complete booking. Please try another time slot.";
        setBookingError(errMsg);
      }, delayRemaining);
    }
  };

  return (
    <div className="booking-page page-enter">
      <div className="booking-nav shell">
        <div className="booking-nav-left">
          <Brand onClick={onHome} />
          <button type="button" className="back-btn" onClick={onHome}>
            <Icon name="arrow" size={14} /> Back to Home
          </button>
        </div>
        <Progress step={step} onStepClick={(targetStep) => setStep(targetStep)} />
        <div className="booking-actions">
          <div className="help-pill">
            <Icon name="phone" size={14} /> Free Trial Support: <strong>(888) 410-0924</strong>
          </div>
          <ThemeToggle dark={dark} onToggle={onTheme} />
        </div>
      </div>
      <div className="booking-shell shell">
        {step < 5 && !searching && (
          <div className="booking-heading">
            <div className="eyebrow"><span /> Free live coding trial</div>
            <div className="title">
              {step === 1
                ? "Tell us a little about your learner"
                : step === 2
                ? "Find a time that works for you"
                : step === 3
                ? "Choose your expert mentor"
                : "Review your booking"}
            </div>
            <p>
              {step === 1
                ? "Just a few details so we can prepare the best trial experience for your child."
                : step === 2
                ? "Choose a convenient date & time in your local timezone."
                : step === 3
                ? "Select your preferred educator from our top 1% certified coding mentors."
                : "One quick check, then we'll confirm your trial session."}
            </p>
          </div>
        )}
        {step === 1 && (
          <DetailsScreen
            details={details}
            setDetails={setDetails}
            onContinue={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <ChooseTime
            dates={dates}
            selectedDate={date}
            setSelectedDate={setDate}
            time={time}
            setTime={setTime}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
            slots={slots}
            loading={loadingSlots}
            error={slotError}
            timezone={timezone}
            onTimezone={setTimezone}
            capacityInfo={capacityInfo}
          />
        )}
        {step === 3 && (
          <ChooseMentor
            date={date}
            time={time}
            timezone={timezone}
            selectedMentor={selectedMentor}
            setSelectedMentor={setSelectedMentor}
            onBack={() => { setSelectedMentor(""); setStep(2); }}
            onContinue={() => {
              if (!selectedMentor) {
                alert("Please select a mentor to continue.");
                return;
              }
              setStep(4);
            }}
            slots={slots}
          />
        )}
        {step === 4 && !searching && (
          <Review
            date={date}
            time={time}
            onBack={() => setStep(3)}
            onConfirm={confirm}
            details={details}
            timezone={timezone}
            mentor={mentor}
            error={bookingError}
            submitting={submitting}
          />
        )}
        {searching && <MentorSearch mentorName={mentor?.name || "your mentor"} />}
        {step === 5 && !searching && booking && (
          <Success
            date={date}
            time={time}
            booking={booking}
            timezone={timezone}
            parentEmail={details.parentEmail}
          />
        )}
      </div>
      <div className="booking-footer">Secure booking · No payment required · Your privacy is protected</div>
    </div>
  );
}

// Root entry point for the existing Codeyoung trial booking experience.
export default function App() {
  const [view, setView] = useState<"landing" | "booking" | "programs" | "how-it-works" | "for-parents">("landing");
  const [dark, setDark] = useState(false);

  return (
    <div className={`app ${dark ? "theme-dark" : "theme-light"}`}>
      {view === "landing" && (
        <Landing
          onBook={() => setView("booking")}
          onNavigate={(v) => setView(v)}
          dark={dark}
          onTheme={() => setDark((value) => !value)}
        />
      )}
      {view === "landing" && <DemoChatbotWidget onBook={() => setView("booking")} />}
      {view === "programs" && (
        <ProgramsPage
          onNavigate={(v) => setView(v)}
          dark={dark}
          onTheme={() => setDark((value) => !value)}
        />
      )}
      {view === "how-it-works" && (
        <HowItWorksPage
          onNavigate={(v) => setView(v)}
          dark={dark}
          onTheme={() => setDark((value) => !value)}
        />
      )}
      {view === "for-parents" && (
        <ForParentsPage
          onNavigate={(v) => setView(v)}
          dark={dark}
          onTheme={() => setDark((value) => !value)}
        />
      )}
      {view === "booking" && (
        <Booking
          onHome={() => setView("landing")}
          onNavigate={(v) => setView(v)}
          dark={dark}
          onTheme={() => setDark((value) => !value)}
        />
      )}
    </div>
  );
}
