import type {ReactNode} from 'react';
import './layout.css';
type Props={area:'cura'|'postes'|'concreto';page:string;active:string;user?:string;role?:string;context?:ReactNode;children:ReactNode;onLogout?:()=>void;onCriteria?:()=>void};
/* The enclosing Unificado owns navigation, identity and logout. */
export function PreviewShell({page,context,children}:Props){
 return <div className="preview-shell"><main className="preview-content"><header className="ph"><div><h1>{page}</h1><div className="sub">{context}</div></div></header>{children}</main></div>;
}
