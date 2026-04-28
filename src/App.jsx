import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// Replace these two values with your own from supabase.com → Settings → API
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ADMIN_KEY      = "mechaiml_admin_token";
const ADMIN_PASSWORD = "Krish8852";
const DEFAULT_IMAGE  =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80";

const CAT_META = {
  AIML:     { icon: "🤖", color: "#818cf8", bg: "rgba(129,140,248,0.14)", border: "rgba(129,140,248,0.3)" },
  IoT:      { icon: "📡", color: "#34d399", bg: "rgba(52,211,153,0.14)",  border: "rgba(52,211,153,0.3)"  },
  Web:      { icon: "🌐", color: "#38bdf8", bg: "rgba(56,189,248,0.14)",  border: "rgba(56,189,248,0.3)"  },
  Robotics: { icon: "🦾", color: "#f472b6", bg: "rgba(244,114,182,0.14)", border: "rgba(244,114,182,0.3)" },
  Mech:     { icon: "⚙️", color: "#fb923c", bg: "rgba(251,146,60,0.14)",  border: "rgba(251,146,60,0.3)"  },
};

const FALLBACK_CATEGORY = {
  icon: "🔬", color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.24)",
};

const EMPTY_FORM = {
  title: "", description: "", category: "", tech: "",
  link: "", github: "", author: "", image: "",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function catMeta(category) {
  return CAT_META[category] || FALLBACK_CATEGORY;
}

function matchesSearch(project, term) {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return [project.title, project.description, project.tech, project.author, project.category]
    .some((v) => (v || "").toLowerCase().includes(q));
}

// ─── PARALLAX ORBS HOOK ───────────────────────────────────────────────────────
function useParallaxOrbs() {
  useEffect(() => {
    const violet = document.querySelector(".app-orb--violet");
    const gold   = document.querySelector(".app-orb--gold");
    const green  = document.querySelector(".app-orb--green");
    if (!violet || !gold || !green) return;

    const onMove = (e) => {
      const cx = (e.clientX / window.innerWidth  - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      violet.style.transform = `translate(${cx * 24}px, ${cy * 18}px)`;
      gold.style.transform   = `translate(${cx * -18}px, ${cy * 12}px)`;
      green.style.transform  = `translate(${cx * 10}px, ${cy * -8}px)`;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
}

// ─── CARD 3-D TILT HOOK ───────────────────────────────────────────────────────
function useTilt(ref) {
  useEffect(() => {
    const card = ref.current;
    if (!card) return;

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
      card.style.transform = `
        perspective(900px)
        rotateX(${-y * 5}deg)
        rotateY(${x * 5}deg)
        translateY(-8px)
        scale(1.012)
      `;
    };

    const onLeave = () => {
      card.style.transform = "";
      card.style.transition = "transform 0.5s cubic-bezier(0.22, 0.68, 0, 1.2)";
      setTimeout(() => { card.style.transition = ""; }, 500);
    };

    card.addEventListener("mousemove", onMove, { passive: true });
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, [ref]);
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function AnimatedCounter({ to, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const duration = 900;
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * to));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── STAT COMPONENT ───────────────────────────────────────────────────────────
function Stat({ label, animateTo }) {
  return (
    <div className="hero-stat">
      <div className="hero-stat__value">
        <AnimatedCounter to={animateTo} />
      </div>
      <div className="hero-stat__label">{label}</div>
    </div>
  );
}

// ─── PROJECT FORM ─────────────────────────────────────────────────────────────
function ProjectForm({ categories, form, formError, onChange, onCancel, onSubmit }) {
  return (
    <form className="project-form" onSubmit={onSubmit}>
      <div className="project-form__header">
        <div>
          <p className="project-form__eyebrow">Admin Panel</p>
          <h2 className="project-form__title">Add New Project</h2>
        </div>
        <p className="project-form__hint">
          Title and live link are required. Everything else helps the card feel richer.
        </p>
      </div>

      <div className="project-form__grid">
        <label className="field">
          <span className="field__label">Project Title *</span>
          <input className="field__control" name="title" placeholder="Autonomous Path Planner"
            value={form.title} onChange={onChange} />
        </label>

        <label className="field">
          <span className="field__label">Category</span>
          <input className="field__control" name="category" placeholder="AIML, IoT, Robotics..."
            list="category-suggestions" value={form.category} onChange={onChange} />
        </label>

        <label className="field field--wide">
          <span className="field__label">Short Description</span>
          <textarea className="field__control field__control--textarea" name="description"
            placeholder="Briefly explain the outcome, user problem, or engineering focus."
            value={form.description} onChange={onChange} rows={4} />
        </label>

        <label className="field">
          <span className="field__label">Tech Stack</span>
          <input className="field__control" name="tech" placeholder="Python, OpenCV, Raspberry Pi"
            value={form.tech} onChange={onChange} />
        </label>

        <label className="field">
          <span className="field__label">Live Link *</span>
          <input className="field__control" name="link" type="url"
            placeholder="https://example.com" value={form.link} onChange={onChange} />
        </label>

        <label className="field">
          <span className="field__label">GitHub URL</span>
          <input className="field__control" name="github" type="url"
            placeholder="https://github.com/..." value={form.github} onChange={onChange} />
        </label>

        <label className="field">
          <span className="field__label">Author / Team</span>
          <input className="field__control" name="author" placeholder="Mech Innovators"
            value={form.author} onChange={onChange} />
        </label>

        <label className="field field--wide">
          <span className="field__label">Image URL</span>
          <input className="field__control" name="image" type="url"
            placeholder="https://images.unsplash.com/..." value={form.image} onChange={onChange} />
        </label>
      </div>

      <datalist id="category-suggestions">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>

      <div className="project-form__footer">
        <div className="project-form__message" role="status" aria-live="polite">
          {formError}
        </div>
        <div className="project-form__actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="button button--primary">Save Project</button>
        </div>
      </div>
    </form>
  );
}

// ─── PROJECT CARD ─────────────────────────────────────────────────────────────
function ProjectCard({
  isAdmin, isDeleting, onCancelDelete, onDelete,
  onImageError, onRequestDelete, project, showFallbackImage,
}) {
  const meta    = catMeta(project.category);
  const cardRef = useRef(null);
  useTilt(cardRef);

  return (
    <article
      ref={cardRef}
      className="project-card"
      style={{
        "--card-accent":        meta.color,
        "--card-accent-bg":     meta.bg,
        "--card-accent-border": meta.border,
      }}
    >
      <div className="project-card__glow" aria-hidden="true" />

      <div className="project-card__media">
        {!showFallbackImage ? (
          <img
            className="project-card__image"
            src={project.image || DEFAULT_IMAGE}
            alt={project.title}
            onError={() => onImageError(project.id)}
          />
        ) : (
          <div className="project-card__fallback" aria-hidden="true">
            {meta.icon}
          </div>
        )}
        <div className="project-card__overlay" aria-hidden="true" />
        <div className="project-card__category">
          <span>{meta.icon}</span>
          <span>{project.category || "Other"}</span>
        </div>
      </div>

      <div className="project-card__body">
        <div className="project-card__top">
          <h3 className="project-card__title">{project.title}</h3>
          <p className="project-card__description">
            {project.description || "No description added yet."}
          </p>
        </div>

        {project.tech && (
          <div className="tech-list">
            {project.tech.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
              <span key={t} className="tech-pill">{t}</span>
            ))}
          </div>
        )}

        {project.author && (
          <div className="author-row">
            <div className="author-row__avatar">{project.author.charAt(0).toUpperCase()}</div>
            <span className="author-row__name">{project.author}</span>
          </div>
        )}

        <div className="project-card__actions">
          <a className="button button--card" href={project.link} target="_blank" rel="noreferrer">
            Live Demo ↗
          </a>
          {project.github && (
            <a className="button button--secondary" href={project.github} target="_blank" rel="noreferrer">
              Code
            </a>
          )}
          {isAdmin && !isDeleting && (
            <button type="button" className="icon-button icon-button--danger"
              onClick={() => onRequestDelete(project.id)}
              aria-label={`Delete ${project.title}`}>
              🗑
            </button>
          )}
        </div>

        {isDeleting && (
          <div className="confirm-delete">
            <span className="confirm-delete__text">Delete this project?</span>
            <button type="button" className="button button--danger"
              onClick={() => onDelete(project.id)}>Delete</button>
            <button type="button" className="button button--ghost"
              onClick={onCancelDelete}>No</button>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [projects,       setProjects]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [dbError,        setDbError]        = useState("");
  const [search,         setSearch]         = useState("");
  const [activeCat,      setActiveCat]      = useState("");
  const [showForm,       setShowForm]       = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [formError,      setFormError]      = useState("");
  const [formSuccess,    setFormSuccess]    = useState("");
  const [deleteId,       setDeleteId]       = useState(null);
  const [imgErrors,      setImgErrors]      = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAdmin,        setIsAdmin]        = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(ADMIN_KEY) === "true"
  );
  const [loginPassword,  setLoginPassword]  = useState("");
  const [loginError,     setLoginError]     = useState("");

  useParallaxOrbs();

  // ── Fetch all projects from Supabase on mount ──────────────────────────────
  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setDbError("Could not load projects. Check your Supabase config.");
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const categories = useMemo(
    () => [...new Set(projects.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [projects],
  );

  const filteredProjects = useMemo(
    () => projects.filter(
      (p) => (!activeCat || p.category === activeCat) && matchesSearch(p, search),
    ),
    [activeCat, projects, search],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((cur) => ({ ...cur, [name]: value }));
    if (formError) setFormError("");
  }

  function handleImageError(id) {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  }

  async function handleAddProject(e) {
    e.preventDefault();
    setFormError("");
    const { title, description, category, tech, link, github, author, image } = form;

    if (!title.trim() || !link.trim()) {
      setFormError("Please add both a project title and a live link.");
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([{ title: title.trim(), description, category, tech, link, github, author, image }])
      .select()
      .single();

    if (error) {
      setFormError("Failed to save project. Try again.");
      console.error(error);
      return;
    }

    setProjects((cur) => [data, ...cur]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setFormSuccess("Project added successfully!");
    setTimeout(() => setFormSuccess(""), 3000);
  }

  async function handleDeleteProject(projectId) {
    if (!isAdmin) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error(error);
      return;
    }

    setProjects((cur) => cur.filter((p) => p.id !== projectId));
    setDeleteId(null);
    setFormSuccess("Project deleted.");
    setTimeout(() => setFormSuccess(""), 3000);
  }

  function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    if (loginPassword === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_KEY, "true");
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginPassword("");
      setFormSuccess("Admin access granted!");
      setTimeout(() => setFormSuccess(""), 3000);
    } else {
      setLoginError("Incorrect password");
      setLoginPassword("");
    }
  }

  function handleLogout() {
    localStorage.removeItem(ADMIN_KEY);
    setIsAdmin(false);
    setShowForm(false);
    setDeleteId(null);
    setFormSuccess("Logged out.");
    setTimeout(() => setFormSuccess(""), 3000);
  }

  function handleToggleForm() {
    setShowForm((cur) => !cur);
    setFormError("");
    if (showForm) setForm(EMPTY_FORM);
  }

  function handleCancelForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  // ── Login modal ────────────────────────────────────────────────────────────
  function LoginModal() {
    return (
      <div className="modal-backdrop">
        <div className="modal">
          <h2 className="modal__title">Admin Login</h2>
          <form onSubmit={handleLogin} className="modal__form">
            <input type="password" className="modal__input"
              placeholder="Enter admin password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoFocus />
            {loginError && <div className="modal__error">{loginError}</div>}
            <div className="modal__actions">
              <button type="submit" className="button button--primary">Login</button>
              <button type="button" className="button button--ghost"
                onClick={() => setShowLoginModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="app-shell">
        {showLoginModal && !isAdmin && <LoginModal />}

        <div className="app-noise" aria-hidden="true" />
        <div className="app-orbs" aria-hidden="true">
          <div className="app-orb app-orb--violet" />
          <div className="app-orb app-orb--gold" />
          <div className="app-orb app-orb--green" />
        </div>

        {/* ── FIXED TOP-RIGHT ADMIN NAV ──────────────────────────────────── */}
        <div className="top-nav">
          {isAdmin ? (
            <>
              <span className="admin-badge">⚡ Admin</span>
              <button className="button button--ghost top-nav__btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button type="button" className="top-nav__login"
              onClick={() => setShowLoginModal(true)}>
              <span className="top-nav__login-icon">🔐</span>
              Admin Login
            </button>
          )}
        </div>

        <div className="app-layout">

          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <section className="hero">
            <div className="hero-badge">
              <span className="hero-badge__dot" />
              SE Mech · NMIET
            </div>
            <h1 className="hero-title">
              Mech-AIML <span>Hub</span>
            </h1>
            <p className="hero-subtitle">
              Where <strong>Engineering</strong> Meets Intelligence
            </p>
            <p className="hero-copy">
              A curated showcase of student-built projects spanning AI, IoT,
              Robotics, and Mechanical Engineering — built at NMIET.
            </p>
            <div className="hero-stats">
              <Stat label="Projects"   animateTo={projects.length} />
              <Stat label="Categories" animateTo={categories.length} />
              <Stat label="Showing"    animateTo={filteredProjects.length} />
            </div>
          </section>

          {/* ── DB ERROR BANNER ───────────────────────────────────────────── */}
          {dbError && (
            <div style={{
              padding: "14px 20px", marginBottom: 16,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 16, color: "#fca5a5", fontSize: "0.9rem"
            }}>
              ⚠️ {dbError}
            </div>
          )}

          {/* ── CONTROLS PANEL ────────────────────────────────────────────── */}
          <div className="controls-panel">
            <div className="controls-row">
              <div className="search-box">
                <span className="search-box__icon" aria-hidden="true">⌕</span>
                <input
                  id="search"
                  className="search-box__input"
                  placeholder="Search projects, tech, author, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="button button--primary button--toolbar"
                onClick={handleToggleForm}
              >
                {showForm ? "✕ Close Panel" : "+ Add Project"}
              </button>
            </div>

            <div className="category-row">
              <button
                type="button"
                className={`category-pill${activeCat ? "" : " category-pill--active"}`}
                onClick={() => setActiveCat("")}
              >
                All
              </button>
              {categories.map((cat) => {
                const meta     = catMeta(cat);
                const isActive = activeCat === cat;
                return (
                  <button key={cat} type="button"
                    className={`category-pill${isActive ? " category-pill--active" : ""}`}
                    style={{ "--pill-color": meta.color, "--pill-bg": meta.bg, "--pill-border": meta.border }}
                    onClick={() => setActiveCat(isActive ? "" : cat)}
                  >
                    <span>{meta.icon}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {formSuccess && <div className="toast toast--success">{formSuccess}</div>}

          {showForm && (
            <ProjectForm
              categories={categories}
              form={form}
              formError={formError}
              onChange={handleFormChange}
              onCancel={handleCancelForm}
              onSubmit={handleAddProject}
            />
          )}

          {/* ── LOADING STATE ─────────────────────────────────────────────── */}
          {loading ? (
            <section className="empty-state">
              <div className="empty-state__icon" style={{ animation: "spin 1s linear infinite" }}>⚙️</div>
              <h2 className="empty-state__title">Loading projects…</h2>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </section>
          ) : filteredProjects.length === 0 ? (
            <section className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <h2 className="empty-state__title">No projects found</h2>
              <p className="empty-state__copy">
                Try another keyword, clear the category filter, or add a new project to the hub.
              </p>
            </section>
          ) : (
            <section className="project-grid">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  isAdmin={isAdmin}
                  isDeleting={deleteId === project.id}
                  onCancelDelete={() => setDeleteId(null)}
                  onDelete={handleDeleteProject}
                  onImageError={handleImageError}
                  onRequestDelete={setDeleteId}
                  project={project}
                  showFallbackImage={Boolean(imgErrors[project.id])}
                />
              ))}
            </section>
          )}

        </div>
      </div>
    </>
  );
}