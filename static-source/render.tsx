import React from 'react';
import {renderToString} from 'react-dom/server';
import Studio from './features/Studio';
import Admin from './features/Admin';
import SellerDashboard from './features/SellerDashboard';
import SellerAdmin from './features/SellerAdmin';
import {defaults} from './lib/data';
export {defaults};
export function render(path:string,initialData:any=defaults){return renderToString(path.startsWith('/admin/sellers')?<SellerAdmin/>:path==='/seller'?<SellerDashboard/>:path.startsWith('/admin')?<Admin/>:<Studio initial={initialData} initialVariants={[]} path={path} user={null} isAdmin={false}/>)}
