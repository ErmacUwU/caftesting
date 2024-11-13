
/**
 * API de Gestión de Archivos en S3
 * 
 * Esta API permite subir, listar y eliminar archivos en un bucket de S3 utilizando AWS SDK.
 * Las operaciones están definidas según el método HTTP utilizado en la solicitud:
 * 
 * - `POST`: Genera una URL firmada para subir un archivo a S3.
 * - `GET`: Lista todos los archivos en el bucket de S3 (si el parámetro `list` está presente en la consulta).
 * - `DELETE`: Elimina un archivo específico en el bucket de S3.
 * 
 * Funciones:
 * 
 * - `handler`: Función principal de manejo de solicitudes. Determina la operación a realizar según el método HTTP
 *   y llama a la función correspondiente (`uploadFile`, `listFiles`, o `deleteFile`). Si el método no está soportado,
 *   responde con un error 405 (Método no permitido).
 * 
 * - `listFiles`: Lista todos los archivos en el bucket de S3 utilizando el comando `ListObjectsV2Command`.
 *   Convierte la respuesta en un arreglo de objetos que contiene el nombre y la fecha de última modificación de cada archivo.
 *   Responde con un JSON que contiene la lista de archivos (`files`) en caso de éxito, o un mensaje de error en caso de fallo.
 * 
 * - `uploadFile`: Genera una URL firmada para permitir la carga de un archivo en S3. Recibe el nombre (`name`) y el tipo de
 *   contenido (`type`) del archivo desde el cuerpo de la solicitud. Usa `getSignedUrl` para crear una URL temporal válida por
 *   3600 segundos. Responde con un JSON que contiene la URL firmada (`url`) para subir el archivo o un mensaje de error en caso de fallo.
 * 
 * - `deleteFile`: Elimina un archivo específico en el bucket de S3 usando el comando `DeleteObjectCommand`.
 *   Recibe el nombre del archivo a eliminar (`fileName`) como parámetro de la solicitud. Responde con un mensaje de confirmación
 *   en caso de éxito o un mensaje de error en caso de fallo.
 * 
 * Configuración:
 * - `s3Client`: Cliente de S3 configurado con la región y las credenciales proporcionadas en las variables de entorno (`AWS_BUCKET_REGION`,
 *   `AWS_ACCESS_KEY`, y `AWS_SECRET_KEY`).
 * - `bucketName`: Nombre del bucket de S3, configurado mediante la variable de entorno `AWS_BUCKET_NAME`.
 * 
 * Uso:
 * Esta API es ideal para gestionar archivos en S3, permitiendo subirlos, eliminarlos y listar los archivos existentes en el bucket
 * de forma segura mediante URLs firmadas para la carga.
 */


import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

const bucketName = process.env.AWS_BUCKET_NAME;

export default async function handler(req, res) {
    const { method } = req;

    switch (method) {
        case "POST":
            return await uploadFile(req, res);
        case "GET":
            if (req.query.list) {
                return await listFiles(req, res);
            }
            break;
        case "DELETE":
            return await deleteFile(req, res);
        default:
            res.setHeader("Allow", ["POST", "GET", "DELETE"]);
            res.status(405).end(`Método ${method} no permitido`);
    }
}

// Lista todos los archivos en el bucket
async function listFiles(req, res) {
    try {
        const command = new ListObjectsV2Command({ Bucket: bucketName });
        const data = await s3Client.send(command);

        const files = data.Contents ? data.Contents.map((file) => ({
            name: file.Key,
            lastModified: file.LastModified,
        })) : [];

        res.status(200).json({ files });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al listar los archivos" });
    }
}

// Genera una URL firmada para subir un archivo
async function uploadFile(req, res) {
    const { name, type } = req.body;

    const params = {
        Bucket: bucketName,
        Key: name,
        ContentType: type,
    };

    try {
        const command = new PutObjectCommand(params);
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        res.status(200).json({ url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener la URL firmada" });
    }
}

// Elimina un archivo en S3
async function deleteFile(req, res) {
    const { fileName } = req.query;

    const params = {
        Bucket: bucketName,
        Key: fileName,
    };

    try {
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
        res.status(200).json({ message: "Archivo eliminado con éxito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el archivo" });
    }
}
