/* Presentation helpers only. Production and labor totals remain in app.js. */
(() => {
  function axisTicks(maximum) {
    const rough=Math.max(1,Number(maximum)||0)/4;
    const magnitude=10**Math.floor(Math.log10(rough));
    const step=Math.max(1,[1,2,5,10].map(n=>n*magnitude).find(n=>n>=rough));
    return Array.from({length:5},(_,i)=>i*step);
  }
  const plural=(count,singular,multiple)=>`${count} ${count===1?singular:multiple}`;
  window.IndicatorPresentation=Object.freeze({axisTicks,plural});
})();
