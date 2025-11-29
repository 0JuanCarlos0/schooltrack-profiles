import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Obtener el body de la petición
    const { count = 5 } = await req.json()

    // Verificar conductores existentes
    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('email')
    
    const existingEmails = new Set(existingProfiles?.map(p => p.email) || [])

    // Generar conductores
    const conductoresCreados = []
    let conductorNumber = 4 // Empezar desde conductor4
    let createdCount = 0

    while (createdCount < count) {
      const email = `conductor${conductorNumber}@schooltrack.com`
      
      // Saltar si el conductor ya existe
      if (existingEmails.has(email)) {
        console.log(`Conductor ${email} ya existe, saltando...`)
        conductorNumber++
        continue
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'pass123',
        email_confirm: true,
        user_metadata: { full_name: `Conductor ${conductorNumber}` }
      })

      if (authError) {
        console.error(`Error creating driver ${email}:`, authError)
        conductorNumber++
        continue
      }

      if (authData.user) {
        // Asignar rol 'driver'
        await supabaseAdmin.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'driver'
        })

        // Buscar un vehículo sin conductor asignado
        const { data: availableVehicle } = await supabaseAdmin
          .from('vehicles')
          .select('id, vehicle_number')
          .is('driver_id', null)
          .limit(1)
          .single()

        if (availableVehicle) {
          // Asignar a vehículo
          await supabaseAdmin.from('vehicles')
            .update({ driver_id: authData.user.id })
            .eq('id', availableVehicle.id)

          conductoresCreados.push({
            email: email,
            vehicle: availableVehicle.vehicle_number
          })

          // Crear ubicación de tracking actual
          const latBase = 19.432
          const lonBase = -99.133
          const randomLat = latBase + (Math.random() - 0.5) * 0.02
          const randomLon = lonBase + (Math.random() - 0.5) * 0.02

          await supabaseAdmin.from('location_tracking').insert({
            user_id: authData.user.id,
            latitude: randomLat,
            longitude: randomLon,
            accuracy: 10,
            timestamp: new Date().toISOString()
          })
        } else {
          // Si no hay vehículo disponible, solo crear el conductor
          conductoresCreados.push({
            email: email,
            vehicle: 'Sin asignar'
          })
        }

        createdCount++
      }

      conductorNumber++
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${conductoresCreados.length} conductores creados exitosamente`,
        conductores: conductoresCreados
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error en add-drivers:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
