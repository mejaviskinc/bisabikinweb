import React from 'react';
import {hydrateRoot} from 'react-dom/client';
import Studio from './features/Studio';
import {defaults} from './lib/data';
import './styles.css';
const path=location.pathname.replace(/\/+$/,'')||'/';
hydrateRoot(document.getElementById('root')!,<Studio initial={defaults} initialVariants={[]} path={path} user={null} isAdmin={false}/>);
