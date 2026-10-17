import React from 'react';
import {renderToString} from 'react-dom/server';
import Studio from './features/Studio';
import Admin from './features/Admin';
import {defaults} from './lib/data';
export {defaults};
export function render(path:string){return renderToString(path.startsWith('/admin')?<Admin/>:<Studio initial={defaults} initialVariants={[]} path={path} user={null} isAdmin={false}/>)}
