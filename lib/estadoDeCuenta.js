// Mantiene el estado de cuenta del paciente (PatientU.estadoDeCuenta) en
// sincronía con sus citas. Cada cargo guarda el _id de su cita (dateId), así
// que al editar o borrar la cita se actualiza o elimina su cargo. Antes el
// navegador agregaba el cargo por su cuenta al crear la cita y nada lo
// tocaba después: las citas borradas se seguían cobrando y los cambios de
// costo no se reflejaban.
import PatientU from "@/models/PatientU";

const idOf = (v) => (v?._id || v)?.toString();

// La deuda siempre se recalcula desde cero (cargos - pagos) en vez de
// sumar/restar sobre el total anterior, para que no se descuadre.
export function recalcularTotal(estado) {
  const cargos = (estado.citas || []).reduce((s, c) => s + (Number(c.costo) || 0), 0);
  const pagos = (estado.pagos || []).reduce((s, p) => s + (Number(p.cantidad) || 0), 0);
  estado.total = cargos - pagos;
}

function cargoDeCita(cita) {
  return {
    dateId: cita._id,
    fecha: cita.start,
    costo: Number(cita.cost) || 0,
  };
}

// Agrupa citas por paciente (_id de UserTrue).
function porPaciente(citas) {
  const grupos = new Map();
  for (const cita of citas) {
    const pid = idOf(cita.patient);
    if (!pid) continue;
    if (!grupos.has(pid)) grupos.set(pid, []);
    grupos.get(pid).push(cita);
  }
  return grupos;
}

async function conPerfil(patientUserId, fn) {
  const perfil = await PatientU.findOne({ userId: patientUserId });
  if (!perfil) return; // El paciente no tiene perfil: no hay estado de cuenta que tocar.
  if (!perfil.estadoDeCuenta) perfil.estadoDeCuenta = {};
  fn(perfil.estadoDeCuenta);
  recalcularTotal(perfil.estadoDeCuenta);
  perfil.markModified("estadoDeCuenta");
  await perfil.save();
}

export async function agregarCargos(citas) {
  for (const [pid, grupo] of porPaciente(citas)) {
    await conPerfil(pid, (estado) => {
      estado.citas = estado.citas || [];
      for (const cita of grupo) estado.citas.push(cargoDeCita(cita));
    });
  }
}

export async function quitarCargos(citas) {
  for (const [pid, grupo] of porPaciente(citas)) {
    const ids = new Set(grupo.map((c) => idOf(c._id)));
    await conPerfil(pid, (estado) => {
      estado.citas = (estado.citas || []).filter((c) => !ids.has(idOf(c.dateId)));
    });
  }
}

// `antes` y `despues` son la misma cita antes y después de editarla.
export async function actualizarCargo(antes, despues) {
  const pidAntes = idOf(antes.patient);
  const pidDespues = idOf(despues.patient);

  if (pidAntes !== pidDespues) {
    await quitarCargos([antes]);
    await agregarCargos([despues]);
    return;
  }

  await conPerfil(pidDespues, (estado) => {
    estado.citas = estado.citas || [];
    const cargo = estado.citas.find((c) => idOf(c.dateId) === idOf(despues._id));
    if (cargo) {
      cargo.fecha = despues.start;
      cargo.costo = Number(despues.cost) || 0;
    } else {
      estado.citas.push(cargoDeCita(despues));
    }
  });
}
