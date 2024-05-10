const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require('sharp');

const s3Client = new S3Client();

const compressor = async (event) => {
    try {
        const bucket = event.Records[0].s3.bucket.name;
        const key = event.Records[0].s3.object.key;

        const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
        const { Body, Metadata } = await s3Client.send(getCommand);
        
        const compressedImage = await sharp(await Body.transformToByteArray())
            .resize(800).jpeg({ quality: 80 }).toBuffer();

        const RESULT_BUCKET = 'ulb-cc-grp11-result';
        const compressedImgKey = `${key.split('.')[0]}_compressed.jpg`;

        await s3Client.send(new PutObjectCommand({ 
            Bucket: RESULT_BUCKET, 
            Key: compressedImgKey, 
            Body: compressedImage, 
            Metadata: { email: Metadata.email } 
        }));

    } catch (error) {
        console.error('Error:', error);
    }
};

exports.default = compressor;
