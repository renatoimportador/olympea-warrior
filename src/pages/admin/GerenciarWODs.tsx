import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function GerenciarWODs() {
  const [treinos, setTreinos] = useState<any[]>([])

  async function carregarTreinos() {
    const { data, error } = await supabase
      .from('treinos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('ERRO AO CARREGAR TREINOS:', error)
      return
    }

    setTreinos(data || [])
  }

  useEffect(() => {
    carregarTreinos()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">
        Gerenciar WODs
      </h1>

      {treinos.length === 0 ? (
        <p>Nenhum treino encontrado.</p>
      ) : (
        <div className="space-y-4">
          {treinos.map((treino) => (
            <div
              key={treino.id}
              className="p-4 border rounded-lg"
            >
              <h2 className="font-bold">{treino.titulo}</h2>
              <p>{treino.tipo_wod}</p>
              <p>{treino.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
