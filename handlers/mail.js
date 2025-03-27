const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const { convert } = require('html-to-text');
const { promisify } = require('es6-promisify');

const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
    process.env.MAIL_MAILJET_KEY,
    process.env.MAIL_MAILJET_SECRET,
);

const generateHTML = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
    const inlined = juice(html);
    return inlined;
};

exports.send = async (options) => {
    const html = generateHTML(options.filename, options);
    const text = convert(html, {});

    try {
        const request = mailjet.post('send', { version: 'v3.1' }).request({
            "Messages":[
                {
                    "From": {
                        // "Email": "ardiansallauka@gmail.com",
                        "Email": "noreply@albsmart.com",
                        "Name": "NoReply ALBSMART"
                    },
                    "To": [
                        {
                            "Email": options.user.email,
                            "Name": options.user.email.split('@')[0]
                        }
                    ],
                    "Subject": options.subject,
                    "TextPart": text,
                    "HTMLPart": html,
                    "CustomID": "ALBSMARTGettingStarted"
                }
            ]
        });
    
        const response = await request;
        return response;
        // Output should contain information about the sent email
    } catch (error) {
        console.error('Error sending email:', error.statusCode, error.message);
    }
};