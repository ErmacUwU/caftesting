export default function generateBirthdate(minAge, maxAge) {

    const today = new Date();

    const age =
        Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;

    const birth = new Date(
        today.getFullYear() - age,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
    );

    return birth.toISOString().split("T")[0];

}