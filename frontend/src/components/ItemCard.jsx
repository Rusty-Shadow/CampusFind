import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { formatDate } from '../api';

const emoji = { Electronics: '🎧', Documents: '🪪', Stationery: '✏️', Accessories: '🎒', Clothing: '🧥', Other: '📦' };
export default function ItemCard({ item }) {
  return (
    <Link to={`/items/${item.id}`} className="item-card">
      <div className="item-photo-wrap">
        {item.image_url ? <img src={item.image_url} alt={item.title} className="item-photo"/> : <div className="item-photo-placeholder"><span>{emoji[item.category] || '📦'}</span><small>CampusFind listing</small></div>}
        <span className={`type-pill ${item.type}`}>{item.type === 'lost' ? 'Lost item' : 'Found item'}</span>
        {item.status === 'resolved' && <span className="resolved-pill">Resolved</span>}
      </div>
      <div className="item-card-content">
        <div className="item-card-top"><span className="eyebrow">{item.category}</span><ArrowUpRight size={17} className="card-arrow"/></div>
        <h3>{item.title}</h3>
        <p className="item-card-description">{item.description}</p>
        <div className="item-card-meta"><span><MapPin size={14}/>{item.location}</span><span>{formatDate(item.item_date)}</span></div>
      </div>
    </Link>
  );
}
