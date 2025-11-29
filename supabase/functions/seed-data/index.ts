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

    // Crear 7 usuarios regulares
    const usuarios = [
      { email: 'usuario1@schooltrack.com', password: 'pass123', fullName: 'Usuario Uno' },
      { email: 'usuario2@schooltrack.com', password: 'pass123', fullName: 'Usuario Dos' },
      { email: 'usuario3@schooltrack.com', password: 'pass123', fullName: 'Usuario Tres' },
      { email: 'usuario4@schooltrack.com', password: 'pass123', fullName: 'Usuario Cuatro' },
      { email: 'usuario5@schooltrack.com', password: 'pass123', fullName: 'Usuario Cinco' },
      { email: 'usuario6@schooltrack.com', password: 'pass123', fullName: 'Usuario Seis' },
      { email: 'usuario7@schooltrack.com', password: 'pass123', fullName: 'Usuario Siete' },
    ]

    const usuariosCreados = []
    for (const usuario of usuarios) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: usuario.email,
        password: usuario.password,
        email_confirm: true,
        user_metadata: { full_name: usuario.fullName }
      })

      if (authError) {
        console.error(`Error creating user ${usuario.email}:`, authError)
        continue
      }

      if (authData.user) {
        // Asignar rol 'user'
        await supabaseAdmin.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'user'
        })
        usuariosCreados.push(usuario.email)
      }
    }

    // Crear 5 conductores adicionales
    const conductores = [
      { email: 'conductor4@schooltrack.com', password: 'pass123', fullName: 'Conductor Cuatro', vehicle: 'BUS-011' },
      { email: 'conductor5@schooltrack.com', password: 'pass123', fullName: 'Conductor Cinco', vehicle: 'BUS-012' },
      { email: 'conductor6@schooltrack.com', password: 'pass123', fullName: 'Conductor Seis', vehicle: 'BUS-013' },
      { email: 'conductor7@schooltrack.com', password: 'pass123', fullName: 'Conductor Siete', vehicle: 'VAN-006' },
      { email: 'conductor8@schooltrack.com', password: 'pass123', fullName: 'Conductor Ocho', vehicle: 'VAN-007' },
    ]

    const conductoresCreados = []
    for (const conductor of conductores) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: conductor.email,
        password: conductor.password,
        email_confirm: true,
        user_metadata: { full_name: conductor.fullName }
      })

      if (authError) {
        console.error(`Error creating driver ${conductor.email}:`, authError)
        continue
      }

      if (authData.user) {
        // Asignar rol 'driver'
        await supabaseAdmin.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'driver'
        })

        // Asignar a vehículo
        await supabaseAdmin.from('vehicles')
          .update({ driver_id: authData.user.id })
          .eq('vehicle_number', conductor.vehicle)

        conductoresCreados.push(conductor.email)

        // Crear ubicación de tracking actual para el conductor
        const latitudes = [19.4326, 19.4286, 19.4366, 19.4406, 19.4246]
        const longitudes = [-99.1332, -99.1272, -99.1392, -99.1452, -99.1212]
        const index = conductores.indexOf(conductor)

        await supabaseAdmin.from('location_tracking').insert({
          user_id: authData.user.id,
          latitude: latitudes[index],
          longitude: longitudes[index],
          accuracy: 10,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Actualizar ubicaciones de los 3 conductores existentes
    const { data: existingDrivers } = await supabaseAdmin
      .from('vehicles')
      .select('driver_id, vehicle_number')
      .in('vehicle_number', ['BUS-001', 'BUS-002', 'BUS-003'])
      .not('driver_id', 'is', null)

    if (existingDrivers) {
      const baseLatitudes = [19.4326, 19.4286, 19.4366]
      const baseLongitudes = [-99.1332, -99.1272, -99.1392]

      for (let i = 0; i < existingDrivers.length; i++) {
        const driver = existingDrivers[i]
        await supabaseAdmin.from('location_tracking').insert({
          user_id: driver.driver_id,
          latitude: baseLatitudes[i],
          longitude: baseLongitudes[i],
          accuracy: 10,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Crear 11 estudiantes
    const estudiantes = [
      { code: 'EST-001', firstName: 'Ana', lastName: 'García', grade: '5to' },
      { code: 'EST-002', firstName: 'Carlos', lastName: 'Martínez', grade: '6to' },
      { code: 'EST-003', firstName: 'Laura', lastName: 'López', grade: '4to' },
      { code: 'EST-004', firstName: 'Diego', lastName: 'Rodríguez', grade: '5to' },
      { code: 'EST-005', firstName: 'María', lastName: 'Hernández', grade: '3ro' },
      { code: 'EST-006', firstName: 'Pedro', lastName: 'González', grade: '6to' },
      { code: 'EST-007', firstName: 'Sofía', lastName: 'Pérez', grade: '4to' },
      { code: 'EST-008', firstName: 'Luis', lastName: 'Sánchez', grade: '5to' },
      { code: 'EST-009', firstName: 'Carmen', lastName: 'Ramírez', grade: '3ro' },
      { code: 'EST-010', firstName: 'Jorge', lastName: 'Torres', grade: '6to' },
      { code: 'EST-011', firstName: 'Isabel', lastName: 'Flores', grade: '4to' },
    ]

    // Obtener las rutas activas
    const { data: routes } = await supabaseAdmin
      .from('routes')
      .select('id')
      .eq('status', 'active')
      .limit(3)

    const estudiantesCreados = []
    for (let i = 0; i < estudiantes.length; i++) {
      const estudiante = estudiantes[i]
      
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          student_code: estudiante.code,
          first_name: estudiante.firstName,
          last_name: estudiante.lastName,
          grade: estudiante.grade,
          status: 'active',
          phone: `555-010${i}`,
          address: `Calle ${i + 1}, Col. Centro`,
          emergency_contact: `Padre ${i + 1}`,
          emergency_phone: `555-020${i}`
        })
        .select()
        .single()

      if (studentError) {
        console.error(`Error creating student ${estudiante.code}:`, studentError)
        continue
      }

      if (studentData && routes && routes.length > 0) {
        // Asignar estudiante a una ruta (distribuir entre las 3 rutas)
        const routeIndex = i % routes.length
        await supabaseAdmin.from('student_routes').insert({
          student_id: studentData.id,
          route_id: routes[routeIndex].id,
          pickup_location: `Parada ${i + 1}`
        })

        estudiantesCreados.push(estudiante.code)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Datos creados exitosamente',
        usuarios: usuariosCreados,
        conductores: conductoresCreados,
        estudiantes: estudiantesCreados
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
