import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ["image/jpeg", "image/png"];
  if(allowedFileTypes.includes(file.mimetype)){
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only JPEG and PNG types are allowed"), false);
  }
}

export const upload = multer({ 
  storage,
  fileFilter
})