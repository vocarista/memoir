import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import AWS from 'aws-sdk';
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

export async function POST(req: NextRequest) {
    const session = await getServerSession();
    let connection;
    if(!session || !session.user) {
        return NextResponse.json({
            message: "Unauthorized",
            status: 401
        })
    }
    const email = session.user.email;
    try {
        const data = await req.formData();
        const file: File | null = data.get("image") as File;
        if(!file) {
            return NextResponse.json({
                message: "No file uploaded",
                status: 400
            });
        }
        const fileBuffer = Buffer.from(await file?.arrayBuffer());
        const fileType = file.type;
        const fileExtension = fileType.split("/")[1];
        const fileName = `${uuidv4()}.${fileExtension}`;

        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileName,
            Body: fileBuffer,
            ContentType: fileType,
        }

        await s3.upload(s3Params).promise();

        try {
            connection = await pool.connect();
            await connection.query("INSERT INTO images (uuid, user_email, type) VALUES($1, $2, $3)", [fileName.split(".")[0], email, fileExtension]);
        } catch(error) {
            console.error("Error occured while inserting image in table: ", error);
            throw new Error("database error")
        } finally {
            connection?.release()
        }

        return NextResponse.json({
            message: "uploaded successfully",
            status: 200
        });
    } catch(error) {
        console.error("Error encountered while uploading to S3: ", error);
    }
}