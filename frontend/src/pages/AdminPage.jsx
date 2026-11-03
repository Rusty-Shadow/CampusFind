import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, ClipboardList, Package, ShieldCheck, Trash2, Users } from 'lucide-react';
import { api, formatDate } from '../api';

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('items');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [o, i, u] = await Promise.all([api('/admin/overview'), api('/admin/items'), api('/admin/users')]);
      setOverview(o); setItems(i.items); setUsers(u.users);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (itemId) => {
    if (!window.confirm('Remove this listing from the public board?')) return;
    try { await api(`/admin/items/${itemId}/remove`, { method: 'PATCH', body: {} }); await load(); }
    catch (err) { setError(err.message); }
  };

  return <div className="page-wrap admin-page"><div className="dashboard-heading"><div><span className="section-kicker">CAMPUSFIND CONTROL ROOM</span><h1>Admin <em>overview.</em></h1><p>Keep the community board useful, accurate, and safe.</p></div><div className="admin-label"><ShieldCheck size={17}/> Administrator</div></div>
    {error && <div className="notice notice-error">{error}</div>}{loading ? <div className="loading-state"><span className="spinner"/>Loading admin data…</div> : overview && <>
      <div className="admin-stats"><Stat icon={<Package size={19}/>} label="Total listings" value={overview.stats.totalItems}/><Stat icon={<ClipboardList size={19}/>} label="Active lost" value={overview.stats.lostItems}/><Stat icon={<CheckCircle2 size={19}/>} label="Active found" value={overview.stats.foundItems}/><Stat icon={<BarChart3 size={19}/>} label="Resolved" value={overview.stats.resolvedItems}/><Stat icon={<Users size={19}/>} label="Students" value={overview.stats.totalUsers}/></div>
      <div className="admin-panels"><section className="admin-panel"><div className="admin-panel-heading"><div><span className="section-kicker">COMMUNITY SNAPSHOT</span><h3>Listing activity</h3></div><span className="admin-panel-icon"><BarChart3 size={18}/></span></div><div className="activity-bars"><Bar label="Lost" value={overview.stats.lostItems} total={Math.max(overview.stats.lostItems + overview.stats.foundItems, 1)}/><Bar label="Found" value={overview.stats.foundItems} total={Math.max(overview.stats.lostItems + overview.stats.foundItems, 1)}/><Bar label="Resolved" value={overview.stats.resolvedItems} total={Math.max(overview.stats.totalItems, 1)}/></div><div className="admin-panel-foot"><span>{overview.stats.pendingClaims} claims waiting for review</span><span>{overview.stats.totalItems} total reports</span></div></section><section className="admin-panel recent-panel"><div className="admin-panel-heading"><div><span className="section-kicker">LATEST CONTRIBUTIONS</span><h3>Recent reports</h3></div></div>{overview.recentItems.slice(0, 4).map((item) => <div className="recent-row" key={item.id}><div className="recent-icon">{item.type === 'lost' ? '⌕' : '✦'}</div><div><strong>{item.title}</strong><small>{item.owner_name} · {formatDate(item.item_date)}</small></div><span className={`table-pill ${item.type}`}>{item.type}</span></div>)}</section></div>
      <section className="admin-table-section"><div className="dashboard-tabs"><button className={tab === 'items' ? 'active' : ''} onClick={() => setTab('items')}>All listings <span>{items.length}</span></button><button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Registered users <span>{users.length}</span></button></div>
        {tab === 'items' ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Item</th><th>Type</th><th>Reported by</th><th>Location</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.category} · {formatDate(item.item_date)}</small></td><td><span className={`table-pill ${item.type}`}>{item.type}</span></td><td>{item.owner_name}</td><td>{item.location}</td><td><span className={`table-status ${item.status}`}>{item.status}</span></td><td><button className="table-action" title="Remove listing" onClick={() => remove(item.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table>{!items.length && <p className="table-empty">No listings yet.</p>}</div> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Student</th><th>Email</th><th>Role</th><th>Listings</th><th>Joined</th></tr></thead><tbody>{users.map((person) => <tr key={person.id}><td><strong>{person.name}</strong></td><td>{person.email}</td><td><span className="table-status active">{person.role}</span></td><td>{person.item_count}</td><td>{formatDate(person.created_at?.slice(0, 10))}</td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </div>;
}

function Stat({ icon, label, value }) { return <div className="admin-stat"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>; }
function Bar({ label, value, total }) { return <div className="bar-row"><div><span>{label}</span><strong>{value}</strong></div><div className="bar-track"><span style={{ width: `${Math.max(value / total * 100, value ? 5 : 0)}%` }}/></div></div>; }
