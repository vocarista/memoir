import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import AWS from 'aws-sdk';
import pool from "@/lib/db";

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

export async function DELETE(req: NextRequest) {
    const session = await getServerSession();
    let connection;
    if(!session) {
        return NextResponse.json({
            message: "Unauthorized",
            status: 401
        })
    }
    try {
        const email = session.user?.email;
        const body = await req.json();
        const key = body.key;
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key
        }

        await s3.deleteObject(params).promise();

        try {
            connection = await pool.connect();
            await connection.query('DELETE FROM images WHERE uuid = $1', [key.split(".")[0]]);

            return NextResponse.json({
                message: "image deleted successfully",
                status: 200
            });
        } catch(error) {
            console.error("There was a problem deleting from the database: ", error);
        } finally {
            connection?.release();
        }
    } catch(error) {
        console.error("There was a problem deleting from the S3 Bucket: ", error);
    }
}