import React,{type ReactNode,type ComponentPropsWithoutRef} from 'react';
import '../../design-system/tokens.css';
import './ui-primitives.css';

type SectionProps=ComponentPropsWithoutRef<'section'> & {
 headingId:string;
 eyebrow?:string;
 title:string;
 children:ReactNode;
};

/** Scoped primitives: migrate existing pages only after visual approval. */
export function UiSection({headingId,eyebrow,title,children,className='',...rest}:SectionProps){
 return <section {...rest} className={'ui-section '+className} aria-labelledby={headingId}>
  <div className="ui-section-heading">
   {eyebrow&&<span className="ui-eyebrow">{eyebrow}</span>}
   <h2 id={headingId}>{title}</h2>
  </div>
  {children}
 </section>;
}
export function UiCard({children,className='',...rest}:ComponentPropsWithoutRef<'article'>){
 return <article {...rest} className={'ui-card '+className}>{children}</article>;
}
type UiLinkProps=ComponentPropsWithoutRef<'a'> & {appearance?:'primary'|'secondary'};
export function UiButtonLink({appearance='secondary',className='',children,...rest}:UiLinkProps){
 return <a {...rest} className={'ui-button ui-button--'+appearance+' '+className}>{children}</a>;
}
