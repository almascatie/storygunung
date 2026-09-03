import React, { useState } from 'react'
export function Header({ page, mapMode, onNavigate }) {
 const [open, setOpen] = useState(false)
 const go = (target) => { onNavigate(target); setOpen(false) }
 return <header className="site-header"><button className="brand" onClick={() => go('home')}><span>STORY</span>GUNUNG <i>· IYA</i></button><button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Buka menu">☰</button><nav className={open ? 'open' : ''}><button className={page === 'map' && mapMode === 'home' ? 'active' : ''} onClick={() => go('home')}>Home</button><button className={page === 'map' && mapMode === 'mitigasi' ? 'active' : ''} onClick={() => go('mitigasi')}>Mitigasi</button><div className="nav-menu"><button className={page === 'sejarah' || page === 'referensi' ? 'active' : ''}>Referensi <span>⌄</span></button><div className="submenu"><button onClick={() => go('sejarah')}>Sejarah</button><button onClick={() => go('referensi')}>Referensi</button></div></div><button className={page === 'tentang' ? 'active' : ''} onClick={() => go('tentang')}>Tentang</button></nav></header>
}
