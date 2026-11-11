import React from 'react';
import {renderToString} from 'react-dom/server';
import Studio from './features/Studio';
import Admin from './features/Admin';
import AffiliateAdmin from './features/AffiliateAdmin';
import SellerDashboard from './features/SellerDashboard';
import SellerAdmin from './features/SellerAdmin';
import WebsiteStoreAdmin from './features/WebsiteStoreAdmin';
import DigitalOrdersAdmin from './features/DigitalOrdersAdmin';
import WebsiteLiveDemo from './features/WebsiteLiveDemo';
import {defaults} from './lib/data';
export {defaults};
export function render(path:string,initialData:any=defaults){return renderToString(path.startsWith('/demo/')?<WebsiteLiveDemo path={path}/>:path==='/admin/digital-store'?<DigitalOrdersAdmin/>:path==='/admin/website-store'?<WebsiteStoreAdmin/>:path.startsWith('/admin/sellers')?<SellerAdmin/>:path==='/seller'?<SellerDashboard/>:path==='/admin/affiliates'?<AffiliateAdmin/>:path.startsWith('/admin')?<Admin/>:<Studio initial={initialData} initialVariants={[]} path={path} user={null} isAdmin={false}/>)}
