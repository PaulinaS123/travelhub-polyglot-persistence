import React from 'react';
export function Field({label,id,...props}){return <label className="field" htmlFor={id}><span>{label}</span><input id={id} {...props}/></label>}
