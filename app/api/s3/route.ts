import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";


const s3Client = new S3Client(
    {
        region: process.env.AWS_BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
        }
    }
) 

const bucketName = process.env.AWS_BUCKET_NAME;

export async function POST(req:NextRequest) {
    const formData = await req.formData();
    const doc = formData.get("document");

    if (doc && typeof doc === "object" && doc.name){
        const Body = (await doc.arrayBuffer()) as Buffer;
        const params = {
            Bucket: bucketName,
            Key: doc.name,
            Body,
            ContentType: doc.type,
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);


        const getObjectParams = {
            Bucket: bucketName,
            Key: doc.name,
            ACL: "private",
        };

        const getCommand = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3Client,getCommand,{
            expiresIn:50000,
        });
        return NextResponse.json({
            success:true,
            message: "Archivo subido con Exito!",
            data: {
                url,
            },
        });
    }

    return NextResponse.json({
        success:false,
        message: "Error en la carga del archivo",
        data: null,
    });

    


}