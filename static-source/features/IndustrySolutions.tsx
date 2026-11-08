import {ArrowUpRight} from 'lucide-react';
import {industryPages} from '../lib/industry-pages.mjs';
function IndustryStory({story,page}:{story:any,page:any}){
 return <div className={"industry-story industry-story-"+page.slug} aria-labelledby={"industry-story-title-"+page.slug}>
  <div className="industry-story-intro">
   <span className="eyebrow">{story.eyebrow}</span>
   <h2 id={"industry-story-title-"+page.slug}>{story.title}</h2>
   <p>{story.lead}</p>
  </div>
  <div className="industry-story-chapters">
   {story.chapters.map((chapter:any,i:number)=><article className="industry-story-chapter" key={chapter.label}>
    <div className="industry-story-rail"><span>{String(i+1).padStart(2,'0')}</span><small>{chapter.label}</small></div>
    <div className="industry-story-content"><h3>{chapter.title}</h3>{chapter.paragraphs.map((p:string,j:number)=><p key={j}>{p}</p>)}</div>
   </article>)}
  </div>
  <blockquote className="industry-story-quote"><p>“{story.quote}”</p><footer>— Perspektif BisaBikinWeb</footer></blockquote>
  <div className="industry-story-end">
   <span className="eyebrow">CERITA SELANJUTNYA / LET'S BUILD IT</span>
   <h2>{story.closingTitle}</h2>
   <p>{story.closing}</p>
   <div className="seo-actions"><a className="btn primary" href={'/kontak/?estimate='+encodeURIComponent(page.title)}>Diskusikan Website <ArrowUpRight size={16}/></a><a className="btn" href={'/portfolio/'+page.project+'/'}>Lihat Contoh Proyek</a></div>
  </div>
 </div>;
}
export function IndustryLinks(){return <section className="section intent-industries" aria-labelledby="industry-title"><div className="section-heading"><div><span className="eyebrow">WEBSITE UNTUK USAHAMU</span><h2 id="industry-title">Kebutuhan bisnis berbeda.<br/>Pendekatannya juga.</h2><p>Pelajari alur, materi, dan pilihan fitur melalui contoh website dalam portofolio kami.</p></div></div><div className="service-intent-grid">{industryPages.map(page=><article key={page.path}><span>WEBSITE BISNIS</span><h3>{page.label}</h3><p>{page.intro}</p><a href={page.path+'/'}>Lihat solusi {page.label.toLowerCase()} <ArrowUpRight size={16}/></a></article>)}</div></section>}
export function IndustryPage({page,data}:{page:any,data:any}){const project=data.portfolio.find((p:any)=>p.id===page.project);return <>
<section className="section industry-detail"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><span>/</span><a href="/solusi/">Solusi Website</a><span>/</span>{page.label}</nav><div className="page-intro"><span className="eyebrow">{page.label.toUpperCase()} / BISABIKINWEB</span><h1>{page.title}</h1><h2>{page.heading}</h2><p>{page.intro}</p><div className="seo-actions"><a className="btn primary" href={'/kontak/?estimate='+encodeURIComponent(page.title)}>Konsultasikan Website <ArrowUpRight size={16}/></a><a className="btn" href="/harga/">Bandingkan Paket</a></div></div>{page.story&&<IndustryStory story={page.story} page={page}/>}<div className="industry-editorial">{page.sections.map(([title,text],i)=><article key={title}><span className="eyebrow">0{i+1} / RANCANGAN</span><h2>{title}</h2><p>{text}</p></article>)}</div></section>
{project&&<section className="section industry-project"><div><span className="eyebrow">CONTOH DALAM PORTOFOLIO</span><h2>{project.name}</h2><p>{project.description}</p><p>Contoh ini menunjukkan pendekatan website dalam portofolio kami. Fitur proyek Anda ditentukan dalam penawaran tersendiri.</p><a className="btn" href={'/portfolio/'+project.id+'/'}>Pelajari Proyek <ArrowUpRight size={16}/></a></div><ul>{project.features.map((feature:string)=><li key={feature}>{feature}</li>)}</ul></section>}
<section className="section industry-project"><div><span className="eyebrow">SEBELUM MEMULAI</span><h2>Materi yang perlu disiapkan.</h2><p>Materi yang lengkap membantu penyusunan halaman dan estimasi pekerjaan.</p></div><ul>{page.checklist.map((item:string)=><li key={item}>{item}</li>)}</ul></section><section className="section"><h2>Pertanyaan tentang website {page.label.toLowerCase()}.</h2><div className="seo-faq">{page.faq.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div><div className="seo-actions"><a className="btn" href={page.service}>Layanan Terkait <ArrowUpRight size={16}/></a><a className="btn" href="/harga/">Harga & Biaya</a><a className="btn primary" href={'/kontak/?estimate='+encodeURIComponent(page.title)}>Mulai Konsultasi</a></div></section><IndustryLinks/></>}
