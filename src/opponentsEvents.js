export function createOpponentsEventsBinder({documentRef=()=>document}={}){
  return function bindOpponentsEvents({
    state,
    render
  }){
    const doc=documentRef();
    doc.getElementById('opponents-back')?.addEventListener('click',()=>{
      state.screen='home';
      render();
    });
  };
}
