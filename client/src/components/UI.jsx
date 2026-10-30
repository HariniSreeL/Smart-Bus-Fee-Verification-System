import {Link} from "react-router-dom";
export function PageHeading({eyebrow,title,description,action}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action&&<div>{action}</div>}</div>}
export function Status({status}){const cls=status==="PAID"?"paid":status==="PENDING"?"pending":"partial";return <span className={`status ${cls}`}><i/>{status}</span>}
export function Empty({text="No records found."}){return <div className="empty-state">{text}</div>}
export function ErrorMessage({children}){return children?<div className="alert error">{children}</div>:null}
export function StudentLink({student}){return <Link className="table-link" to={`/students/${student.student_id}`}>{student.student_id}</Link>}
