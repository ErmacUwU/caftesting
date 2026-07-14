import { fakerES_MX } from "@faker-js/faker";
import { phonePrefixes } from "./bajaCalifornia.js";

export default function generatePhone() {

    const prefix =
        phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)];

    const suffix = fakerES_MX.string.numeric(7);

    return `${prefix}${suffix}`;
}