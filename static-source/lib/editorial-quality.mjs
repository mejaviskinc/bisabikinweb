// AdSense readiness is a conservative publication gate, not a guarantee of approval.
// Keep thin drafts readable by URL, but out of search indexes and advertising until expanded.
// Human review of accuracy, originality, image rights and sources is still required.
import {isNewsArticle} from './news.mjs';

const plain=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/^\s{0,3}#{1,6}\s+/gm,' ').replace(/\s+/g,' ').trim();
const wordCount=value=>(plain(value).match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[]).length;

export function assessEditorialQuality(article,now=Date.now()){
  const issues=[];
  const body=Array.isArray(article?.body)?article.body:typeof article?.body==='string'?article.body.split(/\n\s*\n/):[];
  // Count distinct substantive prose, not repeated paragraphs, headings or image/source credits.
  const prose=body.flatMap(block=>String(block??'').split(/\r?\n/))
    .filter(line=>!/^\s*#{1,6}\s+/.test(line))
    .map(plain).filter(text=>text&&!/^(?:sumber|referensi|keterangan gambar|image credit|foto)\b/i.test(text));
  const distinct=[...new Map(prose.map(text=>[text.toLocaleLowerCase('id-ID'),text])).values()];
  const paragraphs=distinct.filter(text=>text.length>=80);
  const bodyWords=wordCount(distinct.join(' '));
  if(!plain(article?.title))issues.push('judul kosong');
  if(plain(article?.summary).length<55)issues.push('ringkasan belum cukup informatif');
  if(bodyWords<180)issues.push('teks utama terlalu singkat untuk peninjauan otomatis');
  if(paragraphs.length<3)issues.push('penjelasan utama belum memiliki tiga paragraf substantif');
  if(isNewsArticle(article)){
    const sources=Array.isArray(article?.source_urls)?article.source_urls:[];
    if(!sources.some(url=>/^https:\/\//i.test(String(url)))&&!body.some(line=>/https?:\/\//i.test(String(line)))){
      issues.push('sumber berita belum dicantumkan');
    }
  }
  if(article?.published_at){
    const published=Date.parse(article.published_at);
    if(Number.isFinite(published)&&published>now)issues.push('tanggal publikasi masih di masa depan');
  }
  return {indexReady:issues.length===0,issues,bodyWords,paragraphs:paragraphs.length};
}
