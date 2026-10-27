// Only explicitly designated, first-party editorial categories are news.
// Do not automatically classify seller content or general educational articles.
const newsCategories=new Set(['berita','politik','ekonomi','nasional','internasional','berita politik','berita ekonomi','berita nasional','berita internasional','berita teknologi','berita bisnis']);
export function isNewsArticle(article){
  if(!article||article.author_type==='seller')return false;
  const category=String(article.category||'').trim().toLowerCase();
  return newsCategories.has(category)||category.startsWith('berita:')||category.startsWith('berita - ');
}
export function isFreshNewsArticle(article,now=Date.now()){
  if(!isNewsArticle(article)||!article.id||!article.title||!article.published_at)return false;
  const timestamp=new Date(article.published_at).getTime();
  return Number.isFinite(timestamp)&&timestamp<=now&&now-timestamp<=48*60*60*1000;
}
export function getFreshNewsArticles(articles,now=Date.now()){
  return (Array.isArray(articles)?articles:[]).filter(article=>isFreshNewsArticle(article,now)).slice(0,1000);
}
const escapeXml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&apos;'}[char]));
export function makeNewsSitemap(articles,{origin,publicationName='BisaBikinWeb.id',now=Date.now()}){
  const entries=getFreshNewsArticles(articles,now).map(article=>{
    const url=origin+'/artikel/'+encodeURIComponent(article.id)+'/';
    const publicationDate=new Date(article.published_at).toISOString();
    return '  <url><loc>'+escapeXml(url)+'</loc><news:news><news:publication><news:name>'+escapeXml(publicationName)+'</news:name><news:language>id</news:language></news:publication><news:publication_date>'+publicationDate+'</news:publication_date><news:title>'+escapeXml(article.title)+'</news:title></news:news></url>';
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n'+entries.join('\n')+'\n</urlset>\n';
}
