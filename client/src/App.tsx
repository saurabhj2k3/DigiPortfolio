import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Briefcase, 
  LayoutDashboard,
  LogOut, 
  Plus, 
  Trash2, 
  Globe, 
  Rocket, 
  CheckCircle2,
  ChevronRight,
  Palette,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Globe as GithubIcon,
  Link2 as LinkedinIcon,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

// --- TEMPLATE DEFINITIONS (visual metadata) ---
const TEMPLATE_STYLES: Record<number, { color: string; bg: string; label: string; accent: string }> = {
  1: { color: '#6366f1', bg: 'linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)', label: 'Modern Clean', accent: '#818cf8' },
  2: { color: '#8b5cf6', bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', label: 'Dark Elegance', accent: '#a78bfa' },
  3: { color: '#ec4899', bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', label: 'Creative Portfolio', accent: '#f472b6' },
  4: { color: '#0ea5e9', bg: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', label: 'Corporate Pro', accent: '#38bdf8' },
  5: { color: '#10b981', bg: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)', label: 'Terminal Dev', accent: '#34d399' },
};

const Logo = ({ style }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...style }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>D</div>
    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>DigiPortFolio<span style={{ color: 'var(--secondary)' }}>.</span></span>
  </div>
);

// --- SIDEBAR SECTIONS ---

const SidebarSection = ({ label, icon, count, onAdd, addLabel, children, defaultOpen = true }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--primary)' }}>{icon}</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
          {count !== undefined && (
            <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', borderRadius: '99px', padding: '0.1rem 0.4rem', fontWeight: 700 }}>{count}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {onAdd && (
            <button
              onClick={e => { e.stopPropagation(); onAdd(); }}
              title={addLabel}
              style={{ padding: '0.2rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', width: 'auto', height: 'auto', lineHeight: 0 }}
            >
              <Plus size={14} />
            </button>
          )}
          {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
};

const SidebarItem = ({ label, sublabel, active, onClick, onDelete, color }: any) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.5rem 0.75rem', borderRadius: '10px', cursor: 'pointer',
      background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
      border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
      marginBottom: '0.2rem', transition: 'all 0.2s',
    }}
    className="sidebar-item-hover"
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
      {color && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', color: active ? 'var(--primary)' : 'var(--text-muted)', fontWeight: active ? 800 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>{sublabel}</div>}
      </div>
    </div>
    {onDelete && (
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{ padding: '0.2rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', opacity: 0, width: 'auto', height: 'auto', lineHeight: 0, flexShrink: 0 }}
        className="delete-btn"
      >
        <Trash2 size={12} />
      </button>
    )}
  </div>
);

// --- MAIN SIDEBAR ---
const Sidebar = ({ setToken, portfolioId, projects, templates, portfolios, onRefresh, onAddProject, onAddPortfolio, activePortfolioId, onSelectPortfolio }: any) => {
  const navigate = useNavigate();

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm('Remove this project?')) {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      onRefresh();
    }
  };

  const handleDeletePortfolio = async (id: number) => {
    if (confirm('Delete this portfolio? All its projects will be lost.')) {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/portfolios/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      onRefresh();
    }
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <Logo style={{ marginBottom: '1.5rem' }} />

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', gap: '0.25rem' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.9rem', borderRadius: '10px', textDecoration: 'none', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.9rem', fontWeight: 600 }}>
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        {portfolioId && (
          <Link to={`/p/${portfolioId}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.9rem', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
            <ExternalLink size={18} /> Live Preview
          </Link>
        )}

        {/* --- PROJECTS SECTION --- */}
        <SidebarSection label="Projects" icon={<Briefcase size={12} />} count={projects.length} onAdd={onAddProject} addLabel="New Project">
          {projects.map((p: any) => (
            <SidebarItem
              key={p.id}
              label={p.title}
              sublabel={p.tech_stack?.split(',')[0]?.trim()}
              color="var(--primary)"
              onClick={() => {
                navigate('/dashboard');
                setTimeout(() => document.getElementById(`project-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
              }}
              onDelete={() => handleDeleteProject(p.id)}
            />
          ))}
          {projects.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--border)', fontStyle: 'italic', padding: '0.25rem 0.75rem' }}>No projects yet</div>}
        </SidebarSection>

        {/* --- LAYOUTS SECTION --- */}
        <SidebarSection label="Layouts" icon={<Palette size={12} />} count={templates.length} defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.25rem 0' }}>
            {templates.map((t: any) => {
              const style = TEMPLATE_STYLES[t.id] || { color: '#6366f1', bg: '#1e293b', label: t.name, accent: '#818cf8' };
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    navigate('/dashboard');
                    setTimeout(() => document.getElementById('template-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
                  }}
                  style={{ borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', transition: 'transform 0.2s, border-color 0.2s' }}
                  className="layout-card-hover"
                >
                  <div style={{ height: '40px', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    {[1,2,3].map(i => <div key={i} style={{ width: i === 1 ? '16px' : '8px', height: '4px', borderRadius: '2px', background: style.color, opacity: 0.8 }} />)}
                  </div>
                  <div style={{ padding: '0.3rem 0.5rem', background: 'rgba(15,23,42,0.8)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: style.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </SidebarSection>

        {/* --- PORTFOLIOS SECTION --- */}
        <SidebarSection label="Portfolios" icon={<FileText size={12} />} count={portfolios.length} onAdd={onAddPortfolio} addLabel="New Portfolio">
          {portfolios.map((p: any) => (
            <SidebarItem
              key={p.id}
              label={p.portfolio_name || 'Untitled Portfolio'}
              sublabel={p.is_draft ? 'Draft' : 'Published'}
              color={p.id === activePortfolioId ? 'var(--accent)' : 'var(--text-muted)'}
              active={p.id === activePortfolioId}
              onClick={() => onSelectPortfolio(p.id)}
              onDelete={() => handleDeletePortfolio(p.id)}
            />
          ))}
          {portfolios.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--border)', fontStyle: 'italic', padding: '0.25rem 0.75rem' }}>No portfolios yet</div>}
        </SidebarSection>

        {/* Sign Out */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <button onClick={logout} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', justifyContent: 'flex-start', fontSize: '0.875rem', padding: '0.65rem 0.9rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL ---
const Modal = ({ children, onClose }: any) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bento-card" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', padding: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', width: 'auto', height: 'auto', lineHeight: 0, cursor: 'pointer' }}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

const ProjectForm = ({ token, onSave }: any) => {
  const [form, setForm] = useState({ title: '', description: '', tech_stack: '', url: '' });

  const handleAdd = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/projects`, form, { headers: { Authorization: `Bearer ${token}` } });
      onSave();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add project. Please try again.');
    }
  };

  return (
    <form onSubmit={handleAdd}>
      <input placeholder="Project Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      <input placeholder="Tech Stack (e.g. React, Node.js, TypeScript)" value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })} />
      <input placeholder="Live URL (optional)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
      <textarea rows={4} placeholder="Project description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <button style={{ width: '100%' }}><Plus size={18} /> Create Project</button>
    </form>
  );
};

const PortfolioForm = ({ token, onSave, initialData }: any) => {
  const [name, setName] = useState(initialData?.portfolio_name || '');
  const [templateId, setTemplateId] = useState(initialData?.template_id || 1);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/portfolios`, { portfolio_name: name, template_id: templateId, is_draft: 1 }, { headers: { Authorization: `Bearer ${token}` } });
      onSave();
    } catch (err) { alert('Failed to create portfolio.'); }
  };

  return (
    <form onSubmit={handleCreate}>
      <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8, fontSize: '0.875rem' }}>Portfolio Name</label>
      <input placeholder="e.g. My Dev Portfolio, Freelance Work..." value={name} onChange={e => setName(e.target.value)} required />
      <label style={{ display: 'block', marginBottom: '0.5rem', marginTop: '0.5rem', opacity: 0.8, fontSize: '0.875rem' }}>Template</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {Object.entries(TEMPLATE_STYLES).map(([id, s]) => (
          <div
            key={id}
            onClick={() => setTemplateId(Number(id))}
            style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${templateId === Number(id) ? s.color : 'var(--border)'}`, transition: 'all 0.2s' }}
          >
            <div style={{ height: '50px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {[1,2,3].map(i => <div key={i} style={{ width: i === 1 ? '20px' : '10px', height: '5px', borderRadius: '3px', background: s.color, opacity: 0.9 }} />)}
            </div>
            <div style={{ padding: '0.35rem 0.5rem', background: 'rgba(15,23,42,0.9)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: s.color }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <button style={{ width: '100%' }}><Plus size={18} /> Create Portfolio</button>
    </form>
  );
};

// --- PAGES ---

const PublicPortfolio = () => {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/p/${id}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center', color: 'white' }}>Loading Portfolio...</div>;
  if (!data || !data.portfolio) return <div style={{ padding: '5rem', textAlign: 'center', color: 'white' }}>Portfolio not found.</div>;

  const { portfolio, projects } = data;
  const isDark = portfolio.template_id === 2 || portfolio.template_id === 5;
  const tmpl = TEMPLATE_STYLES[portfolio.template_id] || TEMPLATE_STYLES[1];

  return (
    <div className={isDark ? 'dark-mode' : ''} style={{ minHeight: '100vh', padding: '4rem 2rem', background: tmpl.bg, color: isDark ? '#f8fafc' : '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* HERO BENTO GRID */}
        <div className="portfolio-bento-grid">
          
          <div className="portfolio-bento-card portfolio-bento-hero">
            <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 1rem 0', background: `linear-gradient(135deg, ${isDark?'#fff':'#1e293b'} 30%, ${tmpl.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {portfolio.name}
            </h1>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, opacity: 0.9 }}>{portfolio.title}</h2>
            {portfolio.bio && <p style={{ fontSize: '1.2rem', opacity: 0.7, maxWidth: '700px', margin: '1.5rem auto 0 auto', lineHeight: 1.6 }}>{portfolio.bio}</p>}
            
            <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
               {portfolio.github_url && <a href={portfolio.github_url} target="_blank" className="portfolio-glass-pill" style={{ color: 'inherit', textDecoration: 'none' }}><GithubIcon size={18} /> GitHub</a>}
               {portfolio.linkedin_url && <a href={portfolio.linkedin_url} target="_blank" className="portfolio-glass-pill" style={{ color: 'inherit', textDecoration: 'none' }}><LinkedinIcon size={18} /> LinkedIn</a>}
            </div>
          </div>

          <div className="portfolio-bento-card portfolio-bento-info">
            <Mail size={24} style={{ color: tmpl.accent, marginBottom: '0.5rem' }} />
            <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</h3>
            <a href={`mailto:${portfolio.contact_email}`} style={{ fontWeight: 600, fontSize: '1.1rem', color: 'inherit', textDecoration: 'none' }}>{portfolio.contact_email || 'Not provided'}</a>
          </div>

          <div className="portfolio-bento-card portfolio-bento-info">
            <Phone size={24} style={{ color: tmpl.accent, marginBottom: '0.5rem' }} />
            <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Phone</h3>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{portfolio.phone || 'Not provided'}</span>
          </div>

          <div className="portfolio-bento-card portfolio-bento-info">
            <MapPin size={24} style={{ color: tmpl.accent, marginBottom: '0.5rem' }} />
            <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Location</h3>
            <span style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>{portfolio.location || 'Not provided'}</span>
          </div>

        </div>

        {/* SKILLS RIBBON */}
        {portfolio.skills && (
          <div style={{ marginBottom: '5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '2rem' }}>Core Expertise</h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {portfolio.skills.split(',').map((skill: string, idx: number) => (
                <span key={idx} className="portfolio-glass-pill" style={{ color: tmpl.color, boxShadow: `0 0 20px ${tmpl.color}22` }}>
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PROJECTS SHOWCASE */}
        <div style={{ paddingBottom: '5rem' }}>
           <h3 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '3rem', letterSpacing: '-0.03em', color: isDark ? 'white' : '#1e293b' }}>Featured Work.</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
             {projects.map((p: any) => (
               <div key={p.id} className="portfolio-bento-card portfolio-project-card">
                 <h4 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1rem 0' }}>{p.title}</h4>
                 <p style={{ opacity: 0.7, lineHeight: 1.6, flex: 1, marginBottom: '2rem' }}>{p.description}</p>
                 
                 {p.tech_stack && (
                   <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                     {p.tech_stack.split(',').map((tech: string, i: number) => (
                       <span key={i} className="glass-pill" style={{ color: tmpl.color }}>{tech.trim()}</span>
                     ))}
                   </div>
                 )}
                 
                 {p.url ? (
                   <a href={p.url} target="_blank" className="portfolio-glass-pill" style={{ alignSelf: 'flex-start', color: tmpl.color, textDecoration: 'none' }}>
                     Explore Project <ChevronRight size={18} />
                   </a>
                 ) : (
                   <span className="portfolio-glass-pill" style={{ alignSelf: 'flex-start', opacity: 0.5 }}>Under Development</span>
                 )}
               </div>
             ))}
             {projects.length === 0 && (
               <div className="portfolio-bento-card" style={{ gridColumn: 'span 12', textAlign: 'center', padding: '4rem' }}>
                 <Briefcase size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                 <h4 style={{ fontSize: '1.25rem', opacity: 0.6 }}>No projects published yet.</h4>
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

const Login = ({ setToken }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/login`, { email, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100vh', background: 'var(--bg-dark)' }}>
      <div className="bento-card" style={{ width: '100%', maxWidth: '400px' }}>
        <Logo style={{ justifyContent: 'center', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>Sign in to your creative workspace.</p>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={{ width: '100%' }}>Sign In <ChevronRight size={18} /></button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/register`, { email, password });
      alert('Registration successful!'); navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100vh', background: 'var(--bg-dark)' }}>
      <div className="bento-card" style={{ width: '100%', maxWidth: '400px' }}>
        <Logo style={{ justifyContent: 'center', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Start Creating</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>Join the community of elite professionals.</p>
        <form onSubmit={handleRegister}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (6+ chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          <button style={{ width: '100%' }}>Create Account <Rocket size={18} /></button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Already joined? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

const Dashboard = ({ token, projects, portfolio, templates, loading, onRefresh }: any) => {
  if (loading) return <div style={{ padding: '3rem', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ width: '24px', height: '24px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Refining your workspace...</div>;

  return (
    <div className="main-content">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Design your digital presence with precision.</p>
        </div>
        {portfolio && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to={`/p/${portfolio.id}`} target="_blank">
              <button className="secondary"><Globe size={18} /> View Public Site</button>
            </Link>
            <button onClick={() => alert('This feature is coming soon!')} style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
              <Rocket size={18} /> Publish
            </button>
          </div>
        )}
        </header>

        <div className="dashboard-bento">
          {/* Profile Card */}
          <div className="bento-card" style={{ gridColumn: 'span 12', gridRow: 'span 6' }}>
            <div className="card-title-row">
              <div className="icon-box"><User size={20} /></div>
              <h2>Identity Profile</h2>
            </div>
            <PortfolioEditor token={token} initialData={portfolio} onSave={onRefresh} />
          </div>

          {/* Templates Card */}
          <div id="template-section" className="bento-card" style={{ gridColumn: 'span 6', gridRow: 'span 3' }}>
            <div className="card-title-row">
              <div className="icon-box"><Palette size={20} /></div>
              <h2>Visual Layout</h2>
            </div>
            <TemplateSelector initialId={portfolio?.template_id || 1} templates={templates} onChange={(id: number) => {
              axios.post(`${API_BASE}/portfolio`, { ...portfolio, template_id: id }, { headers: { Authorization: `Bearer ${token}` } }).then(onRefresh);
            }} />
          </div>

          {/* Stats Card */}
          <div className="bento-card" style={{ gridColumn: 'span 6', gridRow: 'span 3', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white' }}>
            <h3 style={{ margin: 0, opacity: 0.9 }}>Live Projects</h3>
            <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.1 }}>{projects.length}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, marginTop: '0.5rem' }}><CheckCircle2 size={18} /> Verified Portfolio</div>
            {portfolio && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button onClick={() => alert('This feature is coming soon!')} style={{ background: 'white', color: 'var(--primary)', flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
                  <Rocket size={15} /> Publish
                </button>
                <Link to={`/p/${portfolio.id}`} target="_blank" style={{ textDecoration: 'none', flex: 1 }}>
                  <button style={{ width: '100%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
                    <ExternalLink size={15} /> Preview
                  </button>
                </Link>
              </div>
            )}
          </div>

        {/* Projects Card — view & select only; add via sidebar */}
        <div className="bento-card" style={{ gridColumn: 'span 12', gridRow: 'span 4' }}>
          <div className="card-title-row" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="icon-box"><Briefcase size={20} /></div>
              <h2>Project Showcase</h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Add projects from the sidebar →</span>
          </div>
          <ProjectList token={token} projects={projects} portfolio={portfolio} onUpdate={onRefresh} />
        </div>
      </div>
    </div>
  );
};

const TemplateSelector = ({ initialId, templates, onChange }: any) => {
  const [selected, setSelected] = useState(initialId);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
      {templates.map((t: any) => {
        const style = TEMPLATE_STYLES[t.id] || TEMPLATE_STYLES[1];
        const isActive = selected === t.id;
        return (
          <div
            key={t.id}
            onClick={() => { setSelected(t.id); onChange(t.id); }}
            style={{ borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${isActive ? style.color : 'var(--border)'}`, boxShadow: isActive ? `0 0 16px ${style.color}44` : 'none', transition: 'all 0.2s' }}
          >
            <div style={{ height: '56px', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {[1,2,3].map(i => <div key={i} style={{ width: i === 1 ? '24px' : '12px', height: '5px', borderRadius: '3px', background: style.color, opacity: 0.9 }} />)}
            </div>
            <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(15,23,42,0.95)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isActive ? style.color : 'var(--text-muted)' }}>{t.name}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PortfolioEditor = ({ token, initialData, onSave }: any) => {
  const [formData, setFormData] = useState(initialData || { 
    name: '', title: '', bio: '', contact_email: '', 
    phone: '', location: '', github_url: '', linkedin_url: '', 
    skills: '', template_id: 1 
  });

  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);

  const handleSave = async (e: any) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/portfolio`, formData, { headers: { Authorization: `Bearer ${token}` } });
    onSave();
  };

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Full Name</label>
          <input placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Headline</label>
          <input placeholder="Full Stack Developer" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Contact Email</label>
          <input placeholder="contact@example.com" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Phone Number</label>
          <input placeholder="+1 234 567 890" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Location</label>
          <input placeholder="New York, USA" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Skills (comma separated)</label>
          <input placeholder="React, Node.js, TypeScript" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>GitHub URL <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
          <input placeholder="https://github.com/username" value={formData.github_url} onChange={e => setFormData({ ...formData, github_url: e.target.value })} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>LinkedIn URL <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
          <input placeholder="https://linkedin.com/in/username" value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} />
        </div>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Professional Bio</label>
        <textarea rows={4} placeholder="Tell your story..." value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} required />
      </div>
      <button type="submit">Save Identity <CheckCircle2 size={18} /></button>
    </form>
  );
};

const ProjectList = ({ token, projects, portfolio, onUpdate }: any) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('Remove this project from your portfolio?')) {
      await axios.delete(`${API_BASE}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (selectedId === id) setSelectedId(null);
      onUpdate();
    }
  };

  if (projects.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.4 }}>
        <Briefcase size={48} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No projects yet</p>
        <p style={{ fontSize: '0.875rem' }}>Use the <strong>+</strong> button next to <strong>PROJECTS</strong> in the sidebar to add one.</p>
      </div>
    );
  }

  const selected = projects.find((p: any) => p.id === selectedId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: projects.length > 0 && selectedId ? '1fr 1.2fr' : '1fr', gap: '1.5rem' }}>
      {/* Project Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', alignContent: 'start' }}>
        {projects.map((p: any) => {
          const isSelected = p.id === selectedId;
          return (
            <div
              key={p.id}
              id={`project-${p.id}`}
              onClick={() => setSelectedId(isSelected ? null : p.id)}
              style={{
                padding: '1.25rem',
                borderRadius: '16px',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.07)'}`,
                background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isSelected ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
                transition: 'all 0.2s',
              }}
              className="project-card-hover"
            >
              {/* Selected indicator */}
              {isSelected && (
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={14} color="white" />
                </div>
              )}

              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, paddingRight: '1.5rem' }}>{p.title}</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
              {p.tech_stack && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {p.tech_stack.split(',').slice(0, 3).map((t: string, i: number) => (
                    <span key={i} style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>#{t.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Panel (shown when a project is selected) */}
      {selectedId && selected && (
        <div className="bento-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{selected.title}</h3>
            <button className="danger" onClick={() => handleDelete(selected.id)} style={{ padding: '0.4rem 0.7rem', borderRadius: '8px', fontSize: '0.8rem' }}>
              <Trash2 size={14} /> Remove
            </button>
          </div>

          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>{selected.description || 'No description.'}</p>

          {selected.tech_stack && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Tech Stack</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selected.tech_stack.split(',').map((t: string, i: number) => (
                  <span key={i} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', background: 'rgba(99,102,241,0.12)', padding: '0.3rem 0.7rem', borderRadius: '99px', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {t.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {selected.url && (
              <a href={selected.url} target="_blank" style={{ textDecoration: 'none', flex: 1 }}>
                <button style={{ width: '100%', fontSize: '0.875rem', padding: '0.65rem 1rem' }}>
                  <ExternalLink size={16} /> View Live
                </button>
              </a>
            )}
            {portfolio && (
              <Link to={`/p/${portfolio.id}`} target="_blank" style={{ textDecoration: 'none', flex: 1 }}>
                <button className="secondary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.65rem 1rem' }}>
                  <Globe size={16} /> Preview Portfolio
                </button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  if (location.pathname.startsWith('/p/')) return null;
  return <>{children}</>;
};

// --- APP ROOT ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [activePortfolioId, setActivePortfolioId] = useState<number | null>(null);

  const [portfolio, setPortfolio] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  const fetchData = async () => {
    if (!token) { setLoading(false); return; }
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    try {
      // Fetch all independently so one failure doesn't break the rest
      const [pRes, prRes, tRes, psRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/portfolio`, authHeader),
        axios.get(`${API_BASE}/projects`, authHeader),
        axios.get(`${API_BASE}/templates`),
        axios.get(`${API_BASE}/portfolios`, authHeader),
      ]);

      if (pRes.status === 'fulfilled') {
        setPortfolio(pRes.value.data);
        if (pRes.value.data) { setPortfolioId(pRes.value.data.id); setActivePortfolioId(pRes.value.data.id); }
      }
      if (prRes.status === 'fulfilled') setProjects(prRes.value.data);
      if (tRes.status === 'fulfilled') setTemplates(tRes.value.data);
      if (psRes.status === 'fulfilled') setPortfolios(psRes.value.data);

      // Log any failures for debugging
      [pRes, prRes, tRes, psRes].forEach((r, i) => {
        if (r.status === 'rejected') console.warn(`fetchData[${i}] failed:`, r.reason?.message);
      });
    } catch (err) {
      console.error('fetchData unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchData(); else setLoading(false); }, [token]);

  return (
    <Router>
      <div style={{ display: 'flex', width: '100%' }}>
        {token && (
          <SidebarWrapper>
            <Sidebar
              token={token}
              setToken={setToken}
              portfolioId={portfolioId}
              projects={projects}
              templates={templates}
              portfolios={portfolios}
              onRefresh={fetchData}
              onAddProject={() => setShowProjectModal(true)}
              onAddPortfolio={() => setShowPortfolioModal(true)}
              activePortfolioId={activePortfolioId}
              onSelectPortfolio={(id: number) => {
                setActivePortfolioId(id);
                // TODO: load specific portfolio data when user selects from list
              }}
            />
          </SidebarWrapper>
        )}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={
              <div className="hero-fancy">
                <Logo style={{ justifyContent: 'center', marginBottom: '3rem', transform: 'scale(1.5)' }} />
                <span className="hero-badge">Next-Gen Portfolio Builder</span>
                <h1>Elevate your digital identity.</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>
                  The elite platform for creators to showcase their work in a bento-style workspace.
                </p>
                {!token && (
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/register"><button style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>Get Started Free</button></Link>
                    <Link to="/login"><button className="secondary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>Sign In</button></Link>
                  </div>
                )}
              </div>
            } />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              token ? (
                <Dashboard
                  token={token}
                  projects={projects}
                  portfolio={portfolio}
                  templates={templates}
                  loading={loading}
                  onRefresh={fetchData}
                />
              ) : <Navigate to="/login" />
            } />
            <Route path="/p/:id" element={<PublicPortfolio />} />
          </Routes>
        </div>
      </div>

      {showProjectModal && (
        <Modal onClose={() => setShowProjectModal(false)}>
          <div style={{ padding: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>Create New Project</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Add a project to your portfolio showcase.</p>
            <ProjectForm token={token} onSave={() => { setShowProjectModal(false); fetchData(); }} />
          </div>
        </Modal>
      )}

      {showPortfolioModal && (
        <Modal onClose={() => setShowPortfolioModal(false)}>
          <div style={{ padding: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>New Portfolio</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create a new draft portfolio. You can switch between them from the sidebar.</p>
            <PortfolioForm token={token} onSave={() => { setShowPortfolioModal(false); fetchData(); }} />
          </div>
        </Modal>
      )}
    </Router>
  );
}

export default App;
