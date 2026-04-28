import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "mechaiml_projects";
const ADMIN_KEY = "mechaiml_admin_token";
const ADMIN_PASSWORD = "admin123"; // In production, this should be hashed server-side
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80";

const CAT_META = {
  AIML: {
    icon: "🤖",
    color: "#818cf8",
    bg: "rgba(129, 140, 248, 0.14)",
    border: "rgba(129, 140, 248, 0.3)",
  },
  IoT: {
    icon: "📡",
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.14)",
    border: "rgba(52, 211, 153, 0.3)",
  },
  Web: {
    icon: "🌐",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.14)",
    border: "rgba(56, 189, 248, 0.3)",
  },
  Robotics: {
    icon: "🦾",
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.14)",
    border: "rgba(244, 114, 182, 0.3)",
  },
  Mech: {
    icon: "⚙️",
    color: "#fb923c",
    bg: "rgba(251, 146, 60, 0.14)",
    border: "rgba(251, 146, 60, 0.3)",
  },
};

const FALLBACK_CATEGORY = {
  icon: "🔬",
  color: "#94a3b8",
  bg: "rgba(148, 163, 184, 0.12)",
  border: "rgba(148, 163, 184, 0.24)",
};

const DEFAULT_PROJECTS = [];

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  tech: "",
  link: "",
  github: "",
  author: "",
  image: "",
};

function catMeta(category) {
  return CAT_META[category] || FALLBACK_CATEGORY;
}

function normalizeProject(project, fallbackId = 0) {
  return {
    id:
      typeof project.id === "number" && Number.isFinite(project.id)
        ? project.id
        : fallbackId,
    title: typeof project.title === "string" ? project.title.trim() : "",
    description:
      typeof project.description === "string" ? project.description.trim() : "",
    category:
      typeof project.category === "string" ? project.category.trim() : "",
    tech: typeof project.tech === "string" ? project.tech.trim() : "",
    link: typeof project.link === "string" ? project.link.trim() : "",
    github: typeof project.github === "string" ? project.github.trim() : "",
    author: typeof project.author === "string" ? project.author.trim() : "",
    image: typeof project.image === "string" ? project.image.trim() : "",
  };
}

function loadStoredProjects() {
  if (typeof window === "undefined") {
    return DEFAULT_PROJECTS;
  }

  const fallbackProjects = DEFAULT_PROJECTS.map((project) =>
    normalizeProject(project, project.id),
  );

  try {
    const rawProjects = window.localStorage.getItem(STORAGE_KEY);

    if (rawProjects === null) {
      return fallbackProjects;
    }

    const parsedProjects = JSON.parse(rawProjects);

    if (!Array.isArray(parsedProjects)) {
      return fallbackProjects;
    }

    return parsedProjects.map((project, index) =>
      normalizeProject(project, index + 1),
    );
  } catch (error) {
    console.warn("Unable to read saved projects from localStorage.", error);
    return fallbackProjects;
  }
}

function getNextId(projects) {
  return (
    projects.reduce((highestId, project) => {
      const currentId =
        typeof project.id === "number" && Number.isFinite(project.id)
          ? project.id
          : 0;

      return Math.max(highestId, currentId);
    }, 0) + 1
  );
}

function matchesSearch(project, searchTerm) {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    project.title,
    project.description,
    project.tech,
    project.author,
    project.category,
  ].some((value) => value.toLowerCase().includes(query));
}

function Stat({ label, value }) {
  return (
    <div className="hero-stat">
      <div className="hero-stat__value">{value}</div>
      <div className="hero-stat__label">{label}</div>
    </div>
  );
}

function ProjectForm({
  categories,
  form,
  formError,
  onChange,
  onCancel,
  onSubmit,
}) {
  return (
    <form className="project-form" onSubmit={onSubmit}>
      <div className="project-form__header">
        <div>
          <p className="project-form__eyebrow">Admin Panel</p>
          <h2 className="project-form__title">Add New Project</h2>
        </div>
        <p className="project-form__hint">
          Title and live link are required. Everything else helps the card feel
          richer.
        </p>
      </div>

      <div className="project-form__grid">
        <label className="field">
          <span className="field__label">Project Title *</span>
          <input
            className="field__control"
            name="title"
            placeholder="Autonomous Path Planner"
            value={form.title}
            onChange={onChange}
          />
        </label>

        <label className="field">
          <span className="field__label">Category</span>
          <input
            className="field__control"
            name="category"
            placeholder="AIML, IoT, Robotics..."
            list="category-suggestions"
            value={form.category}
            onChange={onChange}
          />
        </label>

        <label className="field field--wide">
          <span className="field__label">Short Description</span>
          <textarea
            className="field__control field__control--textarea"
            name="description"
            placeholder="Briefly explain the outcome, user problem, or engineering focus."
            value={form.description}
            onChange={onChange}
            rows={4}
          />
        </label>

        <label className="field">
          <span className="field__label">Tech Stack</span>
          <input
            className="field__control"
            name="tech"
            placeholder="Python, OpenCV, Raspberry Pi"
            value={form.tech}
            onChange={onChange}
          />
        </label>

        <label className="field">
          <span className="field__label">Live Link *</span>
          <input
            className="field__control"
            name="link"
            type="url"
            placeholder="https://example.com"
            value={form.link}
            onChange={onChange}
          />
        </label>

        <label className="field">
          <span className="field__label">GitHub URL</span>
          <input
            className="field__control"
            name="github"
            type="url"
            placeholder="https://github.com/..."
            value={form.github}
            onChange={onChange}
          />
        </label>

        <label className="field">
          <span className="field__label">Author / Team</span>
          <input
            className="field__control"
            name="author"
            placeholder="Mech Innovators"
            value={form.author}
            onChange={onChange}
          />
        </label>

        <label className="field field--wide">
          <span className="field__label">Image URL</span>
          <input
            className="field__control"
            name="image"
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={form.image}
            onChange={onChange}
          />
        </label>
      </div>

      <datalist id="category-suggestions">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <div className="project-form__footer">
        <div className="project-form__message" role="status" aria-live="polite">
          {formError}
        </div>

        <div className="project-form__actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button button--primary">
            Save Project
          </button>
        </div>
      </div>
    </form>
  );
}

function ProjectCard({
  isAdmin,
  isDeleting,
  onCancelDelete,
  onDelete,
  onImageError,
  onRequestDelete,
  project,
  showFallbackImage,
}) {
  const meta = catMeta(project.category);

  return (
    <article
      className="project-card"
      style={{
        "--card-accent": meta.color,
        "--card-accent-bg": meta.bg,
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
            {project.tech
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
              .map((item) => (
                <span key={item} className="tech-pill">
                  {item}
                </span>
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
          <a
            className="button button--card"
            href={project.link}
            target="_blank"
            rel="noreferrer"
          >
            Live Demo ↗
          </a>

          {project.github && (
            <a
              className="button button--secondary"
              href={project.github}
              target="_blank"
              rel="noreferrer"
            >
              Code
            </a>
          )}

          {isAdmin && !isDeleting && (
            <button
              type="button"
              className="icon-button icon-button--danger"
              onClick={() => onRequestDelete(project.id)}
              aria-label={`Delete ${project.title}`}
            >
              🗑
            </button>
          )}
        </div>

        {isDeleting && (
          <div className="confirm-delete">
            <span className="confirm-delete__text">Delete this project?</span>
            <button type="button" className="button button--danger" onClick={() => onDelete(project.id)}>
              Delete
            </button>
            <button type="button" className="button button--ghost" onClick={onCancelDelete}>
              No
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function App() {
  const initialProjects = useMemo(() => loadStoredProjects(), []);
  const nextIdRef = useRef(getNextId(initialProjects));
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [imgErrors, setImgErrors] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ADMIN_KEY) === "true";
  });
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const categories = useMemo(
    () =>
      [...new Set(projects.map((project) => project.category).filter(Boolean))].sort(
        (left, right) => left.localeCompare(right),
      ),
    [projects],
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          (!activeCat || project.category === activeCat) &&
          matchesSearch(project, search),
      ),
    [activeCat, projects, search],
  );

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));

    if (formError) {
      setFormError("");
    }
  }


  function handleAddProject(event) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!isAdmin) {
      setFormError("Admin access required");
      return;
    }
    const nextProject = normalizeProject(form, nextIdRef.current);
    if (!nextProject.title || !nextProject.link) {
      setFormError("Please add both a project title and a live link.");
      return;
    }
    setProjects((current) => [
      ...current,
      {
        ...nextProject,
        id: nextIdRef.current++,
      },
    ]);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(false);
    setFormSuccess("Project added successfully!");
    setTimeout(() => setFormSuccess(""), 3000);
  }

  function handleDeleteProject(projectId) {
    if (!isAdmin) {
      setFormError("Admin access required");
      return;
    }
    setProjects((current) => current.filter((project) => project.id !== projectId));
    setDeleteId(null);
    setFormSuccess("Project deleted successfully!");
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
    setFormSuccess("Logged out successfully!");
    setTimeout(() => setFormSuccess(""), 3000);
  }

  function LoginModal() {
    return (
      <div className="modal-backdrop">
        <div className="modal">
          <h2 className="modal__title">Admin Login</h2>
          <form onSubmit={handleLogin} className="modal__form">
            <input
              type="password"
              className="modal__input"
              placeholder="Enter admin password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              autoFocus
            />
            {loginError && <div className="modal__error">{loginError}</div>}
            <div className="modal__actions">
              <button type="submit" className="button button--primary">Login</button>
              <button type="button" className="button button--ghost" onClick={() => setShowLoginModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function handleToggleForm() {
    setShowForm((current) => !current);
    setFormError("");

    if (showForm) {
      setForm(EMPTY_FORM);
    }
  }

  function handleCancelForm() {
    return (
      <div className="app">
        {showLoginModal && !isAdmin && <LoginModal />}
        <header className="header">
          <h1 className="header__title title-glow">Mech-AIML Hub</h1>
          <div className="header__actions">
            {isAdmin ? (
              <>
                <span className="admin-badge">Admin</span>
                <button className="button button--ghost" onClick={handleLogout}>
                  Logout
                </button>
                <button
                  className="button button--primary"
                  onClick={handleToggleForm}
                  aria-label="Add project"
                >
                  + Add Project
                </button>
              </>
            ) : (
              <button
                className="button button--primary"
                onClick={() => setShowLoginModal(true)}
              >
                Admin Login
              </button>
            )}
          </div>
        </header>

        <main className="main">
          {formSuccess && (
            <div className="toast toast--success">{formSuccess}</div>
          )}
          <section className="project-list">
            {filteredProjects.length === 0 ? (
              <div className="empty-state">No projects found.</div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                  isAdmin={isAdmin}
                  isDeleting={deleteId === project.id}
                  onCancelDelete={() => setDeleteId(null)}
                  onDelete={handleDeleteProject}
                  onImageError={(id) =>
                    setImgErrors((prev) => ({ ...prev, [id]: true }))
                  }
                />
              ))
            )}
          </section>

          {showForm && isAdmin && (
            <ProjectForm
              categories={categories}
              form={form}
              formError={formError}
              onChange={handleFormChange}
              onCancel={() => setShowForm(false)}
              onSubmit={handleAddProject}
            />
          )}
        </main>
      </div>
    );
                className="search-box__input"
                placeholder="Search projects, tech, author, or category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            {isAdmin && (
              <button
                type="button"
                className="button button--primary button--toolbar"
                onClick={handleToggleForm}
              >
                {showForm ? "Close Panel" : "+ Add Project"}
              </button>
            )}
          </div>

          <div className="category-row">
            <button
              type="button"
              className={`category-pill${activeCat ? "" : " category-pill--active"}`}
              onClick={() => setActiveCat("")}
            >
              All
            </button>

            {categories.map((category) => {
              const meta = catMeta(category);
              const isActive = activeCat === category;

              return (
                <button
                  key={category}
                  type="button"
                  className={`category-pill${isActive ? " category-pill--active" : ""}`}
                  style={{
                    "--pill-color": meta.color,
                    "--pill-bg": meta.bg,
                    "--pill-border": meta.border,
                  }}
                  onClick={() => setActiveCat(isActive ? "" : category)}
                >
                  <span>{meta.icon}</span>
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </section>

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

        {filteredProjects.length === 0 ? (
          <section className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <h2 className="empty-state__title">No projects found</h2>
            <p className="empty-state__copy">
              Try another keyword, clear the category filter, or add a new
              project to the hub.
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
    </main>
  );
}
