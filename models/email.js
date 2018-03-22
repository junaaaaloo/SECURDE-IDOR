var nodemailer = require('nodemailer');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dlsucso.apsdashboard@gmail.com',
        pass: 'dlsuapscso'
    }
});

exports.sendMail = function sendEmail (mailOptions) {  
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}