import { Network, RefreshCw } from 'lucide-react';
import { useEffect,useState } from 'react';
import { detectIncidents,getIncidents } from '../api/aiApi';
import DataState from '../components/DataState';
import EmptyState from '../components/EmptyState';
import IncidentTable from '../components/IncidentTable';
import PageHeader from '../components/PageHeader';
export default function CollectiveIncidents(){const[state,setState]=useState({data:[],loading:true,error:null,busy:false});const load=()=>{setState(v=>({...v,loading:true,error:null}));getIncidents().then(data=>setState({data,loading:false,error:null,busy:false})).catch(error=>setState({data:[],loading:false,error,busy:false}));};useEffect(load,[]);const detect=async()=>{setState(v=>({...v,busy:true}));try{await detectIncidents();load();}catch(error){setState(v=>({...v,error,busy:false}));}};if(state.loading||state.error)return <DataState loading={state.loading} error={state.error} onRetry={load}/>;return <><PageHeader eyebrow="Pattern detection" title="Collective Incidents" subtitle="Groups three or more similar recent complaints within a community block." action={<button className="primary-button" onClick={detect} disabled={state.busy}><RefreshCw size={16}/> Detect now</button>}/><section className="content-card">{state.data.length?<IncidentTable incidents={state.data}/>:<EmptyState icon={Network} title="No collective incidents" description="Similar ticket clusters will appear here after detection."/>}</section></>}
