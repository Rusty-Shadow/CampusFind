import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Camera, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import ItemCard from '../components/ItemCard';

const categories = ['All categories', 'Electronics', 'Documents', 'Stationery', 'Accessories', 'Clothing', 'Books', 'Other'];

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', type: '', category: 'All categories', location: '' });
  const [applied, setApplied] = useState(filters);
  const { user } = useAuth();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams({ status: 'active', limit: '60' });
    Object.entries(applied).forEach(([key, value]) => { if (value) params.set(key, value); });
    api(`/items?${params.toString()}`)
      .then((data) => { if (alive) { setItems(data.items); setError(''); } })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [applied]);

  const submit = (event) => { event.preventDefault(); setApplied(filters); };
  const clear = () => { const next = { q: '', type: '', category: 'All categories', location: '' }; setFilters(next); setApplied(next); };

  return (
    <>
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker"><Sparkles size={14}/> THE CAMPUS COMMUNITY HELPS</span>
            <h1>Lost something?<br/><em>Found something?</em></h1>
            <p className="hero-lead">A little help goes a long way. Report missing belongings, discover found items, and help your campus community reunite with what matters.</p>
            <div className="hero-actions"><Link to={user ? '/report' : '/register'} className="button button-primary button-large">Report an item <ArrowRight size={17}/></Link><a href="#browse" className="button button-light button-large">Browse listings</a></div>
            <div className="hero-proof"><div className="proof-avatars"><span>A</span><span>D</span><span>R</span><span>+</span></div><span>Good things happen when we look out for each other.</span></div>
          </div>
          <div className="hero-art" aria-label="Illustration of recovered belongings">
            <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
            <div className="art-sticker sticker-note"><span>FOUND!</span><small>right place, right time</small></div>
            <div className="art-object art-bag"><div className="bag-handle"/><div className="bag-face"><span>✦</span></div></div>
            <div className="art-object art-card"><div className="card-chip"/><div className="card-line long"/><div className="card-line"/><div className="card-line short"/></div>
            <div className="art-object art-earbuds"><div className="bud bud-left"/><div className="bud bud-right"/><div className="bud-case"/></div>
            <div className="art-sticker sticker-heart">♥</div>
            <div className="art-caption"><span className="caption-dot"/> COMMUNITY-POWERED RECOVERY</div>
          </div>
        </div>
        <div className="hero-bottom"><span>ONE CAMPUS. ONE PLACE TO LOOK.</span><span>LOST & FOUND, MADE SIMPLE <ArrowUpRight size={13}/></span></div>
      </section>

      <section className="browse-section section-wrap" id="browse">
        <div className="section-heading-row"><div><span className="section-kicker">THE COMMUNITY BOARD</span><h2>Find what you're <em>looking for.</em></h2><p>Every listing is one more chance to get something back where it belongs.</p></div><div className="browse-count"><strong>{items.length}</strong><span>active listings<br/>in the community</span></div></div>
        <form className="search-panel" onSubmit={submit}>
          <label className="search-field"><Search size={18}/><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Search for an item, e.g. blue bottle"/></label>
          <label className="filter-field"><span>Listing type</span><select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">All listings</option><option value="lost">Lost</option><option value="found">Found</option></select></label>
          <label className="filter-field"><span>Category</span><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="filter-field location-filter"><span>Location</span><input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="Any location"/></label>
          <button className="button button-dark search-submit" type="submit"><Search size={16}/> Search</button>
        </form>
        <div className="listing-toolbar"><div className="result-tabs"><button className={!applied.type ? 'active' : ''} onClick={() => { const next = { ...filters, type: '' }; setFilters(next); setApplied(next); }}>All items</button><button className={applied.type === 'lost' ? 'active' : ''} onClick={() => { const next = { ...filters, type: 'lost' }; setFilters(next); setApplied(next); }}>Lost</button><button className={applied.type === 'found' ? 'active' : ''} onClick={() => { const next = { ...filters, type: 'found' }; setFilters(next); setApplied(next); }}>Found</button></div><button className="text-button" onClick={clear}>Clear filters</button></div>
        {error && <div className="notice notice-error">{error}</div>}
        {loading ? <div className="loading-state"><span className="spinner"/>Finding listings…</div> : items.length ? <div className="items-grid">{items.map((item) => <ItemCard key={item.id} item={item}/>)}</div> : <div className="empty-state"><div className="empty-icon">⌕</div><h3>No listings match your search</h3><p>Try another keyword or clear your filters to see all active items.</p><button className="button button-outline" onClick={clear}>Clear filters</button></div>}
      </section>

      <section className="how-section"><div className="section-wrap"><div className="how-intro"><span className="section-kicker">A SIMPLE WAY TO HELP</span><h2>Three steps. <em>One less worry.</em></h2><p>Whether you lost something or found it, the process is simple.</p></div><div className="steps-grid"><article className="step-card"><span className="step-number">01</span><div className="step-icon"><Camera size={22}/></div><h3>Post a report</h3><p>Add a clear description, where it was last seen or found, and a photo if you have one.</p></article><article className="step-card"><span className="step-number">02</span><div className="step-icon"><Search size={22}/></div><h3>Search the board</h3><p>Browse campus reports and narrow things down by keyword, category, or location.</p></article><article className="step-card"><span className="step-number">03</span><div className="step-icon"><BadgeCheck size={22}/></div><h3>Make the connection</h3><p>Send a claim to the person who found your item and mark it resolved when reunited.</p></article></div></div></section>
      <section className="bottom-cta section-wrap"><div><span className="section-kicker">IT TAKES A COMMUNITY</span><h2>Be someone's <em>good news.</em></h2><p>That thing you picked up might be someone's most important thing today.</p></div><Link className="button button-primary button-large" to={user ? '/report' : '/register'}>Get started <ArrowRight size={17}/></Link></section>
    </>
  );
}
