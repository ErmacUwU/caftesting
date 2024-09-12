import React from 'react'
import TarjetaCitas from '../components/TarjetaCitas'

const Agendas = () => {
  return (
    <div>
      <h1 className='uppercase text-2xl text-center'>Lista de Citas</h1>
      <p>Filtros</p>
      <div>
        <TarjetaCitas/>
      </div>
      <div>
      <p>CRUD para las citas</p>
      </div>
    </div>
  )
}

export default Agendas