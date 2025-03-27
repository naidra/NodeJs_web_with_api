const cloudinary = require('cloudinary');
let streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLAUDINARY_CLOUD_NAME,
    api_key: process.env.CLAUDINARY_API_KEY,
    api_secret: process.env.CLAUDINARY_API_SECRET
});

exports.uploads = (file, folder) => {
    return new Promise(resolve => {
        cloudinary.uploader.upload(file, result => {
            resolve({
                url: result.url,
                id: result.public_id
            });
        }, {
            resource_type: 'auto',
            folder: folder
        });
    });
};

exports.uploadBuffer = async (buffer) => {
    return new Promise(resolve => {
        streamifier.createReadStream(buffer).pipe(cloudinary.v2.uploader.upload_stream({folder: "Images"}, function (error, result) {     
            resolve({ public_id: result.public_id, url: result.secure_url });         
        }));
    });
};

exports.deleteImage = async (imagePublicId) => {
    return new Promise(resolve => {
        cloudinary.v2.api.delete_resources(imagePublicId, function(error, result){
            if (error) return resolve(error);
            resolve(result);
        });
    });
};