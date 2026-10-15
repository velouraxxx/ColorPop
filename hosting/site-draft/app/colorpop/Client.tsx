'use client';
import {useEffect,useState} from 'react';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
export default function ColorPopClient(){const [ready,setReady]=useState(false);useEffect(()=>setReady(true),[]);return ready?<BrowserRouter><App/></BrowserRouter>:<p style={{padding:24}}>Opening ColorPop…</p>}
