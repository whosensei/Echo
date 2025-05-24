"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { buttonBaseStyles, buttonHoverStyles, buttonSelectedStyles, buttonTextStyles } from "./ui/buttonstyles";
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";
export default function Buttonlist() {
  const [Instagramselect, setInstagramselect] = useState(false);
  const [Metaselect, setMetaselect] = useState(false);
  const [Linkedinselect, setLinkedinselect] = useState(false);
  const [Xselect, setXselect] = useState(false);
  
  
  return (
    <div className="flex justify-between gap-3">
      <Button
        variant="outline"
        onClick={() => setInstagramselect(!Instagramselect)}
        className={`${buttonBaseStyles} ${Instagramselect ? buttonSelectedStyles : `${buttonHoverStyles} ${buttonTextStyles}`} px-4 py-2`}
      >
        <Instagram className="w-4 h-4" />
        Instagram post
      </Button>
      <Button
        variant="outline"
        onClick={() => setMetaselect(!Metaselect)}
        className={`${buttonBaseStyles} ${Metaselect ? buttonSelectedStyles : `${buttonHoverStyles} ${buttonTextStyles}`} px-4 py-2`}
      >
        <Facebook className="w-4 h-4" />
        Meta post
      </Button>
      <Button
        variant="outline"   
        onClick={() => setLinkedinselect(!Linkedinselect)}
        className={`${buttonBaseStyles} ${Linkedinselect ? buttonSelectedStyles : `${buttonHoverStyles} ${buttonTextStyles}`} px-4 py-2`}
      >
        <Linkedin className="w-4 h-4" />
        LinkedIn post
      </Button>
      <Button
        variant="outline"
        onClick={() => setXselect(!Xselect)}
        className={`${buttonBaseStyles} ${Xselect ? buttonSelectedStyles : `${buttonHoverStyles} ${buttonTextStyles}`} px-4 py-2`}
      >
        <Twitter className="w-4 h-4" />
        X post
      </Button>
    </div>
  );
}
