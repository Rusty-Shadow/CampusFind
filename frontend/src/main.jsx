import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import ReportPage from './pages/ReportPage';
import ItemDetail from './pages/ItemDetail';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';
import './styles.css';

function App() {
  return <AuthProvider><BrowserRouter><Routes><Route element={<Layout/>}>
    <Route index element={<Home/>}/>
    <Route path="login" element={<AuthPage mode="login"/>}/>
    <Route path="register" element={<AuthPage mode="register"/>}/>
    <Route path="items/:id" element={<ItemDetail/>}/>
    <Route path="report" element={<RequireAuth><ReportPage/></RequireAuth>}/>
    <Route path="report/:id" element={<RequireAuth><ReportPage/></RequireAuth>}/>
    <Route path="dashboard" element={<RequireAuth><Dashboard/></RequireAuth>}/>
    <Route path="admin" element={<RequireAuth admin><AdminPage/></RequireAuth>}/>
    <Route path="*" element={<main className="page-wrap not-found"><span className="section-kicker">404 · NOT FOUND</span><h1>Looks like this page got <em>lost.</em></h1><p>Let's help you find your way back.</p><a className="button button-primary" href="/">Back to CampusFind</a></main>}/>
  </Route></Routes></BrowserRouter></AuthProvider>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
