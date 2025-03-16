"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, Eraser, Paintbrush, Loader2, Info, Send, RefreshCw, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useInpainting } from '../hooks/useInpainting'
import InpaintingForm from '../components/InpaintingForm'

// Product data
const products = {
  "C1012 Glacier White": "/product_images/C1012.jpg",
  "C1026 Polar": "/product_images/C1026.jpg",
  "C3269 Ash Grey": "/product_images/C3269.jpg",
  "C3168 Silver Wave": "/product_images/C3168.jpg",
  "C1005 Milky White": "/product_images/C1005.jpg",
  "C2103 Onyx Carrara": "/product_images/C2103.jpg",
  "C2104 Massa": "/product_images/C2104.jpg",
  "C3105 Casla Cloudy": "/product_images/C3105.jpg",
  "C3146 Casla Nova": "/product_images/C3146.jpg",
  "C2240 Marquin": "/product_images/C2240.jpg",
  "C2262 Concrete (Honed)": "/product_images/C2262.jpg",
  "C3311 Calacatta Sky": "/product_images/C3311.jpg",
  "C3346 Massimo": "/product_images/C3346.jpg",
  "C4143 Mario": "/product_images/C4143.jpg",
  "C4145 Marina": "/product_images/C4145.jpg",
  "C4202 Calacatta Gold": "/product_images/C4202.jpg",
  "C1205 Casla Everest": "/product_images/C1205.jpg",
  "C4211 Calacatta Supreme": "/product_images/C4211.jpg",
  "C4204 Calacatta Classic": "/product_images/C4204.jpg",
  "C1102 Super White": "/product_images/C1102.jpg",
  "C4246 Casla Mystery": "/product_images/C4246.jpg",
  "C4345 Oro": "/product_images/C4345.jpg",
  "C4346 Luxe": "/product_images/C4346.jpg",
  "C4342 Casla Eternal": "/product_images/C4342.jpg",
  "C4221 Athena": "/product_images/C4221.jpg",
  "C4255 Calacatta Extra": "/product_images/C4255.jpg",
}

export default function Home() {
  return (
                  <div>
      <h1>Inpainting với CaslaQuartz</h1>
      <InpaintingForm />
    </div>
  )
}

