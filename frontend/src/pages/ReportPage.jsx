import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, Info, Upload, X } from 'lucide-react';
import { api } from '../api';

const blank = { title: '', type: 'lost', category: 'Electronics', description: '', location: '', item_date: new Date().toISOString().slice(0, 10), contact_info: '' };
const categories = ['Electronics', 'Documents', 'Stationery', 'Accessories', 'Clothing', 'Books', 'Bags', 'Other'];

export default function ReportPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api(`/items/${id}`).then(({ item }) => {
      setForm({ title: item.title, type: item.type, category: item.category, description: item.description, location: item.location, item_date: item.item_date, contact_info: item.contact_info || '' });
      if (item.image_url) setPreview(item.image_url);
    }).catch((err) => setError(err.message));
  }, [id, editing]);

  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const onFile = (next) => {
    if (!next) return;
    if (!next.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    if (next.size > 5 * 1024 * 1024) { setError('Image must be 5 MB or smaller.'); return; }
    setError(''); setFile(next); setPreview(URL.createObjectURL(next));
  };

  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    if (file) body.append('image', file);
    try {
      const result = await api(editing ? `/items/${id}` : '/items', { method: editing ? 'PATCH' : 'POST', body, formData: true });
      navigate(`/items/${result.item.id}`, { state: { success: result.message } });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <div className="page-wrap report-page"><Link to={editing ? `/items/${id}` : '/'} className="back-link"><ArrowLeft size={15}/> {editing ? 'Back to listing' : 'Back to explore'}</Link><div className="report-heading"><span className="section-kicker">{editing ? 'UPDATE YOUR LISTING' : 'ADD TO THE COMMUNITY BOARD'}</span><h1>{editing ? 'Edit your report.' : 'Let’s get it <em>back where it belongs.</em>'}</h1><p>{editing ? 'Keep your report up to date so the right person can find it.' : 'A few details can make all the difference. Share what happened and the community can help.'}</p></div>
    <form className="report-layout" onSubmit={submit}><div className="report-main panel-card"><div className="form-section-title"><span>01</span><div><h3>What are you reporting?</h3><p>Start with the basics so people know what to look for.</p></div></div><div className="type-selector"><button type="button" className={form.type === 'lost' ? 'type-option selected lost-option' : 'type-option'} onClick={() => update('type', 'lost')}><span className="type-option-icon">⌕</span><span><strong>I lost something</strong><small>I'm trying to find an item</small></span><span className="radio-dot"/></button><button type="button" className={form.type === 'found' ? 'type-option selected found-option' : 'type-option'} onClick={() => update('type', 'found')}><span className="type-option-icon">✦</span><span><strong>I found something</strong><small>I'm helping return an item</small></span><span className="radio-dot"/></button></div>
      <label className="form-label">Item name <span className="required">*</span><input required maxLength="100" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Black wireless earbuds"/></label><label className="form-label">Category <span className="required">*</span><select required value={form.category} onChange={(e) => update('category', e.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="form-label">Description <span className="required">*</span><textarea required minLength="10" maxLength="1500" rows="5" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Add identifying details such as colour, brand, marks, or anything that could help confirm ownership."/><small className="field-hint">Avoid sharing sensitive personal information such as ID numbers.</small></label>
      <div className="form-row"><label className="form-label">Location <span className="required">*</span><input required value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Central Library, Block B"/></label><label className="form-label">Date <span className="required">*</span><input required type="date" value={form.item_date} onChange={(e) => update('item_date', e.target.value)}/></label></div>
      <div className="form-section-title form-section-spaced"><span>02</span><div><h3>Add a photo</h3><p>A clear picture helps people recognise the item. This is optional.</p></div></div>
      <label className="upload-zone">{preview ? <div className="upload-preview"><img src={preview} alt="Selected item"/><span><CheckCircle2 size={16}/> Image ready</span></div> : <><span className="upload-icon"><Upload size={20}/></span><strong>Click to upload an image</strong><small>JPG, PNG, WEBP or GIF · up to 5 MB</small></>}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => onFile(e.target.files?.[0])}/></label>
      <div className="form-section-title form-section-spaced"><span>03</span><div><h3>How can someone reach you?</h3><p>Choose a safe way for another student to get in touch.</p></div></div><label className="form-label">Contact details <span className="optional">Optional</span><input value={form.contact_info} onChange={(e) => update('contact_info', e.target.value)} placeholder="College email, phone, or preferred contact method"/></label>
      {error && <div className="notice notice-error">{error}</div>}<div className="report-actions"><Link to={editing ? `/items/${id}` : '/'} className="button button-outline">Cancel</Link><button className="button button-primary button-large" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish report'} <CheckCircle2 size={17}/></button></div></div>
      <aside className="report-aside"><div className="aside-tip"><div className="tip-icon"><Info size={18}/></div><h3>A little detail goes a long way.</h3><p>For found items, keep one identifying detail private. The rightful owner can mention it when they submit a claim.</p></div><div className="aside-checklist"><h4>Before you publish</h4><div><CheckCircle2 size={16}/> Use a clear item name</div><div><CheckCircle2 size={16}/> Add the exact campus location</div><div><CheckCircle2 size={16}/> Include a useful description</div><div><CheckCircle2 size={16}/> Never post passwords or ID numbers</div></div><div className="privacy-note"><ShieldMini/><span>Your contact information is shared only as you choose to include it.</span></div></aside></form></div>;
}

function ShieldMini() { return <span className="privacy-shield">✓</span>; }
