import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, BookOpen, GraduationCap, User } from "lucide-react";

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  // Determine if the current page should be in dark or light theme
  // Landing and login/register are dark theme, all dashboards/test pages are light theme
  const isDarkPage = ["/", "/login", "/register"].includes(location.pathname);

  const activeLinkClass = "border-b-2 border-brand-accent text-brand-accent font-semibold px-1 py-1 transition-all";
  const inactiveLinkClass = isDarkPage
    ? "text-gray-300 hover:text-brand-accent px-1 py-1 transition-all"
    : "text-brand-muted-light hover:text-brand-text-light px-1 py-1 transition-all";

  return (
    <nav
      className={`w-full py-4 px-6 border-b transition-colors duration-300 ${
        isDarkPage
          ? "bg-brand-bg-dark border-brand-border-dark text-brand-text-dark"
          : "bg-brand-bg-light border-brand-border-light text-brand-text-light"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-2xl font-extrabold tracking-tight flex items-center gap-1.5">
            <GraduationCap className="w-7 h-7 text-brand-accent" />
            <span className={isDarkPage ? "text-white" : "text-brand-text-light"}>Aspira</span>
            {currentUser && userRole === "teacher" && (
              <span className="text-sm font-medium text-brand-accent bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-brand-accent/20 ml-2">
                Teacher Dashboard
              </span>
            )}
          </Link>
        </div>

        {/* Right Side: Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          {currentUser ? (
            userRole === "student" ? (
              // Student Links
              <div className="flex items-center gap-6">
                <Link
                  to="/dashboard"
                  className={location.pathname === "/dashboard" ? activeLinkClass : inactiveLinkClass}
                >
                  Dashboard
                </Link>
                <Link
                  to="/diagnostic"
                  className={location.pathname === "/diagnostic" ? activeLinkClass : inactiveLinkClass}
                >
                  Diagnostic
                </Link>
                <Link
                  to="/test"
                  className={location.pathname === "/test" ? activeLinkClass : inactiveLinkClass}
                >
                  Test
                </Link>
                <Link
                  to="/profile"
                  className={location.pathname === "/profile" ? activeLinkClass : inactiveLinkClass}
                >
                  Profile
                </Link>
                <Link
                  to="/feedback"
                  className={location.pathname === "/feedback" ? activeLinkClass : inactiveLinkClass}
                >
                  Feedback
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              // Teacher Links
              <div className="flex items-center gap-4">
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600 font-semibold transition-colors cursor-pointer ml-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )
          ) : (
            // Anonymous Links
            <div className="flex items-center gap-6">
              <Link to="/" className={inactiveLinkClass}>Home</Link>
              <a href="#about" className={inactiveLinkClass}>About</a>
              <a href="#works" className={inactiveLinkClass}>How it works</a>
              <Link
                to="/login"
                className="bg-brand-accent hover:bg-brand-accent-hover text-white px-5 py-2 rounded-[8px] font-semibold transition-all shadow-sm cursor-pointer"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
