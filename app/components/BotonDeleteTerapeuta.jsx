'use client'

import React from 'react'
import { DeleteIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'


const BotonDeleteTerapeuta = ({id}) => {
    
    const router = useRouter();
    const deleteTherapist = async () =>{
        
        const confirmed = confirm("¿Esta seguro de borrarlo?")

        if(confirmed){
            const res = await fetch(`http://localhost:3000/api/therapist?id=${id}`, {
                method: "DELETE"
            });

            if(res.ok){
                console.log('Se ejecuta el router.refresh()')
                window.location.reload();
            }
         
        }
    }
  return (
    <div>
        <button onClick={deleteTherapist}><DeleteIcon size={24} color='red'/></button>
      
    </div>
  )
}

export default  BotonDeleteTerapeuta