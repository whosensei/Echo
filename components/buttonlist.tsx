"use client"
import { useState } from "react"
import { Button } from "./ui/button"

export default function Buttonlist(){
    const [cloneselect,setcloneselect] = useState(false)
    const [Instagramselect,setInstagramselect] = useState(false)
    const [Metaselect,setMetaselect] = useState(false)
    const [Linkedinselect,setLinkedinselect] = useState(false)
    const [Xselect,setXselect] = useState(false)
    return(
        <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={()=>setcloneselect(!cloneselect)} >clone an AD</Button>
            <Button variant="outline" onClick={()=>setInstagramselect(!Instagramselect)}>Instagram post</Button>
            <Button variant="outline" onClick={()=>setMetaselect(!Metaselect)}>Meta post</Button>
            <Button variant="outline" onClick={()=>setLinkedinselect(!Linkedinselect)}>Likedin post</Button>
            <Button variant="outline" onClick={()=>setXselect(!Xselect)}>X post</Button>
        </div>
    )
}