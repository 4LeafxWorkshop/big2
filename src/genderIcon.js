export function renderGenderIconSvg(genderClass){
  return genderClass==='gender-female'
    ?'<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><circle cx="10.5" cy="9.8" r="4.1"/><path d="M10.5 13.9v4.8M8.3 16.5h4.4"/></svg>'
    :'<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><circle cx="9.5" cy="14.5" r="4.2"/><path d="M13 11l5-5"/><path d="M14.6 6H18v3.4"/></svg>';
}
