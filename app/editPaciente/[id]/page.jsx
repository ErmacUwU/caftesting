import ActualizarPaciente from "@/app/components/ActualizarPaciente";


const getPatientById = async (id) => {
  try {
    const res = await fetch(`http://localhost:3000/api/patient/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch topic");
    }

    return res.json();
  } catch (error) {
    console.log(error);
  }
};

export default async function updatePatient({ params }) {
  const { id } = params;
  const { patient } = await getPatientById(id);
  const {
    firstName,
    lastName,
    birthdate,
    gender,
    patientStatus,
    birthCity,
    nationality,
    birthState,
    idType,
    contacts
  } = patient;

  return (
    <ActualizarPaciente
    id={id}
    firstName={firstName}
    lastName={lastName}
    birthdate={birthdate}
    gender={gender}
    patientStatus={patientStatus}
    birthCity={birthCity}
    nationality={nationality}
    birthState={birthState}
    idType={idType}
    contacts={contacts}
    />
  );
}
