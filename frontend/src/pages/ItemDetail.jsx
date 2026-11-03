import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CheckCircle2, CircleAlert, MapPin, MessageCircle, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { api, formatDate } from '../api';
import { useAuth } from '../AuthContext';

export default function ItemDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [claim, setClaim] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.success || '');
  const [busy, setBusy] = useState(false);

  const load = () => api(`/items/${id}`).then(({ item: next }) => setItem(next)).catch((err) => setError(err.message));
  useEffect(() => { load(); }, [id]);
  if (!item && error) return <div className="page-wrap"><div className="notice notice-error">{error}</div><Link to="/" className="button button-outline">Back to listings</Link></div>;
  if (!item) return <div className="loading-page"><span className="spinner"/>Loading item…</div>;

  const owner = user && (user.id === item.user_id || user.role === 'admin');
  const canClaim = user && !owner && item.type === 'found' && item.status === 'active';
  const sendClaim = async (event) => { event.preventDefault(); setError(''); setMessage(''); setBusy(true); try { const result = await api(`/items/${id}/claims`, { method: 'POST', body: { message: claim } }); setMessage(result.message); setClaim(''); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const resolve = async () => { setBusy(true); try { await api(`/items/${id}`, { method: 'PATCH', body: { status: 'resolved' } }); await load(); setMessage('This listing has been marked resolved.'); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const remove = async () => { if (!window.confirm('Remove this listing? It will no longer appear in the public board.')) return; setBusy(true); try { await api(`/items/${id}`, { method: 'DELETE' }); navigate('/dashboard'); } catch (err) { setError(err.message); } finally { setBusy(false); } };

  return <div className="page-wrap detail-page"><Link to="/" className="back-link"><ArrowLeft size={15}/> Back to explore</Link>{message && <div className="notice notice-success"><CheckCircle2 size={17}/>{message}</div>}{error && <div className="notice notice-error">{error}</div>}
    <div className="detail-grid"><div className="detail-image-wrap">{item.image_url ? <img src={item.image_url} alt={item.title} className="detail-image"/> : <div className="detail-image-placeholder"><span>📦</span><small>No photo provided</small></div>}<span className={`type-pill detail-type ${item.type}`}>{item.type === 'lost' ? 'Lost item' : 'Found item'}</span></div><div className="detail-content"><span className="section-kicker">{item.category.toUpperCase()} · REPORT #{String(item.id).padStart(4, '0')}</span><h1>{item.title}</h1><div className="detail-meta"><span><MapPin size={16}/>{item.location}</span><span><CalendarDays size={16}/>{formatDate(item.item_date)}</span></div><div className="detail-status-row"><span className={`status-indicator ${item.status}`}/>{item.status === 'resolved' ? 'Marked as resolved' : 'Active listing'}<span className="posted-by">Posted by {item.owner_name}</span></div><div className="detail-description"><h3>About this item</h3><p>{item.description}</p></div>
      {item.contact_info && <div className="contact-box"><MessageCircle size={18}/><div><strong>Contact information</strong><p>{item.contact_info}</p></div></div>}
      {owner ? <div className="owner-actions"><div className="owner-note"><ShieldCheck size={18}/><span>You manage this listing.</span></div><div className="button-row"><Link to={`/report/${item.id}`} className="button button-outline"><Pencil size={15}/> Edit listing</Link>{item.status === 'active' && <button className="button button-primary" onClick={resolve} disabled={busy}><CheckCircle2 size={16}/> Mark resolved</button>}<button className="button button-danger-ghost" onClick={remove} disabled={busy}><Trash2 size={15}/></button></div></div> : canClaim ? <form className="claim-box" onSubmit={sendClaim}><h3>Think this belongs to you?</h3><p>Send the finder a claim with a detail that helps verify ownership. Keep sensitive numbers private.</p><label className="form-label">Your claim message<textarea required minLength="10" maxLength="800" rows="3" value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="Describe a detail that confirms this is yours…"/></label><button className="button button-primary button-full" disabled={busy}>{busy ? 'Sending…' : 'Send claim'} <MessageCircle size={16}/></button></form> : !user && item.type === 'found' && item.status === 'active' ? <div className="claim-box"><h3>Is this yours?</h3><p>Log in to send a claim to the person who found it.</p><Link className="button button-primary button-full" to="/login" state={{ from: `/items/${item.id}` }}>Log in to claim <ArrowRightMini/></Link></div> : <div className="resolved-box"><CheckCircle2 size={19}/><span>{item.status === 'resolved' ? 'This item has been marked as resolved.' : 'This listing is available for the campus community to view.'}</span></div>}
    </div></div><div className="safety-footer"><CircleAlert size={16}/><span>Meet in a public campus location when exchanging an item. Never share passwords, OTPs, or sensitive identity details.</span></div></div>;
}
function ArrowRightMini() { return <span aria-hidden="true">→</span>; }
