import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import AWS from 'aws-sdk';
import pool from "@/lib/db";

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

export async function GET(req: NextRequest) {
    const session = await getServerSession();
    let connection;
    if(!session) {
        return NextResponse.json({
            message: "Unauthorized",
            status: 401
        })
    }
    const email = session.user?.email;
    try{
        connection = await pool.connect();
        const query = `
        SELECT i.uuid, i.type
        FROM images i
        JOIN users u ON u.email = i.user_email
        WHERE u.email = $1
        `;
        const { rows: userImages } = await connection.query(query, [email]);
        if(!userImages.length) {
            return NextResponse.json([]);
        }
        let imageUrls;
        try {
            imageUrls = await Promise.all(
                userImages.map(async (image) => {
                    const signedUrl = s3.getSignedUrl('getObject', {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: image.uuid + "." + image.type,
                        Expires: 3600
                    });
                    return {
                        key: image.uuid + "." + image.type,
                        url: signedUrl
                    }
                })
            )
        } catch(error) {
            console.error("Error while getting signed Urls: ", error)
        }
        return NextResponse.json(imageUrls);
    } catch(error) {
        console.error("error while querying database to obtain user images: ", error);
    } finally {
        connection?.release();
    }
}