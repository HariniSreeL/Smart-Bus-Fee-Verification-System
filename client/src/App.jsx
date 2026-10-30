import {useEffect,useState} from "react";
import {Routes,Route,Navigate,useNavigate} from "react-router-dom";
import {BusFront,LayoutDashboard,ScanLine,Users,Wallet,ChartNoAxesCombined,LogOut,Menu,X,ShieldCheck} from "lucide-react";
import {api,getToken} from "./api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Students from "./pages/Students";
import StudentDetails from "./pages/StudentDetails";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";

function Protected({children}){return getToken()?children:<Navigate to="/login" replace/>}
function Shell({children,user,onLogout}){
 const [open,setOpen]=useState(false);const nav=useNavigate();
 const links=[["/","Dashboard",LayoutDashboard],["/scan","Scan ID",ScanLine],["/students","Students",Users],["/payments","Payments",Wallet],["/reports","Reports",ChartNoAxesCombined]];
 return <div className="app-shell">
  <aside className={`sidebar ${open?"sidebar-open":""}`}>
   <div className="brand"><div className="brand-icon"><BusFront/></div><div><b>BusVerify</b><small>TRANSPORT PORTAL</small></div><button className="mobile-close" onClick={()=>setOpen(false)}><X/></button></div>
   <div className="nav-label">WORKSPACE</div>
   {links.map(([to,label,Icon])=><button key={to} className={`nav-link ${location.pathname===to|| (to!=="/"&&location.pathname.startsWith(to))?"active":""}`} onClick={()=>{nav(to);setOpen(false)}}><Icon size={18}/>{label}</button>)}
   <div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={17}/><span>Secure officer access</span></div><button className="nav-link logout" onClick={onLogout}><LogOut size={18}/>Sign out</button></div>
  </aside>
  {open&&<div className="scrim" onClick={()=>setOpen(false)}/>}
  <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={()=>setOpen(true)}><Menu/></button><div><span className="top-eyebrow">COLLEGE TRANSPORT</span><b>Fee verification workspace</b></div><div className="profile"><div className="avatar">{(user?.username||"A")[0].toUpperCase()}</div><div><b>{user?.username||"Officer"}</b><small>Transport Officer</small></div></div></header><div className="page-wrap">{children}</div></main>
 </div>
}
export default function App(){
 const [user,setUser]=useState(null);const [checking,setChecking]=useState(!!getToken());const nav=useNavigate();
 useEffect(()=>{if(getToken())api("/auth/me").then(d=>setUser(d.user)).catch(()=>{localStorage.removeItem("bus_token");setUser(null)}).finally(()=>setChecking(false));},[]);
 async function login(username,password){const d=await api("/auth/login",{method:"POST",body:JSON.stringify({username,password})});localStorage.setItem("bus_token",d.token);setUser(d.user);nav("/");}
 function logout(){localStorage.removeItem("bus_token");setUser(null);nav("/login");}
 if(checking)return <div className="loading-screen">Loading BusVerify…</div>;
 return <Routes><Route path="/login" element={getToken()?<Navigate to="/"/>:<Login onLogin={login}/>}/><Route path="*" element={<Protected><Shell user={user} onLogout={logout}><Routes><Route path="/" element={<Dashboard/>}/><Route path="/scan" element={<Scan/>}/><Route path="/students" element={<Students/>}/><Route path="/students/:id" element={<StudentDetails/>}/><Route path="/payments" element={<Payments/>}/><Route path="/reports" element={<Reports/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></Shell></Protected>}/></Routes>
}
