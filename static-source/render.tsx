import React from 'react';
import {renderToString} from 'react-dom/server';
import Studio from './features/Studio';
import {defaults} from './lib/data';
export {defaults};
export function render(path:string){return renderToString(<Studio initial={defaults} initialVariants={[]} path={path} user={null} isAdmin={false}/>)}
