const {S3Client, PutObjectCommand, GetObjectCommand} = require("@aws-sdk/client-s3");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
// const probe = require('probe-image-size');
const sharp = require('sharp');

const s3Client = new S3Client();
const sesClient = new SESClient();

const createSendEmailCommand = (toAddress, fromAddress, imageUrl) => {
    return new SendEmailCommand({
        Destination: {
            CcAddresses: [],
            ToAddresses: [toAddress,],
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: `Your image has been compressed!. You can access it here: ${imageUrl}`,
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Image compressed!",
            },
        },
        Source: fromAddress,
        ReplyToAddresses: [],
    });
};

const handler = async (event) => {
    try {
        // Get the S3 bucket and object key from the event
        const bucket = event.Records[0].s3.bucket.name;
        const key = event.Records[0].s3.object.key;

        // Probe the image size
        const params = {
            Bucket: bucket,
            Key: key,
        };

        const { ContentLength, Metadata, Body } = await s3Client.send(new GetObjectCommand(params));
        // const { width, height, mime } = await probe(`https://${bucket}.s3.amazonaws.com/${key}`);

        // Log the image information
        // console.log("Image information:", { width, height, mime, size: ContentLength });

        const compressedImage = await sharp(await Body.transformToByteArray())
            .resize(800) // Resize the image to a width of 800px (you can adjust this as needed)
            .jpeg({ quality: 80 }) // Set JPEG quality to 80% (you can adjust this as needed)
            .toBuffer();

        // Upload the compressed image to the new S3 bucket
        const newBucket = 'ulb-cc-grp11-result';
        const newKey = `${key.split('.')[0]}_compressed.jpg`; // Change the file extension if needed

        const putObjectParams = {
            Bucket: newBucket,
            Key: newKey,
            Body: compressedImage,
        };

        // TODO: get the link of the uploaded image
        await s3Client.send(new PutObjectCommand(putObjectParams));
        const compressedImgUrl = `https://${newBucket}.s3.amazonaws.com/${newKey}`;

        console.log("MetaData", Metadata);

        // get the email of the user from the MetaData
        const email = Metadata['email'];
        console.log("Email:", email);

        // TODO: well here send an email? later hand it to another lambda function
        //  that gets triggered when an image is uploaded to the new bucket.

        if (email) {
            try {
                const sendEmailCommand = createSendEmailCommand(email, 'imagecompressor@example.com', compressedImgUrl);
                await sesClient.send(sendEmailCommand);
            } catch (error) {
                console.error('Error sending email:', error);
            }
        }

        // Log the uploaded object data
        console.log("Uploaded compressed image:", { bucket: newBucket, key: newKey });
    } catch (error) {
        console.error('Error:', error);
    }
};

exports.default = handler;
