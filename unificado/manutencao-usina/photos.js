const root='/unificado/mapa/api/tools/manutencao-usina/';
const $=id=>document.getElementById(id);
let currentPhotos=[],position=0;
const labels={foto_inspecao:'Foto de inspeção',contexto:'Imagem de contexto',quadro_video:'Quadro do vídeo do relatório'};
function safeUrl(value){
  try{const url=new URL(value,location.origin);return url.origin===location.origin&&url.pathname.startsWith(root)?url.href:''}catch{return ''}
}
export function galleryMarkup(value,{escape,dateText}){
  const photos=value.rows||[],documents=value.documentos||[];
  const notes=[...new Set(photos.map(photo=>photo.observacao).filter(Boolean))];
  return `<div class="photo-source-links">${documents.map(doc=>`<a href="${escape(safeUrl(doc.url))}" download>Baixar relatório original · ${escape(dateText(doc.data_inspecao))}</a>`).join('')}</div>
    ${notes.length?`<div class="photo-context-note">${notes.map(note=>`<p>${escape(note)}</p>`).join('')}</div>`:''}
    ${photos.length?`<p class="photo-gallery-help">${photos.length} imagem(ns). Toque para ampliar e ver os detalhes.</p><div class="photo-grid">${photos.map((photo,index)=>`<figure><button type="button" class="photo-thumbnail" data-photo-index="${index}" aria-label="Ampliar: ${escape(photo.legenda)}"><img src="${escape(safeUrl(photo.url))}" alt="${escape(photo.legenda)}" width="${photo.largura}" height="${photo.altura}" loading="lazy" decoding="async"><span>Ampliar imagem</span></button><figcaption><span class="photo-provenance">Slide ${photo.slide} · Foto ${photo.numero_foto} · ${labels[photo.tipo]||'Imagem do relatório'}</span><strong>${escape(photo.legenda)}</strong><small>Inspeção de ${escape(dateText(photo.data_inspecao))}</small></figcaption></figure>`).join('')}</div>`:`<p class="photo-empty">${escape(value.sem_foto_motivo||'Nenhuma foto vinculada a esta atividade.')}</p>`}`;
}
function createViewer(){
  if($('photo-viewer'))return $('photo-viewer');
  const dialog=document.createElement('dialog');dialog.id='photo-viewer';dialog.className='photo-viewer';dialog.setAttribute('aria-label','Visualizar foto da inspeção');
  dialog.innerHTML='<header><div><span id="photo-position"></span><strong id="photo-source"></strong></div><button type="button" id="close-photo" aria-label="Fechar foto">×</button></header><div class="photo-large-wrap"><img id="photo-large" alt=""></div><div class="photo-large-caption"><p id="photo-caption"></p><p id="photo-note"></p></div><footer><div><button type="button" id="previous-photo" aria-label="Foto anterior">← Anterior</button><button type="button" id="next-photo" aria-label="Próxima foto">Próxima →</button></div><div><a id="open-photo" target="_blank" rel="noopener">Abrir original</a><a id="download-photo" download>Baixar foto</a></div></footer>';
  document.body.append(dialog);$('close-photo').onclick=()=>dialog.close();
  $('previous-photo').onclick=()=>select(position-1);$('next-photo').onclick=()=>select(position+1);
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();select(position-1)}if(event.key==='ArrowRight'){event.preventDefault();select(position+1)}});
  dialog.addEventListener('close',()=>{$('photo-large').removeAttribute('src');currentPhotos=[]});
  return dialog;
}
function select(index){
  if(!currentPhotos.length)return;
  position=(index+currentPhotos.length)%currentPhotos.length;const photo=currentPhotos[position];
  $('photo-large').src=safeUrl(photo.url);$('photo-large').alt=photo.legenda;
  $('photo-position').textContent=`${position+1} de ${currentPhotos.length}`;
  $('photo-source').textContent=`Slide ${photo.slide} · Foto ${photo.numero_foto} · ${labels[photo.tipo]||'Imagem do relatório'}`;
  $('photo-caption').textContent=photo.legenda;$('photo-note').textContent=photo.observacao||'';
  $('open-photo').href=safeUrl(photo.url);$('download-photo').href=safeUrl(photo.download_url);
  $('previous-photo').disabled=currentPhotos.length<2;$('next-photo').disabled=currentPhotos.length<2;
}
export function showPhoto(photos,index){
  const dialog=createViewer();currentPhotos=photos;select(index);if(!dialog.open)dialog.showModal();
}
export function photoViewerOpen(){return Boolean($('photo-viewer')?.open)}
export function closePhotoViewer(){if($('photo-viewer')?.open)$('photo-viewer').close()}
