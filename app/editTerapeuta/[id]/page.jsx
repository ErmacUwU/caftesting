import ActualizarTerapeuta from "@/app/components/ActualizarTerapeuta";

const getTherapistById = async (id) => {
  try {
    const res = await fetch(`http://localhost:3000/api/therapist/${id}`, {
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

export default async function updateTherapist({ params }) {
  const { id } = params;
  const { therapist } = await getTherapistById(id);
  const {
    firstName,
    lastName,
    email,
    phone,
    specialization,
    address,
    city,
    country,
  } = therapist;

  return (
    <ActualizarTerapeuta id={id} firstName ={ firstName} lastName = {lastName} email = {email}
    phone = {phone} specialization = {specialization} address = {address} city = {city}
    country ={country}  />
  );
}
