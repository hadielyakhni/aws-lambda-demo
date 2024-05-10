const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
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

const notifier = async (event) => {
    try {
        const bucket = event.Records[0].s3.bucket.name;
        const key = event.Records[0].s3.object.key;

        const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
        const { Metadata } = await s3Client.send(headCommand);

        const imgUrl = `https://${bucket}.s3.amazonaws.com/${key}`;

        const email = Metadata['email'];
        if (email) {
            try {
                const sendEmailCommand = createSendEmailCommand(email, 'imagecompressor@example.com', imgUrl);
                await sesClient.send(sendEmailCommand);
            } catch (error) {
                console.error('Error sending email:', error);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

exports.default = notifier;
