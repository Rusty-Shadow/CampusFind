import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, CheckCircle2, Clock3, Inbox, Package, Plus, X } from 'lucide-react';
import { api, formatDate } from '../api';
import { useAuth } from '../AuthContext';
import ItemCard from '../components/ItemCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState({ sent: [], received: [] });
  const [tab, setTab] = useState('reports');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [myItems, myClaims] = await Promise.all([api('/items/mine'), api('/claims/mine')]);
      setItems(myItems.items); setClaims(myClaims);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const decide = async (id, decision) => {
    setBusyId(id); setError('');
    try { await api(`/claims/${id}/${decision}`, { method: 'PATCH', body: {} }); await load(); }
    catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const active = items.filter((item) => item.status === 'active').length;
  const resolved = items.filter((item) => item.status === 'resolved').length;
  return <div className="page-wrap dashboard-page"><div className="dashboard-heading"><div><span className="section-kicker">YOUR CAMPUSFIN D SPACE</span><h1>Good to have you, <em>{user?.name?.split(' ')[0]}.</em></h1><p>Here's what's happening with your reports and claims.</p></div><Link className="button button-primary" to="/report"><Plus size={17}/> New report</Link></div>
    <div className="dashboard-stats"><div className="mini-stat"><span className="mini-stat-icon"><Package size={18}/></span><div><strong>{items.length}</strong><small>Your reports</small></div></div><div className="mini-stat"><span className="mini-stat-icon orange"><Clock3 size={18}/></span><div><strong>{active}</strong><small>Active reports</small></div></div><div className="mini-stat"><span className="mini-stat-icon green"><CheckCircle2 size={18}/></span><div><strong>{resolved}</strong><small>Resolved</small></div></div><div className="mini-stat"><span className="mini-stat-icon purple"><Inbox size={18}/></span><div><strong>{claims.received.filter((c) => c.status === 'pending').length}</strong><small>Pending claims</small></div></div></div>
    <div className="dashboard-content"><div className="dashboard-tabs"><button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>My reports <span>{items.length}</span></button><button className={tab === 'received' ? 'active' : ''} onClick={() => setTab('received')}>Claims on my items <span>{claims.received.length}</span></button><button className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')}>Claims I've sent <span>{claims.sent.length}</span></button></div>
      {error && <div className="notice notice-error">{error}</div>}{loading ? <div className="loading-state"><span className="spinner"/>Loading your activity…</div> : <>
        {tab === 'reports' && (items.length ? <div className="items-grid dashboard-items">{items.map((item) => <ItemCard item={item} key={item.id}/>)}</div> : <Empty title="No reports yet" body="When you report a lost or found item, it will show up here." action="Create your first report" to="/report"/>)}
        {tab === 'received' && (claims.received.length ? <div className="claim-list">{claims.received.map((claim) => <article className="claim-card" key={claim.id}><div className="claim-card-thumb">{claim.image_url ? <img src={claim.image_url} alt=""/> : <span>📦</span>}</div><div className="claim-card-body"><div className="claim-card-head"><span className="eyebrow">CLAIM ON YOUR LISTING</span><Status status={claim.status}/></div><h3>{claim.item_title}</h3><p className="claim-message">“{claim.message}”</p><div className="claim-meta">From <strong>{claim.claimant_name}</strong> · {formatDate(claim.created_at?.slice(0, 10))}</div><div className="claim-contact">{claim.claimant_email}</div>{claim.status === 'pending' && <div className="claim-actions"><button className="button button-primary button-small" onClick={() => decide(claim.id, 'approve')} disabled={busyId === claim.id}><Check size={15}/> Approve & resolve</button><button className="button button-outline button-small" onClick={() => decide(claim.id, 'reject')} disabled={busyId === claim.id}><X size={15}/> Reject</button></div>}</div></article>)}</div> : <Empty title="No one has claimed your items" body="When someone believes a found item belongs to them, their claim will appear here."/>)}
        {tab === 'sent' && (claims.sent.length ? <div className="claim-list">{claims.sent.map((claim) => <article className="claim-card" key={claim.id}><div className="claim-card-thumb">{claim.image_url ? <img src={claim.image_url} alt=""/> : <span>📦</span>}</div><div className="claim-card-body"><div className="claim-card-head"><span className="eyebrow">YOUR CLAIM</span><Status status={claim.status}/></div><h3>{claim.item_title}</h3><p className="claim-message">“{claim.message}”</p><div className="claim-meta">Reported by <strong>{claim.owner_name}</strong> · {formatDate(claim.created_at?.slice(0, 10))}</div></div></article>)}</div> : <Empty title="You haven't claimed anything" body="See a found item that looks familiar? Open its listing and send a claim." action="Browse found items" to="/"/>)}
      </>}</div>
    </div>;
}

function Status({ status }) { return <span className={`claim-status ${status}`}>{status}</span>; }
function Empty({ title, body, action, to }) { return <div className="empty-state compact"><div className="empty-icon"><Inbox size={25}/></div><h3>{title}</h3><p>{body}</p>{action && <Link className="button button-outline" to={to}>{action} <ArrowUpRight size={15}/></Link>}</div>; }
